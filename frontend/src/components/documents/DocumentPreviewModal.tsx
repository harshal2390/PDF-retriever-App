import React, { useEffect, useState } from 'react';
import { X, FileText, Loader2, MessageSquare, ExternalLink } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { formatBytes } from '../../utils/cn';

export const DocumentPreviewModal: React.FC = () => {
  const { previewDoc, setPreviewDoc, createNewSession } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{ pages: { page: number; text: string }[]; total_pages: number } | null>(null);

  useEffect(() => {
    if (!previewDoc) {
      setPreviewData(null);
      return;
    }

    const fetchPreview = async () => {
      setLoading(true);
      try {
        const data = await api.previewDocument(previewDoc.id);
        setPreviewData({ pages: data.pages, total_pages: data.total_pages });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [previewDoc]);

  if (!previewDoc) return null;

  const handleChatWithThis = async () => {
    const docId = previewDoc.id;
    const title = `Chat: ${previewDoc.original_name.slice(0, 24)}`;
    setPreviewDoc(null);
    await createNewSession(title, [docId]);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => setPreviewDoc(null)}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {previewDoc.original_name}
              </h3>
              <p className="text-xs text-zinc-400">
                {previewDoc.page_count} pages · {formatBytes(previewDoc.file_size)} · {previewDoc.chunk_count} chunks indexed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleChatWithThis}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat with this</span>
            </button>
            <button
              onClick={() => setPreviewDoc(null)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-zinc-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-500" />
              <span>Extracting page previews...</span>
            </div>
          ) : previewData && previewData.pages.length > 0 ? (
            <div className="space-y-4">
              <div className="text-xs font-medium text-zinc-500">
                Preview of initial pages:
              </div>
              {previewData.pages.map((p) => (
                <div 
                  key={p.page} 
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                      Page {p.page}
                    </span>
                  </div>
                  <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {p.text || '[No extractable text on this page]'}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400 text-xs">
              No preview text available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
