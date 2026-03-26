"""
GramSeva Health — Skin Disease Detection FastAPI Server
========================================================
Start:  uvicorn skin_server:app --reload --port 8001

Endpoints:
  POST /api/skin-detect       → Image classification (< 2s)
  GET  /api/skin-report/{d}   → Detailed AI report via Gemini (cached)
  GET  /api/skin-health       → Server health check
"""

import json
import os
import io
import sys
import time as _time
import logging

import numpy as np
import joblib
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── LOAD .env ────────────────────────────────────────────────────────────────
def _load_dotenv():
    for env_path in [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
    ]:
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())

_load_dotenv()

# ─── LOGGING ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("gramseva-skin")

# ─── PATHS ────────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
CNN_PATH      = os.path.join(BASE_DIR, "skin_cnn.pt")          # CNN TorchScript model
SKL_PATH      = os.path.join(BASE_DIR, "skin_model.pkl")        # sklearn fallback
LE_PATH       = os.path.join(BASE_DIR, "skin_label_encoder.pkl")
CLASSES_PATH  = os.path.join(BASE_DIR, "skin_classes.json")
METRICS_PATH  = os.path.join(BASE_DIR, "skin_metrics.json")

# ─── LOAD MODEL ──────────────────────────────────────────────────────────────
print("\n" + "=" * 55)
print("  GramSeva Skin Detection Server — Loading Model...")
print("=" * 55)

MODEL_LOADED = False
MODEL_TYPE   = "none"     # "cnn" | "sklearn"
cnn_model    = None
pipeline     = None
le           = None
CLASS_NAMES  = []
model_metrics = None

# ── Try CNN (TorchScript) first ─────────────────────────────────────────────
try:
    import torch
    import torch.nn.functional as F
    from torchvision import transforms as T

    IMAGENET_MEAN = [0.485, 0.456, 0.406]
    IMAGENET_STD  = [0.229, 0.224, 0.225]
    CNN_IMG_SIZE  = 224

    _cnn_transform = T.Compose([
        T.Resize((CNN_IMG_SIZE, CNN_IMG_SIZE)),
        T.ToTensor(),
        T.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])

    _DEVICE = (
        torch.device("mps") if torch.backends.mps.is_available()
        else torch.device("cuda") if torch.cuda.is_available()
        else torch.device("cpu")
    )

    if not os.path.exists(CNN_PATH):
        raise FileNotFoundError("skin_cnn.pt not found — will try sklearn fallback.")

    cnn_model = torch.jit.load(CNN_PATH, map_location=_DEVICE)
    cnn_model.eval()

    with open(CLASSES_PATH) as f:
        CLASS_NAMES = json.load(f)
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH) as f:
            model_metrics = json.load(f)

    MODEL_LOADED = True
    MODEL_TYPE   = "cnn"
    acc = (model_metrics or {}).get("test_accuracy", 0)
    print(f"✅ CNN model ready ({len(CLASS_NAMES)} classes, acc={acc*100:.1f}%, device={_DEVICE})")

except FileNotFoundError as e:
    print(f"⚠️  {e}")
except Exception as e:
    print(f"⚠️  CNN load failed: {e}")

# ── Fallback: sklearn pipeline ───────────────────────────────────────────────
if not MODEL_LOADED:
    try:
        if not os.path.exists(SKL_PATH):
            raise FileNotFoundError("skin_model.pkl not found. Run: python train_skin_model.py first.")

        pipeline = joblib.load(SKL_PATH)
        le       = joblib.load(LE_PATH)
        with open(CLASSES_PATH) as f:
            CLASS_NAMES = json.load(f)
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH) as f:
                model_metrics = json.load(f)

        MODEL_LOADED = True
        MODEL_TYPE   = "sklearn"
        print(f"✅ sklearn fallback ready — {len(CLASS_NAMES)} classes")

    except FileNotFoundError as e:
        print(f"\n⚠️  WARNING: {e}")
        print("   Server will start but /api/skin-detect will return 503.\n")
    except Exception as e:
        print(f"\n❌ ERROR loading model: {e}")
        print("   Run `python train_cnn_model.py` to generate the CNN model.\n")

