import React from 'react';
import { XIcon } from './icons/XIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPng: () => void;
  onExportTxt: () => void;
  isExporting: boolean;
}

const ExportOptionButton: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    disabled: boolean;
}> = ({ icon, title, description, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full text-left p-4 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
    >
        <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-sky-500 bg-sky-100 dark:bg-sky-900/40 rounded-lg">{icon}</div>
            <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
    </button>
);


export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, onExportPng, onExportTxt, isExporting }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center"
        aria-modal="true"
        role="dialog"
        onClick={isExporting ? undefined : onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg m-4 transform transition-all animate-dialog-in"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Xuất cuộc trò chuyện</h2>
             <button onClick={onClose} disabled={isExporting} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50" aria-label="Đóng hộp thoại">
                <XIcon className="w-6 h-6" />
             </button>
        </header>

        <div className="p-6 relative">
            {isExporting && (
                <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm flex flex-col justify-center items-center z-10 rounded-b-2xl">
                    <svg className="animate-spin h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">Đang xuất, vui lòng chờ...</p>
                </div>
            )}
            <div className="space-y-4">
                 <ExportOptionButton
                    icon={<PhotoIcon className="w-6 h-6" />}
                    title="Xuất dưới dạng Ảnh (.png)"
                    description="Chụp lại toàn bộ cuộc trò chuyện thành một file ảnh duy nhất."
                    onClick={onExportPng}
                    disabled={isExporting}
                />
                 <ExportOptionButton
                    icon={<DocumentTextIcon className="w-6 h-6" />}
                    title="Xuất dưới dạng Văn bản (.txt)"
                    description="Lưu nội dung cuộc trò chuyện vào một file text có cấu trúc."
                    onClick={onExportTxt}
                    disabled={isExporting}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

// Ensure animation styles are present
const style = document.createElement('style');
if (!document.querySelector('[data-animation="dialog-in"]')) {
    style.setAttribute('data-animation', 'dialog-in');
    style.innerHTML = `
        @keyframes dialogIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-dialog-in {
            animation: dialogIn 0.2s ease-out forwards;
        }
    `;
    document.head.appendChild(style);
}