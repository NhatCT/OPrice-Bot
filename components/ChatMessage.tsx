import React from 'react';
import type { ChatMessage } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface ChatMessageProps {
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, onSuggestionClick }) => {
  const isModel = message.role === 'model';
  const hasSuggestions = isModel && message.suggestions && message.suggestions.length > 0;
  const hasSources = isModel && message.sources && message.sources.length > 0;

  return (
    <div className={`flex flex-col ${isModel ? 'items-start' : 'items-end'}`}>
        <div className={`flex ${isModel ? 'justify-start' : 'justify-end'} w-full`}>
            <div
                className={`max-w-xl lg:max-w-2xl px-5 py-3 rounded-2xl shadow-md ${
                isModel
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-50'
                    : 'bg-sky-600 text-white'
                } ${isModel ? 'rounded-bl-none' : 'rounded-br-none'}`}
            >
                {message.image && (
                    <img 
                        src={message.image.data}
                        alt="Uploaded content"
                        className="rounded-lg max-w-xs max-h-48 object-cover mb-2 border border-slate-300 dark:border-slate-600"
                    />
                )}
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {message.content}
                </p>
            </div>
        </div>
        {hasSuggestions && (
            <div className="flex flex-wrap gap-2 mt-3 max-w-xl lg:max-w-2xl">
              {message.suggestions!.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-sky-700 dark:text-sky-300 text-sm font-medium py-1.5 px-4 rounded-full transition-colors duration-200 border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
                  aria-label={`Send suggestion: ${suggestion}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
        )}
        {hasSources && (
            <div className="mt-4 max-w-xl lg:max-w-2xl w-full border-t border-slate-300 dark:border-slate-600/70 pt-3">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Nguồn tham khảo</h4>
                <div className="flex flex-col space-y-2">
                    {message.sources!.map((source, i) => (
                        <a
                          key={i}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 text-sm group"
                          title={source.uri}
                        >
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
  );
};
