import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()  # ← loads your .env file

# Initialize Firebase only once
if not firebase_admin._apps:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

# Firestore client
db = firestore.client()

# ─── Helper: Patient Records ───────────────────────────────────────

def save_patient_record(patient_id: str, location_block: str, clinical_notes: str,
                         diagnosis_tags: str, medication_used: str, vitals_drift_score: float):
    """Save or update a patient record in Firestore."""
    doc_ref = db.collection("patient_records").document(patient_id)
    doc_ref.set({
        "patient_id": patient_id,
        "location_block": location_block,
        "clinical_notes": clinical_notes,
        "diagnosis_tags": diagnosis_tags,
        "medication_used": medication_used,
        "vitals_drift_score": vitals_drift_score,
        "sync_time": firestore.SERVER_TIMESTAMP
    })
    print(f"✅ Patient {patient_id} saved to Firestore.")

def get_patient_record(patient_id: str):
    """Fetch a single patient record by ID."""
    doc = db.collection("patient_records").document(patient_id).get()
    if doc.exists:
        return doc.to_dict()
    return None

def get_all_patient_records():
    """Fetch all patient records."""
    docs = db.collection("patient_records").stream()
    return [doc.to_dict() for doc in docs]

# ─── Helper: Supply Inventory ───────────────────────────────────────

def save_supply(medication_name: str, current_stock: int, daily_burn_rate: float):
    """Save or update a supply item in Firestore."""
    doc_ref = db.collection("supply_inventory").document(medication_name)
    doc_ref.set({
        "medication_name": medication_name,
        "current_stock": current_stock,
        "daily_burn_rate": daily_burn_rate
    })

def get_supply(medication_name: str):
    """Fetch a single supply item."""
    doc = db.collection("supply_inventory").document(medication_name).get()
    if doc.exists:
        return doc.to_dict()
    return None

def get_all_supplies():
    """Fetch all supply inventory."""
    docs = db.collection("supply_inventory").stream()
    return [doc.to_dict() for doc in docs]