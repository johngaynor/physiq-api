from typing import Any, cast

import pytest
from app.auth.scope import RouteScope, method, resolve_scope, resource, role
from litestar import Litestar, Router, delete, get, patch, post, put
from litestar.handlers import HTTPRouteHandler
from litestar.types import Method


def _handler(app: Litestar, path: str, verb: str) -> HTTPRouteHandler:
    handler = app.route_handler_method_map[path][cast(Method, verb)]
    return cast(HTTPRouteHandler, handler)


def _app(*handlers: HTTPRouteHandler) -> Litestar:
    leaf = Router(path="/check-ins", opt=resource("check-ins"), route_handlers=handlers)
    group = Router(path="/coach", opt=role("coach"), route_handlers=[leaf])
    return Litestar(route_handlers=[group])


def test_resolves_role_and_resource_from_router_labels() -> None:
    @get("/")
    async def handler() -> None: ...

    app = _app(handler)

    assert resolve_scope(_handler(app, "/coach/check-ins", "GET")) == RouteScope(
        role="coach", resource="check-ins", method="read"
    )


@pytest.mark.parametrize(
    ("decorator", "verb", "expected"),
    [
        (get, "GET", "read"),
        (post, "POST", "write"),
        (put, "PUT", "write"),
        (patch, "PATCH", "write"),
        (delete, "DELETE", "delete"),
    ],
)
def test_method_derives_from_http_verb(
    decorator: Any, verb: str, expected: str
) -> None:
    @decorator("/")
    async def handler() -> None: ...

    app = _app(handler)

    assert resolve_scope(_handler(app, "/coach/check-ins", verb)).method == expected


def test_handler_label_overrides_derived_method() -> None:
    @post("/search", opt=method("read"))
    async def handler() -> None: ...

    app = _app(handler)

    assert (
        resolve_scope(_handler(app, "/coach/check-ins/search", "POST")).method == "read"
    )


def test_missing_role_label_raises() -> None:
    @get("/")
    async def handler() -> None: ...

    leaf = Router(
        path="/check-ins", opt=resource("check-ins"), route_handlers=[handler]
    )
    app = Litestar(route_handlers=[leaf])

    with pytest.raises(ValueError, match="role"):
        resolve_scope(_handler(app, "/check-ins", "GET"))


def test_missing_resource_label_raises() -> None:
    @get("/")
    async def handler() -> None: ...

    group = Router(path="/coach", opt=role("coach"), route_handlers=[handler])
    app = Litestar(route_handlers=[group])

    with pytest.raises(ValueError, match="resource"):
        resolve_scope(_handler(app, "/coach", "GET"))
