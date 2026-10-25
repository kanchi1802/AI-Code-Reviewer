from typing import List, Optional
from pydantic import BaseModel, Field


class AIReviewFinding(BaseModel):
    category: str = Field(..., description="One of: bug, security, performance, maintainability")
    severity: str = Field(..., description="One of: critical, high, medium, low, info")
    title: str = Field(..., description="Brief, punchy title describing the issue")
    description: str = Field(..., description="Clear explanation of the problem, condition under which it occurs, and potential impact")
    file_path: Optional[str] = Field(None, description="File path if known or relevant, otherwise null")
    start_line: Optional[int] = Field(None, description="1-indexed line number where the issue begins (must be real, or null)")
    end_line: Optional[int] = Field(None, description="1-indexed line number where the issue ends (or null)")
    code_snippet: Optional[str] = Field(None, description="Exact problematic code snippet from the analyzed text")
    recommendation: str = Field(..., description="Actionable recommendation explaining how to resolve or prevent the issue")
    suggested_fix: Optional[str] = Field(None, description="Complete, copy-pasteable replacement code or patch")
    confidence: float = Field(0.9, ge=0.0, le=1.0, description="Estimated confidence score between 0.0 and 1.0")


class AIReviewResult(BaseModel):
    summary: str = Field(..., description="High-level executive summary of code quality, critical risks, and general findings")
    findings: List[AIReviewFinding] = Field(default_factory=list, description="List of structured findings")
