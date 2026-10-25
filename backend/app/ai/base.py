from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from app.ai.schemas import AIReviewResult


class BaseAIProvider(ABC):
    """Abstract Base Class for AI Code Review Providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g. 'openai', 'gemini', 'mock')."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Name of the model (e.g. 'gpt-4o-mini', 'gemini-1.5-flash')."""
        pass

    @abstractmethod
    async def analyze_code(
        self,
        code_or_diff: str,
        language: Optional[str] = None,
        requested_categories: Optional[List[str]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> AIReviewResult:
        """Analyze code or diff and return validated AIReviewResult."""
        pass
