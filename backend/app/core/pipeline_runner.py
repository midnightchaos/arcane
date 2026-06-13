import asyncio
import json
import re
import os
from datetime import datetime
from typing import List, Dict, Any
from app.core.agent_router import agent_router

# Ensure runs directory exists
RUNS_DIR = os.path.join(os.getcwd(), "runs")
os.makedirs(RUNS_DIR, exist_ok=True)

def topo_sort(nodes: List[Dict], edges: List[Dict]) -> List[Dict]:
    adj = {n["id"]: [] for n in nodes}
    in_deg = {n["id"]: 0 for n in nodes}
    
    for e in edges:
        if e["source"] in adj and e["target"] in in_deg:
            adj[e["source"]].append(e["target"])
            in_deg[e["target"]] += 1
            
    queue = [n["id"] for n in nodes if in_deg.get(n["id"]) == 0]
    result = []
    
    while queue:
        curr_id = queue.pop(0)
        curr_node = next((n for n in nodes if n["id"] == curr_id), None)
        if curr_node:
            result.append(curr_node)
        for next_id in adj.get(curr_id, []):
            in_deg[next_id] -= 1
            if in_deg[next_id] == 0:
                queue.append(next_id)
                
    return result

def get_input(node_id: str, edges: List[Dict], result_map: Dict[str, Any]) -> str:
    incoming = [e for e in edges if e["target"] == node_id]
    upstream_texts = [result_map.get(e["source"], {}).get("result", "") for e in incoming]
    return "\n\n".join(filter(bool, upstream_texts))

