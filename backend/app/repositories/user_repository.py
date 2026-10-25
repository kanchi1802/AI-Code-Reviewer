from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.auth import UserRegister


class UserRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        normalized_email = email.strip().lower()
        result = await db.execute(select(User).where(User.email == normalized_email))
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, user_in: UserRegister) -> User:
        user = User(
            name=user_in.name.strip(),
            email=user_in.email.strip().lower(),
            password_hash=get_password_hash(user_in.password),
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
