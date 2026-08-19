from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import User, RestaurantMembership, UserRole
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_profile(self, user_id: str) -> User | None:
        """
        Load user with memberships and roles eagerly prefetched.
        """
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.memberships)
                .selectinload(RestaurantMembership.roles)
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
