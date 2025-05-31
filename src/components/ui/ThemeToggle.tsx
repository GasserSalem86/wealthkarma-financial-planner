import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = false 
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-theme-secondary transition-colors">
          {theme === 'light' ? 'Light' : 'Dark'}
        </span>
      )}
      
      <button
        onClick={toggleTheme}
        className="theme-toggle focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        data-theme={theme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <div className="theme-toggle-slider">
          {theme === 'light' ? (
            <Sun className="theme-toggle-icon" />
          ) : (
            <Moon className="theme-toggle-icon" />
          )}
        </div>
      </button>
      
      {showLabel && (
        <span className="text-xs text-theme-muted transition-colors">
          Mode
        </span>
      )}
    </div>
  );
};

export default ThemeToggle; 