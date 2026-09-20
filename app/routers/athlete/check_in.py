from app.controllers.athlete.check_in import AthleteCheckInController
from litestar import Router

AthleteCheckInRouter = Router(
    path="/check-ins",
    tags=["Athlete Check-ins"],
    route_handlers=[AthleteCheckInController],
)
