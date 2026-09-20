import uuid
from collections.abc import AsyncIterator

import pytest
from advanced_alchemy.extensions.litestar import (
    AsyncSessionConfig,
    SQLAlchemyAsyncConfig,
    SQLAlchemyPlugin,
)
from app.auth.authentication import AuthenticationMiddleware
from app.auth.keys import hash_api_key
from app.auth.principal import Principal
from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.models.user import UserModel
from app.models.user_role import UserRoleModel
from litestar import Litestar, Request, get
from litestar.middleware.base import DefineMiddleware
from litestar.testing import AsyncTestClient
from sqlalchemy.ext.asyncio import AsyncSession

KEY = "valid-key"


@get("/whoami")
async def whoami(request: Request[UserModel, Principal, None]) -> dict[str, object]:
    return {
        "user_id": str(request.user.id),
        "scopes": sorted(
            f"{s.role}:{s.resource}:{s.restriction}:{s.method}"
            for s in request.auth.scopes
        ),
    }


@pytest.fixture
async def client(db_url: str) -> AsyncIterator[AsyncTestClient[Litestar]]:
    config = SQLAlchemyAsyncConfig(
        connection_string=db_url,
        before_send_handler="autocommit",
        session_config=AsyncSessionConfig(expire_on_commit=False),
        create_all=False,
    )
    app = Litestar(
        route_handlers=[whoami],
        plugins=[SQLAlchemyPlugin(config=config)],
        middleware=[DefineMiddleware(AuthenticationMiddleware, alchemy_config=config)],
    )
    async with AsyncTestClient(app=app) as c:
        yield c


async def _seed(db_session: AsyncSession) -> UserModel:
    user = UserModel(email="k@e.y", api_key_hash=hash_api_key(KEY))
    role = RoleModel(name=f"role-{uuid.uuid4()}")
    role.scopes = [RoleScopeModel(scope_str="athlete:check-ins:self:read")]
    db_session.add_all([user, role])
    await db_session.flush()
    db_session.add(UserRoleModel(user_id=user.id, role_id=role.id))
    await db_session.commit()
    return user


async def test_missing_header_is_401(client: AsyncTestClient[Litestar]) -> None:
    assert (await client.get("/whoami")).status_code == 401


async def test_non_bearer_scheme_is_401(client: AsyncTestClient[Litestar]) -> None:
    r = await client.get("/whoami", headers={"Authorization": "Basic abc"})
    assert r.status_code == 401


async def test_unknown_key_is_401(
    client: AsyncTestClient[Litestar], db_session: AsyncSession
) -> None:
    await _seed(db_session)
    r = await client.get("/whoami", headers={"Authorization": "Bearer wrong"})
    assert r.status_code == 401


async def test_valid_key_sets_user_and_principal(
    client: AsyncTestClient[Litestar], db_session: AsyncSession
) -> None:
    user = await _seed(db_session)
    r = await client.get("/whoami", headers={"Authorization": f"Bearer {KEY}"})
    assert r.status_code == 200
    assert r.json() == {
        "user_id": str(user.id),
        "scopes": ["athlete:check-ins:self:read"],
    }
