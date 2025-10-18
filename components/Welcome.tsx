
import React from 'react';
import type { Task } from './GuidedInputForm';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { TagIcon } from './icons/TagIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';

interface WelcomeProps {
    onSuggestionClick: (suggestion: string) => void;
    onToolSelect: (tool: Task) => void;
}

const StarterPromptCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="text-left p-4 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700/50 transition-all duration-200 hover:shadow-md hover:-translate-y-1"
    >
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sky-500">{icon}</div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 pl-11">{description}</p>
    </button>
);

export const Welcome: React.FC<WelcomeProps> = ({ onSuggestionClick, onToolSelect }) => {
    return (
        <div className="flex-1 flex flex-col justify-center items-center p-6 overflow-y-auto">
            <div className="text-center mb-8">
                <SparklesIcon className="w-16 h-16 mx-auto text-sky-500 mb-4" />
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Chào mừng đến với Trợ lý Kinh doanh V64</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                    Tôi có thể giúp bạn phân tích chiến lược giá hoặc trả lời các câu hỏi về V64. Hãy chọn một gợi ý bên dưới để bắt đầu!
                </p>
            </div>
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* --- Tool Starters --- */}
                <StarterPromptCard
                    icon={<ChartBarIcon className="w-6 h-6" />}
                    title="Phân tích Lợi nhuận"
                    description="Tính giá bán, doanh số hoặc lợi nhuận mục tiêu."
                    onClick={() => onToolSelect('profit-analysis')}
                />
                <StarterPromptCard
                    icon={<TagIcon className="w-6 h-6" />}
                    title="Phân tích Khuyến mãi"
                    description="Đánh giá hiệu quả của một chiến dịch giảm giá."
                    onClick={() => onToolSelect('promo-price')}
                />
                <StarterPromptCard
                    icon={<CollectionIcon className="w-6 h-6" />}
                    title="Phân tích Đồng giá"
                    description="So sánh lợi nhuận khi áp dụng chính sách đồng giá."
                    onClick={() => onToolSelect('group-price')}
                />
                {/* --- Q&A Starters --- */}
                <StarterPromptCard
                    icon={<QuestionMarkCircleIcon className="w-6 h-6" />}
                    title="Giải pháp của V64"
                    description="Hỏi về các giải pháp và dịch vụ mà V64 cung cấp."
                    onClick={() => onSuggestionClick('V64 cung cấp những giải pháp công nghệ nào?')}
                />
                 <StarterPromptCard
                    icon={<BriefcaseIcon className="w-6 h-6" />}
                    title="Dự án tiêu biểu"
                    description="Tìm hiểu về các dự án thành công của V64."
                    onClick={() => onSuggestionClick('Kể tên một vài dự án tiêu biểu của V64.')}
                />
                 <StarterPromptCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071 1.052A32.942 32.942 0 0 1 12 12.001a32.942 32.942 0 0 1-1.108-8.662.75.75 0 0 0-1.072-1.052A34.439 34.439 0 0 0 12 13.5c1.242 0 2.454-.154 3.595-.448.753-.195 1.488-.45 2.195-.76.707-.31 1.383-.683 2.008-1.12.625-.437 1.18-1.01 1.62-1.724a.75.75 0 0 0-1.1-1.028A23.55 23.55 0 0 1 12 11.952c-1.35 0-2.673-.17-3.953-.5-1.28-.33-2.505-.756-3.645-1.272a.75.75 0 0 0-.635 1.344c.635.3 1.28.567 1.94.793.66.226 1.343.418 2.045.57a.75.75 0 1 0 .33-1.463c-.6-.13-1.18-.3-1.74-.505a.75.75 0 0 0-.859.974c.43.918 1.05 1.74 1.81 2.42s1.68.96 2.62 1.32c.94.36 1.98.608 3.09.734a.75.75 0 0 0 .736-.745 44.45 44.45 0 0 0-1.28-11.234Z" clipRule="evenodd" /></svg>}
                    title="So sánh giá thị trường"
                    description="Bắt đầu phân tích lợi nhuận và so sánh với đối thủ."
                    onClick={() => onSuggestionClick('Hãy phân tích lợi nhuận cho sản phẩm "Áo Thun Thể Thao V64" với giá vốn 80000, chi phí biến đổi 15000, chi phí cố định 20tr, doanh số 500, lợi nhuận mục tiêu 50tr và tham khảo giá thị trường.')}
                />
            </div>
        </div>
    );
};
