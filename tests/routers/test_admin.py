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
from app.models.user_role import UserRoleModel
from app.routers.admin import AdminRouter
from litestar import Litestar
from litestar.middleware.base import DefineMiddleware
from litestar.testing import AsyncTestClient
from sqlalchemy.ext.asyncio import AsyncSession

ADMIN = {"Authorization": f"Bearer {DEV_ADMIN_API_KEY}"}
COACH = {"Authorization": f"Bearer {DEV_COACH_API_KEY}"}

ATHLETE_USER_ID = "00000000-0000-4000-8000-000000000101"
ADMIN_USER_ID = "00000000-0000-4000-8000-000000000103"
COACH_ROLE_ID = "00000000-0000-4000-8000-000000000002"


@pytest.fixture
async def client(
    db_url: str, db_session: AsyncSession
) -> AsyncIterator[AsyncTestClient[Litestar]]:
    """A client against the seeded test database.

    Depends on ``db_session`` so every test starts from the seed baseline and
    the database is reset afterwards.
    """
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


# --- role writes -----------------------------------------------------------


async def test_non_admin_cannot_write(client: AsyncTestClient[Litestar]) -> None:
    r = await client.post(
        "/admin/roles", headers=COACH, json={"name": "x", "scopes": []}
    )
    assert r.status_code == 403


async def test_create_role_returns_201_with_role(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.post(
        "/admin/roles",
        headers=ADMIN,
        json={
            "name": "auditor",
            "description": "Reads everything",
            "scopes": ["coach:*:*:read", "athlete:*:*:read", "coach:*:*:read"],
        },
    )

    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "auditor"
    assert body["description"] == "Reads everything"
    assert body["version"] == 1
    assert body["scopes"] == ["athlete:*:*:read", "coach:*:*:read"]

    listed = (await client.get("/admin/roles", headers=ADMIN)).json()
    assert "auditor" in {role["name"] for role in listed}


async def test_create_role_with_duplicate_name_is_409(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.post(
        "/admin/roles", headers=ADMIN, json={"name": "coach", "scopes": []}
    )
    assert r.status_code == 409


async def test_create_role_with_invalid_scope_is_400(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.post(
        "/admin/roles", headers=ADMIN, json={"name": "bad", "scopes": ["coach:read"]}
    )
    assert r.status_code == 400
    assert "coach:read" in r.json()["detail"]


async def test_replace_scopes_overwrites_and_bumps_version(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.put(
        f"/admin/roles/{COACH_ROLE_ID}/scopes",
        headers=ADMIN,
        json={"scopes": ["coach:metrics:*:read", "coach:check-ins:*:read"]},
    )

    assert r.status_code == 200
    assert r.json()["scopes"] == ["coach:check-ins:*:read", "coach:metrics:*:read"]
    assert r.json()["version"] == 2

    fetched = (await client.get(f"/admin/roles/{COACH_ROLE_ID}", headers=ADMIN)).json()
    assert fetched["version"] == 2
    assert fetched["scopes"] == ["coach:check-ins:*:read", "coach:metrics:*:read"]


async def test_replace_scopes_with_invalid_scope_is_400(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.put(
        f"/admin/roles/{COACH_ROLE_ID}/scopes", headers=ADMIN, json={"scopes": ["::"]}
    )
    assert r.status_code == 400


async def test_replace_scopes_on_unknown_role_is_404(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.put(
        f"/admin/roles/{uuid.uuid4()}/scopes", headers=ADMIN, json={"scopes": []}
    )
    assert r.status_code == 404


async def test_delete_unassigned_role_is_204(
    client: AsyncTestClient[Litestar],
) -> None:
    created = await client.post(
        "/admin/roles", headers=ADMIN, json={"name": "temp", "scopes": []}
    )
    role_id = created.json()["id"]

    r = await client.delete(f"/admin/roles/{role_id}", headers=ADMIN)

    assert r.status_code == 204
    assert (
        await client.get(f"/admin/roles/{role_id}", headers=ADMIN)
    ).status_code == 404


async def test_delete_assigned_role_is_409(client: AsyncTestClient[Litestar]) -> None:
    r = await client.delete(f"/admin/roles/{COACH_ROLE_ID}", headers=ADMIN)

    assert r.status_code == 409
    assert (
        await client.get(f"/admin/roles/{COACH_ROLE_ID}", headers=ADMIN)
    ).status_code == 200


async def test_delete_unknown_role_is_404(client: AsyncTestClient[Litestar]) -> None:
    r = await client.delete(f"/admin/roles/{uuid.uuid4()}", headers=ADMIN)
    assert r.status_code == 404


# --- role assignment -------------------------------------------------------


async def test_assign_role_records_calling_admin(
    client: AsyncTestClient[Litestar], db_session: AsyncSession
) -> None:
    r = await client.put(
        f"/admin/users/{ATHLETE_USER_ID}/roles/{COACH_ROLE_ID}", headers=ADMIN
    )

    assert r.status_code == 204
    detail = (await client.get(f"/admin/users/{ATHLETE_USER_ID}", headers=ADMIN)).json()
    assert [role["name"] for role in detail["roles"]] == ["athlete", "coach"]
    assert detail["scopes"] == ["athlete:*:*:*", "coach:*:*:*"]

    assignment = await db_session.get(
        UserRoleModel, (uuid.UUID(ATHLETE_USER_ID), uuid.UUID(COACH_ROLE_ID))
    )
    assert assignment is not None
    assert assignment.granted_by == uuid.UUID(ADMIN_USER_ID)


async def test_assign_role_twice_is_204(client: AsyncTestClient[Litestar]) -> None:
    url = f"/admin/users/{ATHLETE_USER_ID}/roles/{COACH_ROLE_ID}"
    await client.put(url, headers=ADMIN)

    assert (await client.put(url, headers=ADMIN)).status_code == 204


async def test_assign_role_to_unknown_user_is_404(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.put(
        f"/admin/users/{uuid.uuid4()}/roles/{COACH_ROLE_ID}", headers=ADMIN
    )
    assert r.status_code == 404


async def test_assign_unknown_role_is_404(client: AsyncTestClient[Litestar]) -> None:
    r = await client.put(
        f"/admin/users/{ATHLETE_USER_ID}/roles/{uuid.uuid4()}", headers=ADMIN
    )
    assert r.status_code == 404


async def test_revoke_role_removes_it(client: AsyncTestClient[Litestar]) -> None:
    athlete_role_id = "00000000-0000-4000-8000-000000000001"

    r = await client.delete(
        f"/admin/users/{ATHLETE_USER_ID}/roles/{athlete_role_id}", headers=ADMIN
    )

    assert r.status_code == 204
    detail = (await client.get(f"/admin/users/{ATHLETE_USER_ID}", headers=ADMIN)).json()
    assert detail["roles"] == []


async def test_revoke_unassigned_role_is_404(client: AsyncTestClient[Litestar]) -> None:
    r = await client.delete(
        f"/admin/users/{ATHLETE_USER_ID}/roles/{COACH_ROLE_ID}", headers=ADMIN
    )
    assert r.status_code == 404
