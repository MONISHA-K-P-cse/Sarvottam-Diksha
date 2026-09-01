import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem('sd_theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (e) {
      // Ignore localStorage errors if sandboxed
    }
    return 'light';
  });

  const applyTheme = (targetTheme) => {
    const root = document.documentElement;
    const body = document.body;
    
    if (targetTheme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('sd_theme', targetTheme);
    } catch (e) {
      // Ignore localStorage write errors
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    const validTheme = newTheme === 'dark' ? 'dark' : 'light';
    setThemeState(validTheme);
    applyTheme(validTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
