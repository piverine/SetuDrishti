import pandas as pd
import time
import joblib
import json
import os
import glob
import kagglehub
import numpy as np

# 1. Load the Model and Feature Names
MODEL_PATH = "models/saved_models/xgb_model.pkl"
FEATURES_PATH = "models/saved_models/features.json"

print("Loading trained model...")
model = joblib.load(MODEL_PATH)
with open(FEATURES_PATH, "r") as f:
    feature_names = json.load(f)

# 2. Add Feature Engineering Function
def engineer_time_series_features(df):
    df = df.copy()
    vital_cols = ["HR", "O2Sat", "Temp", "SBP", "MAP", "DBP", "Resp"]
    lab_cols = ["BUN", "Creatinine", "WBC", "Lactate", "Platelets"]
    vitals_present = [c for c in vital_cols if c in df.columns]
    
    grouped = df.groupby("patient_id")

    for col in vitals_present:
        df[f"{col}_delta"] = grouped[col].diff().fillna(0)

    window = 6
    for col in vitals_present:
        df[f"{col}_rolling_mean"] = grouped[col].transform(lambda x: x.rolling(window, min_periods=1).mean())
        df[f"{col}_rolling_max"] = grouped[col].transform(lambda x: x.rolling(window, min_periods=1).max())
        df[f"{col}_rolling_min"] = grouped[col].transform(lambda x: x.rolling(window, min_periods=1).min())

    if "HR" in df.columns and "SBP" in df.columns:
        df["Shock_Index"] = df["HR"] / (df["SBP"] + 1e-5)
        df["Shock_Index_delta"] = grouped["Shock_Index"].diff().fillna(0)

    if "BUN" in df.columns and "Creatinine" in df.columns:
        df["BUN_Cr_Ratio"] = df["BUN"] / (df["Creatinine"] + 1e-5)

    if "MAP" in df.columns:
        df["MAP_Below_65"] = (df["MAP"] < 65).astype(int)
        
    return df

def stream_patient_data(df, patient_id, threshold=0.25):
    """
    Simulates real-time ICU monitoring for a single patient.
    Feeds data into the model one hour at a time.
    """
    patient_data = df[df['patient_id'] == patient_id].sort_values('ICULOS').copy()
    
    if patient_data.empty:
        print(f"Patient {patient_id} not found.")
        return

    actual_sepsis = patient_data['SepsisLabel'].max() == 1
    status_str = "DEVELOPED SEPSIS" if actual_sepsis else "REMAINED HEALTHY"
    
    print("\n" + "="*65)
    print(f"🏥 REAL-TIME ICU MONITORING: Patient {patient_id}")
    print(f"Ground Truth Outcome: {status_str}")
    print("="*65 + "\n")

    print(f"{'Hour':<6} | {'Heart Rate':<12} | {'MAP':<8} | {'Model Risk Score':<18} | {'System Alert'}")
    print("-" * 65)

    for index, row in patient_data.iterrows():
        hour = int(row['ICULOS'])
        hr = row.get('HR', 'N/A')
        map_val = row.get('MAP', 'N/A')
        
        current_state = pd.DataFrame([row])
        
        for col in feature_names:
            if col not in current_state.columns:
                current_state[col] = 0
        X_input = current_state[feature_names].fillna(0)

        risk_score = model.predict_proba(X_input)[0, 1]
        
        if risk_score >= threshold:
            alert = "🚨 SEPSIS WARNING TRIGGERED"
        else:
            alert = "✅ Stable"

        hr_str = f"{hr:.0f}" if pd.notna(hr) else "--"
        map_str = f"{map_val:.0f}" if pd.notna(map_val) else "--"

        print(f"Hr {hour:<3} | HR: {hr_str:<8} | MAP: {map_str:<4} | Risk: {risk_score*100:05.2f}%         | {alert}")
        time.sleep(0.5)

    print("\n[ Patient discharged or transferred ]\n")

# --- EXECUTION ---
if __name__ == "__main__":
    print("Loading test dataset from Kaggle...")
    path = kagglehub.dataset_download("salikhussaini49/prediction-of-sepsis")
    all_files = glob.glob(os.path.join(path, "**", "*.psv"), recursive=True)
    
    # Load just 50 patients to make it fast
    df_list = []
    for file in all_files[:50]: 
        patient_id = os.path.basename(file).split('.')[0]
        df = pd.read_csv(file, sep='|')
        df['patient_id'] = patient_id
        df_list.append(df)
        
    raw_df = pd.concat(df_list, ignore_index=True)
    
    print("Applying Time-Series Feature Engineering...")
    processed_df = engineer_time_series_features(raw_df)
    
    # Find a patient who gets sepsis to show an interesting simulation
    septic_patients = processed_df[processed_df['SepsisLabel'] == 1]['patient_id'].unique()
    
    if len(septic_patients) > 0:
        target_patient = septic_patients[0]
        stream_patient_data(processed_df, patient_id=target_patient, threshold=0.25)
    else:
        # If no sepsis in the first 50, just run the first healthy patient
        target_patient = processed_df['patient_id'].unique()[0]
        stream_patient_data(processed_df, patient_id=target_patient, threshold=0.25)