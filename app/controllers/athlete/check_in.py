from typing import ClassVar

from app.models.check_in import CheckInModel
from app.services.check_in import CheckInService
from litestar import Controller, get
from litestar.di import Provide


class AthleteCheckInController(Controller):
    dependencies: ClassVar[dict[str, Provide]] = {
        "check_in_service": Provide(CheckInService, sync_to_thread=False)
    }

    @get(path="/", summary="Get all check-ins.")
    async def get_all(self, check_in_service: CheckInService) -> CheckInModel:
        return await check_in_service.get_all()
