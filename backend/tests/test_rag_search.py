import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_rag_search_endpoint(client: AsyncClient):
    """Test studio RAG agent memory retrieval endpoint."""
    # Register and login
    register_payload = {
        "email": "rag_test@example.com",
        "username": "rag_test",
        "password": "securepassword123"
    }
    await client.post("/api/auth/register", json=register_payload)
    login_response = await client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": register_payload["password"]
    })
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Mock RAG agent
    mock_agent = AsyncMock()
    mock_agent.manage_memory.return_value = "Retrieved memory: User likes testing python APIs."
    
    with patch("app.api.studio.agent_router.get_agent") as mock_get_agent:
        mock_get_agent.return_value = mock_agent
        
        payload = {
            "prompt": "search about test preferences",
            "namespace": "user_profile"
        }
        
        response = await client.post("/api/studio/agents/rag", json=payload, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["agent_type"] == "chronicler"
        assert "User likes testing python" in data["result"]
        
        mock_get_agent.assert_called_with("chronicler")
