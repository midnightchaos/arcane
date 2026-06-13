import { create } from 'zustand';
import { AuthState, User } from '@/types';
import { authService } from '@/services/authService';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  setUser: (user: User, token: string) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (user: User) => {
    set({ user });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }
    try {
      const user = await authService.getMe();
      set({ user, token, isAuthenticated: true });
    } catch (err) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  login: async (email: string, password: string) => {
    const { user, token } = await authService.login(email, password);
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (email: string, password: string, username: string) => {
    await authService.register(email, password, username);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('arcane-theme');
    document.body.setAttribute('data-theme', 'dark');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
