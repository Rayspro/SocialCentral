import os
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/socialsync")
# Convert to async URL if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Remove sslmode parameter for asyncpg compatibility
if "?sslmode=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("?sslmode=")[0]

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

# Dependency to get database session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Initialize database
async def init_database():
    """Initialize database with default data"""
    try:
        async with AsyncSessionLocal() as session:
            # Test connection
            await session.execute(text("SELECT 1"))
            await session.commit()
            print("[database] Database connection established")
            
            # Initialize default data if needed
            await init_default_data(session)
            
    except Exception as e:
        print(f"[database] Error initializing database: {e}")
        raise

async def init_default_data(session: AsyncSession):
    """Initialize default data in the database"""
    try:
        # Check if we have any users
        result = await session.execute(text("SELECT COUNT(*) FROM users"))
        user_count = result.scalar()
        
        if user_count == 0:
            # Create default user
            await session.execute(text("""
                INSERT INTO users (email, username, first_name, last_name, password_hash, created_at, updated_at)
                VALUES ('admin@example.com', 'admin', 'Admin', 'User', '$2b$10$example_hash', NOW(), NOW())
            """))
            
            # Create default platform
            await session.execute(text("""
                INSERT INTO platforms (name, display_name, is_active, created_at, updated_at)
                VALUES ('youtube', 'YouTube', true, NOW(), NOW())
            """))
            
            await session.commit()
            print("[database] Default data initialized")
            
    except Exception as e:
        print(f"[database] Error initializing default data: {e}")
        await session.rollback()