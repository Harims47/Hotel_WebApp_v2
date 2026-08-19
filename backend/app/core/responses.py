from typing import Any
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

def success_response(data: Any = None, message: str = None, meta: Any = None, status_code: int = 200) -> JSONResponse:
    """
    Generate a standardized success response, serializing datetimes and UUIDs automatically.
    """
    content = {
        "success": True,
        "data": data if data is not None else {},
        "message": message,
        "meta": meta
    }
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(content)
    )

def error_response(code: str, message: str, details: Any = None, status_code: int = 400) -> JSONResponse:
    """
    Generate a standardized error response.
    """
    content = {
        "success": False,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "details": details if details is not None else {}
        }
    }
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(content)
    )
