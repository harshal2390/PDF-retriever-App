import React from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  LayoutDashboard, 
  MessageSquare, 
  FolderOpen, 
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ConversationList } from '../navigation/ConversationList';
import { UserMenu } from '../navigation/UserMenu';
import { ThemeToggle } from '../navigation/ThemeToggle';
import { cn } from '../../utils/cn';

export const Sidebar: React.FC = () => {
  const { 
    sessions, 
    createNewSession, 
    leftSidebarOpen, 
    setLeftSidebarOpen, 
    currentView, 
    setCurrentView,
    setCommandPaletteOpen 
  } = useWorkspace();

  if (!leftSidebarOpen) {
    return (
      <div className="w-12 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card-dark flex flex-col items-center py-3 justify-between shrink-0 transition-all">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => createNewSession()}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Search (Ctrl + K)"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    );
  }

  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card-dark flex flex-col justify-between shrink-0 h-full select-none transition-all">
      {/* Top Brand & Actions */}
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-xs tracking-wider text-zinc-900 dark:text-zinc-100 font-mono">
              DOCUMIND
            </span>
          </div>

          <button
            onClick={() => setLeftSidebarOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Conversation Button */}
        <button
          onClick={() => createNewSession()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-xs hover:bg-zinc-800 dark:hover:bg-white shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New conversation</span>
        </button>

        {/* Search Command Bar */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full mt-2 flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
          </div>
          <kbd className="text-[10px] font-mono px-1 py-0.2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Main Navigation Views */}
      <div className="px-2 py-2 border-b border-zinc-100 dark:border-zinc-800/80 space-y-0.5">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            currentView === 'dashboard'
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setCurrentView('workspace')}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            currentView === 'workspace'
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Workspace Chat</span>
        </button>

        <button
          onClick={() => setCurrentView('library')}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            currentView === 'library'
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Documents Library</span>
        </button>

        <button
          onClick={() => setCurrentView('settings')}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            currentView === 'settings'
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Conversation History Grouped */}
      <div className="flex-1 overflow-y-auto px-2">
        <ConversationList conversations={sessions} />
      </div>

      {/* Bottom Footer: User Menu & Theme Switcher */}
      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1">
        <div className="flex-1 min-w-0">
          <UserMenu />
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
};
