import pytest
from app.auth.scope import Scope, parse_scope


def test_parse_scope_splits_into_four_parts() -> None:
    scope = parse_scope("coach:check-ins:*:read")

    assert scope == Scope(
        role="coach", resource="check-ins", restriction="*", method="read"
    )


@pytest.mark.parametrize(
    "raw",
    [
        "coach:check-ins:read",  # too few parts
        "coach:check-ins:*:read:extra",  # too many parts
        "coach::*:read",  # empty part
        "",
    ],
)
def test_parse_scope_rejects_malformed_strings(raw: str) -> None:
    with pytest.raises(ValueError):
        parse_scope(raw)


class TestScopeCovers:
    def test_exact_match_covers(self) -> None:
        scope = parse_scope("coach:check-ins:*:read")

        assert scope.covers(role="coach", resource="check-ins", method="read")

    @pytest.mark.parametrize(
        "raw",
        [
            "*:check-ins:*:read",
            "coach:*:*:read",
            "coach:check-ins:*:*",
            "*:*:*:*",
        ],
    )
    def test_wildcard_covers_any_value_in_its_position(self, raw: str) -> None:
        scope = parse_scope(raw)

        assert scope.covers(role="coach", resource="check-ins", method="read")

    @pytest.mark.parametrize(
        "raw",
        [
            "athlete:check-ins:*:read",  # wrong role
            "coach:metrics:*:read",  # wrong resource
            "coach:check-ins:*:write",  # wrong method
        ],
    )
    def test_mismatch_in_any_position_does_not_cover(self, raw: str) -> None:
        scope = parse_scope(raw)

        assert not scope.covers(role="coach", resource="check-ins", method="read")

    def test_restriction_is_ignored_when_covering_routes(self) -> None:
        scope = parse_scope("coach:check-ins:trial:read")

        assert scope.covers(role="coach", resource="check-ins", method="read")
