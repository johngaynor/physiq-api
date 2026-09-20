from app.controllers.coach.metric import CoachMetricController
from litestar import Router

CoachMetricRouter = Router(
    path="/metrics",
    tags=["Coach Metrics"],
    route_handlers=[CoachMetricController],
)
