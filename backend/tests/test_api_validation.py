import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_api_validation_errors(client: AsyncClient):
    """Test malformed inputs return 422 validation errors."""
    # 1. Register with invalid email format
    bad_email_payload = {
        "email": "not-an-email",
        "username": "user123",
        "password": "password123"
    }
    response1 = await client.post("/api/auth/register", json=bad_email_payload)
    assert response1.status_code == 422
    assert "detail" in response1.json()

    # 2. Login with missing password parameter
    missing_param_payload = {
        "email": "user@example.com"
    }
    response2 = await client.post("/api/auth/login", json=missing_param_payload)
    assert response2.status_code == 422
    assert "detail" in response2.json()


    # 3. Create workflow with missing name
    bad_wf_payload = {
        "description": "missing name",
        "workflow_type": "sequential",
        "config": {}
    }
    # Create workflow requires auth, so let's register/login first
    register_payload = {
        "email": "validator@example.com",
        "username": "validator",
        "password": "securepassword123"
    }
    await client.post("/api/auth/register", json=register_payload)
    login_response = await client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": register_payload["password"]
    })
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    response3 = await client.post("/api/workflows/create", json=bad_wf_payload, headers=headers)
    assert response3.status_code == 422
