import uuid

from app.auth.scope import parse_scope
from app.models.role import RoleModel
from app.repos.role import RoleRepository
from app.schemas.role import RoleCreate, RoleRead, RoleScopesReplace
from litestar.di import NamedDependency
from litestar.exceptions import (
    ClientException,
    NotFoundException,
    ValidationException,
)
from litestar.status_codes import HTTP_409_CONFLICT
from sqlalchemy.ext.asyncio import AsyncSession


class RoleService:
    def __init__(self, db_session: AsyncSession) -> None:
        self._repo = RoleRepository(db_session)

    async def get_all(self) -> list[RoleRead]:
        roles = await self._repo.list_all()
        return [RoleRead.from_model(r) for r in roles]

    async def get(self, role_id: uuid.UUID) -> RoleRead:
        return RoleRead.from_model(await self._get_model(role_id))

    async def create(self, data: RoleCreate) -> RoleRead:
        if await self._repo.get_by_name(data.name) is not None:
            raise ClientException(
                status_code=HTTP_409_CONFLICT,
                detail=f"Role {data.name!r} already exists",
            )
        role = await self._repo.create(
            name=data.name,
            description=data.description,
            scopes=_validated_scopes(data.scopes),
        )
        return RoleRead.from_model(role)

    async def replace_scopes(
        self, role_id: uuid.UUID, data: RoleScopesReplace
    ) -> RoleRead:
        role = await self._get_model(role_id)
        await self._repo.set_scopes(role, _validated_scopes(data.scopes))
        return RoleRead.from_model(role)

    async def delete(self, role_id: uuid.UUID) -> None:
        role = await self._get_model(role_id)
        if await self._repo.is_assigned(role.id):
            raise ClientException(
                status_code=HTTP_409_CONFLICT,
                detail=f"Role {role.name!r} is still assigned to users; revoke it first",
            )
        await self._repo.delete(role)

    async def _get_model(self, role_id: uuid.UUID) -> RoleModel:
        role = await self._repo.get_by_id(role_id)
        if role is None:
            raise NotFoundException(detail=f"Role {role_id} not found")
        return role


def _validated_scopes(raw: list[str]) -> list[str]:
    """De-duplicate ``raw`` and reject any string that is not a well-formed scope."""
    for scope in raw:
        try:
            parse_scope(scope)
        except ValueError as exc:
            raise ValidationException(detail=str(exc)) from exc
    return sorted(set(raw))


async def provide_role_service(
    db_session: NamedDependency[AsyncSession],
) -> RoleService:
    return RoleService(db_session)
