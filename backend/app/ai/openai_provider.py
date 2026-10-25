import json
from typing import Any, Dict, List, Optional
import openai
from pydantic import ValidationError
from app.ai.base import BaseAIProvider
from app.ai.prompts import SYSTEM_REVIEW_PROMPT, build_review_user_prompt
from app.ai.schemas import AIReviewResult
from app.core.config import settings
from app.core.exceptions import AIProviderException


class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or settings.OPENAI_API_KEY
        self._model = model or settings.OPENAI_MODEL

    @property
    def provider_name(self) -> str:
        return "openai"

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
                message="OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment.",
                code="AI_CONFIG_ERROR"
            )

        client = openai.AsyncOpenAI(api_key=self._api_key, timeout=60.0)
        user_prompt = build_review_user_prompt(
            code_or_diff=code_or_diff,
            language=language,
            categories=requested_categories,
            context=context
        )

        try:
            response = await client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": SYSTEM_REVIEW_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )

            content = response.choices[0].message.content
            if not content:
                raise AIProviderException("Empty response received from OpenAI.", code="AI_EMPTY_RESPONSE")

            data = json.loads(content)
            return AIReviewResult.model_validate(data)

        except openai.AuthenticationError as e:
            raise AIProviderException("OpenAI authentication failed. Check your API key.", code="AI_AUTH_ERROR") from e
        except openai.RateLimitError as e:
            raise AIProviderException("OpenAI rate limit exceeded. Please try again shortly.", code="AI_RATE_LIMIT") from e
        except openai.APITimeoutError as e:
            raise AIProviderException("OpenAI request timed out.", code="AI_TIMEOUT") from e
        except openai.APIConnectionError as e:
            raise AIProviderException("Failed to connect to OpenAI API.", code="AI_NETWORK_ERROR") from e
        except (json.JSONDecodeError, ValidationError) as e:
            raise AIProviderException(f"Failed to parse structured review output: {str(e)}", code="AI_PARSING_ERROR") from e
        except Exception as e:
            raise AIProviderException(f"OpenAI analysis failed: {str(e)}", code="AI_UNKNOWN_ERROR") from e
