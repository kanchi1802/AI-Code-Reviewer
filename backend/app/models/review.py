import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    source_type = Column(String(30), nullable=False)  # "pasted_code" | "github_pr"
    title = Column(String(255), nullable=True)
    language = Column(String(50), nullable=True)
    source_code = Column(Text, nullable=True)  # nullable based on retention policy

    # GitHub PR specific metadata
    repository_owner = Column(String(100), nullable=True)
    repository_name = Column(String(100), nullable=True)
    pull_request_number = Column(Integer, nullable=True)
    pull_request_url = Column(String(500), nullable=True)

    # Status & Provider metadata
    status = Column(String(20), default="pending", nullable=False)  # pending, processing, completed, failed
    model_provider = Column(String(50), nullable=False)  # openai, gemini, mock
    model_name = Column(String(50), nullable=False)

    # Result Summary & Counts
    review_summary = Column(Text, nullable=True)
    total_findings = Column(Integer, default=0, nullable=False)
    critical_count = Column(Integer, default=0, nullable=False)
    high_count = Column(Integer, default=0, nullable=False)
    medium_count = Column(Integer, default=0, nullable=False)
    low_count = Column(Integer, default=0, nullable=False)
    info_count = Column(Integer, default=0, nullable=False)

    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="reviews")
    findings = relationship("Finding", back_populates="review", cascade="all, delete-orphan", lazy="selectin")
