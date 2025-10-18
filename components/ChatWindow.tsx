import React, { useEffect, useRef, forwardRef } from 'react';
import type { ChatMessage } from '../types';
import { ChatMessageComponent } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { V64Logo } from './icons/V54Logo';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onFeedback: (messageIndex: number, feedback: 'positive' | 'negative') => void;
  comparisonSelection: number[];
  onToggleCompare: (index: number) => void;
}

export const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(
  ({ messages, isLoading, onSuggestionClick, onFeedback, comparisonSelection, onToggleCompare }, ref) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
      <div ref={ref} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <ChatMessageComponent 
              key={index}
              index={index} 
              message={msg}
              onSuggestionClick={onSuggestionClick}
              onFeedback={(feedback) => onFeedback(index, feedback)}
              onToggleCompare={onToggleCompare}
              isSelectedForCompare={comparisonSelection.includes(index)}
          />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'model' && messages[messages.length - 1].content === '' && (
          <div className="flex items-start gap-3 animate-message-in">
               <V64Logo
                  className="w-9 h-9 flex-shrink-0 mt-1"
              />
              <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl rounded-bl-none shadow-md">
                   <TypingIndicator />
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    );
  }
);
ChatWindow.displayName = 'ChatWindow';