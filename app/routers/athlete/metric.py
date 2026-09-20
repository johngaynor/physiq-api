from app.controllers.athlete.metric import AthleteMetricController
from litestar import Router

AthleteMetricRouter = Router(
    path="/metrics",
    tags=["Athlete Metrics"],
    route_handlers=[AthleteMetricController],
)
