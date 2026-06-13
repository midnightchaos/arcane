import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_workflow_creation_and_listing(client: AsyncClient):
    """Test creating and listing workflows."""
    # Register and login
    register_payload = {
        "email": "wf_creator@example.com",
        "username": "wf_creator",
        "password": "securepassword123"
    }
    await client.post("/api/auth/register", json=register_payload)
    login_response = await client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": register_payload["password"]
    })
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a sequential workflow
    wf_payload = {
        "name": "Sequential Test Workflow",
        "description": "A sequential testing pipeline",
        "workflow_type": "sequential",
        "config": {
            "steps": [
                {"agent": "coder", "instruction": "Write a python function"},
                {"agent": "analyst", "instruction": "Analyze performance"}
            ]
        }
    }
    create_response = await client.post("/api/workflows/create", json=wf_payload, headers=headers)
    assert create_response.status_code == 201
    create_data = create_response.json()
    assert create_data["name"] == wf_payload["name"]
    assert create_data["workflow_type"] == "sequential"
    assert "id" in create_data

    # 2. Get the specific workflow
    wf_id = create_data["id"]
    get_response = await client.get(f"/api/workflows/{wf_id}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["name"] == wf_payload["name"]

    # 3. List all workflows
    list_response = await client.get("/api/workflows/list", headers=headers)
    assert list_response.status_code == 200
    list_data = list_response.json()
    assert len(list_data) >= 1
    assert any(wf["id"] == wf_id for wf in list_data)
