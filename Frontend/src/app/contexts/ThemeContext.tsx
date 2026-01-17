import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Theme System - Centralized theme state management
 * Supports: 'light' | 'dark' | 'system' (respects OS preference)
 * State persisted via localStorage with key: 'theme'
 * DOM manipulation via document.documentElement.classList
 */

type Theme = 'light' | 'dark' | 'system';
type ActualTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  actualTheme: ActualTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider - Manages theme state and DOM updates
 * Features:
 * - Persists preference to localStorage
 * - Detects system preference via prefers-color-scheme
 * - Responds to system preference changes in real-time
 * - Applies 'dark' class to document.documentElement
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Load saved theme from localStorage, default to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  // Track the currently active theme (after system preference resolution)
  const [actualTheme, setActualTheme] = useState<ActualTheme>('light');

  // Helper: Get system preference
  const getSystemTheme = useCallback((): ActualTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Helper: Apply theme to DOM and state
  const applyTheme = useCallback(
    (newTheme: ActualTheme) => {
      setActualTheme(newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    []
  );

  // Main effect: Update actual theme when preference changes
  useEffect(() => {
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
    applyTheme(resolvedTheme);

    // Listen for system preference changes if using 'system' theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme(mediaQuery.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, getSystemTheme, applyTheme]);

  // Update localStorage when theme changes
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  // Toggle between light and dark (ignores 'system' setting)
  const toggleTheme = useCallback(() => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  }, [actualTheme, setTheme]);

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
