import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch
from app.core.exceptions import BadRequestException
from app.services.github_service import GitHubService


def test_parse_pr_url_valid():
    owner, repo, pr_num = GitHubService.parse_pr_url("https://github.com/fastapi/fastapi/pull/1234")
    assert owner == "fastapi"
    assert repo == "fastapi"
    assert pr_num == 1234

    owner2, repo2, pr_num2 = GitHubService.parse_pr_url("http://github.com/facebook/react/pull/999/files")
    assert owner2 == "facebook"
    assert repo2 == "react"
    assert pr_num2 == 999


def test_parse_pr_url_invalid():
    with pytest.raises(BadRequestException):
        GitHubService.parse_pr_url("https://malicious.com/owner/repo/pull/123")

    with pytest.raises(BadRequestException):
        GitHubService.parse_pr_url("ftp://github.com/owner/repo/pull/123")

    with pytest.raises(BadRequestException):
        GitHubService.parse_pr_url("https://github.com/not-a-pr")


@pytest.mark.asyncio
async def test_create_github_review_with_mock_github(client: AsyncClient, auth_headers):
    mock_bundle = {
        "owner": "testowner",
        "repo": "testrepo",
        "pr_number": 42,
        "title": "Add divide helper",
        "author": "octocat",
        "state": "open",
        "changed_files_count": 1,
        "files": ["math_helper.py"],
        "diff_text": """### File: math_helper.py (modified)
```diff
@@ -1,3 +1,4 @@
 def divide(a, b):
+    return a / b
```
"""
    }

    with patch("app.services.github_service.GitHubService.get_pr_diff_bundle", new_callable=AsyncMock) as mock_get_bundle:
        mock_get_bundle.return_value = mock_bundle

        response = await client.post(
            "/api/v1/reviews/github",
            headers=auth_headers,
            json={
                "pull_request_url": "https://github.com/testowner/testrepo/pull/42",
                "categories": ["bug", "security"]
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["source_type"] == "github_pr"
        assert data["repository_owner"] == "testowner"
        assert data["repository_name"] == "testrepo"
        assert data["pull_request_number"] == 42
        assert data["status"] == "completed"
        assert data["total_findings"] >= 1
