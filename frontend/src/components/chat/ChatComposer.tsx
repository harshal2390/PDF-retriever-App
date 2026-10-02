import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  Paperclip, 
  Square, 
  Sparkles, 
  UploadCloud,
  Globe 
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { SuggestionChips } from './SuggestionChips';

export const ChatComposer: React.FC = () => {
  const { 
    sendMessage, 
    isGenerating, 
    stopGeneration, 
    uploadPDFsToSession, 
    sessionDocs, 
    selectedDocIds,
    webSearchEnabled,
    setWebSearchEnabled
  } = useWorkspace();
  const [text, setText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() || isGenerating) return;
    sendMessage(text);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const pdfs = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (pdfs.length > 0) {
      uploadPDFsToSession(pdfs);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-1">
      {/* Suggestion Chips */}
      <div className="mb-2">
        <SuggestionChips />
      </div>

      {/* Composer Input Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border transition-all shadow-sm ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card-dark focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:shadow-md'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isDragOver ? (
          <div className="h-24 flex items-center justify-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <UploadCloud className="w-5 h-5 animate-bounce" />
            <span>Drop PDF files to attach & index immediately</span>
          </div>
        ) : (
          <div className="flex flex-col p-2.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your documents..."
              className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none focus:outline-none max-h-44 px-1.5 py-1"
            />

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Attach PDF files"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Web Search Toggle */}
                <button
                  type="button"
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    webSearchEnabled
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  title={webSearchEnabled ? "Web Search enabled (Google / Web + Documents)" : "Web Search disabled (Documents only)"}
                >
                  <Globe className={`w-3.5 h-3.5 ${webSearchEnabled ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  <span className="hidden sm:inline">Search Web</span>
                </button>

                {selectedDocIds.length > 0 && (
                  <span className="text-[11px] text-zinc-400 font-mono pl-1 hidden sm:inline">
                    {selectedDocIds.length} doc{selectedDocIds.length !== 1 ? 's' : ''} targeted
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                  Enter to send · Shift + Enter for newline
                </span>

                {isGenerating ? (
                  <button
                    type="button"
                    onClick={stopGeneration}
                    className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-all shadow-sm flex items-center gap-1.5 text-xs font-medium"
                    title="Stop generating"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!text.trim()}
                    onClick={handleSend}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white disabled:text-zinc-400 transition-all shadow-sm disabled:shadow-none"
                    title="Send message"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
