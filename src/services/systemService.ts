import apiClient from './api';
import { SystemStatus, Agent } from '@/types';

export const systemService = {
  async getStatus(): Promise<SystemStatus> {
    const response = await apiClient.get<SystemStatus>('/system/status');
    return response.data;
  },

  async getAgents(): Promise<Agent[]> {
    const response = await apiClient.get<Agent[]>('/agents/list');
    return response.data;
  },

  async getAgentStatus(agentId: string): Promise<Agent> {
    const response = await apiClient.get<Agent>(`/agents/${agentId}/status`);
    return response.data;
  },
};
