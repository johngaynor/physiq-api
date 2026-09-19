from app.controllers.check_in import CheckInController
from litestar import Router

CheckInRouter = Router(
    path="/check-ins",
    tags=["Check-ins"],
    route_handlers=[CheckInController],
)
