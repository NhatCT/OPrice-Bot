import React from 'react';
import type { Task } from '../types';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { TagIcon } from './icons/TagIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { TableCellsIcon } from './icons/TableCellsIcon';

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
        className="text-left p-6 bg-white/50 dark:bg-slate-800/50 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-500/30 group"
    >
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors duration-300">{icon}</div>
            <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        </div>
        <p className="mt-2 text-xl text-slate-500 dark:text-slate-400 pl-16">{description}</p>
    </button>
);

export const Welcome: React.FC<WelcomeProps> = ({ onSuggestionClick, onToolSelect }) => {
    return (
        <div className="flex-1 flex flex-col justify-center items-center p-6 overflow-y-auto relative">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
            </div>

            <div className="text-center mb-10">
                <SparklesIcon className="w-20 h-20 mx-auto text-blue-500 mb-4" />
                <h1 className="text-4xl sm:text-7xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Trợ lý Kinh doanh V64</h1>
                <p className="mt-3 text-2xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                    Tôi có thể giúp bạn phân tích chiến lược giá hoặc trả lời các câu hỏi về V64. Hãy chọn một gợi ý bên dưới để bắt đầu!
                </p>
            </div>
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* --- Tool Starters --- */}
                 <StarterPromptCard
                    icon={<GlobeAltIcon className="w-8 h-8" />}
                    title="Nghiên cứu Xu hướng & BST"
                    description="Phân tích xu hướng, lên ý tưởng BST, và đề xuất các thiết kế cụ thể."
                    onClick={() => onToolSelect('market-research')}
                />
                <StarterPromptCard
                    icon={<TableCellsIcon className="w-8 h-8" />}
                    title="Hỏi đáp về Bảng tính"
                    description="Đặt câu hỏi về dữ liệu sản phẩm từ Google Sheet đã cung cấp."
                    onClick={() => onSuggestionClick('Lợi nhuận của sản phẩm Áo Khoác Nam là bao nhiêu?')}
                />
                <StarterPromptCard
                    icon={<ChartBarIcon className="w-8 h-8" />}
                    title="Phân tích Lợi nhuận"
                    description="Tính giá bán, số lượng, lợi nhuận và so sánh với đối thủ."
                    onClick={() => onToolSelect('profit-analysis')}
                />
                <StarterPromptCard
                    icon={<TagIcon className="w-8 h-8" />}
                    title="Phân tích Khuyến mãi"
                    description="Đánh giá hiệu quả giảm giá và giá cạnh tranh."
                    onClick={() => onToolSelect('promo-price')}
                />
                <StarterPromptCard
                    icon={<CollectionIcon className="w-8 h-8" />}
                    title="Phân tích Đồng giá"
                    description="So sánh lợi nhuận khi áp dụng chính sách đồng giá."
                    onClick={() => onToolSelect('group-price')}
                />
                {/* --- Q&A Starters --- */}
                 <StarterPromptCard
                    icon={<QuestionMarkCircleIcon className="w-8 h-8" />}
                    title="Hỏi về V64"
                    description="Tìm hiểu về các giải pháp và dịch vụ V64 cung cấp."
                    onClick={() => onSuggestionClick('V64 cung cấp những giải pháp công nghệ nào?')}
                />
            </div>
        </div>
    );
};