"""Seed reference data for development and tests.

Each JSON file under ``data/`` holds the rows for one table. Rows carry fixed
primary keys so the seed is idempotent: re-running it inserts nothing new.
"""

import datetime
from pathlib import Path
from typing import Any
from uuid import UUID

from advanced_alchemy.utils.fixtures import open_fixture_async
from app.models.check_in import CheckInModel
from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.models.user import UserModel
from app.models.user_role import UserRoleModel
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

_DATA = Path(__file__).parent / "data"

# Plaintext keys for the seeded dev users. Only their hashes live in users.json.
DEV_ATHLETE_API_KEY = "123"
DEV_COACH_API_KEY = "456"
DEV_ADMIN_API_KEY = "789"

_UUID_FIELDS = {"id", "user_id", "role_id", "granted_by"}
_DATETIME_FIELDS = {"checked_in_at", "created_at", "updated_at"}

# (fixture directory, table model, fixture file) in dependency order.
_TABLES: tuple[tuple[str, type, str], ...] = (
    ("auth", RoleModel, "roles"),
    ("auth", RoleScopeModel, "role_scopes"),
    ("auth", UserModel, "users"),
    ("auth", UserRoleModel, "user_roles"),
    ("check_ins", CheckInModel, "check_ins"),
)


async def seed_db(db_session: AsyncSession) -> None:
    """Insert every fixture row that does not already exist, then commit."""
    for directory, model, name in _TABLES:
        rows = await open_fixture_async(_DATA / directory, name)
        for row in rows:
            stmt = pg_insert(model).values(**_coerce(row)).on_conflict_do_nothing()
            await db_session.execute(stmt)
    await db_session.commit()


def _coerce(row: dict[str, Any]) -> dict[str, Any]:
    return {key: _coerce_value(key, value) for key, value in row.items()}


def _coerce_value(key: str, value: Any) -> Any:
    if not isinstance(value, str):
        return value
    if key in _UUID_FIELDS:
        return UUID(value)
    if key in _DATETIME_FIELDS:
        return datetime.datetime.fromisoformat(value)
    return value
