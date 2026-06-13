import api from './api';

export interface GeneratedFile {
  filename: string;
  content: string;
  language: string;
}

export interface CodeGenerationResult {
  files: GeneratedFile[];
  instructions?: string;
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
}

class CodingService {
  async generateCode(prompt: string): Promise<CodeGenerationResult> {
    const response = await api.post('/coding/generate', { prompt });
    return response.data;
  }

  async executeCode(code: string, language: string): Promise<ExecutionResult> {
    const response = await api.post('/coding/execute', { code, language });
    return response.data;
  }

  async runCommand(command: string): Promise<ExecutionResult> {
    const response = await api.post('/coding/command', { command });
    return response.data;
  }

  async saveFile(filename: string, content: string): Promise<void> {
    await api.post('/coding/save', { filename, content });
  }
}

export const codingService = new CodingService();
