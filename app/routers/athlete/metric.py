from app.auth.scope import resource
from app.controllers.athlete.metric import AthleteMetricController
from litestar import Router

AthleteMetricRouter = Router(
    path="/metrics",
    opt=resource("metrics"),
    tags=["Athlete Metrics"],
    route_handlers=[AthleteMetricController],
)
