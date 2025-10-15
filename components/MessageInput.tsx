import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { GuidedInputForm } from './GuidedInputForm';
import type { Task } from './GuidedInputForm';
import type { ChatMessage } from '../types';
import { DotsVerticalIcon } from './icons/DotsVerticalIcon';
import { StopIcon } from './icons/StopIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { TagIcon } from './icons/TagIcon';
import { CollectionIcon } from './icons/CollectionIcon';

type ImageData = ChatMessage['image'];

interface MessageInputProps {
  onSendMessage: (message: string, image?: ImageData) => void;
  isLoading: boolean;
  onNewChat: () => void;
  onClearChat: () => void;
  activeTool: Task | null;
  setActiveTool: (tool: Task | null) => void;
  onStopGeneration: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  onNewChat, 
  onClearChat, 
  activeTool, 
  setActiveTool,
  onStopGeneration,
}) => {
  const [input, setInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const quickActionClass = "flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-700/50 hover:bg-slate-300/70 dark:hover:bg-slate-600/70 rounded-lg px-3 py-1.5 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  if (activeTool) {
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <GuidedInputForm 
                task={activeTool}
                onSubmit={onSendMessage}
                onCancel={() => setActiveTool(null)}
                isLoading={isLoading}
            />
        </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
        <div className="grid grid-cols-3 gap-2 mb-3">
             <button onClick={() => setActiveTool('profit-analysis')} className={quickActionClass} disabled={isLoading}>
                <ChartBarIcon className="w-4 h-4 text-sky-500" />
                <span>Phân tích Lợi nhuận</span>
            </button>
            <button onClick={() => setActiveTool('promo-price')} className={quickActionClass} disabled={isLoading}>
                <TagIcon className="w-4 h-4 text-green-500" />
                <span>Phân tích Khuyến mãi</span>
            </button>
             <button onClick={() => setActiveTool('group-price')} className={quickActionClass} disabled={isLoading}>
                <CollectionIcon className="w-4 h-4 text-purple-500" />
                <span>Phân tích Đồng giá</span>
            </button>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <div className="relative" ref={menuRef}>
                <button type="button" onClick={() => setIsMenuOpen(p => !p)} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50">
                    <DotsVerticalIcon className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div className="absolute bottom-full mb-2 w-48 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-2 z-10 animate-fade-in-up">
                         <button onClick={() => { onNewChat(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600/70 rounded-md transition-colors duration-200">
                            <PlusIcon className="w-4 h-4" />
                            <span>Trò chuyện mới</span>
                         </button>
                         <button onClick={() => { onClearChat(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md transition-colors duration-200">
                            <TrashIcon className="w-4 h-4" />
                            <span>Xóa tin nhắn</span>
                         </button>
                    </div>
                )}
            </div>
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập yêu cầu của bạn ở đây..."
            disabled={isLoading}
            className="flex-1 w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-300 border border-slate-200 dark:border-transparent"
            autoComplete="off"
            />
            {isLoading ? (
                 <button
                    type="button"
                    onClick={onStopGeneration}
                    className="bg-red-600 text-white rounded-full p-3 hover:bg-red-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 flex items-center gap-2"
                    aria-label="Stop generation"
                    title="Dừng"
                    >
                    <StopIcon className="w-6 h-6" />
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-sky-600 text-white rounded-full p-3 hover:bg-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800"
                    aria-label="Send message"
                >
                    <PaperAirplaneIcon className="w-6 h-6" />
                </button>
            )}
        </form>
    </div>
  );
};


const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-fade-in-up {
        animation: fadeInUp 0.15s ease-out forwards;
        transform-origin: bottom left;
    }
`;
document.head.appendChild(style);
