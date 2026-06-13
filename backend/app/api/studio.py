"""
Studio API Endpoints
Handles pipeline save/load and agent execution for Arcane Studio
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import json
import asyncio
from datetime import datetime
import base64
import os
import glob

from app.core.security import get_current_user
from app.core.agent_router import agent_router
from app.models.user import User
from app.api.studio_templates import get_templates

router = APIRouter(prefix="/studio", tags=["Studio"])

# ─────────────────────────────────────────────
# In-memory pipeline store (per user, by user_id)
# ─────────────────────────────────────────────
_pipelines: Dict[str, List[Dict]] = {}  # user_id → list of pipeline dicts
_running_pipelines: set = set()  # set of (user_id, pipeline_id) currently executing
PIPELINES_FILE = "app/studio_pipelines.json"

def save_pipelines():
    try:
        with open(PIPELINES_FILE, "w", encoding="utf-8") as f:
            json.dump(_pipelines, f, indent=2)
    except Exception as e:
        print(f"Failed to save pipelines: {e}")

def _load_pipelines():
    global _pipelines
    if os.path.exists(PIPELINES_FILE):
        try:
            with open(PIPELINES_FILE, "r", encoding="utf-8") as f:
                _pipelines = json.load(f)
            print(f"✓ Loaded {sum(len(v) for v in _pipelines.values())} pipelines from disk")
        except Exception as e:
            print(f"Failed to load pipelines: {e}")
            _pipelines = {}

# Load on module import
_load_pipelines()


# ─── Models ───────────────────────────────────

class PipelineSaveRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    nodeConfigs: Dict[str, Any] = {}
    schedule: Optional[Dict[str, Any]] = None

class PipelineInfo(BaseModel):
    id: str
    name: str
    description: str
    nodeCount: int
    createdAt: str
    updatedAt: str
    hasSchedule: bool = False

class PipelineDetail(BaseModel):
    id: str
    name: str
    description: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    nodeConfigs: Dict[str, Any]
    schedule: Optional[Dict[str, Any]] = None
    createdAt: str
    updatedAt: str

class AgentExecuteRequest(BaseModel):
    agent_type: str   # planner | executor | analyst | memory | tool | reasoner | coder
    prompt: str
    system_prompt: Optional[str] = None   # custom override (optional)
    context: Optional[List[Dict]] = None  # prior messages for multi-turn

class AgentExecuteResponse(BaseModel):
    agent_type: str
    result: str
    success: bool
    error: Optional[str] = None

class AgentVisionRequest(BaseModel):
    prompt: str
    image_base64: str

class AgentSearchRequest(BaseModel):
    query: str

class AgentSqlRequest(BaseModel):
    query: str

class AgentRagRequest(BaseModel):
    prompt: str
    namespace: Optional[str] = "default"


# ─── Pipeline Endpoints ────────────────────────

@router.post("/pipelines", response_model=PipelineInfo)
async def save_pipeline(
    req: PipelineSaveRequest,
    current_user: User = Depends(get_current_user)
):
    """Save a studio pipeline config to the user's profile"""
    uid = str(current_user.id)
    if uid not in _pipelines:
        _pipelines[uid] = []

    now = datetime.utcnow().isoformat()
    pipeline = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "description": req.description or "",
        "nodes": req.nodes,
        "edges": req.edges,
        "nodeConfigs": req.nodeConfigs,
        "schedule": req.schedule,
        "createdAt": now,
        "updatedAt": now,
    }
    _pipelines[uid].append(pipeline)
    save_pipelines()

    return PipelineInfo(
        id=pipeline["id"],
        name=pipeline["name"],
        description=pipeline["description"],
        nodeCount=len(pipeline["nodes"]),
        createdAt=pipeline["createdAt"],
        updatedAt=pipeline["updatedAt"],
    )


