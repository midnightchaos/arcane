"""
File Manager for Workflow Results
Saves workflow execution results to local text files
"""
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import json


class FileManager:
    """Manages file operations for workflow results"""
    
    def __init__(self, base_dir: str = "workflow_results"):
        """
        Initialize file manager
        
        Args:
            base_dir: Base directory for storing workflow results
        """
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
    
    def sanitize_filename(self, name: str) -> str:
        """
        Sanitize filename to remove invalid characters
        
        Args:
            name: Original filename
            
        Returns:
            Sanitized filename
        """
        # Replace invalid characters with underscores
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            name = name.replace(char, '_')
        
        # Remove leading/trailing spaces and dots
        name = name.strip('. ')
        
        # Limit length
        if len(name) > 200:
            name = name[:200]
        
        return name or "unnamed"
    
    def create_workflow_folder(self, workflow_name: str, workflow_id: str) -> Path:
        """
        Create a folder for workflow results
        
        Args:
            workflow_name: Name of the workflow
            workflow_id: ID of the workflow
            
        Returns:
            Path to the workflow folder
        """
        folder_name = self.sanitize_filename(workflow_name)
        workflow_folder = self.base_dir / f"{folder_name}_{workflow_id[:8]}"
        workflow_folder.mkdir(exist_ok=True)
        
        return workflow_folder
    
    def save_execution_result(
        self,
        workflow_name: str,
        workflow_id: str,
        execution_id: str,
        input_data: str,
        output_data: str,
        agent_outputs: list,
        execution_log: list,
        status: str,
        error_message: Optional[str] = None
    ) -> str:
        """
        Save workflow execution result to a text file
        
        Args:
            workflow_name: Name of the workflow
            workflow_id: ID of the workflow
            execution_id: ID of the execution
            input_data: Input prompt/question
            output_data: Final output result
            agent_outputs: List of individual agent outputs
            execution_log: Execution log entries
            status: Execution status
            error_message: Error message if failed
            
        Returns:
            Path to the saved file
        """
        # Create workflow folder
        workflow_folder = self.create_workflow_folder(workflow_name, workflow_id)
        
        # Create filename with timestamp
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"execution_{timestamp}_{execution_id[:8]}.txt"
        filepath = workflow_folder / filename
        
        # Build file content
        content_lines = []
        
        # Header
        content_lines.append("=" * 80)
        content_lines.append(f"WORKFLOW EXECUTION RESULT")
        content_lines.append("=" * 80)
        content_lines.append(f"Workflow Name: {workflow_name}")
        content_lines.append(f"Workflow ID: {workflow_id}")
        content_lines.append(f"Execution ID: {execution_id}")
        content_lines.append(f"Status: {status.upper()}")
        content_lines.append(f"Timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        content_lines.append("=" * 80)
        content_lines.append("")
        
        # Input section
        content_lines.append("-" * 80)
        content_lines.append("INPUT / QUESTION")
        content_lines.append("-" * 80)
        content_lines.append(input_data)
        content_lines.append("")
        
        # Agent outputs section
        if agent_outputs:
            content_lines.append("-" * 80)
            content_lines.append("AGENT OUTPUTS")
            content_lines.append("-" * 80)
            
            for i, agent_output in enumerate(agent_outputs, 1):
                agent_name = agent_output.get('agent', 'Unknown Agent')
                instruction = agent_output.get('instruction', 'N/A')
                output = agent_output.get('output_preview', agent_output.get('output', 'No output'))
                agent_status = agent_output.get('status', 'unknown')
                
                content_lines.append(f"\n[Agent {i}: {agent_name.upper()}]")
                content_lines.append(f"Instruction: {instruction}")
                content_lines.append(f"Status: {agent_status}")
                content_lines.append(f"Output:")
                content_lines.append(output)
                content_lines.append("-" * 40)
        
        content_lines.append("")
        
        # Final result section
        content_lines.append("-" * 80)
        content_lines.append("FINAL RESULT")
        content_lines.append("-" * 80)
        
        if status == "completed" and output_data:
            content_lines.append(output_data)
        elif error_message:
            content_lines.append(f"ERROR: {error_message}")
        else:
            content_lines.append("No final result available")
        
        content_lines.append("")
        
        # Execution log section (optional, for debugging)
        if execution_log:
            content_lines.append("-" * 80)
            content_lines.append("EXECUTION LOG (DETAILED)")
            content_lines.append("-" * 80)
            
            for log_entry in execution_log:
                if isinstance(log_entry, dict):
                    # Format log entry nicely
                    for key, value in log_entry.items():
                        content_lines.append(f"{key}: {value}")
                    content_lines.append("-" * 40)
                else:
                    content_lines.append(str(log_entry))
            
            content_lines.append("")
        
        # Footer
        content_lines.append("=" * 80)
        content_lines.append("END OF EXECUTION RESULT")
        content_lines.append("=" * 80)
        
        # Write to file
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write('\n'.join(content_lines))
            
            return str(filepath)
        except Exception as e:
            print(f"Error saving execution result to file: {e}")
            raise
    
    def save_json_result(
        self,
        workflow_name: str,
        workflow_id: str,
        execution_id: str,
        data: Dict[str, Any]
    ) -> str:
        """
        Save execution result as JSON (alternative format)
        
        Args:
            workflow_name: Name of the workflow
            workflow_id: ID of the workflow
            execution_id: ID of the execution
            data: Complete execution data
            
        Returns:
            Path to the saved file
        """
        # Create workflow folder
        workflow_folder = self.create_workflow_folder(workflow_name, workflow_id)
        
        # Create filename with timestamp
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"execution_{timestamp}_{execution_id[:8]}.json"
        filepath = workflow_folder / filename
        
        # Write to file
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, default=str)
            
            return str(filepath)
        except Exception as e:
            print(f"Error saving JSON result to file: {e}")
            raise
    
    def get_workflow_results_folder(self, workflow_name: str, workflow_id: str) -> str:
        """
        Get the path to a workflow's results folder
        
        Args:
            workflow_name: Name of the workflow
            workflow_id: ID of the workflow
            
        Returns:
            Path to the workflow folder
        """
        folder_name = self.sanitize_filename(workflow_name)
        workflow_folder = self.base_dir / f"{folder_name}_{workflow_id[:8]}"
        
        return str(workflow_folder)
    
    def list_execution_files(self, workflow_name: str, workflow_id: str) -> list:
        """
        List all execution result files for a workflow
        
        Args:
            workflow_name: Name of the workflow
            workflow_id: ID of the workflow
            
        Returns:
            List of file paths
        """
        workflow_folder = self.create_workflow_folder(workflow_name, workflow_id)
        
        if not workflow_folder.exists():
            return []
        
        # Get all .txt and .json files
        txt_files = list(workflow_folder.glob("execution_*.txt"))
        json_files = list(workflow_folder.glob("execution_*.json"))
        
        all_files = sorted(txt_files + json_files, key=lambda x: x.stat().st_mtime, reverse=True)
        
        return [str(f) for f in all_files]


# Global file manager instance
file_manager = FileManager()
