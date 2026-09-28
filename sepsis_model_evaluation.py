#!/usr/bin/env python3
import os
import glob
import json
import warnings
from pathlib import Path

import joblib
import kagglehub
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedGroupKFold
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

DATASET_SLUG = "salikhussaini49/prediction-of-sepsis"
MAX_PATIENT_FILES = 5000
RANDOM_STATE = 42
OUTPUT_DIR = Path("output/model_evaluation")
MODEL_PATH = Path("models/saved_models/xgb_model.pkl")
FEATURES_PATH = Path("models/saved_models/features.json")


def maybe_engineer_time_series_features(df: pd.DataFrame) -> pd.DataFrame:
    try:
        from src.features.feature_engineering import engineer_time_series_features
        return engineer_time_series_features(df)
    except Exception:
        print("[WARN] engineer_time_series_features() not found. Using raw columns only.")
        return df.copy()


def load_kaggle_data(limit: int = MAX_PATIENT_FILES) -> tuple[pd.DataFrame, str, list[str]]:
    print("Downloading/locating dataset...")
    path = kagglehub.dataset_download(DATASET_SLUG)
    all_files = sorted(glob.glob(os.path.join(path, "**", "*.psv"), recursive=True))
    if not all_files:
        raise FileNotFoundError("No .psv files found in the dataset directory.")

    selected_files = all_files[:limit] if limit else all_files
    print(f"Found {len(all_files)} total patient files. Loading {len(selected_files)} files...")

    frames = []
    for file in selected_files:
        patient_id = os.path.basename(file).split(".")[0]
        df = pd.read_csv(file, sep="|")
        df["patient_id"] = patient_id
        df["row_in_patient"] = np.arange(len(df))
        frames.append(df)

    raw_df = pd.concat(frames, ignore_index=True)
    return raw_df, path, selected_files


