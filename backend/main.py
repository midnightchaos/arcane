"""
ARCANE Backend - Main Application Entry Point
FastAPI application for multi-agent AI system
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import sys
import asyncio

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from app.config import settings
from app.db.init_db import init_database
from app.core.ollama_client import ollama_client
from app.core.scheduler import start_scheduler

# Import routers
from app.api import auth, chat, agents, system, workflows, code, pdf, studio

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown"""
    # Startup
    print("🚀 Starting ARCANE Backend...")
    
    # Initialize database
    await init_database()
    print("✓ Database initialized")
    
    # Check Ollama connection
    is_connected = await ollama_client.check_connection()
    if is_connected:
        print("✓ Ollama connected")
        models = await ollama_client.list_models()
        print(f"✓ Available models: {', '.join(models)}")
    else:
        print("⚠ Warning: Ollama not connected. Please start Ollama service.")
    
    print("✓ CORS configured - allowing all origins")
    
    # Start Headless Scheduler
    start_scheduler()
    print("✓ Headless Scheduler started")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down ARCANE Backend...")
    await ollama_client.close()
    print("✓ Cleanup complete")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan
)

# CRITICAL: CORS middleware MUST be added BEFORE any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE, OPTIONS, PATCH
    allow_headers=["*"],  # All headers allowed
)

# Explicit OPTIONS handler for all paths
@app.options("/{full_path:path}")
async def options_handler(request: Request):
    """Handle CORS preflight requests"""
    origin = request.headers.get("origin")
    # Dynamically match allowed origins or default to first configured
    allow_origin = origin if origin in settings.CORS_ORIGINS else (settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "*")
    headers = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": "*",
    }
    if allow_origin != "*":
        headers["Access-Control-Allow-Origin"] = allow_origin
        headers["Access-Control-Allow-Credentials"] = "true"
    else:
        headers["Access-Control-Allow-Origin"] = "*"
        
    return JSONResponse(
        content={"status": "ok"},
        status_code=200,
        headers=headers
    )


# Include routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(chat.router, prefix=settings.API_PREFIX)
app.include_router(agents.router, prefix=settings.API_PREFIX)
app.include_router(system.router, prefix=settings.API_PREFIX)
app.include_router(workflows.router, prefix=settings.API_PREFIX)
app.include_router(code.router, prefix=f"{settings.API_PREFIX}/coding")

# Additional functionality
app.include_router(pdf.router, prefix=settings.API_PREFIX)
app.include_router(studio.router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "cors": "enabled"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    ollama_connected = await ollama_client.check_connection()
    return {
        "status": "ok",
        "ollama": "connected" if ollama_connected else "disconnected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
