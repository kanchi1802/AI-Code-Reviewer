import re
from typing import Any, Dict, List, Optional
from app.ai.base import BaseAIProvider
from app.ai.schemas import AIReviewFinding, AIReviewResult


class MockAIProvider(BaseAIProvider):
    """Deterministic Mock AI Provider for automated tests and CI environments."""

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return "mock-reviewer-v1"

    async def analyze_code(
        self,
        code_or_diff: str,
        language: Optional[str] = None,
        requested_categories: Optional[List[str]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> AIReviewResult:
        findings: List[AIReviewFinding] = []
        cats = requested_categories or ["bug", "security", "performance", "maintainability"]

        lines = code_or_diff.splitlines()

        for idx, line in enumerate(lines, start=1):
            # Check for division by variable or literal zero
            if "bug" in cats and re.search(r"/\s*([a-zA-Z_]\w*|0)\b", line):
                findings.append(
                    AIReviewFinding(
                        category="bug",
                        severity="high",
                        title="Potential division by zero unhandled",
                        description=f"At line {idx}, division by variable without verifying it is non-zero can trigger ZeroDivisionError.",
                        file_path="snippet.py",
                        start_line=idx,
                        end_line=idx,
                        code_snippet=line.strip(),
                        recommendation="Validate denominator before division or handle ZeroDivisionError.",
                        suggested_fix="if b == 0:\n    raise ValueError('Denominator cannot be zero')\nreturn a / b",
                        confidence=0.95
                    )
                )

            # Check for SQL injection pattern
            if "security" in cats and re.search(r"f[\"'].*(SELECT|UPDATE|DELETE|INSERT).*\{|execute\(.*\%s.*\%", line, re.IGNORECASE):
                findings.append(
                    AIReviewFinding(
                        category="security",
                        severity="critical",
                        title="SQL Injection Vulnerability",
                        description=f"At line {idx}, raw SQL query string interpolation exposes database to injection.",
                        file_path="query.py",
                        start_line=idx,
                        end_line=idx,
                        code_snippet=line.strip(),
                        recommendation="Use parameterized queries or ORM bindings instead of formatted strings.",
                        suggested_fix="cursor.execute('UPDATE accounts SET balance = balance - :amount WHERE id = :id', {'amount': amount, 'id': account_id})",
                        confidence=0.98
                    )
                )

            # Check for hardcoded secret
            if "security" in cats and re.search(r"(secret|password|api_key|api_token|token)\s*=\s*['\"][a-zA-Z0-9_\-]{8,}['\"]", line, re.IGNORECASE):
                findings.append(
                    AIReviewFinding(
                        category="security",
                        severity="critical",
                        title="Hardcoded credential or secret detected",
                        description=f"Sensitive secret identified directly in source at line {idx}.",
                        file_path="config.py",
                        start_line=idx,
                        end_line=idx,
                        code_snippet=line.strip(),
                        recommendation="Load secrets from environment variables or a secrets manager.",
                        suggested_fix="import os\napi_token = os.getenv('API_TOKEN')",
                        confidence=0.99
                    )
                )

            # Check for bare except / broad exception
            if "maintainability" in cats and re.search(r"except\s*:", line):
                findings.append(
                    AIReviewFinding(
                        category="maintainability",
                        severity="medium",
                        title="Bare except clause catches SystemExit and KeyboardInterrupt",
                        description=f"Bare except on line {idx} swallows critical system signals.",
                        file_path="handler.py",
                        start_line=idx,
                        end_line=idx,
                        code_snippet=line.strip(),
                        recommendation="Catch specific exceptions like Exception or custom errors.",
                        suggested_fix="except Exception as exc:\n    logger.error('Operation failed: %s', exc)",
                        confidence=0.92
                    )
                )

        if not findings:
            summary = "Analysis complete. No critical bugs, security vulnerabilities, or performance bottlenecks identified."
        else:
            summary = f"Review completed with {len(findings)} finding(s) requiring attention across the analyzed categories."

        return AIReviewResult(summary=summary, findings=findings)
