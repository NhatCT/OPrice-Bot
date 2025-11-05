import React from 'react';
import { XIcon } from './icons/XIcon';
import { WorkflowInfo } from './WorkflowInfo';

interface WorkflowDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icons for workflow steps, defined inline for simplicity
const StepIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
        {children}
    </div>
);
const SelectIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const FormIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const AnalysisIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const ResultIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

export const WorkflowDialog: React.FC<WorkflowDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center"
        aria-modal="true"
        role="dialog"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl m-4 transform transition-all animate-dialog-in"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Quy trình làm việc</h2>
             <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Đóng hộp thoại">
                <XIcon className="w-6 h-6" />
             </button>
        </header>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
            <WorkflowInfo />

             <div className="border-t border-slate-200 dark:border-slate-600/70 pt-8"></div>
            
            <section>
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Hỗ trợ tính giá & Hỏi đáp V64</h3>
                 <ul className="space-y-4">
                    <li className="flex items-start space-x-4">
                        <StepIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></StepIcon>
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">1. Chọn công cụ hoặc Đặt câu hỏi</h4>
                            <p className="text-slate-600 dark:text-slate-300 text-sm">Sử dụng các công cụ phân tích chuyên sâu (Lợi nhuận, Khuyến mãi...) hoặc nhập câu hỏi về V64 vào ô chat.</p>
                        </div>
                    </li>
                    <li className="flex items-start space-x-4">
                        <StepIcon><SearchIcon /></StepIcon>
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">2. AI Phân tích & Tìm kiếm</h4>
                            <p className="text-slate-600 dark:text-slate-300 text-sm">AI sẽ áp dụng mô hình kinh doanh hoặc tìm kiếm thông tin chính xác từ toàn bộ website v64.vn.</p>
                        </div>
                    </li>
                     <li className="flex items-start space-x-4">
                        <StepIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17z" /></svg></StepIcon>
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">3. Nhận câu trả lời</h4>
                            <p className="text-slate-600 dark:text-slate-300 text-sm">Nhận phân tích chi tiết, biểu đồ trực quan, hoặc câu trả lời ngắn gọn kèm nguồn tham khảo đáng tin cậy.</p>
                        </div>
                    </li>
                </ul>
            </section>
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