import pytest
from app.ai.mock_provider import MockAIProvider
from app.ai.schemas import AIReviewFinding, AIReviewResult


@pytest.mark.asyncio
async def test_mock_provider_pattern_detection():
    provider = MockAIProvider()

    # Code containing division by zero and SQL injection
    vulnerable_code = """def get_user_data(user_id, divisor):
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    val = 100 / divisor
    return query, val
"""
    result: AIReviewResult = await provider.analyze_code(
        code_or_diff=vulnerable_code,
        language="python",
        requested_categories=["bug", "security"]
    )

    assert len(result.findings) >= 2
    categories = [f.category for f in result.findings]
    assert "bug" in categories
    assert "security" in categories

    # Verify line numbers are grounded
    for finding in result.findings:
        assert finding.start_line is not None
        assert finding.start_line >= 1
        assert finding.suggested_fix is not None


def test_ai_schema_validation():
    raw_dict = {
        "summary": "Solid code with one minor issue.",
        "findings": [
            {
                "category": "performance",
                "severity": "medium",
                "title": "N+1 database query",
                "description": "Loop iterates over items issuing queries one by one.",
                "file_path": "service.py",
                "start_line": 10,
                "end_line": 15,
                "code_snippet": "for item in items:\n    db.query(item)",
                "recommendation": "Use batch query with IN clause or JOIN.",
                "suggested_fix": "db.query().filter(Item.id.in_(item_ids))",
                "confidence": 0.95
            }
        ]
    }

    result = AIReviewResult.model_validate(raw_dict)
    assert result.summary.startswith("Solid code")
    assert len(result.findings) == 1
    assert result.findings[0].severity == "medium"
    assert result.findings[0].confidence == 0.95
