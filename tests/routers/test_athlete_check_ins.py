import datetime
import uuid
from collections.abc import AsyncIterator

import pytest
from app.fixtures.seed import DEV_ATHLETE_API_KEY, DEV_COACH_API_KEY
from app.routers.athlete import AthleteRouter
from litestar import Litestar
from litestar.testing import AsyncTestClient
from sqlalchemy.ext.asyncio import AsyncSession
from tests.conftest import authenticated_client

ATHLETE = {"Authorization": f"Bearer {DEV_ATHLETE_API_KEY}"}
COACH = {"Authorization": f"Bearer {DEV_COACH_API_KEY}"}

ATHLETE_USER_ID = "00000000-0000-4000-8000-000000000101"
SEEDED_MORNING_ID = "00000000-0000-4000-8000-000000000201"
SEEDED_POST_MEAL_ID = "00000000-0000-4000-8000-000000000202"
COACHES_OWN_CHECK_IN_ID = "00000000-0000-4000-8000-000000000203"

SEPTEMBER = {"start": "2026-09-01T00:00:00Z", "end": "2026-10-01T00:00:00Z"}


@pytest.fixture
async def client(
    db_url: str, db_session: AsyncSession
) -> AsyncIterator[AsyncTestClient[Litestar]]:
    async with authenticated_client(db_url, AthleteRouter) as c:
        yield c


def _now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


# --- read ------------------------------------------------------------------


async def test_non_athlete_is_forbidden(client: AsyncTestClient[Litestar]) -> None:
    assert (await client.get("/athlete/check-ins", headers=COACH)).status_code == 403


