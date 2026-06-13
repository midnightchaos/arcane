"""
Workflow API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import json
import asyncio

from app.db.session import get_db, engine
from app.models.user import User
from app.models.workflow import Workflow, WorkflowExecution
from app.core.security import get_current_user
from app.core.workflow_manager import workflow_manager
from app.core.file_manager import file_manager

router = APIRouter(prefix="/workflows", tags=["Workflows"])

# Pydantic models
class WorkflowStepCreate(BaseModel):
    agent: str
    instruction: str

class WorkflowAgentConfig(BaseModel):
    agent: str
    instruction: str

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    workflowType: str = Field(alias="workflow_type")
    config: Dict[str, Any]
    
    class Config:
        populate_by_name = True

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    isActive: Optional[bool] = Field(default=None, alias="is_active")
    
    class Config:
        populate_by_name = True

class WorkflowResponse(BaseModel):
    id: str
    userId: str = Field(alias="user_id")
    name: str
    description: Optional[str]
    workflowType: str = Field(alias="workflow_type")
    config: Dict[str, Any]
    isActive: bool = Field(alias="is_active")
    createdAt: datetime = Field(alias="created_at")
    updatedAt: Optional[datetime] = Field(alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True

class WorkflowExecuteRequest(BaseModel):
    workflowId: str = Field(alias="workflow_id")
    input: str
    
    class Config:
        populate_by_name = True

class ExecutionResponse(BaseModel):
    id: str
    workflowId: str = Field(alias="workflow_id")
    status: str
    inputData: Optional[str] = Field(alias="input_data")
    outputData: Optional[str] = Field(alias="output_data")
    errorMessage: Optional[str] = Field(alias="error_message")
    startedAt: datetime = Field(alias="started_at")
    completedAt: Optional[datetime] = Field(alias="completed_at")
    executionLog: Optional[Union[Dict[str, Any], List[Any]]] = Field(alias="execution_log")
    
    class Config:
        from_attributes = True
        populate_by_name = True

class CustomWorkflowRequest(BaseModel):
    prompt: str
    
    class Config:
        from_attributes = True


@router.get("/list", response_model=List[WorkflowResponse])
async def list_workflows(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all workflows for current user"""
    result = await db.execute(
        select(Workflow)
        .where(Workflow.user_id == current_user.id)
        .order_by(Workflow.created_at.desc())
    )
    workflows = result.scalars().all()
    return [WorkflowResponse.model_validate(w) for w in workflows]


