from litestar import Request
from litestar.enums import OpenAPIMediaType
from litestar.handlers import get
from litestar.openapi import OpenAPIController
from litestar.response.base import ASGIResponse
from litestar.serialization import encode_json


class OpenAPIController(OpenAPIController):
    def render_stoplight_elements(self, request: Request) -> bytes:
        schema = request.app.openapi_schema
        title = schema.info.title if schema and schema.info else "PhysiQ API"
        head = f"""
            <head>
                <title>{title}</title>
                {self.favicon}
                <meta charset="utf-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
                <link rel="stylesheet" href="{self.stoplight_elements_css_url}">
                <script src="{self.stoplight_elements_js_url}" crossorigin></script>
                <style>{self.style}</style>
            </head>
        """

        body = f"""
            <body>
                <elements-api
                    apiDescriptionUrl="{self.path}/openapi.json"
                    router="hash"
                    layout="sidebar"
                    hideSchemas="true"
                    hideExport="true"
                    logo="/favicon.ico"
                />
            </body>
        """

        return f"""
            <!DOCTYPE html>
                <html>
                    {head}
                    {body}
                </html>
        """.encode()

    @get(
        path="/openapi.json",
        media_type=OpenAPIMediaType.OPENAPI_JSON,
        include_in_schema=False,
    )
    async def retrieve_schema_json(self, request: Request) -> ASGIResponse:
        schema = request.app.openapi_schema
        body = encode_json(schema.to_schema(), request.route_handler.default_serializer)
        return ASGIResponse(body=body, media_type=OpenAPIMediaType.OPENAPI_JSON)
