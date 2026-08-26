#!/bin/bash
set -e

PORT=${PORT:-8080}
echo "Starting Mahindra Omnichannel Backend on 0.0.0.0:8000..."
cd /app/backend
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting Next.js Frontend on 0.0.0.0:${PORT}..."
cd /app/frontend
npm run start -- -p ${PORT} &
FRONTEND_PID=$!

wait -n $BACKEND_PID $FRONTEND_PID
