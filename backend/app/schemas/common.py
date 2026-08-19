from typing import Any, Generic, TypeVar
from pydantic import BaseModel

DataType = TypeVar("DataType")

class ErrorDetailSchema(BaseModel):
    code: str
    message: str
    details: dict = {}

class ErrorResponseEnvelope(BaseModel):
    success: bool = False
    data: Any = None
    error: ErrorDetailSchema

class SuccessResponseEnvelope(BaseModel, Generic[DataType]):
    success: bool = True
    data: DataType
    message: str | None = None
    meta: Any | None = None
