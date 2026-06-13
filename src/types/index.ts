export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  theme_preference: string;
  notifications_enabled: boolean;
  privacy_level: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export interface Agent {
  id: string;
  name: string;
  type: 'reasoner' | 'coder' | 'planner' | 'orchestrator';
  model: string;
  status: 'idle' | 'busy' | 'error';
  description: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentType?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  agentType: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemStatus {
  ollamaConnected: boolean;
  activeAgents: number;
  memoryUsage: number;
  uptime: number;
  availableModels: string[];
}

export interface WorkflowStep {
  agent: string;
  instruction: string;
}

export interface WorkflowConfig {
  steps?: WorkflowStep[];
  agents?: WorkflowStep[];
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
  startedAt: Date;
  completedAt?: Date;
  executionLog?: any[];
}