async def run_pipeline(pipeline: Dict, user_id: str) -> None:
    nodes = pipeline.get("nodes", [])
    edges = pipeline.get("edges", [])
    node_configs = pipeline.get("nodeConfigs", {})
    
    ordered_nodes = topo_sort(nodes, edges)
    result_map = {}
    
    print(f"🔄 Headless execution starting for pipeline '{pipeline.get('name')}' ({pipeline.get('id')})")
    
    log_content = [f"Pipeline: {pipeline.get('name')}"]
    log_content.append(f"Execution Time: {datetime.utcnow().isoformat()}Z")
    log_content.append("=" * 50 + "\n")
    
    # Pre-calculate file path for logs
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', pipeline.get('name', 'pipeline'))
    file_name = f"{safe_name}_{timestamp}.txt"
    running_file_name = f"{safe_name}_{timestamp}_running.txt"
    
    user_pipeline_dir = os.path.join(RUNS_DIR, str(user_id), str(pipeline.get("id")))
    os.makedirs(user_pipeline_dir, exist_ok=True)
    
    file_path = os.path.join(user_pipeline_dir, file_name)
    running_file_path = os.path.join(user_pipeline_dir, running_file_name)

    for node in ordered_nodes:
        node_id = node["id"]
        node_type = node.get("type")
        config = node_configs.get(node_id, {})
        upstream = get_input(node_id, edges, result_map)
        
        result = ""
        error = ""
        
        try:
            if node_type == "inputText":
                result = config.get("text", "")
            
            elif node_type in ["inputPdf", "inputExcel", "vision"]:
                # Headless mode restriction
                error = f"Node '{node_type}' requires a local file upload which is not supported in scheduled headless execution."
                log_content.append(f"❌ [{node_id} | {node_type}] ERROR: {error}")
                result_map[node_id] = {"result": "", "error": error}
                continue # Skip processing
            
            elif node_type in ['planner', 'executor', 'analyst', 'memory', 'tool', 'reasoner', 'chameleon', 'oracle', 'alchemist', 'sentinel', 'chronicler']:
                prompt = config.get("prompt", "")
                if prompt and upstream:
                    prompt = f"{prompt}\n\nContext:\n{upstream}"
                elif not prompt:
                    prompt = upstream
                
                system_prompt = config.get("systemPrompt")
                
                # Setup specific personas
                if node_type == 'chameleon' and config.get('persona'):
                    system_prompt = f"You are {config['persona']}. Adopt this role completely. Task: {system_prompt or 'Execute the following user request.'}"
                elif node_type == 'oracle':
                    system_prompt = f"You are The Oracle, a data forecaster. Analyze the data and predict future trends. {system_prompt or ''}"
                elif node_type == 'alchemist' and config.get('format'):
                    system_prompt = f"You are The Alchemist. Convert the following input strictly to {config['format']} format. {system_prompt or ''}"
                elif node_type == 'sentinel' and config.get('rules'):
                    system_prompt = f"You are The Sentinel, a security auditor. Audit the following content against these rules: {config['rules']}. {system_prompt or ''}"

                # Agent execution
                agent_map = {
                    'chameleon': 'planner', 'oracle': 'planner', 'alchemist': 'planner', 
                    'sentinel': 'planner', 'chronicler': 'planner'
                }
                actual_agent_type = agent_map.get(node_type, node_type)
                
                agent = agent_router.get_agent(actual_agent_type)
                if not agent:
                    error = f"Agent '{actual_agent_type}' not found"
                else:
                    if node_type == 'chronicler':
                        res = await agent.manage_memory(str(user_id), prompt, config.get("namespace", "default"))
                    else:
                        orig_sp = agent.system_prompt
                        if system_prompt: agent.system_prompt = system_prompt
                        res = await agent.generate(prompt)
                        agent.system_prompt = orig_sp # restore
                    
                    if isinstance(res, dict) and "response" in res:
                        result = res["response"]
                    else:
                        result = str(res)
            
            elif node_type == "search":
                query = config.get("prompt") or upstream
                agent = agent_router.get_agent("search")
                result = await agent.search(query)
                
            elif node_type == "sqlAgent":
                query = config.get("prompt") or upstream
                agent = agent_router.get_agent("sqlAgent")
                result = await agent.execute_query(query)
                
            elif node_type == "coder":
                # Assuming generic coder if generateCode missing
                prompt = config.get("prompt", "")
                if prompt and upstream:
                    prompt = f"{prompt}\n\nInput Data:\n{upstream}"
                elif not prompt:
                    prompt = upstream
                agent = agent_router.get_agent("coder")
                res = await agent.generate(prompt)
                result = res.get("response", str(res)) if isinstance(res, dict) else str(res)
                
            elif node_type == "execution":
                error = "Code execution node not natively supported in headless yet. Passing through code."
                result = config.get("code") or upstream
                
            elif node_type == "transform":
                transform_type = config.get("transform", "")
                if transform_type == 'Trim whitespace': result = upstream.strip()
                elif transform_type == 'Uppercase': result = upstream.upper()
                elif transform_type == 'Lowercase': result = upstream.lower()
                elif transform_type == 'JSON parse':
                    try:
                        result = json.dumps(json.loads(upstream), indent=2)
                    except:
                        result = upstream
                        error = "Invalid JSON"
                elif transform_type == 'Extract first line':
                    result = upstream.split('\\n')[0] if upstream else ''
                else:
                    result = upstream
                    
                if config.get("regex"):
                    try:
                        regex_str = re.sub(r'^\/|\/[a-z]*$', '', config["regex"])
                        result = re.sub(regex_str, '', result)
                    except:
                        error = "Invalid regex"
                        
            elif node_type == "validator":
                val_type = config.get("validationType", "")
                rules = config.get("rules", "")
                if val_type == 'JSON Schema':
                    try:
                        json.loads(upstream)
                        result = "✓ Valid JSON"
                    except:
                        result = "✗ Invalid JSON"
                        error = "Parse error"
                elif val_type == 'Regex' and rules:
                    regex_str = re.sub(r'^\/|\/[a-z]*$', '', rules)
                    if re.search(regex_str, upstream):
                        result = "✓ Matches Regex"
                    else:
                        result = "✗ No match"
                else:
                    result = f"✓ Content length: {len(upstream)}"
            
            elif node_type == "branch":
                result = "TRUE" if upstream else "FALSE"
                
            elif str(node_type).startswith("output"):
                result = upstream
                
        except Exception as e:
            error = str(e)
            
        result_map[node_id] = {"result": result, "error": error}
        log_content.append(f"✅ [{node_id} | {node_type}] Executed successfully")
        if error:
            log_content.append(f"   -> WARNING/ERROR: {error}")
            
        # Incremental log writing for progress tracking
        with open(running_file_path, "w", encoding="utf-8") as f:
            f.write("\n".join(log_content))
            
    # Final step: record output of the last node (or output nodes)
    outputs = []
    for node_id, data in result_map.items():
        if "output" in node_id.lower() or node_id == ordered_nodes[-1]["id"]:
            outputs.append(f"--- OUTPUT FROM {node_id} ---\n{data.get('result', '')}")
            
    log_content.append("\n" + "=" * 50)
    log_content.append("FINAL PIPELINE OUTPUT(S):")
    log_content.extend(outputs)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(log_content))
        
    # Remove the temporary running file
    if os.path.exists(running_file_path):
        os.remove(running_file_path)
        
    print(f"✓ Headless execution finished. Results saved to: {file_path}")
