FROM astral/uv:python3.13-alpine

WORKDIR /app

RUN apk add --no-cache tzdata postgresql-client \
    && ln -fs /usr/share/zoneinfo/UTC /etc/localtime

COPY app/ app/
COPY migrations/ migrations/
COPY alembic.ini pyproject.toml uv.lock ./

RUN adduser -D physiq \
    && chown -R physiq:physiq /app
USER physiq

# Keep the venv outside /app so a bind-mounted source tree does not hide it.
ENV UV_PROJECT_ENVIRONMENT=/home/physiq/.venv
RUN uv sync --locked --no-dev --compile-bytecode --no-cache --no-editable
ENV PATH="$UV_PROJECT_ENVIRONMENT/bin:$PATH"

ENV LITESTAR_APP=app.main:app

CMD ["sh", "-c", "litestar database upgrade --no-prompt && litestar run --host 0.0.0.0"]
