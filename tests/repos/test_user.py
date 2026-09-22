import uuid

from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.models.user import UserModel
from app.models.user_role import UserRoleModel
from app.repos.user import UserRepository
from sqlalchemy.ext.asyncio import AsyncSession


async def _seed_user_with_scopes(
    session: AsyncSession, *, api_key_hash: str, scopes: list[str]
) -> UserModel:
    user = UserModel(email="a@b.c", api_key_hash=api_key_hash)
    role = RoleModel(name=f"role-{uuid.uuid4()}")
    role.scopes = [RoleScopeModel(scope_str=s) for s in scopes]
    session.add_all([user, role])
    await session.flush()
    session.add(UserRoleModel(user_id=user.id, role_id=role.id))
    await session.commit()
    return user


async def test_get_by_api_key_hash_returns_matching_user(
    db_session: AsyncSession,
) -> None:
    seeded = await _seed_user_with_scopes(db_session, api_key_hash="h1", scopes=[])

    found = await UserRepository(db_session).get_by_api_key_hash("h1")

    assert found is not None
    assert found.id == seeded.id


async def test_get_by_api_key_hash_returns_none_when_unknown(
    db_session: AsyncSession,
) -> None:
    assert await UserRepository(db_session).get_by_api_key_hash("nope") is None


async def test_list_scope_strings_unions_scopes_across_roles(
    db_session: AsyncSession,
) -> None:
    user = await _seed_user_with_scopes(
        db_session, api_key_hash="h2", scopes=["athlete:check-ins:self:read"]
    )
    second_role = RoleModel(name=f"role-{uuid.uuid4()}")
    second_role.scopes = [
        RoleScopeModel(scope_str="coach:check-ins:*:read"),
        RoleScopeModel(scope_str="athlete:check-ins:self:read"),  # duplicate
    ]
    db_session.add(second_role)
    await db_session.flush()
    db_session.add(UserRoleModel(user_id=user.id, role_id=second_role.id))
    await db_session.commit()

    scopes = await UserRepository(db_session).list_scope_strings(user.id)

    assert sorted(scopes) == ["athlete:check-ins:self:read", "coach:check-ins:*:read"]


async def test_list_scope_strings_empty_for_user_without_roles(
    db_session: AsyncSession,
) -> None:
    user = UserModel(email="x@y.z")
    db_session.add(user)
    await db_session.commit()

    assert await UserRepository(db_session).list_scope_strings(user.id) == []


async def test_list_all_returns_every_user(db_session: AsyncSession) -> None:
    seeded = await _seed_user_with_scopes(db_session, api_key_hash="h3", scopes=[])

    users = await UserRepository(db_session).list_all()

    assert seeded.id in {u.id for u in users}
    assert "athlete@physiq.dev" in {u.email for u in users}


async def test_get_by_id_returns_matching_user(db_session: AsyncSession) -> None:
    seeded = await _seed_user_with_scopes(db_session, api_key_hash="h4", scopes=[])

    found = await UserRepository(db_session).get_by_id(seeded.id)

    assert found is not None
    assert found.email == seeded.email


async def test_get_by_id_returns_none_when_unknown(db_session: AsyncSession) -> None:
    assert await UserRepository(db_session).get_by_id(uuid.uuid4()) is None


async def test_list_roles_returns_assigned_roles_with_scopes(
    db_session: AsyncSession,
) -> None:
    user = await _seed_user_with_scopes(
        db_session, api_key_hash="h5", scopes=["athlete:check-ins:self:read"]
    )
    second_role = RoleModel(name=f"role-{uuid.uuid4()}")
    second_role.scopes = [RoleScopeModel(scope_str="coach:check-ins:*:read")]
    db_session.add(second_role)
    await db_session.flush()
    db_session.add(UserRoleModel(user_id=user.id, role_id=second_role.id))
    await db_session.commit()

    roles = await UserRepository(db_session).list_roles(user.id)

    assert len(roles) == 2
    assert {s.scope_str for r in roles for s in r.scopes} == {
        "athlete:check-ins:self:read",
        "coach:check-ins:*:read",
    }


async def test_list_roles_empty_for_user_without_roles(
    db_session: AsyncSession,
) -> None:
    user = UserModel(email="no@roles.io")
    db_session.add(user)
    await db_session.commit()

    assert await UserRepository(db_session).list_roles(user.id) == []


async def test_assign_role_records_granting_admin(db_session: AsyncSession) -> None:
    user = await _seed_user_with_scopes(db_session, api_key_hash="h6", scopes=[])
    admin = await _seed_user_with_scopes(db_session, api_key_hash="h7", scopes=[])
    role = RoleModel(name=f"role-{uuid.uuid4()}")
    db_session.add(role)
    await db_session.flush()
    repo = UserRepository(db_session)

    await repo.assign_role(user.id, role.id, granted_by=admin.id)
    await db_session.commit()

    assignment = await db_session.get(UserRoleModel, (user.id, role.id))
    assert assignment is not None
    assert assignment.granted_by == admin.id
    assert role.id in {r.id for r in await repo.list_roles(user.id)}


async def test_assign_role_is_idempotent(db_session: AsyncSession) -> None:
    user = await _seed_user_with_scopes(db_session, api_key_hash="h8", scopes=[])
    role = RoleModel(name=f"role-{uuid.uuid4()}")
    db_session.add(role)
    await db_session.flush()
    repo = UserRepository(db_session)

    await repo.assign_role(user.id, role.id, granted_by=None)
    await repo.assign_role(user.id, role.id, granted_by=None)
    await db_session.commit()

    assert len(await repo.list_roles(user.id)) == 2  # seeded role + new one


async def test_revoke_role_removes_assignment(db_session: AsyncSession) -> None:
    user = await _seed_user_with_scopes(db_session, api_key_hash="h9", scopes=[])
    repo = UserRepository(db_session)
    [role] = await repo.list_roles(user.id)

    revoked = await repo.revoke_role(user.id, role.id)
    await db_session.commit()

    assert revoked is True
    assert await repo.list_roles(user.id) == []


async def test_revoke_role_returns_false_when_not_assigned(
    db_session: AsyncSession,
) -> None:
    user = await _seed_user_with_scopes(db_session, api_key_hash="h10", scopes=[])

    assert await UserRepository(db_session).revoke_role(user.id, uuid.uuid4()) is False