def ensure_target(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    if "SepsisLabel_window" not in out.columns:
        if "SepsisLabel" not in out.columns:
            raise ValueError("No target column found. Expected SepsisLabel or SepsisLabel_window.")
        out["SepsisLabel_window"] = out["SepsisLabel"]
    return out


def prepare_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    drop_cols = ["SepsisLabel", "SepsisLabel_window", "patient_id"]
    X = df.drop(columns=[c for c in drop_cols if c in df.columns]).copy()
    X = X.replace([np.inf, -np.inf], np.nan)
    y = df["SepsisLabel_window"] if "SepsisLabel_window" in df.columns else df["SepsisLabel"]
    return X, y.astype(int)


def build_group_split(X: pd.DataFrame, y: pd.Series, groups: pd.Series):
    try:
        sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    except TypeError:
        sgkf = StratifiedGroupKFold(n_splits=5)
    train_idx, test_idx = next(sgkf.split(X, y, groups))
    return train_idx, test_idx


def build_validation_split(X_train: pd.DataFrame, y_train: pd.Series, groups_train: pd.Series):
    try:
        sgkf = StratifiedGroupKFold(n_splits=4, shuffle=True, random_state=RANDOM_STATE)
    except TypeError:
        sgkf = StratifiedGroupKFold(n_splits=4)
    fit_idx, val_idx = next(sgkf.split(X_train, y_train, groups_train))
    return fit_idx, val_idx


def align_features(X: pd.DataFrame, feature_names: list[str]) -> pd.DataFrame:
    out = X.copy()
    for col in feature_names:
        if col not in out.columns:
            out[col] = np.nan
    out = out[feature_names]
    out = out.replace([np.inf, -np.inf], np.nan)
    return out.fillna(0)


def safe_metric(fn, *args, default=np.nan, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception:
        return default


def summarize_dataset(raw_df: pd.DataFrame, df: pd.DataFrame, X: pd.DataFrame, y: pd.Series, source_path: str, selected_files: list[str]) -> dict:
    summary = {
        "dataset_slug": DATASET_SLUG,
        "dataset_path": source_path,
        "patient_files_loaded": int(len(selected_files)),
        "rows_loaded": int(len(raw_df)),
        "rows_after_engineering": int(len(df)),
        "feature_count_before_drop": int(raw_df.shape[1]),
        "feature_count_model_input": int(X.shape[1]),
        "positive_rows": int((y == 1).sum()),
        "negative_rows": int((y == 0).sum()),
        "positive_rate": float((y == 1).mean()),
        "columns": list(df.columns),
    }
    if "patient_id" in raw_df.columns:
        patient_level = raw_df.groupby("patient_id")["SepsisLabel"].max() if "SepsisLabel" in raw_df.columns else None
        if patient_level is not None:
            summary["unique_patients"] = int(patient_level.shape[0])
            summary["sepsis_positive_patients"] = int((patient_level == 1).sum())
            summary["sepsis_positive_patient_rate"] = float((patient_level == 1).mean())
    return summary


def split_summary(train_idx, test_idx, groups: pd.Series, y: pd.Series) -> dict:
    train_groups = groups.iloc[train_idx]
    test_groups = groups.iloc[test_idx]
    return {
        "train_rows": int(len(train_idx)),
        "test_rows": int(len(test_idx)),
        "train_patients": int(train_groups.nunique()),
        "test_patients": int(test_groups.nunique()),
        "row_overlap_between_train_test": int(len(set(train_idx).intersection(set(test_idx)))),
        "patient_overlap_between_train_test": int(len(set(train_groups).intersection(set(test_groups)))),
        "train_positive_rate": float(y.iloc[train_idx].mean()),
        "test_positive_rate": float(y.iloc[test_idx].mean()),
    }


def maybe_load_saved_model():
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
        if FEATURES_PATH.exists():
            with open(FEATURES_PATH, "r") as f:
                feature_names = json.load(f)
        else:
            feature_names = None
        print(f"Loaded trained model from {MODEL_PATH}")
        return model, feature_names
    print("[WARN] Saved model not found. A new model will be trained for evaluation.")
    return None, None


def train_model(X_fit, y_fit, X_val, y_val):
    negative_cases = int((y_fit == 0).sum())
    positive_cases = int((y_fit == 1).sum())
    scale_weight = negative_cases / max(positive_cases, 1)

    model = XGBClassifier(
        n_estimators=1000,
        early_stopping_rounds=50,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        scale_pos_weight=scale_weight,
        eval_metric="auc",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    model.fit(X_fit, y_fit, eval_set=[(X_val, y_val)], verbose=False)
    return model


def find_best_threshold(y_true: pd.Series, y_proba: np.ndarray) -> tuple[float, pd.DataFrame]:
    rows = []
    best_t = 0.5
    best_f1 = -1
    for t in np.arange(0.05, 0.96, 0.05):
        y_pred = (y_proba >= t).astype(int)
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        accuracy = accuracy_score(y_true, y_pred)
        rows.append({
            "threshold": round(float(t), 2),
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
        })
        if f1 > best_f1:
            best_f1 = f1
            best_t = float(t)
    return best_t, pd.DataFrame(rows)


def compute_metrics(y_true: pd.Series, y_proba: np.ndarray, threshold: float) -> tuple[dict, dict, pd.DataFrame]:
    y_pred = (y_proba >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()

    metrics = {
        "threshold": float(threshold),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "auroc": float(safe_metric(roc_auc_score, y_true, y_proba)),
        "auprc": float(safe_metric(average_precision_score, y_true, y_proba)),
        "brier_score": float(safe_metric(brier_score_loss, y_true, y_proba)),
        "true_negatives": int(tn),
        "false_positives": int(fp),
        "false_negatives": int(fn),
        "true_positives": int(tp),
    }

    report = classification_report(y_true, y_pred, zero_division=0, output_dict=True)
    cm_df = pd.DataFrame(cm, index=["actual_0", "actual_1"], columns=["pred_0", "pred_1"])
    return metrics, report, cm_df


def feature_importance_table(model, feature_names: list[str]) -> pd.DataFrame:
    if hasattr(model, "feature_importances_"):
        imp = pd.DataFrame({
            "feature": feature_names,
            "importance": model.feature_importances_.astype(float),
        }).sort_values("importance", ascending=False)
        return imp.reset_index(drop=True)
    return pd.DataFrame(columns=["feature", "importance"])


def subgroup_tables(df_test: pd.DataFrame, y_true: pd.Series, y_proba: np.ndarray, threshold: float) -> pd.DataFrame:
    local = df_test.copy()
    local["y_true"] = y_true.values
    local["y_proba"] = y_proba
    local["y_pred"] = (y_proba >= threshold).astype(int)

    candidate_groups = {}

    if "Age" in local.columns:
        candidate_groups["Age_bin"] = pd.cut(local["Age"], bins=[-np.inf, 40, 60, 80, np.inf], labels=["<40", "40-60", "60-80", "80+"])
    if "ICULOS" in local.columns:
        candidate_groups["ICULOS_bin"] = pd.cut(local["ICULOS"], bins=[-np.inf, 6, 12, 24, np.inf], labels=["0-6h", "7-12h", "13-24h", "25h+"])

    missing_fraction = local.drop(columns=[c for c in ["y_true", "y_proba", "y_pred"] if c in local.columns]).isna().mean(axis=1)
    candidate_groups["missingness_bin"] = pd.cut(missing_fraction, bins=[-np.inf, 0.1, 0.3, np.inf], labels=["low", "medium", "high"])

    rows = []
    for group_name, values in candidate_groups.items():
        tmp = local.copy()
        tmp[group_name] = values
        for level, part in tmp.groupby(group_name, dropna=False):
            if len(part) < 25:
                continue
            y_part = part["y_true"]
            p_part = part["y_proba"]
            pred_part = part["y_pred"]
            rows.append({
                "group": group_name,
                "segment": str(level),
                "rows": int(len(part)),
                "positive_rate": float(y_part.mean()) if len(part) else np.nan,
                "accuracy": float(accuracy_score(y_part, pred_part)),
                "precision": float(precision_score(y_part, pred_part, zero_division=0)),
                "recall": float(recall_score(y_part, pred_part, zero_division=0)),
                "f1": float(f1_score(y_part, pred_part, zero_division=0)),
                "auroc": float(safe_metric(roc_auc_score, y_part, p_part)),
                "auprc": float(safe_metric(average_precision_score, y_part, p_part)),
            })
    return pd.DataFrame(rows).sort_values(["group", "f1"], ascending=[True, True])


def add_noise(X: pd.DataFrame, strength: float, seed: int = RANDOM_STATE) -> pd.DataFrame:
    out = X.copy()
    rng = np.random.default_rng(seed)
    numeric_cols = out.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        std = out[col].std(skipna=True)
        if pd.isna(std) or std == 0:
            continue
        noise = rng.normal(0, std * strength, size=len(out))
        out[col] = out[col].fillna(0) + noise
    return out


def random_mask_to_zero(X: pd.DataFrame, frac: float, seed: int = RANDOM_STATE) -> pd.DataFrame:
    out = X.copy()
    numeric_cols = list(out.select_dtypes(include=[np.number]).columns)
    if not numeric_cols:
        return out
    rng = np.random.default_rng(seed)
    mask = rng.random((len(out), len(numeric_cols))) < frac
    for j, col in enumerate(numeric_cols):
        col_vals = out[col].to_numpy(copy=True)
        col_vals[mask[:, j]] = 0
        out[col] = col_vals
    return out


def failure_simulations(model, feature_names: list[str], X_test_raw: pd.DataFrame, y_test: pd.Series, threshold: float, importance_df: pd.DataFrame) -> pd.DataFrame:
    scenarios = []

    def record(name: str, X_variant: pd.DataFrame, note: str):
        X_ready = align_features(X_variant, feature_names)
        p = model.predict_proba(X_ready)[:, 1]
        m, _, _ = compute_metrics(y_test, p, threshold)
        m["scenario"] = name
        m["note"] = note
        scenarios.append(m)

    record("clean_holdout", X_test_raw, "Original unseen holdout test set.")
    record("noise_5pct", add_noise(X_test_raw, 0.05), "Small sensor noise added to numeric features.")
    record("noise_10pct", add_noise(X_test_raw, 0.10), "Moderate sensor noise added to numeric features.")
    record("mask_10pct", random_mask_to_zero(X_test_raw, 0.10), "Randomly zero out 10% of numeric values.")
    record("mask_30pct", random_mask_to_zero(X_test_raw, 0.30), "Randomly zero out 30% of numeric values.")

    for feature in importance_df.head(5)["feature"].tolist():
        if feature in X_test_raw.columns:
            dropped = X_test_raw.copy()
            dropped[feature] = 0
            record(f"drop_{feature}", dropped, f"Simulate failure when feature '{feature}' is missing or broken.")

    if "ICULOS" in X_test_raw.columns:
        early_mask = X_test_raw["ICULOS"].fillna(-1) <= 6
        late_mask = X_test_raw["ICULOS"].fillna(-1) >= 24
        for name, mask, note in [
            ("slice_early_iculos", early_mask, "Rows from first 6 ICU hours only."),
            ("slice_late_iculos", late_mask, "Rows from ICU stay after 24 hours only."),
        ]:
            if mask.sum() >= 25:
                X_slice = align_features(X_test_raw.loc[mask], feature_names)
                p = model.predict_proba(X_slice)[:, 1]
                m, _, _ = compute_metrics(y_test.loc[mask], p, threshold)
                m["scenario"] = name
                m["note"] = note
                scenarios.append(m)

    return pd.DataFrame(scenarios).sort_values("f1")


def hardest_errors_table(df_test: pd.DataFrame, y_true: pd.Series, y_proba: np.ndarray, threshold: float) -> pd.DataFrame:
    out = df_test.copy()
    out["y_true"] = y_true.values
    out["y_proba"] = y_proba
    out["y_pred"] = (y_proba >= threshold).astype(int)
    out["error_type"] = np.where(
        (out["y_true"] == 1) & (out["y_pred"] == 0),
        "false_negative",
        np.where((out["y_true"] == 0) & (out["y_pred"] == 1), "false_positive", "correct"),
    )
    out = out[out["error_type"] != "correct"].copy()
    out["wrong_confidence"] = np.where(
        out["error_type"] == "false_negative",
        1 - out["y_proba"],
        out["y_proba"],
    )
    useful_cols = [c for c in ["patient_id", "row_in_patient", "ICULOS", "Age", "HospAdmTime", "y_true", "y_pred", "y_proba", "error_type", "wrong_confidence"] if c in out.columns]
    if not useful_cols:
        useful_cols = ["y_true", "y_pred", "y_proba", "error_type", "wrong_confidence"]
    return out.sort_values("wrong_confidence", ascending=False)[useful_cols].head(100)


def build_layman_report(dataset_summary: dict, split_info: dict, metrics: dict, importance_df: pd.DataFrame, subgroup_df: pd.DataFrame, failure_df: pd.DataFrame) -> str:
    worst_failures = failure_df[["scenario", "f1", "recall", "auroc", "note"]].head(5)
    weakest_segments = subgroup_df[["group", "segment", "rows", "f1", "recall", "auroc"]].head(5) if not subgroup_df.empty else pd.DataFrame()
    top_features = importance_df.head(8)[["feature", "importance"]]

    lines = []
    lines.append("# Model Evaluation Summary")
    lines.append("")
    lines.append("## 1) What this model does")
    lines.append("This model predicts whether a patient row is labeled as sepsis-positive based on the clinical measurements available in the sepsis dataset.")
    lines.append("")
    lines.append("## 2) What dataset was used")
    lines.append(f"- Dataset slug: {dataset_summary['dataset_slug']}")
    lines.append(f"- Patient files loaded: {dataset_summary['patient_files_loaded']}")
    lines.append(f"- Rows loaded: {dataset_summary['rows_loaded']}")
    lines.append(f"- Model input feature count: {dataset_summary['feature_count_model_input']}")
    lines.append(f"- Positive row rate: {dataset_summary['positive_rate']:.4f}")
    if "unique_patients" in dataset_summary:
        lines.append(f"- Unique patients: {dataset_summary['unique_patients']}")
        lines.append(f"- Sepsis-positive patients: {dataset_summary['sepsis_positive_patients']}")
    lines.append("")
    lines.append("## 3) How the train/test split was made")
    lines.append("A group-aware split was used so the same patient does not appear in both train and test.")
    lines.append(f"- Train rows: {split_info['train_rows']}, Test rows: {split_info['test_rows']}")
    lines.append(f"- Train patients: {split_info['train_patients']}, Test patients: {split_info['test_patients']}")
    lines.append(f"- Patient overlap between train and test: {split_info['patient_overlap_between_train_test']}")
    lines.append("")
    lines.append("## 4) Main performance numbers")
    lines.append(f"- Threshold used: {metrics['threshold']:.2f}")
    lines.append(f"- Accuracy: {metrics['accuracy']:.4f}")
    lines.append(f"- Precision: {metrics['precision']:.4f}")
    lines.append(f"- Recall: {metrics['recall']:.4f}")
    lines.append(f"- F1 score: {metrics['f1']:.4f}")
    lines.append(f"- AUROC: {metrics['auroc']:.4f}")
    lines.append(f"- AUPRC: {metrics['auprc']:.4f}")
    lines.append(f"- Brier score: {metrics['brier_score']:.4f}")
    lines.append(f"- Confusion matrix counts: TN={metrics['true_negatives']}, FP={metrics['false_positives']}, FN={metrics['false_negatives']}, TP={metrics['true_positives']}")
    lines.append("")
    lines.append("## 5) Questions a normal person may ask")
    lines.append(f"- How often is the model right? Accuracy is {metrics['accuracy']:.4f}, but the more important numbers for the sepsis-positive class are precision {metrics['precision']:.4f} and recall {metrics['recall']:.4f}.")
    lines.append(f"- Does it miss dangerous cases? It produced {metrics['false_negatives']} false negatives on the holdout test set.")
    lines.append(f"- Does it raise false alarms? It produced {metrics['false_positives']} false positives on the holdout test set.")
    lines.append(f"- Which inputs matter most? Top features were: {', '.join(top_features['feature'].tolist()) if not top_features.empty else 'feature importance unavailable'}.")
    lines.append("")
    lines.append("## 6) When this model is likely to fail")
    if worst_failures.empty:
        lines.append("No failure scenarios were generated.")
    else:
        for _, row in worst_failures.iterrows():
            lines.append(f"- {row['scenario']}: F1={row['f1']:.4f}, recall={row['recall']:.4f}, AUROC={row['auroc']:.4f}. {row['note']}")
    lines.append("")
    lines.append("## 7) Weak slices of data")
    if weakest_segments.empty:
        lines.append("No subgroup table was generated because the required columns were missing or too small.")
    else:
        for _, row in weakest_segments.iterrows():
            lines.append(f"- {row['group']} = {row['segment']}: rows={int(row['rows'])}, F1={row['f1']:.4f}, recall={row['recall']:.4f}, AUROC={row['auroc']:.4f}")
    lines.append("")
    lines.append("## 8) Test cases covered")
    lines.append("- Clean unseen holdout test set")
    lines.append("- Noise injection at 5% and 10%")
    lines.append("- Random masking of 10% and 30% of numeric values")
    lines.append("- One-by-one feature dropout on the most important features")
    lines.append("- Early ICU and late ICU slices when ICULOS is available")
    lines.append("")
    lines.append("## 9) Files generated by this script")
    lines.append("- dataset_summary.json")
    lines.append("- split_summary.json")
    lines.append("- overall_metrics.json")
    lines.append("- threshold_analysis.csv")
    lines.append("- classification_report.json")
    lines.append("- confusion_matrix.csv")
    lines.append("- feature_importance.csv")
    lines.append("- subgroup_metrics.csv")
    lines.append("- failure_simulations.csv")
    lines.append("- hardest_errors.csv")
    lines.append("- layman_report.md")
    return "\n".join(lines)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    raw_df, dataset_path, selected_files = load_kaggle_data(limit=MAX_PATIENT_FILES)
    df = maybe_engineer_time_series_features(raw_df)
    df = ensure_target(df)

    groups = df["patient_id"]
    X_raw, y = prepare_features(df)
    train_idx, test_idx = build_group_split(X_raw, y, groups)
    split_info = split_summary(train_idx, test_idx, groups, y)

    dataset_info = summarize_dataset(raw_df, df, X_raw, y, dataset_path, selected_files)

    X_train_raw = X_raw.iloc[train_idx].copy()
    y_train = y.iloc[train_idx].copy()
    groups_train = groups.iloc[train_idx].copy()
    X_test_raw = X_raw.iloc[test_idx].copy()
    y_test = y.iloc[test_idx].copy()
    df_test = df.iloc[test_idx].copy()

    model, saved_features = maybe_load_saved_model()

    if model is None:
        fit_idx, val_idx = build_validation_split(X_train_raw, y_train, groups_train)
        X_fit = X_train_raw.iloc[fit_idx].fillna(0)
        y_fit = y_train.iloc[fit_idx]
        X_val = X_train_raw.iloc[val_idx].fillna(0)
        y_val = y_train.iloc[val_idx]
        model = train_model(X_fit, y_fit, X_val, y_val)
        feature_names = list(X_train_raw.columns)
    else:
        feature_names = saved_features if saved_features else list(X_train_raw.columns)

    X_train_aligned = align_features(X_train_raw, feature_names)
    X_test_aligned = align_features(X_test_raw, feature_names)

    fit_idx, val_idx = build_validation_split(X_train_aligned, y_train, groups_train)
    X_val_for_threshold = X_train_aligned.iloc[val_idx]
    y_val_for_threshold = y_train.iloc[val_idx]

    val_proba = model.predict_proba(X_val_for_threshold)[:, 1]
    best_threshold, threshold_df = find_best_threshold(y_val_for_threshold, val_proba)

    test_proba = model.predict_proba(X_test_aligned)[:, 1]
    metrics, class_report, cm_df = compute_metrics(y_test, test_proba, best_threshold)
    importance_df = feature_importance_table(model, feature_names)
    subgroup_df = subgroup_tables(df_test, y_test, test_proba, best_threshold)
    failure_df = failure_simulations(model, feature_names, X_test_raw, y_test, best_threshold, importance_df)
    errors_df = hardest_errors_table(df_test, y_test, test_proba, best_threshold)

    layman_report = build_layman_report(dataset_info, split_info, metrics, importance_df, subgroup_df, failure_df)

    (OUTPUT_DIR / "dataset_summary.json").write_text(json.dumps(dataset_info, indent=2))
    (OUTPUT_DIR / "split_summary.json").write_text(json.dumps(split_info, indent=2))
    (OUTPUT_DIR / "overall_metrics.json").write_text(json.dumps(metrics, indent=2))
    (OUTPUT_DIR / "classification_report.json").write_text(json.dumps(class_report, indent=2))
    threshold_df.to_csv(OUTPUT_DIR / "threshold_analysis.csv", index=False)
    cm_df.to_csv(OUTPUT_DIR / "confusion_matrix.csv")
    importance_df.to_csv(OUTPUT_DIR / "feature_importance.csv", index=False)
    subgroup_df.to_csv(OUTPUT_DIR / "subgroup_metrics.csv", index=False)
    failure_df.to_csv(OUTPUT_DIR / "failure_simulations.csv", index=False)
    errors_df.to_csv(OUTPUT_DIR / "hardest_errors.csv", index=False)
    (OUTPUT_DIR / "layman_report.md").write_text(layman_report)

    print("Evaluation complete. Files written to:", OUTPUT_DIR)
    print("Main summary:")
    print(json.dumps({
        "accuracy": metrics["accuracy"],
        "precision": metrics["precision"],
        "recall": metrics["recall"],
        "f1": metrics["f1"],
        "auroc": metrics["auroc"],
        "auprc": metrics["auprc"],
        "threshold": metrics["threshold"],
    }, indent=2))


if __name__ == "__main__":
    main()
