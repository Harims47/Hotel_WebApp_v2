import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog

async def create_audit_log(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    location_id: uuid.UUID | None,
    user_id: uuid.UUID | None,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    description: str,
    old_state: dict | None = None,
    new_state: dict | None = None,
    ip_address: str | None = None
) -> AuditLog:
    """
    Persist an audit entry in the write-only audit logs table.
    """
    log_entry = AuditLog(
        restaurant_id=restaurant_id,
        location_id=location_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        old_state=old_state,
        new_state=new_state,
        ip_address=ip_address
    )
    db.add(log_entry)
    await db.commit()
    return log_entry
