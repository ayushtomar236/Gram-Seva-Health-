"""
GramSeva Health — AI Triage FastAPI Server
==========================================
Start:  uvicorn server:app --reload --port 8000

Endpoints:
  POST /api/triage           → Fast ML prediction (< 1s)
  GET  /api/report/{disease} → Detailed AI medical report (lazy-loaded)
  GET  /api/health           → Server health check
  GET  /api/symptoms         → List of all known symptoms
  GET  /api/model-info       → Model statistics
"""

import json
import os
import re
import sys
import logging
import time as _time

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── LOAD .env FILE (so we don't need manual env vars) ───────────────────────
def _load_dotenv():
    """Load key=value pairs from .env files (project root first, then ai-models dir)."""
    for env_path in [
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

# ─── LOGGING ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("gramseva")

# ─── PATHS ────────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH   = os.path.join(BASE_DIR, "triage_model.pkl")
LE_PATH      = os.path.join(BASE_DIR, "label_encoder.pkl")
COLS_PATH    = os.path.join(BASE_DIR, "symptom_columns.json")
MAP_PATH     = os.path.join(BASE_DIR, "specialist_map.json")
METRICS_PATH = os.path.join(BASE_DIR, "model_metrics.json")

# ─── LOAD MODEL (SAFE) ───────────────────────────────────────────────────────
print("\n" + "=" * 55)
print("  GramSeva AI Triage Server — Loading Model...")
print("=" * 55)

MODEL_LOADED = False
model = le = SYMPTOM_COLUMNS = SPECIALIST_MAP = model_metrics = None

try:
    for path, label in [
        (MODEL_PATH,   "triage_model.pkl"),
        (LE_PATH,      "label_encoder.pkl"),
        (COLS_PATH,    "symptom_columns.json"),
        (MAP_PATH,     "specialist_map.json"),
    ]:
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"{label} not found. Run: python train_model.py first."
            )

    model   = joblib.load(MODEL_PATH)
    le      = joblib.load(LE_PATH)
    with open(COLS_PATH)  as f: SYMPTOM_COLUMNS = json.load(f)
    with open(MAP_PATH)   as f: SPECIALIST_MAP   = json.load(f)

    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH) as f: model_metrics = json.load(f)

    MODEL_LOADED = True
    print(f"✅ Model ready — {len(SYMPTOM_COLUMNS)} symptoms, {len(le.classes_)} diseases")
    if model_metrics:
        print(f"   Accuracy: {model_metrics.get('test_accuracy', 'N/A') * 100:.1f}%")

except FileNotFoundError as e:
    print(f"\n⚠️  WARNING: {e}")
    print("   Server will start but /api/triage will return 503 until model is trained.\n")
except Exception as e:
    print(f"\n❌ ERROR loading model: {e}")
    print("   Run `python train_model.py` to generate model files.\n")

# ─── GEMINI INTEGRATION ───────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-flash-latest")
        GEMINI_LOADED = True
        print("✅ Gemini API connected")
    else:
        GEMINI_LOADED = False
        print("⚠️  GEMINI_API_KEY not set — disease descriptions will be skipped")
except ImportError:
    GEMINI_LOADED = False
    print("⚠️  google-generativeai not installed — run: pip install google-generativeai")

# ─── EMERGENCY SYMPTOMS ───────────────────────────────────────────────────────
EMERGENCY_SYMPTOMS = {
    "chest_pain", "fast_heart_rate", "breathlessness", "palpitations",
    "altered_sensorium", "coma", "loss_of_balance", "weakness_of_one_body_side",
    "slurred_speech", "stomach_bleeding", "blood_in_sputum",
}

URGENCY_MAP = {
    "Heart attack":                 "critical",
    "Paralysis (brain hemorrhage)": "critical",
    "Dengue":                       "high",
    "Malaria":                      "high",
    "Tuberculosis":                 "high",
    "Pneumonia":                    "high",
    "Hepatitis B":                  "high",
    "Hepatitis C":                  "high",
    "AIDS":                         "high",
    "Typhoid":                      "medium",
    "Diabetes":                     "medium",
    "Hypertension":                 "medium",
    "Bronchial Asthma":             "medium",
    "Jaundice":                     "medium",
    "Chicken pox":                  "medium",
    "Migraine":                     "medium",
    "Urinary tract infection":      "medium",
    "GERD":                         "low",
    "Common Cold":                  "low",
    "Acne":                         "low",
    "Fungal infection":             "low",
    "Allergy":                      "low",
    "Psoriasis":                    "low",
    "Impetigo":                     "low",
}

# ─── HINDI SYNONYM MAP ────────────────────────────────────────────────────────
# Maps Hindi/common words → symptom column names from the training data
HINDI_SYNONYMS = {
    "bukhar": "fever",
    "khansi": "cough",
    "sardi":  "chills",
    "ulti":   "vomiting",
    "dast":   "diarrhoea",
    "pet dard": "stomach_pain",
    "sir dard": "headache",
    "chakkar": "dizziness",
    "khujli":  "itching",
    "thakan":  "fatigue",
    "kamar dard": "back_pain",
    "gala dard": "throat_irritation",
    "aankhon mein dard": "pain_behind_the_eyes",
    "naak bund": "congestion",
    "pasina":  "sweating",
    "bhook nahi": "loss_of_appetite",
    "wajan kam": "weight_loss",
    "sans lena mushkil": "breathlessness",
    "seene mein dard": "chest_pain",
    "dil ka dard": "chest_pain",
    "peshab mein jalan": "burning_micturition",
    "naak se khoon": "blood_in_sputum",
    "peeli aankhen": "yellowing_of_eyes",
    "peela peshab": "dark_urine",
}

# ─── TEXT → SYMPTOM VECTOR ───────────────────────────────────────────────────
def text_to_vector(symptom_text: str) -> np.ndarray:
    """Convert free-text symptom description to binary symptom vector."""
    vec = np.zeros(len(SYMPTOM_COLUMNS), dtype=int)
    
    translated_text = symptom_text.lower()
    
    # Use Gemini to extract standard exact SYMPTOM_COLUMNS if loaded
    if GEMINI_LOADED:
        prompt = f"""
        Extract the exact medical symptoms from the following patient description.
        The description might be in Hindi, English, Devanagari script, or Hinglish.
        Translate and map them ONLY to the following exact comma-separated list of allowed symptom names:
        {", ".join(SYMPTOM_COLUMNS)}
        
        Patient description: "{symptom_text}"
        
        Return ONLY a comma-separated list of matching allowed symptom names. Do not include any other text.
        """
        try:
            response = gemini_model.generate_content(prompt)
            if response.text:
                translated_text = response.text.lower()
                log.info(f"Gemini translated symptoms: {translated_text}")
        except Exception as e:
            log.warning(f"Gemini translation failed: {e}")

    # Fallback / process the translated text against columns
    # Apply Hindi synonym substitutions
    for hindi, english in HINDI_SYNONYMS.items():
        if hindi in translated_text:
            translated_text = translated_text.replace(hindi, english)

    # Normalize text
    text_normalized = re.sub(r"[\s\-]+", "_", translated_text)

    for i, col in enumerate(SYMPTOM_COLUMNS):
        col_lower = col.lower().strip()
        # Exact column match
        if col_lower in text_normalized:
            vec[i] = 1
            continue
        # Word-by-word match
        words = [w for w in re.split(r"[_\s]+", col_lower) if len(w) > 3]
        if words and all(w in translated_text for w in words):
            vec[i] = 1

    return vec

