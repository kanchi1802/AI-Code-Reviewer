from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class FindingCategory(str, Enum):
    BUG = "bug"
    SECURITY = "security"
    PERFORMANCE = "performance"
    MAINTAINABILITY = "maintainability"


class FindingSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class FindingBase(BaseModel):
    category: FindingCategory
    severity: FindingSeverity
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    file_path: Optional[str] = Field(None, max_length=500)
    start_line: Optional[int] = Field(None, ge=1)
    end_line: Optional[int] = Field(None, ge=1)
    code_snippet: Optional[str] = None
    recommendation: str = Field(..., min_length=5)
    suggested_fix: Optional[str] = None
    confidence: float = Field(0.9, ge=0.0, le=1.0)

    @field_validator("end_line")
    @classmethod
    def validate_line_range(cls, v: Optional[int], info) -> Optional[int]:
        start = info.data.get("start_line")
        if start is not None and v is not None and v < start:
            # If end_line is less than start_line, align with start_line
            return start
        return v


class FindingCreate(FindingBase):
    pass


class FindingResponse(FindingBase):
    id: str
    review_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
