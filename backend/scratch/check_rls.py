import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

async def main():
    engine = create_async_engine(settings.TEST_DATABASE_URL)
    async with engine.connect() as conn:
        trans = await conn.begin()
        try:
            print("INITIAL USER:", (await conn.execute(text("SELECT current_user"))).scalar())
            
            # Switch role
            await conn.execute(text("SET LOCAL ROLE test_app_user"))
            print("AFTER SET LOCAL ROLE:", (await conn.execute(text("SELECT current_user"))).scalar())
            
            # Check session user
            print("SESSION USER:", (await conn.execute(text("SELECT session_user"))).scalar())
        finally:
            await trans.rollback()

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
