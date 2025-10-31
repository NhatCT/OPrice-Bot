import type { ReactNode } from 'react';
// FIX: Removed unused FunctionCall import from '@google/genai' as it's no longer part of the ChatMessage interface.
// import type { FunctionCall } from '@google/genai';

export type Theme = 'light' | 'dark' | 'system';
export type Font = 'sans' | 'serif' | 'mono';
export type Task = 'profit-analysis' | 'promo-price' | 'group-price';

export interface UserProfile {
  name: string;
}

// FIX: Refactored ChatMessage into a discriminated union.
// This provides better type safety and resolves an inference issue where 'component' was
// incorrectly treated as a required property for user messages in App.tsx.
interface BaseChatMessage {
  id?: number; // Backend sẽ cung cấp ID này
  content: string;
  suggestions?: string[];
  sources?: {
    uri: string;
    title: string;
  }[];
  feedback?: 'positive' | 'negative';
  feedbackComment?: string;
  performance?: {
    timeToFirstChunk: number;
    totalTime: number;
  };
  analysisParams?: Record<string, any>;
  task?: Task;
}

export type ChatMessage =
  | (BaseChatMessage & {
      role: 'user';
    })
  | (BaseChatMessage & {
      role: 'model';
      component?: ReactNode;
    });


export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}

// Add ConversationMeta for optimized loading
export interface ConversationMeta {
  id:string;
  title: string;
}
