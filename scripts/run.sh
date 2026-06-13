#!/usr/bin/env bash

# Resolve script directory and change to repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

echo "==================================================="
echo "    ARCANE : MULTI-AGENT ARCHITECTURE (Unix)"
echo "    Status: 0.1.0-ALPHA"
echo "==================================================="
echo

# 1. Check Ollama
echo "[1/4] Checking Ollama Service..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✓ Ollama is running"
else
    echo "✗ Ollama is not detected! Please start Ollama before continuing."
    exit 1
fi

# Define cleanup function
cleanup() {
    echo
    echo "Stopping servers..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}

# Trap CTRL+C (SIGINT), SIGTERM
trap cleanup SIGINT SIGTERM

# 2. Start Backend
echo "[2/4] Initialising ARCANE Backend..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to warm up
echo "    Waiting for internal cores to sync..."
sleep 5

# 3. Start Frontend
echo "[3/4] Launching ARCANE Interface..."
npm run dev &
FRONTEND_PID=$!

echo
echo "==================================================="
echo "  ✓ SYSTEM ONLINE AND OPERATIONAL"
echo "==================================================="
echo
echo "  Access Points:"
echo "  → Interface: http://localhost:5173"
echo "  → Backend:   http://localhost:8000"
echo "  → API Docs:  http://localhost:8000/docs"
echo
echo "  Press Ctrl+C to stop all services."
echo

# Wait for background processes
wait
