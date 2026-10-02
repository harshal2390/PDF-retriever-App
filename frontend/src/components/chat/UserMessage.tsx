import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { MessageItem } from '../../types';
import { formatDate } from '../../utils/cn';

interface Props {
  message: MessageItem;
}

export const UserMessage: React.FC<Props> = ({ message }) => {
  return (
    <div className="py-4 px-3 sm:px-6 rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 transition-colors my-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-[10px] font-semibold">
            U
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            You
          </span>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">
          {formatDate(message.created_at)}
        </span>
      </div>

      <div className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans pl-7 whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
};
