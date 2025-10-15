// Fix: Import ReactNode to resolve the 'Cannot find namespace React' error.
import type { ReactNode } from 'react';

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
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}