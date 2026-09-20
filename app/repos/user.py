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
