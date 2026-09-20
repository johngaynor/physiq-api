from typing import Any

from advanced_alchemy.extensions.litestar import SQLAlchemyAsyncConfig
from app.auth.keys import hash_api_key
from app.auth.principal import Principal
from app.auth.scope import parse_scope
from app.repos.user import UserRepository
from litestar.connection import ASGIConnection
from litestar.exceptions import NotAuthorizedException
from litestar.middleware.authentication import (
    AbstractAuthenticationMiddleware,
    AuthenticationResult,
)
from litestar.types import ASGIApp


class AuthenticationMiddleware(AbstractAuthenticationMiddleware):
    """Resolve a ``Bearer <api key>`` header to a user and their scopes.

    On success ``request.user`` is the :class:`UserModel` and ``request.auth`` is
    the :class:`Principal` carrying the parsed scopes.
    """

    def __init__(
        self, app: ASGIApp, alchemy_config: SQLAlchemyAsyncConfig, **kwargs: Any
    ) -> None:
        super().__init__(app, **kwargs)
        self._alchemy_config = alchemy_config

    async def authenticate_request(
        self, connection: ASGIConnection
    ) -> AuthenticationResult:
        token = _bearer_token(connection)

        session = self._alchemy_config.provide_session(
            connection.app.state, connection.scope
        )
        repo = UserRepository(session)

        user = await repo.get_by_api_key_hash(hash_api_key(token))
        if user is None:
            raise NotAuthorizedException(detail="Invalid API key")

        scope_strings = await repo.list_scope_strings(user.id)
        principal = Principal(
            user_id=user.id, scopes=frozenset(map(parse_scope, scope_strings))
        )
        return AuthenticationResult(user=user, auth=principal)


def _bearer_token(connection: ASGIConnection) -> str:
    header = connection.headers.get("Authorization")
    if header is None:
        raise NotAuthorizedException(detail="Missing Authorization header")

    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise NotAuthorizedException(detail="Expected a Bearer token")
    return token
