from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import TokenResponse, UserLogin, UserRegister, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])
auth_service = AuthService()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user account."""
    user = await auth_service.register(db, user_in)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    login_in: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate and obtain JWT access token."""
    user, access_token = await auth_service.login(db, login_in)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Retrieve profile of the currently authenticated user."""
    return current_user
