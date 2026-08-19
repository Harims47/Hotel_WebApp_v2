import pytest
import uuid
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.restaurant import Table, Location
from app.core.database import set_db_tenant_context

@pytest.mark.asyncio
async def test_tenant_rls_isolation(db: AsyncSession, seed_data: dict):
    """
    Direct database test asserting RLS isolates Restaurant A from Restaurant B.
    """
    # 1. Establish context for Restaurant A (Tenant A)
    await set_db_tenant_context(
        db=db,
        tenant_id="a0000000-0000-0000-0000-000000000000",
        location_id="a1111111-1111-1111-1111-111111111111",
        role="WAITER"
    )

    # Fetch tables
    stmt = select(Table)
    result = await db.execute(stmt)
    tables = result.scalars().all()
    
    # Assert we only see Restaurant A tables
    assert len(tables) > 0
    for table in tables:
        assert str(table.restaurant_id) == "a0000000-0000-0000-0000-000000000000"
        assert str(table.location_id) != "b1111111-1111-1111-1111-111111111111"

    # 2. Establish context for Restaurant B (Tenant B)
    await set_db_tenant_context(
        db=db,
        tenant_id="b0000000-0000-0000-0000-000000000000",
        location_id="b1111111-1111-1111-1111-111111111111",
        role="WAITER"
    )

    # Fetch tables
    result = await db.execute(select(Table))
    tables_b = result.scalars().all()
    
    # Assert we only see Restaurant B tables
    assert len(tables_b) > 0
    for table in tables_b:
        assert str(table.restaurant_id) == "b0000000-0000-0000-0000-000000000000"
        assert str(table.location_id) == "b1111111-1111-1111-1111-111111111111"

@pytest.mark.asyncio
async def test_location_isolation_and_gm_wildcard(db: AsyncSession, seed_data: dict):
    """
    Test that standard staff can only see their assigned location,
    while GM can see all locations within the tenant restaurant.
    """
    # 1. Staff bound to Coimbatore Main (Location A1)
    await set_db_tenant_context(
        db=db,
        tenant_id="a0000000-0000-0000-0000-000000000000",
        location_id="a1111111-1111-1111-1111-111111111111",
        role="WAITER"
    )
    
    result = await db.execute(select(Table))
    tables = result.scalars().all()
    # Waiter only sees tables in Coimbatore Main (Location A1)
    assert len(tables) == 1
    assert str(tables[0].location_id) == "a1111111-1111-1111-1111-111111111111"

    # 2. GM with restaurant-wide wildcard context (location_id is NULL)
    await set_db_tenant_context(
        db=db,
        tenant_id="a0000000-0000-0000-0000-000000000000",
        location_id=None,
        role="GM"
    )
    
    result = await db.execute(select(Table))
    tables_gm = result.scalars().all()
    # GM sees tables across both Coimbatore Main (A1) and Coimbatore Kitchen (A2)
    assert len(tables_gm) == 2
    locs = [str(t.location_id) for t in tables_gm]
    assert "a1111111-1111-1111-1111-111111111111" in locs
    assert "a2222222-2222-2222-2222-222222222222" in locs

@pytest.mark.asyncio
async def test_connection_pooling_leak_prevention(db: AsyncSession, seed_data: dict):
    """
    Verify that executing context updates does not persist settings to other connections.
    """
    # Set context
    await set_db_tenant_context(
        db=db,
        tenant_id="a0000000-0000-0000-0000-000000000000",
        location_id="a1111111-1111-1111-1111-111111111111",
        role="WAITER"
    )
    
    # Verify we can read tables
    res1 = await db.execute(select(Table))
    assert len(res1.scalars().all()) > 0

    # Commit/Rollback transaction (cleans local settings)
    await db.rollback()

    # Query again without setting context (parameters are dropped by database)
    res2 = await db.execute(select(Table))
    assert len(res2.scalars().all()) == 0
