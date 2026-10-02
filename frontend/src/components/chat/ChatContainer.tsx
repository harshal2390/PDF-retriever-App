import React, { useEffect, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ChatMessage } from './ChatMessage';
import { EmptyState } from './EmptyState';
import { ChatComposer } from './ChatComposer';

export const ChatContainer: React.FC = () => {
  const { messages, isGenerating } = useWorkspace();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Scrollable messages viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={bottomRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom composer */}
      <div className="shrink-0 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent pt-3">
        <ChatComposer />
      </div>
    </div>
  );
};