# ─── MEDICAL REPORT GENERATION ───────────────────────────────────────────────

# ─── STATIC MEDICAL KNOWLEDGE BASE ──────────────────────────────────────────
# Comprehensive reports for all 41 diseases — works without any API key.
DISEASE_KB: dict[str, dict] = {
    "Fungal infection": {
        "report": """## Fungal Infection

**Definition:** A fungal infection (mycosis) occurs when a harmful fungus invades the body, often affecting the skin, nails, or mucous membranes.

**Causes:**
- Exposure to pathogenic fungi (dermatophytes, Candida, Aspergillus)
- Warm, moist environments
- Contact with infected people, animals, or soil

**Risk Factors:** Weakened immune system, diabetes, antibiotics use, poor hygiene, sweating

**Symptoms:** Itching, skin rash, red/scaly patches, nodal skin eruptions, ring-shaped lesions

**Treatment:**
- Antifungal creams or ointments (clotrimazole, miconazole) for skin infections
- Oral antifungals (fluconazole, itraconazole) for severe cases
- Keep affected area clean and dry

**Prevention:** Keep skin dry, wear breathable clothing, avoid sharing personal items, maintain good hygiene

**Prognosis:** Most fungal infections resolve completely with proper treatment within 2–4 weeks.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Spreading rash", "Signs of secondary bacterial infection", "Fever with skin infection"],
        "advice": "Keep the affected area clean and dry. Avoid scratching. Use prescribed antifungal treatment consistently.",
    },
    "Allergy": {
        "report": """## Allergy

**Definition:** An allergic reaction occurs when the immune system overreacts to a normally harmless substance (allergen), causing inflammatory responses.

**Causes:** Pollen, dust mites, pet dander, certain foods (nuts, shellfish), insect stings, medications, latex

**Risk Factors:** Family history of allergies, asthma, childhood exposure

**Symptoms:** Sneezing, runny nose, itchy eyes, skin hives, swelling, difficulty breathing (in severe cases)

**Treatment:**
- Antihistamines (cetirizine, loratadine) for mild reactions
- Nasal corticosteroids for hay fever
- Epinephrine auto-injector for anaphylaxis
- Allergen immunotherapy (allergy shots) for long-term relief

**Prevention:** Identify and avoid triggers, use air purifiers, keep windows closed during high pollen seasons

**Prognosis:** Allergies are manageable but often chronic. Most people lead normal lives with proper management.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Throat swelling", "Difficulty breathing", "Rapid heartbeat", "Loss of consciousness (anaphylaxis)"],
        "advice": "Identify and avoid your specific allergens. Carry an antihistamine if prescribed by your doctor.",
    },
    "GERD": {
        "report": """## GERD (Gastroesophageal Reflux Disease)

**Definition:** GERD is a chronic digestive condition where stomach acid frequently flows back into the esophagus, irritating its lining.

**Causes:** Weakened lower esophageal sphincter, hiatal hernia, obesity, pregnancy

**Risk Factors:** Obesity, smoking, pregnancy, spicy/fatty foods, coffee, alcohol

**Symptoms:** Heartburn, chest pain, regurgitation, difficulty swallowing, chronic cough, sore throat

**Treatment:**
- Antacids for quick relief
- H2 blockers (ranitidine) or Proton pump inhibitors (omeprazole) for sustained relief
- Lifestyle changes: avoid trigger foods, eat smaller meals, don't lie down after eating
- Surgery (fundoplication) for severe cases

**Prevention:** Maintain healthy weight, avoid trigger foods, quit smoking, elevate bed head

**Prognosis:** Well-managed with medication and lifestyle changes; untreated GERD can lead to complications.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Difficulty swallowing", "Vomiting blood", "Unexplained weight loss", "Severe chest pain"],
        "advice": "Avoid spicy foods, caffeine, and alcohol. Eat smaller meals and don't lie down for 2–3 hours after eating.",
    },
    "Chronic cholestasis": {
        "report": """## Chronic Cholestasis

**Definition:** Cholestasis is a condition where bile cannot flow from the liver to the duodenum, causing bile to build up in the liver.

**Causes:** Liver disease, bile duct obstruction, certain medications, pregnancy

**Symptoms:** Jaundice (yellow skin/eyes), itching, dark urine, pale stools, fatigue

**Treatment:** Treat underlying cause, ursodeoxycholic acid, cholestyramine for itching, vitamin supplements

**Prevention:** Avoid alcohol, maintain liver health, regular liver function tests

**Prognosis:** Depends on underlying cause; early treatment prevents liver damage.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Severe jaundice", "Liver failure signs", "Extreme fatigue", "Bleeding gums"],
        "advice": "Avoid alcohol completely. Follow a low-fat diet and take vitamin supplements as prescribed.",
    },
    "Drug Reaction": {
        "report": """## Drug Reaction (Adverse Drug Reaction)

**Definition:** An unwanted or harmful reaction experienced after taking a medication at normal doses.

**Causes:** Immune-mediated (allergy), dose-related toxicity, drug interactions

**Risk Factors:** Previous drug allergies, multiple medications, genetic factors, kidney/liver disease

**Symptoms:** Skin rash, itching, fever, swelling, breathing difficulty, organ damage in severe cases

**Treatment:**
- Stop the offending drug immediately
- Antihistamines for mild reactions
- Corticosteroids for moderate reactions
- Epinephrine for anaphylaxis

**Prevention:** Inform doctors about all medications and allergies, carry allergy card

**Prognosis:** Most reactions resolve after stopping the drug; severe reactions need emergency care.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Blistering skin", "Throat swelling", "Breathing difficulty", "Stevens-Johnson syndrome signs"],
        "advice": "Stop the suspected drug and contact your doctor immediately. Do not restart the medication without medical advice.",
    },
    "Peptic ulcer disease": {
        "report": """## Peptic Ulcer Disease

**Definition:** Open sores (ulcers) that develop on the stomach lining or the upper part of the small intestine.

**Causes:** H. pylori bacteria infection, long-term NSAID use (aspirin, ibuprofen), stress

**Symptoms:** Burning stomach pain (worse when empty), nausea, bloating, vomiting, dark/tarry stools

**Treatment:**
- Antibiotics to eradicate H. pylori
- Proton pump inhibitors (omeprazole) to reduce acid
- Avoid NSAIDs
- Antacids for symptom relief

**Prevention:** Treat H. pylori, avoid NSAIDs, quit smoking, limit alcohol, manage stress

**Prognosis:** Most ulcers heal completely with proper treatment; recurrence possible if H. pylori not eliminated.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Black or tarry stools", "Vomiting blood", "Sudden severe abdominal pain"],
        "advice": "Take your full course of antibiotics. Avoid NSAIDs, alcohol, and spicy foods during recovery.",
    },
    "AIDS": {
        "report": """## AIDS (HIV/AIDS)

**Definition:** Acquired Immunodeficiency Syndrome is the most advanced stage of HIV infection, where the immune system is severely damaged.

**Causes:** Human Immunodeficiency Virus (HIV) transmitted through blood, sexual contact, breast milk

**Risk Factors:** Unprotected sex, sharing needles, blood transfusions, mother-to-child transmission

**Symptoms:** Frequent infections, fever, weight loss, fatigue, swollen lymph nodes, skin problems

**Treatment:**
- Antiretroviral therapy (ART) — lifelong medication that controls virus
- Prophylaxis for opportunistic infections
- No cure, but ART allows near-normal life expectancy

**Prevention:** Safe sex (condoms), clean needles, PrEP medication, HIV testing

**Prognosis:** With ART, people with HIV can live long, healthy lives. Untreated AIDS is life-threatening.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Rapid weight loss", "Recurrent fever", "Severe infections", "Neurological symptoms"],
        "advice": "Adhere strictly to antiretroviral therapy. Regular CD4 count and viral load monitoring is essential.",
    },
    "Diabetes": {
        "report": """## Diabetes

**Definition:** A metabolic disease causing high blood sugar due to insufficient insulin production or insulin resistance.

**Types:** Type 1 (autoimmune), Type 2 (lifestyle-related), Gestational

**Causes:** Genetic factors, obesity, sedentary lifestyle, pancreatic damage, hormonal disorders

**Symptoms:** Excessive thirst, frequent urination, fatigue, blurred vision, slow-healing wounds, weight loss

**Treatment:**
- Type 1: Insulin therapy (essential)
- Type 2: Metformin, diet changes, exercise, oral medications, insulin if needed
- Regular blood glucose monitoring

**Prevention:** Healthy diet, regular exercise, maintain healthy weight, avoid sugary foods

**Prognosis:** Manageable with medication and lifestyle changes; poor control leads to heart, kidney, nerve damage.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Blood sugar >400 mg/dL", "Diabetic ketoacidosis", "Hypoglycemia seizures", "Chest pain"],
        "advice": "Monitor blood sugar regularly, take medications as prescribed, exercise daily, and follow a low-carb diet.",
    },
    "Gastroenteritis": {
        "report": """## Gastroenteritis (Stomach Flu)

**Definition:** Inflammation of the stomach and intestines, typically resulting from viral or bacterial infection.

**Causes:** Norovirus, rotavirus, Salmonella, E. coli, contaminated food or water

**Symptoms:** Nausea, vomiting, diarrhea, stomach cramps, fever, dehydration

**Treatment:**
- Oral rehydration solution (ORS) — most important
- Rest and clear liquids
- Antibiotics only for bacterial causes
- Anti-nausea medication if needed

**Prevention:** Handwashing, safe food handling, clean drinking water, vaccination (rotavirus)

**Prognosis:** Most cases resolve in 1–3 days; severe dehydration requires hospital care.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Signs of severe dehydration", "Blood in stool", "High fever", "Vomiting for more than 24 hours"],
        "advice": "Take ORS frequently in small sips. Eat bland food (BRAT diet) and rest. Avoid dairy and fatty foods.",
    },
    "Bronchial Asthma": {
        "report": """## Bronchial Asthma

**Definition:** A chronic inflammatory disease of the airways causing wheezing, breathlessness, and coughing.

**Causes:** Allergens (dust, pollen, pets), exercise, cold air, respiratory infections, smoking

**Risk Factors:** Family history, allergies, air pollution, obesity, smoking

**Symptoms:** Wheezing, shortness of breath, chest tightness, coughing (especially at night)

**Treatment:**
- Short-acting bronchodilators (salbutamol) for quick relief
- Inhaled corticosteroids (budesonide) for long-term control
- Avoid triggers
- Asthma action plan

**Prevention:** Avoid known triggers, use air purifiers, quit smoking, take medications regularly

**Prognosis:** Well-controlled asthma allows normal activities; severe or untreated asthma can be life-threatening.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Severe breathing difficulty", "Blue lips or fingertips", "No improvement with inhaler", "Rapid breathing"],
        "advice": "Carry your rescue inhaler at all times. Identify and avoid your triggers. Never skip controller medication.",
    },
    "Hypertension": {
        "report": """## Hypertension (High Blood Pressure)

**Definition:** A chronic condition where blood pressure in the arteries is persistently elevated (≥140/90 mmHg).

**Causes:** Unknown (primary), kidney disease, hormonal disorders, sleep apnea (secondary)

**Risk Factors:** Obesity, salt intake, smoking, alcohol, stress, family history, age

**Symptoms:** Often silent; headache, dizziness, blurred vision, chest pain in severe cases

**Treatment:**
- Lifestyle: DASH diet, exercise, weight loss, quit smoking, limit alcohol
- Medications: ACE inhibitors, beta-blockers, calcium channel blockers, diuretics

**Prevention:** Regular exercise, low-salt diet, healthy weight, stress management

**Prognosis:** Controlled hypertension dramatically reduces risk of stroke, heart attack, and kidney failure.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["BP >180/120 mmHg", "Severe headache", "Chest pain", "Vision changes", "Stroke symptoms"],
        "advice": "Take your blood pressure medication every day even if you feel fine. Reduce salt and manage stress.",
    },
    "Migraine": {
        "report": """## Migraine

**Definition:** A neurological disorder causing recurring moderate-to-severe headaches, often with nausea and sensitivity to light/sound.

**Causes:** Exact cause unknown; triggers include stress, certain foods, hormonal changes, sleep changes

**Symptoms:** Throbbing head pain (usually one side), nausea, vomiting, light/sound sensitivity, visual aura

**Treatment:**
- Triptans (sumatriptan) for acute attacks
- NSAIDs (ibuprofen) for mild attacks
- Preventive: beta-blockers, topiramate if frequent
- Rest in dark, quiet room

**Prevention:** Identify triggers, regular sleep, stay hydrated, stress management

**Prognosis:** Chronic condition; most people find significant relief with proper management.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Worst headache of life", "Headache with fever and stiff neck", "Sudden onset", "Neurological symptoms"],
        "advice": "Keep a headache diary to identify triggers. Take medication early in the attack for best results.",
    },
    "Cervical spondylosis": {
        "report": """## Cervical Spondylosis

**Definition:** Age-related wear and tear of the spinal disks in the cervical (neck) region of the spine.

**Causes:** Aging, bone spurs, dehydrated spinal discs, herniated discs, poor posture

**Symptoms:** Neck pain and stiffness, headache, tingling in arms/hands, muscle weakness, loss of balance

**Treatment:**
- Physical therapy and neck exercises
- NSAIDs for pain relief
- Muscle relaxants
- Surgery for severe cases with nerve compression

**Prevention:** Maintain good posture, ergonomic workspace, regular neck exercises, avoid prolonged screen time

**Prognosis:** Most people manage well with conservative treatment; severe cases may need surgery.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Loss of bladder/bowel control", "Sudden worsening weakness", "Arm paralysis"],
        "advice": "Maintain proper posture. Do gentle neck stretches daily. Use an ergonomic pillow while sleeping.",
    },
    "Paralysis (brain hemorrhage)": {
        "report": """## Paralysis from Brain Hemorrhage

**Definition:** Loss of muscle function due to bleeding in or around the brain, damaging brain tissue.

**Causes:** Head trauma, hypertension, aneurysm rupture, blood thinners, arteriovenous malformation

**Symptoms:** Sudden severe headache, weakness or paralysis (one side), speech difficulty, vision problems, loss of consciousness

**Treatment:**
- Emergency: stabilize bleeding, reduce brain pressure
- Surgical intervention in some cases
- Intensive rehabilitation (physiotherapy, speech therapy)
- Blood pressure control

**Prevention:** Control hypertension, avoid head trauma (helmets), regular health checkups

**Prognosis:** Depends on location and extent of hemorrhage; early treatment improves outcomes.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Loss of consciousness", "Sudden severe headache", "One-sided weakness", "Speech difficulty — CALL EMERGENCY"],
        "advice": "This is a medical emergency. Call emergency services immediately. Every minute matters for brain hemorrhage.",
    },
    "Jaundice": {
        "report": """## Jaundice

**Definition:** Yellowing of the skin and whites of the eyes due to excess bilirubin in the blood.

**Causes:** Liver disease, bile duct obstruction, hemolytic anemia, hepatitis, gallstones, liver cancer

**Symptoms:** Yellow skin and eyes, dark urine, pale stools, fatigue, itching, abdominal pain

**Treatment:** Treat underlying cause — antivirals for hepatitis, surgery for obstruction, phototherapy for newborns

**Prevention:** Hepatitis vaccination, avoid alcohol, safe food preparation, blood safety

**Prognosis:** Depends on underlying cause; most cases are treatable when caught early.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Rapid worsening jaundice", "Confusion/altered consciousness", "Severe abdominal pain", "High fever"],
        "advice": "Avoid alcohol completely. Rest and maintain hydration. Follow your doctor's treatment plan strictly.",
    },
    "Malaria": {
        "report": """## Malaria

**Definition:** A life-threatening disease caused by Plasmodium parasites transmitted through infected Anopheles mosquito bites.

**Causes:** Plasmodium falciparum, P. vivax, P. malariae, P. ovale parasites

**Symptoms:** High fever with chills, sweating, headache, nausea, vomiting, muscle pain, fatigue (cyclic pattern)

**Treatment:**
- Artemisinin-based combination therapy (ACT) — first line
- Chloroquine for sensitive strains
- Primaquine to prevent relapse (P. vivax/ovale)
- Hospitalization for severe malaria

**Prevention:** Mosquito nets, insect repellent, antimalarial prophylaxis when traveling, eliminate standing water

**Prognosis:** Fully curable with early treatment; delayed treatment can be fatal.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Seizures", "Loss of consciousness", "Severe anemia", "Breathing difficulty", "Blood in urine"],
        "advice": "Complete the full course of antimalarial medications. Use mosquito nets and repellents to prevent reinfection.",
    },
    "Chicken pox": {
        "report": """## Chickenpox (Varicella)

**Definition:** A highly contagious viral infection causing an itchy blister-like rash, fever, and tiredness.

**Causes:** Varicella-zoster virus (VZV), spread by direct contact or airborne droplets

**Symptoms:** Itchy blistering rash (starts on torso), fever, fatigue, loss of appetite, headache

**Treatment:**
- Calamine lotion and antihistamines for itching
- Paracetamol for fever (NOT aspirin)
- Antiviral (acyclovir) for high-risk patients
- Cut nails short to prevent scratching and secondary infection

**Prevention:** Varicella vaccine (highly effective), isolate infected individuals

**Prognosis:** Most cases resolve in 1–2 weeks; serious complications rare in healthy children.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Infection of blisters", "High fever >104°F", "Breathing difficulty", "Severe headache or stiff neck"],
        "advice": "Keep nails short, use calamine lotion, and stay home to avoid spreading. Avoid aspirin; use paracetamol instead.",
    },
    "Dengue": {
        "report": """## Dengue Fever

**Definition:** A mosquito-borne viral disease caused by the dengue virus, transmitted by Aedes mosquitoes.

**Causes:** Dengue virus (DENV 1-4), transmitted by Aedes aegypti mosquito bites

**Symptoms:** High fever, severe headache, pain behind the eyes, muscle/joint pain, rash, mild bleeding

**Treatment:**
- No specific antiviral; supportive care
- Plenty of fluids and ORS
- Paracetamol for fever (NOT ibuprofen or aspirin)
- Monitor platelet count
- Hospitalization for severe dengue

**Prevention:** Eliminate standing water, use mosquito repellents, wear protective clothing, mosquito nets

**Prognosis:** Most cases recover fully in 1–2 weeks; severe dengue can be fatal without prompt care.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Severe abdominal pain", "Bleeding gums or nose", "Blood in vomit/stool", "Rapid breathing", "Platelet <100,000"],
        "advice": "Stay hydrated with ORS and fluids. Monitor for warning signs. Return to hospital immediately if symptoms worsen.",
    },
    "Typhoid": {
        "report": """## Typhoid Fever

**Definition:** A life-threatening systemic infection caused by Salmonella Typhi bacteria, usually from contaminated water/food.

**Causes:** Salmonella Typhi bacteria, fecal-oral transmission via contaminated food/water

**Symptoms:** Sustained high fever, headache, abdominal pain, weakness, constipation or diarrhea, rose-colored spots

**Treatment:**
- Antibiotics: azithromycin, ceftriaxone, or fluoroquinolones
- Adequate hydration
- Rest
- Hospitalization for severe cases

**Prevention:** Safe drinking water, proper sanitation, typhoid vaccine before travel, hand hygiene

**Prognosis:** Fully curable with antibiotics; complications (intestinal perforation) rare but serious.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Intestinal bleeding", "Perforation (sudden severe pain)", "Delirium", "Extreme weakness"],
        "advice": "Complete the full antibiotic course. Drink only boiled or bottled water. Get typhoid vaccine before travel.",
    },
    "hepatitis A": {
        "report": """## Hepatitis A

**Definition:** A highly contagious liver infection caused by the hepatitis A virus (HAV), spread through contaminated food/water.

**Causes:** Hepatitis A virus via fecal-oral route, contaminated food/water, close contact

**Symptoms:** Fatigue, nausea, abdominal pain, jaundice, dark urine, loss of appetite, fever

**Treatment:**
- No specific treatment; supportive care
- Rest and adequate nutrition
- Avoid alcohol
- Usually self-limiting

**Prevention:** Hepatitis A vaccine (very effective), safe food and water, hand hygiene

**Prognosis:** Almost all people recover fully; the infection provides lifelong immunity.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Acute liver failure", "Confusion", "Prolonged severe jaundice"],
        "advice": "Rest, eat healthy food, and avoid alcohol completely. Hepatitis A is self-limiting and most people recover fully.",
    },
    "Hepatitis B": {
        "report": """## Hepatitis B

**Definition:** A serious liver infection caused by the hepatitis B virus (HBV), which can become chronic.

**Causes:** HBV spread through blood, sexual contact, mother-to-child transmission

**Symptoms:** Abdominal pain, dark urine, jaundice, joint pain, fever, loss of appetite

**Treatment:**
- Antiviral medications (tenofovir, entecavir) for chronic hepatitis B
- Regular monitoring (liver function tests, viral load)
- Liver transplant for end-stage liver disease

**Prevention:** Hepatitis B vaccine (highly effective), safe sex, sterile needles

**Prognosis:** Acute cases usually resolve; chronic HBV increases risk of cirrhosis and liver cancer.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Signs of liver failure", "Ascites (fluid in abdomen)", "Bleeding disorders", "Encephalopathy"],
        "advice": "Avoid alcohol and smoking. Take antiviral medication as prescribed. Get regular liver checkups.",
    },
    "Hepatitis C": {
        "report": """## Hepatitis C

**Definition:** A liver infection caused by the hepatitis C virus (HCV), usually spread through blood contact.

**Causes:** HCV via blood transfusions, sharing needles, sexual transmission, rarely mother-to-child

**Symptoms:** Often asymptomatic initially; fatigue, jaundice, abdominal pain, joint pain, dark urine

**Treatment:**
- Direct-acting antivirals (sofosbuvir/ledipasvir) — cure rate >95%
- 8–12 week treatment course
- Regular monitoring

**Prevention:** Sterile needles, blood safety, no vaccine available

**Prognosis:** Excellent with modern treatment; chronic untreated HCV leads to cirrhosis and liver cancer.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Cirrhosis signs", "Liver failure", "Internal bleeding", "Hepatic encephalopathy"],
        "advice": "Modern Hepatitis C treatment has a >95% cure rate. Avoid alcohol and seek specialist care promptly.",
    },
    "Hepatitis D": {
        "report": """## Hepatitis D

**Definition:** A serious liver disease caused by the hepatitis D virus (HDV), which only infects people who also have hepatitis B.

**Causes:** HDV, requires HBV for replication; transmitted similarly (blood, sexual contact)

**Symptoms:** Similar to HBV but often more severe; jaundice, fatigue, abdominal pain, liver failure

**Treatment:**
- Pegylated interferon alpha (limited effectiveness)
- Treat underlying HBV
- Liver transplant for end-stage disease

**Prevention:** Hepatitis B vaccine (also protects against HDV), safe blood practices

**Prognosis:** Co-infection or superinfection with HDV significantly worsens HBV prognosis.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Rapid liver deterioration", "Coagulopathy", "Encephalopathy"],
        "advice": "Must be managed alongside Hepatitis B. Avoid alcohol and follow specialist's treatment plan strictly.",
    },
    "Hepatitis E": {
        "report": """## Hepatitis E

**Definition:** A liver disease caused by the hepatitis E virus (HEV), mainly transmitted through contaminated water.

**Causes:** HEV via fecal-oral route, mainly contaminated drinking water in developing countries

**Symptoms:** Jaundice, fever, fatigue, loss of appetite, nausea, abdominal pain, dark urine

**Treatment:**
- Supportive care (rest, fluids, nutrition)
- Usually self-limiting in healthy individuals
- Ribavirin for immunocompromised patients

**Prevention:** Safe drinking water, sanitation, hand hygiene, HEV vaccine (available in China)

**Prognosis:** Most healthy individuals recover fully in 4–6 weeks; dangerous for pregnant women.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Acute liver failure", "Extremely dangerous in pregnancy", "Confusion", "Prolonged jaundice"],
        "advice": "Drink only boiled or bottled water. Rest and maintain nutrition. Pregnant women must seek immediate care.",
    },
    "Alcoholic hepatitis": {
        "report": """## Alcoholic Hepatitis

**Definition:** Liver inflammation caused by drinking too much alcohol over a long period.

**Causes:** Chronic excessive alcohol consumption

**Symptoms:** Jaundice, fever, abdominal pain/swelling, nausea, vomiting, malnutrition, weight loss

**Treatment:**
- Complete abstinence from alcohol (most important)
- Corticosteroids (prednisolone) for severe cases
- Nutritional support
- Liver transplant for end-stage disease (after sobriety period)

**Prevention:** Avoid excessive alcohol consumption, limit to safe limits or abstain

**Prognosis:** Recovery possible with abstinence; continued drinking leads to cirrhosis and liver failure.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Liver failure", "Hepatic encephalopathy", "Severe jaundice", "Internal bleeding"],
        "advice": "Complete alcohol abstinence is essential. Seek alcohol counseling. Nutritional support is critical for recovery.",
    },
    "Tuberculosis": {
        "report": """## Tuberculosis (TB)

**Definition:** A serious bacterial infection that mainly affects the lungs, caused by Mycobacterium tuberculosis.

**Causes:** Mycobacterium tuberculosis spread through air when infected person coughs or sneezes

**Risk Factors:** Weakened immunity, HIV, malnutrition, overcrowding, smoking, diabetes

**Symptoms:** Persistent cough (>2 weeks), blood in sputum, chest pain, weight loss, night sweats, fever

**Treatment:**
- DOTS therapy: 6-month regimen of isoniazid, rifampicin, pyrazinamide, ethambutol
- Drug-resistant TB requires longer, more intense treatment
- Never skip doses (leads to drug resistance)

**Prevention:** BCG vaccine, early diagnosis, proper ventilation, complete treatment

**Prognosis:** Curable with full course of treatment; drug resistance is a major concern.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Blood in sputum (hemoptysis)", "Severe weight loss", "Night sweats", "Breathing failure"],
        "advice": "Complete all 6 months of TB treatment without missing a single dose. Isolation until non-infectious.",
    },
    "Common Cold": {
        "report": """## Common Cold

**Definition:** A viral infection of the upper respiratory tract, usually caused by rhinoviruses.

**Causes:** Rhinovirus, coronavirus, RSV; spread through droplets and contact

**Symptoms:** Runny/stuffy nose, sore throat, cough, sneezing, mild fever, body aches

**Treatment:**
- Rest and fluids (most important)
- Paracetamol or ibuprofen for fever/pain
- Decongestants for nasal congestion
- No antibiotics needed (viral)

**Prevention:** Regular handwashing, avoid close contact with infected people, don't share personal items

**Prognosis:** Usually resolves in 7–10 days without treatment.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["High fever >103°F", "Symptoms worsening after 10 days", "Chest pain", "Difficulty breathing"],
        "advice": "Rest, drink plenty of fluids, and use saline nasal spray. Antibiotics won't help — it's a viral infection.",
    },
    "Pneumonia": {
        "report": """## Pneumonia

**Definition:** Infection of one or both lungs causing fluid or pus to fill the air sacs.

**Causes:** Bacteria (Streptococcus pneumoniae), viruses (influenza, COVID-19), fungi, aspiration

**Risk Factors:** Age (elderly/infants), weakened immunity, chronic diseases, smoking

**Symptoms:** Cough with phlegm, fever, chills, chest pain, breathlessness, fatigue, muscle aches

**Treatment:**
- Bacterial: antibiotics (amoxicillin, azithromycin)
- Viral: antiviral medications
- Hospitalization for severe cases with oxygen therapy
- Rest and fluids

**Prevention:** Pneumococcal vaccine, influenza vaccine, quit smoking, hand hygiene

**Prognosis:** Most young healthy people recover; high mortality risk in elderly and immunocompromised.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Oxygen saturation <95%", "Rapid breathing rate", "Confusion", "Blue lips or fingernails"],
        "advice": "Complete the full antibiotic course. Monitor oxygen levels. Seek emergency care if breathing worsens.",
    },
    "Dimorphic hemmorhoids(piles)": {
        "report": """## Hemorrhoids (Piles)

**Definition:** Swollen veins in the rectum or anus that cause discomfort, itching, and bleeding.

**Causes:** Straining during bowel movements, chronic constipation, pregnancy, low-fiber diet, obesity

**Symptoms:** Rectal bleeding (bright red), itching, discomfort, swelling around anus, pain during bowel movements

**Treatment:**
- High-fiber diet and adequate water to soften stools
- Sitz baths for comfort
- Over-the-counter creams (hydrocortisone)
- Procedures: rubber band ligation, sclerotherapy, hemorrhoidectomy

**Prevention:** High-fiber diet, plenty of water, avoid prolonged sitting on toilet, exercise

**Prognosis:** Most hemorrhoids respond well to conservative treatment; surgery is very effective.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Excessive bleeding", "Prolapsed hemorrhoid", "Signs of anemia", "Severe pain"],
        "advice": "Eat a high-fiber diet and drink plenty of water. Use sitz baths for relief. Avoid straining during bowel movements.",
    },
    "Heart attack": {
        "report": """## Heart Attack (Myocardial Infarction)

**Definition:** A medical emergency where blood supply to part of the heart is blocked, causing heart muscle death.

**Causes:** Coronary artery disease, blood clot in coronary artery, atherosclerosis

**Risk Factors:** Hypertension, diabetes, high cholesterol, smoking, obesity, family history

**Symptoms:** Severe chest pain (pressure/squeezing), arm/jaw/neck pain, shortness of breath, cold sweat, nausea

**Treatment:**
- CALL EMERGENCY IMMEDIATELY
- Aspirin (if not allergic)
- Thrombolysis or angioplasty to restore blood flow
- Cardiac medications post-recovery

**Prevention:** Control BP, diabetes, cholesterol; quit smoking; exercise; healthy diet

**Prognosis:** Time-critical — "time is muscle"; early intervention dramatically improves survival.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Chest pain/pressure", "Left arm or jaw pain", "Sudden breathlessness", "Cold sweat — CALL 108 IMMEDIATELY"],
        "advice": "EMERGENCY: Call 108 immediately. Chew aspirin if not allergic. Do not drive yourself to hospital.",
    },
    "Varicose veins": {
        "report": """## Varicose Veins

**Definition:** Enlarged, twisted veins (usually in the legs) that develop when valves in the veins stop working properly.

**Causes:** Weak or damaged vein valves, pregnancy, prolonged standing, obesity, family history

**Symptoms:** Bulging, twisted veins; aching/heavy legs; swelling; itching around veins; skin discoloration

**Treatment:**
- Compression stockings
- Lifestyle: exercise, weight loss, elevate legs
- Procedures: sclerotherapy, laser treatment, vein stripping surgery

**Prevention:** Regular exercise, healthy weight, avoid prolonged standing, wear compression stockings

**Prognosis:** Excellent with treatment; primarily cosmetic concern but can cause complications if untreated.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Bleeding from varicose vein", "Leg ulcers", "Signs of deep vein thrombosis (DVT)"],
        "advice": "Wear compression stockings, elevate legs when resting, and exercise regularly. Avoid prolonged standing.",
    },
    "Hypothyroidism": {
        "report": """## Hypothyroidism

**Definition:** A condition where the thyroid gland doesn't produce enough thyroid hormone, slowing down body metabolism.

**Causes:** Hashimoto's disease, thyroid surgery, radiation therapy, iodine deficiency, medications

**Symptoms:** Fatigue, weight gain, cold intolerance, constipation, dry skin, hair thinning, depression, slow heart rate

**Treatment:**
- Levothyroxine (synthetic thyroid hormone) — daily for life
- Regular TSH monitoring to adjust dose
- Iodine supplementation if deficiency is cause

**Prevention:** Adequate iodine intake (iodized salt), regular thyroid screening if at risk

**Prognosis:** Excellent with proper treatment; lifelong medication needed.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Myxedema coma (rare)", "Severe fatigue", "Extreme cold sensitivity", "Very slow heart rate"],
        "advice": "Take levothyroxine every morning on an empty stomach at the same time daily. Never skip doses.",
    },
    "Hyperthyroidism": {
        "report": """## Hyperthyroidism

**Definition:** Overproduction of thyroid hormones, speeding up the body's metabolism.

**Causes:** Graves' disease, toxic thyroid nodule, excessive iodine, thyroiditis

**Symptoms:** Weight loss, rapid heartbeat, sweating, nervousness, irritability, tremor, heat intolerance, bulging eyes (Graves')

**Treatment:**
- Antithyroid drugs (methimazole, propylthiouracil)
- Radioactive iodine therapy
- Beta-blockers for symptom control
- Surgery (thyroidectomy) in some cases

**Prevention:** No specific prevention; early diagnosis important

**Prognosis:** Most patients achieve remission with treatment; lifelong monitoring may be needed.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Thyroid storm (fever, rapid heartbeat, confusion)", "Atrial fibrillation", "Extreme weight loss"],
        "advice": "Take antithyroid medications as prescribed. Avoid iodine supplements and contrast dye unless medically required.",
    },
    "Hypoglycemia": {
        "report": """## Hypoglycemia (Low Blood Sugar)

**Definition:** A condition where blood glucose levels fall below normal (below 70 mg/dL), causing symptoms.

**Causes:** Too much insulin, skipped meals, excessive exercise, alcohol, diabetes medications

**Symptoms:** Shakiness, sweating, confusion, irritability, rapid heartbeat, hunger, headache, blurred vision

**Treatment:**
- Rule of 15: 15g fast-acting carbs (glucose tablets, juice, sugar), wait 15 min, recheck
- Eat a regular meal after recovery
- Glucagon injection for severe cases (unconscious)

**Prevention:** Regular meals, proper medication dosing, monitor blood sugar, carry fast sugar

**Prognosis:** Episodes resolve quickly with treatment; repeated severe hypoglycemia risks brain damage.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Loss of consciousness", "Seizures", "Severe confusion", "Inability to swallow"],
        "advice": "Always carry glucose tablets or sugar. Eat regular meals and never skip. Monitor your blood sugar frequently.",
    },
    "Osteoarthritis": {
        "report": """## Osteoarthritis

**Definition:** The most common form of arthritis — degeneration of joint cartilage and bone, causing pain and stiffness.

**Causes:** Aging, obesity, joint injury, repetitive stress, genetics

**Symptoms:** Joint pain, stiffness (especially morning), swelling, decreased range of motion, bone spurs

**Treatment:**
- Exercise and physical therapy
- Weight loss to reduce joint stress
- NSAIDs or acetaminophen for pain
- Joint injections (corticosteroids, hyaluronic acid)
- Joint replacement surgery for severe cases

**Prevention:** Maintain healthy weight, regular low-impact exercise, protect joints from injury

**Prognosis:** Progressive condition; symptoms managed well but no cure — joint replacement very effective.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Sudden joint locking", "Severe joint swelling", "Complete loss of mobility"],
        "advice": "Exercise regularly (swimming, cycling). Maintain healthy weight. Use hot/cold packs for pain relief.",
    },
    "Arthritis": {
        "report": """## Arthritis

**Definition:** Inflammation of one or more joints causing pain and stiffness that worsens with age.

**Types:** Osteoarthritis, Rheumatoid (autoimmune), Psoriatic, Gout

**Symptoms:** Joint pain, stiffness, swelling, redness, decreased range of motion

**Treatment:**
- Depends on type: NSAIDs, DMARDs (for rheumatoid), colchicine (for gout)
- Physical therapy, occupational therapy
- Hot/cold therapy
- Joint replacement in severe cases

**Prevention:** Maintain healthy weight, stay active, joint protection techniques

**Prognosis:** Most forms are manageable; early treatment prevents disability.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Sudden severe joint pain", "Fever with joint swelling (septic arthritis)", "Inability to move joint"],
        "advice": "Stay active with gentle exercise. Use anti-inflammatory medications as prescribed. Apply heat or cold for relief.",
    },
    "Paroymsal Positional Vertigo": {
        "report": """## Paroxysmal Positional Vertigo (BPPV)

**Definition:** Brief episodes of intense dizziness caused by calcium crystals in the inner ear shifting to the wrong position.

**Causes:** Head injury, aging, inner ear infection, prolonged bed rest

**Symptoms:** Brief episodes of vertigo with head position changes, nausea, balance problems, eye movements (nystagmus)

**Treatment:**
- Epley maneuver (repositioning maneuver) — highly effective
- Brandt-Daroff exercises
- Vestibular rehabilitation
- Medications for nausea relief

**Prevention:** No specific prevention; fall prevention important

**Prognosis:** Excellent — most cases resolve with Epley maneuver; may recur.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Sudden loss of hearing", "Continuous vertigo", "Neurological symptoms"],
        "advice": "Perform the Epley maneuver as instructed by your doctor. Avoid sudden head movements. Sleep with head slightly elevated.",
    },
    "Acne": {
        "report": """## Acne

**Definition:** A skin condition that occurs when hair follicles become clogged with oil and dead skin cells.

**Causes:** Excess oil, clogged pores, bacteria (C. acnes), hormonal changes, certain medications

**Risk Factors:** Hormonal changes (puberty, menstruation), stress, certain cosmetics, family history

**Symptoms:** Whiteheads, blackheads, pimples, papules, pustules, nodules, cysts

**Treatment:**
- Topical: benzoyl peroxide, retinoids, salicylic acid, antibiotics
- Oral antibiotics for moderate acne
- Isotretinoin for severe acne
- Hormonal therapy for women

**Prevention:** Gentle face washing twice daily, non-comedogenic products, avoid picking

**Prognosis:** Most cases resolve with proper treatment; isotretinoin can produce lasting remission.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Severe cystic acne", "Acne causing scarring", "Signs of infection"],
        "advice": "Cleanse skin gently twice daily. Use non-comedogenic products. Don't pick or squeeze pimples.",
    },
    "Urinary tract infection": {
        "report": """## Urinary Tract Infection (UTI)

**Definition:** An infection in any part of the urinary system — kidneys, ureters, bladder, or urethra.

**Causes:** Bacteria (E. coli most common), spread from anal/rectal area to urethra

**Risk Factors:** Female anatomy, sexual activity, menopause, urinary catheters, kidney stones, diabetes

**Symptoms:** Burning urination, frequent urge to urinate, cloudy/bloody urine, pelvic pain, strong odor

**Treatment:**
- Antibiotics (nitrofurantoin, trimethoprim, fosfomycin)
- Increased water intake
- Cranberry products may help prevention (limited evidence)

**Prevention:** Drink plenty of water, urinate after sex, wipe front to back, urinate frequently

**Prognosis:** Most UTIs clear with antibiotics in 3–7 days; recurrent UTIs need further evaluation.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["High fever with chills (kidney infection)", "Back pain with UTI symptoms", "Blood in urine"],
        "advice": "Complete the full antibiotic course. Drink 8+ glasses of water daily. Urinate after sexual intercourse.",
    },
    "Psoriasis": {
        "report": """## Psoriasis

**Definition:** A chronic autoimmune skin condition that speeds up the skin cell life cycle, causing buildup of cells on the surface.

**Causes:** Immune system dysfunction, genetic factors, triggers (stress, infection, medications)

**Symptoms:** Red patches with thick silvery scales, dry/cracked skin, itching, burning, nail changes, joint pain

**Treatment:**
- Topical: corticosteroids, vitamin D analogs, coal tar
- Phototherapy (UV light)
- Systemic: methotrexate, cyclosporine
- Biologics for severe cases

**Prevention:** Avoid triggers (stress, skin injuries, infections), keep skin moisturized

**Prognosis:** Chronic condition with flares and remissions; well-managed with treatment.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Erythrodermic psoriasis (whole body redness)", "Psoriatic arthritis", "Infection of plaques"],
        "advice": "Moisturize regularly, avoid triggers, use prescribed treatments consistently. Stress management is crucial.",
    },
    "Impetigo": {
        "report": """## Impetigo

**Definition:** A highly contagious bacterial skin infection causing sores and blisters, most common in children.

**Causes:** Staphylococcus aureus or Streptococcus pyogenes bacteria, often entering through cuts/insect bites

**Symptoms:** Red sores that rupture and form honey-colored crusts, blisters, itching, surrounding redness

**Treatment:**
- Antibiotic ointment (mupirocin) for mild cases
- Oral antibiotics (flucloxacillin) for widespread infection
- Gentle washing and keep sores clean

**Prevention:** Hand washing, don't share towels, keep wounds clean and covered

**Prognosis:** Responds quickly to antibiotics; resolves in 7–10 days.

---
*This is educational information. Always consult a qualified doctor for diagnosis and treatment.*""",
        "warning_signs": ["Rapidly spreading infection", "Fever", "Cellulitis development", "Post-streptococcal kidney disease"],
        "advice": "Apply antibiotic cream as prescribed. Keep the area clean. Don't share towels or bedding with others.",
    },
}

