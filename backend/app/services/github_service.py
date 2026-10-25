import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse
import httpx
from app.core.config import settings
from app.core.exceptions import BadRequestException, GitHubException


class GitHubService:
    def __init__(self, token: Optional[str] = None):
        self._token = token or settings.GITHUB_TOKEN
        self._api_url = settings.GITHUB_API_URL.rstrip("/")
        self._timeout = settings.GITHUB_TIMEOUT_SECONDS

    @staticmethod
    def parse_pr_url(url: str) -> Tuple[str, str, int]:
        """
        Parse and validate a GitHub pull request URL.
        Example: https://github.com/owner/repo/pull/123
        Returns: (owner, repo, pull_number)
        """
        if not url or not isinstance(url, str):
            raise BadRequestException("GitHub PR URL must be provided.", code="INVALID_URL")

        parsed = urlparse(url.strip())
        if parsed.scheme not in ("http", "https"):
            raise BadRequestException("Invalid URL scheme. Must be http or https.", code="INVALID_URL_SCHEME")

        hostname = (parsed.hostname or "").lower()
        if hostname not in ("github.com", "www.github.com"):
            raise BadRequestException("Only github.com URLs are supported.", code="INVALID_GITHUB_HOST")

        # Match /owner/repo/pull/123
        pattern = r"^/([a-zA-Z0-9_\-\.]+)/([a-zA-Z0-9_\-\.]+)/pull/([0-9]+)(?:/.*)?$"
        match = re.match(pattern, parsed.path)
        if not match:
            raise BadRequestException(
                "Invalid GitHub PR URL format. Expected: https://github.com/owner/repository/pull/123",
                code="INVALID_PR_URL_FORMAT"
            )

        owner, repo, pr_num_str = match.groups()
        return owner, repo, int(pr_num_str)

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AICodeReviewer/1.0",
        }
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        return headers

    async def fetch_pr_details(self, owner: str, repo: str, pull_number: int) -> Dict[str, Any]:
        """Fetch Pull Request metadata from GitHub API."""
        url = f"{self._api_url}/repos/{owner}/{repo}/pulls/{pull_number}"
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            try:
                response = await client.get(url, headers=self._get_headers())
                if response.status_code == 404:
                    raise GitHubException(
                        f"Pull request #{pull_number} not found on repository {owner}/{repo}. "
                        "If this is a private repository, ensure a valid GITHUB_TOKEN is configured.",
                        code="PR_NOT_FOUND",
                        status_code=404
                    )
                elif response.status_code == 403 or response.status_code == 429:
                    raise GitHubException(
                        "GitHub API rate limit exceeded or access forbidden. Please check your credentials or try again later.",
                        code="GITHUB_RATE_LIMIT",
                        status_code=429
                    )
                elif response.status_code >= 400:
                    raise GitHubException(
                        f"GitHub API error: {response.status_code} - {response.text[:200]}",
                        code="GITHUB_API_ERROR"
                    )

                return response.json()

            except httpx.TimeoutException as e:
                raise GitHubException("GitHub request timed out.", code="GITHUB_TIMEOUT") from e
            except httpx.RequestError as e:
                raise GitHubException(f"Network error communicating with GitHub: {str(e)}", code="GITHUB_NETWORK_ERROR") from e

    async def fetch_pr_files(self, owner: str, repo: str, pull_number: int) -> List[Dict[str, Any]]:
        """Fetch list of changed files and their patch/diff data from GitHub API."""
        url = f"{self._api_url}/repos/{owner}/{repo}/pulls/{pull_number}/files?per_page=100"
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            try:
                response = await client.get(url, headers=self._get_headers())
                if response.status_code != 200:
                    raise GitHubException(
                        f"Failed to fetch PR files: {response.status_code} - {response.text[:200]}",
                        code="GITHUB_FILES_ERROR"
                    )
                return response.json()
            except httpx.TimeoutException as e:
                raise GitHubException("GitHub files request timed out.", code="GITHUB_TIMEOUT") from e
            except httpx.RequestError as e:
                raise GitHubException(f"Network error communicating with GitHub: {str(e)}", code="GITHUB_NETWORK_ERROR") from e

    async def get_pr_diff_bundle(self, pull_request_url: str) -> Dict[str, Any]:
        """
        Validate URL, fetch PR details and files, compile filtered diff bundle.
        """
        owner, repo, pr_num = self.parse_pr_url(pull_request_url)
        pr_info = await self.fetch_pr_details(owner, repo, pr_num)
        files = await self.fetch_pr_files(owner, repo, pr_num)

        total_diff_size = 0
        diff_chunks = []
        analyzed_files = []

        for f in files:
            filename = f.get("filename", "")
            status = f.get("status", "modified")
            patch = f.get("patch", "")

            # Skip binary files or files without patch
            if not patch:
                continue

            # Skip common generated/lock files
            if filename.endswith((".lock", ".min.js", ".min.css", ".map", "-lock.json")):
                continue

            patch_size = len(patch.encode("utf-8"))
            if total_diff_size + patch_size > settings.MAX_DIFF_SIZE_BYTES:
                diff_chunks.append(f"\n--- [Diff truncated: Maximum diff size limit reached ({settings.MAX_DIFF_SIZE_BYTES} bytes)] ---")
                break

            total_diff_size += patch_size
            analyzed_files.append(filename)
            diff_chunks.append(f"### File: {filename} ({status})\n```diff\n{patch}\n```")

        if not diff_chunks:
            raise BadRequestException(
                "No inspectable code changes or diffs found in this pull request (files may be binary, deleted, or lockfiles).",
                code="EMPTY_DIFF"
            )

        combined_diff = "\n\n".join(diff_chunks)

        return {
            "owner": owner,
            "repo": repo,
            "pr_number": pr_num,
            "title": pr_info.get("title", f"Pull Request #{pr_num}"),
            "author": pr_info.get("user", {}).get("login", "unknown"),
            "state": pr_info.get("state", "open"),
            "changed_files_count": len(analyzed_files),
            "files": analyzed_files,
            "diff_text": combined_diff,
        }
