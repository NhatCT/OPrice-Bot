
import React from 'react';
import type { Task } from '../types';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { TagIcon } from './icons/TagIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';

interface WelcomeProps {
    onSuggestionClick: (suggestion: string) => void;
    onToolSelect: (tool: Task) => void;
    onNavigateToProducts: () => void;
}

const GlassCard3D: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    color: string;
    delay: number;
}> = ({ icon, title, description, onClick, color, delay }) => (
    <button
        onClick={onClick}
        className="card-3d relative overflow-hidden text-left p-6 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 group"
        style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
        <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/0 to-${color}-500/0 group-hover:from-${color}-500/10 group-hover:to-${color}-500/5 transition-all duration-500`}></div>
        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${color}-500/20 rounded-full blur-3xl group-hover:bg-${color}-500/30 transition-all duration-500`}></div>
        
        <div className="relative z-10 flex flex-col h-full">
            <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-900/30 flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <div className={`text-${color}-600 dark:text-${color}-400`}>
                    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-7 h-7" })}
                </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-grow">
                {description}
            </p>
            <div className="mt-5 flex items-center text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                <span>KHÁM PHÁ NGAY</span>
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </div>
        </div>
    </button>
);

export const Welcome: React.FC<WelcomeProps> = ({ onSuggestionClick, onToolSelect, onNavigateToProducts }) => {
    return (
        <div className="flex-1 flex flex-col items-center overflow-y-auto w-full h-full relative scroll-smooth">
            <div className="w-full max-w-6xl mx-auto px-6 pt-16 pb-10 text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm mb-8 animate-fade-in-up">
                    <SparklesIcon className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-slate-800 to-slate-500 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                        V64 Business Intelligence
                    </span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <span className="block text-slate-900 dark:text-white mb-2">Kinh doanh Thông minh.</span>
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">Quyết định Đột phá.</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Trợ lý AI chuyên biệt giúp tối ưu hóa lợi nhuận, dự báo xu hướng và vận hành doanh nghiệp thời trang V-SIXTYFOUR.
                </p>
            </div>
            <div className="w-full max-w-7xl mx-auto px-6 pb-24 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <GlassCard3D icon={<GlobeAltIcon />} title="Nghiên cứu Xu hướng" description="Phân tích xu hướng toàn cầu, tìm kiếm ý tưởng và cảm hứng cho BST mới." onClick={() => onToolSelect('market-research')} color="purple" delay={300} />
                    <GlassCard3D icon={<ChartBarIcon />} title="Phân tích Lợi nhuận" description="Tính toán chi tiết giá thành (COGS), lợi nhuận biên và điểm hòa vốn." onClick={() => onToolSelect('profit-analysis')} color="blue" delay={400} />
                    <GlassCard3D icon={<ArchiveBoxIcon />} title="Quản lý Sản phẩm" description="Hệ thống hóa danh mục, cập nhật giá vốn/bán để dữ liệu luôn chính xác." onClick={onNavigateToProducts} color="emerald" delay={500} />
                    <GlassCard3D icon={<TagIcon />} title="Chiến lược Khuyến mãi" description="Mô phỏng các kịch bản giảm giá và tác động của chúng đến doanh thu ròng." onClick={() => onToolSelect('promo-price')} color="rose" delay={600} />
                    <GlassCard3D icon={<CollectionIcon />} title="Phân tích Đồng giá" description="Tối ưu hóa chiến lược bán combo và xả hàng tồn kho hiệu quả." onClick={() => onToolSelect('group-price')} color="orange" delay={700} />
                    <GlassCard3D icon={<QuestionMarkCircleIcon />} title="Hỏi đáp Thông minh" description="Hỗ trợ tức thì mọi thắc mắc về quy trình vận hành và chính sách công ty." onClick={() => onSuggestionClick('Quy trình phát triển mẫu mới gồm những bước nào?')} color="cyan" delay={800} />
                </div>
            </div>
        </div>
    );
};
