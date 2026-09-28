# Setu-Drishti 2.0 × OmniMed AI Suite

> **Live demo:** [setu-drishti-hpmu.vercel.app](https://setu-drishti-hpmu.vercel.app/)
>
> **Demo note:** The backend is hosted on Render. Please wait a few minutes for it to start or wake from its free-tier sleep before testing the dashboard; the first request may take longer than usual.

**Setu-Drishti 2.0** is an advanced, fully-integrated ICU Command Center and AI-driven Clinical OS. It combines real-time patient telemetry monitoring with a cutting-edge suite of 6 artificial intelligence models (OmniMed) to assist medical personnel in triage, diagnosis, and workflow optimization.

---

## 🌟 Key Features

### 1. ICU Command Dashboard
- **Live Digital Twin:** Real-time visualization of ICU wards across multiple beds.
- **Combined Risk Scoring:** Live algorithms synthesizing HR, MAP, SpO2, Lactate, and clinical severity scores.
- **Actionable Alerts:** Dynamic prioritization of critical patients with visual & auditory cues.
- **Automated Sepsis Supply Chain Trigger:** Auto-queries Pharmacy DB when a patient enters Sepsis protocol.
- **Dynamic UX Toggling:** Instantly switch between Dark Mode and Light Mode across web and mobile.
- **Multi-Modal GenAI Auto-Briefing:** Generates AI shift handoff narratives via Google Gemini.
- **AR Lens Bed Scanner:** Mobile AR camera — doctors scan bed QR codes for live holographic readouts.
- **Family-Link GenAI Translator:** Converts raw ICU telemetry into family-friendly updates in English, Hindi, and Punjabi.

### 2. OmniMed AI Subsystems
- **SentinelIQ:** Anomaly detection on patient vitals using XGBoost models.
- **Nidana Vision:** CNN scanner for dermatological clustering and lesion diagnosis.
- **PulseWatch:** Real-time anomaly drift visualization powered by IoT simulation.
- **ToneScore Voice AI:** NLP-based acoustic urgency analysis.
- **TrialBridge:** Semantic similarity matching to link patient symptoms to experimental treatments.
- **District Pulse:** Geospatial clustering of symptom outbreaks using KD-Tree mapping.

---

## 🏗️ Project Structure

```
Setu-Drishti/                      ← You are here
│
├── setu_drishti_backend/          ← FastAPI backend + all AI models
│   ├── main.py                    ← App entry point & all ICU endpoints
│   ├── simulator.py               ← ICU patient data simulator (run separately)
│   ├── requirements.txt           ← Python dependencies
│   ├── start.sh                   ← Render cloud startup script
│   ├── Dockerfile                 ← Docker container config
│   ├── ml_models/                 ← Pre-trained model weights
│   └── routers/
│       ├── disease_classifier.py  ← POST /api/v1/disease/classify
│       ├── trial_bridge.py        ← POST /api/v1/trials/match
│       ├── security.py            ← POST /api/v1/security/audit
│       ├── sync_layer.py          ← POST /api/v1/sync
│       ├── voice_triage.py        ← POST /api/v1/voice/analyze_tone
│       ├── population_pulse.py    ← GET  /api/v1/population/dashboard
│       └── deterioration.py       ← POST /api/v1/deterioration/predict
│
├── setu_drishti_web/              ← React + Vite web dashboard
│   ├── src/
│   │   ├── main.jsx               ← React root
│   │   ├── App.jsx                ← Routing & pages
│   │   ├── pages/                 ← Dashboard, Analytics, Settings, Landing
│   │   └── components/            ← Layout, shared UI
│   └── package.json
│
└── SetuDrishtiApp/                ← React Native (Expo) mobile app
    ├── app/
    │   ├── (tabs)/
    │   │   ├── index.tsx          ← ICU Ward Dashboard
    │   │   └── ar-lens.tsx        ← AR Bed Scanner
    │   └── omnimed-district.tsx   ← District Health Map
    ├── components/
    │   ├── ToneScore.tsx          ← Voice triage component
    │   └── TrialBridge.tsx        ← Trial matching component
    ├── services/
    │   ├── ModelRunner.ts         ← API service layer (IP configured here)
    │   └── OfflineSync.ts         ← Offline data sync
    └── package.json
```

---

## ✅ Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Backend FastAPI server |
| Node.js | 18+ | Web dashboard & Mobile app |
| npm | 9+ | Package management |
| Git | Any | Version control |

**Hardware:**
- Android/iOS device (for Expo Go mobile app)
- PC and phone must be on the **same Wi-Fi network** for mobile ↔ backend communication

---

## ⚙️ First-Time Setup

Run these **once** when you first clone the repo.

### Backend

```bash
cd setu_drishti_backend

# Create virtual environment
python -m venv venv

# Activate — Windows:
venv\Scripts\activate
# Activate — Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

cd ..
```

### Web Dashboard

```bash
cd setu_drishti_web
npm install
cd ..
```

### Mobile App

```bash
cd SetuDrishtiApp
npm install
cd ..
```

---

## 🚀 Running the Full Stack

Open **4 separate terminals**, all starting from the `Setu-Drishti/` directory.

---

### 🖥️ Terminal 1 — Backend API (FastAPI)

```bash
cd setu_drishti_backend
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

✅ Backend live at: `http://localhost:8000`  
✅ Interactive API docs: `http://localhost:8000/docs`

**Expected startup output:**
```
✅ Deterioration Model loaded. Features: 40
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

### 📡 Terminal 2 — ICU Patient Simulator

> ⚠️ Start this **AFTER** Terminal 1 is running.

```bash
cd setu_drishti_backend
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

python simulator.py
```

This continuously generates and pushes live patient vitals (HR, MAP, SpO₂, Lactate, WBC, etc.) for 4 ICU patients into the backend. The web and mobile dashboards display these in real time.

**Expected output:**
```
=================================================================
  Setu-Drishti ICU Monitor — Continuous Simulator v2
  Simulating 4 patients in a live ICU ward (looping)
=================================================================

[Cycle 1 | Hour 01] Broadcasting 4 patients...
  [PT-2847] SHARMA, RAJESH     | Bed 04 | Score:  23 | SAFE
  [PT-5214] PATEL, PRIYA       | Bed 02 | Score:  18 | SAFE
  [PT-6931] GUPTA, ARUN        | Bed 09 | Score:  31 | WATCH
  [PT-7682] MISHRA, ANJALI     | Bed 12 | Score:  28 | SAFE
```

---

### 🌐 Terminal 3 — Web Dashboard (React + Vite)

```bash
cd setu_drishti_web
npm run dev
```

✅ Web Dashboard live at: `http://localhost:5173`

---

### 📱 Terminal 4 — Mobile App (Expo)

```bash
cd SetuDrishtiApp
npx expo start -c
```

Scan the QR code in the terminal with the **Expo Go** app on your phone, or press:
- `a` → Android Emulator / connected Android device
- `i` → iOS Simulator

---

## 🌐 Network Configuration (Mobile ↔ Backend)

The mobile app talks to the backend over your local Wi-Fi. You need your PC's IP address in the config files.

**Find your IP (Windows):**
```powershell
ipconfig
# Look for "IPv4 Address" under your active Wi-Fi adapter
# e.g., 10.216.18.227
```

**Files to update** (replace `<YOUR_PC_IP>` with your actual IP):

| File | Variable |
|------|----------|
| `SetuDrishtiApp/app/(tabs)/index.tsx` | `API_BASE = "http://<YOUR_PC_IP>:8000/api/v1"` |
| `SetuDrishtiApp/app/(tabs)/ar-lens.tsx` | `BACKEND_URL = "http://<YOUR_PC_IP>:8000"` |
| `SetuDrishtiApp/app/omnimed-district.tsx` | `BACKEND_URL = "http://<YOUR_PC_IP>:8000"` |
| `SetuDrishtiApp/services/ModelRunner.ts` | `BACKEND_URL = "http://<YOUR_PC_IP>:8000"` |
| `SetuDrishtiApp/components/ToneScore.tsx` | `BACKEND_URL = "http://<YOUR_PC_IP>:8000"` |
| `SetuDrishtiApp/components/TrialBridge.tsx` | `BACKEND_URL = "http://<YOUR_PC_IP>:8000"` |

**Quick PowerShell script to update all at once** (run from `Setu-Drishti/`):
```powershell
$newIP = "10.216.18.227"   # Replace with your actual IP
$files = @(
    "SetuDrishtiApp\app\(tabs)\index.tsx",
    "SetuDrishtiApp\app\(tabs)\ar-lens.tsx",
    "SetuDrishtiApp\app\omnimed-district.tsx",
    "SetuDrishtiApp\services\ModelRunner.ts",
    "SetuDrishtiApp\components\ToneScore.tsx",
    "SetuDrishtiApp\components\TrialBridge.tsx"
)
foreach ($f in $files) {
    (Get-Content $f) -replace '10\.\d+\.\d+\.\d+', $newIP | Set-Content $f -Encoding UTF8
}
Write-Host "All IPs updated to $newIP"
```

---

## ☁️ Cloud Deployment

The stack is fully deployed in the cloud:

| Service | Platform | URL |
|---------|----------|-----|
| Backend API + Simulator | Render (Docker) | https://setu-drishti.onrender.com |
| Web Dashboard | Vercel | https://setu-drishti-hpmu.vercel.app/ |

> **Free-tier note:** Render sleeps after 15 min of inactivity. Allow a few minutes for the backend to wake up before presenting or making the first API request.

---

## 📡 API Reference

All endpoints at `http://localhost:8000`. Full Swagger docs at `/docs`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Health check |
| `POST` | `/api/v1/predict` | Live ICU patient risk prediction |
| `POST` | `/api/v1/voice/analyze_tone` | ToneScore voice urgency analysis |
| `POST` | `/api/v1/analyze_image` | Nidana Vision skin image diagnosis |
| `POST` | `/api/v1/trials/match` | TrialBridge clinical trial matching |
| `POST` | `/api/v1/security/audit` | SentinelIQ EHR anomaly detection |
| `GET`  | `/api/v1/population/dashboard` | District-level health pulse |
| `POST` | `/api/v1/sync` | Push offline patient record to backend |
| `GET`  | `/api/v1/deterioration/predict` | Patient deterioration forecast |

---

## ⚠️ Known Issues & Notes

| Issue | Status | Workaround |
|-------|--------|------------|
| `InconsistentVersionWarning` for scikit-learn | Non-breaking | Safe to ignore — models still work |
| `FutureWarning` for `google.generativeai` | Non-breaking | Safe to ignore — Gemini still works |
| Mobile connectivity after IP change | Expected | Re-run the PowerShell IP update script |
| Render backend cold start (a few minutes) | Free-tier limitation | Open the site a few minutes before the demo |

---

## 🔒 Configuration & Private Keys

`.env` files and credentials are managed via:
- **Local dev:** `.env` file in `setu_drishti_backend/` (not committed)
- **Render cloud:** Environment Variables & Secret Files in the Render dashboard

---

## 👥 Team — Alien-X

Built with ❤️ by **Team Alien-X**.

> *"One Platform. Six Modules. Real-Time ICU Intelligence."*

---

*© 2026 Setu-Drishti × OmniMed. All rights reserved.*
