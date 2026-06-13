import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_code_execute(client: AsyncClient):
    """Test standard python code execution endpoint."""
    # Register and login to get auth token
    register_payload = {
        "email": "coder@example.com",
        "username": "coder",
        "password": "securepassword123"
    }
    await client.post("/api/auth/register", json=register_payload)
    
    login_response = await client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": register_payload["password"]
    })
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Execute safe Python code
    exec_payload = {
        "code": "print('hello from sandboxed environment!')",
        "language": "python"
    }
    response = await client.post("/api/coding/execute", json=exec_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "hello from sandboxed environment!" in data["output"]

    # 2. Execute unsupported language
    bad_exec_payload = {
        "code": "some code",
        "language": "assembly"
    }
    bad_response = await client.post("/api/coding/execute", json=bad_exec_payload, headers=headers)
    assert bad_response.status_code == 200
    bad_data = bad_response.json()
    assert bad_data["success"] is False
    assert "Unsupported language" in bad_data["error"]

@pytest.mark.asyncio
async def test_command_execution(client: AsyncClient):
    """Test command sandboxing endpoint."""
    # Register and login to get auth token
    register_payload = {
        "email": "shelluser@example.com",
        "username": "shelluser",
        "password": "securepassword123"
    }
    await client.post("/api/auth/register", json=register_payload)
    
    login_response = await client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": register_payload["password"]
    })
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Run a safe allowed command (e.g. echo)
    cmd_payload = {
        "command": "echo test_cmd_runner"
    }
    response = await client.post("/api/coding/command", json=cmd_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "test_cmd_runner" in data["output"]
    
    # 2. Run an unsafe/disallowed command
    unsafe_payload = {
        "command": "powershell.exe -Command Get-Process"
    }
    unsafe_response = await client.post("/api/coding/command", json=unsafe_payload, headers=headers)
    assert unsafe_response.status_code == 200
    unsafe_data = unsafe_response.json()
    assert unsafe_data["success"] is False
    assert "not allowed for security reasons" in unsafe_data["error"]
