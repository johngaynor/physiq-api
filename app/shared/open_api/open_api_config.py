from litestar.openapi import OpenAPIConfig
from litestar.openapi.spec import Components, SecurityScheme

open_api_config = OpenAPIConfig(
    title="PhysiQ API",
    root_schema_site="elements",
    version="1.0.0",
    enabled_endpoints={"elements", "openapi.json"},
    components=Components(
        security_schemes={"BearerToken": SecurityScheme(type="http", scheme="bearer")}
    ),
    security=[{"BearerToken": []}],
)
