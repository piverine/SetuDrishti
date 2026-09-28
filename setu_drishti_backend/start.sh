#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — Setu-Drishti Unified Startup Script for Render.com
#
# Render provides a single $PORT and expects one process to stay alive.
# This script:
#   1. Starts the FastAPI backend (uvicorn) in the background
#   2. Waits until the backend is ready to accept connections
#   3. Starts the ICU simulator in the FOREGROUND (keeps the container alive)
# ─────────────────────────────────────────────────────────────────────────────

PORT="${PORT:-8000}"

echo "=================================================="
echo " Setu-Drishti Backend — Render Cloud Startup"
echo " Starting uvicorn on port $PORT ..."
echo "=================================================="

# Start the FastAPI server in the background
uvicorn main:app --host 0.0.0.0 --port "$PORT" &
UVICORN_PID=$!

# Wait for the backend to become ready (up to 60 seconds)
echo "[startup] Waiting for backend to become ready..."
ATTEMPTS=0
until curl -s --fail "http://127.0.0.1:${PORT}/" > /dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -ge 40 ]; then
        echo "[startup] ERROR: Backend did not start within 40 seconds. Aborting."
        kill $UVICORN_PID 2>/dev/null
        exit 1
    fi
    sleep 1.5
done

echo "[startup] ✅ Backend is ONLINE. Starting ICU Simulator..."
echo "=================================================="

# Start the simulator in the FOREGROUND.
# If the simulator ever dies, this script also exits, which Render will detect
# and restart the entire service automatically.
export BACKEND_PREDICT_URL="http://127.0.0.1:${PORT}/api/v1/predict"
python simulator.py

# If we somehow reach here (simulator exited), keep uvicorn alive
wait $UVICORN_PID
