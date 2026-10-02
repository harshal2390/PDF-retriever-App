import React from 'react';
import { Sparkles, Database, Search, ArrowRight } from 'lucide-react';

export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs w-fit max-w-lg">
      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
        <Sparkles className="w-3.5 h-3.5 animate-spin" />
        <span>Thinking & retrieving grounded context...</span>
      </div>

      {/* Visual RAG Workflow indicator */}
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
        <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
          <Database className="w-2.5 h-2.5 text-indigo-500" />
          <span>Documents</span>
        </span>
        <ArrowRight className="w-2.5 h-2.5" />
        <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
          <Search className="w-2.5 h-2.5 text-indigo-500" />
          <span>FAISS Retrieval</span>
        </span>
        <ArrowRight className="w-2.5 h-2.5" />
        <span className="text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
          Sources Grounding
        </span>
      </div>
    </div>
  );
};
