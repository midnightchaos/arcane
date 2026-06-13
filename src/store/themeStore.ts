import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'default' | 'pinkish' | 'light' | 'minimal';

interface ThemeState {
    currentTheme: Theme;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            currentTheme: 'default',
            setTheme: (theme: Theme) => {
                set({ currentTheme: theme });
                document.body.setAttribute('data-theme', theme);
            },
        }),
        {
            name: 'arcane-theme',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    document.body.setAttribute('data-theme', state.currentTheme);
                }
            },
        }
    )
);
