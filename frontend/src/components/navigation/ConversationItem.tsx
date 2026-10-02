import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, MessageSquare, Edit2, Trash2, Share2, Archive, Check } from 'lucide-react';
import { ConversationItemData } from '../../types';
import { useWorkspace } from '../../context/WorkspaceContext';
import { cn } from '../../utils/cn';

interface Props {
  conversation: ConversationItemData;
}

export const ConversationItem: React.FC<Props> = ({ conversation }) => {
  const { currentSession, selectSession, renameSession, deleteSession } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = currentSession?.id === conversation.id;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveRename = async () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      await renameSession(conversation.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setEditTitle(conversation.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer",
        isActive
          ? "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
      )}
      onClick={() => {
        if (!isEditing) selectSession(conversation.id);
      }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MessageSquare className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400")} />
        
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleSaveRename}
              className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span className="truncate">{conversation.title}</span>
        )}
      </div>

      {!isEditing && (
        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-opacity",
              menuOpen && "opacity-100 bg-zinc-200 dark:bg-zinc-700"
            )}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 z-50 text-xs">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Edit2 className="w-3 h-3" />
                <span>Rename</span>
              </button>
              <button
                onClick={() => {
                  deleteSession(conversation.id);
                  setMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
