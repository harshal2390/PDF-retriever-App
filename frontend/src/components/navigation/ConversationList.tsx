import React from 'react';
import { ConversationItemData } from '../../types';
import { ConversationItem } from './ConversationItem';

interface Props {
  conversations: ConversationItemData[];
}

export const ConversationList: React.FC<Props> = ({ conversations }) => {
  if (conversations.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
        No conversations yet
      </div>
    );
  }

  const now = new Date();
  const today: ConversationItemData[] = [];
  const yesterday: ConversationItemData[] = [];
  const previous7Days: ConversationItemData[] = [];
  const older: ConversationItemData[] = [];

  conversations.forEach((conv) => {
    const convDate = new Date(conv.updated_at || conv.created_at);
    const diffTime = Math.abs(now.getTime() - convDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      today.push(conv);
    } else if (diffDays === 1) {
      yesterday.push(conv);
    } else if (diffDays <= 7) {
      previous7Days.push(conv);
    } else {
      older.push(conv);
    }
  });

  const renderSection = (title: string, items: ConversationItemData[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h3 className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {title}
        </h3>
        <div className="space-y-0.5">
          {items.map((item) => (
            <ConversationItem key={item.id} conversation={item} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="py-2">
      {renderSection('Today', today)}
      {renderSection('Yesterday', yesterday)}
      {renderSection('Previous 7 days', previous7Days)}
      {renderSection('Older', older)}
    </div>
  );
};
