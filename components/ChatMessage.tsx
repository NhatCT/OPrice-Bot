import React, { useState } from 'react';
import type { ChatMessage } from '../types';
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

interface ChatMessageProps {
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  onFeedback: (feedback: 'positive' | 'negative', comment?: string) => void;
  index: number;
  onToggleCompare: (index: number) => void;
  isSelectedForCompare: boolean;
  onEditAnalysis: (message: ChatMessage) => void;
  sourceFilter?: string;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, onSuggestionClick, onFeedback, index, onToggleCompare, isSelectedForCompare, onEditAnalysis, sourceFilter }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  
  const isModel = message.role === 'model';
  const hasSuggestions = isModel && message.suggestions && message.suggestions.length > 0;
  const hasSources = isModel && message.sources && message.sources.length > 0;
  const canShowActions = isModel;
  const feedbackGiven = !!message.feedback;
  const hasPerformance = isModel && message.performance && message.performance.totalTime > 0;
  const canShowCompare = isModel && message.sources && message.sources.length > 0;
  const canEditAnalysis = isModel && !!message.analysisParams && !!message.task;

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };

  const handleThumbClick = (feedback: 'positive' | 'negative') => {
    if (feedback === 'positive') {
      onFeedback('positive');
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 3000);
    } else {
      setIsFeedbackFormOpen(true);
    }
  };

  const handleSendDetailedFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    onFeedback('negative', feedbackComment.trim());
    setIsFeedbackFormOpen(false);
    setFeedbackComment('');
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  const handleCancelFeedback = () => {
    setIsFeedbackFormOpen(false);
    setFeedbackComment('');
  };

  const markdownComponents: any = {
      p: ({node, ...props}: any) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
      h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mb-4 mt-2" {...props} />,
      h2: ({node, ...props}: any) => <h2 className="text-xl font-semibold mb-3 mt-1" {...props} />,
      h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold mb-2" {...props} />,
      ul: ({node, ...props}: any) => <ul className="list-disc list-outside space-y-2 mb-3 pl-6" {...props} />,
      ol: ({node, ...props}: any) => <ol className="list-decimal list-outside space-y-2 mb-3 pl-6" {...props} />,
      li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
      table: ({node, ...props}: any) => <div className="overflow-x-auto my-4"><table className="table-auto w-full border-collapse border border-slate-300 dark:border-slate-600" {...props} /></div>,
      thead: ({node, ...props}: any) => <thead className="bg-slate-100 dark:bg-slate-700" {...props} />,
      tbody: ({node, ...props}: any) => <tbody {...props} />,
      tr: ({node, ...props}: any) => <tr className="border-b border-slate-200 dark:border-slate-600 last:border-b-0" {...props} />,
      th: ({node, ...props}: any) => <th className="border border-slate-200 dark:border-slate-600 px-4 py-2 text-left font-semibold text-slate-800 dark:text-slate-200" {...props} />,
      td: ({node, ...props}: any) => <td className="border border-slate-200 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300" {...props} />,
      code: ({node, inline, ...props}: any) => {
        if (inline) {
            return <code className="bg-slate-200 dark:bg-slate-600/50 rounded-sm px-1.5 py-0.5 text-sm font-mono text-blue-800 dark:text-blue-300" {...props} />;
        }
        return <code className="font-mono text-sm" {...props} />;
      },
      pre: ({node, ...props}: any) => <pre className="bg-slate-100 dark:bg-slate-900/70 rounded-md p-3 my-3 overflow-x-auto" {...props} />,
      a: ({node, ...props}: any) => <a className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
  };
  
  if (!isModel) {
      return (
        <div className="flex flex-col items-end animate-message-in">
          <div className="flex items-end gap-2 flex-row-reverse">
            <div className="max-w-xl lg:max-w-3xl px-5 py-4 rounded-2xl rounded-br-md text-white shadow-md" style={{ background: 'var(--brand-gradient)' }}>
              <div className="prose prose-sm prose-invert max-w-none prose-p:before:content-none prose-p:after:content-none text-white leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{...markdownComponents, a: ({node, ...props}: any) => <a className="text-blue-200 hover:underline" target="_blank" rel="noopener noreferrer" {...props} /> }}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      );
  }

  // --- RENDER MODEL MESSAGE ---
  return (
    <div className="flex flex-row items-start gap-3 animate-message-in">
        <V64Logo className="w-[67px] h-8 flex-shrink-0 mt-1" />

        <div className="flex flex-col w-full items-start max-w-xl lg:max-w-3xl">
            <div className="w-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/60 rounded-2xl shadow-sm">
                 <div className="flex justify-between items-center px-5 py-2.5 border-b border-slate-200/90 dark:border-slate-700/60">
                    <h3 className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">AI Response</h3>
                    {canShowActions && (
                        <div className="hidden md:flex gap-1">
                            {canEditAnalysis && (
                                <button
                                    onClick={() => onEditAnalysis(message)}
                                    className='p-2 rounded-lg transition-colors duration-200 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                                    aria-label="Edit and Recalculate"
                                    title="Chỉnh sửa & Tính lại"
                                >
                                    <PencilSquareIcon className="w-5 h-5" />
                                </button>
                            )}
                            {canShowCompare && (
                                <button
                                    onClick={() => onToggleCompare(index)}
                                    className={`p-2 rounded-lg transition-colors duration-200 ${isSelectedForCompare ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'}`}
                                    aria-label="Compare Sources"
                                    title="Chọn để so sánh nguồn"
                                >
                                    <ScaleIcon className="w-5 h-5" />
                                </button>
                            )}
                            <button onClick={handleCopy} className={`p-2 rounded-lg transition-all duration-200 ${isCopied ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'}`} aria-label={isCopied ? "Copied" : "Copy"} title={isCopied ? "Đã sao chép!" : "Sao chép"} >
                                {isCopied ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
                            </button>
                            <button onClick={() => handleThumbClick('positive')} disabled={feedbackGiven || isFeedbackFormOpen} className={`p-2 rounded-lg transition-colors duration-200 ${message.feedback === 'positive' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:hover:bg-transparent'}`} aria-label="Good" title="Phản hồi tốt">
                                <ThumbUpIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleThumbClick('negative')} disabled={feedbackGiven || isFeedbackFormOpen} className={`p-2 rounded-lg transition-colors duration-200 ${message.feedback === 'negative' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:hover:bg-transparent'}`} aria-label="Bad" title="Phản hồi chưa tốt">
                                <ThumbDownIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-5">
                    {message.component && (
                        <div className="mb-5 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 -mx-3 -mt-3 sm:p-5 sm:-mx-5 sm:-mt-5">
                            {message.component}
                        </div>
                    )}
                    {(message.content || !message.component) && (
                         <div className="prose prose-sm dark:prose-invert max-w-none prose-p:before:content-none prose-p:after:content-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                {message.content || ''}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
                
                {hasPerformance && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-200/90 dark:border-slate-700/60">
                        <span className="flex items-center gap-1.5" title="Thời gian nhận chunk đầu tiên">
                            <LightningBoltIcon className="w-4 h-4" />
                            <span>{message.performance!.timeToFirstChunk}ms</span>
                        </span>
                        <span className="flex items-center gap-1.5" title="Tổng thời gian phản hồi">
                            <ClockIcon className="w-4 h-4" />
                            <span>{message.performance!.totalTime}ms</span>
                        </span>
                    </div>
                )}
                
                {canShowActions && (
                    <div className="md:hidden px-5 pb-4 pt-4 border-t border-slate-200/90 dark:border-slate-700/60">
                        <div className="flex flex-wrap gap-2.5">
                            {canEditAnalysis && (
                                <button
                                    onClick={() => onEditAnalysis(message)}
                                    className='flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors duration-200 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                                >
                                    <PencilSquareIcon className="w-5 h-5" />
                                    <span>Sửa & Tính lại</span>
                                </button>
                            )}
                            {canShowCompare && (
                                <button
                                    onClick={() => onToggleCompare(index)}
                                    className={`flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors duration-200 ${isSelectedForCompare ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                >
                                    <ScaleIcon className="w-5 h-5" />
                                    <span>So sánh</span>
                                </button>
                            )}
                            <button onClick={handleCopy} className={`flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors duration-200 ${isCopied ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                {isCopied ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
                                <span>{isCopied ? "Đã chép" : "Sao chép"}</span>
                            </button>
                            <button onClick={() => handleThumbClick('positive')} disabled={feedbackGiven || isFeedbackFormOpen} className={`flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors duration-200 disabled:opacity-50 ${message.feedback === 'positive' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                <ThumbUpIcon className="w-5 h-5" />
                                <span>Thích</span>
                            </button>
                            <button onClick={() => handleThumbClick('negative')} disabled={feedbackGiven || isFeedbackFormOpen} className={`flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors duration-200 disabled:opacity-50 ${message.feedback === 'negative' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                <ThumbDownIcon className="w-5 h-5" />
                                <span>Không thích</span>
                            </button>
                        </div>
                    </div>
                )}

                {hasSources && (
                    <div className="w-full border-t border-slate-200/90 dark:border-slate-700/60 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-b-2xl">
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Nguồn tham khảo</h4>
                        <div className="flex flex-col space-y-2.5">
                            {message.sources!.map((source, i) => {
                                const isHighlighted = source.uri === sourceFilter;
                                return (
                                <a 
                                    key={i} 
                                    href={source.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={`text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm group transition-colors duration-200 rounded-md ${isHighlighted ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`} 
                                    title={source.uri}
                                >
                                    <div className={`flex items-center space-x-2 ${isHighlighted ? 'p-1.5' : ''}`}>
                                        <span className="flex-shrink-0 w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-300">
                                            <ExternalLinkIcon />
                                        </span>
                                        <span className="truncate group-hover:underline">{source.title || source.uri}</span>
                                    </div>
                                </a>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
            
            {isFeedbackFormOpen && (
                <div className="w-full mt-2 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 animate-slide-down">
                    <form onSubmit={handleSendDetailedFeedback}>
                        <label htmlFor={`feedback-comment-${index}`} className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Phản hồi của bạn giúp chúng tôi cải thiện.
                        </label>
                        <textarea
                            id={`feedback-comment-${index}`}
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            className="mt-2 w-full bg-white dark:bg-slate-800 text-sm p-2 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            rows={3}
                            placeholder="Vui lòng cho biết AI đã trả lời sai ở đâu..."
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button type="button" onClick={handleCancelFeedback} className="px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Hủy</button>
                            <button type="submit" className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors">Gửi</button>
                        </div>
                    </form>
                </div>
            )}

            {feedbackSent && !isFeedbackFormOpen && (
                <div className="w-full mt-2 p-3 text-center text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 rounded-lg border border-green-200 dark:border-green-700 animate-fade-in-fast">
                    Cảm ơn bạn đã phản hồi!
                </div>
            )}

            {hasSuggestions && (
                <div className="flex flex-wrap gap-2 mt-4 w-full">
                  {message.suggestions!.map((suggestion, i) => (
                    <button key={i} onClick={() => onSuggestionClick(suggestion)} className="bg-white dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600/50 text-blue-700 dark:text-blue-300 text-sm font-medium py-1.5 px-4 rounded-full transition-colors duration-200 border border-slate-200 dark:border-slate-600/80 hover:border-slate-300 dark:hover:border-slate-500" aria-label={`Send suggestion: ${suggestion}`}>
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
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
        }
        to {
            opacity: 1;
            transform: translateY(0);
            max-height: 500px;
        }
    }
    .animate-slide-down {
        animation: slideDown 0.3s ease-out forwards;
        overflow: hidden;
    }
    @keyframes fadeInFast {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .animate-fade-in-fast {
        animation: fadeInFast 0.3s ease-out forwards;
    }
`;
document.head.appendChild(style);