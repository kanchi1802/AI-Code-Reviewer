import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "SecurePassword123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alice Tester"
    assert data["email"] == "alice@example.com"
    assert "id" in data
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/register",
        json={"name": "Duplicate Tester", "email": test_user.email, "password": "SecurePassword123"}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["code"] == "EMAIL_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_register_short_password(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"name": "Short Pass", "email": "short@example.com", "password": "123"}
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "engineer@test.com", "password": "Password123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "engineer@test.com"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "engineer@test.com", "password": "WrongPassword!"}
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient, auth_headers):
    response = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "engineer@test.com"


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
