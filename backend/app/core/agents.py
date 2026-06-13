"""
Base Agent Class
All ARCANE agents inherit from this base class
"""
from typing import Optional, Dict, Any, AsyncGenerator, List
from abc import ABC, abstractmethod
import base64
import json
import asyncio
from duckduckgo_search import DDGS
from app.core.ollama_client import ollama_client
from app.config import settings
from sqlalchemy import text, select
from app.db.session import SessionLocal

class BaseAgent(ABC):
    """Base class for all ARCANE agents"""
    
    def __init__(
        self,
        name: str,
        model: str,
        description: str,
        system_prompt: str = None
    ):
        self.name = name
        self.model = model
        self.description = description
        self.system_prompt = system_prompt or self._default_system_prompt()
        self.status = "idle"
        self.context = []
    
    @abstractmethod
    def _default_system_prompt(self) -> str:
        """Override this to provide agent-specific system prompt"""
        pass
    
    async def generate(
        self,
        prompt: str,
        stream: bool = False,
        context: Optional[list] = None,
        **kwargs
    ):
        """Generate response using Ollama"""
        self.status = "busy"
        try:
            # Build full prompt with system context
            full_prompt = f"{self.system_prompt}\n\nUser: {prompt}\nAssistant:"
            
            result = await ollama_client.generate(
                model=self.model,
                prompt=full_prompt,
                stream=stream,
                context=context or self.context,
                **kwargs
            )
            
            return result
        finally:
            self.status = "idle"
    
    async def chat(
        self,
        messages: list,
        stream: bool = False,
        **kwargs
    ):
        """Chat using message format"""
        self.status = "busy"
        try:
            # Prepend system message if not already present
            if not messages or messages[0].get("role") != "system":
                messages.insert(0, {
                    "role": "system",
                    "content": self.system_prompt
                })
            
            result = await ollama_client.chat(
                model=self.model,
                messages=messages,
                stream=stream,
                **kwargs
            )
            
            return result
        finally:
            self.status = "idle"
    
    async def stream_response(self, prompt: str) -> AsyncGenerator[str, None]:
        """Stream response token by token"""
        generator = await self.generate(prompt, stream=True)
        async for chunk in generator:
            yield chunk
    
    def get_info(self) -> Dict[str, Any]:
        """Get agent information"""
        return {
            "name": self.name,
            "model": self.model,
            "description": self.description,
            "status": self.status
        }
    
    def update_context(self, new_context: list):
        """Update agent context for conversation continuity"""
        self.context = new_context


