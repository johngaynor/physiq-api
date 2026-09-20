from typing import cast

from app.auth.principal import Principal
from app.auth.scope import resolve_scope
from litestar.connection import ASGIConnection
from litestar.exceptions import ImproperlyConfiguredException, PermissionDeniedException
from litestar.handlers import BaseRouteHandler, HTTPRouteHandler


def scope_guard(connection: ASGIConnection, handler: BaseRouteHandler) -> None:
    """Deny the request unless the authenticated principal holds a covering scope.

    Runs after :class:`AuthenticationMiddleware`, so ``connection.auth`` is the
    :class:`Principal`. A handler without role/resource labels is a wiring bug.
    """
    try:
        route = resolve_scope(cast(HTTPRouteHandler, handler))
    except ValueError as exc:
        raise ImproperlyConfiguredException(str(exc)) from exc

    principal = cast(Principal, connection.auth)
    if not principal.covers(route):
        raise PermissionDeniedException(
            detail=f"Missing scope for {route.role}:{route.resource}:*:{route.method}"
        )
