'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const THEMES = {
    light: { name: 'Light', color: '#ffffff', class: 'light' },
    dark: { name: 'Dark', color: '#09090b', class: 'dark' },
    vinoplastic: { name: 'Blue', color: '#eef2ff', class: 'vinoplastic' },
    forest: { name: 'Forest', color: '#f0fdf4', class: 'forest' },
    ocean: { name: 'Ocean', color: '#f0f9ff', class: 'ocean' },
    sunset: { name: 'Sunset', color: '#fff7ed', class: 'sunset' },
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
        if (!THEMES[newTheme]) return;

        setThemeState(newTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
        }
        updateThemeColor(newTheme);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedTheme = localStorage.getItem('theme') || 'light';
        const effectiveTheme = THEMES[savedTheme] ? savedTheme : 'light';

        setThemeState(effectiveTheme);
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        updateThemeColor(effectiveTheme);
    }, []);

    const toggleTheme = () => {
        // Simple toggle for header button (cycling or just light/dark)
        // For advanced selection we will use setTheme directly
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

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
