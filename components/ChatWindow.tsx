import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { ChatMessageComponent } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSuggestionClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((msg, index) => (
        <ChatMessageComponent 
            key={index} 
            message={msg}
            onSuggestionClick={onSuggestionClick}
        />
      ))}
      {isLoading && (
        <div className="flex justify-start">
            <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl rounded-bl-none shadow-md">
                 <TypingIndicator />
            </div>
        </div>
      )}
    </div>
  );
};