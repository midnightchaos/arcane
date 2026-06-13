import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_invalid_login_attempts(client: AsyncClient):
    """Test login with wrong password and non-existent users."""
    # 1. Login user that does not exist
    response = await client.post("/api/auth/login", json={
        "email": "doesntexist@example.com",
        "password": "somepassword"
    })
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

    # 2. Register first, then login with wrong password
    register_payload = {
        "email": "failureuser@example.com",
        "username": "failureuser",
        "password": "correctpassword123"
    }
    await client.post("/api/auth/register", json=register_payload)
    
    bad_login_response = await client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": "wrongpassword"
    })
    assert bad_login_response.status_code == 401
    assert "Incorrect email or password" in bad_login_response.json()["detail"]

@pytest.mark.asyncio
async def test_unauthorized_endpoints(client: AsyncClient):
    """Test endpoints that require auth return 401 when unauthenticated."""
    endpoints = [
        ("GET", "/api/auth/me"),
        ("PATCH", "/api/auth/profile"),
        ("POST", "/api/auth/change-password"),
        ("POST", "/api/auth/delete-account"),
        ("POST", "/api/coding/execute"),
        ("POST", "/api/coding/command"),
    ]
    for method, path in endpoints:
        if method == "GET":
            response = await client.get(path)
        elif method == "PATCH":
            response = await client.patch(path, json={})
        elif method == "POST":
            response = await client.post(path, json={})
            
        assert response.status_code in [401, 403], f"Expected 401 or 403 for unauthorized access to {path}"
