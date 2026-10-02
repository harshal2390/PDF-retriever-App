import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, Plus } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

interface Props {
  compact?: boolean;
}

export const UploadDropzone: React.FC<Props> = ({ compact = false }) => {
  const { uploadPDFsToSession } = useWorkspace();
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      alert('Please upload PDF files only.');
      return;
    }

    uploadPDFsToSession(pdfFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  if (compact) {
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-2 px-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-500" />
          <span>Add documents</span>
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
        <UploadCloud className="w-5 h-5" />
      </div>

      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
        Click or drag & drop PDF files here
      </p>
      <p className="text-[11px] text-zinc-400 mt-1">
        Multiple PDFs supported for semantic indexing
      </p>
    </div>
  );
};
