import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  FileText,
  Bookmark,
  Globe
} from 'lucide-react';
import { MessageItem, SourceCitationData } from '../../types';
import { SourceCitation } from './SourceCitation';
import { ThinkingIndicator } from './ThinkingIndicator';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatDate } from '../../utils/cn';

interface Props {
  message: MessageItem;
}

export const AssistantMessage: React.FC<Props> = ({ message }) => {
  const { inspectSource } = useWorkspace();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = () => {
    // Copy clean text without markdown asterisks
    const cleanText = message.content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clean raw markdown asterisks and symbols into proper plain text
  const cleanMarkdownArtifacts = (str: string): string => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '$1')   // bold **text** -> text
      .replace(/\*(.*?)\*/g, '$1')       // italic *text* -> text
      .replace(/__(.*?)__/g, '$1')       // bold __text__ -> text
      .replace(/_(.*?)_/g, '$1')         // italic _text_ -> text
      .replace(/`([^`]+)`/g, '$1')       // inline code `text` -> text
      .replace(/^#{1,6}\s+/gm, '');      // headings # -> clean text
  };

  // Replace [1], [2], [10] with clickable SourceCitation components
  const renderFormattedLine = (lineText: string, sources?: SourceCitationData[]) => {
    const cleanLine = cleanMarkdownArtifacts(lineText);
    const citationRegex = /\[(\d+)\]/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(cleanLine)) !== null) {
      const matchIndex = match.index;
      const citationNumber = parseInt(match[1], 10);

      if (matchIndex > lastIndex) {
        parts.push(cleanLine.substring(lastIndex, matchIndex));
      }

      parts.push(
        <SourceCitation
          key={`cit_${matchIndex}_${citationNumber}`}
          citationId={citationNumber}
          sources={sources}
        />
      );

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < cleanLine.length) {
      parts.push(cleanLine.substring(lastIndex));
    }

    return parts;
  };

  // Render clean plain text paragraphs and bullet lists
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();

      // Empty line -> paragraph spacer
      if (!trimmed) {
        return <div key={index} className="h-2.5" />;
      }

      // Bullet item (starting with - or * or •)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const itemText = trimmed.replace(/^[-*•]\s+/, '');
        return (
          <div key={index} className="flex items-start gap-2 my-1.5 pl-2 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 mt-2 shrink-0" />
            <div className="flex-1">
              {renderFormattedLine(itemText, message.sources)}
            </div>
          </div>
        );
      }

      // Numbered item (e.g. 1. Item)
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={index} className="flex items-start gap-2 my-1.5 pl-2 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
            <span className="font-mono text-xs text-zinc-500 shrink-0 mt-0.5">{numMatch[1]}.</span>
            <div className="flex-1">
              {renderFormattedLine(numMatch[2], message.sources)}
            </div>
          </div>
        );
      }

      // Standard plain text paragraph
      return (
        <p key={index} className="my-1.5 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
          {renderFormattedLine(line, message.sources)}
        </p>
      );
    });
  };

  return (
    <div className="py-4 px-3 sm:px-6 rounded-2xl bg-white dark:bg-card-dark border border-zinc-200/80 dark:border-zinc-800 shadow-2xs my-2 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-[10px] shadow-sm">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            DocuMind AI
          </span>
          <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono">
            Grounded
          </span>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">
          {formatDate(message.created_at)}
        </span>
      </div>

      {/* Body Content */}
      <div className="pl-7">
        {message.isStreaming && !message.content ? (
          <ThinkingIndicator />
        ) : (
          <div className="text-zinc-800 dark:text-zinc-200">
            {renderContent(message.content)}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
            )}
          </div>
        )}

        {/* Sources Section at Bottom */}
        {message.sources && message.sources.length > 0 && !message.isStreaming && (
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              <Bookmark className="w-3 h-3 text-indigo-500" />
              <span>Sources · {message.sources.length}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((s) => (
                <button
                  key={s.id}
                  onClick={() => inspectSource(s)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 hover:border-indigo-400 dark:hover:border-indigo-600 text-zinc-700 dark:text-zinc-300 text-xs hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
                >
                  {s.is_web ? (
                    <Globe className="w-3 h-3 text-blue-500 shrink-0" />
                  ) : (
                    <FileText className="w-3 h-3 text-rose-500 shrink-0" />
                  )}
                  <span className="truncate max-w-[140px] font-medium" title={s.document_name}>
                    {s.document_name}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[10px]">
                    {s.is_web ? '· Web' : `· Page ${s.page}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar */}
        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-3 mt-4 pt-2 text-zinc-400 text-xs">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />

            <button
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              className={`p-1 rounded hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors ${
                feedback === 'up' ? 'text-indigo-600 dark:text-indigo-400' : ''
              }`}
              title="Accurate response"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
              className={`p-1 rounded hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors ${
                feedback === 'down' ? 'text-rose-500' : ''
              }`}
              title="Report inaccuracy"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
