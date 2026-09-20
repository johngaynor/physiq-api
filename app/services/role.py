import uuid

from app.repos.role import RoleRepository
from app.schemas.role import RoleRead
from litestar.di import NamedDependency
from litestar.exceptions import NotFoundException
from sqlalchemy.ext.asyncio import AsyncSession


class RoleService:
    def __init__(self, db_session: AsyncSession) -> None:
        self._repo = RoleRepository(db_session)

    async def get_all(self) -> list[RoleRead]:
        roles = await self._repo.list_all()
        return [RoleRead.from_model(r) for r in roles]

    async def get(self, role_id: uuid.UUID) -> RoleRead:
        role = await self._repo.get_by_id(role_id)
        if role is None:
            raise NotFoundException(detail=f"Role {role_id} not found")
        return RoleRead.from_model(role)


async def provide_role_service(
    db_session: NamedDependency[AsyncSession],
) -> RoleService:
    return RoleService(db_session)
