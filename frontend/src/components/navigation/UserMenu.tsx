import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings as SettingsIcon, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { setCurrentView } = useWorkspace();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium text-xs flex items-center justify-center shrink-0">
            {initials || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
        <ChevronUp className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1.5 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 z-50 text-xs">
          <button
            onClick={() => {
              setCurrentView('settings');
              setOpen(false);
            }}
            className="w-full px-3 py-2 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-zinc-500" />
            <span>Settings</span>
          </button>
          <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full px-3 py-2 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
