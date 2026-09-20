import uuid
from dataclasses import dataclass

from app.auth.scope import RouteScope, Scope


@dataclass(frozen=True, slots=True)
class Principal:
    """The authenticated caller: which user they are and every scope they hold."""

    user_id: uuid.UUID
    scopes: frozenset[Scope]

    def covers(self, route: RouteScope) -> bool:
        """Return whether any held scope grants access to ``route``."""
        return any(
            scope.covers(role=route.role, resource=route.resource, method=route.method)
            for scope in self.scopes
        )
