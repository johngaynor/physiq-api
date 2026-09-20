from app.auth.scope import resource
from app.controllers.coach.metric import CoachMetricController
from litestar import Router

CoachMetricRouter = Router(
    path="/metrics",
    opt=resource("metrics"),
    tags=["Coach Metrics"],
    route_handlers=[CoachMetricController],
)
