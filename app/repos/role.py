import uuid

from app.models.role import RoleModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class RoleRepository:
    def __init__(self, db_session: AsyncSession) -> None:
        self._session = db_session

    async def list_all(self) -> list[RoleModel]:
        stmt = select(RoleModel).order_by(RoleModel.name)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, role_id: uuid.UUID) -> RoleModel | None:
        return await self._session.get(RoleModel, role_id)
