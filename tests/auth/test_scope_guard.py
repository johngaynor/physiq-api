import uuid

import pytest
from app.auth.principal import Principal
from app.auth.scope import parse_scope, resource, role
from app.auth.scope_guard import scope_guard
from litestar import Litestar, Router, get, post
from litestar.connection import ASGIConnection
from litestar.exceptions import ImproperlyConfiguredException, PermissionDeniedException
from litestar.handlers import BaseRouteHandler


@get("/")
async def read() -> None: ...


@post("/")
async def write() -> None: ...


@get("/unlabelled")
async def unlabelled() -> None: ...


_app = Litestar(
    route_handlers=[
        Router(
            path="/athlete",
            opt=role("athlete"),
            route_handlers=[
                Router(
                    path="/check-ins",
                    opt=resource("check-ins"),
                    route_handlers=[read, write],
                )
            ],
        ),
        unlabelled,
    ]
)


def _handler(path: str, verb: str) -> BaseRouteHandler:
    return _app.route_handler_method_map[path][verb]


def _connection(*raw: str) -> ASGIConnection:
    principal = Principal(user_id=uuid.uuid4(), scopes=frozenset(map(parse_scope, raw)))
    scope = {
        "type": "http",
        "app": _app,
        "auth": principal,
        "user": object(),
        "state": {},
    }
    return ASGIConnection(scope)  # type: ignore[arg-type]


def test_allows_when_principal_covers_route() -> None:
    scope_guard(
        _connection("athlete:check-ins:self:read"),
        _handler("/athlete/check-ins", "GET"),
    )


def test_denies_with_403_when_no_scope_covers_route() -> None:
    with pytest.raises(PermissionDeniedException) as exc:
        scope_guard(
            _connection("athlete:check-ins:self:read"),
            _handler("/athlete/check-ins", "POST"),
        )
    assert exc.value.status_code == 403


def test_unlabelled_route_is_a_configuration_error() -> None:
    with pytest.raises(ImproperlyConfiguredException):
        scope_guard(_connection("*:*:*:*"), _handler("/unlabelled", "GET"))
