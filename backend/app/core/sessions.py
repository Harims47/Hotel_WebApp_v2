import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import UserSession

SESSION_COOKIE_NAME = "session_id"
IDLE_TIMEOUT_HOURS = 2
ABSOLUTE_TIMEOUT_HOURS = 12

async def create_user_session(
    user_id: str,
    db: AsyncSession,
    ip_address: str | None = None,
    user_agent: str | None = None
) -> UserSession:
    """
    Create a new database-backed session token for a user.
    """
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=IDLE_TIMEOUT_HOURS)

    session = UserSession(
        user_id=user_id,
        session_token=token,
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def validate_user_session(token: str, db: AsyncSession) -> UserSession | None:
    """
    Validate the session token, enforce idle timeout updates, and return the session.
    """
    result = await db.execute(select(UserSession).where(UserSession.session_token == token))
    session = result.scalar_one_or_none()
    if not session:
        return None

    now = datetime.now(timezone.utc)
    # Check if session has expired
    if session.expires_at < now:
        await delete_user_session(token, db)
        return None

    # Check absolute timeout limit (12 hours from created_at)
    if session.created_at + timedelta(hours=ABSOLUTE_TIMEOUT_HOURS) < now:
        await delete_user_session(token, db)
        return None

    # Update idle expiration time
    session.expires_at = now + timedelta(hours=IDLE_TIMEOUT_HOURS)
    session.updated_at = now
    await db.commit()
    return session

async def delete_user_session(token: str, db: AsyncSession) -> None:
    """
    Invalidate session token from database.
    """
    await db.execute(delete(UserSession).where(UserSession.session_token == token))
    await db.commit()

async def cleanup_expired_sessions(db: AsyncSession) -> None:
    """
    Prune all expired sessions from the database.
    """
    now = datetime.utcnow()
    await db.execute(delete(UserSession).where(UserSession.expires_at < now))
    await db.commit()
