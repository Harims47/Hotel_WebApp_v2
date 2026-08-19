from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# Create async engine with robust connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_recycle=1800,  # 30 minutes
    pool_timeout=30.0,
    pool_pre_ping=True, # health check before checkout
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    """
    declarative base for SQLAlchemy models.
    """
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding a clean database session context.
    Ensures rollback on exceptions and automatic release back to the pool.
    """
    session = AsyncSessionLocal()
    try:
        yield session
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()

from sqlalchemy import text

async def set_db_tenant_context(db: AsyncSession, tenant_id: str, location_id: str | None, role: str) -> None:
    """
    Set PostgreSQL transaction-local configuration parameters for RLS policies.
    """
    if settings.ENVIRONMENT == "testing":
        await db.execute(text("SET LOCAL ROLE test_app_user"))

    await db.execute(
        text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"),
        {"tenant_id": str(tenant_id)}
    )
    location_str = str(location_id) if location_id else ""
    await db.execute(
        text("SELECT set_config('app.current_location_id', :location_id, true)"),
        {"location_id": location_str}
    )
    await db.execute(
        text("SELECT set_config('app.current_user_role', :role, true)"),
        {"role": role}
    )

