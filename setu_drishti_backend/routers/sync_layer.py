from fastapi import APIRouter
from pydantic import BaseModel
from database import save_patient_record


router = APIRouter()


class SyncPayload(BaseModel):
    patient_id: str
    clinical_notes: str
    vitals_drift_score: float
    location_block: str = "Unknown"
    diagnosis_tags: str = ""
    medication_used: str = ""


@router.post("/api/v1/sync")
async def sync_offline_data(payload: SyncPayload):
    # Save the synced data to Firestore
    save_patient_record(
        patient_id=payload.patient_id,
        location_block=payload.location_block,
        clinical_notes=payload.clinical_notes,
        diagnosis_tags=payload.diagnosis_tags,
        medication_used=payload.medication_used,
        vitals_drift_score=payload.vitals_drift_score
    )

    return {
        "status": "success",
        "message": "Offline payload synced to Firestore cloud.",
        "bytes_processed": len(payload.clinical_notes)
    }