# Generic disease template for any disease not in the knowledge base
def _generic_report(disease: str) -> dict:
    return {
        "report": f"""## {disease}

**Overview:** {disease} is a medical condition that has been identified based on your reported symptoms by our AI system.

**General Advice:**
- Consult a qualified doctor for proper diagnosis and personalized treatment
- Take prescribed medications as directed and complete the full course
- Stay well hydrated and get adequate rest
- Monitor symptoms and seek emergency care if they worsen significantly

**Lifestyle Recommendations:**
- Maintain a balanced diet rich in fruits and vegetables
- Avoid self-medication without medical advice
- Keep follow-up appointments with your doctor
- Report any new or worsening symptoms promptly

*This is an AI-assisted prediction for educational purposes. Always consult a qualified doctor for medical advice and treatment.*""",
        "warning_signs": ["High fever (>103°F / 39.4°C)", "Difficulty breathing", "Severe pain", "Loss of consciousness"],
        "advice": "Consult a qualified doctor promptly for proper diagnosis and treatment of your condition.",
    }


def _build_from_kb(disease: str) -> dict:
    """Build a medical info dict from the static knowledge base."""
    kb = DISEASE_KB.get(disease) or _generic_report(disease)
    return {
        "description": f"AI identified: {disease}. {kb.get('advice', 'Consult a doctor for proper diagnosis and treatment.')}",
        "immediate_advice": kb.get("advice", "Rest, stay hydrated, and seek medical attention."),
        "warning_signs": kb.get("warning_signs", ["High fever", "Difficulty breathing", "Severe pain", "Loss of consciousness"]),
        "disclaimer": "This information is for educational purposes and not a substitute for professional medical advice.",
        "detailed_report": kb.get("report", _generic_report(disease)["report"]),
    }

