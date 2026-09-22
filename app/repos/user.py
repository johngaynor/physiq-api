import uuid

from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.models.user import UserModel
from app.models.user_role import UserRoleModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class UserRepository:
    """Reads users and the scopes granted to them through their roles."""

    def __init__(self, db_session: AsyncSession) -> None:
        self._session = db_session

    async def get_by_api_key_hash(self, api_key_hash: str) -> UserModel | None:
        stmt = select(UserModel).where(UserModel.api_key_hash == api_key_hash)
        result = await self._session.execute(stmt)
        return result.scalars().one_or_none()

    async def list_all(self) -> list[UserModel]:
        stmt = select(UserModel).order_by(UserModel.email)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def assign_role(
        self, user_id: uuid.UUID, role_id: uuid.UUID, *, granted_by: uuid.UUID | None
    ) -> None:
        """Give ``user_id`` the role; a no-op if they already hold it."""
        if await self._session.get(UserRoleModel, (user_id, role_id)) is not None:
            return
        self._session.add(
            UserRoleModel(user_id=user_id, role_id=role_id, granted_by=granted_by)
        )
        await self._session.flush()

    async def revoke_role(self, user_id: uuid.UUID, role_id: uuid.UUID) -> bool:
        """Remove the assignment; returns whether one existed."""
        assignment = await self._session.get(UserRoleModel, (user_id, role_id))
        if assignment is None:
            return False
        await self._session.delete(assignment)
        await self._session.flush()
        return True

    async def get_by_id(self, user_id: uuid.UUID) -> UserModel | None:
        return await self._session.get(UserModel, user_id)

    async def list_roles(self, user_id: uuid.UUID) -> list[RoleModel]:
        """Roles assigned to ``user_id``, each with its scopes loaded."""
        stmt = (
            select(RoleModel)
            .join(UserRoleModel, UserRoleModel.role_id == RoleModel.id)
            .where(UserRoleModel.user_id == user_id)
            .order_by(RoleModel.name)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_scope_strings(self, user_id: uuid.UUID) -> list[str]:
        """Distinct scope strings granted to ``user_id`` through any of their roles."""
        stmt = (
            select(RoleScopeModel.scope_str)
            .join(RoleModel, RoleModel.id == RoleScopeModel.role_id)
            .join(UserRoleModel, UserRoleModel.role_id == RoleModel.id)
            .where(UserRoleModel.user_id == user_id)
            .distinct()
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
