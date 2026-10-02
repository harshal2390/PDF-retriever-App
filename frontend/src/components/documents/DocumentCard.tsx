import React from 'react';
import { FileText, CheckCircle2, Eye, Trash2, Check } from 'lucide-react';
import { DocumentItem } from '../../types';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatBytes } from '../../utils/cn';

interface Props {
  document: DocumentItem;
  isSelected: boolean;
  onToggle: () => void;
  showActions?: boolean;
}

export const DocumentCard: React.FC<Props> = ({
  document,
  isSelected,
  onToggle,
  showActions = true,
}) => {
  const { setPreviewDoc } = useWorkspace();

  return (
    <div
      onClick={onToggle}
      className={`group relative flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none text-xs ${
        isSelected
          ? 'bg-white dark:bg-zinc-900 border-indigo-400 dark:border-indigo-600 shadow-sm ring-1 ring-indigo-500/20'
          : 'bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80 opacity-75 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
          isSelected
            ? 'bg-indigo-600 border-indigo-600 text-white'
            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
        }`}
      >
        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
      </div>

      {/* Doc details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate" title={document.original_name}>
            {document.original_name}
          </h4>
        </div>

        <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>{document.page_count} pages</span>
          <span>·</span>
          <span>{formatBytes(document.file_size)}</span>
        </div>

        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Indexed</span>
          </span>
          <span className="text-[10px] text-zinc-400">({document.chunk_count} chunks)</span>
        </div>
      </div>

      {/* Preview Trigger */}
      {showActions && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewDoc(document);
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-opacity"
          title="Preview document"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
