from app.routers.athlete.check_in import AthleteCheckInRouter
from app.routers.athlete.metric import AthleteMetricRouter
from litestar import Router

AthleteRouter = Router(
    path="/athlete",
    # guards=[require_athlete],
    route_handlers=[AthleteCheckInRouter, AthleteMetricRouter],
)
