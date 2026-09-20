from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from litestar.handlers import HTTPRouteHandler

_PART_COUNT = 4


@dataclass(frozen=True, slots=True)
class Scope:
    """One parsed scope string: ``<role>:<resource>:<restriction>:<method>``.

    ``role``, ``resource`` and ``method`` describe which route handlers the scope
    covers. ``restriction`` is opaque here; repositories interpret it as needed.
    """

    role: str
    resource: str
    restriction: str
    method: str

    def covers(self, *, role: str, resource: str, method: str) -> bool:
        """Return whether this scope grants access to the given concrete route."""
        return all(
            pattern == "*" or pattern == value
            for pattern, value in (
                (self.role, role),
                (self.resource, resource),
                (self.method, method),
            )
        )


def parse_scope(raw: str) -> Scope:
    parts = raw.split(":")
    if len(parts) != _PART_COUNT or any(not part for part in parts):
        raise ValueError(
            f"Scope must have exactly {_PART_COUNT} non-empty ':'-separated parts, "
            f"got {raw!r}"
        )
    role, resource, restriction, method = parts
    return Scope(role=role, resource=resource, restriction=restriction, method=method)


_ROLE_KEY = "scope_role"
_RESOURCE_KEY = "scope_resource"
_METHOD_KEY = "scope_method"

_VERB_TO_METHOD = {
    "GET": "read",
    "POST": "write",
    "PUT": "write",
    "PATCH": "write",
    "DELETE": "delete",
}


def role(name: str) -> dict[str, str]:
    """Label a layer with the role slot, e.g. ``Router(opt=role("coach"))``."""
    return {_ROLE_KEY: name}


def resource(name: str) -> dict[str, str]:
    """Label a layer with the resource slot, e.g. ``Router(opt=resource("check-ins"))``."""
    return {_RESOURCE_KEY: name}


def method(name: str) -> dict[str, str]:
    """Override the method slot, which otherwise derives from the HTTP verb."""
    return {_METHOD_KEY: name}


@dataclass(frozen=True, slots=True)
class RouteScope:
    """The concrete role, resource and method a route handler requires."""

    role: str
    resource: str
    method: str


def resolve_scope(handler: "HTTPRouteHandler") -> RouteScope:
    """Compute the :class:`RouteScope` for ``handler`` from its layered labels.

    Raises ``ValueError`` if the role or resource label is missing, or if the
    method cannot be derived because the handler serves several HTTP verbs and
    has no explicit :func:`method` label.
    """
    opts = handler.opt  # merged across layers by Litestar at app init
    name = handler.handler_name

    role_name = opts.get(_ROLE_KEY)
    if role_name is None:
        raise ValueError(
            f"Handler {name!r} has no role label; add role(...) to a router"
        )

    resource_name = opts.get(_RESOURCE_KEY)
    if resource_name is None:
        raise ValueError(
            f"Handler {name!r} has no resource label; add resource(...) to a router"
        )

    method_name = opts.get(_METHOD_KEY)
    if method_name is None:
        verbs = set(handler.http_methods)
        if len(verbs) != 1:
            raise ValueError(
                f"Handler {name!r} serves {sorted(verbs)}; add method(...) to disambiguate"
            )
        method_name = _VERB_TO_METHOD[verbs.pop()]

    return RouteScope(role=role_name, resource=resource_name, method=method_name)
