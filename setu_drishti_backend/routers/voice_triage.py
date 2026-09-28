from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter()

class VoicePayload(BaseModel):
    audio_base64: str
    transcribed_text: str

@router.post("/api/v1/voice/analyze_tone")
async def analyze_voice_tone(payload: VoicePayload):
    """
    Hackathon Mock: Analyzes the vocal acoustic markers and transcribed sentiment 
    to automatically flag high-stress or emergency patient scenarios.
    """
    text = payload.transcribed_text.lower()
    
    # 1. Linguistic Sentiment & Stress Triage Logic
    critical_keywords = ["pain", "agony", "chest", "hurting", "blood", "help", "emergency", "dying"]
    moderate_keywords = ["uncomfortable", "dizzy", "fever", "nausea", "sick"]
    
    # 2. Mathematically weight the acoustic urgency simulation
    urgency_percentage = 15.0 # Base minimum variance
    detected_emotions = ["Calm"]
    triage_color = "GREEN"
    recommendation = "Standard Priority. Log to EHR."

    # Analyze critical phrases
    if any(word in text for word in critical_keywords):
        urgency_percentage = random.uniform(82.5, 98.9)
        detected_emotions = ["Distress", "Fear", "High Pain"]
        triage_color = "RED"
        recommendation = "CRITICAL: Immediate Nurse Dispatch Required!"
    elif any(word in text for word in moderate_keywords):
        urgency_percentage = random.uniform(45.0, 68.5)
        detected_emotions = ["Anxious", "Uncomfortable"]
        triage_color = "YELLOW"
        recommendation = "Elevated Priority. Monitor closely."
        
    return {
        "analyzed_transcript": payload.transcribed_text,
        "acoustic_urgency_score": round(urgency_percentage, 1),
        "detected_emotions": detected_emotions,
        "triage_color": triage_color,
        "recommendation": recommendation
    }
