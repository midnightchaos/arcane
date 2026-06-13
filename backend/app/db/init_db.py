from sqlalchemy.ext.asyncio import AsyncEngine
from app.db.session import Base, engine
from app.models.user import User
from app.models.chat import ChatSession, Message
from app.models.workflow import Workflow, WorkflowExecution
from app.models.memory import MemoryEntry

async def init_database():
    """Initialize database tables"""
    async with engine.begin() as conn:
        # Drop all tables (be careful in production!)
        # await conn.run_sync(Base.metadata.drop_all)
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    import asyncio
    asyncio.run(init_database())
    print("Database initialized successfully!")
