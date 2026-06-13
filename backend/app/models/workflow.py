"""
Workflow Database Models
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Workflow(Base):
    """Workflow model for multi-agent orchestration"""
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    workflow_type = Column(String, nullable=False)  # sequential, parallel, conditional
    config = Column(JSON, nullable=False)  # Workflow configuration
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="workflows")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowExecution(Base):
    """Workflow execution history"""
    __tablename__ = "workflow_executions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    workflow_id = Column(String, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False)  # pending, running, completed, failed
    input_data = Column(Text)
    output_data = Column(Text)
    error_message = Column(Text)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    execution_log = Column(JSON)  # Detailed step-by-step log
    
    # Relationships
    workflow = relationship("Workflow", back_populates="executions")
