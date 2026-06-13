import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_pipeline_schedule_deletion_and_toggle(client: AsyncClient):
    """Test deactivating and removing schedules from a saved pipeline."""
    # Register and login
    register_payload = {
        "email": "sched_del@example.com",
        "username": "sched_del",
        "password": "securepassword123"
    }
    await client.post("/api/auth/register", json=register_payload)
    login_response = await client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": register_payload["password"]
    })
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a pipeline with active schedule
    pipeline_payload = {
        "name": "Pipeline to Unsched",
        "description": "Will delete schedule",
        "nodes": [{"id": "node1", "type": "inputText"}],
        "edges": [],
        "nodeConfigs": {"node1": {"text": "hello"}},
        "schedule": {
            "type": "cron",
            "cron": "0 0 * * *",
            "active": True
        }
    }
    
    response = await client.post("/api/studio/pipelines", json=pipeline_payload, headers=headers)
    pipeline_id = response.json()["id"]
    
    # 2. Deactivate schedule via toggle endpoint
    toggle_response = await client.post(
        f"/api/studio/pipelines/{pipeline_id}/schedule/toggle?active=false",
        headers=headers
    )
    assert toggle_response.status_code == 200
    assert toggle_response.json()["active"] is False
    
    # 3. Completely delete/remove the schedule (sets active=False in this codebase)
    del_response = await client.delete(
        f"/api/studio/pipelines/{pipeline_id}/schedule",
        headers=headers
    )
    assert del_response.status_code == 200
    assert del_response.json()["status"] == "schedule_removed"
    
    # 4. Check list_scheduled_pipelines no longer returns active schedules
    list_response = await client.get("/api/studio/scheduled", headers=headers)
    assert list_response.status_code == 200
    list_data = list_response.json()
    scheduled_item = next(p for p in list_data if p["id"] == pipeline_id)
    assert scheduled_item["schedule"]["active"] is False
