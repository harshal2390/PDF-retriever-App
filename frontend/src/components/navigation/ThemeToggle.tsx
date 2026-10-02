import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
      <button
        onClick={() => setTheme('light')}
        title="Light theme"
        className={cn(
          "p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors",
          theme === 'light' && "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
        )}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        title="Dark theme"
        className={cn(
          "p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors",
          theme === 'dark' && "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
        )}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme('system')}
        title="System preference"
        className={cn(
          "p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors",
          theme === 'system' && "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
        )}
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
