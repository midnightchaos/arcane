# ARCANE: Multi-Agent AI Platform & Pipeline Studio

Welcome to **ARCANE**, a full-stack, multi-agent AI platform designed for modular, pipeline-based workflow automation. It leverages FastAPI on the backend and React + TypeScript + Zustand on the frontend, featuring deep integration with local LLMs via Ollama.

## 🎯 Architecture Overview

The codebase is split logically between a root-level frontend and a `backend/` sub-service:

```
ARCANE/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # Route endpoints (auth, chat, workflows, etc.)
│   │   ├── core/             # AI core, runner, security, and scheduling logic
│   │   ├── db/               # SQLAlchemy models and SQLite initialization
│   │   └── models/           # Pydantic and database schemas
│   ├── tests/                # Pytest suite
│   ├── main.py               # Backend API server entrypoint
│   └── requirements.txt      # Python dependencies
│
├── src/                      # React Frontend Source
│   ├── components/           # Reusable UI widgets
│   ├── pages/                # Main views (Chat, Dashboard, Studio)
│   ├── services/             # API clients
│   ├── store/                # State management (Zustand)
│   └── types/                # TypeScript interfaces
│
├── scripts/                  # Unified launchers and setup scripts
└── Makefile                  # Task automation shortcut definitions
```

---

## 🚀 Quick Start

### 📋 Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ (npm)
- **Ollama**: Installed and running locally (`ollama serve`)

### 🔧 1. Installation
Run the automated installer to set up frontend packages, Python virtual environments, and configuration template overrides:

- **Via Makefile (All Platforms)**:
  ```bash
  make install
  ```
- **Unix/Linux/macOS**:
  ```bash
  ./scripts/fresh_install.sh
  ```
- **Windows**:
  ```cmd
  scripts\fresh_install.bat
  ```

### ⚡ 2. Environment Setup
Configure your environment variables. Ensure a secure `SECRET_KEY` is defined in `backend/.env` (no default fallbacks are accepted by the system):
```env
SECRET_KEY=your-secure-random-string-here
```

### 🏃 3. Run the Application
Start both the FastAPI backend (port `8000`) and the Vite frontend (port `5173`):

- **Via Makefile (All Platforms)**:
  ```bash
  make run
  ```
- **Unix/Linux/macOS**:
  ```bash
  ./scripts/run.sh
  ```
- **Windows**:
  ```cmd
  scripts\run.bat
  ```

---

## 🧪 Testing

ARCANE is configured with a robust test suite covering authentication endpoints and core pipeline logic (topological sorting, input resolution, and transform executions).

To run the automated tests:

- **Via Makefile (All Platforms)**:
  ```bash
  make test
  ```
- **Direct Pytest**:
  ```bash
  cd backend
  # Ensure the venv is active
  pytest
  ```

---

## 🔐 Security & Hardening

1. **Strict Configuration**: Default fallback values for `SECRET_KEY` are removed. The application enforces environment-specified values to protect JWT validation signatures.
2. **Standard CORS Integration**: CORS origin matching is strictly bound to configuration `CORS_ORIGINS` (defaulting to localhost) rather than permissive wildcards (`*`) to ensure safe stateful request execution with `allow_credentials=True`.
3. **Local Storage Compliance**: Model binaries and datasets are stored cleanly inside the root `.model/` folder rather than globally.
