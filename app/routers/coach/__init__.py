from app.auth.scope import role
from app.auth.scope_guard import scope_guard
from app.routers.coach.check_in import CoachCheckInRouter
from litestar import Router

CoachRouter = Router(
    path="/coach",
    opt=role("coach"),
    guards=[scope_guard],
    route_handlers=[CoachCheckInRouter],
)
