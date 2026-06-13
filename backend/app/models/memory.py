from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.session import Base

class MemoryEntry(Base):
    __tablename__ = "memory_entries"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    namespace = Column(String, index=True, default="default")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
