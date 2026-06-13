"""
Chat API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.chat import ChatSession, Message
from app.core.security import get_current_user
from app.core.agent_router import agent_router

router = APIRouter(prefix="/chat", tags=["Chat"])

# Pydantic models
class MessageCreate(BaseModel):
    sessionId: str
    message: str
    agentType: str

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    timestamp: datetime
    agentType: Optional[str] = None
    
    class Config:
        from_attributes = True

class SessionCreate(BaseModel):
    agentType: str
    workflowId: Optional[str] = None

class SessionResponse(BaseModel):
    id: str
    userId: str = Field(alias="user_id")
    agentType: str = Field(alias="agent_type")
    createdAt: datetime = Field(alias="created_at")
    updatedAt: Optional[datetime] = Field(default=None, alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True

class SessionWithMessages(SessionResponse):
    messages: List[MessageResponse] = []

@router.get("/sessions", response_model=List[SessionResponse])
async def get_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all chat sessions for current user"""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
    )
    sessions = result.scalars().all()
    return [SessionResponse.model_validate(s) for s in sessions]

@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new chat session"""
    new_session = ChatSession(
        user_id=current_user.id,
        agent_type=session_data.agentType,
        workflow_id=session_data.workflowId
    )
    
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    return SessionResponse.model_validate(new_session)

@router.get("/sessions/{session_id}", response_model=SessionWithMessages)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific chat session with messages"""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Get messages for this session
    messages_result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.timestamp)
    )
    messages = messages_result.scalars().all()
    
    return SessionWithMessages(
        **SessionResponse.model_validate(session).model_dump(),
        messages=[MessageResponse.model_validate(m) for m in messages]
    )

@router.post("/send", response_model=MessageResponse)
async def send_message(
    msg_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a message and get complete response"""
    
    # Verify session belongs to user
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == msg_data.sessionId, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Save user message
    user_message = Message(
        session_id=msg_data.sessionId,
        role="user",
        content=msg_data.message
    )
    db.add(user_message)
    await db.commit()
    
    # Get agent response
    try:
        response = await agent_router.execute(
            msg_data.agentType,
            msg_data.message,
            stream=False
        )
        
        ai_content = response.get("response", "")
        
    except Exception as e:
        ai_content = f"Error: {str(e)}"
    
    # Save AI response
    ai_message = Message(
        session_id=msg_data.sessionId,
        role="assistant",
        content=ai_content,
        agent_type=msg_data.agentType
    )
    db.add(ai_message)
    await db.commit()
    await db.refresh(ai_message)
    
    return MessageResponse.model_validate(ai_message)

@router.post("/stream")
async def stream_message(
    msg_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Stream message response"""
    
    # Verify session
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == msg_data.sessionId, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Save user message
    user_message = Message(
        session_id=msg_data.sessionId,
        role="user",
        content=msg_data.message
    )
    db.add(user_message)
    await db.commit()
    
    # Stream response
    async def generate():
        full_response = ""
        try:
            generator = await agent_router.execute(
                msg_data.agentType,
                msg_data.message,
                stream=True
            )
            
            async for chunk in generator:
                full_response += chunk
                yield chunk
            
            # Save complete response to database
            ai_message = Message(
                session_id=msg_data.sessionId,
                role="assistant",
                content=full_response,
                agent_type=msg_data.agentType
            )
            db.add(ai_message)
            await db.commit()
            
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            yield error_msg
            
            # Save error message
            ai_message = Message(
                session_id=msg_data.sessionId,
                role="assistant",
                content=error_msg,
                agent_type=msg_data.agentType
            )
            db.add(ai_message)
            await db.commit()
    
    return StreamingResponse(generate(), media_type="text/plain")

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a specific chat session"""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    await db.delete(session)
    await db.commit()
    return None

@router.delete("/sessions", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete all chat sessions for current user"""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
    )
    sessions = result.scalars().all()
    
    for session in sessions:
        await db.delete(session)
    
    await db.commit()
    return None
