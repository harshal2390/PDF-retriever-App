import React from 'react';
import { 
  Sparkles, 
  FileText, 
  Split, 
  Search, 
  Hash, 
  Upload, 
  ArrowUpRight 
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const EmptyState: React.FC = () => {
  const { sendMessage, setRightSidebarOpen, sessionDocs } = useWorkspace();

  const cards = [
    {
      title: 'Summarize a document',
      description: 'Get an executive synthesis of the key ideas, findings, and arguments.',
      prompt: 'Summarize the core concepts and findings across the uploaded documents.',
      icon: FileText,
    },
    {
      title: 'Compare two papers',
      description: 'Contrast methodologies, assumptions, results, and recommendations.',
      prompt: 'Compare the different methodologies and findings across the documents.',
      icon: Split,
    },
    {
      title: 'Find key findings',
      description: 'Pinpoint crucial insights and grounded discoveries with page citations.',
      prompt: 'What are the most significant conclusions and discoveries highlighted in the text?',
      icon: Search,
    },
    {
      title: 'Extract important numbers',
      description: 'Tabulate exact metrics, percentages, dates, and quantitative values.',
      prompt: 'Extract all important statistics, numbers, percentages, and metrics mentioned.',
      icon: Hash,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col items-center text-center">
      {/* Brand Icon */}
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-sm border border-indigo-500/20">
        <Sparkles className="w-6 h-6" />
      </div>

      {/* Main Title */}
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
        Chat with your documents
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-md">
        Upload PDFs and ask questions. Get grounded answers with verifiable sources and interactive page citations.
      </p>

      {/* Upload Call to Action if no documents */}
      {sessionDocs.length === 0 && (
        <button
          onClick={() => setRightSidebarOpen(true)}
          className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload PDFs to start</span>
        </button>
      )}

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-8 text-left">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <button
              key={i}
              onClick={() => sendMessage(c.prompt)}
              className="group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card-dark hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
              </div>

              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {c.title}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {c.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
