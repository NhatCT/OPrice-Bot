import React from 'react';
import { XIcon } from './icons/XIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { FolderIcon } from './icons/FolderIcon';

interface OnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-400">{description}</p>
        </div>
    </div>
);


export const OnboardingDialog: React.FC<OnboardingDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center"
        aria-modal="true"
        role="dialog"
        onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl m-4 transform transition-all animate-dialog-in"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
             <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Chào mừng đến với Trợ lý V64!</h2>
             <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Đóng hộp thoại">
                <XIcon className="w-6 h-6" />
             </button>
        </header>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            <p className="text-lg text-slate-600 dark:text-slate-300">Dưới đây là tổng quan nhanh về các khu vực chính để giúp bạn bắt đầu:</p>
            <div className="space-y-5">
                <Feature
                    icon={<ChatBubbleIcon className="w-7 h-7" />}
                    title="1. Trò chuyện & Hỏi đáp"
                    description="Đây là nơi bạn tương tác chính. Đặt câu hỏi tự nhiên hoặc sử dụng các gợi ý để bắt đầu cuộc trò chuyện với AI."
                />
                <Feature
                    icon={<BriefcaseIcon className="w-7 h-7" />}
                    title="2. Công cụ Phân tích"
                    description="Sử dụng các biểu mẫu có cấu trúc để thực hiện các phân tích kinh doanh chuyên sâu như lợi nhuận, khuyến mãi, xu hướng thị trường."
                />
                <Feature
                    icon={<ArchiveBoxIcon className="w-7 h-7" />}
                    title="3. Quản lý Sản phẩm & Dữ liệu"
                    description="Trong mục 'Sản phẩm', hãy cập nhật danh mục sản phẩm, giá vốn, giá bán... để AI có dữ liệu chính xác nhất cho các phân tích."
                />
                <Feature
                    icon={<FolderIcon className="w-7 h-7" />}
                    title="4. Quản lý Hội thoại"
                    description="Thanh bên trái giúp bạn tổ chức các cuộc trò chuyện. Bạn có thể đổi tên, xóa, hoặc nhóm chúng lại để dễ dàng quản lý."
                />
            </div>
        </div>

        <footer className="p-4 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
                onClick={onClose}
                className="px-6 py-3 text-lg font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors duration-300"
            >
                Bắt đầu
            </button>
        </footer>
      </div>
    </div>
  );
};
