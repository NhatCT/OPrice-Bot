import type { ReactNode } from 'react';
import type { FunctionCall } from '@google/genai';

export type Theme = 'light' | 'dark' | 'system';
export type Font = 'sans' | 'serif' | 'mono';
export type Task = 'profit-analysis' | 'promo-price' | 'group-price';

export interface UserProfile {
  name: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  component?: ReactNode;
  suggestions?: string[];
  sources?: {
    uri: string;
    title: string;
  }[];
  feedback?: 'positive' | 'negative';
  performance?: {
    timeToFirstChunk: number;
    totalTime: number;
  };
  // Fields for Function Calling
  isExecuting?: boolean;
  toolCall?: FunctionCall;
  // Fields for re-running analysis
  analysisParams?: Record<string, any>;
  task?: Task;
}

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