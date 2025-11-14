import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex justify-center items-center"
        aria-modal="true"
        role="dialog"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md m-4 p-6 transform transition-all animate-dialog-in">
        <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-3">{title}</h2>
        <p className="text-2xl text-slate-600 dark:text-slate-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            className="px-6 py-3 rounded-lg font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 text-xl"
          >
            Hủy
          </button>
          <button 
            onClick={onConfirm} 
            className="px-6 py-3 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 text-xl"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

const style = document.createElement('style');
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