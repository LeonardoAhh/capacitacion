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

    const setTheme = (_newTheme) => {
        // Desactivado temporalmente — el cambio de tema está bloqueado
    };

    const toggleTheme = () => {
        // Desactivado temporalmente — el cambio de tema está bloqueado
    };

    // Forzar tema claro al montar (selector de tema desactivado)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        setThemeState('light');
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        updateThemeColor('light');
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
