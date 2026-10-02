import React from 'react';
import { Sparkles, FileText, Split, AlertCircle, Hash, HelpCircle } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const SuggestionChips: React.FC = () => {
  const { sendMessage, isGenerating } = useWorkspace();

  const suggestions = [
    { label: 'Summarize this', icon: FileText, prompt: 'Provide a comprehensive summary of the main points in the selected documents.' },
    { label: 'Compare documents', icon: Split, prompt: 'Compare and contrast the key themes, conclusions, and methodologies across the selected documents.' },
    { label: 'Find contradictions', icon: AlertCircle, prompt: 'Identify any conflicting statements, discrepancies, or contradictions between these documents.' },
    { label: 'Extract key numbers', icon: Hash, prompt: 'Extract all important statistics, percentages, and numerical findings mentioned in the text.' },
    { label: 'Explain simply', icon: HelpCircle, prompt: 'Explain the core message of these documents in clear, simple language suitable for a non-technical audience.' },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 no-scrollbar">
      {suggestions.map((s, idx) => {
        const Icon = s.icon;
        return (
          <button
            key={idx}
            disabled={isGenerating}
            onClick={() => sendMessage(s.prompt)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card-dark hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-[11px] whitespace-nowrap transition-all shadow-2xs shrink-0 disabled:opacity-50"
          >
            <Icon className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
};
