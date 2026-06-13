"""
Agent Router
Routes requests to the appropriate agent and manages agent lifecycle
"""
from typing import Dict, Optional, Any
from app.core.agents import (
    BaseAgent,
    PlannerAgent,
    ExecutorAgent,
    AnalystAgent, MemoryAgent, ToolAgent, ReasonerAgent, CoderAgent,
    VisionAgent, SearchAgent, SqlAgent, RagAgent
)

class AgentRouter:
    """Manages agent instances and routes requests"""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self._initialize_agents()
    
    def _initialize_agents(self):
        """Initialize all available agents"""
        self.agents = {
            "planner": PlannerAgent(),
            "analyst": AnalystAgent(),
            "memory": MemoryAgent(),
            "reasoner": ReasonerAgent(),
            "coder": CoderAgent(),
            "executor": ExecutorAgent(),
            "vision": VisionAgent(),
            "search": SearchAgent(),
            "sqlAgent": SqlAgent(),
            "tool": ToolAgent(),
            "chronicler": RagAgent(),
        }
    
    def get_agent(self, agent_type: str) -> Optional[BaseAgent]:
        """Get agent by type"""
        return self.agents.get(agent_type.lower())
    
    def list_agents(self) -> list:
        """List all available agents"""
        return [
            {
                "id": agent_type,
                "type": agent_type,
                **agent.get_info()
            }
            for agent_type, agent in self.agents.items()
        ]
    
    def get_agent_status(self, agent_type: str) -> Dict[str, Any]:
        """Get status of specific agent"""
        agent = self.get_agent(agent_type)
        if not agent:
            return {"error": "Agent not found"}
        
        return {
            "id": agent_type,
            "type": agent_type,
            **agent.get_info()
        }
    
    async def execute(
        self,
        agent_type: str,
        prompt: str,
        stream: bool = False,
        **kwargs
    ):
        """Execute agent with given prompt"""
        agent = self.get_agent(agent_type)
        if not agent:
            raise ValueError(f"Unknown agent type: {agent_type}")
        
        return await agent.generate(prompt, stream=stream, **kwargs)
    
    async def chat(
        self,
        agent_type: str,
        messages: list,
        stream: bool = False,
        **kwargs
    ):
        """Chat with agent using message format"""
        agent = self.get_agent(agent_type)
        if not agent:
            raise ValueError(f"Unknown agent type: {agent_type}")
        
        return await agent.chat(messages, stream=stream, **kwargs)

# Global router instance
agent_router = AgentRouter()
