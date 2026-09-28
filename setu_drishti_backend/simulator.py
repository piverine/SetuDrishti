import copy
import json
import os
import requests
import time
import random
import math

# On Render the backend and simulator are in the same process (via start.sh),
# so localhost is always correct. The env var allows overriding for other setups.
API_URL = os.environ.get("BACKEND_PREDICT_URL", "http://127.0.0.1:8000/api/v1/predict")

print("=" * 65)
print("  Setu-Drishti ICU Monitor — Continuous Simulator v2")
print("  Simulating 4 patients in a live ICU ward (looping)")
print("=" * 65)

# ── Base template ──
base_patient_data = {
    "Age": 65.0,  "Gender": 1.0,  "HospAdmTime": -0.02,  "ICULOS": 1.0,
    "HR": 75.0,   "O2Sat": 98.0,  "Temp": 36.8,  "SBP": 120.0,
    "MAP": 90.0,  "DBP": 80.0,    "Resp": 14.0,  "EtCO2": 35.0,
    "BaseExcess": 0.0,    "HCO3": 24.0,    "FiO2": 0.21,    "pH": 7.4,
    "PaCO2": 40.0,        "SaO2": 98.0,    "AST": 25.0,     "BUN": 15.0,
    "Alkalinephos": 70.0, "Calcium": 9.0,  "Chloride": 100.0,
    "Creatinine": 0.9,    "Bilirubin_direct": 0.2, "Glucose": 100.0,
    "Lactate": 1.0,       "Magnesium": 2.0, "Phosphate": 3.0,
    "Potassium": 4.0,     "Bilirubin_total": 0.8,  "TroponinI": 0.01,
    "Hct": 40.0,          "Hgb": 14.0,     "PTT": 30.0,     "WBC": 8.0,
    "Fibrinogen": 300.0,  "Platelets": 250.0,
}

# ── Patient initial states ──
def make_patients():
    return [
        {
            "id": "PT-2847", "name": "SHARMA, RAJESH", "bed": "04", "scenario": "sepsis_crash",
            "admit_reason": "SEPSIS PROTOCOL",
            "data": {**base_patient_data, "Age": 65.0, "HR": 75.0, "MAP": 90.0}
        },
        {
            "id": "PT-5214", "name": "PATEL, PRIYA", "bed": "02", "scenario": "stable",
            "admit_reason": "POST-OP OBSERVATION",
            "data": {**base_patient_data, "Age": 42.0, "HR": 65.0, "MAP": 85.0, "Temp": 36.5}
        },
        {
            "id": "PT-6931", "name": "GUPTA, ARUN", "bed": "09", "scenario": "slow_deterioration",
            "admit_reason": "PNEUMONIA",
            "data": {**base_patient_data, "Age": 71.0, "HR": 85.0, "MAP": 75.0, "Temp": 38.1, "Lactate": 1.5, "WBC": 12.0}
        },
        {
             "id": "PT-7682", "name": "MISHRA, ANJALI", "bed": "12", "scenario": "early_warning",
            "admit_reason": "UTI / FEVER",
            "data": {**base_patient_data, "Age": 55.0, "HR": 90.0, "MAP": 80.0, "Temp": 37.9, "Lactate": 1.2, "WBC": 9.5}
        },
    ]

ALERT_COLORS = {
    "CRITICAL": "\033[91m",
    "HIGH":     "\033[93m",
    "WATCH":    "\033[94m",
    "SAFE":     "\033[92m",
}
RESET = "\033[0m"

# ── Simulate continuously in cycles ──
cycle = 0
CYCLE_HOURS = 22  # Each scenario plays out over 22 hours then resets

