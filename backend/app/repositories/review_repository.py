from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import case, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.finding import Finding
from app.models.review import Review


class ReviewRepository:
    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        review_id: str,
        user_id: Optional[str] = None
    ) -> Optional[Review]:
        query = select(Review).options(selectinload(Review.findings)).where(Review.id == review_id)
        if user_id:
            query = query.where(Review.user_id == user_id)
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def list_reviews(
        db: AsyncSession,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        source_type: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[Review], int]:
        # Count query
        count_query = select(func.count(Review.id)).where(Review.user_id == user_id)
        if source_type:
            count_query = count_query.where(Review.source_type == source_type)
        if status:
            count_query = count_query.where(Review.status == status)

        total_res = await db.execute(count_query)
        total = total_res.scalar() or 0

        # Items query
        query = (
            select(Review)
            .options(selectinload(Review.findings))
            .where(Review.user_id == user_id)
            .order_by(Review.created_at.desc())
        )
        if source_type:
            query = query.where(Review.source_type == source_type)
        if status:
            query = query.where(Review.status == status)

        query = query.offset(skip).limit(limit)
        items_res = await db.execute(query)
        items = list(items_res.scalars().all())

        return items, total

    @staticmethod
    async def create(db: AsyncSession, review: Review) -> Review:
        db.add(review)
        await db.commit()
        await db.refresh(review)
        return review

    @staticmethod
    async def delete(db: AsyncSession, review: Review) -> None:
        await db.delete(review)
        await db.commit()

    @staticmethod
    async def get_dashboard_aggregates(db: AsyncSession, user_id: str) -> Dict[str, Any]:
        # Summary totals
        summary_query = select(
            func.count(Review.id).label("total_reviews"),
            func.coalesce(func.sum(case((Review.status == "completed", 1), else_=0)), 0).label("completed_reviews"),
            func.coalesce(func.sum(case((Review.status == "failed", 1), else_=0)), 0).label("failed_reviews"),
            func.coalesce(func.sum(Review.total_findings), 0).label("total_findings"),
            func.coalesce(func.sum(Review.critical_count), 0).label("critical"),
            func.coalesce(func.sum(Review.high_count), 0).label("high"),
            func.coalesce(func.sum(Review.medium_count), 0).label("medium"),
            func.coalesce(func.sum(Review.low_count), 0).label("low"),
            func.coalesce(func.sum(Review.info_count), 0).label("info"),
        ).where(Review.user_id == user_id)

        res = await db.execute(summary_query)
        row = res.first()

        # Category breakdown from findings table
        cat_query = (
            select(Finding.category, func.count(Finding.id))
            .join(Review, Finding.review_id == Review.id)
            .where(Review.user_id == user_id)
            .group_by(Finding.category)
        )
        cat_res = await db.execute(cat_query)
        category_breakdown = {cat: count for cat, count in cat_res.all()}

        # Recent 5 reviews
        recent_query = (
            select(Review)
            .where(Review.user_id == user_id)
            .order_by(Review.created_at.desc())
            .limit(5)
        )
        recent_res = await db.execute(recent_query)
        recent_reviews = list(recent_res.scalars().all())

        return {
            "total_reviews": row.total_reviews if row else 0,
            "completed_reviews": row.completed_reviews if row else 0,
            "failed_reviews": row.failed_reviews if row else 0,
            "total_findings": row.total_findings if row else 0,
            "severity_breakdown": {
                "critical": row.critical if row else 0,
                "high": row.high if row else 0,
                "medium": row.medium if row else 0,
                "low": row.low if row else 0,
                "info": row.info if row else 0,
            },
            "category_breakdown": category_breakdown,
            "recent_reviews": recent_reviews,
        }
