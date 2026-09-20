from app.routers.coach.check_in import CoachCheckInRouter
from app.routers.coach.metric import CoachMetricRouter
from litestar import Router

CoachRouter = Router(
    path="/coach",
    # guards=[require_coach],
    route_handlers=[CoachCheckInRouter, CoachMetricRouter],
)
