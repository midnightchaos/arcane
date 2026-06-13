#!/usr/bin/env bash
set -e

# Resolve script directory and change to repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

echo "==================================================="
echo "    Arcane12 Fresh Install Script (Unix)"
echo "==================================================="
echo

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 is not installed or not in PATH."
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    exit 1
fi

# Create .model folder for model downloads if not exists
echo "Checking for .model directory..."
if [ ! -d ".model" ]; then
    mkdir ".model"
    echo "Created .model directory for model downloads."
else
    echo ".model directory already exists."
fi

echo
echo "[1/4] Installing Frontend Dependencies..."
npm install

echo
echo "[2/4] Setting up Python Virtual Environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created in backend/venv."
else
    echo "Virtual environment already exists."
fi

echo
echo "[3/4] Installing Backend Dependencies..."
source venv/bin/activate
python3 -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo
echo "[4/4] Setting up Environment Variables..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Copied .env.example to .env"
    else
        touch .env
        echo "Created empty .env file"
    fi
else
    echo "Frontend .env already exists."
fi

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "Copied backend/.env.example to backend/.env"
    else
        touch backend/.env
        echo "Created empty backend/.env file"
    fi
else
    echo "Backend .env already exists."
fi

echo
echo "==================================================="
echo "  Installation Complete!"
echo "  You can now run the system using: ./scripts/run.sh"
echo "  Note: Any downloaded models should go to the .model dir."
echo "==================================================="
