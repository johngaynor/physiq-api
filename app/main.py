import app.models
from advanced_alchemy.config import EngineConfig
from advanced_alchemy.extensions.litestar import (
    AsyncSessionConfig,
    SQLAlchemyAsyncConfig,
    SQLAlchemyPlugin,
)
from app.middleware.authentication import AuthenticationMiddleware
from app.routers.athlete import AthleteRouter
from app.routers.coach import CoachRouter
from app.settings import SETTINGS
from app.shared.open_api import open_api_config
from litestar import Litestar, get
from litestar.middleware.base import DefineMiddleware

alchemy_config = SQLAlchemyAsyncConfig(
    connection_string=SETTINGS.database_uri,
    # Commit the request's session on a 2xx/3xx response, roll back otherwise.
    before_send_handler="autocommit",
    # Keep ORM objects readable after the request commits.
    session_config=AsyncSessionConfig(expire_on_commit=False),
    # Replace dead connections on checkout and cap connection age.
    engine_config=EngineConfig(pool_pre_ping=True, pool_recycle=300),
    # Migrations own the schema; never let the app create tables itself.
    create_all=False,
)


@get("/health", tags=["Meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app = Litestar(
    route_handlers=[health, AthleteRouter, CoachRouter],
    openapi_config=open_api_config,
    plugins=[SQLAlchemyPlugin(config=alchemy_config)],
    middleware=[
        DefineMiddleware(AuthenticationMiddleware, exclude=["^/health$", "^/schema"])
    ],
)
