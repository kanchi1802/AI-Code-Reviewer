import asyncio
from httpx import ASGITransport, AsyncClient
from app.core.config import settings
from app.main import app


async def run_e2e_verification():
    print("🚀 Starting End-to-End Live Verification of AI Code Reviewer...\n")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://127.0.0.1:8000") as client:
        # 1. Health Check
        print("1️⃣ Testing /health endpoint...")
        resp = await client.get("/health")
        assert resp.status_code == 200, f"Health check failed: {resp.text}"
        print(f"   ✅ Health OK: {resp.json()}\n")

        # 2. Registration
        print("2️⃣ Testing User Registration...")
        email = "senior_lead@cloud.io"
        reg_resp = await client.post("/api/v1/auth/register", json={
            "name": "Alex Vance",
            "email": email,
            "password": "SecurePassword2026!"
        })
        if reg_resp.status_code == 400 and "already exists" in reg_resp.text:
            print("   ℹ️ User already registered, proceeding to login.")
        else:
            assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
            print(f"   ✅ Registered: {reg_resp.json()['name']} ({reg_resp.json()['email']})")

        # 3. Login
        print("\n3️⃣ Testing User Login...")
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "SecurePassword2026!"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   ✅ Login successful, JWT access token received.")

        # 4. Profile /me
        print("\n4️⃣ Testing /api/v1/auth/me (Protected Route)...")
        me_resp = await client.get("/api/v1/auth/me", headers=headers)
        assert me_resp.status_code == 200
        print(f"   ✅ Authenticated user profile: {me_resp.json()['name']}\n")

        # 5. Verify Unconfigured Live Provider Behavior (Clear Config Error Requirement)
        print("5️⃣ Verifying OpenAI Configuration Error when API Key is Missing...")
        settings.AI_PROVIDER = "openai"
        sample_code = """def transfer_funds(account_id, amount, rate_divisor):
    # Security flaw: String interpolation in SQL
    db.execute(f"UPDATE accounts SET balance = balance - {amount} WHERE id = '{account_id}'")
    
    # Bug flaw: unhandled division
    fee = 50 / rate_divisor
    
    # Secret flaw: Hardcoded secret key
    api_token = "secret_access_token_99999"
    
    return True
"""
        unconfig_resp = await client.post("/api/v1/reviews", headers=headers, json={
            "code": sample_code,
            "language": "python",
            "title": "Fund Transfer Engine Review",
        })
        assert unconfig_resp.status_code == 502
        assert unconfig_resp.json()["detail"]["code"] == "AI_CONFIG_ERROR"
        print(f"   ✅ Correctly caught and returned AI_CONFIG_ERROR: {unconfig_resp.json()['detail']['message']}\n")

        # 6. Execute Full Analysis with Mock Provider
        print("6️⃣ Running Full Analysis with Deterministic Mock Engine...")
        settings.AI_PROVIDER = "mock"
        review_resp = await client.post("/api/v1/reviews", headers=headers, json={
            "code": sample_code,
            "language": "python",
            "title": "Fund Transfer Engine Review",
            "categories": ["bug", "security", "performance", "maintainability"],
            "depth": "standard"
        })
        assert review_resp.status_code == 201, f"Review creation failed: {review_resp.text}"
        review_data = review_resp.json()
        review_id = review_data["id"]
        print(f"   ✅ Review created and processed: ID={review_id}")
        print(f"      Status: {review_data['status']}")
        print(f"      Total Findings: {review_data['total_findings']}")
        print(f"      Critical: {review_data['critical_count']}, High: {review_data['high_count']}, Medium: {review_data['medium_count']}")
        print(f"      Summary: {review_data['review_summary']}\n")

        # 7. Verify Findings details
        print("7️⃣ Inspecting Grounded Findings & Copyable Fixes...")
        assert len(review_data["findings"]) >= 2
        for idx, finding in enumerate(review_data["findings"], 1):
            print(f"      [{idx}] {finding['severity'].upper()} ({finding['category']}): {finding['title']}")
            print(f"          Line {finding['start_line']} | Fix: {finding['suggested_fix'].splitlines()[0] if finding['suggested_fix'] else 'N/A'}")

        # 8. Dashboard Aggregates
        print("\n8️⃣ Testing Dashboard Summary Metrics...")
        dash_resp = await client.get("/api/v1/dashboard/summary", headers=headers)
        assert dash_resp.status_code == 200
        dash_data = dash_resp.json()
        print(f"   ✅ Dashboard Stats: Total Reviews = {dash_data['total_reviews']}, Total Findings = {dash_data['total_findings']}")
        print(f"      Severity Breakdown: {dash_data['severity_breakdown']}\n")

        # 9. Review History Listing
        print("9️⃣ Testing Paginated Review History...")
        list_resp = await client.get("/api/v1/reviews?page=1&page_size=10", headers=headers)
        assert list_resp.status_code == 200
        list_data = list_resp.json()
        print(f"   ✅ History: {len(list_data['items'])} item(s) on page 1 of {list_data['total_pages']} (Total: {list_data['total']})\n")

        # 10. Clean-up Deletion
        print("🔟 Testing Review Deletion & Ownership Security...")
        del_resp = await client.delete(f"/api/v1/reviews/{review_id}", headers=headers)
        assert del_resp.status_code == 204
        print(f"   ✅ Review {review_id} successfully deleted.")

        # Verify it's gone
        get_deleted = await client.get(f"/api/v1/reviews/{review_id}", headers=headers)
        assert get_deleted.status_code == 404
        print("   ✅ Verified 404 Not Found after deletion.")

    print("\n🎉 ALL 10 LIVE END-TO-END VERIFICATION CHECKS PASSED FLAWLESSLY!")


if __name__ == "__main__":
    asyncio.run(run_e2e_verification())
