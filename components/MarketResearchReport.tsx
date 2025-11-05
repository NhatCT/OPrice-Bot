import React, { useState, useEffect } from 'react';
import type { MarketResearchData } from '../types';
import { AnalysisChart } from './charts/AnalysisChart';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { SwatchIcon } from './icons/SwatchIcon';
import { TagIcon } from './icons/TagIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { ColorSwatchRenderer } from './ColorSwatchRenderer';
import { XCircleIcon } from './icons/XCircleIcon';

interface MarketResearchReportProps {
  data: MarketResearchData;
  theme: 'light' | 'dark';
}

const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
    scissors: { icon: <ScissorsIcon className="w-5 h-5" />, color: 'text-sky-500' },
    swatch: { icon: <SwatchIcon className="w-5 h-5" />, color: 'text-purple-500' },
    tag: { icon: <TagIcon className="w-5 h-5" />, color: 'text-amber-500' },
    sparkles: { icon: <SparklesIcon className="w-5 h-5" />, color: 'text-pink-500' },
    lightbulb: { icon: <LightBulbIcon className="w-5 h-5" />, color: 'text-yellow-500' },
    'shopping-bag': { icon: <ShoppingBagIcon className="w-5 h-5" />, color: 'text-green-500' },
    globe: { icon: <GlobeAltIcon className="w-5 h-5" />, color: 'text-blue-500' },
    default: { icon: <div className="w-5 h-5" />, color: 'text-slate-500' },
};

const ReportSection: React.FC<{
    title: string; 
    iconName: string; 
    children: React.ReactNode
}> = ({ title, iconName, children }) => {
    const { icon, color } = iconMap[iconName] || iconMap.default;
    return (
        <div className="report-section">
            <div className={`report-section-header flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 ${color}`}>
                {icon}
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:before:content-none prose-p:after:content-none leading-relaxed">
                {children}
            </div>
        </div>
    );
};

const ImageWithStatus: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    setStatus('loading');
  }, [src]);

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-slate-100 dark:bg-slate-700/50">
      {status === 'loading' && (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 animate-pulse">
          <PhotoIcon className="w-12 h-12" />
          <p className="text-xs mt-2">Đang tải ảnh...</p>
        </div>
      )}
      {status === 'error' && (
        <div className="w-full h-full flex flex-col items-center justify-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 text-center">
          <XCircleIcon className="w-12 h-12 opacity-60" />
          <p className="text-xs mt-2 font-medium">Không thể tải ảnh</p>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        style={{ position: status === 'loaded' ? 'static' : 'absolute' }}
      />
    </div>
  );
};


export const MarketResearchReport: React.FC<MarketResearchReportProps> = ({ data, theme }) => {

    const { global_analysis, collection_concepts, key_items, charts } = data;

    return (
        <div className="space-y-8">
            {/* Global Analysis */}
            {global_analysis && (
                <ReportSection title={global_analysis.title} iconName="globe">
                    <div className="space-y-6">
                        {global_analysis.sections.map((section, index) => (
                             <div key={index}>
                                <div className={`flex items-center gap-2 mb-2 ${iconMap[section.icon]?.color || 'text-slate-500'}`}>
                                    {iconMap[section.icon]?.icon || iconMap.default.icon}
                                    <h4 className="font-semibold">{section.title}</h4>
                                </div>
                                <div className="text-slate-600 dark:text-slate-300 ml-7">
                                    <ColorSwatchRenderer text={section.content} />
                                </div>
                             </div>
                        ))}
                    </div>
                </ReportSection>
            )}

            {/* Collection Concepts */}
            {collection_concepts && collection_concepts.length > 0 && (
                <ReportSection title="BƯỚC 2: PHÁT TRIỂN Ý TƯỞNG BỘ SƯU TẬP" iconName="lightbulb">
                    <div className="space-y-6">
                        {collection_concepts.map((concept, index) => (
                            <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                                <h4 className="font-bold text-base text-blue-600 dark:text-blue-400">{concept.name}</h4>
                                <div><strong>Cảm hứng:</strong> <ColorSwatchRenderer text={concept.description} /></div>
                                <div><strong>Bảng màu:</strong> <ColorSwatchRenderer text={concept.color_palette} /></div>
                                <div><strong>Chất liệu:</strong> <ColorSwatchRenderer text={concept.materials} /></div>
                            </div>
                        ))}
                    </div>
                </ReportSection>
            )}

            {/* Key Items with Images */}
            {key_items && key_items.length > 0 && (
                <ReportSection title="BƯỚC 3: ĐỀ XUẤT CÁC THIẾT KẾ SẢN PHẨM CHỦ LỰC" iconName="shopping-bag">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {key_items.map((item, index) => (
                            <div key={index} className="item-card border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col">
                                <div className="aspect-square">
                                   {item.image_url ? (
                                        <ImageWithStatus src={item.image_url} alt={item.item_name} />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50">
                                            <PhotoIcon className="w-12 h-12 opacity-50" />
                                            <p className="text-xs mt-2">Không có ảnh tham khảo</p>
                                        </div>
                                    )}
                                </div>
                                <div className="item-card-content p-4 flex-grow">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{item.item_name}</h4>
                                    <div className="text-slate-600 dark:text-slate-300 text-sm mt-1">
                                        <ColorSwatchRenderer text={item.description} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ReportSection>
            )}

            {/* Charts */}
            {charts && charts.length > 0 && (
                <div>
                    {charts.map((chart, index) => (
                        <AnalysisChart key={index} chart={chart} theme={theme} />
                    ))}
                </div>
            )}
        </div>
    );
};