def get_medical_report(predicted_disease: str, symptoms_text: str) -> dict:
    """
    Generate a comprehensive medical report.
    Priority: (1) Gemini AI, (2) Static knowledge base, (3) Generic template.
    """
    if not GEMINI_LOADED:
        log.info(f"Gemini not available — using static knowledge base for: {predicted_disease}")
        return _build_from_kb(predicted_disease)

    prompt = f"""
You are a medical information assistant.

Provide concise structured information about: {predicted_disease}

Rules:
- Keep total response under 300 words.
- Each section must be 1–3 short sentences only.
- Use simple language for rural patients.
- Avoid technical jargon.
- No long explanations.
- Do not repeat information.
- Do not provide personalized advice.
- Add one-line disclaimer at end.

Structure exactly as:

1. Name
2. Definition
3. Causes
4. Risk Factors
5. What Happens in the Body
6. Symptoms
7. Diagnosis
8. Treatment
9. Complications
10. Prevention
11. Prognosis
12. Epidemiology

Be clear, brief, and structured.
"""

    # ── Helper: safely get text from a Gemini response ──
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

    # ── Single Gemini call with retry (up to 3 attempts) ──
    report_text = ""
    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            log.info(f"[Attempt {attempt}/{max_retries}] Generating report for: {predicted_disease}")
            resp = gemini_model.generate_content(prompt)
            report_text = get_text(resp)
            if report_text:
                log.info(f"Report generated successfully ({len(report_text)} chars)")
                break
            else:
                log.warning(f"[Attempt {attempt}] Empty response received")
        except Exception as e:
            log.warning(f"[Attempt {attempt}] Failed: {type(e).__name__}: {e}")
            if attempt < max_retries:
                wait = attempt * 3  # 3s, 6s backoff
                log.info(f"Retrying in {wait}s...")
                _time.sleep(wait)

    if not report_text:
        log.error(f"All {max_retries} attempts failed for {predicted_disease}")
        return _build_from_kb(predicted_disease)

    # ── Extract short description from the report for the summary card ──
    lines = [l.strip() for l in report_text.split('\n')
             if l.strip() and not l.strip().startswith('#')
             and not l.strip().startswith('*')
             and not l.strip().startswith('---')]
    first_text = ""
    for ln in lines:
        cleaned = ln.lstrip('- ').lstrip('• ')
        if len(cleaned) > 20:
            first_text = cleaned
            break
    if not first_text:
        first_text = f"{predicted_disease} has been identified based on your symptoms."

    return {
        "description": first_text[:300],
        "immediate_advice": "Please review the detailed medical report below and consult a doctor for treatment.",
        "warning_signs": ["High fever that won't go down", "Difficulty breathing", "Severe pain", "Loss of consciousness"],
        "disclaimer": "This is an AI-generated report for educational purposes. Always consult a qualified doctor.",
        "detailed_report": report_text,
    }

