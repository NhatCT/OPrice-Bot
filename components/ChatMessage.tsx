import React, { useState } from 'react';
import type { ChatMessage } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { ThumbUpIcon } from './icons/ThumbUpIcon';
import { ThumbDownIcon } from './icons/ThumbDownIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { V64Logo } from './icons/V54Logo';
import { LightningBoltIcon } from './icons/LightningBoltIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { CogIcon } from './icons/CogIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';

interface ChatMessageProps {
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  onFeedback: (feedback: 'positive' | 'negative') => void;
  index: number;
  onToggleCompare: (index: number) => void;
  isSelectedForCompare: boolean;
  onEditAnalysis: (message: ChatMessage) => void;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, onSuggestionClick, onFeedback, index, onToggleCompare, isSelectedForCompare, onEditAnalysis }) => {
  const [isCopied, setIsCopied] = useState(false);
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
            <div className="max-w-xl lg:max-w-3xl px-5 py-4 rounded-2xl rounded-br-md bg-blue-600 dark:bg-blue-500 text-white shadow-md">
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
        <V64Logo className="w-9 h-9 flex-shrink-0 mt-1" />

        <div className="flex flex-col w-full items-start max-w-xl lg:max-w-3xl">
            <div className="w-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/60 rounded-2xl">
                 <div className="flex justify-between items-center px-5 py-2.5 border-b border-slate-200/90 dark:border-slate-700/60">
                    <h3 className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Phản hồi từ AI</h3>
                    {canShowActions && (
                        <div className="hidden md:flex gap-1">
                            {canEditAnalysis && (
                                <button
                                    onClick={() => onEditAnalysis(message)}
                                    className='p-2 rounded-lg transition-colors duration-200 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    aria-label="Edit and Recalculate"
                                    title="Chỉnh sửa & Tính lại"
                                >
                                    <PencilSquareIcon className="w-5 h-5" />
                                </button>
                            )}
                            {canShowCompare && (
                                <button
                                    onClick={() => onToggleCompare(index)}
                                    className={`p-2 rounded-lg transition-colors duration-200 ${isSelectedForCompare ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                    aria-label="Compare Sources"
                                    title="Chọn để so sánh nguồn"
                                >
                                    <ScaleIcon className="w-5 h-5" />
                                </button>
                            )}
                            <button onClick={handleCopy} className={`p-2 rounded-lg transition-all duration-200 ${isCopied ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`} aria-label={isCopied ? "Copied" : "Copy"} title={isCopied ? "Đã sao chép!" : "Sao chép"} >
                                {isCopied ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
                            </button>
                            <button onClick={() => onFeedback('positive')} disabled={feedbackGiven} className={`p-2 rounded-lg transition-colors duration-200 ${message.feedback === 'positive' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent'}`} aria-label="Good" title="Phản hồi tốt">
                                <ThumbUpIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => onFeedback('negative')} disabled={feedbackGiven} className={`p-2 rounded-lg transition-colors duration-200 ${message.feedback === 'negative' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent'}`} aria-label="Bad" title="Phản hồi chưa tốt">
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
                            <button onClick={() => onFeedback('positive')} disabled={feedbackGiven} className={`flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors duration-200 disabled:opacity-50 ${message.feedback === 'positive' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                <ThumbUpIcon className="w-5 h-5" />
                                <span>Thích</span>
                            </button>
                            <button onClick={() => onFeedback('negative')} disabled={feedbackGiven} className={`flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors duration-200 disabled:opacity-50 ${message.feedback === 'negative' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
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
                            {message.sources!.map((source, i) => (
                                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm group" title={source.uri}>
                                    <div className="flex items-center space-x-2">
                                        <span className="flex-shrink-0 w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-300">
                                            <ExternalLinkIcon />
                                        </span>
                                        <span className="truncate group-hover:underline">{source.title || source.uri}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

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
`;
document.head.appendChild(style);