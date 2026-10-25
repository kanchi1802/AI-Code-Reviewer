from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message},
            headers=headers,
        )


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=message,
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message=message,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            message=message,
        )


class ValidationException(AppException):
    def __init__(self, message: str = "Validation failed", code: str = "VALIDATION_ERROR"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code=code,
            message=message,
        )


class BadRequestException(AppException):
    def __init__(self, message: str, code: str = "BAD_REQUEST"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code=code,
            message=message,
        )


class AIProviderException(AppException):
    def __init__(self, message: str = "AI service error", code: str = "AI_SERVICE_ERROR"):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            code=code,
            message=message,
        )


class GitHubException(AppException):
    def __init__(self, message: str = "GitHub integration error", code: str = "GITHUB_ERROR", status_code: int = status.HTTP_502_BAD_GATEWAY):
        super().__init__(
            status_code=status_code,
            code=code,
            message=message,
        )
