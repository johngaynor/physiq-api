from app.controllers.metric import MetricController
from litestar import Router

MetricRouter = Router(
    path="/metrics",
    tags=["Metrics"],
    route_handlers=[MetricController],
)
