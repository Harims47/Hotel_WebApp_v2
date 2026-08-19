import uuid
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Scope, Receive, Send
from app.core.responses import error_response

class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
                headers["X-Content-Type-Options"] = "nosniff"
                headers["X-Frame-Options"] = "DENY"
                headers["X-XSS-Protection"] = "1; mode=block"
            await send(message)

        await self.app(scope, receive, send_wrapper)

class RequestSizeLimitMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers_dict = dict(scope.get("headers", []))
        content_length = headers_dict.get(b"content-length")
        if content_length:
            try:
                if int(content_length) > 2 * 1024 * 1024:
                    response = error_response(
                        code="PAYLOAD_TOO_LARGE",
                        message="Payload too large; maximum request size is 2MB",
                        status_code=413
                    )
                    await response(scope, receive, send)
                    return
            except ValueError:
                pass

        await self.app(scope, receive, send)

class CorrelationIDMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        correlation_id = None
        for k, v in scope.get("headers", []):
            if k == b"x-correlation-id":
                correlation_id = v.decode("utf-8")
                break

        if not correlation_id:
            correlation_id = str(uuid.uuid4())
            # Safely append header tuple
            scope["headers"].append((b"x-correlation-id", correlation_id.encode("utf-8")))

        async def send_wrapper(message) -> None:
            if message["type"] == "http.response.start":
                res_headers = MutableHeaders(scope=message)
                res_headers["X-Correlation-ID"] = correlation_id
            await send(message)

        await self.app(scope, receive, send_wrapper)
