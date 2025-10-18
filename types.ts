import type { ReactNode } from 'react';
import type { FunctionCall } from '@google/genai';

export type Theme = 'light' | 'dark' | 'system';
export type Font = 'sans' | 'serif' | 'mono';

export interface UserProfile {
  name: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  component?: ReactNode;
  image?: {
    data: string; // Data URL for the image
    mimeType: string;
  };
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