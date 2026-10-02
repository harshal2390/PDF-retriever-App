import React from 'react';
import { Files, BookmarkCheck, ChevronRight } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { DocumentPanel } from '../documents/DocumentPanel';
import { SourcePanel } from '../sources/SourcePanel';

export const RightPanel: React.FC = () => {
  const { 
    rightSidebarOpen, 
    setRightSidebarOpen, 
    rightPanelTab, 
    setRightPanelTab,
    selectedDocIds,
    messages
  } = useWorkspace();

  if (!rightSidebarOpen) {
    return (
      <div className="hidden lg:flex w-10 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card-dark flex-col items-center py-3 justify-start gap-4 shrink-0">
        <button
          onClick={() => {
            setRightSidebarOpen(true);
            setRightPanelTab('documents');
          }}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
          title="Open documents panel"
        >
          <Files className="w-4 h-4 text-indigo-500" />
          {selectedDocIds.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500" />
          )}
        </button>

        <button
          onClick={() => {
            setRightSidebarOpen(true);
            setRightPanelTab('sources');
          }}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Open sources panel"
        >
          <BookmarkCheck className="w-4 h-4 text-emerald-500" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-80 sm:w-96 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card-dark flex flex-col shrink-0 h-full select-none transition-all z-20">
      {/* Top Tab Bar */}
      <div className="flex items-center px-3 pt-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
        <button
          onClick={() => setRightPanelTab('documents')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-medium transition-colors ${
            rightPanelTab === 'documents'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Files className="w-3.5 h-3.5" />
          <span>Documents</span>
        </button>

        <button
          onClick={() => setRightPanelTab('sources')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-medium transition-colors ${
            rightPanelTab === 'sources'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span>Sources</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {rightPanelTab === 'sources' ? <SourcePanel /> : <DocumentPanel />}
      </div>
    </aside>
  );
};
