import uuid
from typing import ClassVar

from app.auth.principal import Principal
from app.models.user import UserModel
from app.schemas.user import AthleteSummary, UserDetail, UserSummary
from app.services.user import UserService, provide_user_service
from litestar import Controller, Request, delete, get, put
from litestar.datastructures import State
from litestar.di import NamedDependency, Provide
from litestar.params import FromPath
from litestar.status_codes import HTTP_204_NO_CONTENT


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
        self, user_service: NamedDependency[UserService], user_id: FromPath[uuid.UUID]
    ) -> UserDetail:
        return await user_service.get(user_id)

    @put(
        path="/{user_id:uuid}/roles/{role_id:uuid}",
        summary="Assign Role to User",
        status_code=HTTP_204_NO_CONTENT,
    )
    async def assign_role(
        self,
        user_service: NamedDependency[UserService],
        request: Request[UserModel, Principal, State],
        user_id: FromPath[uuid.UUID],
        role_id: FromPath[uuid.UUID],
    ) -> None:
        await user_service.assign_role(user_id, role_id, granted_by=request.user.id)

    @delete(
        path="/{user_id:uuid}/roles/{role_id:uuid}", summary="Revoke Role from User"
    )
    async def revoke_role(
        self,
        user_service: NamedDependency[UserService],
        user_id: FromPath[uuid.UUID],
        role_id: FromPath[uuid.UUID],
    ) -> None:
        await user_service.revoke_role(user_id, role_id)

    @get(path="/{user_id:uuid}/athletes", summary="Get Athletes Coached by User")
    async def list_athletes(
        self, user_service: NamedDependency[UserService], user_id: FromPath[uuid.UUID]
    ) -> list[AthleteSummary]:
        return await user_service.list_athletes(user_id)

    @put(
        path="/{user_id:uuid}/athletes/{athlete_id:uuid}",
        summary="Assign Athlete to User",
        status_code=HTTP_204_NO_CONTENT,
    )
    async def assign_athlete(
        self,
        user_service: NamedDependency[UserService],
        request: Request[UserModel, Principal, State],
        user_id: FromPath[uuid.UUID],
        athlete_id: FromPath[uuid.UUID],
    ) -> None:
        await user_service.assign_athlete(
            user_id, athlete_id, created_by=request.user.id
        )

    @delete(
        path="/{user_id:uuid}/athletes/{athlete_id:uuid}",
        summary="Revoke Athlete from User",
    )
    async def revoke_athlete(
        self,
        user_service: NamedDependency[UserService],
        user_id: FromPath[uuid.UUID],
        athlete_id: FromPath[uuid.UUID],
    ) -> None:
        await user_service.revoke_athlete(user_id, athlete_id)
