/* ══════════════════════════════════════════════════════════════
   Setu-Drishti API Client
   Backend URL is set via VITE_API_URL environment variable.
   On Vercel: set VITE_API_URL = https://your-app.onrender.com
   Locally: falls back to http://localhost:8000
══════════════════════════════════════════════════════════════ */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const OmniAPI = {
  async healthCheck() {
    const res = await fetch(`${API_BASE}/`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('Backend unreachable');
    return res.json();
  },

  async analyzeImage(base64String) {
    const res = await fetch(`${API_BASE}/api/v1/analyze_image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: base64String }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Server error ${res.status}`); }
    return res.json();
  },

  async analyzeTone(transcribed_text, audio_base64 = '') {
    const res = await fetch(`${API_BASE}/api/v1/voice/analyze_tone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_base64, transcribed_text }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Server error ${res.status}`); }
    return res.json();
  },

  async matchTrials(medical_text) {
    const res = await fetch(`${API_BASE}/api/v1/trials/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medical_text }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Server error ${res.status}`); }
    return res.json();
  },

  async auditEHR(provider_role, access_hour, billing_coherence_score) {
    const res = await fetch(`${API_BASE}/api/v1/security/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_role, access_hour, billing_coherence_score }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Server error ${res.status}`); }
    return res.json();
  },

  async syncPatient(patient_id, clinical_notes, vitals_drift_score) {
    const res = await fetch(`${API_BASE}/api/v1/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id, clinical_notes, vitals_drift_score }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Server error ${res.status}`); }
    return res.json();
  },

  /* ── Deterioration Model ─────────────────────────────────── */
  async predictDeterioration(vitals) {
    const res = await fetch(`${API_BASE}/api/v1/deterioration/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitals),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Server error ${res.status}`); }
    return res.json();
  },
};

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
