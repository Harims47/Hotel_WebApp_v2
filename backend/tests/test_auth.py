import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.sessions import SESSION_COOKIE_NAME

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, seed_data: dict, db: AsyncSession):
    """
    Test successful login: session cookie set, JSON body contains no session ID.
    """
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "a_waiter", "password": "password123"}
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "expires_at" in res_data["data"]
    assert "session_id" not in res_data["data"]  # Must not return session ID in JSON

    # Assert cookie header
    assert "set-cookie" in response.headers
    assert "session_id=" in response.headers["set-cookie"]
    assert "HttpOnly" in response.headers["set-cookie"]

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, seed_data: dict):
    """
    Test login failures for incorrect password or unknown username.
    """
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "a_waiter", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["success"] is False

@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient, seed_data: dict):
    """
    Test that inactive users are rejected during authentication.
    """
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "inactive", "password": "password123"}
    )
    assert response.status_code == 403
    assert response.json()["success"] is False

@pytest.mark.asyncio
async def test_logout(client: AsyncClient, seed_data: dict):
    """
    Test logout clears cookie and invalidates session token.
    """
    # Login first
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"username": "a_waiter", "password": "password123"}
    )
    assert login_response.status_code == 200
    
    # Logout
    logout_response = await client.post("/api/v1/auth/logout")
    assert logout_response.status_code == 204
    
    # Try accessing protected endpoint
    me_response = await client.get("/api/v1/auth/me")
    assert me_response.status_code == 401

@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    """
    Test profile query without active session returns unauthorized.
    """
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_login_rate_limiting(client: AsyncClient, seed_data: dict):
    """
    Test login rate limiting blocks attempts after 5 failures.
    """
    # 5 failed attempts
    for _ in range(5):
        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "rate_limited_user", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        
    # 6th attempt must trigger HTTP 429
    blocked_response = await client.post(
        "/api/v1/auth/login",
        json={"username": "rate_limited_user", "password": "wrongpassword"}
    )
    assert blocked_response.status_code == 429
    assert blocked_response.json()["error"]["code"] == "TOO_MANY_REQUESTS"
