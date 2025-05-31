import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('wealthkarma-theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    // Default to dark (current behavior)
    return 'dark';
  });

  const setThemeHandler = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('wealthkarma-theme', newTheme);
    
    // Update CSS custom properties on document root
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update color-scheme meta tag
    const colorScheme = newTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.style.colorScheme = colorScheme;
  };

  const toggleTheme = () => {
    setThemeHandler(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Set initial theme on mount
    setThemeHandler(theme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a theme
      if (!localStorage.getItem('wealthkarma-theme')) {
        setThemeHandler(e.matches ? 'light' : 'dark');
      }
    };
    
    mediaQuery.addListener(handleSystemThemeChange);
    return () => mediaQuery.removeListener(handleSystemThemeChange);
  }, []);

  useEffect(() => {
    setThemeHandler(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeHandler }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 