import uuid
from typing import ClassVar

from app.schemas.role import RoleCreate, RoleRead, RoleScopesReplace
from app.services.role import RoleService, provide_role_service
from litestar import Controller, delete, get, post, put
from litestar.di import NamedDependency, Provide
from litestar.params import FromPath


class AdminRoleController(Controller):
    dependencies: ClassVar[dict[str, Provide]] = {
        "role_service": Provide(provide_role_service)
    }

    @get(path="/", summary="Get Roles")
    async def get_all(
        self, role_service: NamedDependency[RoleService]
    ) -> list[RoleRead]:
        return await role_service.get_all()

    @get(path="/{role_id:uuid}", summary="Get Role by ID")
    async def get_one(
        self, role_service: NamedDependency[RoleService], role_id: FromPath[uuid.UUID]
    ) -> RoleRead:
        return await role_service.get(role_id)

    @post(path="/", summary="Create Role")
    async def create(
        self, role_service: NamedDependency[RoleService], data: RoleCreate
    ) -> RoleRead:
        return await role_service.create(data)

    @put(path="/{role_id:uuid}/scopes", summary="Replace Role Scopes")
    async def replace_scopes(
        self,
        role_service: NamedDependency[RoleService],
        role_id: FromPath[uuid.UUID],
        data: RoleScopesReplace,
    ) -> RoleRead:
        return await role_service.replace_scopes(role_id, data)

    @delete(path="/{role_id:uuid}", summary="Delete Role")
    async def delete_one(
        self, role_service: NamedDependency[RoleService], role_id: FromPath[uuid.UUID]
    ) -> None:
        await role_service.delete(role_id)
