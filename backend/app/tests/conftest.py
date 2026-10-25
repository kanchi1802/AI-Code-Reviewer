import asyncio
import os
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserRegister

# Force mock AI provider and test database for tests
settings.AI_PROVIDER = "mock"
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def test_user(db_session: AsyncSession) -> User:
    user_in = UserRegister(
        name="Test Engineer",
        email="engineer@test.com",
        password="Password123!"
    )
    return await UserRepository.create(db_session, user_in)


@pytest_asyncio.fixture(scope="function")
async def auth_headers(client: AsyncClient, test_user: User) -> dict:
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "engineer@test.com", "password": "Password123!"}
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(scope="function")
async def another_user(db_session: AsyncSession) -> User:
    user_in = UserRegister(
        name="Another Developer",
        email="another@test.com",
        password="Password123!"
    )
    return await UserRepository.create(db_session, user_in)


@pytest_asyncio.fixture(scope="function")
async def another_auth_headers(client: AsyncClient, another_user: User) -> dict:
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "another@test.com", "password": "Password123!"}
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
