from typing import Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserLogin, UserRegister


class AuthService:
    def __init__(self, user_repo: UserRepository | None = None):
        self.user_repo = user_repo or UserRepository()

    async def register(self, db: AsyncSession, user_in: UserRegister) -> User:
        """Register a new user with duplicate email prevention and password hashing."""
        existing = await self.user_repo.get_by_email(db, user_in.email)
        if existing:
            raise BadRequestException(
                "An account with this email address already exists.",
                code="EMAIL_ALREADY_EXISTS"
            )

        user = await self.user_repo.create(db, user_in)
        return user

    async def login(self, db: AsyncSession, login_in: UserLogin) -> Tuple[User, str]:
        """Authenticate user and return user model and signed JWT access token."""
        user = await self.user_repo.get_by_email(db, login_in.email)
        if not user or not verify_password(login_in.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password.")

        if not user.is_active:
            raise UnauthorizedException("Account is disabled. Please contact support.")

        token = create_access_token(
            subject=user.id,
            extra_claims={"email": user.email, "name": user.name}
        )
        return user, token
