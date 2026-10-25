from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, HttpUrl
from app.schemas.finding import FindingCategory, FindingResponse


class ReviewSourceType(str, Enum):
    PASTED_CODE = "pasted_code"
    GITHUB_PR = "github_pr"


class ReviewStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ReviewDepth(str, Enum):
    STANDARD = "standard"
    DEEP = "deep"


class PastedCodeReviewRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=100_000, description="Source code snippet to review")
    language: Optional[str] = Field("auto", max_length=50, description="Programming language or auto")
    title: Optional[str] = Field(None, max_length=255, description="Optional title for the review")
    categories: List[FindingCategory] = Field(
        default=[FindingCategory.BUG, FindingCategory.SECURITY, FindingCategory.PERFORMANCE, FindingCategory.MAINTAINABILITY],
        description="Categories to analyze"
    )
    depth: ReviewDepth = Field(ReviewDepth.STANDARD, description="Analysis depth setting")


class GitHubReviewRequest(BaseModel):
    pull_request_url: str = Field(..., max_length=500, description="GitHub pull request URL, e.g. https://github.com/owner/repo/pull/123")
    title: Optional[str] = Field(None, max_length=255, description="Optional custom title for the review")
    categories: List[FindingCategory] = Field(
        default=[FindingCategory.BUG, FindingCategory.SECURITY, FindingCategory.PERFORMANCE, FindingCategory.MAINTAINABILITY],
        description="Categories to analyze"
    )
    depth: ReviewDepth = Field(ReviewDepth.STANDARD, description="Analysis depth setting")


class ReviewListItem(BaseModel):
    id: str
    user_id: str
    source_type: ReviewSourceType
    title: Optional[str]
    language: Optional[str]
    repository_owner: Optional[str]
    repository_name: Optional[str]
    pull_request_number: Optional[int]
    pull_request_url: Optional[str]
    status: ReviewStatus
    model_provider: str
    model_name: str
    review_summary: Optional[str]
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ReviewResponse(ReviewListItem):
    source_code: Optional[str] = None
    error_message: Optional[str] = None
    findings: List[FindingResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ReviewListResponse(BaseModel):
    items: List[ReviewListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
