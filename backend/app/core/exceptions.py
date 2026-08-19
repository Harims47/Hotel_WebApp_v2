from fastapi import HTTPException, status

class BusinessException(Exception):
    """
    Base exception for business logic and validation failures.
    """
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class AuthException(BusinessException):
    """
    Authentication failure exception.
    """
    def __init__(self, message: str = "Invalid credentials", code: str = "UNAUTHORIZED"):
        super().__init__(code, message, status_code=status.HTTP_401_UNAUTHORIZED)

class PermissionException(BusinessException):
    """
    Authorization or privilege checks failure.
    """
    def __init__(self, message: str = "Permission denied", code: str = "FORBIDDEN"):
        super().__init__(code, message, status_code=status.HTTP_403_FORBIDDEN)

class ResourceNotFoundException(BusinessException):
    """
    Resource not found exception.
    """
    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND"):
        super().__init__(code, message, status_code=status.HTTP_404_NOT_FOUND)

class ConflictException(BusinessException):
    """
    Conflict with existing database records or state.
    """
    def __init__(self, message: str, code: str = "CONFLICT"):
        super().__init__(code, message, status_code=status.HTTP_409_CONFLICT)
