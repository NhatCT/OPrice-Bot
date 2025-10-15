import React, { useState } from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { GuidedInputForm } from './GuidedInputForm';
import type { Task } from './GuidedInputForm';
import type { ChatMessage } from '../types';

type ImageData = ChatMessage['image'];

interface MessageInputProps {
  onSendMessage: (message: string, image?: ImageData) => void;
  isLoading: boolean;
  onNewChat: () => void;
  onClearChat: () => void;
  activeTool: Task | null;
  setActiveTool: (tool: Task | null) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  onNewChat, 
  onClearChat, 
  activeTool, 
  setActiveTool 
}) => {
  const [input, setInput] = useState('');
  const [isToolPopoverOpen, setIsToolPopoverOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };
  
  const handleToolSelect = (tool: Task) => {
    setActiveTool(tool);
    setIsToolPopoverOpen(false);
  };
  
  const actionButtonClass = "flex items-center justify-center space-x-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg px-3 py-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

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
    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center space-x-2 mb-3 relative">
            <button onClick={onNewChat} className={actionButtonClass} disabled={isLoading} title="Bắt đầu cuộc trò chuyện mới">
                <PlusIcon className="w-4 h-4" />
                <span>Bắt đầu lại</span>
            </button>
            <button onClick={() => setIsToolPopoverOpen(prev => !prev)} className={actionButtonClass} disabled={isLoading} title="Hỗ trợ tính giá">
                <CalculatorIcon className="w-4 h-4" />
                <span>Hỗ trợ tính giá</span>
            </button>
            <button onClick={onClearChat} className={`${actionButtonClass} hover:text-red-500`} disabled={isLoading} title="Xóa lịch sử cuộc trò chuyện">
                <TrashIcon className="w-4 h-4" />
                <span>Xóa lịch sử</span>
            </button>

            {isToolPopoverOpen && (
                <div 
                    onMouseLeave={() => setIsToolPopoverOpen(false)}
                    className="absolute bottom-full mb-2 w-56 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-2 z-10 animate-fade-in-up"
                    role="menu"
                >
                    <button onClick={() => handleToolSelect('selling-price')} role="menuitem" className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600/70 rounded-md transition-colors duration-200">Tính giá bán</button>
                    <button onClick={() => handleToolSelect('promo-price')} role="menuitem" className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600/70 rounded-md transition-colors duration-200">Tính giá khuyến mãi</button>
                    <button onClick={() => handleToolSelect('group-price')} role="menuitem" className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600/70 rounded-md transition-colors duration-200">Tính giá đồng giá</button>
                </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập yêu cầu của bạn ở đây..."
            disabled={isLoading}
            className="flex-1 w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-300 border border-slate-200 dark:border-transparent"
            autoComplete="off"
            />
            <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-sky-600 text-white rounded-full p-3 hover:bg-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800"
            aria-label="Send message"
            >
            <PaperAirplaneIcon className="w-6 h-6" />
            </button>
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
        transform-origin: bottom center;
    }
`;
document.head.appendChild(style);