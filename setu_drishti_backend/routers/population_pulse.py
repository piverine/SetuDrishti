from fastapi import APIRouter
from collections import defaultdict
import datetime
import traceback
from database import get_all_patient_records, get_all_supplies, save_supply


router = APIRouter()


@router.get("/api/v1/population/dashboard")
async def get_population_intelligence():
    try:
        records = get_all_patient_records()
        inventory = get_all_supplies()

        # Auto-seed Firestore inventory if empty
        if not inventory:
            seed_items = [
                {"medication_name": "Iron Supplements", "current_stock": 120, "daily_burn_rate": 28.5},
                {"medication_name": "Paracetamol",      "current_stock": 450, "daily_burn_rate": 120.0},
                {"medication_name": "Amoxicillin",      "current_stock": 5000, "daily_burn_rate": 15.0},
            ]
            for item in seed_items:
                save_supply(
                    medication_name=item["medication_name"],
                    current_stock=item["current_stock"],
                    daily_burn_rate=item["daily_burn_rate"]
                )
            inventory = get_all_supplies()

        # Mathematical Aggregations for Real-Time Intelligence
        symptom_heatmap = defaultdict(lambda: defaultdict(int))
        village_scan_counts = defaultdict(lambda: {"total_scans": 0, "anemia_detected": 0})
        trial_opportunities = []

        # Hardcoded list of district villages for screening gap context
        all_villages = ["Block 7", "Village A", "Village B", "Sector 4", "Highland Ridge"]

        for row in records:
            loc = row.get("location_block", "Unknown")
            tags_raw = row.get("diagnosis_tags", "")
            tags = [t.strip().lower() for t in tags_raw.split(",")] if tags_raw else []

            # 1. Symptom Heatmap
            if "fever" in tags and "cough" in tags:
                symptom_heatmap[loc]["fever_cough_cluster"] += 1
            for tag in tags:
                symptom_heatmap[loc][tag] += 1

                # 2. Screening Coverage Tracking
                village_scan_counts[loc]["total_scans"] += 1
                if tag == "anemia":
                    village_scan_counts[loc]["anemia_detected"] += 1

            # 3. Trial Enrollment Flags
            if "chronic fatigue" in tags or "rare lesion" in tags:
                trial_opportunities.append({
                    "patient_id": row.get("patient_id"),
                    "location": row.get("location_block"),
                    "symptoms": row.get("diagnosis_tags"),
                    "match_confidence": 0.85
                })

        # Find villages with ZERO scans (Coverage Gap)
        scanned_villages = list(village_scan_counts.keys())
        screening_gaps = [v for v in all_villages if v not in scanned_villages]

        # 4. Supply Alert Predictions
        supply_alerts = []
        for item in inventory:
            burn_rate = item.get("daily_burn_rate", 0)
            if burn_rate > 0:
                days_left = item.get("current_stock", 0) / burn_rate
                if days_left < 14:
                    supply_alerts.append({
                        "medication": item.get("medication_name"),
                        "stock_remaining": item.get("current_stock"),
                        "burn_rate": burn_rate,
                        "stockout_prediction_days": round(days_left, 1),
                        "alert_level": "CRITICAL" if days_left < 5 else "WARNING"
                    })

        # Convert nested defaultdicts safely
        safe_symptom_clusters = {village: dict(counts) for village, counts in symptom_heatmap.items()}

        return {
            "status": "connected",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "total_population_nodes_synced": len(records),
            "intelligence": {
                "symptom_clusters": safe_symptom_clusters,
                "screening_coverage_gaps": screening_gaps,
                "supply_chain_alerts": supply_alerts,
                "trial_enrollment_opportunities": trial_opportunities
            }
        }
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()}