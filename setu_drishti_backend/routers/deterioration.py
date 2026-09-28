"""
Deterioration Model Router — Setu-Drishti v2.0
Serves predictions from ml_models/deterioration_model.json
XGBoost model trained on PhysioNet sepsis dataset (40 clinical features).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import xgboost as xgb
import pandas as pd
import numpy as np

router = APIRouter()

# ── Load the deterioration model ──────────────────────────────────────────────
try:
    det_model = xgb.Booster()
    det_model.load_model("ml_models/deterioration_model.json")
    DETERIORATION_FEATURES = det_model.feature_names
    print(f"✅ Deterioration Model loaded. Features: {len(DETERIORATION_FEATURES)}")
except Exception as e:
    det_model = None
    DETERIORATION_FEATURES = [
        'HR', 'O2Sat', 'Temp', 'SBP', 'MAP', 'DBP', 'Resp', 'EtCO2',
        'BaseExcess', 'HCO3', 'FiO2', 'pH', 'PaCO2', 'SaO2', 'AST',
        'BUN', 'Alkalinephos', 'Calcium', 'Chloride', 'Creatinine',
        'Bilirubin_direct', 'Glucose', 'Lactate', 'Magnesium', 'Phosphate',
        'Potassium', 'Bilirubin_total', 'TroponinI', 'Hct', 'Hgb', 'PTT',
        'WBC', 'Fibrinogen', 'Platelets', 'Age', 'Gender', 'Unit1', 'Unit2',
        'HospAdmTime', 'ICULOS'
    ]
    print(f"⚠️ Deterioration Model failed to load: {e}")


class DeteriorationRequest(BaseModel):
    # Core vitals (most commonly available at bedside)
    HR: float = 80.0
    O2Sat: float = 97.0
    Temp: float = 37.0
    SBP: float = 120.0
    MAP: float = 85.0
    DBP: float = 75.0
    Resp: float = 16.0
    # Lab values
    BaseExcess: float = 0.0
    HCO3: float = 24.0
    pH: float = 7.40
    Lactate: float = 1.0
    Glucose: float = 110.0
    Creatinine: float = 0.9
    WBC: float = 8.0
    Platelets: float = 250.0
    Hgb: float = 13.0
    Hct: float = 40.0
    # Advanced labs (optional — default to normal)
    EtCO2: float = 35.0
    FiO2: float = 0.21
    PaCO2: float = 40.0
    SaO2: float = 97.0
    AST: float = 25.0
    BUN: float = 15.0
    Alkalinephos: float = 70.0
    Calcium: float = 9.0
    Chloride: float = 102.0
    Bilirubin_direct: float = 0.2
    Magnesium: float = 2.0
    Phosphate: float = 3.5
    Potassium: float = 4.0
    Bilirubin_total: float = 0.8
    TroponinI: float = 0.01
    PTT: float = 30.0
    Fibrinogen: float = 300.0
    # Patient demographics
    Age: float = 55.0
    Gender: float = 1.0   # 1=Male, 0=Female
    Unit1: float = 1.0
    Unit2: float = 0.0
    HospAdmTime: float = -24.0
    ICULOS: float = 1.0
    # Metadata (not used by model)
    patient_id: str = "UNKNOWN"


def sigmoid_to_percent(raw_score: float) -> int:
    """Map a raw XGBoost probability [0,1] to a 0-99 display score with emphasis on high end."""
    MIDPOINT = 0.40
    STEEPNESS = 9.0
    mapped = 1.0 / (1.0 + np.exp(-STEEPNESS * (raw_score - MIDPOINT)))
    return min(max(int(mapped * 99), 0), 99)


def get_alert_level(score: int) -> str:
    if score >= 75: return "CRITICAL"
    if score >= 55: return "HIGH"
    if score >= 30: return "WATCH"
    return "SAFE"


def compute_top_drivers(df: pd.DataFrame, raw_prob: float, vitals: dict) -> list[dict]:
    """
    Heuristic feature-importance based on clinical thresholds.
    Returns top-3 contributors with direction and clinical name.
    """
    drivers = []

    # Score each feature by its deviation from normal
    checks = [
        ("Lactate",     vitals.get("Lactate", 1.0),     1.0,  4.0,  "Serum Lactate",    True),
        ("MAP",         vitals.get("MAP", 85.0),         65.0, 100.0,"Mean Art. Pressure",False),
        ("HR",          vitals.get("HR", 80.0),          60.0, 100.0,"Heart Rate",        True),
        ("Resp",        vitals.get("Resp", 16.0),        12.0, 20.0, "Resp. Rate",        True),
        ("Temp",        vitals.get("Temp", 37.0),        36.0, 38.3, "Core Temp",         True),
        ("Creatinine",  vitals.get("Creatinine", 0.9),   0.5,  1.2,  "Creatinine",        True),
        ("WBC",         vitals.get("WBC", 8.0),          4.0,  11.0, "WBC Count",         True),
        ("pH",          vitals.get("pH", 7.40),          7.35, 7.45, "Blood pH",          False),
        ("O2Sat",       vitals.get("O2Sat", 97.0),       94.0, 100.0,"SpO2",              False),
        ("Platelets",   vitals.get("Platelets", 250.0),  150.0,400.0,"Platelets",         False),
    ]

    for feat, val, lo, hi, label, higher_is_worse in checks:
        if val > hi:
            magnitude = (val - hi) / (hi - lo + 0.01)
            contribution = min(magnitude, 1.5) * (1 if higher_is_worse else -1)
        elif val < lo:
            magnitude = (lo - val) / (hi - lo + 0.01)
            contribution = -min(magnitude, 1.5) * (1 if higher_is_worse else 1)
        else:
            contribution = 0.0

        if abs(contribution) > 0.01:
            drivers.append({
                "feature": label,
                "value": round(val, 2),
                "contribution": round(contribution, 3)
            })

    # Sort by absolute contribution, return top 3
    drivers.sort(key=lambda x: abs(x["contribution"]), reverse=True)
    return drivers[:4]


@router.post("/api/v1/deterioration/predict")
async def predict_deterioration(req: DeteriorationRequest):
    if det_model is None:
        raise HTTPException(status_code=503, detail="Deterioration model not loaded on server.")

    try:
        vitals_dict = req.dict(exclude={"patient_id"})

        # Build DataFrame aligned to model's feature order
        row = {feat: vitals_dict.get(feat, 0.0) for feat in DETERIORATION_FEATURES}
        df = pd.DataFrame([row])[DETERIORATION_FEATURES]
        dmatrix = xgb.DMatrix(df)

        raw_probs = det_model.predict(dmatrix)
        raw_prob = float(raw_probs[0])

        risk_score = sigmoid_to_percent(raw_prob)
        alert_level = get_alert_level(risk_score)

        top_drivers = compute_top_drivers(df, raw_prob, vitals_dict)
        top_feature = top_drivers[0]["feature"] if top_drivers else "clinical profile"

        # Generate explanation
        if alert_level == "CRITICAL":
            explanation = (
                f"CRITICAL DETERIORATION RISK: Immediate escalation required. "
                f"{top_feature} is the primary driver of elevated risk."
            )
        elif alert_level == "HIGH":
            explanation = (
                f"Elevated deterioration risk detected. "
                f"Monitor {top_feature} closely and reassess within 1 hour."
            )
        elif alert_level == "WATCH":
            explanation = (
                f"Mild deterioration signals. {top_feature} trending abnormally. "
                f"Continue observation — reassess in 2 hours."
            )
        else:
            explanation = (
                f"Patient trajectory stable. {top_feature} within acceptable range. "
                f"Continue standard monitoring protocol."
            )

        return {
            "patient_id": req.patient_id,
            "raw_probability": round(raw_prob, 4),
            "risk_score": risk_score,
            "alert_level": alert_level,
            "explanation": explanation,
            "top_drivers": top_drivers,
            "vitals_summary": {
                "HR": req.HR,
                "MAP": req.MAP,
                "Temp": req.Temp,
                "Lactate": req.Lactate,
                "O2Sat": req.O2Sat,
                "Resp": req.Resp,
                "pH": req.pH,
                "Creatinine": req.Creatinine,
                "WBC": req.WBC,
            }
        }

    except Exception as e:
        print(f"Deterioration prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
