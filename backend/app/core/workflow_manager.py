"""
Workflow Manager
Orchestrates multi-agent workflows with different execution patterns
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
import json

from app.core.agent_router import agent_router


class WorkflowManager:
    """Manages workflow creation and execution"""
    
    def __init__(self):
        self.active_executions: Dict[str, Any] = {}
    
    async def execute_workflow(
        self,
        workflow_id: str,
        workflow_type: str,
        config: Dict[str, Any],
        input_data: str,
        callback=None
    ) -> Dict[str, Any]:
        """
        Execute a workflow based on its type
        
        Args:
            workflow_id: Unique workflow identifier
            workflow_type: Type of workflow (sequential, parallel, conditional)
            config: Workflow configuration with steps
            input_data: Initial input prompt/data
            callback: Optional callback for progress updates
        
        Returns:
            Dict with execution results
        """
        execution_log = []
        agent_outputs = []  # Track individual agent outputs
        
        try:
            if workflow_type == "sequential":
                result = await self._execute_sequential(
                    config, input_data, execution_log, agent_outputs, callback
                )
            elif workflow_type == "parallel":
                result = await self._execute_parallel(
                    config, input_data, execution_log, agent_outputs, callback
                )
            elif workflow_type == "conditional":
                result = await self._execute_conditional(
                    config, input_data, execution_log, agent_outputs, callback
                )
            else:
                raise ValueError(f"Unknown workflow type: {workflow_type}")
            
            return {
                "status": "completed",
                "output": result,
                "log": execution_log,
                "agent_outputs": agent_outputs
            }
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e),
                "log": execution_log,
                "agent_outputs": agent_outputs
            }
    
    async def _execute_sequential(
        self,
        config: Dict[str, Any],
        input_data: str,
        log: List[Dict],
        agent_outputs: List[Dict],
        callback
    ) -> str:
        """
        Execute agents sequentially, passing output to next agent
        
        Example config:
        {
            "steps": [
                {"agent": "reasoner", "instruction": "Analyze the request"},
                {"agent": "planner", "instruction": "Create a plan"},
                {"agent": "executor", "instruction": "Execute the plan"}
            ]
        }
        """
        current_input = input_data
        steps = config.get("steps", [])
        
        for i, step in enumerate(steps):
            agent_type = step["agent"]
            instruction = step.get("instruction", "")
            
            # Combine instruction with current input
            full_prompt = f"{instruction}\n\nInput: {current_input}"
            
            log_entry = {
                "step": i + 1,
                "agent": agent_type,
                "instruction": instruction,
                "started_at": datetime.utcnow().isoformat()
            }
            
            if callback and callable(callback):
                await callback({
                    "type": "step_start",
                    "step": i + 1,
                    "agent": agent_type,
                    "total_steps": len(steps)
                })
            
            try:
                # Execute agent
                response = await agent_router.execute(
                    agent_type,
                    full_prompt,
                    stream=False
                )
                
                current_input = response.get("response", "")
                
                log_entry.update({
                    "completed_at": datetime.utcnow().isoformat(),
                    "status": "success",
                    "output_preview": current_input[:200] + "..." if len(current_input) > 200 else current_input
                })
                
                # Store full agent output
                agent_outputs.append({
                    "agent": agent_type,
                    "instruction": instruction,
                    "output": current_input,
                    "status": "success"
                })
                
                if callback and callable(callback):
                    await callback({
                        "type": "step_complete",
                        "step": i + 1,
                        "agent": agent_type,
                        "output": current_input
                    })
                
            except Exception as e:
                log_entry.update({
                    "completed_at": datetime.utcnow().isoformat(),
                    "status": "failed",
                    "error": str(e)
                })
                raise
            finally:
                log.append(log_entry)
        
        return current_input
    
    async def _execute_parallel(
        self,
        config: Dict[str, Any],
        input_data: str,
        log: List[Dict],
        agent_outputs: List[Dict],
        callback
    ) -> str:
        """
        Execute multiple agents in parallel and combine results
        """
        agents_config = config.get("agents", [])
        combiner = config.get("combiner", "executor")
        combine_instruction = config.get("combine_instruction", "Synthesize the following results")
        
        # Helper to execute a single agent with logging
        async def run_agent(agent_config, index):
            agent_type = agent_config["agent"]
            instruction = agent_config.get("instruction", "")
            full_prompt = f"{instruction}\n\nInput: {input_data}"
            
            log_entry = {
                "agent": agent_type,
                "instruction": instruction,
                "started_at": datetime.utcnow().isoformat()
            }
            
            if callback and callable(callback):
                await callback({
                    "type": "step_start",
                    "step": index + 1,
                    "agent": agent_type,
                    "total_steps": len(agents_config)
                })
            
            try:
                response = await agent_router.execute(agent_type, full_prompt, stream=False)
                output = response.get("response", "")
                
                log_entry.update({
                    "completed_at": datetime.utcnow().isoformat(),
                    "status": "success",
                    "output_preview": output[:200] + "..." if len(output) > 200 else output
                })
                
                agent_out = {
                    "agent": agent_type,
                    "instruction": instruction,
                    "output": output,
                    "status": "success"
                }
                
                if callback and callable(callback):
                    await callback({
                        "type": "step_complete",
                        "step": index + 1,
                        "agent": agent_type,
                        "output": output
                    })
                
                return f"[{agent_type.upper()}]:\n{output}\n", log_entry, agent_out
            except Exception as e:
                log_entry.update({
                    "completed_at": datetime.utcnow().isoformat(),
                    "status": "failed",
                    "error": str(e)
                })
                
                agent_out = {
                    "agent": agent_type,
                    "instruction": instruction,
                    "error": str(e),
                    "status": "failed"
                }
                return None, log_entry, agent_out

        # Execute all agents in parallel
        tasks = [run_agent(ac, i) for i, ac in enumerate(agents_config)]
        parallel_results = await asyncio.gather(*tasks)
        
        results = []
        for res_str, log_entry, agent_out in parallel_results:
            if res_str:
                results.append(res_str)
            log.append(log_entry)
            agent_outputs.append(agent_out)
        
        # Combine results
        combined_input = f"{combine_instruction}\n\n" + "\n".join(results)
        
        if callback and callable(callback):
            await callback({
                "type": "combining",
                "combiner": combiner
            })
        
        final_response = await agent_router.execute(combiner, combined_input, stream=False)
        final_output = final_response.get("response", "")
        
        log.append({
            "agent": combiner,
            "instruction": "Combine parallel results",
            "status": "success",
            "output_preview": final_output[:200] + "..." if len(final_output) > 200 else final_output
        })
        
        # Store combiner output
        agent_outputs.append({
            "agent": combiner,
            "instruction": "Combine parallel results",
            "output": final_output,
            "status": "success"
        })
        
        return final_output
    
    async def _execute_conditional(
        self,
        config: Dict[str, Any],
        input_data: str,
        log: List[Dict],
        agent_outputs: List[Dict],
        callback
    ) -> str:
        """
        Execute agents based on conditions
        
        Example config:
        {
            "evaluator": "reasoner",
            "evaluation_prompt": "Determine if this is a coding task or analysis task",
            "branches": {
                "coding": [
                    {"agent": "coder", "instruction": "Generate code"}
                ],
                "analysis": [
                    {"agent": "analyst", "instruction": "Perform analysis"}
                ]
            },
            "default_branch": "analysis"
        }
        """
        evaluator = config.get("evaluator", "reasoner")
        evaluation_prompt = config.get("evaluation_prompt", "")
        branches = config.get("branches", {})
        default_branch = config.get("default_branch", list(branches.keys())[0] if branches else None)
        
        # Evaluate which branch to take
        eval_prompt = f"{evaluation_prompt}\n\nInput: {input_data}\n\nRespond with only one word: {', '.join(branches.keys())}"
        
        if callback and callable(callback):
            await callback({
                "type": "evaluating",
                "evaluator": evaluator
            })
        
        eval_response = await agent_router.execute(evaluator, eval_prompt, stream=False)
        decision = eval_response.get("response", "").strip().lower()
        
        # Find matching branch
        selected_branch = None
        for branch_name in branches.keys():
            if branch_name.lower() in decision:
                selected_branch = branch_name
                break
        
        if not selected_branch:
            selected_branch = default_branch
        
        log.append({
            "type": "evaluation",
            "agent": evaluator,
            "decision": selected_branch,
            "status": "success"
        })
        
        if callback and callable(callback):
            await callback({
                "type": "branch_selected",
                "branch": selected_branch
            })
        
        # Execute selected branch as sequential workflow
        branch_steps = branches[selected_branch]
        branch_config = {"steps": branch_steps}
        
        result = await self._execute_sequential(branch_config, input_data, log, agent_outputs, callback)
        
        return result
    
    def create_workflow_config(self, workflow_type: str, **kwargs) -> Dict[str, Any]:
        """Helper to create workflow configurations"""
        
        if workflow_type == "sequential":
            return {
                "steps": kwargs.get("steps", [])
            }
        elif workflow_type == "parallel":
            return {
                "agents": kwargs.get("agents", []),
                "combiner": kwargs.get("combiner", "executor"),
                "combine_instruction": kwargs.get("combine_instruction", "Synthesize results")
            }
        elif workflow_type == "conditional":
            return {
                "evaluator": kwargs.get("evaluator", "reasoner"),
                "evaluation_prompt": kwargs.get("evaluation_prompt", ""),
                "branches": kwargs.get("branches", {}),
                "default_branch": kwargs.get("default_branch")
            }
        else:
            raise ValueError(f"Unknown workflow type: {workflow_type}")


# Global workflow manager instance
workflow_manager = WorkflowManager()
