from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.responses import success_response, error_response

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Check if the API process is alive.
    """
    return success_response(data={"status": "healthy"}, message="Application is alive")

@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """
    Verify PostgreSQL database connection readiness.
    """
    try:
        # Simple test query to check db health
        await db.execute(text("SELECT 1"))
        return success_response(data={"database": "connected"}, message="Application is ready")
    except Exception as e:
        return error_response(
            code="SERVICE_UNAVAILABLE",
            message="Database connection failed",
            status_code=503
        )