class PlannerAgent(BaseAgent):
    """Agent specialized in breaking down goals into actionable steps"""
    
    def __init__(self):
        super().__init__(
            name="Planner Agent",
            model=settings.PLANNER_MODEL,
            description="Breaks goals into actionable steps and creates execution plans"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are a strategic planning agent. Your role is to:
1. Analyze goals and requirements
2. Break them down into clear, actionable steps
3. Identify dependencies and priorities
4. Create structured execution plans
5. Consider resources and constraints

Always provide plans in a clear, numbered format with reasoning."""


class ExecutorAgent(BaseAgent):
    """Agent specialized in executing workflow steps"""
    
    def __init__(self):
        super().__init__(
            name="Executor Agent",
            model=settings.EXECUTOR_MODEL,
            description="Executes workflow steps and provides detailed outputs"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are an execution agent. Your role is to:
1. Execute given tasks with precision
2. Follow instructions carefully
3. Provide detailed progress updates
4. Handle errors gracefully
5. Report results clearly

Focus on accuracy and completeness in your execution."""


class AnalystAgent(BaseAgent):
    """Agent specialized in analyzing and evaluating outputs"""
    
    def __init__(self):
        super().__init__(
            name="Analyst Agent",
            model=settings.ANALYST_MODEL,
            description="Evaluates outputs, provides insights and recommendations"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are an analytical agent. Your role is to:
1. Evaluate results and outputs
2. Identify patterns and insights
3. Assess quality and completeness
4. Provide constructive feedback
5. Suggest improvements

Be thorough, objective, and constructive in your analysis."""


class RagAgent(BaseAgent):
    """Agent specialized in RAG (Retrieval Augmented Generation) and long-term memory"""
    
    def __init__(self):
        super().__init__(
            name="Chronicler (RAG) Agent",
            model=settings.MEMORY_MODEL,
            description="Manages long-term memory and context retrieval"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are a knowledge management agent. Your role is to:
1. Store important facts and context permanently
2. Retrieve relevant information from history based on queries
3. Maintain a structured collective memory
4. Answer questions using retrieved context

Focus on accuracy and factual recall."""

    async def manage_memory(self, user_id: str, prompt: str, namespace: str = "default") -> str:
        """Store or retrieve memory based on prompt"""
        self.status = "busy"
        try:
            from app.models.memory import MemoryEntry
            # Simple heuristic: if it looks like a question/query, retrieve. Else, store.
            is_query = any(w in prompt.lower() for w in ["what", "who", "when", "where", "how", "recall", "search", "find"])
            
            async with SessionLocal() as session:
                if is_query:
                    # Basic keyword matching for Phase 2 (simulating RAG)
                    # In a real app, use vector embeddings
                    terms = prompt.lower().split()
                    query = select(MemoryEntry).where(MemoryEntry.user_id == user_id)
                    if namespace:
                        query = query.where(MemoryEntry.namespace == namespace)
                    
                    result = await session.execute(query)
                    entries = result.scalars().all()
                    
                    # Filter entries that contain any of the search terms
                    relevant = [e.content for e in entries if any(t in e.content.lower() for t in terms)]
                    
                    if not relevant:
                        return "No relevant past information found."
                    
                    context = "\n---\n".join(relevant)
                    llm_prompt = f"Retrieved Context:\n{context}\n\nUser Question: {prompt}\n\nTask: Answer the user's question using the retrieved context."
                    
                    llm_result = await self.generate(llm_prompt)
                    return llm_result['response'] if isinstance(llm_result, dict) else str(llm_result)
                else:
                    # Store as new entry
                    new_entry = MemoryEntry(user_id=user_id, namespace=namespace, content=prompt)
                    session.add(new_entry)
                    await session.commit()
                    return f"Stored in memory (Namespace: {namespace}):\n{prompt}"
        except Exception as e:
            return f"Memory Operation Failed: {str(e)}"
        finally:
            self.status = "idle"


class MemoryAgent(BaseAgent):
    """Agent specialized in long-term context and memory management"""
    
    def __init__(self):
        super().__init__(
            name="Memory Agent",
            model=settings.MEMORY_MODEL,
            description="Manages conversation history and provides contextual recall"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are a memory management agent. Your role is to:
1. Track conversation history and context
2. Recall relevant past information
3. Maintain consistency across sessions
4. Summarize key points and decisions
5. Connect related conversations

Focus on preserving important context and making it easily retrievable."""


class ToolAgent(BaseAgent):
    """Agent specialized in API calls and system interactions"""
    
    def __init__(self):
        super().__init__(
            name="Tool Agent",
            model=settings.TOOL_MODEL,
            description="Handles API calls, system commands, and external integrations"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are a tool execution agent. Your role is to:
1. Execute API calls and system commands
2. Parse and format data
3. Handle authentication and errors
4. Transform responses appropriately
5. Validate inputs and outputs

Be precise with technical details and error handling."""


class ReasonerAgent(BaseAgent):
    """Agent specialized in logical reasoning and problem-solving"""
    
    def __init__(self):
        super().__init__(
            name="Reasoner Agent",
            model=settings.REASONER_MODEL,
            description="Provides logical reasoning and problem-solving capabilities"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are a reasoning agent. Your role is to:
1. Apply logical thinking to problems
2. Analyze cause and effect
3. Make inferences and deductions
4. Solve complex problems step-by-step
5. Explain your reasoning clearly

Break down problems methodically and show your thought process."""
    
    async def analyze_workflow_prompt(self, prompt: str) -> str:
        """Analyze a workflow creation prompt and generate workflow specification"""
        try:
            result = await self.generate(prompt)
            
            # Return the response string
            if isinstance(result, dict) and 'response' in result:
                return result['response']
            elif isinstance(result, str):
                return result
            else:
                return str(result)
        except Exception as e:
            raise Exception(f"Workflow analysis failed: {str(e)}")


class CoderAgent(BaseAgent):
    """Agent specialized in code generation and debugging"""
    
    def __init__(self):
        super().__init__(
            name="Coder Agent",
            model=settings.CODER_MODEL,
            description="Generates code, debugs issues, and provides technical solutions"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are a coding agent. Your role is to:
1. Generate clean, efficient, and RUNNABLE code.
2. Always include a small test call (e.g., print statements) at the bottom.
3. CRITICAL: The test call MUST use the EXACT function/variable names defined in your code. Double-check this.
4. Unless specifically asked for multiple files, prefer a single complete file for simplicity.
5. Provide complete, working solutions.

Write production-quality code with proper comments and structure."""
    
    async def generate_code(self, prompt: str) -> Dict[str, Any]:
        """Generate code based on user prompt"""
        try:
            result = await self.generate(prompt)
            
            # The result should already be a string from the base generate method
            if isinstance(result, dict) and 'response' in result:
                code_response = result['response']
            elif isinstance(result, str):
                code_response = result
            else:
                code_response = str(result)
            
            return {
                "response": code_response,
                "files": [],  # Will be parsed by code.py
                "instructions": None  # Will be extracted by code.py
            }
        except Exception as e:
            raise Exception(f"Code generation failed: {str(e)}")


class VisionAgent(BaseAgent):
    """Agent specialized in visual analysis of images and mockups"""
    
    def __init__(self):
        super().__init__(
            name="Vision Agent",
            model=settings.VISION_MODEL,
            description="Analyzes images, UI mockups, and visual data"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are a computer vision agent. Your role is to:
1. Describe images in detail
2. Analyze UI mockups and extract layout/styles
3. Identify objects, text, and patterns in visual data
4. Provide technical analysis of screenshots or diagrams

Be precise and descriptive about visual elements."""

    async def analyze_image(self, prompt: str, image_bytes: bytes) -> str:
        """Analyze image with prompt"""
        self.status = "busy"
        try:
            image_b64 = base64.b64encode(image_bytes).decode('utf-8')
            
            # Ollama vision request format
            result = await ollama_client.generate(
                model=self.model,
                prompt=prompt,
                images=[image_b64]
            )
            
            if isinstance(result, dict) and 'response' in result:
                return result['response']
            return str(result)
        finally:
            self.status = "idle"


class SearchAgent(BaseAgent):
    """Agent specialized in web searching and real-time information retrieval"""
    
    def __init__(self):
        super().__init__(
            name="Search Agent",
            model=settings.SEARCH_MODEL,
            description="Searches the web for real-time information"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are a web search agent. Your role is to:
1. Search the web for accurate, real-time information
2. Synthesize results from multiple sources
3. Provide citations and links where possible
4. Stay up-to-date with current events

Provide concise, factual answers based on search results."""

    async def search(self, query: str, max_results: int = 5) -> str:
        """Perform web search and return synthesized answer"""
        self.status = "busy"
        try:
            results = []
            
            # Step 1: Try default 'api' backend
            try:
                with DDGS() as ddgs:
                    results = list(ddgs.text(query, max_results=max_results))
            except Exception as e:
                print(f"Search API ratelimit or error, trying 'lite' fallback... {e}")
                await asyncio.sleep(1)  # Small delay before retry
                # Step 2: Fallback to 'lite' backend if api fails
                try:
                    with DDGS() as ddgs:
                        results = list(ddgs.text(query, backend="lite", max_results=max_results))
                except Exception as e2:
                    print(f"Search 'lite' fallback failed, trying 'html' final fallback... {e2}")
                    # Step 3: Final attempt with 'html' backend
                    try:
                        with DDGS() as ddgs:
                            results = list(ddgs.text(query, backend="html", max_results=max_results))
                    except Exception as e3:
                        print(f"All search backends failed: {e3}")
                        return f"Search failed after multiple attempts: {str(e3)}"
            
            if not results:
                return "No search results found."
            
            # Feed results to LLM for synthesis
            search_context = "\n\n".join([
                f"Source: {r['href']}\nTitle: {r['title']}\nSnippet: {r['body']}"
                for r in results
            ])
            
            prompt = f"Search Results:\n{search_context}\n\nTask: Synthesize the above results to answer: {query}"
            
            result = await self.generate(prompt)
            if isinstance(result, dict) and 'response' in result:
                return result['response']
            return str(result)
        finally:
            self.status = "idle"


class SqlAgent(BaseAgent):
    """Agent specialized in SQL query generation and execution"""
    
    def __init__(self):
        super().__init__(
            name="SQL Agent",
            model=settings.SQL_MODEL,
            description="Generates and executes SQL queries for data analysis"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are a database expert agent. Your role is to:
1. Write clean, efficient SQL queries
2. Analyze database schemas
3. Execute queries and interpret results
4. Handle data transformations and aggregations

Focus on data accuracy and security."""

    async def execute_query(self, query_or_goal: str) -> str:
        """Generate and execute SQL query"""
        self.status = "busy"
        try:
            # 1. Generate SQL if it's natural language
            if "select" not in query_or_goal.lower():
                prompt = f"System: Generate ONLY the SQL query for this goal: {query_or_goal}. Database type: SQLite. No and explaination, just the SQL code."
                sql_result = await self.generate(prompt)
                sql = sql_result['response'] if isinstance(sql_result, dict) else str(sql_result)
                # Clean markdown backticks if any
                sql = sql.replace("```sql", "").replace("```", "").strip()
            else:
                sql = query_or_goal

            # 2. Execute SQL
            async with SessionLocal() as session:
                result = await session.execute(text(sql))
                rows = result.mappings().all()
                
                if not rows:
                    return f"Query executed successfully. Result: Empty (0 rows).\nSQL: {sql}"
                
                # Format as readable text table or JSON
                return f"Query Results ({len(rows)} rows):\n{json.dumps([dict(r) for r in rows], indent=2)}\n\nSQL: {sql}"
        except Exception as e:
            return f"SQL Execution Failed: {str(e)}\nInput: {query_or_goal}"
        finally:
            self.status = "idle"