@router.put("/pipelines/{pipeline_id}", response_model=PipelineInfo)
async def update_pipeline(
    pipeline_id: str,
    req: PipelineSaveRequest,
    current_user: User = Depends(get_current_user)
):
    """Update an existing studio pipeline config"""
    uid = str(current_user.id)
    if uid not in _pipelines:
        raise HTTPException(status_code=404, detail="No pipelines found for user")

    pipelines = _pipelines[uid]
    for i, p in enumerate(pipelines):
        if p["id"] == pipeline_id:
            now = datetime.utcnow().isoformat()
            updated_pipeline = {
                **p,
                "name": req.name,
                "description": req.description or "",
                "nodes": req.nodes,
                "edges": req.edges,
                "nodeConfigs": req.nodeConfigs,
                "schedule": req.schedule,
                "updatedAt": now,
            }
            _pipelines[uid][i] = updated_pipeline
            save_pipelines()
            return PipelineInfo(
                id=updated_pipeline["id"],
                name=updated_pipeline["name"],
                description=updated_pipeline["description"],
                nodeCount=len(updated_pipeline["nodes"]),
                createdAt=updated_pipeline["createdAt"],
                updatedAt=updated_pipeline["updatedAt"],
                hasSchedule=updated_pipeline.get("schedule") is not None and updated_pipeline.get("schedule", {}).get("active", False)
            )

    raise HTTPException(status_code=404, detail="Pipeline not found")


@router.post("/pipelines/{pipeline_id}/execute")
async def execute_pipeline_now(pipeline_id: str, current_user: User = Depends(get_current_user)):
    """Manually trigger a pipeline execution immediately"""
    uid = str(current_user.id)
    user_pipelines = _pipelines.get(uid, [])
    pipeline = next((p for p in user_pipelines if p["id"] == pipeline_id), None)
    
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
        
    from app.core.pipeline_runner import run_pipeline
    
    if "schedule" in pipeline and pipeline["schedule"]:
        pipeline["schedule"]["last_run"] = datetime.utcnow().isoformat()
        save_pipelines()
    
    # Track as running
    _running_pipelines.add((uid, pipeline_id))
    
    async def run_with_cleanup():
        try:
            await run_pipeline(pipeline, uid)
        finally:
            _running_pipelines.remove((uid, pipeline_id))
            
    # Run headlessly in the background
    asyncio.create_task(run_with_cleanup())
    
    return {"status": "Execution started", "pipeline_id": pipeline_id}


@router.get("/pipelines", response_model=List[PipelineInfo])
async def list_pipelines(current_user: User = Depends(get_current_user)):
    """List all saved pipelines (user + templates)"""
    uid = str(current_user.id)
    user_pipelines = _pipelines.get(uid, [])
    
    # User pipelines
    results = [
        PipelineInfo(
            id=p["id"],
            name=p["name"],
            description=p["description"],
            nodeCount=len(p["nodes"]),
            createdAt=p["createdAt"],
            updatedAt=p["updatedAt"],
            hasSchedule=p.get("schedule") is not None and p.get("schedule", {}).get("active", False)
        )
        for p in user_pipelines
    ]
    
    # Templates
    templates = get_templates()
    for t in templates:
        results.append(PipelineInfo(
            id=t["id"],
            name=f"[Template] {t['name']}",
            description=t["description"],
            nodeCount=len(t["nodes"]),
            createdAt="2024-01-01T00:00:00Z",
            updatedAt="2024-01-01T00:00:00Z"
        ))
    
    return results


@router.get("/pipelines/{pipeline_id}", response_model=PipelineDetail)
async def get_pipeline(
    pipeline_id: str,
    current_user: User = Depends(get_current_user)
):
    """Load a specific pipeline (user or template) by ID"""
    uid = str(current_user.id)
    
    # Check user pipelines
    for p in _pipelines.get(uid, []):
        if p["id"] == pipeline_id:
            return PipelineDetail(**p)
            
    # Check templates
    for t in get_templates():
        if t["id"] == pipeline_id:
            return PipelineDetail(
                **t,
                createdAt="2024-01-01T00:00:00Z",
                updatedAt="2024-01-01T00:00:00Z"
            )
            
    raise HTTPException(status_code=404, detail="Pipeline not found")


