from fastapi import Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db, set_db_tenant_context
from app.core.exceptions import AuthException, PermissionException
from app.core.rbac import get_permissions_for_roles, has_permission
from app.core.sessions import validate_user_session, SESSION_COOKIE_NAME
from app.models.auth import UserSession, User, RestaurantMembership

async def get_current_session(request: Request, db: AsyncSession = Depends(get_db)) -> UserSession:
    """
    Dependency returning validated user session from HTTP cookies.
    """
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise AuthException("Not authenticated")
    
    session = await validate_user_session(token, db)
    if not session:
        raise AuthException("Session invalid or expired")
    return session

async def get_current_user(session: UserSession = Depends(get_current_session), db: AsyncSession = Depends(get_db)) -> User:
    """
    Dependency loading User details.
    """
    stmt = select(User).where(User.id == session.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise AuthException("User not found")
    if user.status != "ACTIVE":
        raise PermissionException("User account is inactive")
    return user

async def get_tenant_context(
    request: Request,
    session: UserSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Middleware-like dependency resolving active user, tenant, location, and roles.
    Sets transaction-local RLS configuration context variables.
    """
    # Prefetch user memberships & roles
    stmt = (
        select(User)
        .where(User.id == session.user_id)
        .options(
            selectinload(User.memberships)
            .selectinload(RestaurantMembership.roles)
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user or user.status != "ACTIVE":
        raise PermissionException("Active user membership required")

    # In a production SaaS, the client selects the active membership brand
    # Here, we look up the primary active membership.
    # To switch, the client can supply X-Restaurant-ID and X-Location-ID headers.
    req_rest_id = request.headers.get("X-Restaurant-ID")
    req_loc_id = request.headers.get("X-Location-ID")

    # Resolve active restaurant membership
    membership = None
    if req_rest_id:
        membership = next((m for m in user.memberships if str(m.restaurant_id) == req_rest_id and m.status == "ACTIVE"), None)
    else:
        membership = next((m for m in user.memberships if m.status == "ACTIVE"), None)

    if not membership:
        raise PermissionException("No active membership found for this brand")

    # Resolve roles and location access scoping
    assigned_roles = [r.role for r in membership.roles]
    permissions = get_permissions_for_roles(assigned_roles)

    # Scoping checks
    active_location_id = None
    active_role = assigned_roles[0] if assigned_roles else "GUEST"

    # GM wildcard scope or specific location scope validation
    if "SUPER_ADMIN" in assigned_roles or "GM" in assigned_roles:
        # GM can access all locations (location_id is NULL) or target location
        if req_loc_id:
            import uuid
            active_location_id = uuid.UUID(req_loc_id)
    else:
        # Standard staff is bound to specific locations assigned in user_roles
        bound_locs = [r.location_id for r in membership.roles if r.location_id is not None]
        if bound_locs:
            if req_loc_id:
                import uuid
                target_uuid = uuid.UUID(req_loc_id)
                if target_uuid in bound_locs:
                    active_location_id = target_uuid
                else:
                    raise PermissionException("Unauthorized location access")
            else:
                active_location_id = bound_locs[0]
        else:
            raise PermissionException("No location assigned to user role")

    # ESTABLISH RLS CONTEXT (Transaction Local app.current_tenant_id)
    await set_db_tenant_context(
        db=db,
        tenant_id=str(membership.restaurant_id),
        location_id=active_location_id,
        role=active_role
    )

    context = {
        "user_id": user.id,
        "restaurant_id": membership.restaurant_id,
        "location_id": active_location_id,
        "roles": assigned_roles,
        "permissions": permissions,
        "active_role": active_role
    }
    request.state.tenant_context = context
    return context

def require_permission(required_permission: str):
    """
    Parameterized router dependency verifying fine-grained permissions.
    """
    def dependency(context: dict = Depends(get_tenant_context)):
        if not has_permission(context["permissions"], required_permission):
            raise PermissionException(f"Missing required permission: {required_permission}")
        return context
    return dependency
