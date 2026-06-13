"""
System API Endpoints
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
import psutil
import time

from app.models.user import User
from app.core.security import get_current_user
from app.core.ollama_client import ollama_client
from app.core.agent_router import agent_router

router = APIRouter(prefix="/system", tags=["System"])

# Store server start time
SERVER_START_TIME = time.time()

class SystemStatus(BaseModel):
    ollamaConnected: bool
    activeAgents: int
    memoryUsage: float
    uptime: int
    availableModels: List[str]

@router.get("/status", response_model=SystemStatus)
async def get_system_status(current_user: User = Depends(get_current_user)):
    """Get system health and metrics"""
    
    # Check Ollama connection
    ollama_connected = await ollama_client.check_connection()
    
    # Get available models
    models = []
    if ollama_connected:
        models = await ollama_client.list_models()
    
    # Count active agents (those that are not idle)
    agents = agent_router.list_agents()
    active_agents = sum(1 for agent in agents if agent.get("status") != "idle")
    
    # Get memory usage
    memory = psutil.virtual_memory()
    memory_usage = memory.percent
    
    # Calculate uptime
    uptime = int(time.time() - SERVER_START_TIME)
    
    return SystemStatus(
        ollamaConnected=ollama_connected,
        activeAgents=len(agents),  # Return total agents for now
        memoryUsage=memory_usage,
        uptime=uptime,
        availableModels=models
    )
