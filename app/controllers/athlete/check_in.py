import datetime
import uuid
from typing import ClassVar

from app.auth.principal import Principal
from app.models.user import UserModel
from app.schemas.check_in import CheckInCreate, CheckInRead, CheckInUpdate
from app.services.check_in import CheckInService, provide_check_in_service
from litestar import Controller, Request, delete, get, patch, post
from litestar.datastructures import State
from litestar.di import NamedDependency, Provide
from litestar.params import FromPath, FromQuery

AthleteRequest = Request[UserModel, Principal, State]


class AthleteCheckInController(Controller):
    dependencies: ClassVar[dict[str, Provide]] = {
        "check_in_service": Provide(provide_check_in_service)
    }

    @get(path="/", summary="Get Check-ins")
    async def list(
        self,
        check_in_service: NamedDependency[CheckInService],
        request: AthleteRequest,
        start: FromQuery[datetime.datetime | None] = None,
        end: FromQuery[datetime.datetime | None] = None,
    ) -> list[CheckInRead]:
        return await check_in_service.list(request.user.id, start, end)

    @get(path="/{check_in_id:uuid}", summary="Get Check-in by ID")
    async def get_one(
        self,
        check_in_service: NamedDependency[CheckInService],
        request: AthleteRequest,
        check_in_id: FromPath[uuid.UUID],
    ) -> CheckInRead:
        return await check_in_service.get(request.user.id, check_in_id)

    @post(path="/", summary="Create Check-in")
    async def create(
        self,
        check_in_service: NamedDependency[CheckInService],
        request: AthleteRequest,
        data: CheckInCreate,
    ) -> CheckInRead:
        return await check_in_service.create(request.user.id, data)

    @patch(path="/{check_in_id:uuid}", summary="Update Check-in")
    async def update(
        self,
        check_in_service: NamedDependency[CheckInService],
        request: AthleteRequest,
        check_in_id: FromPath[uuid.UUID],
        data: CheckInUpdate,
    ) -> CheckInRead:
        return await check_in_service.update(request.user.id, check_in_id, data)

    @delete(path="/{check_in_id:uuid}", summary="Delete Check-in")
    async def delete_one(
        self,
        check_in_service: NamedDependency[CheckInService],
        request: AthleteRequest,
        check_in_id: FromPath[uuid.UUID],
    ) -> None:
        await check_in_service.delete(request.user.id, check_in_id)
