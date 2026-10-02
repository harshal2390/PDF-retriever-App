import React from 'react';
import { Files, X, Sparkles } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { DocumentCard } from './DocumentCard';
import { UploadDropzone } from './UploadDropzone';
import { UploadProgress } from './UploadProgress';

export const DocumentPanel: React.FC = () => {
  const { 
    sessionDocs, 
    selectedDocIds, 
    toggleDocSelection, 
    selectAllDocs,
    setRightSidebarOpen,
    allDocs
  } = useWorkspace();

  const docsToShow = sessionDocs.length > 0 ? sessionDocs : allDocs;
  const validSelectedDocIds = selectedDocIds.filter((id) => docsToShow.some((d) => d.id === id));
  const activeDocCount = validSelectedDocIds.length;

  const handleSelectAll = async () => {
    const allDocIds = docsToShow.map((d) => d.id);
    await selectAllDocs(allDocIds);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Files className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-mono">
              DOCUMENTS
            </h3>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {docsToShow.length} {docsToShow.length === 1 ? 'file' : 'files'} in workspace
          </p>
        </div>

        <button
          onClick={() => setRightSidebarOpen(false)}
          className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selection Summary Bar */}
      <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          <strong className="text-indigo-600 dark:text-indigo-400">{activeDocCount}</strong> document{activeDocCount !== 1 ? 's' : ''} selected
        </span>

        {docsToShow.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="text-[11px] text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {activeDocCount === docsToShow.length ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {/* Main List & Upload Section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {/* Real-time upload progress bar */}
        <UploadProgress />

        {/* Compact Add documents trigger */}
        <UploadDropzone compact={true} />

        {/* Documents list */}
        {docsToShow.length > 0 ? (
          <div className="space-y-2 pt-1">
            {docsToShow.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                isSelected={selectedDocIds.includes(doc.id)}
                onToggle={() => toggleDocSelection(doc.id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 px-2 text-center">
            <UploadDropzone compact={false} />
          </div>
        )}
      </div>

      {/* RAG Context Information Footnote */}
      <div className="p-3 bg-zinc-50/80 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium mb-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Semantic Grounding</span>
        </div>
        Queries only search chunks within the checked documents.
      </div>
    </div>
  );
};
