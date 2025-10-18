import React, { useState, useRef, useEffect } from 'react';
import type { Conversation } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  isOpen,
  setIsOpen,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setRenameInput(conversation.title);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && renameInput.trim()) {
      onRenameConversation(editingId, renameInput.trim());
    }
    setEditingId(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const sortedConversations = [...conversations].sort((a, b) => Number(b.id) - Number(a.id));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/70 border-r border-slate-200 dark:border-slate-700/50">
      <div className="p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 shrink-0">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Lịch sử Chat</h2>
        <button 
          onClick={onNewChat} 
          title="Cuộc trò chuyện mới" 
          className="flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-400 bg-sky-100/80 dark:bg-sky-900/50 hover:bg-sky-200/80 dark:hover:bg-sky-800/70 rounded-lg px-3 py-1.5 transition-colors duration-200"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Mới</span>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        <ul>
          {sortedConversations.map((convo) => {
            const isActive = convo.id === activeConversationId;
            const isPlaceholder = convo.title === "Cuộc trò chuyện mới";
            const iconClass = `w-5 h-5 shrink-0 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`;

            return (
              <li key={convo.id}>
                <div
                  className={`group w-full flex items-center justify-between rounded-md transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-sky-100 dark:bg-sky-900/50'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {editingId === convo.id ? (
                     <form onSubmit={handleRenameSubmit} className="flex-grow">
                        <input
                            ref={inputRef}
                            type="text"
                            value={renameInput}
                            onChange={(e) => setRenameInput(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-transparent px-3 py-2 text-sm text-slate-700 dark:text-slate-50 focus:outline-none"
                        />
                    </form>
                  ) : (
                    <button onClick={() => onSelectConversation(convo.id)} className="flex items-center gap-3 px-3 py-2 flex-grow text-left">
                        {isPlaceholder ? (
                            <PencilIcon className={iconClass} />
                        ) : (
                            <ChatBubbleIcon className={iconClass} />
                        )}
                        <span className={`text-sm truncate ${isActive ? 'font-semibold text-slate-800 dark:text-slate-50' : 'text-slate-600 dark:text-slate-300'}`}>
                            {convo.title}
                        </span>
                    </button>
                  )}
                  
                  <div className={`pr-2 flex items-center shrink-0 ${editingId === convo.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                     {editingId === convo.id ? (
                         <button 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleRenameSubmit} 
                            className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700">
                             <CheckIcon className="w-4 h-4" />
                         </button>
                     ) : (
                         <>
                            <button onClick={() => handleStartRename(convo)} className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700">
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDeleteConversation(convo.id)} className="p-1.5 rounded-md text-red-500/80 hover:bg-red-500/10 hover:text-red-600">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                         </>
                     )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Static sidebar for larger screens */}
      <aside className="hidden md:block w-72 lg:w-80 h-full flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (drawer) */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'bg-black/50 opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-50 bg-slate-50 dark:bg-slate-900 transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'transform-none' : '-translate-x-full'
        }`}
      >
        <button onClick={() => setIsOpen(false)} className="absolute top-3 right-3 p-2 text-slate-500 dark:text-slate-400" aria-label="Close sidebar">
          <XIcon className="w-6 h-6" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
};