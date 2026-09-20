from app.auth.scope import resource
from app.controllers.admin.user import AdminUserController
from litestar import Router

AdminUserRouter = Router(
    path="/users",
    opt=resource("users"),
    tags=["Admin Users"],
    route_handlers=[AdminUserController],
)
