import uuid

from app.repos.user import UserRepository
from app.schemas.user import UserDetail, UserSummary
from litestar.di import NamedDependency
from litestar.exceptions import NotFoundException
from sqlalchemy.ext.asyncio import AsyncSession


class UserService:
    def __init__(self, db_session: AsyncSession) -> None:
        self._repo = UserRepository(db_session)

    async def get_all(self) -> list[UserSummary]:
        users = await self._repo.list_all()
        return [
            UserSummary.from_model(u, await self._repo.list_roles(u.id)) for u in users
        ]

    async def get(self, user_id: uuid.UUID) -> UserDetail:
        user = await self._repo.get_by_id(user_id)
        if user is None:
            raise NotFoundException(detail=f"User {user_id} not found")
        return UserDetail.from_model(user, await self._repo.list_roles(user.id))


async def provide_user_service(
    db_session: NamedDependency[AsyncSession],
) -> UserService:
    return UserService(db_session)
