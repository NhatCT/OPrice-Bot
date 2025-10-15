import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { ChatMessageComponent } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { V54Logo } from './icons/V54Logo';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onFeedback: (messageIndex: number, feedback: 'positive' | 'negative') => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSuggestionClick, onFeedback }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((msg, index) => (
        <ChatMessageComponent 
            key={index} 
            message={msg}
            onSuggestionClick={onSuggestionClick}
            onFeedback={(feedback) => onFeedback(index, feedback)}
        />
      ))}
      {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'model' && messages[messages.length - 1].content === '' && (
        <div className="flex items-start gap-3">
             <V54Logo
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
};
