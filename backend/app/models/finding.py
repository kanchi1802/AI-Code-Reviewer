import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    review_id = Column(String(36), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)

    category = Column(String(30), nullable=False)  # bug, security, performance, maintainability
    severity = Column(String(20), nullable=False)  # critical, high, medium, low, info
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    file_path = Column(String(500), nullable=True)
    start_line = Column(Integer, nullable=True)
    end_line = Column(Integer, nullable=True)
    code_snippet = Column(Text, nullable=True)

    recommendation = Column(Text, nullable=False)
    suggested_fix = Column(Text, nullable=True)
    confidence = Column(Float, default=0.9, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    review = relationship("Review", back_populates="findings")
