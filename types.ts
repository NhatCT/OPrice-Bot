
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type Font = 'sans' | 'serif' | 'mono';
export type Task = 'profit-analysis' | 'promo-price' | 'group-price' | 'market-research' | 'brand-positioning';

export interface UserProfile {
  name: string;
}

export interface Feedback {
  rating: number;
  issues: string[];
  correction?: string;
}

// FIX: Define and export the MarketResearchData type to be used across components.
export interface MarketResearchData {
  global_analysis?: {
    title: string;
    sections: {
      icon: string;
      title: string;
      content: string;
    }[];
  };
  collection_concepts?: {
    name: string;
    description: string;
    color_palette: string;
    materials: string;
  }[];
  key_items?: {
    item_name: string;
    description: string;
    image_url?: string;
    image_base64?: string;
  }[];
  charts?: any[];
}

interface BaseChatMessage {
  id?: number;
  content: string;
  image?: string; // base64 data URL
  suggestions?: string[];
  sources?: {
    uri: string;
    title: string;
  }[];
  feedback?: Feedback; // Replaced old feedback types
  performance?: {
    timeToFirstChunk: number;
    totalTime: number;
  };
  analysisParams?: Record<string, any>;
  charts?: any[]; // Store raw chart data for export
  // FIX: Add the missing 'marketResearchData' property to the BaseChatMessage interface.
  marketResearchData?: MarketResearchData;
  task?: Task;
  isTranslated?: boolean; // For translation feature
  originalContent?: string; // For translation feature
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

export interface ConversationGroup {
    id: string;
    name: string;
}

// Add ConversationMeta for optimized loading
export interface ConversationMeta {
  id:string;
  title: string;
  groupId?: string | null;
}

// --- Business Profile Types ---
export interface Product {
  id: string;
  sku: string;
  name: string;
  cost: string;
  price: string;
}

export interface DefaultCost {
  fixedCostMonthly?: string;
  fixedCostAnnually?: string;
}

export interface BusinessProfile {
  defaultCosts: DefaultCost;
  products: Product[];
}

// --- Fine-Tuning Types ---
export interface FineTuningExample {
  id: string;
  originalPrompt: string;
  improvedResponse: string;
  category?: 'better_advice' | 'factual_correction' | 'tone_style' | 'formatting' | 'other';
}