@router.delete("/pipelines/{pipeline_id}")
async def delete_pipeline(
    pipeline_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a saved pipeline"""
    uid = str(current_user.id)
    pipelines = _pipelines.get(uid, [])
    for i, p in enumerate(pipelines):
        if p["id"] == pipeline_id:
            _pipelines[uid].pop(i)
            save_pipelines()
            return {"status": "deleted", "id": pipeline_id}
    raise HTTPException(status_code=404, detail="Pipeline not found")
    
@router.post("/pipelines/{pipeline_id}/schedule/toggle")
async def toggle_pipeline_schedule(
    pipeline_id: str,
    active: bool,
    current_user: User = Depends(get_current_user)
):
    """Toggle a pipeline's schedule active/inactive"""
    uid = str(current_user.id)
    pipelines = _pipelines.get(uid, [])
    for i, p in enumerate(pipelines):
        if p["id"] == pipeline_id:
            if "schedule" in p and p["schedule"]:
                p["schedule"]["active"] = active
                _pipelines[uid][i] = p
                save_pipelines()
                return {"status": "success", "active": active}
            else:
                raise HTTPException(status_code=400, detail="Pipeline has no schedule")
    raise HTTPException(status_code=404, detail="Pipeline not found")

@router.delete("/pipelines/{pipeline_id}/schedule")
async def delete_pipeline_schedule(
    pipeline_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove the schedule from a pipeline (set it to inactive)"""
    uid = str(current_user.id)
    pipelines = _pipelines.get(uid, [])
    for i, p in enumerate(pipelines):
        if p["id"] == pipeline_id:
            if "schedule" in p and p["schedule"]:
                p["schedule"]["active"] = False
                _pipelines[uid][i] = p
                save_pipelines()
                return {"status": "schedule_removed", "id": pipeline_id}
            else:
                raise HTTPException(status_code=400, detail="Pipeline has no schedule")
    raise HTTPException(status_code=404, detail="Pipeline not found")


class ScheduledPipelineInfo(BaseModel):
    id: str
    name: str
    description: str
    nodeCount: int
    schedule: Dict[str, Any]
    createdAt: str
    updatedAt: str
    last_run: Optional[str] = None
    node_types: List[str] = []
    is_running: bool = False


@router.get("/scheduled", response_model=List[ScheduledPipelineInfo])
async def list_scheduled_pipelines(current_user: User = Depends(get_current_user)):
    """Return all Studio pipelines that have an active schedule with full schedule metadata"""
    uid = str(current_user.id)
    user_pipelines = _pipelines.get(uid, [])
    results = []
    for p in user_pipelines:
        sched = p.get("schedule")
        if sched:
            # Derive a list of unique node block types for the overview
            node_types = list({n.get("type", "") for n in p.get("nodes", []) if n.get("type")})
            results.append(ScheduledPipelineInfo(
                id=p["id"],
                name=p["name"],
                description=p.get("description", ""),
                nodeCount=len(p.get("nodes", [])),
                schedule=sched,
                createdAt=p["createdAt"],
                updatedAt=p["updatedAt"],
                last_run=sched.get("last_run"),
                node_types=node_types,
                is_running=(uid, p["id"]) in _running_pipelines
            ))
    return results


# ─── Agent Execute Endpoint ────────────────────

AGENT_TYPES = ["planner", "analyst", "memory", "reasoner", "coder"]

@router.post("/agents/execute", response_model=AgentExecuteResponse)
async def execute_agent(
    req: AgentExecuteRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Execute any of the 7 ARCANE agents with a prompt.
    Agent-specific prompting is handled by each agent's system_prompt.
    Optionally override the system prompt for custom behaviour.
    """
    if req.agent_type not in AGENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown agent type '{req.agent_type}'. Valid: {AGENT_TYPES}"
        )

    try:
        agent = agent_router.get_agent(req.agent_type)
        if not agent:
            raise HTTPException(status_code=500, detail=f"Agent '{req.agent_type}' not initialized")

        # Optionally override system prompt per-block config
        original_system_prompt = agent.system_prompt
        if req.system_prompt:
            agent.system_prompt = req.system_prompt

        # Execute
        result = await agent.generate(req.prompt)

        # Restore original system prompt
        agent.system_prompt = original_system_prompt

        # Extract text from Ollama result
        if isinstance(result, dict) and "response" in result:
            text = result["response"]
        elif isinstance(result, str):
            text = result
        else:
            text = str(result)

        return AgentExecuteResponse(
            agent_type=req.agent_type,
            result=text,
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        return AgentExecuteResponse(
            agent_type=req.agent_type,
            result="",
            success=False,
            error=str(e)
        )

@router.post("/agents/vision", response_model=AgentExecuteResponse)
async def execute_vision(
    req: AgentVisionRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        agent = agent_router.get_agent("vision")
        # req.image_base64 is expected to be raw base64 string
        image_bytes = base64.b64decode(req.image_base64)
        result = await agent.analyze_image(req.prompt, image_bytes)
        return AgentExecuteResponse(agent_type="vision", result=result, success=True)
    except Exception as e:
        return AgentExecuteResponse(agent_type="vision", result="", success=False, error=str(e))

@router.post("/agents/search", response_model=AgentExecuteResponse)
async def execute_search(
    req: AgentSearchRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        agent = agent_router.get_agent("search")
        result = await agent.search(req.query)
        return AgentExecuteResponse(agent_type="search", result=result, success=True)
    except Exception as e:
        return AgentExecuteResponse(agent_type="search", result="", success=False, error=str(e))

@router.post("/agents/sql", response_model=AgentExecuteResponse)
async def execute_sql(
    req: AgentSqlRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        agent = agent_router.get_agent("sqlAgent")
        result = await agent.execute_query(req.query)
        return AgentExecuteResponse(agent_type="sqlAgent", result=result, success=True)
    except Exception as e:
        return AgentExecuteResponse(agent_type="sqlAgent", result="", success=False, error=str(e))

@router.post("/agents/rag", response_model=AgentExecuteResponse)
async def execute_rag(
    req: AgentRagRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        agent = agent_router.get_agent("chronicler")
        result = await agent.manage_memory(str(current_user.id), req.prompt, req.namespace)
        return AgentExecuteResponse(agent_type="chronicler", result=result, success=True)
    except Exception as e:
        return AgentExecuteResponse(agent_type="chronicler", result="", success=False, error=str(e))

# ─── Headless Execution Logs Endpoints ──────────

@router.get("/pipelines/{pipeline_id}/runs")
async def get_pipeline_runs(
    pipeline_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get list of headless run logs for a pipeline"""
    uid = str(current_user.id)
    pipeline = None
    
    for p in _pipelines.get(uid, []):
        if p["id"] == pipeline_id:
            pipeline = p
            break
            
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
        
    safe_name = "".join([c if c.isalnum() or c in "_-" else "_" for c in pipeline.get("name", "pipeline")])
    # NEW: Structured runs dir: runs/{uid}/{pipeline_id}
    runs_dir = os.path.join(os.getcwd(), "runs", uid, pipeline_id)
    
    if not os.path.exists(runs_dir):
        # Fallback to old flat dir
        runs_dir = os.path.join(os.getcwd(), "runs")
        if not os.path.exists(runs_dir):
            return []
            
    search_pattern = os.path.join(runs_dir, "*.txt")
    run_files = glob.glob(search_pattern)
    
    runs = []
    for f in run_files:
        filename = os.path.basename(f)
        # Handle both [name]_[ts].txt and [name]_[ts]_running.txt
        timestamp_str = filename.replace(f"{safe_name}_", "").replace(".txt", "").replace("_running", "")
        # Format: YYYYMMDD_HHMMSS
        try:
            dt = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
            formatted_date = dt.isoformat() + "Z"
        except:
            formatted_date = timestamp_str
            
        runs.append({
            "filename": filename,
            "timestamp": formatted_date,
            "size": os.path.getsize(f)
        })
        
    runs.sort(key=lambda x: x["timestamp"], reverse=True)
    return runs

@router.get("/pipelines/{pipeline_id}/runs/{filename}")
async def get_run_content(
    pipeline_id: str,
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Get the text content of a specific headless run"""
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
        
    uid = str(current_user.id)
    runs_dir = os.path.join(os.getcwd(), "runs", uid, pipeline_id)
    file_path = os.path.join(runs_dir, filename)
    
    # Fallback to flat dir
    if not os.path.exists(file_path):
        file_path = os.path.join(os.getcwd(), "runs", filename)
        
    # Fallback for finished runs (stripping _running)
    if not os.path.exists(file_path) and "_running" in filename:
        finished_filename = filename.replace("_running", "")
        file_path = os.path.join(runs_dir, finished_filename)
        if not os.path.exists(file_path):
            file_path = os.path.join(os.getcwd(), "runs", finished_filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Run log not found")
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    return {"filename": filename, "content": content}
    
@router.delete("/pipelines/{pipeline_id}/runs/{filename}")
async def delete_run_log(
    pipeline_id: str,
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a specific run log file"""
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
        
    uid = str(current_user.id)
    runs_dir = os.path.join(os.getcwd(), "runs", uid, pipeline_id)
    file_path = os.path.join(runs_dir, filename)
    
    # Fallback to flat dir
    if not os.path.exists(file_path):
        file_path = os.path.join(os.getcwd(), "runs", filename)
        
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Run log not found")
        
    try:
        os.remove(file_path)
        return {"status": "deleted", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete log: {e}")
