"""
Ollama Client Wrapper
Provides a unified interface to interact with Ollama LLMs
"""
import httpx
from typing import AsyncGenerator, Optional, Dict, Any
from app.config import settings

class OllamaClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.client = httpx.AsyncClient(timeout=120.0)
    
    async def generate(
        self,
        model: str,
        prompt: str,
        stream: bool = False,
        context: Optional[list] = None,
        options: Optional[Dict[str, Any]] = None
    ):
        """Generate response from Ollama"""
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": stream
        }
        
        if context:
            payload["context"] = context
        if options:
            payload["options"] = options
        
        if stream:
            return self._stream_generate(url, payload)
        else:
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
    
    async def _stream_generate(self, url: str, payload: dict) -> AsyncGenerator[str, None]:
        """Stream response from Ollama"""
        async with self.client.stream("POST", url, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line:
                    import json
                    try:
                        chunk = json.loads(line)
                        if "response" in chunk:
                            yield chunk["response"]
                        if chunk.get("done", False):
                            break
                    except json.JSONDecodeError:
                        continue
    
    async def chat(
        self,
        model: str,
        messages: list,
        stream: bool = False,
        options: Optional[Dict[str, Any]] = None
    ):
        """Chat with Ollama using message format"""
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream
        }
        
        if options:
            payload["options"] = options
        
        if stream:
            return self._stream_chat(url, payload)
        else:
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
    
    async def _stream_chat(self, url: str, payload: dict) -> AsyncGenerator[str, None]:
        """Stream chat response from Ollama"""
        async with self.client.stream("POST", url, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line:
                    import json
                    try:
                        chunk = json.loads(line)
                        if "message" in chunk and "content" in chunk["message"]:
                            yield chunk["message"]["content"]
                        if chunk.get("done", False):
                            break
                    except json.JSONDecodeError:
                        continue
    
    async def list_models(self):
        """List available Ollama models"""
        url = f"{self.base_url}/api/tags"
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
        except Exception as e:
            print(f"Error listing models: {e}")
            return []
    
    async def check_connection(self) -> bool:
        """Check if Ollama is running and accessible"""
        try:
            await self.list_models()
            return True
        except Exception:
            return False
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

# Global instance
ollama_client = OllamaClient()
