import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Upload, 
  Trash2, 
  Edit2, 
  Eye, 
  MessageSquare, 
  CheckCircle2, 
  Filter,
  Check,
  X
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { DocumentItem } from '../../types';
import { formatBytes, formatDate } from '../../utils/cn';
import { UploadDropzone } from '../documents/UploadDropzone';
import { UploadProgress } from '../documents/UploadProgress';

export const DocumentLibrary: React.FC = () => {
  const { allDocs, loadAllDocs, setPreviewDoc, createNewSession } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    loadAllDocs();
  }, []);

  const filteredDocs = allDocs.filter((doc) =>
    doc.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (doc: DocumentItem) => {
    setEditingDocId(doc.id);
    setEditName(doc.original_name);
  };

  const handleSaveRename = async (docId: string) => {
    if (editName.trim()) {
      try {
        await api.renameDocument(docId, editName.trim());
        await loadAllDocs();
      } catch (err) {
        console.error(err);
      }
    }
    setEditingDocId(null);
  };

  const handleDelete = async (docId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await api.deleteDocument(docId);
        await loadAllDocs();
      } catch (err) {
        alert('Failed to delete document');
      }
    }
  };

  const handleChatWithDoc = async (doc: DocumentItem) => {
    await createNewSession(`Analysis: ${doc.original_name.slice(0, 24)}`, [doc.id]);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background-light dark:bg-background-dark">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Document Library
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Manage, preview, and query your indexed knowledge base files.
            </p>
          </div>

          <button
            onClick={() => setShowUploader(!showUploader)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{showUploader ? 'Close Uploader' : 'Upload New PDFs'}</span>
          </button>
        </div>

        {/* Uploader Card */}
        {showUploader && (
          <div className="p-4 rounded-2xl bg-white dark:bg-card-dark border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
            <UploadProgress />
            <UploadDropzone compact={false} />
          </div>
        )}

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-mono px-2">
            <span>{filteredDocs.length} documents</span>
            <span>·</span>
            <span>
              {filteredDocs.reduce((acc, d) => acc + (d.page_count || 0), 0)} total pages
            </span>
          </div>
        </div>

        {/* Documents Table / Cards */}
        {filteredDocs.length > 0 ? (
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-card-dark overflow-hidden shadow-2xs">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  {/* Doc details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {editingDocId === doc.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(doc.id);
                              if (e.key === 'Escape') setEditingDocId(null);
                            }}
                            autoFocus
                            className="text-xs px-2 py-1 rounded border border-indigo-500 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveRename(doc.id)}
                            className="p-1 text-emerald-600 hover:text-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingDocId(null)}
                            className="p-1 text-zinc-400 hover:text-zinc-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h4
                          className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                          onClick={() => setPreviewDoc(doc)}
                          title={doc.original_name}
                        >
                          {doc.original_name}
                        </h4>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400 font-mono">
                        <span>{doc.page_count} pages</span>
                        <span>·</span>
                        <span>{formatBytes(doc.file_size)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Indexed ({doc.chunk_count} chunks)</span>
                        </span>
                        <span>·</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleChatWithDoc(doc)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-medium transition-colors"
                      title="Start dedicated conversation"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>

                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Preview pages"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleStartRename(doc)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(doc.id, doc.original_name)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
            <FileText className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No documents found
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No documents match "${searchQuery}"`
                : 'Upload PDFs to start analyzing, searching, and chatting with them.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
