from typing import Dict, List
from pydantic import BaseModel
from app.schemas.review import ReviewListItem


class SeverityStats(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0


class DashboardSummaryResponse(BaseModel):
    total_reviews: int
    completed_reviews: int
    failed_reviews: int
    total_findings: int
    severity_breakdown: SeverityStats
    category_breakdown: Dict[str, int]
    recent_reviews: List[ReviewListItem]
