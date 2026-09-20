import uuid
from collections.abc import AsyncIterator

import pytest
from advanced_alchemy.extensions.litestar import (
    AsyncSessionConfig,
    SQLAlchemyAsyncConfig,
    SQLAlchemyPlugin,
)
from app.auth.authentication import AuthenticationMiddleware
from app.fixtures.seed import DEV_ADMIN_API_KEY, DEV_COACH_API_KEY
from app.routers.admin import AdminRouter
from litestar import Litestar
from litestar.middleware.base import DefineMiddleware
from litestar.testing import AsyncTestClient

ADMIN = {"Authorization": f"Bearer {DEV_ADMIN_API_KEY}"}
COACH = {"Authorization": f"Bearer {DEV_COACH_API_KEY}"}

ATHLETE_USER_ID = "00000000-0000-4000-8000-000000000101"
ADMIN_USER_ID = "00000000-0000-4000-8000-000000000103"
COACH_ROLE_ID = "00000000-0000-4000-8000-000000000002"


@pytest.fixture
async def client(db_url: str) -> AsyncIterator[AsyncTestClient[Litestar]]:
    config = SQLAlchemyAsyncConfig(
        connection_string=db_url,
        before_send_handler="autocommit",
        session_config=AsyncSessionConfig(expire_on_commit=False),
        create_all=False,
    )
    app = Litestar(
        route_handlers=[AdminRouter],
        plugins=[SQLAlchemyPlugin(config=config)],
        middleware=[DefineMiddleware(AuthenticationMiddleware, alchemy_config=config)],
    )
    async with AsyncTestClient(app=app) as c:
        yield c


async def test_non_admin_is_forbidden(client: AsyncTestClient[Litestar]) -> None:
    assert (await client.get("/admin/users", headers=COACH)).status_code == 403
    assert (await client.get("/admin/roles", headers=COACH)).status_code == 403


async def test_list_users_returns_users_with_role_names(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.get("/admin/users", headers=ADMIN)

    assert r.status_code == 200
    by_id = {u["id"]: u for u in r.json()}
    assert by_id[ATHLETE_USER_ID] == {
        "id": ATHLETE_USER_ID,
        "first_name": "Dev",
        "last_name": "Athlete",
        "email": "athlete@physiq.dev",
        "roles": ["athlete"],
    }
    assert by_id[ADMIN_USER_ID]["roles"] == ["admin"]


async def test_user_payloads_never_include_api_key_hash(
    client: AsyncTestClient[Litestar],
) -> None:
    listed = (await client.get("/admin/users", headers=ADMIN)).json()
    detail = (await client.get(f"/admin/users/{ATHLETE_USER_ID}", headers=ADMIN)).json()

    assert all("api_key_hash" not in u for u in listed)
    assert "api_key_hash" not in detail


async def test_get_user_returns_roles_with_scopes_and_effective_scopes(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.get(f"/admin/users/{ATHLETE_USER_ID}", headers=ADMIN)

    assert r.status_code == 200
    assert r.json() == {
        "id": ATHLETE_USER_ID,
        "first_name": "Dev",
        "last_name": "Athlete",
        "email": "athlete@physiq.dev",
        "roles": [
            {
                "id": "00000000-0000-4000-8000-000000000001",
                "name": "athlete",
                "description": "Owns and manages their own data",
                "version": 1,
                "scopes": ["athlete:*:*:*"],
            }
        ],
        "scopes": ["athlete:*:*:*"],
    }


async def test_get_unknown_user_is_404(client: AsyncTestClient[Litestar]) -> None:
    r = await client.get(f"/admin/users/{uuid.uuid4()}", headers=ADMIN)
    assert r.status_code == 404


async def test_list_roles_returns_roles_with_scopes(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.get("/admin/roles", headers=ADMIN)

    assert r.status_code == 200
    assert [role["name"] for role in r.json()] == ["admin", "athlete", "coach"]
    by_name = {role["name"]: role for role in r.json()}
    assert by_name["coach"] == {
        "id": COACH_ROLE_ID,
        "name": "coach",
        "description": "Reads and writes data for coached athletes",
        "version": 1,
        "scopes": ["coach:*:*:*"],
    }


async def test_get_role_returns_role_with_scopes(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.get(f"/admin/roles/{COACH_ROLE_ID}", headers=ADMIN)

    assert r.status_code == 200
    assert r.json()["name"] == "coach"
    assert r.json()["scopes"] == ["coach:*:*:*"]


async def test_get_unknown_role_is_404(client: AsyncTestClient[Litestar]) -> None:
    r = await client.get(f"/admin/roles/{uuid.uuid4()}", headers=ADMIN)
    assert r.status_code == 404
