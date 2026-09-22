import asyncio
from collections.abc import AsyncIterator, Iterator
from contextlib import asynccontextmanager

import app.models  # noqa: F401 - register every model with the metadata registry
import pytest
from advanced_alchemy.base import metadata_registry
from advanced_alchemy.extensions.litestar import (
    AsyncSessionConfig,
    SQLAlchemyAsyncConfig,
    SQLAlchemyPlugin,
)
from app.auth.authentication import AuthenticationMiddleware
from app.fixtures.seed import seed_db
from app.models.check_in import CheckInModel
from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.models.user import UserModel
from app.models.user_athlete import UserAthleteModel
from app.models.user_role import UserRoleModel
from litestar import Litestar, Router
from litestar.middleware.base import DefineMiddleware
from litestar.testing import AsyncTestClient
from sqlalchemy import NullPool, delete
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from testcontainers.postgres import PostgresContainer

# Child tables first so foreign keys never block a delete.
_TABLES_IN_DELETE_ORDER = (
    CheckInModel,
    UserAthleteModel,
    UserRoleModel,
    RoleScopeModel,
    UserModel,
    RoleModel,
)


async def _create_tables(db_url: str) -> None:
    metadata = metadata_registry.get(None)
    engine = create_async_engine(db_url, poolclass=NullPool)
    try:
        async with engine.begin() as connection:
            await connection.run_sync(metadata.create_all)
    finally:
        await engine.dispose()


async def _reset(engine: AsyncEngine) -> None:
    """Wipe every table and reload the seed so each test starts from the baseline."""
    async with AsyncSession(engine) as session:
        for model in _TABLES_IN_DELETE_ORDER:
            await session.execute(delete(model))
        await session.commit()
        await seed_db(session)


@pytest.fixture(scope="session")
def db_url() -> Iterator[str]:
    """Start one Postgres container for the whole session and create the schema."""
    with PostgresContainer("postgres:18-alpine", dbname="physiq_api") as container:
        url = container.get_connection_url().replace(
            "postgresql+psycopg2://", "postgresql+asyncpg://"
        )
        asyncio.run(_create_tables(url))
        asyncio.run(_seed(url))
        yield url


async def _seed(db_url: str) -> None:
    engine = create_async_engine(db_url, poolclass=NullPool)
    try:
        async with AsyncSession(engine) as session:
            await seed_db(session)
    finally:
        await engine.dispose()


@pytest.fixture
async def db_session(db_url: str) -> AsyncIterator[AsyncSession]:
    """A session against the seeded test database; reset to the seed afterwards."""
    engine = create_async_engine(db_url, poolclass=NullPool)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            yield session
        await _reset(engine)
    finally:
        await engine.dispose()


@asynccontextmanager
async def authenticated_client(
    db_url: str, *routers: Router
) -> AsyncIterator[AsyncTestClient[Litestar]]:
    """An app serving ``routers`` behind API-key auth against the test database.

    Callers should also depend on ``db_session`` so the database is reset to
    the seed baseline after the test.
    """
    config = SQLAlchemyAsyncConfig(
        connection_string=db_url,
        before_send_handler="autocommit",
        session_config=AsyncSessionConfig(expire_on_commit=False),
        create_all=False,
    )
    app = Litestar(
        route_handlers=list(routers),
        plugins=[SQLAlchemyPlugin(config=config)],
        middleware=[DefineMiddleware(AuthenticationMiddleware, alchemy_config=config)],
    )
    async with AsyncTestClient(app=app) as client:
        yield client
