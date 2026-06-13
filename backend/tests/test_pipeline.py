import pytest
import os
import shutil
from app.core.pipeline_runner import topo_sort, get_input, run_pipeline, RUNS_DIR

def test_topo_sort():
    """Verify topological sorting of nodes in a pipeline."""
    nodes = [
        {"id": "node1", "type": "inputText"},
        {"id": "node2", "type": "transform"},
        {"id": "node3", "type": "output"}
    ]
    edges = [
        {"source": "node1", "target": "node2"},
        {"source": "node2", "target": "node3"}
    ]
    
    sorted_nodes = topo_sort(nodes, edges)
    assert len(sorted_nodes) == 3
    assert sorted_nodes[0]["id"] == "node1"
    assert sorted_nodes[1]["id"] == "node2"
    assert sorted_nodes[2]["id"] == "node3"

def test_get_input():
    """Verify get_input constructs upstream outputs correctly."""
    edges = [
        {"source": "node1", "target": "node2"},
        {"source": "node3", "target": "node2"}
    ]
    result_map = {
        "node1": {"result": "Hello", "error": ""},
        "node3": {"result": "World", "error": ""}
    }
    
    upstream_text = get_input("node2", edges, result_map)
    assert "Hello" in upstream_text
    assert "World" in upstream_text

@pytest.mark.asyncio
async def test_run_pipeline_local_execution():
    """Smoke test to run a basic inputText -> transform (uppercase) pipeline locally."""
    pipeline = {
        "id": "test_pipeline_123",
        "name": "Test Uppercase Pipeline",
        "nodes": [
            {"id": "node1", "type": "inputText"},
            {"id": "node2", "type": "transform"},
            {"id": "node3", "type": "outputText"}
        ],
        "edges": [
            {"source": "node1", "target": "node2"},
            {"source": "node2", "target": "node3"}
        ],
        "nodeConfigs": {
            "node1": {"text": "  hello world  "},
            "node2": {"transform": "Uppercase"}
        }
    }
    
    user_id = "test_user_999"
    user_runs_dir = os.path.join(RUNS_DIR, user_id, pipeline["id"])
    
    # Clean up before run
    if os.path.exists(user_runs_dir):
        shutil.rmtree(user_runs_dir)
        
    try:
        await run_pipeline(pipeline, user_id)
        
        # Verify run outputs are generated
        assert os.path.exists(user_runs_dir)
        files = os.listdir(user_runs_dir)
        assert len(files) >= 1
        
        # Find the log file
        log_file = [f for f in files if f.endswith(".txt") and not f.endswith("_running.txt")][0]
        log_path = os.path.join(user_runs_dir, log_file)
        
        with open(log_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        assert "Test Uppercase Pipeline" in content
        assert "Executed successfully" in content
        # Note: Uppercase of "  hello world  " is "  HELLO WORLD  "
        assert "HELLO WORLD" in content
        
    finally:
        # Clean up after run
        if os.path.exists(user_runs_dir):
            shutil.rmtree(user_runs_dir)
