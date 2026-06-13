import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_pipeline_schedule_creation(client: AsyncClient):
    """Test saving a pipeline config with schedule metadata."""
    # Register and login
    register_payload = {
        "email": "sched_create@example.com",
        "username": "sched_create",
        "password": "securepassword123"
    }
    await client.post("/api/auth/register", json=register_payload)
    login_response = await client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": register_payload["password"]
    })
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a pipeline with a schedule
    pipeline_payload = {
        "name": "Scheduled Test Pipeline",
        "description": "Runs on a 5-minute interval",
        "nodes": [{"id": "node1", "type": "inputText"}],
        "edges": [],
        "nodeConfigs": {"node1": {"text": "hello"}},
        "schedule": {
            "type": "interval",
            "interval": "5m",
            "active": True
        }
    }
    
    response = await client.post("/api/studio/pipelines", json=pipeline_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["name"] == "Scheduled Test Pipeline"
    
    pipeline_id = data["id"]
    
    # 2. Check scheduled pipelines list
    list_response = await client.get("/api/studio/scheduled", headers=headers)
    assert list_response.status_code == 200
    list_data = list_response.json()
    assert len(list_data) >= 1
    assert any(p["id"] == pipeline_id for p in list_data)
    
    scheduled_item = next(p for p in list_data if p["id"] == pipeline_id)
    assert scheduled_item["schedule"]["type"] == "interval"
    assert scheduled_item["schedule"]["interval"] == "5m"
    assert scheduled_item["schedule"]["active"] is True
