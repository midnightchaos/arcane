import apiClient from './api';
import { Message, ChatSession } from '@/types';

// Helper function to safely parse dates
const parseDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  try {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  } catch {
    return new Date();
  }
};

// Helper function to normalize session data from API
const normalizeSession = (session: any): ChatSession => {
  return {
    id: session.id || '',
    userId: session.userId || session.user_id || '',
    agentType: session.agentType || session.agent_type || 'reasoner',
    messages: Array.isArray(session.messages) 
      ? session.messages.map(normalizeMessage)
      : [],
    createdAt: parseDate(session.createdAt || session.created_at),
    updatedAt: parseDate(session.updatedAt || session.updated_at),
  };
};

// Helper function to normalize message data from API
const normalizeMessage = (message: any): Message => {
  return {
    id: message.id || Date.now().toString(),
    role: message.role || 'user',
    content: message.content || '',
    timestamp: parseDate(message.timestamp),
    agentType: message.agentType || message.agent_type,
  };
};

export const chatService = {
  async sendMessage(sessionId: string, message: string, agentType: string): Promise<Message> {
    try {
      const response = await apiClient.post<any>('/chat/send', {
        sessionId,
        message,
        agentType,
      });
      return normalizeMessage(response.data);
    } catch (error: any) {
      console.error('Send message error:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to send message');
    }
  },

  async streamMessage(
    sessionId: string,
    message: string,
    agentType: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000/api';
      
      const response = await fetch(`${baseURL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionId, message, agentType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          onChunk(chunk);
        }
      }
    } catch (error: any) {
      console.error('Stream error:', error);
      throw error;
    }
  },

  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const response = await apiClient.get<any[]>('/chat/sessions');
      return (response.data || []).map(normalizeSession);
    } catch (error: any) {
      console.error('Get sessions error:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to load chat sessions');
    }
  },

  async createSession(agentType: string): Promise<ChatSession> {
    try {
      const response = await apiClient.post<any>('/chat/sessions', { agentType });
      return normalizeSession(response.data);
    } catch (error: any) {
      console.error('Create session error:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to create session');
    }
  },

  async getSession(sessionId: string): Promise<ChatSession> {
    try {
      const response = await apiClient.get<any>(`/chat/sessions/${sessionId}`);
      return normalizeSession(response.data);
    } catch (error: any) {
      console.error('Get session error:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to load session');
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`/chat/sessions/${sessionId}`);
    } catch (error: any) {
      console.error('Delete session error:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to delete session');
    }
  },

  async deleteAllSessions(): Promise<void> {
    try {
      await apiClient.delete('/chat/sessions');
    } catch (error: any) {
      console.error('Delete all sessions error:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to delete all sessions');
    }
  },
};