async def test_list_returns_own_check_ins_in_range_newest_first(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.get("/athlete/check-ins", headers=ATHLETE, params=SEPTEMBER)

    assert r.status_code == 200
    assert [c["id"] for c in r.json()] == [SEEDED_POST_MEAL_ID, SEEDED_MORNING_ID]
    assert all(c["user_id"] == ATHLETE_USER_ID for c in r.json())


async def test_list_derives_local_date_from_tz(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.get("/athlete/check-ins", headers=ATHLETE, params=SEPTEMBER)

    by_id = {c["id"]: c for c in r.json()}
    # 2026-09-02T04:30Z is still 1 September in Denver (UTC-6).
    assert by_id[SEEDED_POST_MEAL_ID]["local_date"] == "2026-09-01"
    assert by_id[SEEDED_MORNING_ID]["local_date"] == "2026-09-01"


async def test_list_defaults_to_a_recent_window(
    client: AsyncTestClient[Litestar],
) -> None:
    now = datetime.datetime.now(datetime.timezone.utc)
    recent = await client.post(
        "/athlete/check-ins",
        headers=ATHLETE,
        json={"checked_in_at": now.isoformat(), "tz": "UTC"},
    )
    stale = await client.post(
        "/athlete/check-ins",
        headers=ATHLETE,
        json={
            "checked_in_at": (now - datetime.timedelta(days=60)).isoformat(),
            "tz": "UTC",
        },
    )

    r = await client.get("/athlete/check-ins", headers=ATHLETE)

    assert r.status_code == 200
    ids = [c["id"] for c in r.json()]
    assert recent.json()["id"] in ids
    assert stale.json()["id"] not in ids


async def test_get_returns_full_check_in(client: AsyncTestClient[Litestar]) -> None:
    r = await client.get(f"/athlete/check-ins/{SEEDED_MORNING_ID}", headers=ATHLETE)

    assert r.status_code == 200
    body = r.json()
    assert body["id"] == SEEDED_MORNING_ID
    assert body["user_id"] == ATHLETE_USER_ID
    assert datetime.datetime.fromisoformat(body["checked_in_at"]) == datetime.datetime(
        2026, 9, 1, 14, tzinfo=datetime.timezone.utc
    )
    assert body["tz"] == "America/Denver"
    assert body["local_date"] == "2026-09-01"
    assert body["comments_general"] == "Slept well, weight steady"
    assert body["comments_training"] == "Push day, hit PRs on bench"
    assert body["comments_cheats"] is None
    assert "created_at" in body and "updated_at" in body


async def test_get_another_users_check_in_is_404(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.get(
        f"/athlete/check-ins/{COACHES_OWN_CHECK_IN_ID}", headers=ATHLETE
    )
    assert r.status_code == 404


async def test_get_unknown_check_in_is_404(client: AsyncTestClient[Litestar]) -> None:
    r = await client.get(f"/athlete/check-ins/{uuid.uuid4()}", headers=ATHLETE)
    assert r.status_code == 404


# --- create ----------------------------------------------------------------


async def test_create_returns_201_owned_by_caller(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.post(
        "/athlete/check-ins",
        headers=ATHLETE,
        json={
            "checked_in_at": "2026-09-10T03:15:00-06:00",
            "tz": "America/Denver",
            "comments_general": "Late night entry",
        },
    )

    assert r.status_code == 201
    body = r.json()
    assert body["user_id"] == ATHLETE_USER_ID
    assert datetime.datetime.fromisoformat(body["checked_in_at"]) == datetime.datetime(
        2026, 9, 10, 9, 15, tzinfo=datetime.timezone.utc
    )
    assert body["local_date"] == "2026-09-10"
    assert body["comments_general"] == "Late night entry"
    assert body["comments_training"] is None
    assert body["comments_cheats"] is None

    fetched = await client.get(f"/athlete/check-ins/{body['id']}", headers=ATHLETE)
    assert fetched.status_code == 200


async def test_create_allows_several_on_one_day(
    client: AsyncTestClient[Litestar],
) -> None:
    payload = {"checked_in_at": "2026-09-01T20:00:00+00:00", "tz": "America/Denver"}

    r = await client.post("/athlete/check-ins", headers=ATHLETE, json=payload)

    assert r.status_code == 201
    listed = await client.get("/athlete/check-ins", headers=ATHLETE, params=SEPTEMBER)
    assert len([c for c in listed.json() if c["local_date"] == "2026-09-01"]) == 3


async def test_create_with_naive_datetime_is_400(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.post(
        "/athlete/check-ins",
        headers=ATHLETE,
        json={"checked_in_at": "2026-09-10T03:15:00", "tz": "America/Denver"},
    )
    assert r.status_code == 400


async def test_create_with_unknown_tz_is_400(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.post(
        "/athlete/check-ins",
        headers=ATHLETE,
        json={"checked_in_at": _now_iso(), "tz": "Mars/Olympus_Mons"},
    )
    assert r.status_code == 400
    assert "Mars/Olympus_Mons" in r.text


# --- update ----------------------------------------------------------------


async def test_patch_changes_only_given_fields(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.patch(
        f"/athlete/check-ins/{SEEDED_MORNING_ID}",
        headers=ATHLETE,
        json={"comments_training": None, "comments_cheats": "Ice cream"},
    )

    assert r.status_code == 200
    body = r.json()
    assert body["comments_general"] == "Slept well, weight steady"  # untouched
    assert body["comments_training"] is None  # explicit null clears
    assert body["comments_cheats"] == "Ice cream"
    assert body["updated_at"] > body["created_at"]


async def test_patch_can_move_check_in_and_change_tz(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.patch(
        f"/athlete/check-ins/{SEEDED_MORNING_ID}",
        headers=ATHLETE,
        json={"checked_in_at": "2026-09-03T02:00:00+00:00", "tz": "Asia/Seoul"},
    )

    assert r.status_code == 200
    assert r.json()["tz"] == "Asia/Seoul"
    assert r.json()["local_date"] == "2026-09-03"


async def test_patch_with_unknown_tz_is_400(client: AsyncTestClient[Litestar]) -> None:
    r = await client.patch(
        f"/athlete/check-ins/{SEEDED_MORNING_ID}", headers=ATHLETE, json={"tz": "Nope"}
    )
    assert r.status_code == 400


async def test_patch_another_users_check_in_is_404(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.patch(
        f"/athlete/check-ins/{COACHES_OWN_CHECK_IN_ID}",
        headers=ATHLETE,
        json={"comments_general": "hijack"},
    )
    assert r.status_code == 404


# --- delete ----------------------------------------------------------------


async def test_delete_removes_own_check_in(client: AsyncTestClient[Litestar]) -> None:
    r = await client.delete(f"/athlete/check-ins/{SEEDED_MORNING_ID}", headers=ATHLETE)

    assert r.status_code == 204
    assert (
        await client.get(f"/athlete/check-ins/{SEEDED_MORNING_ID}", headers=ATHLETE)
    ).status_code == 404


async def test_delete_another_users_check_in_is_404(
    client: AsyncTestClient[Litestar],
) -> None:
    r = await client.delete(
        f"/athlete/check-ins/{COACHES_OWN_CHECK_IN_ID}", headers=ATHLETE
    )
    assert r.status_code == 404
