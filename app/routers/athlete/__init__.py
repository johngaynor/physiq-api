from app.auth.scope import role
from app.auth.scope_guard import scope_guard
from app.routers.athlete.check_in import AthleteCheckInRouter
from litestar import Router

AthleteRouter = Router(
    path="/athlete",
    opt=role("athlete"),
    guards=[scope_guard],
    route_handlers=[AthleteCheckInRouter],
)
