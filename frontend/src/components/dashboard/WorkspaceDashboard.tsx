import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  MessageSquare, 
  Upload, 
  Plus, 
  Layers, 
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DashboardStats } from '../../types';
import { formatDate, formatBytes } from '../../utils/cn';

export const WorkspaceDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    createNewSession, 
    selectSession, 
    setCurrentView, 
    setPreviewDoc,
    setRightSidebarOpen 
  } = useWorkspace();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.getDashboardStats();
        setStats(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-medium font-mono">
                DocuMind AI Workspace
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Welcome back, {user?.name || 'Researcher'}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-lg">
              Ask questions across all your indexed documents. Retrieve context, extract citations, and generate grounded answers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setCurrentView('workspace');
                setRightSidebarOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-500" />
              <span>Upload documents</span>
            </button>

            <button
              onClick={() => createNewSession()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start new conversation</span>
            </button>
          </div>
        </div>

        {/* Minimal Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Documents</span>
              <FileText className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats?.document_count ?? 0}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {stats?.total_pages ?? 0} pages parsed & indexed
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Conversations</span>
              <MessageSquare className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats?.conversation_count ?? 0}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Active RAG sessions with memory
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Vector Store</span>
              <Layers className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              FAISS
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Normalized cosine indexing active</span>
            </div>
          </div>
        </div>

        {/* Recent Conversations & Recent Documents Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Conversations */}
          <div className="rounded-2xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Recent Conversations
              </h3>
              <button
                onClick={() => createNewSession()}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>New</span>
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {stats?.recent_conversations && stats.recent_conversations.length > 0 ? (
              <div className="space-y-2">
                {stats.recent_conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectSession(c.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 text-left transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {c.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono shrink-0 ml-2">
                      {formatDate(c.updated_at)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-400">
                No recent conversations.
              </div>
            )}
          </div>

          {/* Recent Documents */}
          <div className="rounded-2xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Recent Documents
              </h3>
              <button
                onClick={() => setCurrentView('library')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {stats?.recent_documents && stats.recent_documents.length > 0 ? (
              <div className="space-y-2">
                {stats.recent_documents.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200 truncate" title={d.original_name}>
                          {d.original_name}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {d.page_count} pages · {formatBytes(d.file_size)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => createNewSession(`Chat: ${d.original_name.slice(0, 20)}`, [d.id])}
                      className="px-2.5 py-1 rounded-lg bg-zinc-200/80 dark:bg-zinc-700 hover:bg-indigo-600 hover:text-white text-zinc-700 dark:text-zinc-200 text-[11px] font-medium transition-colors shrink-0"
                    >
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-400">
                No documents uploaded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
