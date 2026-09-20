from advanced_alchemy.config import EngineConfig
from advanced_alchemy.extensions.litestar import (
    AsyncSessionConfig,
    SQLAlchemyAsyncConfig,
    SQLAlchemyPlugin,
)
from app.auth.authentication import AuthenticationMiddleware
from app.fixtures.seed import seed_db
from app.routers.admin import AdminRouter
from app.routers.athlete import AthleteRouter
from app.routers.coach import CoachRouter
from app.settings import SETTINGS
from app.shared.open_api import open_api_config
from litestar import Litestar, get
from litestar.middleware.base import DefineMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

alchemy_config = SQLAlchemyAsyncConfig(
    connection_string=SETTINGS.database_uri,
    before_send_handler="autocommit",
    session_config=AsyncSessionConfig(expire_on_commit=False),
    engine_config=EngineConfig(pool_pre_ping=True, pool_recycle=300),
    create_all=False,
)


async def seed_on_startup() -> None:
    if SETTINGS.environment != "development":
        return
    async with AsyncSession(alchemy_config.get_engine()) as session:
        await seed_db(session)


@get("/health", tags=["Meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app = Litestar(
    route_handlers=[health, AdminRouter, AthleteRouter, CoachRouter],
    openapi_config=open_api_config,
    plugins=[SQLAlchemyPlugin(config=alchemy_config)],
    on_startup=[seed_on_startup],
    middleware=[
        DefineMiddleware(
            AuthenticationMiddleware,
            alchemy_config=alchemy_config,
            exclude=["^/health$", "^/schema"],
        )
    ],
)
