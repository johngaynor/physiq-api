import uuid

from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.repos.role import RoleRepository
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def _seed_role(session: AsyncSession, *, scopes: list[str]) -> RoleModel:
    role = RoleModel(name=f"role-{uuid.uuid4()}")
    role.scopes = [RoleScopeModel(scope_str=s) for s in scopes]
    session.add(role)
    await session.commit()
    return role


async def test_get_all_returns_every_role_with_scopes(
    db_session: AsyncSession,
) -> None:
    seeded = await _seed_role(db_session, scopes=["coach:metrics:*:read"])

    roles = await RoleRepository(db_session).get_all()

    by_id = {r.id: r for r in roles}
    assert seeded.id in by_id
    assert [s.scope_str for s in by_id[seeded.id].scopes] == ["coach:metrics:*:read"]
    assert {"athlete", "coach", "admin"} <= {r.name for r in roles}


async def test_get_all_is_ordered_by_name(db_session: AsyncSession) -> None:
    roles = await RoleRepository(db_session).get_all()

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


async def test_create_persists_role_with_scopes(db_session: AsyncSession) -> None:
    name = f"role-{uuid.uuid4()}"

    created = await RoleRepository(db_session).create(
        name=name, description="desc", scopes=["coach:metrics:*:read"]
    )
    await db_session.commit()

    found = await RoleRepository(db_session).get_by_id(created.id)
    assert found is not None
    assert (found.name, found.description, found.version) == (name, "desc", 1)
    assert [s.scope_str for s in found.scopes] == ["coach:metrics:*:read"]


async def test_get_by_name_returns_matching_role(db_session: AsyncSession) -> None:
    found = await RoleRepository(db_session).get_by_name("coach")

    assert found is not None
    assert found.name == "coach"


async def test_get_by_name_returns_none_when_unknown(db_session: AsyncSession) -> None:
    assert await RoleRepository(db_session).get_by_name("nope") is None


async def test_set_scopes_replaces_scopes_and_bumps_version(
    db_session: AsyncSession,
) -> None:
    role = await _seed_role(db_session, scopes=["a:b:c:read", "a:b:c:write"])
    repo = RoleRepository(db_session)

    await repo.set_scopes(role, ["x:y:z:read"])
    await db_session.commit()

    stored = await db_session.execute(
        select(RoleScopeModel.scope_str).where(RoleScopeModel.role_id == role.id)
    )
    assert list(stored.scalars().all()) == ["x:y:z:read"]
    assert (
        await db_session.scalar(
            select(RoleModel.version).where(RoleModel.id == role.id)
        )
        == 2
    )


async def test_delete_removes_role(db_session: AsyncSession) -> None:
    role = await _seed_role(db_session, scopes=["a:b:c:read"])
    repo = RoleRepository(db_session)

    await repo.delete(role)
    await db_session.commit()

    assert await repo.get_by_id(role.id) is None


async def test_is_assigned_reflects_user_roles(db_session: AsyncSession) -> None:
    repo = RoleRepository(db_session)
    coach_role = await repo.get_by_name("coach")
    assert coach_role is not None
    unassigned = await _seed_role(db_session, scopes=[])

    assert await repo.is_assigned(coach_role.id) is True
    assert await repo.is_assigned(unassigned.id) is False
