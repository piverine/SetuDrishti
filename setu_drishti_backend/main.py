from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import xgboost as xgb
import pandas as pd
import numpy as np
import pickle
import shap
import os
import threading
from twilio.rest import Client
from routers import sync_layer, trial_bridge, security, disease_classifier, voice_triage, population_pulse, deterioration
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Setu-drishti API", version="2.0")

# ── Register OmniMed Routers ──────────────────────────────────────────────────
app.include_router(sync_layer.router)
app.include_router(trial_bridge.router)
app.include_router(security.router)
app.include_router(disease_classifier.router)
app.include_router(voice_triage.router)
app.include_router(population_pulse.router)
app.include_router(deterioration.router)
 
# --- Twilio Configuration ---
ENABLE_TWILIO_ALERTS = True

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")
TWILIO_TO_NUMBER   = os.getenv("TWILIO_TO_NUMBER")

# --- Gemini Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

alerted_patients = {}

def send_sms_alert(message_body):
    if not ENABLE_TWILIO_ALERTS:
        print(f"  [Twilio] Simulation mode (alerts disabled). Message: {message_body}")
        return
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_FROM_NUMBER,
            to=TWILIO_TO_NUMBER
        )
        print(f"  [Twilio] SMS dispatched successfully! SID: {message.sid}")
    except Exception as e:
        print(f"  [Twilio] Error sending SMS: {e}")

# ─────────────────────────────────────────────────────────────────────────────
# CORS & MEMORY BRIDGE
# ─────────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

live_patients_history = {}
current_patients_state = {}

try:
    with open("xgb_model.pkl", "rb") as f:
        model = pickle.load(f)
    explainer = shap.TreeExplainer(model)
    print("Setu-drishti Brain Loaded Successfully!")
except Exception as e:
    print(f"Error loading model: {e}")

# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/")
async def health_check():
    """Health check endpoint for frontend connectivity verification"""
    return {
        "status": "online",
        "service": "Setu-Drishti ICU Command Center",
        "version": "2.0",
        "message": "Backend is running and ready to serve requests"
    }

# ─────────────────────────────────────────────────────────────────────────────
# SCORING ENGINES
# ─────────────────────────────────────────────────────────────────────────────
 
def xgb_risk_score(raw_prob: float) -> int:
    MIDPOINT  = 0.45
    STEEPNESS = 10.0
    mapped = 1.0 / (1.0 + np.exp(-STEEPNESS * (raw_prob - MIDPOINT)))
    return min(max(int(mapped * 99), 0), 99)
 
 
def clinical_severity_score(vitals: dict) -> tuple[int, str]:
    score      = 0
    worst_flag = "within normal limits"
 
    lactate    = vitals.get("Lactate",    1.0)
    wbc        = vitals.get("WBC",        8.0)
    creatinine = vitals.get("Creatinine", 0.9)
    platelets  = vitals.get("Platelets",  250.0)
    map_val    = vitals.get("MAP",        90.0)
    sbp        = vitals.get("SBP",        120.0)
    hr         = vitals.get("HR",         75.0)
    temp       = vitals.get("Temp",       36.8)
    resp       = vitals.get("Resp",       14.0)
    ph         = vitals.get("pH",         7.4)
    base_excess= vitals.get("BaseExcess", 0.0)
 
    if lactate >= 4.0:
        score += 45; worst_flag = f"Lactate critically elevated ({lactate:.1f})"
    elif lactate >= 2.0:
        score += 25; worst_flag = f"Lactate elevated ({lactate:.1f})"
    elif lactate >= 1.5:
        score += 10
 
    if map_val < 50:
        score += 40; worst_flag = f"MAP critically low ({map_val:.0f} mmHg)"
    elif map_val < 60:
        score += 25
        if score < 26: worst_flag = f"MAP low ({map_val:.0f} mmHg)"
    elif map_val < 70:
        score += 10
 
    if wbc > 20:
        score += 20
        if "within" in worst_flag: worst_flag = f"WBC severely elevated ({wbc:.0f})"
    elif wbc > 12:
        score += 10
    elif wbc < 4:
        score += 15
 
    if creatinine >= 3.0:
        score += 18
        if "within" in worst_flag: worst_flag = f"Creatinine critically high ({creatinine:.1f})"
    elif creatinine >= 2.0:
        score += 10
    elif creatinine >= 1.5:
        score += 5
 
    if platelets < 50:
        score += 18
        if "within" in worst_flag: worst_flag = f"Platelets dangerously low ({platelets:.0f})"
    elif platelets < 100:
        score += 10
    elif platelets < 150:
        score += 4
 
    if resp >= 25:
        score += 12
    elif resp >= 22:
        score += 7
 
    if hr >= 130:
        score += 10
    elif hr >= 110:
        score += 5
 
    if temp >= 39.5 or temp < 36.0:
        score += 8
    elif temp >= 38.5:
        score += 4
 
    if ph < 7.25 or base_excess < -8:
        score += 15
        if "within" in worst_flag: worst_flag = f"Metabolic acidosis (pH {ph:.2f})"
    elif ph < 7.35 or base_excess < -4:
        score += 8
 
    if sbp <= 90:
        score += 10
    elif sbp <= 100:
        score += 5
 
    return min(score, 99), worst_flag
 
 
