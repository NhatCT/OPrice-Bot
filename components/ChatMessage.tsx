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

interface ChatMessageProps {
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  onFeedback: (feedback: 'positive' | 'negative') => void;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, onSuggestionClick, onFeedback }) => {
  const [isCopied, setIsCopied] = useState(false);
  const isModel = message.role === 'model';
  const hasSuggestions = isModel && message.suggestions && message.suggestions.length > 0;
  const hasSources = isModel && message.sources && message.sources.length > 0;
  const canShowActions = isModel && !message.component && message.content;
  const feedbackGiven = !!message.feedback;
  const hasPerformance = isModel && message.performance && message.performance.totalTime > 0;

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };

  const markdownComponents: any = {
      p: ({node, ...props}: any) => <p className="mb-2 last:mb-0" {...props} />,
      h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mb-3" {...props} />,
      h2: ({node, ...props}: any) => <h2 className="text-xl font-semibold mb-3" {...props} />,
      h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold mb-2" {...props} />,
      ul: ({node, ...props}: any) => <ul className="list-disc list-outside space-y-1 mb-3 pl-6" {...props} />,
      ol: ({node, ...props}: any) => <ol className="list-decimal list-outside space-y-1 mb-3 pl-6" {...props} />,
      li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
      table: ({node, ...props}: any) => <div className="overflow-x-auto my-3"><table className="table-auto w-full border-collapse border border-slate-300 dark:border-slate-600" {...props} /></div>,
      thead: ({node, ...props}: any) => <thead className="bg-slate-200 dark:bg-slate-700" {...props} />,
      tbody: ({node, ...props}: any) => <tbody {...props} />,
      tr: ({node, ...props}: any) => <tr className="border-b border-slate-300 dark:border-slate-600 last:border-b-0" {...props} />,
      th: ({node, ...props}: any) => <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left font-semibold text-slate-800 dark:text-slate-200" {...props} />,
      td: ({node, ...props}: any) => <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300" {...props} />,
      code: ({node, inline, ...props}: any) => {
        if (inline) {
            return <code className="bg-slate-200 dark:bg-slate-600/50 rounded-sm px-1.5 py-0.5 text-sm font-mono" {...props} />;
        }
        return <code className="font-mono text-sm" {...props} />;
      },
      pre: ({node, ...props}: any) => <pre className="bg-slate-200 dark:bg-slate-900/50 rounded-md p-3 my-2 overflow-x-auto" {...props} />,
      a: ({node, ...props}: any) => <a className="text-sky-600 dark:text-sky-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
  };
  
  if (!isModel) {
      // --- RENDER USER MESSAGE (Unchanged) ---
      return (
        <div className="flex flex-col items-end">
          <div className="flex items-end gap-2 flex-row-reverse">
            <div className="max-w-xl lg:max-w-3xl px-5 py-3 rounded-2xl shadow-md bg-sky-600 text-white rounded-br-none">
              {message.image && (
                <img
                  src={message.image.data}
                  alt="Uploaded content"
                  className="rounded-lg max-w-xs max-h-48 object-cover mb-2 border border-sky-400"
                />
              )}
              <div className="prose prose-sm prose-invert max-w-none prose-p:before:content-none prose-p:after:content-none text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{...markdownComponents, a: ({node, ...props}: any) => <a className="text-sky-300 hover:underline" target="_blank" rel="noopener noreferrer" {...props} /> }}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      );
  }

  // --- RENDER MODEL MESSAGE (Redesigned) ---
  return (
    <div className="flex flex-row items-start gap-3">
        <V64Logo className="w-9 h-9 flex-shrink-0 mt-1" />

        <div className="flex flex-col w-full items-start max-w-xl lg:max-w-3xl">
            <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                 <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Phân tích từ AI</h3>
                    {canShowActions && (
                        <div className="flex gap-1.5">
                            <button onClick={handleCopy} className={`p-1.5 rounded-full transition-all duration-200 ${isCopied ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`} aria-label={isCopied ? "Copied" : "Copy"} title={isCopied ? "Đã sao chép!" : "Sao chép"} >
                                {isCopied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                            </button>
                            <button onClick={() => onFeedback('positive')} disabled={feedbackGiven} className={`p-1.5 rounded-full transition-colors duration-200 ${message.feedback === 'positive' ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent'}`} aria-label="Good" title="Phản hồi tốt">
                                <ThumbUpIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => onFeedback('negative')} disabled={feedbackGiven} className={`p-1.5 rounded-full transition-colors duration-200 ${message.feedback === 'negative' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent'}`} aria-label="Bad" title="Phản hồi chưa tốt">
                                <ThumbDownIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="px-4 py-3">
                    {message.component ? (
                        message.component
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:before:content-none prose-p:after:content-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
                
                {hasPerformance && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 px-4 pb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1.5" title="Thời gian nhận chunk đầu tiên">
                            <LightningBoltIcon className="w-3.5 h-3.5" />
                            <span>{message.performance!.timeToFirstChunk}ms</span>
                        </span>
                        <span className="flex items-center gap-1.5" title="Tổng thời gian phản hồi">
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span>{message.performance!.totalTime}ms</span>
                        </span>
                    </div>
                )}
                
                {hasSources && (
                    <div className="w-full border-t border-slate-200 dark:border-slate-700 p-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-b-xl">
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Nguồn tham khảo</h4>
                        <div className="flex flex-col space-y-2">
                            {message.sources!.map((source, i) => (
                                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 text-sm group" title={source.uri}>
                                    <div className="flex items-center space-x-2">
                                        <span className="flex-shrink-0 w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-sky-500 dark:group-hover:text-sky-300">
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
                <div className="flex flex-wrap gap-2 mt-3 w-full">
                  {message.suggestions!.map((suggestion, i) => (
                    <button key={i} onClick={() => onSuggestionClick(suggestion)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-sky-700 dark:text-sky-300 text-sm font-medium py-1.5 px-4 rounded-full transition-colors duration-200 border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500" aria-label={`Send suggestion: ${suggestion}`}>
                      {suggestion}
                    </button>
                  ))}
                </div>
            )}
        </div>
    </div>
  );
};