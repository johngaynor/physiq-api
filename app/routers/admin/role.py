from app.auth.scope import resource
from app.controllers.admin.role import AdminRoleController
from litestar import Router

AdminRoleRouter = Router(
    path="/roles",
    opt=resource("roles"),
    tags=["Admin Roles"],
    route_handlers=[AdminRoleController],
)
