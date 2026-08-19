import os
os.environ["ENVIRONMENT"] = "testing"
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from sqlalchemy import text as sa_text
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from httpx import AsyncClient

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models.auth import User, RestaurantMembership, UserRole, UserSession
from app.models.restaurant import Restaurant, Location, Table, RestaurantConfiguration, LocationConfiguration
from app.models.audit import AuditLog
from app.main import app

# Create a clean isolated async engine for testing
# We use the configured TEST_DATABASE_URL
# Conftest initialization

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

import asyncpg

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    """
    Verify test database exists, run table creation and drop after completion.
    """
    # Create test database if not exists
    conn = await asyncpg.connect("postgresql://postgres:password@localhost:5432/postgres")
    try:
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = 'postgres_test'")
        if not exists:
            await conn.execute("CREATE DATABASE postgres_test")
        
        # Create test_app_user role if it does not exist
        role_exists = await conn.fetchval("SELECT 1 FROM pg_roles WHERE rolname = 'test_app_user'")
        if not role_exists:
            await conn.execute("CREATE ROLE test_app_user WITH LOGIN PASSWORD 'password'")
    finally:
        await conn.close()

    engine = create_async_engine(settings.TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
        # We also need to enable RLS and add policies on the test database
        # Let's apply RLS policies directly and FORCE RLS on owners
        await conn.execute(sa_text("ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE restaurants FORCE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE locations ENABLE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE locations FORCE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE restaurant_configurations ENABLE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE restaurant_configurations FORCE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE location_configurations ENABLE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE location_configurations FORCE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE tables ENABLE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE tables FORCE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE restaurant_memberships ENABLE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE restaurant_memberships FORCE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;"))
        await conn.execute(sa_text("ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;"))

        # Create policies
        await conn.execute(sa_text("""
            CREATE POLICY tenant_isolation_policy ON restaurants
            USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        """))
        await conn.execute(sa_text("""
            CREATE POLICY tenant_isolation_policy ON locations
            USING (restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        """))
        await conn.execute(sa_text("""
            CREATE POLICY tenant_isolation_policy ON tables
            USING (
                restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                AND (
                    NULLIF(current_setting('app.current_location_id', true), '') IS NULL
                    OR location_id = NULLIF(current_setting('app.current_location_id', true), '')::uuid
                    OR current_setting('app.current_user_role', true) IN ('GM', 'SUPER_ADMIN')
                )
            );
        """))
        await conn.execute(sa_text("""
            CREATE POLICY tenant_isolation_policy ON restaurant_memberships
            USING (restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        """))
        await conn.execute(sa_text("""
            CREATE POLICY tenant_isolation_policy ON user_roles
            USING (
                EXISTS (
                    SELECT 1 FROM restaurant_memberships rm
                    WHERE rm.id = membership_id
                    AND rm.restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                )
            );
        """))
        await conn.execute(sa_text("""
            CREATE POLICY tenant_isolation_policy ON audit_logs
            USING (
                restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                AND (
                    NULLIF(current_setting('app.current_location_id', true), '') IS NULL
                    OR location_id = NULLIF(current_setting('app.current_location_id', true), '')::uuid
                    OR current_setting('app.current_user_role', true) IN ('GM', 'SUPER_ADMIN')
                )
            );
        """))

        # Grant permissions to non-superuser role
        await conn.execute(sa_text("GRANT ALL ON SCHEMA public TO test_app_user;"))
        await conn.execute(sa_text("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_app_user;"))
        await conn.execute(sa_text("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_app_user;"))

    yield
    # Clean up after session
    engine = create_async_engine(settings.TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db(setup_test_db) -> AsyncGenerator[AsyncSession, None]:
    """
    Provide transactional db session. Rolls back changes after each test.
    """
    engine = create_async_engine(settings.TEST_DATABASE_URL)
    connection = await engine.connect()
    transaction = await connection.begin()
    session = AsyncSession(bind=connection, expire_on_commit=False)

    # Bypass RLS inside database setups by default so we can seed data
    await session.execute(sa_text("SET LOCAL app.current_tenant_id = ''"))
    await session.execute(sa_text("SET LOCAL app.current_location_id = ''"))
    await session.execute(sa_text("SET LOCAL app.current_user_role = 'SUPER_ADMIN'"))

    yield session

    await session.close()
    await transaction.rollback()
    await connection.close()
    await engine.dispose()

@pytest_asyncio.fixture
async def seed_data(db: AsyncSession):
    """
    Seed test fixture records.
    """
    # Restaurants
    rest_a = Restaurant(id=uuid.UUID("a0000000-0000-0000-0000-000000000000"), name="Restaurant A")
    rest_b = Restaurant(id=uuid.UUID("b0000000-0000-0000-0000-000000000000"), name="Restaurant B")
    db.add_all([rest_a, rest_b])
    await db.flush()

    # Locations
    loc_a1 = Location(id=uuid.UUID("a1111111-1111-1111-1111-111111111111"), restaurant_id=rest_a.id, name="Location A1")
    loc_a2 = Location(id=uuid.UUID("a2222222-2222-2222-2222-222222222222"), restaurant_id=rest_a.id, name="Location A2")
    loc_b1 = Location(id=uuid.UUID("b1111111-1111-1111-1111-111111111111"), restaurant_id=rest_b.id, name="Location B1")
    db.add_all([loc_a1, loc_a2, loc_b1])
    await db.flush()

    # Users
    pwd_hash = hash_password("password123")
    
    super_admin = User(id=uuid.uuid4(), name="Super Admin", username="admin", password_hash=pwd_hash, status="ACTIVE")
    a_gm = User(id=uuid.uuid4(), name="Resto A GM", username="a_gm", password_hash=pwd_hash, status="ACTIVE")
    a_waiter = User(id=uuid.uuid4(), name="Resto A Waiter", username="a_waiter", password_hash=pwd_hash, status="ACTIVE")
    b_gm = User(id=uuid.uuid4(), name="Resto B GM", username="b_gm", password_hash=pwd_hash, status="ACTIVE")
    b_waiter = User(id=uuid.uuid4(), name="Resto B Waiter", username="b_waiter", password_hash=pwd_hash, status="ACTIVE")
    inactive_user = User(id=uuid.uuid4(), name="Inactive User", username="inactive", password_hash=pwd_hash, status="INACTIVE")
    
    db.add_all([super_admin, a_gm, a_waiter, b_gm, b_waiter, inactive_user])
    await db.flush()

    # Memberships
    m_admin = RestaurantMembership(user_id=super_admin.id, restaurant_id=rest_a.id, status="ACTIVE")
    m_a_gm = RestaurantMembership(user_id=a_gm.id, restaurant_id=rest_a.id, status="ACTIVE")
    m_a_waiter = RestaurantMembership(user_id=a_waiter.id, restaurant_id=rest_a.id, status="ACTIVE")
    m_b_gm = RestaurantMembership(user_id=b_gm.id, restaurant_id=rest_b.id, status="ACTIVE")
    m_b_waiter = RestaurantMembership(user_id=b_waiter.id, restaurant_id=rest_b.id, status="ACTIVE")
    
    db.add_all([m_admin, m_a_gm, m_a_waiter, m_b_gm, m_b_waiter])
    await db.flush()

    # Roles
    r_admin = UserRole(membership_id=m_admin.id, location_id=None, role="SUPER_ADMIN")
    r_a_gm = UserRole(membership_id=m_a_gm.id, location_id=None, role="GM")
    r_a_waiter = UserRole(membership_id=m_a_waiter.id, location_id=loc_a1.id, role="WAITER")
    r_b_gm = UserRole(membership_id=m_b_gm.id, location_id=None, role="GM")
    r_b_waiter = UserRole(membership_id=m_b_waiter.id, location_id=loc_b1.id, role="WAITER")
    
    db.add_all([r_admin, r_a_gm, r_a_waiter, r_b_gm, r_b_waiter])
    
    # Add Tables for testing
    t_a1 = Table(id=uuid.uuid4(), restaurant_id=rest_a.id, location_id=loc_a1.id, table_number="T01", capacity=4)
    t_a2 = Table(id=uuid.uuid4(), restaurant_id=rest_a.id, location_id=loc_a2.id, table_number="T01", capacity=4)
    t_b1 = Table(id=uuid.uuid4(), restaurant_id=rest_b.id, location_id=loc_b1.id, table_number="T01", capacity=4)
    db.add_all([t_a1, t_a2, t_b1])
    
    await db.commit()

    return {
        "rest_a": rest_a,
        "rest_b": rest_b,
        "loc_a1": loc_a1,
        "loc_a2": loc_a2,
        "loc_b1": loc_b1,
        "a_gm": a_gm,
        "a_waiter": a_waiter,
        "b_gm": b_gm,
        "b_waiter": b_waiter,
        "super_admin": super_admin,
        "inactive_user": inactive_user
    }

@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    HTTP Client executing requests against local app. Overrides the database dependency.
    """
    def override_get_db():
        return db

    app.dependency_overrides[get_db] = override_get_db
    from httpx import ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://127.0.0.1") as ac:
        yield ac
    app.dependency_overrides.clear()
