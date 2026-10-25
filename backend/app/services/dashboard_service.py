from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.review_repository import ReviewRepository
from app.schemas.dashboard import DashboardSummaryResponse, SeverityStats


class DashboardService:
    def __init__(self, repo: ReviewRepository | None = None):
        self.repo = repo or ReviewRepository()

    async def get_dashboard_summary(self, db: AsyncSession, user_id: str) -> DashboardSummaryResponse:
        data = await self.repo.get_dashboard_aggregates(db, user_id=user_id)
        return DashboardSummaryResponse(
            total_reviews=data["total_reviews"],
            completed_reviews=data["completed_reviews"],
            failed_reviews=data["failed_reviews"],
            total_findings=data["total_findings"],
            severity_breakdown=SeverityStats(**data["severity_breakdown"]),
            category_breakdown=data["category_breakdown"],
            recent_reviews=data["recent_reviews"],
        )
