"""
GramSeva Health — AI Triage Training Script using dataset.csv
=============================================================
This script parses the raw `dataset.csv` (disease,symptom1,symptom2,...)
into a one-hot encoded dataframe, trains the RandomForest model,
and exports all required artifacts for server.py.
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
import sys
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split, cross_val_score

# ─── PATHS ────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(os.path.dirname(os.path.dirname(BASE_DIR)), "ml training")
DATASET_CSV = os.path.join(DATA_DIR, "dataset.csv")

MODEL_OUT       = os.path.join(BASE_DIR, "triage_model.pkl")
LE_OUT          = os.path.join(BASE_DIR, "label_encoder.pkl")
COLS_OUT        = os.path.join(BASE_DIR, "symptom_columns.json")
SPECIALIST_OUT  = os.path.join(BASE_DIR, "specialist_map.json")
METRICS_OUT     = os.path.join(BASE_DIR, "model_metrics.json")

# ─── SPECIALIST & URGENCY MAPPING ─────────────────────────────────────────────
SPECIALIST_MAP = {
    "Fungal infection":             "Dermatologist",
    "Allergy":                      "Allergist / Immunologist",
    "GERD":                         "Gastroenterologist",
    "Chronic cholestasis":          "Gastroenterologist",
    "Drug Reaction":                "Dermatologist",
    "Peptic ulcer diseae":          "Gastroenterologist",
    "AIDS":                         "Infectious Disease",
    "Diabetes ":                    "Endocrinologist",
    "Gastroenteritis":              "Gastroenterologist",
    "Bronchial Asthma":             "Pulmonologist",
    "Hypertension ":                "Cardiologist",
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
    "Diabetes ":                    "medium",
    "Hypertension ":                "medium",
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

# ─── DATA LOADING & PARSING ───────────────────────────────────────────────────
print(f"Reading {DATASET_CSV}...")
if not os.path.exists(DATASET_CSV):
    print(f"❌ ERROR: {DATASET_CSV} not found!")
    sys.exit(1)

with open(DATASET_CSV, "r") as f:
    lines = f.readlines()

parsed_data = []
all_symptoms = set()

for line in lines:
    line = line.strip()
    # Skip empty lines or headers consisting of only commas
    if not line or line.replace(",", "").strip() == "":
        continue
        
    parts = [p.strip() for p in line.split(",")]
    parts = [p for p in parts if p] # Remove empty parts
    if len(parts) < 2:
        continue
    
    disease = parts[0]
    symptoms = parts[1:]
    
    # Normalize symptom names 
    norm_symptoms = [s.strip().replace(" ", "_") for s in symptoms]
    
    parsed_data.append({"disease": disease, "symptoms": norm_symptoms})
    all_symptoms.update(norm_symptoms)

SYMPTOM_COLUMNS = sorted(list(all_symptoms))
print(f"   Parsed {len(parsed_data)} valid rows.")
print(f"   Found {len(SYMPTOM_COLUMNS)} unique symptoms.")

# Build one-hot encoded dataset
print("\nBuilding one-hot encoded dataset...")
df_data = []
for row in parsed_data:
    entry = {"prognosis": row["disease"]}
    for sym in SYMPTOM_COLUMNS:
        entry[sym] = 1 if sym in row["symptoms"] else 0
    df_data.append(entry)

df = pd.DataFrame(df_data)

X = df.drop("prognosis", axis=1)
y = df["prognosis"]

print(f"   Shape: {df.shape}")
print(f"   Unique Diseases: {y.nunique()}")

# ─── LABEL ENCODE & SPLIT ─────────────────────────────────────────────────────
le = LabelEncoder()
y_enc = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)

# ─── MODEL TRAINING ───────────────────────────────────────────────────────────
print("\n🌲 Training RandomForest (300 trees)...")
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=20,
    min_samples_leaf=2,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)
model.fit(X_train, y_train)

# ─── EVALUATION ───────────────────────────────────────────────────────────────
y_pred = model.predict(X_test)
test_acc = accuracy_score(y_test, y_pred)
print(f"\n✅ Test Accuracy: {test_acc * 100:.2f}%")

cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="accuracy")
print(f"📊 CV Mean Accuracy: {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")

report_dict = classification_report(y_test, y_pred, target_names=le.classes_, output_dict=True, zero_division=0)

# Feature Importance
importances = model.feature_importances_
feat_imp = sorted(zip(SYMPTOM_COLUMNS, importances), key=lambda x: -x[1])
top_20 = feat_imp[:20]

# ─── SAVE ARTIFACTS ───────────────────────────────────────────────────────────
print("\n💾 Saving artifacts to allow server.py to use the new model...")
joblib.dump(model, MODEL_OUT)
joblib.dump(le, LE_OUT)

with open(COLS_OUT, "w") as f:
    json.dump(SYMPTOM_COLUMNS, f, indent=2)

with open(SPECIALIST_OUT, "w") as f:
    json.dump(SPECIALIST_MAP, f, indent=2)

metrics = {
    "test_accuracy": round(test_acc, 4),
    "cv_mean_accuracy": round(float(cv_scores.mean()), 4),
    "cv_std": round(float(cv_scores.std()), 4),
    "n_diseases": len(le.classes_),
    "n_symptoms": len(SYMPTOM_COLUMNS),
    "top_20_features": [{"symptom": f, "importance": round(float(i), 4)} for f, i in top_20],
    "diseases": list(le.classes_)
}

with open(METRICS_OUT, "w") as f:
    json.dump(metrics, f, indent=2)

print("\n🎉 Training using dataset.csv complete!")
