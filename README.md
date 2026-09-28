# Setu-Drishti 2.0

> **Live demo:** [setu-drishti-hpmu.vercel.app](https://setu-drishti-hpmu.vercel.app/)
>
> **IMPORTANT - Before opening the dashboard:** The backend is hosted on Render and may be asleep. Please wait a few minutes for it to start before testing the dashboard. During this wake-up period, the dashboard may not load or may appear unavailable; this is expected.

**Setu-Drishti 2.0** is an advanced, fully-integrated ICU Command Center and AI-driven Clinical OS. It combines real-time patient telemetry monitoring with artificial intelligence models to assist medical personnel in triage, diagnosis, and workflow optimization.

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

### 2. AI Subsystems
- **SentinelIQ:** Anomaly detection on patient vitals using XGBoost models.
- **Nidana Vision:** CNN scanner for dermatological clustering and lesion diagnosis.
- **PulseWatch:** Real-time anomaly drift visualization powered by IoT simulation.
- **ToneScore Voice AI:** NLP-based acoustic urgency analysis.
- **TrialBridge:** Semantic similarity matching to link patient symptoms to experimental treatments.
- **District Pulse:** Geospatial clustering of symptom outbreaks using KD-Tree mapping.

---

## 🏗️ Project Structure

```
Setu-Drishti/                      ← Repository root
│
├── alarm.py                       ← Alarm processing demo
├── alarm_fatigue_demo.py          ← Alarm fatigue demonstration
├── dynamic_filter.py              ← Dynamic filtering demo
├── failure.py                     ← Failure scenario demo
├── presentation_demo.py           ← Presentation/demo runner
├── sepsis_model_evaluation.py     ← Sepsis model evaluation script
├── docker-compose.yml             ← Container orchestration configuration
├── models/                         ← Saved model artifacts
├── output/                         ← Generated evaluation reports
│   └── model_evaluation/
│       └── layman_report.md
│
├── setu_drishti_backend/          ← FastAPI backend and model services
│   ├── main.py                    ← API entry point
│   ├── database.py                ← Database configuration and access
│   ├── simulator.py               ← ICU patient data simulator
│   ├── requirements.txt           ← Python dependencies
│   ├── start.sh                   ← Deployment startup script
│   ├── Dockerfile                 ← Backend container configuration
│   ├── ml_models/                 ← Runtime model files
│   └── routers/                   ← Feature-specific API routers
│
├── setu_drishti_web/              ← React + Vite web applications
│   ├── src/                       ← Primary web app source
│   │   ├── App.jsx                ← Application shell
│   │   ├── pages/                 ← Web pages
│   │   ├── components/            ← Shared components
│   │   ├── services/              ← Frontend services
│   │   └── styles/                ← Web application styles
│   ├── public/                    ← Public web assets
│   ├── frontend/                  ← Additional frontend workspace
│   │   ├── src/                   ← Frontend source
│   │   └── public/                ← Frontend public assets
│   ├── package.json               ← Web dependencies and scripts
│   ├── vite.config.js             ← Vite configuration
│   └── Dockerfile                 ← Web container configuration
│
└── SetuDrishtiApp/                ← React Native (Expo) mobile app
    ├── app/                       ← Expo Router screens and layouts
    │   ├── (tabs)/                ← Tab-based mobile screens
    │   ├── index.tsx              ← App entry screen
    │   ├── modal.tsx              ← Modal screen
    │   └── workflow screens       ← Doctor, nurse, patient, and district views
    ├── components/                ← Reusable mobile components
    ├── services/                  ← Model execution and offline sync
    ├── constants/                 ← Shared app constants
    ├── assets/                    ← Fonts, images, and static assets
    ├── public/                    ← Public mobile web assets
    └── package.json               ← Mobile dependencies and scripts
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
| `SetuDrishtiApp/services/ModelRunner.ts` | `BACKEND_URL = "http://<YOUR_PC_IP>:8000"` |
| `SetuDrishtiApp/components/ToneScore.tsx` | `BACKEND_URL = "http://<YOUR_PC_IP>:8000"` |
| `SetuDrishtiApp/components/TrialBridge.tsx` | `BACKEND_URL = "http://<YOUR_PC_IP>:8000"` |

**Quick PowerShell script to update all at once** (run from `Setu-Drishti/`):
```powershell
$newIP = "10.216.18.227"   # Replace with your actual IP
$files = @(
    "SetuDrishtiApp\app\(tabs)\index.tsx",
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

*© 2026 Setu-Drishti. All rights reserved.*
