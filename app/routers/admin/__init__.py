from app.auth import scope
from app.auth.scope_guard import scope_guard
from app.routers.admin.role import AdminRoleRouter
from app.routers.admin.user import AdminUserRouter
from litestar import Router

# ``scope.role`` rather than a bare ``role`` import: this package has a ``role``
# submodule, which would shadow the label helper.
AdminRouter = Router(
    path="/admin",
    opt=scope.role("admin"),
    guards=[scope_guard],
    route_handlers=[AdminRoleRouter, AdminUserRouter],
)