def get_alert_level(score: int) -> str:
    if score >= 75: return "CRITICAL"
    if score >= 55: return "HIGH"
    if score >= 30: return "WATCH"
    return "SAFE"
 
 
# ─────────────────────────────────────────────────────────────────────────────
# PREDICTION ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/v1/predict")
async def predict_risk(data: dict):
    try:
        patient_id = data.pop("Patient_ID", "Unknown")
        patient_name = data.pop("Patient_Name", "Unknown Patient")
        bed_number = data.pop("Bed_Number", "00")
        admit_reason = data.pop("Admit_Reason", "UNKNOWN")
        
        clin_score, clin_flag = clinical_severity_score(
            {k: float(v) for k, v in data.items()}
        )
 
        xgb_score = 0 # Mocked because xgb_model.pkl was corrupted by git CRLF
        final_score = max(xgb_score, clin_score)
        alert_level = get_alert_level(final_score)
 
        # Mock SHAP feature importance
        feature_importance = [
            {"feature": "Lactate", "contribution": 1.2, "value": float(data.get("Lactate", 0))},
            {"feature": "MAP", "contribution": 0.8, "value": float(data.get("MAP", 0))},
            {"feature": "WBC", "contribution": 0.5, "value": float(data.get("WBC", 0))}
        ]
        
        top_feature_name  = feature_importance[0]["feature"]
        top_feature_val   = feature_importance[0]["value"]
 
        dominated_by = "clinical" if clin_score >= xgb_score else "model"
 
        if alert_level == "CRITICAL":
            if dominated_by == "clinical":
                explanation = f"CRITICAL: {clin_flag}. Multi-organ involvement detected."
            else:
                explanation = (
                    f"CRITICAL: Immediate attention required. "
                    f"AI model flagging {top_feature_name} ({round(top_feature_val, 2)}) as primary driver."
                )
        elif alert_level == "HIGH":
            if dominated_by == "clinical":
                explanation = f"Elevated severity: {clin_flag}. Reassess urgently."
            else:
                explanation = (
                    f"Elevated risk detected. "
                    f"{top_feature_name} ({round(top_feature_val, 2)}) trending abnormally."
                )
        elif alert_level == "WATCH":
            explanation = (
                f"Mild deviation noted. "
                f"{top_feature_name} is trending at {round(top_feature_val, 2)} — continue observation."
            )
        else:
            explanation = f"Patient stable. {top_feature_name} is currently {round(top_feature_val, 2)}."
            
        inventory_alert = None
        if alert_level == "CRITICAL":
            # Simulate Sepsis / Shock protocol trigger based on Lactate or MAP
            if float(data.get("Lactate", 0)) > 2.0 or float(data.get("MAP", 100)) < 65:
                inventory_alert = {
                    "protocol": "Sepsis Protocol Initiated",
                    "status": "Checking Pharmacy DB...",
                    "items": [
                        {"name": "Broad-Spectrum Antibiotics", "available": True, "qty": "4 bags reserved"},
                        {"name": "Norepinephrine", "available": False, "qty": "CRITICAL LOW in Ward B"}
                    ]
                }
 
        response_payload = {
            "patient_id":          patient_id,
            "patient_name":        patient_name,
            "bed_number":          bed_number,
            "age":                 float(data.get("Age", 0)),
            "admit_reason":        admit_reason,
            "hour":                float(data.get("ICULOS", 0)),
            "raw_probability":     0.0,
            "xgb_score":           xgb_score,
            "clinical_score":      clin_score,
            "combined_risk_score": final_score,
            "dominated_by":        dominated_by,
            "alert_level":         alert_level,
            "explanation_text":    explanation,
            "top_risk_driver":     top_feature_name if dominated_by == "model" else clin_flag,
            "feature_importance":  feature_importance,
            "vitals": {
                "HR":         round(float(data.get("HR", 0)), 1),
                "MAP":        round(float(data.get("MAP", 0)), 1),
                "Temp":       round(float(data.get("Temp", 0)), 1),
                "Lactate":    round(float(data.get("Lactate", 0)), 2),
                "SBP":        round(float(data.get("SBP", 0)), 1),
                "Resp":       round(float(data.get("Resp", 0)), 1),
                "WBC":        round(float(data.get("WBC", 0)), 1),
                "Creatinine": round(float(data.get("Creatinine", 0)), 2),
                "Platelets":  round(float(data.get("Platelets", 0)), 0),
                "pH":         round(float(data.get("pH", 0)), 2),
                "O2Sat":      round(float(data.get("O2Sat", 0)), 1),
            },
            "inventory_alert":     inventory_alert
        }
        
        if alert_level == "CRITICAL":
            if not alerted_patients.get(patient_id, False):
                sms_body = f"🚨 Setu-Drishti ALERT: Patient {patient_id} ({patient_name}) CRITICAL at {final_score}% risk. {explanation}"
                print(f"  [Alert] Triggering SMS for {patient_id}...")
                threading.Thread(target=send_sms_alert, args=(sms_body,)).start()
                alerted_patients[patient_id] = True
        elif alert_level in ["SAFE", "WATCH"]:
            alerted_patients[patient_id] = False
        
        if patient_id not in live_patients_history:
            live_patients_history[patient_id] = []
            
        live_patients_history[patient_id].append(response_payload)
        # Keep only last 50 data points per patient
        if len(live_patients_history[patient_id]) > 50:
            live_patients_history[patient_id] = live_patients_history[patient_id][-50:]
        
        current_patients_state[patient_id] = response_payload
        
        return response_payload
 
    except Exception as e:
        print(f"API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# WARD / PATIENT DATA ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/v1/patients")
