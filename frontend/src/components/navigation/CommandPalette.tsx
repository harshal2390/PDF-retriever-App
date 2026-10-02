import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MessageSquare, 
  FileText, 
  Plus, 
  Upload, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const CommandPalette: React.FC = () => {
  const { 
    commandPaletteOpen, 
    setCommandPaletteOpen, 
    createNewSession, 
    selectSession, 
    setCurrentView,
    setPreviewDoc 
  } = useWorkspace();
  const { effectiveTheme, setTheme } = useTheme();
  const { logout } = useAuth();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ conversations: any[]; documents: any[] }>({
    conversations: [],
    documents: [],
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults({ conversations: [], documents: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.search(query);
        setSearchResults(res);
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!commandPaletteOpen) return null;

  const handleClose = () => {
    setCommandPaletteOpen(false);
  };

  const handleNewConversation = async () => {
    handleClose();
    await createNewSession();
  };

  const handleToggleTheme = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
    handleClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleClose();
            }}
            placeholder="Type a command or search documents & conversations..."
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results / Commands List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-4">
          {/* Quick Actions (when query is empty) */}
          {!query.trim() && (
            <div>
              <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Quick Actions
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={handleNewConversation}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="w-3.5 h-3.5 text-indigo-500" />
                    <span>New conversation</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Ctrl + N</span>
                </button>

                <button
                  onClick={() => {
                    handleClose();
                    setCurrentView('library');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Open Document Library</span>
                  </div>
                </button>

                <button
                  onClick={handleToggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {effectiveTheme === 'dark' ? (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    <span>Toggle {effectiveTheme === 'dark' ? 'Light' : 'Dark'} mode</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleClose();
                    setCurrentView('settings');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Settings & Preferences</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {query.trim() && (
            <>
              {searchResults.conversations.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Conversations
                  </div>
                  <div className="space-y-0.5">
                    {searchResults.conversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          handleClose();
                          selectSession(c.id);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{c.title}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.documents.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Documents
                  </div>
                  <div className="space-y-0.5">
                    {searchResults.documents.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          handleClose();
                          setCurrentView('library');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{d.original_name}</span>
                          <span className="text-[10px] text-zinc-400">({d.page_count} pages)</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.conversations.length === 0 && searchResults.documents.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-zinc-400">
                  No matching conversations or documents found.
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd></span>
            <span>Select: <kbd className="font-mono">↵</kbd></span>
          </div>
          <span>DocuMind AI</span>
        </div>
      </div>
    </div>
  );
};
