import uuid

from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.repos.role import RoleRepository
from sqlalchemy.ext.asyncio import AsyncSession


async def _seed_role(session: AsyncSession, *, scopes: list[str]) -> RoleModel:
    role = RoleModel(name=f"role-{uuid.uuid4()}")
    role.scopes = [RoleScopeModel(scope_str=s) for s in scopes]
    session.add(role)
    await session.commit()
    return role


async def test_list_all_returns_every_role_with_scopes(
    db_session: AsyncSession,
) -> None:
    seeded = await _seed_role(db_session, scopes=["coach:metrics:*:read"])

    roles = await RoleRepository(db_session).list_all()

    by_id = {r.id: r for r in roles}
    assert seeded.id in by_id
    assert [s.scope_str for s in by_id[seeded.id].scopes] == ["coach:metrics:*:read"]
    assert {"athlete", "coach", "admin"} <= {r.name for r in roles}


async def test_list_all_is_ordered_by_name(db_session: AsyncSession) -> None:
    roles = await RoleRepository(db_session).list_all()

    assert [r.name for r in roles] == sorted(r.name for r in roles)


async def test_get_by_id_returns_role_with_scopes(db_session: AsyncSession) -> None:
    seeded = await _seed_role(
        db_session, scopes=["athlete:check-ins:self:read", "athlete:metrics:self:read"]
    )

    found = await RoleRepository(db_session).get_by_id(seeded.id)

    assert found is not None
    assert found.name == seeded.name
    assert sorted(s.scope_str for s in found.scopes) == [
        "athlete:check-ins:self:read",
        "athlete:metrics:self:read",
    ]


async def test_get_by_id_returns_none_when_unknown(db_session: AsyncSession) -> None:
    assert await RoleRepository(db_session).get_by_id(uuid.uuid4()) is None
