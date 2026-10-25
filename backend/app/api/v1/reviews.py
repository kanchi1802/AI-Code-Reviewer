from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.review import (
    GitHubReviewRequest,
    PastedCodeReviewRequest,
    ReviewListResponse,
    ReviewResponse,
    ReviewSourceType,
    ReviewStatus,
)
from app.services.review_service import ReviewService

router = APIRouter(prefix="/reviews", tags=["Reviews"])
review_service = ReviewService()


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_code_review(
    request: PastedCodeReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit pasted source code for AI-driven review."""
    review = await review_service.create_pasted_review(
        db=db,
        user_id=current_user.id,
        request=request
    )
    return review


@router.post("/github", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_github_pr_review(
    request: GitHubReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a GitHub Pull Request URL for automated PR diff review."""
    review = await review_service.create_github_review(
        db=db,
        user_id=current_user.id,
        request=request
    )
    return review


@router.get("", response_model=ReviewListResponse)
async def list_reviews(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    source_type: Optional[ReviewSourceType] = Query(None, description="Filter by source type"),
    status: Optional[ReviewStatus] = Query(None, description="Filter by review status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve paginated review history for the authenticated user."""
    return await review_service.list_reviews(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        source_type=source_type.value if source_type else None,
        status=status.value if status else None,
    )


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review_detail(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get full review details and associated findings."""
    return await review_service.get_review(
        db=db,
        user_id=current_user.id,
        review_id=review_id
    )


@router.get("/{review_id}/status")
async def get_review_status(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get real-time processing status of a review."""
    review = await review_service.get_review(
        db=db,
        user_id=current_user.id,
        review_id=review_id
    )
    return {
        "id": review.id,
        "status": review.status,
        "total_findings": review.total_findings,
        "completed_at": review.completed_at,
        "error_message": review.error_message,
    }


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a review and its findings (strict ownership enforced)."""
    await review_service.delete_review(
        db=db,
        user_id=current_user.id,
        review_id=review_id
    )
    return None
