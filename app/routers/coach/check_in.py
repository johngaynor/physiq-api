from app.controllers.coach.check_in import CoachCheckInController
from litestar import Router

CoachCheckInRouter = Router(
    path="/check-ins",
    tags=["Coach Check-ins"],
    route_handlers=[CoachCheckInController],
)
