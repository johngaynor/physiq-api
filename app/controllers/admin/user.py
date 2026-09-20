import uuid
from typing import ClassVar

from app.schemas.user import UserDetail, UserSummary
from app.services.user import UserService, provide_user_service
from litestar import Controller, get
from litestar.di import NamedDependency, Provide


class AdminUserController(Controller):
    dependencies: ClassVar[dict[str, Provide]] = {
        "user_service": Provide(provide_user_service)
    }

    @get(path="/", summary="Get Users")
    async def get_all(
        self, user_service: NamedDependency[UserService]
    ) -> list[UserSummary]:
        return await user_service.get_all()

    @get(path="/{user_id:uuid}", summary="Get User by ID")
    async def get_one(
        self, user_service: NamedDependency[UserService], user_id: uuid.UUID
    ) -> UserDetail:
        return await user_service.get(user_id)
