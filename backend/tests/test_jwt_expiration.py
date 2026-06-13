import pytest
from datetime import timedelta
from httpx import AsyncClient
from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_expired_jwt_token(client: AsyncClient):
    """Test that expired JWT tokens are rejected with 401."""
    # 1. Create an expired token manually
    expired_token = create_access_token(
        data={"sub": "some-user-id"},
        expires_delta=timedelta(seconds=-10)
    )
    
    # 2. Try to access profile with it
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = await client.get("/api/auth/me", headers=headers)
    
    # Token decode will raise JWTError because expiration date is in the past, returning 401
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]