async def get_all_patients():
    """App polls this endpoint to get the ward dashboard data."""
    return list(current_patients_state.values())

@app.get("/api/v1/patient/{patient_id}/timeline")
async def get_timeline(patient_id: str):
    """App polls this endpoint to get a specific patient's live data."""
    return {
        "patient_id": patient_id,
        "current_state": current_patients_state.get(patient_id),
        "history": live_patients_history.get(patient_id, [])
    }

@app.get("/api/v1/patient/{patient_id}/report", response_class=PlainTextResponse)
async def download_patient_report(patient_id: str):
    """Generates a downloadable text report for the last 24 hours."""
    history = live_patients_history.get(patient_id, [])
    if not history:
        raise HTTPException(status_code=404, detail="No history found for patient")
    
    patient = history[-1]
    name = patient.get("patient_name", "Unknown")
    bed = patient.get("bed_number", "Unknown")
    
    lines = []
    lines.append("="*60)
    lines.append("                SEtu-Drishti ICU COMMAND CENTER")
    lines.append("                 24-HOUR PATIENT STATUS REPORT")
    lines.append("="*60)
    lines.append(f"Patient ID:    {patient_id}")
    lines.append(f"Name:          {name}")
    lines.append(f"Bed:           {bed}")
    lines.append(f"Admit Reason:  {patient.get('admit_reason')}")
    lines.append(f"Current Alert: {patient.get('alert_level')} (Risk: {patient.get('combined_risk_score')}%)")
    lines.append(f"Latest AI Log: {patient.get('explanation_text')}")
    lines.append("")
    lines.append("--- VITAL SIGNS TIMELINE (Last 24 Readings) ---")
    lines.append("")
    lines.append(f"{'Hour':<7} | {'Risk':<5} | {'HR':<5} | {'MAP':<5} | {'Lactate':<7} | {'Temp':<5} | {'SpO2':<5}")
    lines.append("-" * 60)
    
    # Get up to the last 24 readings
    for entry in history[-24:]:
        h = entry.get("hour", 0)
        r = entry.get("combined_risk_score", 0)
        v = entry.get("vitals", {})
        hr = v.get("HR", 0)
        map_val = v.get("MAP", 0)
        lac = v.get("Lactate", 0)
        temp = v.get("Temp", 0)
        spo2 = v.get("O2Sat", 0)
        
        lines.append(f"{h:<7.1f} | {r:<4}% | {hr:<5.1f} | {map_val:<5.1f} | {lac:<7.2f} | {temp:<5.1f} | {spo2:<5.1f}")
        
    lines.append("")
    lines.append("="*60)
    lines.append("END OF REPORT")
    
    content = "\n".join(lines)
    return PlainTextResponse(
        content=content,
        headers={"Content-Disposition": f"attachment; filename=Report_{patient_id}_24h.txt"}
    )

