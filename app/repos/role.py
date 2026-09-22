import uuid

from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.models.user_role import UserRoleModel
from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession


class RoleRepository:
    def __init__(self, db_session: AsyncSession) -> None:
        self._session = db_session

    async def get_all(self) -> list[RoleModel]:
        stmt = select(RoleModel).order_by(RoleModel.name)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, role_id: uuid.UUID) -> RoleModel | None:
        return await self._session.get(RoleModel, role_id)

    async def get_by_name(self, name: str) -> RoleModel | None:
        stmt = select(RoleModel).where(RoleModel.name == name)
        result = await self._session.execute(stmt)
        return result.scalars().one_or_none()

    async def create(
        self, *, name: str, description: str | None, scopes: list[str]
    ) -> RoleModel:
        role = RoleModel(name=name, description=description)
        role.scopes = [RoleScopeModel(scope_str=s) for s in scopes]
        self._session.add(role)
        await self._session.flush()
        return role

    async def set_scopes(self, role: RoleModel, scopes: list[str]) -> None:
        """Replace ``role``'s scopes wholesale and bump its version."""
        role.scopes = [RoleScopeModel(scope_str=s) for s in scopes]
        role.version += 1
        await self._session.flush()

    async def delete(self, role: RoleModel) -> None:
        await self._session.delete(role)
        await self._session.flush()

    async def is_assigned(self, role_id: uuid.UUID) -> bool:
        """Whether any user currently holds ``role_id``."""
        stmt = select(exists().where(UserRoleModel.role_id == role_id))
        return bool(await self._session.scalar(stmt))
