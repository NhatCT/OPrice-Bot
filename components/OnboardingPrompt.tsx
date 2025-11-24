import React from 'react';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';

interface OnboardingPromptProps {
  onConfirm: () => void;
  onDecline: () => void;
}

export const OnboardingPrompt: React.FC<OnboardingPromptProps> = ({ onConfirm, onDecline }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 w-full max-w-sm animate-fade-in-up-toolbar">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
            <QuestionMarkCircleIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Chào mừng bạn!</h3>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
              Đây có phải lần đầu bạn sử dụng? Bạn có muốn xem hướng dẫn nhanh về các tính năng chính không?
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onDecline}
            className="px-4 py-2 text-base font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors duration-300"
          >
            Bỏ qua
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors duration-300"
          >
            Xem hướng dẫn
          </button>
        </div>
      </div>
    </div>
  );
};
