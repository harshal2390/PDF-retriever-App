import React, { useState } from 'react';
import { FileText, Copy, ExternalLink, Check, Bookmark, Globe } from 'lucide-react';
import { SourceCitationData } from '../../types';
import { useWorkspace } from '../../context/WorkspaceContext';

interface Props {
  source: SourceCitationData;
  isActive?: boolean;
}

export const SourceCard: React.FC<Props> = ({ source, isActive }) => {
  const { setPreviewDoc, allDocs } = useWorkspace();
  const [copied, setCopied] = useState(false);

  const matchedDoc = !source.is_web
    ? allDocs.find((d) => d.id === source.doc_id || d.original_name === source.document_name)
    : undefined;

  const handleCopyCitation = () => {
    const citationText = source.is_web
      ? `"${source.snippet}" — ${source.document_name} (${source.url || 'Web Search'})`
      : `"${source.snippet}" — ${source.document_name}, Page ${source.page}`;
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewPreview = () => {
    if (matchedDoc) {
      setPreviewDoc(matchedDoc);
    } else {
      alert(`Document ${source.document_name} is referenced in vector store.`);
    }
  };

  const displayHost = source.url ? (() => {
    try {
      return new URL(source.url).hostname.replace(/^www\./, '');
    } catch {
      return 'Web';
    }
  })() : 'Web';

  return (
    <div
      className={`rounded-xl border p-3.5 transition-all text-xs ${
        isActive
          ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-600 shadow-sm ring-1 ring-indigo-500/20'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
              source.is_web
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {source.is_web ? <Globe className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate" title={source.document_name}>
              {source.document_name}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-zinc-600 dark:text-zinc-300">
                Source [{source.id}]
              </span>
              <span>·</span>
              <span>{source.is_web ? displayHost : `Page ${source.page}`}</span>
            </div>
          </div>
        </div>

        {source.score !== undefined && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            {source.score < 1 ? `${Math.round((1 - source.score) * 100)}% match` : 'Relevant'}
          </span>
        )}
      </div>

      {/* Relevant Excerpt */}
      <div className="mb-3">
        <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Bookmark className="w-3 h-3 text-indigo-500" />
          <span>Relevant Excerpt</span>
        </div>
        <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60 leading-relaxed font-sans max-h-48 overflow-y-auto">
          "{source.snippet}"
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={handleCopyCitation}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy citation'}</span>
        </button>

        {source.is_web && source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-medium transition-colors"
            title="Open web link in new tab"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open link</span>
          </a>
        ) : (
          <button
            onClick={handleViewPreview}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
            title="Preview document page"
          >
            <ExternalLink className="w-3 h-3" />
            <span>View page</span>
          </button>
        )}
      </div>
    </div>
  );
};
