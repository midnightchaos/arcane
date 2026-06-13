/**
 * Workflow Type Definitions
 * Defines the structure for multi-agent workflows
 */

export type AgentType = 
  | 'reasoner' 
  | 'coder' 
  | 'planner' 
  | 'analyst' 
  | 'memory' 
  | 'tool' 
  | 'executor';

export type WorkflowType = 'sequential' | 'parallel' | 'conditional';

export type WorkflowStatus = 
  | 'draft' 
  | 'ready' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'paused';

export interface WorkflowStep {
  id: string;
  agentType: AgentType;
  name: string;
  description?: string;
  prompt?: string;
  useOutputFrom?: string; // ID of previous step to use output from
  conditions?: WorkflowCondition[];
  order: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'contains' | 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  value: string;
  nextStepId: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  type: WorkflowType;
  steps: WorkflowStep[];
  userId: string;
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  tags?: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  currentStepId?: string;
  startedAt: Date;
  completedAt?: Date;
  input: string;
  outputs: Record<string, string>; // stepId -> output
  errors: Record<string, string>; // stepId -> error
  metadata?: Record<string, any>;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  type: WorkflowType;
  steps: Omit<WorkflowStep, 'id' | 'status' | 'output' | 'error'>[];
  icon: string;
  category: string;
}
