from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.restaurant import Restaurant, Location, Table
from app.repositories.base import BaseRepository

class RestaurantRepository(BaseRepository[Restaurant]):
    def __init__(self, db: AsyncSession):
        super().__init__(Restaurant, db)

class LocationRepository(BaseRepository[Location]):
    def __init__(self, db: AsyncSession):
        super().__init__(Location, db)

class TableRepository(BaseRepository[Table]):
    def __init__(self, db: AsyncSession):
        super().__init__(Table, db)

    async def get_by_location(self, location_id: str) -> list[Table]:
        stmt = select(Table).where(Table.location_id == location_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