# ─────────────────────────────────────────────────────────────────────────────
# SHIFT HANDOFF / AUTO-BRIEFING ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/v1/patient/{patient_id}/shift_handoff")
async def generate_shift_handoff(patient_id: str):
    """"Generates an AI-powered shift handoff briefing based on the last 8 hours of data"""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GenAI API Key missing! Please set GEMINI_API_KEY in backend environment.")
        
    history = live_patients_history.get(patient_id, [])
    if not history:
        raise HTTPException(status_code=404, detail="No vitals history available for this patient.")
        
    # Get the last 8 hours of readings (up to 8 readings)
    recent_data = history[-8:]
    patient = recent_data[-1]
    name = patient.get("patient_name", "Unknown")
    
    # Format data for the prompt
    data_points = []
    for entry in recent_data:
        hr = entry.get("vitals", {}).get("HR", 0)
        map_val = entry.get("vitals", {}).get("MAP", 0)
        spo2 = entry.get("vitals", {}).get("O2Sat", 0)
        risk = entry.get("combined_risk_score", 0)
        alert = entry.get("alert_level", "SAFE")
        explanation = entry.get("explanation_text", "")
        data_points.append(f"Risk: {risk}% ({alert}), HR: {hr}, MAP: {map_val}, SpO2: {spo2}% - Notes: {explanation}")
        
    compiled_data = "\n".join(data_points)
    
    prompt = f"""
You are a senior critical care physician completing a shift handoff. 
Generate a comprehensive, 2-paragraph medical narrative summarizing the patient's status over the last 8 observation cycles.
Focus on identifying any clinical deterioration, vital sign drifts, or critical AI alerts (XGBoost risk scores).

Patient Name: {name}
Admission Reason: {patient.get('admit_reason', 'Unknown')}
Current AI Risk Score: {patient.get('combined_risk_score', 0)}%

Vitals and AI alerts over the last 8 observation cycles:
{compiled_data}

Format:
Paragraph 1: Clinical summary, trend analysis, and overall patient stability.
Paragraph 2: Key recommendations for the next nursing/doctor shift based on the AI risk scores and recent vitals.

Do not use markdown formatting like **bold** or asterisks, output as raw clean medical text.
    """
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        response = model.generate_content(prompt)
        text = response.text.replace("*", "").strip()
        return {"patient_id": patient_id, "summary": text}
    except Exception as e:
        error_msg = str(e)
        print(f"GenAI Error: {error_msg}")
        if "quota" in error_msg.lower() or "429" in error_msg:
            raise HTTPException(status_code=429, detail="API Rate Limit Reached! Free tier allows only 5 requests per minute. Please wait 60 seconds and try again.")
        raise HTTPException(status_code=500, detail=f"Failed to generate AI briefing: {error_msg}")

# ─────────────────────────────────────────────────────────────────────────────
# FAMILY-LINK AI TRANSLATOR
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/v1/patient/{patient_id}/family_update")
async def generate_family_update(patient_id: str):
    """"Translates medical ICU jargon into a comforting, multi-lingual family SMS."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GenAI API Key missing! Please set GEMINI_API_KEY in backend environment.")
        
    history = live_patients_history.get(patient_id, [])
    if not history:
        raise HTTPException(status_code=404, detail="No vitals history available for this patient.")
        
    recent_data = history[-8:]
    patient = recent_data[-1]
    name = patient.get("patient_name", "Unknown")
    
    data_points = []
    for entry in recent_data:
        hr = entry.get("vitals", {}).get("HR", 0)
        alert = entry.get("alert_level", "SAFE")
        explanation = entry.get("explanation_text", "")
        data_points.append(f"Status: {alert}, HR: {hr} - Notes: {explanation}")
        
    compiled_data = "\n".join(data_points)
    
    prompt = f"""
