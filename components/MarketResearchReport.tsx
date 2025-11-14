import React, { useState, useEffect } from 'react';
import type { MarketResearchData } from '../types';
import { AnalysisChart } from './charts/AnalysisChart';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { SwatchIcon } from './icons/SwatchIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface MarketResearchReportProps {
  data: MarketResearchData;
  theme: 'light' | 'dark';
}

const ReportSection: React.FC<{
    title: string; 
    children: React.ReactNode
}> = ({ title, children }) => {
    return (
        <div className="report-section">
            <div className={`report-section-header flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4`}>
                <SparklesIcon className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:before:content-none prose-p:after:content-none leading-relaxed">
                {children}
            </div>
        </div>
    );
};

interface ImageWithStatusProps {
    srcs?: string[];
    alt: string;
}

const ImageWithStatus: React.FC<ImageWithStatusProps> = ({ srcs, alt }) => {
    const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    const currentSrc = srcs?.[currentSrcIndex];

    useEffect(() => {
        // Reset state when srcs array changes
        setCurrentSrcIndex(0);
        if (srcs && srcs.length > 0) {
            setStatus('loading');
        } else {
            setStatus('error'); // No sources provided
        }
    }, [srcs]);

    const handleError = () => {
        // If there's another source to try, switch to it
        if (srcs && currentSrcIndex < srcs.length - 1) {
            setCurrentSrcIndex(prevIndex => prevIndex + 1);
            setStatus('loading'); // Set to loading for the new source
        } else {
            // No more sources to try
            setStatus('error');
        }
    };

    if (!srcs || srcs.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50">
                <div className="animate-pulse flex flex-col items-center justify-center">
                    <PhotoIcon className="w-12 h-12 opacity-50" />
                    <p className="text-xs mt-2">Đang chuẩn bị ảnh...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 text-center">
                <XCircleIcon className="w-12 h-12 opacity-60" />
                <p className="text-xs mt-2 font-medium">Không tìm thấy ảnh</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center relative bg-slate-100 dark:bg-slate-800/50">
            {status === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 animate-pulse">
                    <PhotoIcon className="w-12 h-12" />
                    <p className="text-xs mt-2">Đang tải ảnh...</p>
                </div>
            )}
            {currentSrc && (
                <img
                    key={currentSrc} // Add key to force re-render when src changes
                    src={currentSrc}
                    alt={alt}
                    onLoad={() => setStatus('loaded')}
                    onError={handleError}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                />
            )}
        </div>
    );
};


export const MarketResearchReport: React.FC<MarketResearchReportProps> = ({ data, theme }) => {
  const { trend_sections, wash_effect_summary, charts } = data;

  return (
    <div className="space-y-8">
      {trend_sections?.map((section, index) => (
        <ReportSection key={index} title={section.title}>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap mb-6">{section.description}</div>

          {section.key_items && section.key_items.length > 0 && (
            <div className="mt-6 not-prose grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {section.key_items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="item-card flex flex-col rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm"
                >
                  <div className="aspect-[3/4]">
                    <ImageWithStatus
                        srcs={item.image_urls}
                        alt={item.inspiration_source}
                    />
                  </div>
                  <div className="p-3 text-center">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {item.inspiration_source}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ReportSection>
      ))}

      {wash_effect_summary?.table && (
        <div className="report-section">
            <div className={`report-section-header flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4`}>
                 <SwatchIcon className="w-6 h-6 text-sky-500" />
                 <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{wash_effect_summary.title}</h2>
            </div>
            <div className="overflow-x-auto my-4">
                <table className="table-auto w-full border-collapse border border-slate-300 dark:border-slate-600">
                <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                    <th className="border border-slate-200 dark:border-slate-600 px-4 py-2 text-left font-semibold text-slate-800 dark:text-slate-200">
                        Loại Wash
                    </th>
                    <th className="border border-slate-200 dark:border-slate-600 px-4 py-2 text-left font-semibold text-slate-800 dark:text-slate-200">
                        Ứng dụng & Hiệu quả
                    </th>
                    </tr>
                </thead>
                <tbody>
                    {wash_effect_summary.table.map((row, index) => (
                    <tr
                        key={index}
                        className="border-b border-slate-200 dark:border-slate-600 last:border-b-0"
                    >
                        <td className="border border-slate-200 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300 font-medium">
                        {row.wash_type}
                        </td>
                        <td className="border border-slate-200 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">
                        {row.application_effect}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      )}

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