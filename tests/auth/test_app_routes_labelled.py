from typing import cast

from app.auth.scope import RouteScope, resolve_scope
from app.auth.scope_guard import scope_guard
from app.main import app
from litestar.handlers import HTTPRouteHandler

UNSCOPED_PATHS = {"/health"}
UNSCOPED_PREFIXES = ("/schema",)


def _scoped_handlers() -> dict[tuple[str, str], HTTPRouteHandler]:
    handlers: dict[tuple[str, str], HTTPRouteHandler] = {}
    for path, by_verb in app.route_handler_method_map.items():
        if path in UNSCOPED_PATHS or path.startswith(UNSCOPED_PREFIXES):
            continue
        for verb, handler in by_verb.items():
            if verb in ("HEAD", "OPTIONS"):
                continue
            handlers[(path, verb)] = cast(HTTPRouteHandler, handler)
    return handlers


def test_every_route_resolves_to_its_expected_scope() -> None:
    resolved = {key: resolve_scope(h) for key, h in _scoped_handlers().items()}

    assert resolved == {
        ("/admin/roles", "GET"): RouteScope("admin", "roles", "read"),
        ("/admin/roles", "POST"): RouteScope("admin", "roles", "write"),
        ("/admin/roles/{role_id:uuid}", "GET"): RouteScope("admin", "roles", "read"),
        ("/admin/roles/{role_id:uuid}", "DELETE"): RouteScope(
            "admin", "roles", "delete"
        ),
        ("/admin/roles/{role_id:uuid}/scopes", "PUT"): RouteScope(
            "admin", "roles", "write"
        ),
        ("/admin/users", "GET"): RouteScope("admin", "users", "read"),
        ("/admin/users/{user_id:uuid}", "GET"): RouteScope("admin", "users", "read"),
        ("/admin/users/{user_id:uuid}/roles/{role_id:uuid}", "PUT"): RouteScope(
            "admin", "users", "write"
        ),
        ("/admin/users/{user_id:uuid}/roles/{role_id:uuid}", "DELETE"): RouteScope(
            "admin", "users", "delete"
        ),
        ("/athlete/check-ins", "GET"): RouteScope("athlete", "check-ins", "read"),
        ("/athlete/metrics", "GET"): RouteScope("athlete", "metrics", "read"),
        ("/coach/check-ins", "GET"): RouteScope("coach", "check-ins", "read"),
        ("/coach/metrics", "GET"): RouteScope("coach", "metrics", "read"),
    }


def test_every_scoped_route_is_protected_by_the_scope_guard() -> None:
    unguarded = [
        key
        for key, handler in _scoped_handlers().items()
        if scope_guard not in [getattr(g, "func", g) for g in handler.resolve_guards()]
    ]
    assert unguarded == []
