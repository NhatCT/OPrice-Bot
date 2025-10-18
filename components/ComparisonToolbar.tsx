import React from 'react';
import type { ChatMessage } from '../types';
import { XIcon } from './icons/XIcon';
import { ScaleIcon } from './icons/ScaleIcon';

interface ComparisonToolbarProps {
  selection: number[];
  messages: ChatMessage[];
  onCompare: () => void;
  onClear: () => void;
}

export const ComparisonToolbar: React.FC<ComparisonToolbarProps> = ({ selection, messages, onCompare, onClear }) => {
  const selectionCount = selection.length;
  const canCompare = selectionCount === 2;

  const getMessageTitle = (index: number) => {
    if (!messages[index]) return `Phản hồi #${index + 1}`;
    // Find the previous user message for context
    for (let i = index - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
            return `cho: "${messages[i].content.substring(0, 20)}..."`;
        }
    }
    return `Phản hồi #${index + 1}`;
  };

  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-b border-slate-200 dark:border-slate-700 shrink-0 animate-fade-in-up-toolbar">
      <div className="bg-white dark:bg-slate-700/60 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 flex items-center justify-between p-3">
        <div className="flex items-center gap-3 min-w-0">
          <ScaleIcon className="w-6 h-6 text-purple-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              {canCompare ? 'Sẵn sàng so sánh' : `Đã chọn ${selectionCount}/2 phản hồi`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {canCompare
                ? `So sánh phản hồi ${getMessageTitle(selection[0])} và ${getMessageTitle(selection[1])}`
                : 'Chọn một phản hồi khác để so sánh nguồn.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onCompare}
            disabled={!canCompare}
            className="px-4 py-1.5 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            So sánh
          </button>
          <button
            onClick={onClear}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Clear selection"
            title="Bỏ chọn"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUpToolbar {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up-toolbar { animation: fadeInUpToolbar 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};
