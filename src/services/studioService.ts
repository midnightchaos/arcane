import api from './api';

export interface PipelineInfo {
    id: string;
    name: string;
    description: string;
    nodeCount: number;
    hasSchedule?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PipelineDetail {
    id: string;
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
    nodeConfigs: Record<string, any>;
    schedule?: any;
    createdAt: string;
    updatedAt: string;
}

export interface AgentExecuteRequest {
    agent_type: string;
    prompt: string;
    system_prompt?: string;
}

export interface AgentExecuteResponse {
    agent_type: string;
    result: string;
    success: boolean;
    error?: string;
}

export interface VisionExecuteResponse {
    agent_type: string;
    result: string;
    success: boolean;
    error?: string;
}

const studioService = {
    // Pipeline CRUD
    async savePipeline(payload: {
        name: string;
        description?: string;
        nodes: any[];
        edges: any[];
        nodeConfigs: Record<string, any>;
        schedule?: any;
    }): Promise<PipelineInfo> {
        const r = await api.post('/studio/pipelines', payload);
        return r.data;
    },

    async updatePipeline(id: string, payload: {
        name: string;
        description?: string;
        nodes: any[];
        edges: any[];
        nodeConfigs: Record<string, any>;
        schedule?: any;
    }): Promise<PipelineInfo> {
        const r = await api.put(`/studio/pipelines/${id}`, payload);
        return r.data;
    },

    async listPipelines(): Promise<PipelineInfo[]> {
        const r = await api.get('/studio/pipelines');
        return r.data;
    },

    async getPipeline(id: string): Promise<PipelineDetail> {
        const r = await api.get(`/studio/pipelines/${id}`);
        return r.data;
    },

    async deletePipeline(id: string): Promise<void> {
        await api.delete(`/studio/pipelines/${id}`);
    },

    // Agent execution
    async executeAgent(params: AgentExecuteRequest): Promise<AgentExecuteResponse> {
        try {
            const response = await api.post('/studio/agents/execute', params);
            return response.data;
        } catch (error: any) {
            return { agent_type: params.agent_type, result: '', success: false, error: error.message };
        }
    },

    async executeVision(prompt: string, file: File): Promise<VisionExecuteResponse> {
        try {
            // Helper to convert File to base64
            const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(f);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
            });

            const base64 = await toBase64(file);
            const response = await api.post<VisionExecuteResponse>('/studio/agents/vision', {
                prompt,
                image_base64: base64
            });
            return response.data;
        } catch (error: any) {
            return { agent_type: 'vision', result: '', success: false, error: error.message };
        }
    },

    async executeSearch(query: string): Promise<AgentExecuteResponse> {
        try {
            const response = await api.post<AgentExecuteResponse>('/studio/agents/search', { query });
            return response.data;
        } catch (error: any) {
            return { agent_type: 'search', result: '', success: false, error: error.message };
        }
    },

    async executeSql(query: string): Promise<AgentExecuteResponse> {
        try {
            const response = await api.post<AgentExecuteResponse>('/studio/agents/sql', { query });
            return response.data;
        } catch (error: any) {
            return { agent_type: 'sqlAgent', result: '', success: false, error: error.message };
        }
    },

    async executeRag(prompt: string, namespace?: string): Promise<AgentExecuteResponse> {
        try {
            const response = await api.post<AgentExecuteResponse>('/studio/agents/rag', { prompt, namespace });
            return response.data;
        } catch (error: any) {
            return { agent_type: 'chronicler', result: '', success: false, error: error.message };
        }
    },

    // Code generation (Coder block)
    async generateCode(prompt: string): Promise<any> {
        const r = await api.post('/coding/generate', { prompt });
        return r.data;
    },

    // Code execution (Execution block)
    async executeCode(code: string, language: string) {
        const r = await api.post('/coding/execute', { code, language });
        return r.data;
    },

    // PDF extraction (PDF Input block)
    async extractPdf(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const r = await api.post('/pdf/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return r.data;
    },

    // Headless Execution Logs
    async getPipelineRuns(pipelineId: string): Promise<Array<{ filename: string; timestamp: string; size: number }>> {
        const response = await api.get(`/studio/pipelines/${pipelineId}/runs`);
        return response.data;
    },

    async getRunContent(pipelineId: string, filename: string): Promise<{ filename: string; content: string }> {
        const response = await api.get(`/studio/pipelines/${pipelineId}/runs/${filename}`);
        return response.data;
    },

    async getScheduledPipelines(): Promise<Array<{
        id: string;
        name: string;
        description: string;
        nodeCount: number;
        schedule: { type: string; interval?: string; cron?: string; active: boolean; last_run?: string };
        createdAt: string;
        updatedAt: string;
        last_run?: string;
        node_types: string[];
    }>> {
        const response = await api.get('/studio/scheduled');
        return response.data;
    },

    async executePipeline(id: string): Promise<any> {
        const response = await api.post(`/studio/pipelines/${id}/execute`);
        return response.data;
    },
    
    async deleteSchedule(id: string): Promise<void> {
        await api.delete(`/studio/pipelines/${id}/schedule`);
    },

    async toggleSchedule(id: string, active: boolean): Promise<void> {
        await api.post(`/studio/pipelines/${id}/schedule/toggle`, null, { params: { active } });
    },
    
    async deleteRunLog(pipelineId: string, filename: string): Promise<void> {
        await api.delete(`/studio/pipelines/${pipelineId}/runs/${filename}`);
    }
};

export default studioService;
