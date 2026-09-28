from fastapi import APIRouter
from pydantic import BaseModel
import joblib
import numpy as np

router = APIRouter()

# Load the ML models on startup
model = joblib.load("ml_models/sentineliq_isolation_forest.joblib")
encoder = joblib.load("ml_models/sentineliq_label_encoder.joblib")

class AccessLog(BaseModel):
    provider_role: str
    access_hour: int
    billing_coherence_score: float

@router.post("/api/v1/security/audit")
async def audit_ehr_access(log: AccessLog):
    # Encode the text role to a number
    try:
        role_encoded = encoder.transform([log.provider_role])[0]
    except ValueError:
        role_encoded = 0 # Fallback for unknown roles
        
    features = np.array([[role_encoded, log.access_hour, log.billing_coherence_score]])
    
    # Predict (-1 is anomaly, 1 is normal)
    prediction = model.predict(features)[0]
    is_fraud = bool(prediction == -1)
    
    return {
        "is_anomaly": is_fraud,
        "action_taken": "FLAGGED_FOR_REVIEW" if is_fraud else "CLEARED"
    }