import uuid
from typing import ClassVar

from app.schemas.role import RoleRead
from app.services.role import RoleService, provide_role_service
from litestar import Controller, get
from litestar.di import NamedDependency, Provide


class AdminRoleController(Controller):
    dependencies: ClassVar[dict[str, Provide]] = {
        "role_service": Provide(provide_role_service)
    }

    @get(path="/", summary="List every role and its scopes.")
    async def get_all(
        self, role_service: NamedDependency[RoleService]
    ) -> list[RoleRead]:
        return await role_service.get_all()

    @get(path="/{role_id:uuid}", summary="Get one role and its scopes.")
    async def get_one(
        self, role_service: NamedDependency[RoleService], role_id: uuid.UUID
    ) -> RoleRead:
        return await role_service.get(role_id)
