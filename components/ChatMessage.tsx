import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Theme } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { ThumbUpIcon } from './icons/ThumbUpIcon';
import { ThumbDownIcon } from './icons/ThumbDownIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { V64Logo } from './icons/V64Logo';
import { LightningBoltIcon } from './icons/LightningBoltIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';
import { toPng } from 'html-to-image';
import { TableCellsIcon } from './icons/TableCellsIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { EllipsisHorizontalIcon } from './icons/EllipsisHorizontalIcon';
import { TypingIndicator } from './TypingIndicator';
import { FunnelIcon } from './icons/FunnelIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { ColorSwatchRenderer } from './ColorSwatchRenderer';
import { PencilIcon } from './icons/PencilIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { WandIcon } from './icons/WandIcon';

interface ChatMessageProps {
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  onFeedback: (feedback: 'positive') => void;
  onOpenFeedbackDialog: (message: ChatMessage, index: number) => void;
  onRegenerate: (index: number) => void;
  onRefine: () => void;
  index: number;
  onToggleCompare: (index: number) => void;
  isSelectedForCompare: boolean;
  onEditAnalysis: (message: ChatMessage) => void;
  sourceFilter?: string;
  effectiveTheme: 'light' | 'dark';
  isLastMessage: boolean;
  isLoading: boolean;
  onSourceFilterChange: (uri: string | null) => void;
  isEditing: boolean;
  onInitiateEdit: (messageId: number) => void;
  onSaveEdit: (messageId: number, newContent: string) => void;
  onCancelEdit: () => void;
}

