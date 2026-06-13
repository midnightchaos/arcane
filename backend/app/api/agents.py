"""
Agents API Endpoints
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional

from app.models.user import User
from app.core.security import get_current_user
from app.core.agent_router import agent_router

router = APIRouter(prefix="/agents", tags=["Agents"])

class AgentInfo(BaseModel):
    id: str
    name: str
    type: str
    model: str
    status: str
    description: str

@router.get("/list", response_model=List[AgentInfo])
async def list_agents(current_user: User = Depends(get_current_user)):
    """List all available agents"""
    agents = agent_router.list_agents()
    return [AgentInfo(**agent) for agent in agents]

@router.get("/{agent_id}/status", response_model=AgentInfo)
async def get_agent_status(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get status of specific agent"""
    status = agent_router.get_agent_status(agent_id)
    if "error" in status:
        from fastapi import HTTPException, status as http_status
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=status["error"]
        )
    return AgentInfo(**status)