# ─── SPECIALIST MAPPING ──────────────────────────────────────────────────────
SPECIALIST_MAP = {
    "Acitinic Keratosis":          "Dermatologist / Oncologist",
    "Basal Cell Carcinoma":        "Dermatologist / Oncologist",
    "Dermatofibroma":              "Dermatologist",
    "Melanoma":                    "Dermatologist / Oncologist",
    "Nevus":                       "Dermatologist",
    "Pigmented Benign Keratosis":  "Dermatologist",
    "Seborrheic Keratosis":        "Dermatologist",
    "Squamous Cell Carcinoma":     "Dermatologist / Oncologist",
    "Vascular Lesion":             "Dermatologist / Vascular Surgeon",
}

URGENCY_MAP = {
    "Acitinic Keratosis":          "high",
    "Basal Cell Carcinoma":        "high",
    "Dermatofibroma":              "low",
    "Melanoma":                    "critical",
    "Nevus":                       "low",
    "Pigmented Benign Keratosis":  "low",
    "Seborrheic Keratosis":        "low",
    "Squamous Cell Carcinoma":     "high",
    "Vascular Lesion":             "medium",
}

# ─── GEMINI INTEGRATION (DEDICATED KEY) ──────────────────────────────────────
GEMINI_SKIN_API_KEY = os.getenv("GEMINI_SKIN_API_KEY", "")
GEMINI_LOADED = False
gemini_model = None

try:
    import google.generativeai as genai
    if GEMINI_SKIN_API_KEY:
        genai.configure(api_key=GEMINI_SKIN_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-2.0-flash")
        GEMINI_LOADED = True
        print("✅ Gemini API connected (dedicated skin key)")
    else:
        print("⚠️  GEMINI_SKIN_API_KEY not set — reports will use fallback text")
except ImportError:
    print("⚠️  google-generativeai not installed — run: pip install google-generativeai")

# ─── REPORT CACHE ────────────────────────────────────────────────────────────
_report_cache = {}

def get_skin_report(disease: str) -> dict:
    """Generate a skin disease report using Gemini with retry + cache."""
    if disease in _report_cache:
        log.info(f"Cache hit for '{disease}'")
        return _report_cache[disease]

    prompt = f"""You are a medical information assistant.

Provide concise structured information about: {disease}

Rules:
- Maximum 220 words.
- Use simple language.
- Short bullet points only.
- No repetition.
- No medical jargon.
- Add one-line disclaimer at end.

Format:

Name:
Definition:
Causes:
Risk Factors:
Symptoms:
Diagnosis:
Treatment:
Complications:
Prevention:
Prognosis:

Be concise and structured.
"""

    fallback = {
        "detailed_report": f"# {disease}\n\nAI report service is currently unavailable. Please consult a dermatologist for proper diagnosis.",
        "source": "fallback",
    }

    if not GEMINI_LOADED:
        return fallback

    def get_text(resp):
        try:
            return resp.text.strip()
        except Exception:
            pass
        try:
            if resp.candidates and resp.candidates[0].content and resp.candidates[0].content.parts:
                return resp.candidates[0].content.parts[0].text.strip()
        except Exception:
            pass
        return ""

    report_text = ""
    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            log.info(f"[Attempt {attempt}/{max_retries}] Generating skin report for: {disease}")
            resp = gemini_model.generate_content(prompt)
            report_text = get_text(resp)
            if report_text:
                log.info(f"Report generated ({len(report_text)} chars)")
                break
            else:
                log.warning(f"[Attempt {attempt}] Empty response")
        except Exception as e:
            error_str = str(e).lower()
            log.warning(f"[Attempt {attempt}] Failed: {type(e).__name__}: {e}")
            if "429" in str(e) or "rate" in error_str or "quota" in error_str or "resource" in error_str:
                wait = attempt * 4
                log.info(f"Rate limited. Retrying in {wait}s...")
                _time.sleep(wait)
            elif attempt < max_retries:
                wait = attempt * 3
                log.info(f"Retrying in {wait}s...")
                _time.sleep(wait)

    if not report_text:
        log.error(f"All {max_retries} attempts failed for {disease}")
        return fallback

    result = {"detailed_report": report_text, "source": "gemini"}
    _report_cache[disease] = result
    log.info(f"Cached report for '{disease}'")
    return result


# ─── IMAGE PREPROCESSING ────────────────────────────────────────────────────
def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Preprocess image for sklearn inference (128×128 flat feature vector)."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((128, 128), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0

    features = []
    features.extend(arr.flatten())
    for c in range(3):
        channel = arr[:, :, c]
        features.append(channel.mean())
        features.append(channel.std())
        features.append(np.median(channel))
    for c in range(3):
        hist, _ = np.histogram(arr[:, :, c], bins=16, range=(0, 1))
        features.extend(hist / (hist.sum() + 1e-8))
    return np.array(features, dtype=np.float32).reshape(1, -1)


def predict_image(image_bytes: bytes) -> tuple[str, float, list]:
    """
    Returns (disease_name, confidence, all_predictions_list).
    Uses CNN if available, falls back to sklearn.
    """
    if MODEL_TYPE == "cnn":
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = _cnn_transform(img).unsqueeze(0).to(_DEVICE)
        with torch.no_grad():
            logits = cnn_model(tensor)
            probs  = F.softmax(logits, dim=1)[0].cpu().numpy()
        top_idx = int(np.argmax(probs))
        predicted_disease = CLASS_NAMES[top_idx]
        confidence = round(float(probs[top_idx]), 4)
        all_preds = [
            {"disease": CLASS_NAMES[i], "confidence": round(float(probs[i]), 4)}
            for i in np.argsort(probs)[::-1]
        ]
        return predicted_disease, confidence, all_preds
    else:
        processed = preprocess_image(image_bytes)
        probas = pipeline.predict_proba(processed)[0]
        top_idx = int(np.argmax(probas))
        predicted_disease = le.inverse_transform([top_idx])[0]
        confidence = round(float(probas[top_idx]), 4)
        all_preds = [
            {"disease": le.inverse_transform([i])[0], "confidence": round(float(probas[i]), 4)}
            for i in np.argsort(probas)[::-1]
        ]
        return predicted_disease, confidence, all_preds


# ─── FASTAPI APP ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="GramSeva Skin Detection",
    description="Image-based skin disease classification using PCA + RandomForest + Gemini",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── SCHEMAS ──────────────────────────────────────────────────────────────────
class SkinDetectResponse(BaseModel):
    disease: str
    confidence: float
    specialist: str
    urgency: str
    all_predictions: list

class SkinReportResponse(BaseModel):
    disease: str
    detailed_report: str

# ─── ENDPOINTS ────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "GramSeva Skin Detection Server is running 🔬",
        "model_loaded": MODEL_LOADED,
        "gemini_loaded": GEMINI_LOADED,
        "version": "1.0.0",
    }

