import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_workflow_execution_endpoints(client: AsyncClient):
    """Test workflow execution and active state checks with mocked execution."""
    # Register and login
    register_payload = {
        "email": "wf_exec@example.com",
        "username": "wf_exec",
        "password": "securepassword123"
    }
    await client.post("/api/auth/register", json=register_payload)
    login_response = await client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": register_payload["password"]
    })
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create active workflow
    wf_payload = {
        "name": "Active Exec Workflow",
        "description": "An active workflow for mock executions",
        "workflow_type": "sequential",
        "config": {
            "steps": [
                {"agent": "coder", "instruction": "Print message"}
            ]
        }
    }
    create_response = await client.post("/api/workflows/create", json=wf_payload, headers=headers)
    wf_id = create_response.json()["id"]

    # 1. Test execute on an active workflow (Mocking the manager)
    mock_result = {
        "status": "success",
        "output": "Mocked output execution successfully!",
        "error": None,
        "log": [{"step": 1, "status": "done"}]
    }
    
    with patch("app.api.workflows.workflow_manager.execute_workflow", new_callable=AsyncMock) as mock_execute:
        mock_execute.return_value = mock_result
        
        exec_payload = {
            "workflow_id": wf_id,
            "input": "test input"
        }
        
        response = await client.post("/api/workflows/execute", json=exec_payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["output_data"] == mock_result["output"]
        assert data["workflow_id"] == wf_id
        
        mock_execute.assert_called_once()

    # 2. Deactivate the workflow
    update_response = await client.put(f"/api/workflows/{wf_id}", json={"is_active": False}, headers=headers)
    assert update_response.status_code == 200
    assert update_response.json()["is_active"] is False

    # 3. Execution on inactive workflow should fail with 400
    fail_exec_response = await client.post("/api/workflows/execute", json=exec_payload, headers=headers)
    assert fail_exec_response.status_code == 400
    assert "not active" in fail_exec_response.json()["detail"]
