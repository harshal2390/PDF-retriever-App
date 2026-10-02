import React, { useState } from 'react';
import { 
  Edit3, 
  Files, 
  Menu,
  Check
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const Header: React.FC = () => {
  const { 
    currentSession, 
    sessionDocs, 
    selectedDocIds, 
    renameSession,
    rightSidebarOpen,
    setRightSidebarOpen,
    setLeftSidebarOpen,
    leftSidebarOpen
  } = useWorkspace();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const activeDocCount = sessionDocs.filter((d) => selectedDocIds.includes(d.id)).length;
  const totalPages = sessionDocs
    .filter((d) => selectedDocIds.includes(d.id))
    .reduce((acc, d) => acc + (d.page_count || 0), 0);

  const handleStartRename = () => {
    setTitleInput(currentSession?.title || 'New Conversation');
    setIsEditingTitle(true);
  };

  const handleSaveRename = async () => {
    if (currentSession && titleInput.trim()) {
      await renameSession(currentSession.id, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-card-dark/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-0.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveRename}
                className="p-1 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {currentSession ? currentSession.title : 'DocuMind Workspace'}
              </h1>
              {currentSession && (
                <button
                  onClick={handleStartRename}
                  className="opacity-40 hover:opacity-100 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-0.5 transition-opacity"
                  title="Rename conversation"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
            {activeDocCount > 0
              ? `${activeDocCount} document${activeDocCount > 1 ? 's' : ''} · ${totalPages} page${totalPages !== 1 ? 's' : ''} active`
              : 'No documents attached'}
          </p>
        </div>
      </div>

      {/* Right: Panel Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            rightSidebarOpen
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
          title={rightSidebarOpen ? 'Hide context panel' : 'Show context panel'}
        >
          <Files className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden sm:inline">Context & Sources</span>
          {activeDocCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full font-mono">
              {activeDocCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
