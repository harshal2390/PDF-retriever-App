import React from 'react';
import { Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const UploadProgress: React.FC = () => {
  const { uploadState } = useWorkspace();

  if (!uploadState.isUploading) return null;

  return (
    <div className="p-3.5 mb-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 text-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {uploadState.progress < 100 ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          )}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {uploadState.step || 'Processing PDF...'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
          {uploadState.progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${uploadState.progress}%` }}
        />
      </div>

      {/* Multi-step pipeline visual pill */}
      <div className="flex items-center justify-between mt-2.5 text-[10px] text-zinc-400 font-mono">
        <span className={uploadState.progress >= 20 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
          1. Upload
        </span>
        <span>→</span>
        <span className={uploadState.progress >= 45 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
          2. Parse
        </span>
        <span>→</span>
        <span className={uploadState.progress >= 70 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
          3. Chunk
        </span>
        <span>→</span>
        <span className={uploadState.progress >= 85 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
          4. Embed & Index
        </span>
      </div>
    </div>
  );
};
