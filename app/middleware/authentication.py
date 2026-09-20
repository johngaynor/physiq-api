import secrets

from app.settings import SETTINGS
from litestar.connection import ASGIConnection
from litestar.exceptions import NotAuthorizedException
from litestar.middleware.authentication import (
    AbstractAuthenticationMiddleware,
    AuthenticationResult,
)


class AuthenticationMiddleware(AbstractAuthenticationMiddleware):
    async def authenticate_request(
        self, connection: ASGIConnection
    ) -> AuthenticationResult:
        header = connection.headers.get("Authorization")
        if header is None:
            raise NotAuthorizedException(detail="Missing Authorization header")

        scheme, _, token = header.partition(" ")
        if scheme.lower() != "bearer" or not token:
            raise NotAuthorizedException(detail="Expected a Bearer token")

        if not secrets.compare_digest(token, SETTINGS.api_key):
            raise NotAuthorizedException(detail="Invalid API key")

        return AuthenticationResult(user="api_key", auth=token)
