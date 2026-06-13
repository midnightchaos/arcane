"""
Database connection helpers for AutoGPT integration
Provides both sync and async database access
"""
import sqlite3
import aiosqlite
from contextlib import asynccontextmanager
from app.config import settings

def get_db_connection():
    """Get synchronous database connection"""
    db_path = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

@asynccontextmanager
async def get_async_db():
    """Get asynchronous database connection"""
    db_path = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    async with aiosqlite.connect(db_path) as conn:
        conn.row_factory = aiosqlite.Row
        try:
            yield conn
            await conn.commit()
        except Exception:
            await conn.rollback()
            raise
