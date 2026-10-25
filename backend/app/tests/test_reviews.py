import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_pasted_code_review_success(client: AsyncClient, auth_headers):
    code_snippet = """def divide(a, b):
    return a / b
"""
    response = await client.post(
        "/api/v1/reviews",
        headers=auth_headers,
        json={
            "code": code_snippet,
            "language": "python",
            "title": "Divide function review",
            "categories": ["bug", "security", "performance", "maintainability"]
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "completed"
    assert data["source_type"] == "pasted_code"
    assert data["language"] == "python"
    assert data["total_findings"] >= 1
    assert data["high_count"] >= 1
    assert len(data["findings"]) >= 1

    finding = data["findings"][0]
    assert finding["category"] == "bug"
    assert finding["start_line"] == 2
    assert "b" in finding["suggested_fix"]


@pytest.mark.asyncio
async def test_create_review_empty_code(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/reviews",
        headers=auth_headers,
        json={"code": "   "}
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "EMPTY_CODE"


@pytest.mark.asyncio
async def test_create_review_oversized_code(client: AsyncClient, auth_headers):
    huge_code = "x = 1\n" * 25000  # > 100 KB
    response = await client.post(
        "/api/v1/reviews",
        headers=auth_headers,
        json={"code": huge_code}
    )
    assert response.status_code in (400, 422)


@pytest.mark.asyncio
async def test_review_ownership_isolation(client: AsyncClient, auth_headers, another_auth_headers):
    # User A creates a review
    create_resp = await client.post(
        "/api/v1/reviews",
        headers=auth_headers,
        json={"code": "def test(): return 42", "language": "python"}
    )
    assert create_resp.status_code == 201
    review_id = create_resp.json()["id"]

    # User B attempts to access User A's review
    forbidden_resp = await client.get(
        f"/api/v1/reviews/{review_id}",
        headers=another_auth_headers
    )
    assert forbidden_resp.status_code == 403
    assert forbidden_resp.json()["detail"]["code"] == "FORBIDDEN"

    # User B attempts to delete User A's review
    del_forbidden = await client.delete(
        f"/api/v1/reviews/{review_id}",
        headers=another_auth_headers
    )
    assert del_forbidden.status_code == 403

    # User A successfully retrieves review
    owner_resp = await client.get(
        f"/api/v1/reviews/{review_id}",
        headers=auth_headers
    )
    assert owner_resp.status_code == 200
    assert owner_resp.json()["id"] == review_id

    # User A successfully deletes review
    owner_del = await client.delete(
        f"/api/v1/reviews/{review_id}",
        headers=auth_headers
    )
    assert owner_del.status_code == 204

    # Verification: Review is deleted
    after_del = await client.get(
        f"/api/v1/reviews/{review_id}",
        headers=auth_headers
    )
    assert after_del.status_code == 404


@pytest.mark.asyncio
async def test_list_reviews_pagination(client: AsyncClient, auth_headers):
    # Create 3 reviews
    for i in range(3):
        await client.post(
            "/api/v1/reviews",
            headers=auth_headers,
            json={"code": f"# review {i}\nx = {i}", "title": f"Rev {i}"}
        )

    response = await client.get("/api/v1/reviews?page=1&page_size=2", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] >= 3
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total_pages"] >= 2
