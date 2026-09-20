# Database plumbing

Wire a real Postgres database into the API, mirroring the setup used in the
previous `physiq/api` project. This pass covers configuration, the SQLAlchemy
plugin, the model registry and Alembic migrations. Docker compose, the
Dockerfile and DB-backed test fixtures are deferred to a later pass.

## Dependencies and settings

- Add `asyncpg` as the async Postgres driver.
- `Settings` gains `database_uri` (`DATABASE_URI`). When it is empty, a
  validator assembles it from `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` and
  `DB_PASSWORD`, raising a clear error when required pieces are missing.

## Plugin wiring

`app/main.py` registers advanced-alchemy's `SQLAlchemyPlugin` with a
`SQLAlchemyAsyncConfig`:

- `connection_string=SETTINGS.database_uri`
- `before_send_handler="autocommit"` — commit on success, roll back on error
- `session_config=AsyncSessionConfig(expire_on_commit=False)` — ORM objects
  remain readable after the request commits
- `engine_config=EngineConfig(pool_pre_ping=True, pool_recycle=300)`
- `create_all=False` — migrations are the only owner of the schema

Repositories receive a `db_session: AsyncSession` argument injected by the
plugin.

## Model registry

`app/models/__init__.py` imports every SQLAlchemy model so Alembic
autogenerate sees the full metadata. Dataclass stubs are excluded.

## Migrations

Copy `alembic.ini`, `migrations/env.py` and `migrations/script.py.mako` from
the previous project. Generate the initial revision from the existing models
(`users`, `roles`, `role_scopes`, `user_roles`) and review it by hand.