@router.post("/create", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new workflow"""
    new_workflow = Workflow(
        user_id=current_user.id,
        name=workflow_data.name,
        description=workflow_data.description,
        workflow_type=workflow_data.workflowType,
        config=workflow_data.config
    )
    
    db.add(new_workflow)
    await db.commit()
    await db.refresh(new_workflow)
    
    return WorkflowResponse.model_validate(new_workflow)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific workflow"""
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id, Workflow.user_id == current_user.id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    return WorkflowResponse.model_validate(workflow)


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    workflow_data: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a workflow"""
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id, Workflow.user_id == current_user.id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # Update fields
    update_data = workflow_data.model_dump(exclude_unset=True, by_alias=True)
    for field, value in update_data.items():
        setattr(workflow, field, value)
    
    workflow.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(workflow)
    
    return WorkflowResponse.model_validate(workflow)


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a workflow"""
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id, Workflow.user_id == current_user.id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    await db.delete(workflow)
    await db.commit()


@router.post("/execute", response_model=ExecutionResponse)
async def execute_workflow(
    execute_data: WorkflowExecuteRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Execute a workflow and return complete result"""
    
    # Get workflow
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == execute_data.workflowId, Workflow.user_id == current_user.id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    if not workflow.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow is not active"
        )
    
    # Create execution record
    execution = WorkflowExecution(
        workflow_id=workflow.id,
        status="running",
        input_data=execute_data.input
    )
    db.add(execution)
    await db.commit()
    await db.refresh(execution)
    
    try:
        # Execute workflow
        result = await workflow_manager.execute_workflow(
            workflow_id=workflow.id,
            workflow_type=workflow.workflow_type,
            config=workflow.config,
            input_data=execute_data.input
        )
        
        # Update execution record
        execution.status = result["status"]
        execution.output_data = result.get("output", "")
        execution.error_message = result.get("error")
        execution.execution_log = result.get("log", [])
        execution.completed_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(execution)
        
        return ExecutionResponse.model_validate(execution)
        
    except Exception as e:
        # Update execution with error
        execution.status = "failed"
        execution.error_message = str(e)
        execution.completed_at = datetime.utcnow()
        await db.commit()
        await db.refresh(execution)
        
        return ExecutionResponse.model_validate(execution)


@router.post("/execute/stream")
async def execute_workflow_stream(
    execute_data: WorkflowExecuteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Execute a workflow with streaming progress updates"""
    
    # Get workflow
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == execute_data.workflowId, Workflow.user_id == current_user.id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    if not workflow.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow is not active"
        )
    
    # Create execution record
    execution = WorkflowExecution(
        workflow_id=workflow.id,
        status="running",
        input_data=execute_data.input
    )
    db.add(execution)
    await db.commit()
    await db.refresh(execution)
    execution_id = execution.id
    
    async def stream_progress():
        """Stream execution progress"""
        try:
            # Queue for progress updates
            progress_queue = asyncio.Queue()
            
            async def callback(progress_update):
                await progress_queue.put(progress_update)
            
            # Start execution in background
            exec_task = asyncio.create_task(
                workflow_manager.execute_workflow(
                    workflow_id=workflow.id,
                    workflow_type=workflow.workflow_type,
                    config=workflow.config,
                    input_data=execute_data.input,
                    callback=callback
                )
            )
            
            # Stream progress updates
            while not exec_task.done():
                try:
                    progress_update = await asyncio.wait_for(progress_queue.get(), timeout=0.1)
                    yield f"data: {json.dumps(progress_update)}\n\n"
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    print(f"Error streaming update: {e}")
                    continue
            
            # Drain any remaining updates from queue
            while not progress_queue.empty():
                try:
                    progress_update = progress_queue.get_nowait()
                    yield f"data: {json.dumps(progress_update)}\n\n"
                except asyncio.QueueEmpty:
                    break
                except Exception as e:
                    print(f"Error draining queue: {e}")
                    break
            
            # Get final result
            result = await exec_task
            
            # Update execution record
            from app.db.session import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                stmt = (
                    update(WorkflowExecution)
                    .where(WorkflowExecution.id == execution_id)
                    .values(
                        status=result["status"],
                        output_data=result.get("output", ""),
                        error_message=result.get("error"),
                        execution_log=result.get("log", []),
                        completed_at=datetime.utcnow()
                    )
                )
                await session.execute(stmt)
                await session.commit()
            
            # Save execution result to file
            try:
                file_path = file_manager.save_execution_result(
                    workflow_name=workflow.name,
                    workflow_id=workflow.id,
                    execution_id=execution_id,
                    input_data=execute_data.input,
                    output_data=result.get("output", ""),
                    agent_outputs=result.get("agent_outputs", []),
                    execution_log=result.get("log", []),
                    status=result["status"],
                    error_message=result.get("error")
                )
                print(f"Execution result saved to: {file_path}")
            except Exception as e:
                print(f"Failed to save execution result to file: {e}")
            
            # Send final result
            yield f"data: {json.dumps({'type': 'complete', 'result': result})}\n\n"
            
        except Exception as e:
            # Send error
            error_data = {"type": "error", "error": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"
            
            # Update execution with error
            from app.db.session import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                stmt = (
                    update(WorkflowExecution)
                    .where(WorkflowExecution.id == execution_id)
                    .values(
                        status="failed",
                        error_message=str(e),
                        completed_at=datetime.utcnow()
                    )
                )
                await session.execute(stmt)
                await session.commit()
            
            # Save error result to file
            try:
                file_path = file_manager.save_execution_result(
                    workflow_name=workflow.name,
                    workflow_id=workflow.id,
                    execution_id=execution_id,
                    input_data=execute_data.input,
                    output_data="",
                    agent_outputs=[],
                    execution_log=[],
                    status="failed",
                    error_message=str(e)
                )
                print(f"Error execution result saved to: {file_path}")
            except Exception as file_error:
                print(f"Failed to save error result to file: {file_error}")
    
    return StreamingResponse(stream_progress(), media_type="text/event-stream")


@router.get("/{workflow_id}/executions", response_model=List[ExecutionResponse])
async def get_workflow_executions(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get execution history for a workflow"""
    
    # Verify workflow belongs to user
    workflow_result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id, Workflow.user_id == current_user.id)
    )
    workflow = workflow_result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # Get executions
    result = await db.execute(
        select(WorkflowExecution)
        .where(WorkflowExecution.workflow_id == workflow_id)
        .order_by(WorkflowExecution.started_at.desc())
    )
    executions = result.scalars().all()
    
    return [ExecutionResponse.model_validate(e) for e in executions]


@router.post("/create-custom", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_workflow(
    request_data: CustomWorkflowRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a custom workflow from natural language description"""
    from app.core.agents import ReasonerAgent
    
    try:
        # Use AI to generate workflow configuration
        reasoner = ReasonerAgent()
        
        analysis_prompt = f"""
Analyze this workflow request and generate a workflow configuration:

{request_data.prompt}

Provide:
1. A good name for this workflow (short, descriptive)
2. A brief description
3. The workflow type (sequential, parallel, or conditional)
4. The workflow configuration with agents and instructions

Format your response as JSON with these fields:
- name: string
- description: string
- workflow_type: "sequential" | "parallel" | "conditional"
- config: object with workflow structure

For sequential workflows, use this structure:
{{
  "steps": [
    {{"agent": "agent_name", "instruction": "what to do"}}
  ]
}}

For parallel workflows:
{{
  "agents": [
    {{"agent": "agent_name", "instruction": "what to do"}}
  ],
  "combiner": "agent_name",
  "combine_instruction": "how to combine results"
}}

For conditional workflows:
{{
  "evaluator": "agent_name",
  "evaluation_prompt": "what to evaluate",
  "branches": {{
    "branch_name": [
      {{"agent": "agent_name", "instruction": "what to do"}}
    ]
  }},
  "default_branch": "branch_name"
}}

Available agents: reasoner, coder, analyst, planner, memory, executor
"""
        
        result = await reasoner.analyze_workflow_prompt(analysis_prompt)
        
        # Parse the JSON response
        import json
        import re
        
        # Try to extract JSON from the response
        json_match = re.search(r'```json\s*([\s\S]*?)```', result)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find any JSON object
            json_match = re.search(r'\{[\s\S]*\}', result)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = result
        
        workflow_spec = json.loads(json_str)
        
        # Create the workflow
        new_workflow = Workflow(
            user_id=current_user.id,
            name=workflow_spec.get('name', 'Custom Workflow'),
            description=workflow_spec.get('description', 'AI-generated custom workflow'),
            workflow_type=workflow_spec.get('workflow_type', 'sequential'),
            config=workflow_spec.get('config', {})
        )
        
        db.add(new_workflow)
        await db.commit()
        await db.refresh(new_workflow)
        
        return WorkflowResponse.model_validate(new_workflow)
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse workflow specification: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create custom workflow: {str(e)}"
        )


@router.get("/templates/list")
async def get_workflow_templates():
    """Get pre-built workflow templates"""
    templates = [
        {
            "id": "research_and_write",
            "name": "Research and Write",
            "description": "Research a topic and write a comprehensive article",
            "workflowType": "sequential",
            "config": {
                "steps": [
                    {"agent": "reasoner", "instruction": "Analyze the topic and identify key areas to research"},
                    {"agent": "memory", "instruction": "Gather relevant information and context"},
                    {"agent": "analyst", "instruction": "Synthesize the information and create an outline"},
                    {"agent": "executor", "instruction": "Write a comprehensive article based on the outline"}
                ]
            }
        },
        {
            "id": "code_review",
            "name": "Code Review and Improve",
            "description": "Review code and provide improvements",
            "workflowType": "sequential",
            "config": {
                "steps": [
                    {"agent": "coder", "instruction": "Analyze the code for issues and potential improvements"},
                    {"agent": "reasoner", "instruction": "Reason about the code structure and logic"},
                    {"agent": "analyst", "instruction": "Provide detailed feedback and recommendations"},
                    {"agent": "coder", "instruction": "Generate improved code based on the analysis"}
                ]
            }
        },
        {
            "id": "multi_perspective_analysis",
            "name": "Multi-Perspective Analysis",
            "description": "Analyze from multiple angles simultaneously",
            "workflowType": "parallel",
            "config": {
                "agents": [
                    {"agent": "reasoner", "instruction": "Provide logical and rational analysis"},
                    {"agent": "analyst", "instruction": "Provide analytical and data-driven perspective"},
                    {"agent": "planner", "instruction": "Provide strategic and planning perspective"}
                ],
                "combiner": "executor",
                "combine_instruction": "Synthesize these different perspectives into a comprehensive analysis"
            }
        },
        {
            "id": "smart_router",
            "name": "Smart Task Router",
            "description": "Automatically route to the best agent for the task",
            "workflowType": "conditional",
            "config": {
                "evaluator": "reasoner",
                "evaluation_prompt": "Determine if this is primarily a: coding, analysis, planning, or memory task",
                "branches": {
                    "coding": [
                        {"agent": "coder", "instruction": "Handle this coding task"}
                    ],
                    "analysis": [
                        {"agent": "analyst", "instruction": "Perform detailed analysis"}
                    ],
                    "planning": [
                        {"agent": "planner", "instruction": "Create a comprehensive plan"}
                    ],
                    "memory": [
                        {"agent": "memory", "instruction": "Retrieve and synthesize relevant information"}
                    ]
                },
                "default_branch": "analysis"
            }
        },
        {
            "id": "creative_writing",
            "name": "Creative Writing Pipeline",
            "description": "Brainstorm, outline, draft, and edit a creative piece",
            "workflowType": "sequential",
            "config": {
                "steps": [
                    {"agent": "reasoner", "instruction": "Brainstorm novel ideas and core themes based on the prompt"},
                    {"agent": "planner", "instruction": "Create a structured narrative outline with character arcs"},
                    {"agent": "executor", "instruction": "Draft the content following the outline and stylistic tone"},
                    {"agent": "analyst", "instruction": "Edit the draft for pacing, grammar, and emotional impact"}
                ]
            }
        },
        {
            "id": "data_analysis_pipeline",
            "name": "Data Intelligence Pipeline",
            "description": "Extract data insights, find patterns, and generate a final report",
            "workflowType": "sequential",
            "config": {
                "steps": [
                    {"agent": "coder", "instruction": "Write scripts to extract, clean, and format the requested data"},
                    {"agent": "analyst", "instruction": "Analyze the cleaned data to find statistical patterns and anomalies"},
                    {"agent": "reasoner", "instruction": "Interpret the patterns and form logical business conclusions"},
                    {"agent": "executor", "instruction": "Draft a comprehensive executive report summarizing the findings"}
                ]
            }
        }
    ]
    
    return templates