@app.get("/api/skin-health")
def health():
    return {
        "status":       "ok",
        "model_loaded": MODEL_LOADED,
        "model_type":   MODEL_TYPE,
        "gemini_loaded":GEMINI_LOADED,
        "classes":      CLASS_NAMES,
        "num_classes":  len(CLASS_NAMES),
        "test_accuracy": model_metrics.get("test_accuracy") if model_metrics else None,
    }


@app.post("/api/skin-detect", response_model=SkinDetectResponse)
async def detect_skin_disease(image: UploadFile = File(...)):
    """Classify a skin image."""
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model not loaded. Run: python train_cnn_model.py")

    content_type = image.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"Expected image file, got {content_type}")

    try:
        image_bytes = await image.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")

        predicted_disease, confidence, all_preds = predict_image(image_bytes)

        specialist = SPECIALIST_MAP.get(predicted_disease, "Dermatologist")
        urgency    = URGENCY_MAP.get(predicted_disease, "medium")

        log.info(f"[{MODEL_TYPE.upper()}] Predicted: {predicted_disease} ({confidence:.1%})")

        return SkinDetectResponse(
            disease=predicted_disease,
            confidence=confidence,
            specialist=specialist,
            urgency=urgency,
            all_predictions=all_preds,
        )

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/api/skin-report/{disease}", response_model=SkinReportResponse)
def skin_report(disease: str):
    """Lazy-loaded detailed AI report."""
    log.info(f"Report requested for: {disease}")
    result = get_skin_report(disease)
    return SkinReportResponse(
        disease=disease,
        detailed_report=result.get("detailed_report", f"# {disease}\n\nReport unavailable."),
    )


# ─── RUN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("skin_server:app", host="0.0.0.0", port=8001, reload=True)
