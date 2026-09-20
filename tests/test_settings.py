import pytest
from app.settings import Settings


def _settings(**env: str) -> Settings:
    # _env_file=None keeps the real .env out of these tests.
    return Settings(_env_file=None, API_KEY="k", **env)


def test_database_uri_used_verbatim_when_set() -> None:
    s = _settings(DATABASE_URI="postgresql+asyncpg://u:p@h:5432/d")
    assert s.database_uri == "postgresql+asyncpg://u:p@h:5432/d"


def test_database_uri_built_from_parts() -> None:
    s = _settings(DB_HOST="h", DB_NAME="d", DB_USER="u", DB_PASSWORD="p")
    assert s.database_uri == "postgresql+asyncpg://u:p@h:5432/d"


def test_database_uri_parts_respect_port() -> None:
    s = _settings(DB_HOST="h", DB_PORT="6543", DB_NAME="d", DB_USER="u", DB_PASSWORD="p")
    assert s.database_uri == "postgresql+asyncpg://u:p@h:6543/d"


def test_missing_database_config_raises() -> None:
    with pytest.raises(ValueError, match="DATABASE_URI"):
        _settings()


def test_missing_password_raises() -> None:
    with pytest.raises(ValueError, match="DB_PASSWORD"):
        _settings(DB_HOST="h", DB_NAME="d", DB_USER="u")
