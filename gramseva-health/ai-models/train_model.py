"""
GramSeva Health — AI Triage Model Training Script
==================================================
Robust ML pipeline with cross-validation, feature importance,
and comprehensive metrics export.

Dataset: 132 binary symptom features → 41 disease classes
Model:   RandomForestClassifier (300 trees)

Run:  python train_model.py
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
import sys
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score

# ─── PATHS ────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(os.path.dirname(os.path.dirname(BASE_DIR)), "ml training")
TRAIN_CSV  = os.path.join(DATA_DIR, "Training.csv")
TEST_CSV   = os.path.join(DATA_DIR, "Testing.csv")

# Output artifacts
MODEL_OUT       = os.path.join(BASE_DIR, "triage_model.pkl")
LE_OUT          = os.path.join(BASE_DIR, "label_encoder.pkl")
COLS_OUT        = os.path.join(BASE_DIR, "symptom_columns.json")
SPECIALIST_OUT  = os.path.join(BASE_DIR, "specialist_map.json")
METRICS_OUT     = os.path.join(BASE_DIR, "model_metrics.json")

# ─── VALIDATE FILES ──────────────────────────────────────────────────────────
for path, name in [(TRAIN_CSV, "Training.csv"), (TEST_CSV, "Testing.csv")]:
    if not os.path.exists(path):
        print(f"❌ ERROR: {name} not found at {path}")
        sys.exit(1)

# ─── LOAD DATA ────────────────────────────────────────────────────────────────
print("=" * 60)
print("  GramSeva Health — AI Triage Model Training")
print("=" * 60)

print("\n📂 Loading datasets...")
train = pd.read_csv(TRAIN_CSV)
test  = pd.read_csv(TEST_CSV)

# Drop unnamed garbage columns
train.drop(columns=[c for c in train.columns if "Unnamed" in c], inplace=True)
test.drop(columns=[c for c in test.columns if "Unnamed" in c],  inplace=True)

# Strip whitespace from column names
train.columns = [c.strip() for c in train.columns]
test.columns  = [c.strip() for c in test.columns]

# Strip whitespace from prognosis values
train["prognosis"] = train["prognosis"].str.strip()
test["prognosis"]  = test["prognosis"].str.strip()

print(f"   Train : {train.shape[0]} rows, {train.shape[1]-1} symptom features")
print(f"   Test  : {test.shape[0]} rows")
print(f"   Diseases: {train['prognosis'].nunique()}")

# ─── FEATURES / LABELS ──────────────────────────────────────────────────────
X_train = train.drop("prognosis", axis=1)
y_train = train["prognosis"]
X_test  = test.drop("prognosis", axis=1)
y_test  = test["prognosis"]

SYMPTOM_COLUMNS = list(X_train.columns)

# ─── LABEL ENCODE ─────────────────────────────────────────────────────────────
le = LabelEncoder()
le.fit(pd.concat([y_train, y_test]).unique())
y_train_enc = le.transform(y_train)
y_test_enc  = le.transform(y_test)

print(f"\n🏷️  Classes ({len(le.classes_)}): {list(le.classes_[:5])} ...")

# ─── TRAIN ────────────────────────────────────────────────────────────────────
print("\n🌲 Training RandomForest (300 trees, max_depth=20)...")
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=20,
    min_samples_leaf=2,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)
model.fit(X_train, y_train_enc)
print("   ✅ Training complete!")

# ─── CROSS-VALIDATION ────────────────────────────────────────────────────────
print("\n📊 Running 5-fold cross-validation...")
cv_scores = cross_val_score(model, X_train, y_train_enc, cv=5, scoring="accuracy")
print(f"   CV Scores : {[f'{s:.4f}' for s in cv_scores]}")
print(f"   CV Mean   : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ─── EVALUATE ON TEST SET ────────────────────────────────────────────────────
y_pred = model.predict(X_test)
test_acc = accuracy_score(y_test_enc, y_pred)

print(f"\n✅ Test Accuracy: {test_acc * 100:.2f}%")
print("\n📋 Classification Report:")
report_str = classification_report(y_test_enc, y_pred, target_names=le.classes_)
print(report_str)

# Parse classification report into dict
report_dict = classification_report(y_test_enc, y_pred, target_names=le.classes_, output_dict=True)

# ─── FEATURE IMPORTANCE ──────────────────────────────────────────────────────
print("\n🔬 Top 20 Most Important Symptoms:")
importances = model.feature_importances_
feat_imp = sorted(zip(SYMPTOM_COLUMNS, importances), key=lambda x: -x[1])
top_20 = feat_imp[:20]
for i, (feat, imp) in enumerate(top_20, 1):
    bar = "█" * int(imp * 200)
    print(f"   {i:2d}. {feat:<35s} {imp:.4f} {bar}")

# ─── SPECIALIST MAPPING ─────────────────────────────────────────────────────
SPECIALIST_MAP = {
    "Fungal infection":             "Dermatologist",
    "Allergy":                      "Allergist / Immunologist",
    "GERD":                         "Gastroenterologist",
    "Chronic cholestasis":          "Gastroenterologist",
    "Drug Reaction":                "Dermatologist",
    "Peptic ulcer diseae":          "Gastroenterologist",
    "AIDS":                         "Infectious Disease",
    "Diabetes":                     "Endocrinologist",
    "Gastroenteritis":              "Gastroenterologist",
    "Bronchial Asthma":             "Pulmonologist",
    "Hypertension":                 "Cardiologist",
    "Migraine":                     "Neurologist",
    "Cervical spondylosis":         "Orthopedic",
    "Paralysis (brain hemorrhage)": "Neurologist",
    "Jaundice":                     "Hepatologist",
    "Malaria":                      "Infectious Disease",
    "Chicken pox":                  "General Physician",
    "Dengue":                       "Infectious Disease",
    "Typhoid":                      "Infectious Disease",
    "hepatitis A":                  "Hepatologist",
    "Hepatitis B":                  "Hepatologist",
    "Hepatitis C":                  "Hepatologist",
    "Hepatitis D":                  "Hepatologist",
    "Hepatitis E":                  "Hepatologist",
    "Alcoholic hepatitis":          "Hepatologist",
    "Tuberculosis":                 "Pulmonologist",
    "Common Cold":                  "General Physician",
    "Pneumonia":                    "Pulmonologist",
    "Dimorphic hemmorhoids(piles)": "Proctologist",
    "Heart attack":                 "Cardiologist",
    "Varicose veins":               "Vascular Surgeon",
    "Hypothyroidism":               "Endocrinologist",
    "Hyperthyroidism":              "Endocrinologist",
    "Hypoglycemia":                 "Endocrinologist",
    "Osteoarthristis":              "Orthopedic",
    "Arthritis":                    "Rheumatologist",
    "(vertigo) Paroymsal  Positional Vertigo": "ENT / Neurologist",
    "Acne":                         "Dermatologist",
    "Urinary tract infection":      "Urologist",
    "Psoriasis":                    "Dermatologist",
    "Impetigo":                     "Dermatologist",
}

# ─── URGENCY MAPPING ─────────────────────────────────────────────────────────
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
    "GERD":                         "low",
    "Common Cold":                  "low",
    "Acne":                         "low",
    "Fungal infection":             "low",
    "Allergy":                      "low",
    "Migraine":                     "medium",
    "Urinary tract infection":      "medium",
    "Psoriasis":                    "low",
    "Impetigo":                     "low",
}

# ─── SAVE ARTIFACTS ──────────────────────────────────────────────────────────
print("\n💾 Saving model artifacts...")

joblib.dump(model, MODEL_OUT)
print(f"   Model         → {MODEL_OUT}")

joblib.dump(le, LE_OUT)
print(f"   LabelEncoder  → {LE_OUT}")

with open(COLS_OUT, "w") as f:
    json.dump(SYMPTOM_COLUMNS, f, indent=2)
print(f"   Symptom cols  → {COLS_OUT}")

with open(SPECIALIST_OUT, "w") as f:
    json.dump(SPECIALIST_MAP, f, indent=2)
print(f"   Specialist map→ {SPECIALIST_OUT}")

# Save comprehensive metrics
metrics = {
    "test_accuracy": round(test_acc, 4),
    "cv_mean_accuracy": round(float(cv_scores.mean()), 4),
    "cv_std": round(float(cv_scores.std()), 4),
    "cv_scores": [round(float(s), 4) for s in cv_scores],
    "n_diseases": int(len(le.classes_)),
    "n_symptoms": len(SYMPTOM_COLUMNS),
    "n_train_samples": int(X_train.shape[0]),
    "n_test_samples": int(X_test.shape[0]),
    "model_params": {
        "n_estimators": 300,
        "max_depth": 20,
        "min_samples_leaf": 2,
        "min_samples_split": 5,
    },
    "top_20_features": [{"symptom": f, "importance": round(float(i), 4)} for f, i in top_20],
    "diseases": list(le.classes_),
    "urgency_map": URGENCY_MAP,
    "per_class_report": {
        k: {
            "precision": round(v["precision"], 4),
            "recall": round(v["recall"], 4),
            "f1_score": round(v["f1-score"], 4),
        }
        for k, v in report_dict.items()
        if k not in ("accuracy", "macro avg", "weighted avg")
    },
}

with open(METRICS_OUT, "w") as f:
    json.dump(metrics, f, indent=2)
print(f"   Metrics       → {METRICS_OUT}")

print("\n" + "=" * 60)
print(f"  🎉 Training complete! Test accuracy: {test_acc*100:.2f}%")
print("=" * 60)
