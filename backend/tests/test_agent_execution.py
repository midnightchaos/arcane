import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_agent_execution_studio(client: AsyncClient):
    """Test studio agent execution endpoint."""
    # Register and login
    register_payload = {
        "email": "agent_test@example.com",
        "username": "agent_test",
        "password": "securepassword123"
    }
    await client.post("/api/auth/register", json=register_payload)
    login_response = await client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": register_payload["password"]
    })
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Execute with invalid agent type -> should return 400
    bad_payload = {
        "agent_type": "invalid_agent",
        "prompt": "hello"
    }
    bad_response = await client.post("/api/studio/agents/execute", json=bad_payload, headers=headers)
    assert bad_response.status_code == 400
    assert "Unknown agent type" in bad_response.json()["detail"]

    # 2. Execute with valid agent type, mocking Ollama/agent backend
    mock_agent = AsyncMock()
    mock_agent.system_prompt = "You are an assistant"
    mock_agent.generate.return_value = {"response": "Mocked response from reasoning agent"}
    
    with patch("app.api.studio.agent_router.get_agent") as mock_get_agent:
        mock_get_agent.return_value = mock_agent
        
        payload = {
            "agent_type": "reasoner",
            "prompt": "what is 2+2?",
            "system_prompt": "You are a math tutor"
        }
        
        response = await client.post("/api/studio/agents/execute", json=payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["agent_type"] == "reasoner"
        assert data["result"] == "Mocked response from reasoning agent"
        
        mock_get_agent.assert_called_with("reasoner")
        mock_agent.generate.assert_called_once_with("what is 2+2?")
