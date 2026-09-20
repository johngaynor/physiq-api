import asyncio
from collections.abc import AsyncIterator, Iterator

import app.models  # noqa: F401 - register every model with the metadata registry
import pytest
from advanced_alchemy.base import metadata_registry
from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.models.user import UserModel
from app.models.user_role import UserRoleModel
from sqlalchemy import NullPool, delete
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from testcontainers.postgres import PostgresContainer

# Child tables first so foreign keys never block a delete.
_TABLES_IN_DELETE_ORDER = (UserRoleModel, RoleScopeModel, UserModel, RoleModel)


async def _create_tables(db_url: str) -> None:
    metadata = metadata_registry.get(None)
    engine = create_async_engine(db_url, poolclass=NullPool)
    try:
        async with engine.begin() as connection:
            await connection.run_sync(metadata.create_all)
    finally:
        await engine.dispose()


@pytest.fixture(scope="session")
def db_url() -> Iterator[str]:
    """Start one Postgres container for the whole session and create the schema."""
    with PostgresContainer("postgres:18-alpine", dbname="physiq_api") as container:
        url = container.get_connection_url().replace(
            "postgresql+psycopg2://", "postgresql+asyncpg://"
        )
        asyncio.run(_create_tables(url))
        yield url


@pytest.fixture
async def db_session(db_url: str) -> AsyncIterator[AsyncSession]:
    """A session against the test database; every table is emptied afterwards."""
    engine = create_async_engine(db_url, poolclass=NullPool)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            yield session
        async with AsyncSession(engine) as session:
            for model in _TABLES_IN_DELETE_ORDER:
                await session.execute(delete(model))
            await session.commit()
    finally:
        await engine.dispose()
