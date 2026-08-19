from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Response, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AuthException, PermissionException
from app.core.security import verify_password
from app.core.sessions import (
    create_user_session,
    delete_user_session,
    SESSION_COOKIE_NAME
)
from app.core.rbac import get_permissions_for_roles
from app.dependencies.auth import get_tenant_context, get_current_session
from app.models.auth import User, RestaurantMembership, UserRole, UserSession
from app.models.restaurant import Restaurant, Location
from app.schemas.auth import LoginRequest, LoginResponseData, MeResponseData
from app.core.responses import success_response, error_response

from collections import defaultdict
from app.core.exceptions import BusinessException

# In-memory tracking of failed login attempts
login_attempts = defaultdict(lambda: {"count": 0, "lock_until": None})

router = APIRouter()

@router.post("/login")
async def login(
    login_in: LoginRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user, issue server-side session cookie, and return expiration.
    """
    username = login_in.username
    now = datetime.now(timezone.utc)

    # Brute-force check
    track = login_attempts[username]
    if track["lock_until"] and track["lock_until"] > now:
        raise BusinessException(
            code="TOO_MANY_REQUESTS",
            message="Too many failed login attempts. Please try again after 15 minutes.",
            status_code=429
        )

    # Fetch user
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_in.password, user.password_hash):
        track["count"] += 1
        if track["count"] >= 5:
            track["lock_until"] = now + timedelta(minutes=15)
        raise AuthException("Invalid username or password")
        
    if user.status != "ACTIVE":
        raise PermissionException("User account is inactive")

    # Reset attempts on success
    login_attempts.pop(username, None)

    # Create session
    session = await create_user_session(
        user_id=user.id,
        db=db,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )

    data = LoginResponseData(expires_at=session.expires_at)
    res = success_response(data=data.model_dump(), message="Login successful")
    
    # Set HttpOnly Cookie on the returned JSONResponse
    res.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session.session_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="strict",
        path="/"
    )
    return res

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    session: UserSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db)
):
    """
    Invalidate the active session and clear the client cookie.
    """
    await delete_user_session(session.session_token, db)
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/me")
async def get_me(
    context: dict = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve session profiles, permissions, and active memberships.
    """
    user_id = context["user_id"]
    
    # Load user with memberships, roles, locations, and restaurants
    stmt = (
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.memberships)
            .selectinload(RestaurantMembership.restaurant)
        )
        .options(
            selectinload(User.memberships)
            .selectinload(RestaurantMembership.roles)
            .selectinload(UserRole.location)
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # Load active restaurant name
    stmt_res = select(Restaurant).where(Restaurant.id == context["restaurant_id"])
    res_result = await db.execute(stmt_res)
    restaurant = res_result.scalar_one_or_none()
    restaurant_name = restaurant.name if restaurant else "Unknown Brand"

    # Load active location name
    location_name = None
    if context["location_id"]:
        stmt_loc = select(Location).where(Location.id == context["location_id"])
        loc_result = await db.execute(stmt_loc)
        loc = loc_result.scalar_one_or_none()
        location_name = loc.name if loc else None

    # Format membership mapping
    memberships_data = []
    for m in user.memberships:
        roles_list = [ur.role for ur in m.roles]
        perms_list = get_permissions_for_roles(roles_list)
        locs_list = []
        for ur in m.roles:
            if ur.location:
                locs_list.append({
                    "location_id": str(ur.location.id),
                    "name": ur.location.name
                })
        memberships_data.append({
            "restaurant_id": str(m.restaurant_id),
            "restaurant_name": m.restaurant.name,
            "roles": roles_list,
            "permissions": perms_list,
            "locations": locs_list
        })

    response_content = {
        "user": {
            "id": str(user.id),
            "name": user.name,
            "username": user.username,
            "phone": user.phone
        },
        "active_context": {
            "restaurant_id": str(context["restaurant_id"]),
            "restaurant_name": restaurant_name,
            "location_id": str(context["location_id"]) if context["location_id"] else None,
            "location_name": location_name
        },
        "memberships": memberships_data
    }

    return success_response(data=response_content)
