from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.exceptions import BusinessException
from app.core.responses import error_response
from app.core.middleware import (
    SecurityHeadersMiddleware,
    RequestSizeLimitMiddleware,
    CorrelationIDMiddleware
)
from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router

app = FastAPI(
    title="Restaurant OS Backend Foundation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 1. Middlewares Setup
app.add_middleware(CorrelationIDMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Exception Handlers

@app.exception_handler(BusinessException)
async def business_exception_handler(request: Request, exc: BusinessException):
    return error_response(
        code=exc.code,
        message=exc.message,
        details=exc.details,
        status_code=exc.status_code
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = {}
    for err in exc.errors():
        field = ".".join(str(p) for p in err["loc"][1:]) if len(err["loc"]) > 1 else "body"
        errors[field] = err["msg"]
    return error_response(
        code="VALIDATION_ERROR",
        message="Request payload validation failed",
        details=errors,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return error_response(
        code="HTTP_ERROR",
        message=exc.detail,
        status_code=exc.status_code
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Hide stack traces in production responses
    return error_response(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected server error occurred",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

# 3. Router Mappings
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(health_router, prefix="/api/v1", tags=["System Health"])
