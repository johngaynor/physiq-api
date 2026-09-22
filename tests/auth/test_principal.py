import uuid

from app.auth.principal import Principal
from app.auth.scope import RouteScope, parse_scope


def _principal(*raw: str) -> Principal:
    return Principal(user_id=uuid.uuid4(), scopes=frozenset(map(parse_scope, raw)))


def test_covers_when_any_scope_matches() -> None:
    p = _principal("coach:check-ins:*:read", "athlete:check-ins:self:read")
    assert p.covers(RouteScope("athlete", "check-ins", "read"))


def test_does_not_cover_when_no_scope_matches() -> None:
    p = _principal("athlete:check-ins:self:read")
    assert not p.covers(RouteScope("athlete", "check-ins", "write"))
    assert not p.covers(RouteScope("coach", "check-ins", "read"))


def test_empty_scopes_cover_nothing() -> None:
    assert not _principal().covers(RouteScope("athlete", "check-ins", "read"))