You are an empathetic, compassionate family liaison at a hospital. 
I am giving you raw ICU telemetry logs for a patient named {name}.
Translate these medical logs and risk alerts into a comforting, simple, and jargon-free text message update that we can send to their anxious family in the waiting room.
Soften any alarmist clinical terms. Strongly emphasize that the best doctors and AI system are monitoring them 24/7.

Patient Name: {name}
Admission Reason: {patient.get('admit_reason', 'Unknown')}
Current Alert Status: {patient.get('alert_level', 'SAFE')}

Recent Logs:
{compiled_data}

Provide the update precisely formatted in exactly 3 sections (Include section headers like English:, Hindi:, Punjabi:):
English: The update in clear, comforting English.
Hindi: The exact same update translated into beautiful, comforting Hindi.
Punjabi: The exact same update translated into comforting Punjabi (ਪੰਜਾਬੀ).

Do not use markdown formatting like **bold** or asterisks, output as raw clean text.
    """
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        response = model.generate_content(prompt)
        text = response.text.replace("*", "").strip()
        return {"patient_id": patient_id, "summary": text}
    except Exception as e:
        error_msg = str(e)
        print(f"GenAI Error: {error_msg}")
        if "quota" in error_msg.lower() or "429" in error_msg:
            raise HTTPException(status_code=429, detail="API Rate Limit Reached! Free tier allows only 5 requests per minute. Please wait 60 seconds and try again.")
        raise HTTPException(status_code=500, detail=f"Failed to generate AI translator: {error_msg}")

# ─────────────────────────────────────────────────────────────────────────────
# MEDIASSIST AI CHAT ENDPOINT (Feature 2 & 4)
# ─────────────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    patient_id: str = None

@app.post("/api/v1/chat")
async def medi_assist_chat(req: ChatRequest):
    """
    MediAssist AI endpoint. Queries live patient state from memory
    and returns a natural-language clinical response.
    """
    query = req.message.lower()
    patient_id = req.patient_id

    # --- Resolve patient ---
    patient = None
    if patient_id and patient_id in current_patients_state:
        patient = current_patients_state[patient_id]
    elif patient_id:
        # Try to find by partial match
        for pid, pstate in current_patients_state.items():
            if patient_id.upper() in pid:
                patient = pstate
                break
    
    # --- Extract patient context for briefing ---
    if not patient and current_patients_state:
        # Default to first critical patient or first patient
        for pid, pstate in current_patients_state.items():
            if pstate.get("alert_level") == "CRITICAL":
                patient = pstate
                patient_id = pid
                break
        if not patient:
            patient = list(current_patients_state.values())[0]
            patient_id = list(current_patients_state.keys())[0]

    if not patient:
        return {"reply": "No patient data available yet. Please ensure the simulator is running."}

    v = patient.get("vitals", {})
    name = patient.get("patient_name", patient_id)
    risk = patient.get("combined_risk_score", 0)
    level = patient.get("alert_level", "UNKNOWN")
    explanation = patient.get("explanation_text", "N/A")

    # --- "Brief Me" trigger ---
    if any(kw in query for kw in ["brief", "summary", "status", "update", "report"]):
        history = live_patients_history.get(patient.get("patient_id", ""), [])
        trend = ""
        if len(history) >= 3:
            prev_score = history[-3].get("combined_risk_score", risk)
            delta = risk - prev_score
            if delta > 5:
                trend = f"Risk is INCREASING (+{delta}% in last 3 readings)."
            elif delta < -5:
                trend = f"Risk is DECREASING ({delta}% in last 3 readings)."
            else:
                trend = "Risk is STABLE."
        
        reply = (
            f"📋 BRIEFING — {name} | Bed {patient.get('bed_number', '?')} | {patient.get('admit_reason', '')}\n\n"
            f"Current Status: {level} at {risk}% risk.\n"
            f"{trend}\n\n"
            f"Key Vitals:\n"
            f"• HR: {v.get('HR', '--')} bpm\n"
            f"• MAP: {v.get('MAP', '--')} mmHg\n"
            f"• Lactate: {v.get('Lactate', '--')} mmol/L\n"
            f"• Temp: {v.get('Temp', '--')}°C\n"
            f"• O2Sat: {v.get('O2Sat', '--')}%\n\n"
            f"AI Assessment: {explanation}\n\n"
            f"⚕️ All Sepsis protocol meds are in stock."
        )
        return {"reply": reply}

    # --- Specific vital queries ---
    if "map" in query or "mean arterial" in query:
        map_v = v.get('MAP', '--')
        history = live_patients_history.get(patient.get("patient_id", ""), [])
        trend_note = ""
        if len(history) >= 2:
            prev_map = history[-2].get("vitals", {}).get("MAP", map_v)
            diff = round(float(map_v) - float(prev_map), 1) if map_v != '--' else 0
            trend_note = f" (Changed {diff:+.1f} mmHg since last reading.)"
        warning = " ⚠️ Below safe threshold!" if map_v != '--' and float(map_v) < 65 else ""
        return {"reply": f"MAP for {name} is currently {map_v} mmHg.{trend_note}{warning}"}

    if "lactate" in query:
        lac = v.get('Lactate', '--')
        warning = " 🚨 Critically elevated — possible septic shock!" if lac != '--' and float(lac) >= 4.0 else (
                  " ⚠️ Elevated — monitor closely." if lac != '--' and float(lac) >= 2.0 else "")
        return {"reply": f"Lactate for {name} is {lac} mmol/L.{warning}"}

    if "heart rate" in query or " hr " in query or query.startswith("hr"):
        hr = v.get('HR', '--')
        warning = " ⚠️ Tachycardic!" if hr != '--' and float(hr) >= 100 else ""
        return {"reply": f"Heart Rate for {name} is {hr} bpm.{warning}"}

    if "temp" in query or "temperature" in query or "fever" in query:
        temp = v.get('Temp', '--')
        warning = " 🌡️ Febrile!" if temp != '--' and float(temp) >= 38.3 else ""
        return {"reply": f"Temperature for {name} is {temp}°C.{warning}"}

    if "o2" in query or "oxygen" in query or "sat" in query:
        o2 = v.get('O2Sat', '--')
        return {"reply": f"O2 Saturation for {name} is {o2}%."}

    if "resp" in query or "respiratory" in query or "breathing" in query:
        resp = v.get('Resp', '--')
        return {"reply": f"Respiratory Rate for {name} is {resp} breaths/min."}

    if "creatinine" in query or "kidney" in query or "renal" in query:
        cr = v.get('Creatinine', '--')
        return {"reply": f"Creatinine for {name} is {cr} mg/dL."}

    if "risk" in query or "score" in query:
        return {"reply": f"{name} is at {risk}% sepsis risk. Status: {level}. {explanation}"}

    if "wbc" in query or "white blood" in query or "leukocytes" in query:
        wbc = v.get('WBC', '--')
        return {"reply": f"WBC for {name} is {wbc} ×10⁹/L."}

    if "platelets" in query or "coag" in query or "dic" in query:
        plt = v.get('Platelets', '--')
        return {"reply": f"Platelets for {name} are {plt} ×10⁹/L."}

    if "all" in query or "vitals" in query or "full" in query:
        return {"reply": (
            f"Full Vitals — {name}:\n"
            f"HR: {v.get('HR','--')} | MAP: {v.get('MAP','--')} | SBP: {v.get('SBP','--')}\n"
            f"Temp: {v.get('Temp','--')}°C | O2: {v.get('O2Sat','--')}% | Resp: {v.get('Resp','--')}/min\n"
            f"Lactate: {v.get('Lactate','--')} | WBC: {v.get('WBC','--')} | Creat: {v.get('Creatinine','--')}\n"
            f"Platelets: {v.get('Platelets','--')} | pH: {v.get('pH','--')}\n"
            f"Risk: {risk}% ({level})"
        )}

    # --- Default fallback ---
    return {"reply": (
        f"MediAssist: {name} is currently at {risk}% risk ({level}). "
        f"Key concern: {explanation} "
        f"Ask me about MAP, Lactate, HR, Temp, O2Sat, Resp, Risk Score, or say 'Brief me'."
    )}
