from typing import AsyncGenerator
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Validate Bearer JWT access token and return authenticated User."""
    if not token:
        raise UnauthorizedException("Authentication token is missing.")

    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedException("Invalid or expired authentication token.")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token payload missing subject.")

    user = await UserRepository.get_by_id(db, user_id=user_id)
    if not user:
        raise UnauthorizedException("User associated with this token does not exist.")

    if not user.is_active:
        raise UnauthorizedException("User account is inactive.")

    return user
