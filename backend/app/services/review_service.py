import math
import re
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai import get_ai_provider
from app.ai.schemas import AIReviewResult
from app.core.config import settings
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.finding import Finding
from app.models.review import Review
from app.repositories.review_repository import ReviewRepository
from app.schemas.review import (
    GitHubReviewRequest,
    PastedCodeReviewRequest,
    ReviewListResponse,
    ReviewResponse,
    ReviewStatus,
)
from app.services.github_service import GitHubService


class ReviewService:
    def __init__(
        self,
        repo: ReviewRepository | None = None,
        github_svc: GitHubService | None = None
    ):
        self.repo = repo or ReviewRepository()
        self.github_svc = github_svc or GitHubService()

    @staticmethod
    def _detect_language(code: str) -> str:
        """Heuristic language detection as a convenience."""
        snippet = code[:1000]
        if re.search(r"\bdef\s+\w+\s*\(.*?\):|\bimport\s+\w+|\bfrom\s+\w+\s+import", snippet):
            return "python"
        elif re.search(r"\binterface\s+\w+|\btype\s+\w+\s*=|:\s*(string|number|boolean)\b", snippet):
            return "typescript"
        elif re.search(r"\bconst\s+\w+\s*=\s*\(|\bconsole\.log\(|\bfunction\s+\w+", snippet):
            return "javascript"
        elif re.search(r"<\s*(!DOCTYPE|html|div|span|h[1-6])", snippet, re.IGNORECASE):
            return "html"
        elif re.search(r"\bfn\s+main\s*\(|\blet\s+mut\b|\bimpl\s+\w+", snippet):
            return "rust"
        elif re.search(r"\bfunc\s+\w+\s*\(|\bpackage\s+main\b", snippet):
            return "go"
        elif re.search(r"\bpublic\s+class\s+\w+|\bSystem\.out\.println", snippet):
            return "java"
        elif re.search(r"\bnamespace\s+\w+|\busing\s+System;", snippet):
            return "csharp"
        return "plaintext"

    async def create_pasted_review(
        self,
        db: AsyncSession,
        user_id: str,
        request: PastedCodeReviewRequest
    ) -> Review:
        """Analyze pasted source code and persist review and findings."""
        code_bytes = len(request.code.encode("utf-8"))
        if code_bytes > settings.MAX_CODE_SIZE_BYTES:
            raise BadRequestException(
                f"Source code exceeds maximum allowed size of {settings.MAX_CODE_SIZE_BYTES // 1000} KB.",
                code="CODE_TOO_LARGE"
            )

        if not request.code.strip():
            raise BadRequestException("Source code cannot be empty.", code="EMPTY_CODE")

        language = request.language
        if not language or language == "auto":
            language = self._detect_language(request.code)

        title = request.title or f"{language.capitalize()} Code Review"
        ai_provider = get_ai_provider()

        # Initialize review record
        review = Review(
            user_id=user_id,
            source_type="pasted_code",
            title=title,
            language=language,
            source_code=request.code if settings.STORE_SOURCE_CODE else None,
            status="processing",
            model_provider=ai_provider.provider_name,
            model_name=ai_provider.model_name,
        )
        db.add(review)
        await db.commit()
        await db.refresh(review)

        try:
            category_names = [c.value for c in request.categories]
            ai_result: AIReviewResult = await ai_provider.analyze_code(
                code_or_diff=request.code,
                language=language,
                requested_categories=category_names,
                context={"depth": request.depth.value}
            )

            # Process findings and tally severities
            crit = high = med = low = info = 0
            findings_objs = []
            for f in ai_result.findings:
                sev = f.severity.lower()
                if sev == "critical":
                    crit += 1
                elif sev == "high":
                    high += 1
                elif sev == "medium":
                    med += 1
                elif sev == "low":
                    low += 1
                else:
                    sev = "info"
                    info += 1

                cat = f.category.lower()
                if cat not in ("bug", "security", "performance", "maintainability"):
                    cat = "maintainability"

                finding_obj = Finding(
                    review_id=review.id,
                    category=cat,
                    severity=sev,
                    title=f.title[:255],
                    description=f.description,
                    file_path=f.file_path,
                    start_line=f.start_line,
                    end_line=f.end_line,
                    code_snippet=f.code_snippet,
                    recommendation=f.recommendation,
                    suggested_fix=f.suggested_fix,
                    confidence=f.confidence,
                )
                findings_objs.append(finding_obj)

            review.review_summary = ai_result.summary
            review.total_findings = len(findings_objs)
            review.critical_count = crit
            review.high_count = high
            review.medium_count = med
            review.low_count = low
            review.info_count = info
            review.status = "completed"
            review.completed_at = datetime.now(timezone.utc)

            for f_obj in findings_objs:
                db.add(f_obj)

            await db.commit()
            await db.refresh(review)
            return review

        except Exception as e:
            review.status = "failed"
            review.error_message = str(e)
            await db.commit()
            await db.refresh(review)
            raise e

    async def create_github_review(
        self,
        db: AsyncSession,
        user_id: str,
        request: GitHubReviewRequest
    ) -> Review:
        """Fetch GitHub Pull Request diff and run AI review."""
        diff_bundle = await self.github_svc.get_pr_diff_bundle(request.pull_request_url)
        ai_provider = get_ai_provider()

        title = request.title or f"{diff_bundle['owner']}/{diff_bundle['repo']} PR #{diff_bundle['pr_number']}: {diff_bundle['title']}"

        review = Review(
            user_id=user_id,
            source_type="github_pr",
            title=title[:255],
            language="multi",
            source_code=diff_bundle["diff_text"] if settings.STORE_SOURCE_CODE else None,
            repository_owner=diff_bundle["owner"],
            repository_name=diff_bundle["repo"],
            pull_request_number=diff_bundle["pr_number"],
            pull_request_url=request.pull_request_url,
            status="processing",
            model_provider=ai_provider.provider_name,
            model_name=ai_provider.model_name,
        )
        db.add(review)
        await db.commit()
        await db.refresh(review)

        try:
            category_names = [c.value for c in request.categories]
            ai_result: AIReviewResult = await ai_provider.analyze_code(
                code_or_diff=diff_bundle["diff_text"],
                language="git-diff",
                requested_categories=category_names,
                context={
                    "repo": f"{diff_bundle['owner']}/{diff_bundle['repo']}",
                    "pr_number": diff_bundle["pr_number"],
                    "pr_title": diff_bundle["title"],
                    "depth": request.depth.value,
                }
            )

            crit = high = med = low = info = 0
            findings_objs = []
            for f in ai_result.findings:
                sev = f.severity.lower()
                if sev == "critical":
                    crit += 1
                elif sev == "high":
                    high += 1
                elif sev == "medium":
                    med += 1
                elif sev == "low":
                    low += 1
                else:
                    sev = "info"
                    info += 1

                cat = f.category.lower()
                if cat not in ("bug", "security", "performance", "maintainability"):
                    cat = "maintainability"

                finding_obj = Finding(
                    review_id=review.id,
                    category=cat,
                    severity=sev,
                    title=f.title[:255],
                    description=f.description,
                    file_path=f.file_path,
                    start_line=f.start_line,
                    end_line=f.end_line,
                    code_snippet=f.code_snippet,
                    recommendation=f.recommendation,
                    suggested_fix=f.suggested_fix,
                    confidence=f.confidence,
                )
                findings_objs.append(finding_obj)

            review.review_summary = ai_result.summary
            review.total_findings = len(findings_objs)
            review.critical_count = crit
            review.high_count = high
            review.medium_count = med
            review.low_count = low
            review.info_count = info
            review.status = "completed"
            review.completed_at = datetime.now(timezone.utc)

            for f_obj in findings_objs:
                db.add(f_obj)

            await db.commit()
            await db.refresh(review)
            return review

        except Exception as e:
            review.status = "failed"
            review.error_message = str(e)
            await db.commit()
            await db.refresh(review)
            raise e

    async def get_review(self, db: AsyncSession, user_id: str, review_id: str) -> Review:
        """Fetch a single review by id with ownership enforcement."""
        review = await self.repo.get_by_id(db, review_id=review_id)
        if not review:
            raise NotFoundException("Review not found.")
        if review.user_id != user_id:
            raise ForbiddenException("You do not have permission to access this review.")
        return review

    async def list_reviews(
        self,
        db: AsyncSession,
        user_id: str,
        page: int = 1,
        page_size: int = 10,
        source_type: Optional[str] = None,
        status: Optional[str] = None,
    ) -> ReviewListResponse:
        """List reviews with pagination and filtering for the authenticated user."""
        skip = (page - 1) * page_size
        items, total = await self.repo.list_reviews(
            db=db,
            user_id=user_id,
            skip=skip,
            limit=page_size,
            source_type=source_type,
            status=status,
        )
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        return ReviewListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def delete_review(self, db: AsyncSession, user_id: str, review_id: str) -> None:
        """Delete a review with strict ownership check."""
        review = await self.get_review(db, user_id=user_id, review_id=review_id)
        await self.repo.delete(db, review)
