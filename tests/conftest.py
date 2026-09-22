import asyncio
from collections.abc import AsyncIterator, Iterator

import app.models  # noqa: F401 - register every model with the metadata registry
import pytest
from advanced_alchemy.base import metadata_registry
from app.fixtures.seed import seed_db
from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.models.user import UserModel
from app.models.user_athlete import UserAthleteModel
from app.models.user_role import UserRoleModel
from sqlalchemy import NullPool, delete
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from testcontainers.postgres import PostgresContainer

# Child tables first so foreign keys never block a delete.
_TABLES_IN_DELETE_ORDER = (
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
