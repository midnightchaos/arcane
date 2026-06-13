import apiClient from './api';
import { User } from '@/types';

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async register(email: string, password: string, username: string): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', {
      email,
      password,
      username,
    });
    return response.data;
  },

  async updateProfile(data: any): Promise<User> {
    const response = await apiClient.patch<User>('/auth/profile', data);
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    const response = await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },

  async deleteAccount(password: string): Promise<any> {
    const response = await apiClient.post('/auth/delete-account', { password });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
