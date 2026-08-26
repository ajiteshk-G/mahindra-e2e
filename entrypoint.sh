#!/bin/bash
set -e

PORT=${PORT:-8080}
echo "Starting Mahindra Omnichannel Backend on 0.0.0.0:8000..."
cd /app/backend
PYTHONUNBUFFERED=1 PYTHONPATH=/app/backend python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting Next.js Standalone Frontend on 0.0.0.0:${PORT}..."
cd /app/frontend
PORT=${PORT} HOSTNAME="0.0.0.0" node server.js &
FRONTEND_PID=$!

wait -n $BACKEND_PID $FRONTEND_PID
