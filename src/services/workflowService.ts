import api from './api';

export interface WorkflowStep {
  agent: string;
  instruction: string;
}

export interface WorkflowAgentConfig {
  agent: string;
  instruction: string;
}

export interface WorkflowConfig {
  steps?: WorkflowStep[];
  agents?: WorkflowAgentConfig[];
  combiner?: string;
  combine_instruction?: string;
  evaluator?: string;
  evaluation_prompt?: string;
  branches?: Record<string, WorkflowStep[]>;
  default_branch?: string;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  workflowType: 'sequential' | 'parallel' | 'conditional';
  config: WorkflowConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  inputData?: string;
  outputData?: string;
  errorMessage?: string;
  startedAt: string;  // Changed to string for proper API deserialization
  completedAt?: string;  // Changed to string
  executionLog?: any[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  workflowType: 'sequential' | 'parallel' | 'conditional';
  config: WorkflowConfig;
}

class WorkflowService {
  async getWorkflows(): Promise<Workflow[]> {
    const response = await api.get('/workflows/list');
    return response.data;
  }

  async getWorkflow(workflowId: string): Promise<Workflow> {
    const response = await api.get(`/workflows/${workflowId}`);
    return response.data;
  }

  async createWorkflow(
    name: string,
    description: string,
    workflowType: 'sequential' | 'parallel' | 'conditional',
    config: WorkflowConfig
  ): Promise<Workflow> {
    const response = await api.post('/workflows/create', {
      name,
      description,
      workflowType,
      config,
    });
    return response.data;
  }

  async updateWorkflow(
    workflowId: string,
    updates: {
      name?: string;
      description?: string;
      config?: WorkflowConfig;
      isActive?: boolean;
    }
  ): Promise<Workflow> {
    const response = await api.put(`/workflows/${workflowId}`, updates);
    return response.data;
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    await api.delete(`/workflows/${workflowId}`);
  }

  async executeWorkflow(workflowId: string, input: string): Promise<WorkflowExecution> {
    const response = await api.post('/workflows/execute', {
      workflowId,
      input,
    });
    return response.data;
  }

  async executeWorkflowStream(
    workflowId: string,
    input: string,
    onProgress: (update: any) => void
  ): Promise<void> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/workflows/execute/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          workflowId,
          input,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to execute workflow: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onProgress(data);
              
              // Stop reading if we get a complete or error message
              if (data.type === 'complete' || data.type === 'error') {
                await reader.cancel();
                return;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream reading error:', error);
      throw new Error('Error reading execution stream');
    } finally {
      reader.releaseLock();
    }
  }

  async getWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]> {
    const response = await api.get(`/workflows/${workflowId}/executions`);
    return response.data;
  }

  async getTemplates(): Promise<WorkflowTemplate[]> {
    const response = await api.get('/workflows/templates/list');
    return response.data;
  }

  async createFromTemplate(templateId: string, name?: string): Promise<Workflow> {
    const templates = await this.getTemplates();
    const template = templates.find((t) => t.id === templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    return this.createWorkflow(
      name || template.name,
      template.description,
      template.workflowType,
      template.config
    );
  }

  async createCustomWorkflow(prompt: string): Promise<Workflow> {
    const response = await api.post('/workflows/create-custom', { prompt });
    return response.data;
  }
}

export const workflowService = new WorkflowService();
