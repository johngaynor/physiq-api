from app.schemas.check_in import CheckInRead
from litestar import Controller, get


class CoachCheckInController(Controller):
    """Placeholder until coach data access is designed; returns nothing yet."""

    @get(path="/", summary="Get Athletes' Check-ins")
    async def get_all(self) -> list[CheckInRead]:
        return []
