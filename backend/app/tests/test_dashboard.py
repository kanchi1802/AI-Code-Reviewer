import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_summary_aggregates(client: AsyncClient, auth_headers):
    # Submit review with a security bug
    code_snippet = """# Config
api_key = "secret_key_12345678"
"""
    await client.post(
        "/api/v1/reviews",
        headers=auth_headers,
        json={"code": code_snippet, "language": "python"}
    )

    response = await client.get("/api/v1/dashboard/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["total_reviews"] >= 1
    assert data["completed_reviews"] >= 1
    assert data["total_findings"] >= 1
    assert "critical" in data["severity_breakdown"]
    assert len(data["recent_reviews"]) >= 1
