'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const THEMES = {
    light: { name: 'Claro', color: '#ffffff', class: 'light' },
    dark: { name: 'Oscuro', color: '#09090b', class: 'dark' },
};

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState('light');

    const updateThemeColor = (newTheme) => {
        if (typeof document === 'undefined') return;

        const themeConfig = THEMES[newTheme] || THEMES.light;
        const color = themeConfig.color;

        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.setAttribute('content', color);
    };

    const setTheme = (newTheme) => {
        if (newTheme !== 'light' && newTheme !== 'dark') return;
        setThemeState(newTheme);
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', newTheme);
        }
        if (typeof window !== 'undefined') {
            try { localStorage.setItem('theme', newTheme); } catch { /* ignore */ }
        }
        updateThemeColor(newTheme);
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // Restaura preferencia guardada (o tema del sistema). Default: claro.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        let initial = 'light';
        try {
            const stored = localStorage.getItem('theme');
            if (stored === 'light' || stored === 'dark') {
                initial = stored;
            } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
                initial = 'dark';
            }
        } catch { /* ignore */ }
        setThemeState(initial);
        document.documentElement.setAttribute('data-theme', initial);
        updateThemeColor(initial);
    }, []);


    const value = {
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
        availableThemes: THEMES
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
