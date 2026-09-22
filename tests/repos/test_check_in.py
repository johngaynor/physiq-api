import datetime
import uuid

from app.models.check_in import CheckInModel
from app.models.user import UserModel
from app.repos.check_in import CheckInRepository
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

UTC = datetime.timezone.utc


def _at(day: int, hour: int = 12) -> datetime.datetime:
    return datetime.datetime(2026, 9, day, hour, tzinfo=UTC)


async def _seed_user(session: AsyncSession, email: str) -> UserModel:
    user = UserModel(email=email)
    session.add(user)
    await session.commit()
    return user


async def test_create_persists_fields_and_timestamps(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "c1@x.io")
    repo = CheckInRepository(db_session)

    created = await repo.create(
        user.id,
        checked_in_at=_at(1),
        tz="America/Denver",
        comments_general="felt good",
        comments_training="PPL",
        comments_cheats=None,
    )
    await db_session.commit()

    fetched = await db_session.get(CheckInModel, created.id)
    assert fetched is not None
    assert fetched.user_id == user.id
    assert fetched.checked_in_at == _at(1)
    assert fetched.tz == "America/Denver"
    assert fetched.comments_general == "felt good"
    assert fetched.comments_training == "PPL"
    assert fetched.comments_cheats is None
    assert fetched.created_at.tzinfo is not None
    assert fetched.updated_at == fetched.created_at


async def test_multiple_check_ins_on_one_day_are_allowed(
    db_session: AsyncSession,
) -> None:
    user = await _seed_user(db_session, "c2@x.io")
    repo = CheckInRepository(db_session)

    await repo.create(user.id, checked_in_at=_at(1, 8), tz="UTC")
    await repo.create(user.id, checked_in_at=_at(1, 20), tz="UTC")
    await db_session.commit()

    assert len(await repo.list(user.id, _at(1, 0), _at(2, 0))) == 2


async def test_list_is_bounded_by_range_scoped_to_user_and_newest_first(
    db_session: AsyncSession,
) -> None:
    user = await _seed_user(db_session, "c3@x.io")
    other = await _seed_user(db_session, "c3b@x.io")
    repo = CheckInRepository(db_session)
    early = await repo.create(user.id, checked_in_at=_at(1), tz="UTC")
    late = await repo.create(user.id, checked_in_at=_at(3), tz="UTC")
    await repo.create(user.id, checked_in_at=_at(10), tz="UTC")  # outside range
    await repo.create(other.id, checked_in_at=_at(2), tz="UTC")  # other user
    await db_session.commit()

    listed = await repo.list(user.id, _at(1, 0), _at(4, 0))

    assert [c.id for c in listed] == [late.id, early.id]


async def test_list_range_end_is_exclusive(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "c4@x.io")
    repo = CheckInRepository(db_session)
    await repo.create(user.id, checked_in_at=_at(2, 0), tz="UTC")
    await db_session.commit()

    assert await repo.list(user.id, _at(1, 0), _at(2, 0)) == []
    assert len(await repo.list(user.id, _at(2, 0), _at(3, 0))) == 1


async def test_get_returns_only_the_owners_check_in(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "c5@x.io")
    other = await _seed_user(db_session, "c5b@x.io")
    repo = CheckInRepository(db_session)
    created = await repo.create(user.id, checked_in_at=_at(1), tz="UTC")
    await db_session.commit()

    assert (await repo.get(user.id, created.id)) is not None
    assert await repo.get(other.id, created.id) is None
    assert await repo.get(user.id, uuid.uuid4()) is None


async def test_update_changes_only_given_fields_and_bumps_updated_at(
    db_session: AsyncSession,
) -> None:
    user = await _seed_user(db_session, "c6@x.io")
    repo = CheckInRepository(db_session)
    created = await repo.create(
        user.id, checked_in_at=_at(1), tz="UTC", comments_general="old"
    )
    await db_session.commit()
    before = created.updated_at

    updated = await repo.update(
        user.id, created.id, {"comments_general": None, "comments_cheats": "pizza"}
    )
    await db_session.commit()

    assert updated is not None
    assert updated.comments_general is None
    assert updated.comments_cheats == "pizza"
    assert updated.checked_in_at == _at(1)
    assert updated.updated_at > before


async def test_update_returns_none_for_other_users_check_in(
    db_session: AsyncSession,
) -> None:
    user = await _seed_user(db_session, "c7@x.io")
    other = await _seed_user(db_session, "c7b@x.io")
    repo = CheckInRepository(db_session)
    created = await repo.create(user.id, checked_in_at=_at(1), tz="UTC")
    await db_session.commit()

    assert await repo.update(other.id, created.id, {"comments_general": "x"}) is None


async def test_delete_removes_own_check_in_only(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "c8@x.io")
    other = await _seed_user(db_session, "c8b@x.io")
    repo = CheckInRepository(db_session)
    created = await repo.create(user.id, checked_in_at=_at(1), tz="UTC")
    await db_session.commit()

    assert await repo.delete(other.id, created.id) is False
    assert await repo.delete(user.id, created.id) is True
    await db_session.commit()
    assert await db_session.get(CheckInModel, created.id) is None


async def test_deleting_user_cascades_check_ins(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "c9@x.io")
    repo = CheckInRepository(db_session)
    created = await repo.create(user.id, checked_in_at=_at(1), tz="UTC")
    await db_session.commit()

    await db_session.delete(user)
    await db_session.commit()

    stmt = select(CheckInModel.id).where(CheckInModel.id == created.id)
    assert (await db_session.execute(stmt)).scalar_one_or_none() is None