while True:
    cycle += 1
    print(f"\n{'=' * 65}")
    print(f"  Starting Simulation Cycle #{cycle}")
    print(f"{'=' * 65}")

    patients = make_patients()

    for hour in range(1, CYCLE_HOURS + 1):
        print(f"\n[Cycle {cycle} | Hour {hour:02d}] Broadcasting 4 patients...", end="")
        print()

        for p in patients:
            p_data = p["data"]
            p_data["ICULOS"] = float(hour + (cycle - 1) * CYCLE_HOURS)

            scenario = p["scenario"]

            # ── PT-8842: Sepsis Crash Scenario ──
            if scenario == "sepsis_crash":
                if 5 <= hour <= 13:
                    p_data["HR"]   = min(p_data["HR"]   + random.uniform(3.0, 5.0), 130.0)
                    p_data["MAP"]  = max(p_data["MAP"]  - random.uniform(1.5, 2.5),  65.0)
                    p_data["Resp"] = min(p_data["Resp"] + random.uniform(0.5, 1.0),  28.0)
                    p_data["SBP"]  = max(p_data["SBP"]  - random.uniform(1.0, 2.0),  90.0)
                    if p_data["Temp"] < 39.3:
                        p_data["Temp"] += random.uniform(0.2, 0.35)
                    p_data["Lactate"] = min(p_data["Lactate"] + random.uniform(0.05, 0.12), 1.9)
                    p_data["WBC"]     = min(p_data["WBC"]     + random.uniform(0.3, 0.6),  13.0)
                    p_data["O2Sat"]   = max(p_data["O2Sat"]   - random.uniform(0.3, 0.6),  92.0)

                if hour == 14:
                    p_data["Lactate"]    = 4.2
                    p_data["WBC"]        = 22.0
                    p_data["Creatinine"] = 2.5
                    p_data["Platelets"]  = 85.0
                    p_data["MAP"]        = 55.0
                    p_data["SBP"]        = 85.0
                    p_data["pH"]         = 7.28
                    p_data["BaseExcess"] = -6.0
                    p_data["HR"]         = 128.0
                    p_data["Temp"]       = 39.7
                    p_data["O2Sat"]      = 89.0

                if hour > 14:
                    p_data["Lactate"]    += random.uniform(0.15, 0.35)
                    p_data["MAP"]         = max(p_data["MAP"]  - random.uniform(0.8, 1.8), 38.0)
                    p_data["Creatinine"] += random.uniform(0.1, 0.25)
                    p_data["Platelets"]   = max(p_data["Platelets"] - random.uniform(4.0, 9.0), 15.0)
                    p_data["pH"]          = max(p_data["pH"]    - random.uniform(0.01, 0.02), 7.05)
                    p_data["WBC"]        += random.uniform(0.3, 1.0)
                    p_data["HR"]          = min(p_data["HR"]   + random.uniform(0.8, 2.0), 145.0)
                    p_data["BaseExcess"]  = max(p_data["BaseExcess"] - random.uniform(0.4, 0.8), -14.0)
                    p_data["O2Sat"]       = max(p_data["O2Sat"] - random.uniform(0.5, 1.0), 82.0)

            # ── PT-1102: Stable Post-Op ──
            elif scenario == "stable":
                p_data["HR"] = max(58.0, min(78.0,
                    p_data["HR"] + random.uniform(-1.2, 1.2) + 0.3 * math.sin(hour * 0.5)))
                p_data["MAP"] = max(78.0, min(95.0,
                    p_data["MAP"] + random.uniform(-1.0, 1.0)))
                p_data["O2Sat"] = max(96.0, min(100.0,
                    p_data["O2Sat"] + random.uniform(-0.3, 0.3)))

            # ── PT-3305: Slow Deterioration (Pneumonia) ──
            elif scenario == "slow_deterioration":
                if hour > 3:
                    p_data["HR"]      += random.uniform(0.5, 1.5)
                    p_data["MAP"]     -= random.uniform(0.4, 0.9)
                    p_data["Lactate"] += random.uniform(0.02, 0.05)
                    p_data["Temp"]    += random.uniform(0.05, 0.12)
                    p_data["Resp"]    += random.uniform(0.1, 0.3)
                    p_data["O2Sat"]    = max(p_data["O2Sat"] - random.uniform(0.1, 0.4), 88.0)
                    p_data["WBC"]     += random.uniform(0.05, 0.15)

            # ── PT-4991: Early Warning Spike ──
            elif scenario == "early_warning":
                if hour == 8:
                    p_data["Lactate"] += 0.5
                    p_data["HR"]      += 12.0
                    p_data["WBC"]     += 2.5
                    p_data["Temp"]    += 0.8
                if 8 < hour < 15:
                    p_data["HR"]      += random.uniform(-0.5, 1.5)
                    p_data["Lactate"] += random.uniform(0.01, 0.04)
                if hour >= 15:
                    # Responding to treatment
                    p_data["HR"]      = max(75.0, p_data["HR"] - random.uniform(0.5, 1.5))
                    p_data["Lactate"] = max(1.0, p_data["Lactate"] - 0.05)
                    p_data["Temp"]    = max(36.5, p_data["Temp"] - random.uniform(0.05, 0.1))
                    p_data["O2Sat"]   = min(98.0, p_data["O2Sat"] + random.uniform(0.1, 0.3))

            # ── POST PAYLOAD ──
            payload = copy.deepcopy(p_data)
            payload["Patient_ID"]   = p["id"]
            payload["Patient_Name"] = p["name"]
            payload["Bed_Number"]   = p["bed"]
            payload["Admit_Reason"] = p["admit_reason"]

            try:
                response = requests.post(API_URL, json=payload, timeout=2)
                if response.status_code == 200:
                    result = response.json()
                    alert  = result.get("alert_level", "UNKNOWN")
                    risk   = result.get("combined_risk_score", 0)
                    color  = ALERT_COLORS.get(alert, "")
                    print(f"  {p['id']} ({p['name']}): {color}{alert:<8} ({risk}%){RESET} ")
                else:
                    print(f"  API Error {response.status_code}: {response.text}")
            except Exception as e:
                print(f"  Request failed: {e}")

        time.sleep(1.5)

    print(f"\n[Cycle {cycle}] Resetting patients for next cycle in 5 seconds...")
    time.sleep(5)