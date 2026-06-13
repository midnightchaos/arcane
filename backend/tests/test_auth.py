import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_auth_flow(client: AsyncClient):
    """Smoke test to verify registration, login, and profile fetching."""
    # 1. Register a user
    register_payload = {
        "email": "testuser@example.com",
        "username": "testuser",
        "password": "supersecurepassword123"
    }
    
    reg_response = await client.post("/api/auth/register", json=register_payload)
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert reg_data["email"] == register_payload["email"]
    assert reg_data["username"] == register_payload["username"]
    assert "id" in reg_data
    
    # 2. Register again with same email should fail
    fail_response = await client.post("/api/auth/register", json=register_payload)
    assert fail_response.status_code == 400
    
    # 3. Login with credentials
    login_payload = {
        "email": register_payload["email"],
        "password": register_payload["password"]
    }
    login_response = await client.post("/api/auth/login", json=login_payload)
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "token" in login_data
    assert login_data["user"]["email"] == register_payload["email"]
    
    token = login_data["token"]
    
    # 4. Get current user profile
    headers = {"Authorization": f"Bearer {token}"}
    me_response = await client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["username"] == register_payload["username"]
    assert me_data["email"] == register_payload["email"]
    
    # 5. Profile request with invalid token should fail
    bad_headers = {"Authorization": "Bearer invalidtoken"}
    bad_me_response = await client.get("/api/auth/me", headers=bad_headers)
    assert bad_me_response.status_code == 401
