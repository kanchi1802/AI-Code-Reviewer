import json
from typing import Any, Dict, List, Optional
import httpx
from pydantic import ValidationError
from app.ai.base import BaseAIProvider
from app.ai.prompts import SYSTEM_REVIEW_PROMPT, build_review_user_prompt
from app.ai.schemas import AIReviewResult
from app.core.config import settings
from app.core.exceptions import AIProviderException


class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or settings.GEMINI_API_KEY
        self._model = model or settings.GEMINI_MODEL

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self._model

    async def analyze_code(
        self,
        code_or_diff: str,
        language: Optional[str] = None,
        requested_categories: Optional[List[str]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> AIReviewResult:
        if not self._api_key:
            raise AIProviderException(
                message="Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.",
                code="AI_CONFIG_ERROR"
            )

        user_prompt = build_review_user_prompt(
            code_or_diff=code_or_diff,
            language=language,
            categories=requested_categories,
            context=context
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self._model}:generateContent?key={self._api_key}"
        payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_REVIEW_PROMPT}]
            },
            "contents": [
                {
                    "parts": [{"text": user_prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, json=payload)
                if response.status_code == 400:
                    raise AIProviderException(f"Gemini API Bad Request: {response.text}", code="AI_BAD_REQUEST")
                elif response.status_code == 401 or response.status_code == 403:
                    raise AIProviderException("Gemini API authentication failed. Check your API key.", code="AI_AUTH_ERROR")
                elif response.status_code == 429:
                    raise AIProviderException("Gemini rate limit exceeded.", code="AI_RATE_LIMIT")
                elif response.status_code >= 500:
                    raise AIProviderException("Gemini server error.", code="AI_NETWORK_ERROR")

                data = response.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed_json = json.loads(text_content)
                return AIReviewResult.model_validate(parsed_json)

            except httpx.TimeoutException as e:
                raise AIProviderException("Gemini request timed out.", code="AI_TIMEOUT") from e
            except (KeyError, IndexError, json.JSONDecodeError, ValidationError) as e:
                raise AIProviderException(f"Failed to parse Gemini structured response: {str(e)}", code="AI_PARSING_ERROR") from e