# ─── FASTAPI APP ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="GramSeva AI Triage",
    description="Symptom-based disease triage using RandomForest ML + Gemini API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── SCHEMAS ─────────────────────────────────────────────────────────────────
class TriageRequest(BaseModel):
    symptoms: str        # free-text, e.g. "I have fever and headache"

class MedicalInfo(BaseModel):
    description:      str
    immediate_advice:  str
    warning_signs:     list
    disclaimer:        str
    detailed_report:   str   # Full 12-section markdown medical report

class TriageResponse(BaseModel):
    disease:      str
    confidence:   float
    specialist:   str
    urgency:      str       # "critical" | "high" | "medium" | "low"
    emergency:    bool
    top3:         list
    medical_info: MedicalInfo

class ReportResponse(BaseModel):
    disease:         str
    detailed_report: str

# ─── ENDPOINTS ───────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "GramSeva AI Triage Server is running 🚀",
        "model_loaded": MODEL_LOADED,
        "gemini_loaded": GEMINI_LOADED,
        "version": "2.0.0",
    }

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model_loaded": MODEL_LOADED,
        "gemini_loaded": GEMINI_LOADED,
        "symptoms_supported": len(SYMPTOM_COLUMNS) if SYMPTOM_COLUMNS else 0,
        "diseases_supported": len(le.classes_) if le else 0,
        "test_accuracy": model_metrics.get("test_accuracy") if model_metrics else None,
    }

