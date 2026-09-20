from app.middleware.authentication import AuthenticationMiddleware
from app.routers.check_in import CheckInRouter
from app.routers.metric import MetricRouter
from app.shared.open_api import open_api_config
from litestar import Litestar, get
from litestar.middleware.base import DefineMiddleware


@get("/health", tags=["Meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app = Litestar(
    route_handlers=[health, CheckInRouter, MetricRouter],
    openapi_config=open_api_config,
    middleware=[
        DefineMiddleware(AuthenticationMiddleware, exclude=["^/health$", "^/schema"])
    ],
)
