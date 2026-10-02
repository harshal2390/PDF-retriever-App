import React from 'react';
import { BookmarkCheck, X, FileSearch } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { SourceCard } from './SourceCard';

export const SourcePanel: React.FC = () => {
  const { activeSource, messages, setRightPanelTab } = useWorkspace();

  // Find latest message sources if no single activeSource selected
  const latestAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant' && m.sources && m.sources.length > 0);
  const sourcesToDisplay = latestAssistantMessage?.sources || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookmarkCheck className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Source Grounding
          </h3>
        </div>
        <button
          onClick={() => setRightPanelTab('documents')}
          className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Back to Documents"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeSource ? (
          <div>
            <div className="mb-2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              Selected Citation:
            </div>
            <SourceCard source={activeSource} isActive={true} />

            {sourcesToDisplay.length > 1 && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="mb-2 text-[11px] font-medium text-zinc-400">
                  Other Supporting Sources:
                </div>
                <div className="space-y-2.5">
                  {sourcesToDisplay
                    .filter((s) => s.id !== activeSource.id)
                    .map((s) => (
                      <SourceCard key={s.id} source={s} isActive={false} />
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : sourcesToDisplay.length > 0 ? (
          <div className="space-y-3">
            <p className="text-[11px] text-zinc-500">
              Showing {sourcesToDisplay.length} retrieved document passages that grounded the answer:
            </p>
            {sourcesToDisplay.map((s) => (
              <SourceCard key={s.id} source={s} />
            ))}
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-zinc-400">
            <FileSearch className="w-8 h-8 mb-2 stroke-[1.5] text-zinc-300 dark:text-zinc-600" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">No active sources</p>
            <p className="text-[11px] mt-1">
              Ask a question to see retrieved excerpts from your documents.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
