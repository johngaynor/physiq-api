from litestar.openapi import OpenAPIConfig

open_api_config = OpenAPIConfig(
    title="PhysiQ API",
    root_schema_site="elements",
    version="1.0.0",
    enabled_endpoints={"elements", "openapi.json"},
)
