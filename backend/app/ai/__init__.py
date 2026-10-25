from app.ai.base import BaseAIProvider
from app.ai.openai_provider import OpenAIProvider
from app.ai.gemini_provider import GeminiProvider
from app.ai.mock_provider import MockAIProvider
from app.core.config import settings
from app.core.exceptions import AIProviderException


def get_ai_provider(provider_override: str | None = None) -> BaseAIProvider:
    """Factory to get the configured AI provider."""
    provider_name = (provider_override or settings.AI_PROVIDER).lower()

    if provider_name == "openai":
        return OpenAIProvider()
    elif provider_name == "gemini":
        return GeminiProvider()
    elif provider_name == "mock":
        return MockAIProvider()
    else:
        raise AIProviderException(
            message=f"Unsupported AI provider: '{provider_name}'. Supported providers: openai, gemini, mock",
            code="UNSUPPORTED_PROVIDER"
        )


__all__ = ["BaseAIProvider", "OpenAIProvider", "GeminiProvider", "MockAIProvider", "get_ai_provider"]
