"""
Coding API Endpoints
Handles code generation with integrated terminal
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import subprocess
import os
import tempfile
import shutil
import re
import asyncio

from app.core.agents import CoderAgent
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

# Initialize services
coder_agent = CoderAgent()


class GeneratedFile(BaseModel):
    filename: str
    content: str
    language: str


class CodeGenerationResult(BaseModel):
    files: List[GeneratedFile]
    instructions: Optional[str] = None


class CodeGenerationRequest(BaseModel):
    prompt: str


class CodeExecutionRequest(BaseModel):
    code: str
    language: str


class CommandExecutionRequest(BaseModel):
    command: str


class ExecutionResult(BaseModel):
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None


def parse_code_blocks(text: str) -> List[GeneratedFile]:
    """Extract code blocks from markdown-formatted text"""
    files = []
    lines = text.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Look for code block start with filename
        if line.startswith('```') and len(line) > 3:
            # Extract language and optionally filename
            parts = line[3:].strip().split()
            language = parts[0] if parts else 'text'
            
            # Check if next line is a comment with filename
            filename = None
            code_start = i + 1
            
            if code_start < len(lines):
                next_line = lines[code_start].strip()
                if next_line.startswith('#') or next_line.startswith('//'):
                    # Try to extract filename from comment
                    comment = next_line.lstrip('#').lstrip('/').strip()
                    if any(ext in comment for ext in ['.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php', '.html', '.css']):
                        filename = comment
                        code_start += 1
            
            # Default filename if not found
            if not filename:
                ext_map = {
                    'python': 'py',
                    'javascript': 'js',
                    'typescript': 'ts',
                    'java': 'java',
                    'cpp': 'cpp',
                    'c': 'c',
                    'go': 'go',
                    'rust': 'rs',
                    'ruby': 'rb',
                    'php': 'php',
                    'html': 'html',
                    'css': 'css'
                }
                ext = ext_map.get(language, 'txt')
                filename = f"code.{ext}"
            
            # Extract code content
            code_lines = []
            i = code_start
            
            while i < len(lines):
                if lines[i].strip() == '```':
                    break
                code_lines.append(lines[i])
                i += 1
            
            if code_lines:
                content = '\n'.join(code_lines)
                files.append(GeneratedFile(
                    filename=filename,
                    content=content,
                    language=language
                ))
        
        i += 1
    
    return files


def extract_instructions(text: str) -> str:
    """Extract setup/run instructions from generated text"""
    instructions = []
    lines = text.split('\n')
    
    in_instruction_block = False
    
    for line in lines:
        lower = line.lower().strip()
        
        # Look for instruction headers
        if any(keyword in lower for keyword in [
            'how to run', 'to run', 'setup', 'installation',
            'requirements', 'dependencies', 'usage', 'execution',
            'getting started', 'quick start'
        ]):
            in_instruction_block = True
            instructions.append(line)
            continue
        
        # Add lines if we're in an instruction block
        if in_instruction_block:
            if line.strip() and not line.strip().startswith('```'):
                instructions.append(line)
            elif line.strip().startswith('```'):
                break
    
    return '\n'.join(instructions).strip() if instructions else None


@router.post("/generate", response_model=CodeGenerationResult)
async def generate_code(
    request: CodeGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate code files based on user prompt
    """
    try:
        prompt = f"""
Generate complete, production-ready code for the following requirement:

{request.prompt}

IMPORTANT FORMAT INSTRUCTIONS:
1. Create separate code blocks for each file
2. Start each code block with ```language (e.g., ```python, ```javascript)
3. Put the filename as a comment on the first line of each code block
4. End each code block with ```
5. Include all necessary files (main code, tests, config, etc.)
6. After all code blocks, provide clear instructions on:
   - How to install dependencies
   - How to run the code
   - What to expect as output

Example format:
```python
# main.py
def hello():
    print("Hello World")
```

```python
# test.py
import main
main.hello()
```

How to run:
1. Install Python 3.8+
2. Run: python main.py
3. Expected output: Hello World

Now generate the code:
"""
        
        result = await coder_agent.generate(prompt)
        
        # Extract response text from Ollama result
        if isinstance(result, dict) and 'response' in result:
            response_text = result['response']
        elif isinstance(result, str):
            response_text = result
        else:
            response_text = str(result)
        
        # Parse the result
        files = parse_code_blocks(response_text)
        
        # If no files were parsed, try to detect code in the response
        if not files:
            # Assume the entire response is code
            lines = response_text.split('\n')
            if lines:
                # Try to detect language from content
                content = response_text
                
                # Strip common test runner outputs injected by LLMs at the bottom of code responses
                # e.g. "==== 6 passed ===="
                content = re.sub(r'={3,}.*?passed.*?={3,}', '', content, flags=re.IGNORECASE|re.DOTALL)
                
                # Strip trailing non-code conversational phrases
                phrases = ['Here is', 'Note:', 'This code', 'Expected output', 'Output:']
                for phrase in phrases:
                    content = re.split(rf'^{phrase}', content, flags=re.IGNORECASE|re.MULTILINE)[0]
                
                content = content.strip()
                language = 'python'  # default
                
                if 'import ' in content or 'def ' in content:
                    language = 'python'
                elif 'function ' in content or 'const ' in content or 'let ' in content:
                    language = 'javascript'
                elif 'class ' in content and '{' in content:
                    language = 'java'
                
                ext_map = {
                    'python': 'py',
                    'javascript': 'js',
                    'typescript': 'ts',
                    'java': 'java'
                }
                
                files = [GeneratedFile(
                    filename=f"code.{ext_map.get(language, 'txt')}",
                    content=content,
                    language=language
                )]
        
        instructions = extract_instructions(response_text)
        
        return CodeGenerationResult(
            files=files,
            instructions=instructions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute", response_model=ExecutionResult)
async def execute_code(
    request: CodeExecutionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Execute code in a sandboxed environment
    """
    try:
        # Create temp directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Determine file extension
            ext_map = {
                'python': 'py',
                'javascript': 'js',
                'typescript': 'ts',
                'java': 'java',
                'cpp': 'cpp',
                'c': 'c',
                'go': 'go',
                'rust': 'rs',
                'ruby': 'rb',
                'php': 'php'
            }
            
            lang = request.language.lower().strip()
            ext = ext_map.get(lang, 'txt')
            
            # Detect multi-file bundle via markers injected by frontend
            # Pattern matches lines like "# FILE: main.py" or "// FILE: utils.js"
            file_blocks = re.split(r'^(?:#|//)\s*FILE:\s*([\w\.-]+)\s*$', request.code, flags=re.MULTILINE)
            
            entry_file = f"code.{ext}"
            
            if len(file_blocks) > 1:
                # First block is preamble text before any file marker (usually empty)
                # Subsequent blocks are pairs of (filename, content)
                for i in range(1, len(file_blocks), 2):
                    fname = file_blocks[i]
                    fcontent = file_blocks[i+1].strip()
                    with open(os.path.join(temp_dir, fname), 'w') as fh:
                        fh.write(fcontent)
                
                # Determine entry point
                filenames = file_blocks[1::2]
                if 'main.py' in filenames: entry_file = 'main.py'
                elif f"code.{ext}" in filenames: entry_file = f"code.{ext}"
                else: entry_file = filenames[-1] # Fallback to last file
            else:
                # Single file fallback
                with open(os.path.join(temp_dir, entry_file), 'w') as fh:
                    fh.write(request.code)
            
            file_path = os.path.join(temp_dir, entry_file)
            
            # Execute based on language
            cmd = None
            
            if lang == 'python':
                cmd = ['python', file_path]
            elif lang in ['javascript', 'js']:
                cmd = ['node', file_path]
            elif lang == 'java':
                cmd = ['java', '-cp', temp_dir, 'Code']
            elif lang == 'go':
                cmd = ['go', 'run', file_path]
            elif lang == 'ruby':
                cmd = ['ruby', file_path]
            elif lang == 'php':
                cmd = ['php', file_path]
            else:
                return ExecutionResult(
                    success=False,
                    error=f"Unsupported language: {request.language}"
                )

            # Run the command in a separate thread to avoid Windows asyncio issues
            try:
                # Handle Java compilation separately
                if lang == 'java':
                    compile_proc = await asyncio.to_thread(
                        subprocess.run,
                        ['javac', file_path],
                        cwd=temp_dir,
                        capture_output=True,
                        text=True,
                        timeout=15
                    )
                    if compile_proc.returncode != 0:
                        return ExecutionResult(
                            success=False,
                            error=f"Compilation error:\n{compile_proc.stderr}"
                        )
                
                # Execute main command
                print(f"[CODE EXEC] Running: {' '.join(cmd)} in {temp_dir}")
                def run_main():
                    return subprocess.run(
                        cmd,
                        cwd=temp_dir,
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                
                # Execute in thread
                result = await asyncio.to_thread(run_main)
                
                stdout = result.stdout
                stderr = result.stderr
                
                if result.returncode == 0:
                    print(f"[CODE EXEC] Success: {len(stdout)} chars output")
                    return ExecutionResult(
                        success=True,
                        output=stdout
                    )
                else:
                    print(f"[CODE EXEC] Failed: {len(stderr)} chars error")
                    err_msg = stderr or f"Process exited with code {result.returncode}"
                    return ExecutionResult(
                        success=False,
                        output=stdout,
                        error=err_msg
                    )
            except subprocess.TimeoutExpired:
                return ExecutionResult(
                    success=False,
                    error="Execution timed out (30 seconds)"
                )
    
    except Exception as e:
        print(f"[CODE EXEC] Internal Exception: {str(e)}")
        import traceback
        tb = traceback.format_exc()
        print(tb)
        # Write to a debug file we can read
        try:
            with open("code_exec_error.txt", "w") as f_err:
                f_err.write(f"Error: {str(e)}\n\nTraceback:\n{tb}")
        except:
            pass
            
        return ExecutionResult(
            success=False,
            error=f"Internal Server Error: {str(e)}"
        )


@router.post("/command", response_model=ExecutionResult)
async def run_command(
    request: CommandExecutionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Run a shell command (sandboxed)
    """
    try:
        # Only allow safe commands
        safe_commands = [
            'ls', 'dir', 'pwd', 'echo', 'cat', 'head', 'tail',
            'python', 'node', 'npm', 'pip', 'git', 'java', 'javac',
            'go', 'ruby', 'php', 'gcc', 'g++', 'rustc', 'cargo'
        ]
        
        cmd_parts = request.command.split()
        if not cmd_parts:
            return ExecutionResult(
                success=False,
                error="Empty command"
            )
        
        base_cmd = cmd_parts[0]
        
        # Check if command is safe
        if not any(base_cmd == safe or base_cmd.startswith(safe) for safe in safe_commands):
            return ExecutionResult(
                success=False,
                error=f"Command '{base_cmd}' is not allowed for security reasons"
            )
        
            try:
                def run_shell():
                    return subprocess.run(
                        request.command,
                        cwd=temp_dir,
                        shell=True,
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                
                result = await asyncio.to_thread(run_shell)
                
                return ExecutionResult(
                    success=result.returncode == 0,
                    output=result.stdout,
                    error=result.stderr if result.returncode != 0 else None
                )
            except subprocess.TimeoutExpired:
                return ExecutionResult(
                    success=False,
                    error="Command timed out (30 seconds)"
                )
    
    except Exception as e:
        return ExecutionResult(
            success=False,
            error=str(e)
        )


@router.post("/save")
async def save_file(
    filename: str,
    content: str,
    current_user: User = Depends(get_current_user)
):
    """
    Save a file to user's workspace (future feature)
    """
    # TODO: Implement user workspace file storage
    return {"status": "File saving not yet implemented"}