const renderWithColorSwatches = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, child => {
        if (typeof child === 'string' && child.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/)) {
            return <ColorSwatchRenderer text={child} />;
        }
        if (React.isValidElement(child)) {
            const props = child.props as { children?: React.ReactNode; [key: string]: any };
            if (props.children) {
                const newProps = {
                    ...props,
                    children: renderWithColorSwatches(props.children)
                };
                return React.cloneElement(child, newProps);
            }
        }
        return child;
    });
};

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, onSuggestionClick, onFeedback, onOpenFeedbackDialog, onRegenerate, onRefine, index, onToggleCompare, isSelectedForCompare, onEditAnalysis, sourceFilter, effectiveTheme, isLastMessage, isLoading, onSourceFilterChange, isEditing, onInitiateEdit, onSaveEdit, onCancelEdit }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isRawPromptCopied, setIsRawPromptCopied] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showOriginal, setShowOriginal] = useState(false);
  const messageContentRef = useRef<HTMLDivElement>(null);
  const actionsButtonRef = useRef<HTMLDivElement>(null);
  const editTextAreaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    setEditText(message.content);
  }, [message.content]);
  
  useEffect(() => {
      if (isEditing && editTextAreaRef.current) {
          const textarea = editTextAreaRef.current;
          textarea.focus();
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
      }
  }, [isEditing]);

  const handleEditTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditText(e.target.value);
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleSaveEdit = () => {
      if (message.id != null && editText.trim() !== '') {
          onSaveEdit(message.id, editText);
      }
  };
  
  const contentToDisplay = showOriginal && message.originalContent ? message.originalContent : message.content;
  const languageToggleTitle = showOriginal ? "Hiển thị bản dịch" : "Hiển thị bản gốc";

  const isModel = message.role === 'model';
  const hasSuggestions = isModel && message.suggestions && message.suggestions.length > 0 && !isLoading && isLastMessage;
  const hasSources = isModel && message.sources && message.sources.length > 0;
  const hasPerformance = isModel && message.performance && message.performance.totalTime > 0;
  const feedbackGiven = !!message.feedback;
  const canCompare = isModel && message.sources && message.sources.length > 0;
  const canEdit = isModel && !!message.analysisParams && !!message.task;
  const canExport = isModel && (!!message.analysisParams || !!message.marketResearchData) && !!message.task;
  const hasSummary = message.summary && message.summary.trim() !== '';
  const showTypingIndicator = isModel && isLastMessage && isLoading && !message.content && !message.component;
  const showCursor = isModel && isLastMessage && isLoading && !message.component && !!message.content;
  const isAnalysisTask = isModel && !!message.task && message.task !== 'market-research' && message.task !== 'brand-positioning';
  
  const chartsWithData = message.charts?.filter(chart => {
    if (!chart.data || !Array.isArray(chart.data) || chart.data.length === 0) {
        return false;
    }
    const firstPoint = chart.data[0];
    if (typeof firstPoint !== 'object' || firstPoint === null) return false;
    
    const dataKey = Object.keys(firstPoint).find(key => key !== 'name');
    if (!dataKey) return false;
    
    return chart.data.some((point: any) => point && typeof point[dataKey] === 'number' && Number.isFinite(point[dataKey]));
  });
  const noChartsGenerated = isAnalysisTask && (!chartsWithData || chartsWithData.length === 0) && !message.component && !showTypingIndicator;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsButtonRef.current && !actionsButtonRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    const textToCopy = showOriginal && message.originalContent ? message.originalContent : message.content;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };
  
  const handleCopyRawPrompt = () => {
    if (message.role !== 'user' || !message.rawPrompt) return;
    navigator.clipboard.writeText(message.rawPrompt).then(() => {
        setIsRawPromptCopied(true);
        setTimeout(() => setIsRawPromptCopied(false), 2000);
    });
  };

  const handleThumbClick = (feedback: 'positive' | 'negative') => {
    if (feedback === 'positive') {
      onFeedback('positive');
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 3000);
    } else {
      onOpenFeedbackDialog(message, index);
    }
  };

  const generateReportHTML = async (): Promise<string> => {
    const contentEl = messageContentRef.current;
    if (!contentEl) return '';
    
    const clone = contentEl.cloneNode(true) as HTMLDivElement;
    document.body.appendChild(clone);
    clone.style.width = '800px';
    clone.style.backgroundColor = '#ffffff';
    clone.querySelectorAll('.dark').forEach(el => el.classList.remove('dark'));

    const chartElements = clone.querySelectorAll('.analysis-chart-wrapper');
    const chartImagePromises = Array.from(chartElements).map(async chartEl => {
        try {
            const dataUrl = await toPng(chartEl as HTMLElement, { pixelRatio: 2, backgroundColor: '#ffffff' });
            const img = document.createElement('img');
            img.src = dataUrl;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.marginTop = '20px';
            chartEl.replaceWith(img);
        } catch (e) {
            console.error("Chart to image conversion failed", e);
        }
    });

    await Promise.all(chartImagePromises);

    const analysisHtml = clone.innerHTML;
    document.body.removeChild(clone);

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Báo cáo Phân tích - V64</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 800px; margin: 40px auto; padding: 0 20px; }
              h1, h2, h3, h4 { color: #1e293b; }
              h1 { font-size: 2em; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
              h2 { font-size: 1.5em; margin-top: 30px; }
              .summary { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; }
              .report-section { margin-bottom: 2rem; }
              .report-section-header { display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; margin-bottom: 1rem; }
              .report-section-header h3 { font-size: 1.25rem; font-weight: 600; margin: 0; }
              .key-items-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
              .item-card { border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; }
              .item-card img { max-width: 100%; height: auto; }
              .item-card-content { padding: 1rem; }
              .item-card-content h4 { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem; }
              .item-card-content p { font-size: 0.875rem; margin: 0; }
          </style>
      </head>
      <body>
          <h1>Báo cáo Phân tích</h1>
          <div class="summary">
              <p><strong>Loại phân tích:</strong> ${message.task || 'Không rõ'}</p>
              <p><strong>Ngày tạo:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          </div>
          <h2>Nội dung Phân tích</h2>
          <div>${analysisHtml}</div>
      </body>
      </html>
    `;
  };

  const handleExportReport = async () => {
    setIsActionsMenuOpen(false);
    const htmlContent = await generateReportHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const taskName = message.task || 'analysis';
    const safeTaskName = taskName.replace(/[^a-z0-9]/gi, '_');
    link.download = `V64_Report_${safeTaskName}_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportData = () => {
    setIsActionsMenuOpen(false);
    if (!message.charts || message.charts.length === 0) {
        alert('Không có dữ liệu biểu đồ để xuất.');
        return;
    }

    let csvContent = 'Chart Title,Name,Value\n';
    message.charts.forEach((chart: any) => {
        const title = `"${chart.title.replace(/"/g, '""')}"`;
        if (chart.data && Array.isArray(chart.data)) {
            chart.data.forEach((point: any) => {
                const name = `"${point.name.replace(/"/g, '""')}"`;
                csvContent += `${title},${name},${point.value}\n`;
            });
        }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const taskName = message.task || 'analysis';
    const safeTaskName = taskName.replace(/[^a-z0-9]/gi, '_');
    link.download = `V64_Data_${safeTaskName}_${Date.now()}.csv`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const markdownComponents: any = {
      p: ({node, ...props}: any) => <p className="mb-3 last:mb-0 leading-relaxed" {...props}>{renderWithColorSwatches(props.children)}</p>,
      h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mb-4 mt-2" {...props}>{renderWithColorSwatches(props.children)}</h1>,
      h2: ({node, ...props}: any) => <h2 className="text-xl font-semibold mb-3 mt-1" {...props}>{renderWithColorSwatches(props.children)}</h2>,
      h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold mb-2" {...props}>{renderWithColorSwatches(props.children)}</h3>,
      ul: ({node, ...props}: any) => <ul className="list-disc list-outside space-y-2 mb-3 pl-6" {...props} />,
      ol: ({node, ...props}: any) => <ol className="list-decimal list-outside space-y-2 mb-3 pl-6" {...props} />,
      li: ({node, ...props}: any) => <li className="pl-1" {...props}>{renderWithColorSwatches(props.children)}</li>,
      table: ({node, ...props}: any) => <div className="overflow-x-auto my-4"><table className="table-auto w-full border-collapse border border-slate-300 dark:border-slate-600" {...props} /></div>,
      thead: ({node, ...props}: any) => <thead className="bg-slate-100 dark:bg-slate-700" {...props} />,
      tbody: ({node, ...props}: any) => <tbody {...props} />,
      tr: ({node, ...props}: any) => <tr className="border-b border-slate-200 dark:border-slate-600 last:border-b-0" {...props} />,
      th: ({node, ...props}: any) => <th className="border border-slate-200 dark:border-slate-600 px-4 py-2 text-left font-semibold text-slate-800 dark:text-slate-200" {...props}>{renderWithColorSwatches(props.children)}</th>,
      td: ({node, ...props}: any) => <td className="border border-slate-200 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300" {...props}>{renderWithColorSwatches(props.children)}</td>,
      code: ({node, inline, ...props}: any) => {
        if (inline) {
            return <code className="bg-slate-200 dark:bg-slate-600/50 rounded-sm px-1.5 py-0.5 text-sm font-mono text-blue-800 dark:text-blue-300" {...props}>{renderWithColorSwatches(props.children)}</code>;
        }
        return <code className="font-mono text-sm" {...props} />;
      },
      pre: ({node, ...props}: any) => <pre className="bg-slate-100 dark:bg-slate-900/70 rounded-md p-3 my-3 overflow-x-auto" {...props} />,
      a: ({node, ...props}: any) => <a className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
  };
  
  if (message.role === 'user') {
    return (
        <div className="flex flex-col items-end animate-message-in group relative">
            <div className={`flex items-end gap-2 flex-row-reverse ${isEditing ? 'w-full max-w-xl lg:max-w-3xl' : ''}`}>
                <div 
                    className={`max-w-xl lg:max-w-3xl rounded-2xl shadow-md relative ${isEditing ? 'w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3' : 'px-5 py-4 rounded-br-md text-white'}`}
                    style={!isEditing ? { background: 'var(--brand-gradient)' } : {}}
                >
                    {isEditing ? (
                        <>
                            <textarea
                                ref={editTextAreaRef}
                                value={editText}
                                onChange={handleEditTextChange}
                                className="w-full bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none resize-none text-xl leading-relaxed"
                                rows={1}
                            />
                            <div className="flex justify-end items-center gap-2 mt-2">
                                <button onClick={onCancelEdit} className="px-3 py-1 text-xl font-semibold rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Hủy</button>
                                <button onClick={handleSaveEdit} className="px-3 py-1 text-xl font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors">Lưu & Gửi</button>
                            </div>
                        </>
                    ) : (
                        <>
                            {message.image && (
                                <img src={message.image} alt="User upload" className="mb-3 rounded-lg max-h-60" />
                            )}
                            <div className="prose prose-xl prose-invert max-w-none prose-p:before:content-none prose-p:after:content-none text-white leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...markdownComponents, a: ({ node, ...props }: any) => <a className="text-blue-200 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{renderWithColorSwatches(props.children)}</a> }}>
                                    {contentToDisplay}
                                </ReactMarkdown>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {!isEditing && (message.id != null || message.rawPrompt || message.isTranslated) && (
                <div className="absolute -bottom-2 right-0 w-full flex items-start justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                     <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md border border-slate-200 dark:border-slate-600 rounded-full shadow-sm px-5 py-2">
                          {message.isTranslated && (
                            <button onClick={() => setShowOriginal(p => !p)} className="p-2 rounded-full transition-colors duration-200 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600" aria-label={languageToggleTitle} title={languageToggleTitle}>
                                <GlobeAltIcon className="w-8 h-8" />
                            </button>
                          )}
                          {message.rawPrompt && (
                             <button onClick={handleCopyRawPrompt} className={`p-2 rounded-full transition-all duration-200 ${isRawPromptCopied ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`} aria-label={isRawPromptCopied ? "Đã sao chép" : "Sao chép câu lệnh"} title={isRawPromptCopied ? "Đã sao chép!" : "Sao chép câu lệnh"}>
                                {isRawPromptCopied ? <CheckIcon className="w-8 h-8" /> : <DocumentDuplicateIcon className="w-8 h-8" />}
                            </button>
                          )}
                         {message.id != null && (
                            <button onClick={() => onInitiateEdit(message.id!)} className="p-2 rounded-full transition-colors duration-200 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600" aria-label="Chỉnh sửa" title="Chỉnh sửa">
                                <PencilIcon className="w-8 h-8" />
                            </button>
                         )}
                    </div>
                </div>
            )}
        </div>
    );
  }

  // --- RENDER MODEL MESSAGE ---
  return (
    <div className="flex flex-row items-start gap-3 animate-message-in">
        <V64Logo className="w-8 h-8 flex-shrink-0 mt-1" />

        <div className="flex flex-col w-full items-start max-w-xl lg:max-w-4xl group relative">
            <div className="w-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/60 rounded-2xl shadow-sm relative">
                 <div className="p-5" ref={messageContentRef}>
                    {showTypingIndicator ? (
                        <TypingIndicator />
                    ) : (
                        <>
                            {hasSummary && (
                                <div className="mb-4 p-4 bg-blue-50 dark:bg-slate-700/50 border-l-4 border-blue-400 rounded-r-lg animate-fade-in-fast">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">
                                        <InformationCircleIcon className="w-5 h-5" />
                                        Tóm tắt
                                    </h4>
                                    <div className="prose prose-xl dark:prose-invert max-w-none prose-p:before:content-none prose-p:after:content-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                            {message.summary!}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}
                            {message.component}
                            {chartsWithData && chartsWithData.length > 0 && (
                                <div className="my-4 space-y-4">
                                    {chartsWithData.map((chart: any, i: number) =>
                                        chart.component ? (
                                            <chart.component key={i} chart={chart} theme={effectiveTheme} />
                                        ) : null
                                    )}
                                </div>
                            )}
                            {(contentToDisplay || showCursor) && (
                                <div className="prose prose-xl dark:prose-invert max-w-none prose-p:before:content-none prose-p:after:content-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                        {contentToDisplay || ''}
                                    </ReactMarkdown>
                                    {showCursor && <span className="blinking-cursor">▋</span>}
                                </div>
                            )}
                            {noChartsGenerated && (
                                <div className={`mt-4 p-3 border border-dashed rounded-lg flex items-center gap-3 text-lg ${
                                    message.chartError === 'quota' 
                                    ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300' 
                                    : 'bg-slate-100 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                                }`}>
                                    <InformationCircleIcon className="w-6 h-6 flex-shrink-0" />
                                    {message.chartError === 'quota' ? (
                                        <span>Không thể tạo biểu đồ do đã hết hạn ngạch API.</span>
                                    ) : (
                                        <span>Không có biểu đồ nào được tạo cho phân tích này.</span>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                {(hasPerformance || hasSources) && (
                    <div className="w-full border-t border-slate-200/90 dark:border-slate-700/60 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-b-2xl space-y-4">
                        {hasPerformance && (
                            <div>
                                 <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                    Hiệu năng
                                </h4>
                                <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1.5" title="Thời gian nhận chunk đầu tiên">
                                        <LightningBoltIcon className="w-4 h-4" />
                                        <span>{message.performance!.timeToFirstChunk}ms</span>
                                    </span>
                                    <span className="flex items-center gap-1.5" title="Tổng thời gian phản hồi">
                                        <ClockIcon className="w-4 h-4" />
                                        <span>{message.performance!.totalTime}ms</span>
                                    </span>
                                </div>
                            </div>
                        )}
                        {hasSources && (
                           <div>
                                <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                    <GlobeAltIcon className="w-4 h-4"/>
                                    Nguồn tham khảo
                                </h4>
                                <div className="flex flex-col space-y-1">
                                    {message.sources!.map((source, i) => {
                                        const isHighlighted = source.uri === sourceFilter;
                                        return (
                                        <div 
                                            key={i} 
                                            className={`flex items-center justify-between group/source-item transition-colors duration-200 rounded-md ${isHighlighted ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                        >
                                            <a 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex-grow flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-sm p-1.5 min-w-0"
                                                title={source.uri}
                                            >
                                                <span className="flex-shrink-0 w-4 h-4 text-slate-500 dark:text-slate-400">
                                                    <ExternalLinkIcon />
                                                </span>
                                                <span className="truncate hover:underline">{source.title || source.uri}</span>
                                            </a>
                                            <button 
                                                onClick={() => onSourceFilterChange(source.uri)}
                                                className="flex-shrink-0 p-1.5 mr-1 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full opacity-0 group-hover/source-item:opacity-100 focus:opacity-100 transition-opacity"
                                                title="Lọc theo nguồn này"
                                                aria-label="Lọc theo nguồn này"
                                            >
                                                <FunnelIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

             {/* Actions Toolbar */}
            <div className="absolute -bottom-2 left-0 w-full flex items-start justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md border border-slate-200 dark:border-slate-600 rounded-full shadow-sm px-5 py-2">
                    {message.isTranslated && (
                        <button onClick={() => setShowOriginal(p => !p)} className="p-2 rounded-full transition-colors duration-200 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600" aria-label={languageToggleTitle} title={languageToggleTitle}>
                            <GlobeAltIcon className="w-8 h-8" />
                        </button>
                    )}
                    <button onClick={() => handleThumbClick('positive')} disabled={feedbackGiven} className={`p-2 rounded-full transition-colors duration-200 ${message.feedback ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-transparent'}`} aria-label="Phản hồi tốt" title="Phản hồi tốt">
                        <ThumbUpIcon className="w-8 h-8" />
                    </button>
                    <button onClick={() => handleThumbClick('negative')} disabled={feedbackGiven} className={`p-2 rounded-full transition-colors duration-200 ${message.feedback ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-transparent'}`} aria-label="Phản hồi chưa tốt" title="Phản hồi chưa tốt">
                        <ThumbDownIcon className="w-8 h-8" />
                    </button>
                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                    <button onClick={handleCopy} className={`p-2 rounded-full transition-all duration-200 ${isCopied ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`} aria-label={isCopied ? "Đã sao chép" : "Sao chép"} title={isCopied ? "Đã sao chép!" : "Sao chép"} >
                        {isCopied ? <CheckIcon className="w-8 h-8" /> : <ClipboardIcon className="w-8 h-8" />}
                    </button>
                    <button onClick={() => onRegenerate(index)} className="p-2 rounded-full transition-colors duration-200 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600" aria-label="Tạo lại" title="Tạo lại">
                        <ArrowPathIcon className="w-8 h-8" />
                    </button>
                     <button onClick={onRefine} className="p-2 rounded-full transition-colors duration-200 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600" aria-label="Chỉnh sửa câu trả lời" title="Chỉnh sửa câu trả lời">
                        <WandIcon className="w-8 h-8" />
                    </button>
                     <div className="relative" ref={actionsButtonRef}>
                        <button onClick={() => setIsActionsMenuOpen(p => !p)} className="p-2 rounded-full transition-colors duration-200 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600" aria-label="Hành động khác" title="Hành động khác">
                            <EllipsisHorizontalIcon className="w-8 h-8" />
                        </button>
                        {isActionsMenuOpen && (
                             <div className="absolute bottom-full right-0 mb-2 w-72 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-2 z-10 animate-popover-enter">
                                {canEdit && (
                                  <button onClick={() => {onEditAnalysis(message); setIsActionsMenuOpen(false);}} className="w-full flex items-start gap-3 text-left px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-600/70 rounded-md transition-colors">
                                      <PencilSquareIcon className="w-8 h-8 mt-0.5 text-slate-500 dark:text-slate-400" />
                                      <div>
                                          <p className="text-xl font-semibold">Chỉnh sửa & Tính lại</p>
                                          <p className="text-lg text-slate-500 dark:text-slate-400">Thay đổi các thông số đầu vào.</p>
                                      </div>
                                  </button>
                                )}
                                {canCompare && (
                                     <button onClick={() => { onToggleCompare(index); setIsActionsMenuOpen(false);}} className={`w-full flex items-start gap-3 text-left px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-600/70 rounded-md transition-colors ${isSelectedForCompare ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' : ''}`}>
                                      <ScaleIcon className="w-8 h-8 mt-0.5 text-slate-500 dark:text-slate-400" />
                                      <div>
                                          <p className="text-xl font-semibold">So sánh Nguồn</p>
                                          <p className="text-lg text-slate-500 dark:text-slate-400">So sánh với một câu trả lời khác.</p>
                                      </div>
                                  </button>
                                )}
                                {canExport && (
                                    <>
                                        <div className="my-1 h-px bg-slate-200 dark:bg-slate-600"></div>
                                        <button onClick={handleExportReport} className="w-full flex items-start gap-3 text-left px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-600/70 rounded-md transition-colors">
                                            <DocumentArrowDownIcon className="w-8 h-8 mt-0.5 text-blue-500" />
                                            <div>
                                                <p className="text-xl font-semibold">Tải Báo cáo (.html)</p>
                                                <p className="text-lg text-slate-500 dark:text-slate-400">Tương thích với Word, trình duyệt.</p>
                                            </div>
                                        </button>
                                        <button onClick={handleExportData} className="w-full flex items-start gap-3 text-left px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-600/70 rounded-md transition-colors">
                                            <TableCellsIcon className="w-8 h-8 mt-0.5 text-green-500" />
                                            <div>
                                                <p className="text-xl font-semibold">Tải Dữ liệu (.csv)</p>
                                                <p className="text-lg text-slate-500 dark:text-slate-400">Tương thích với Excel, Sheets.</p>
                                            </div>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {feedbackSent && (
                <div className="w-full mt-2 p-3 text-center text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 rounded-lg border border-green-200 dark:border-green-700 animate-fade-in-fast">
                    Cảm ơn bạn đã phản hồi!
                </div>
            )}

            {hasSuggestions && (
                <div className="flex flex-wrap gap-3 mt-4 w-full">
                  {message.suggestions!.map((suggestion, i) => (
                    <button key={i} onClick={() => onSuggestionClick(suggestion)} className="bg-white dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600/50 text-blue-700 dark:text-blue-300 text-xl font-medium py-3 px-7 rounded-full transition-colors duration-200 border border-slate-200 dark:border-slate-600/80 hover:border-slate-300 dark:hover:border-slate-500" aria-label={`Gửi gợi ý: ${suggestion}`}>
                      {suggestion}
                    </button>
                  ))}
                </div>
            )}
        </div>
    </div>
  );
};

const style = document.createElement('style');
style.innerHTML = `
    @keyframes messageIn {
        from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    .animate-message-in {
        animation: messageIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }
`;
document.head.appendChild(style);