@app.get("/api/symptoms")
def get_symptoms():
    """Return all 132 known symptom keywords."""
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model not loaded. Run train_model.py first.")
    return {"symptoms": SYMPTOM_COLUMNS, "count": len(SYMPTOM_COLUMNS)}

@app.get("/api/model-info")
def model_info():
    """Return model accuracy and stats."""
    if not model_metrics:
        raise HTTPException(status_code=503, detail="Model metrics not available. Run train_model.py first.")
    return {
        "test_accuracy": model_metrics.get("test_accuracy"),
        "cv_mean_accuracy": model_metrics.get("cv_mean_accuracy"),
        "n_diseases": model_metrics.get("n_diseases"),
        "n_symptoms": model_metrics.get("n_symptoms"),
        "n_train_samples": model_metrics.get("n_train_samples"),
        "top_features": model_metrics.get("top_20_features", [])[:5],
        "diseases": model_metrics.get("diseases", []),
    }

@app.post("/api/triage", response_model=TriageResponse)
def triage(req: TriageRequest):
    """Fast ML triage (< 1s). Report is loaded separately via /api/report."""
    if not MODEL_LOADED:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please run `python train_model.py` to train the model first."
        )

    # ── Step 1: Convert text to binary symptom vector ────────────────────────
    vec = text_to_vector(req.symptoms)
    active_count = int(vec.sum())
    log.info(f"Triage request: {active_count} symptoms detected from '{req.symptoms[:60]}...'")

    # ── Step 2: Emergency override check ────────────────────────────────────
    active_symptoms = {SYMPTOM_COLUMNS[i] for i, v in enumerate(vec) if v == 1}
    is_emergency = bool(active_symptoms & EMERGENCY_SYMPTOMS)

    # ── Step 3: ML Model prediction ─────────────────────────────────────────
    probs    = model.predict_proba([vec])[0]
    top_idxs = np.argsort(probs)[::-1][:3]
    top3     = [
        {"disease": le.classes_[i].strip(), "confidence": round(float(probs[i]), 3)}
        for i in top_idxs
    ]

    predicted_disease = le.classes_[top_idxs[0]].strip()
    confidence        = round(float(probs[top_idxs[0]]), 3)

    log.info(f"Predicted disease: {predicted_disease} (confidence: {confidence:.1%})")

    # ── Step 4: Specialist + urgency ────────────────────────────────────────
    specialist = SPECIALIST_MAP.get(predicted_disease, "General Physician")
    urgency    = URGENCY_MAP.get(predicted_disease, "medium")
    if is_emergency:
        urgency = "critical"

    # ── Step 5: Summary from static knowledge base (instant, no API needed) ──
    _kb_info = _build_from_kb(predicted_disease)
    medical_info = {
        "description":     _kb_info["description"],
        "immediate_advice": _kb_info["immediate_advice"],
        "warning_signs":   _kb_info["warning_signs"],
        "disclaimer":      _kb_info["disclaimer"],
        "detailed_report": _kb_info["detailed_report"],  # full static report
    }

    return TriageResponse(
        disease=predicted_disease,
        confidence=confidence,
        specialist=specialist,
        urgency=urgency,
        emergency=is_emergency,
        top3=top3,
        medical_info=MedicalInfo(**medical_info),
    )


@app.get("/api/report/{disease}")
def generate_report(disease: str):
    """Lazy-loaded detailed AI medical report. Called separately after triage."""
    log.info(f"Report requested for: {disease}")
    result = get_medical_report(disease, "")
    return ReportResponse(
        disease=disease,
        detailed_report=result.get("detailed_report", f"# {disease}\n\nReport unavailable."),
    )

# ─── RUN ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
