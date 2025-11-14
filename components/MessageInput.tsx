

import React, { useEffect, useRef, forwardRef } from 'react';
import type { ChatMessage } from '../types';
import { ChatMessageComponent } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { V64Logo } from './icons/V64Logo';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onFeedback: (messageIndex: number, feedback: 'positive') => void;
  onOpenFeedbackDialog: (message: ChatMessage, index: number) => void;
  onRegenerate: (index: number) => void;
  onRefine: () => void;
  comparisonSelection: number[];
  onToggleCompare: (index: number) => void;
  onEditAnalysis: (message: ChatMessage) => void;
  sourceFilter: string | null;
  effectiveTheme: 'light' | 'dark';
  onSourceFilterChange: (uri: string | null) => void;
  editingMessageId: number | null;
  onInitiateEdit: (messageId: number) => void;
  onSaveEdit: (messageId: number, newContent: string) => void;
  onCancelEdit: () => void;
}

export const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(
  ({ messages, isLoading, onSuggestionClick, onFeedback, onOpenFeedbackDialog, onRegenerate, onRefine, comparisonSelection, onToggleCompare, onEditAnalysis, sourceFilter, effectiveTheme, onSourceFilterChange, editingMessageId, onInitiateEdit, onSaveEdit, onCancelEdit }, ref) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
      <div ref={ref} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
        {messages.map((msg, index) => (
          <ChatMessageComponent 
              key={msg.id || `msg-${index}`}
              index={index} 
              message={msg}
              onSuggestionClick={onSuggestionClick}
              onFeedback={(feedback) => onFeedback(index, feedback)}
              onOpenFeedbackDialog={onOpenFeedbackDialog}
              onRegenerate={onRegenerate}
              onRefine={onRefine}
              onToggleCompare={onToggleCompare}
              isSelectedForCompare={comparisonSelection.includes(index)}
              onEditAnalysis={onEditAnalysis}
              sourceFilter={sourceFilter as string}
              effectiveTheme={effectiveTheme}
              isLastMessage={index === messages.length - 1}
              isLoading={isLoading}
              onSourceFilterChange={onSourceFilterChange}
              isEditing={editingMessageId === msg.id}
              onInitiateEdit={onInitiateEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
          />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'model' && (
          <div className="flex items-start gap-3 animate-message-in">
               <V64Logo
                  className="w-8 h-8 flex-shrink-0 mt-1"
              />
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
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
