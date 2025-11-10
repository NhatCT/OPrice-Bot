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

export interface MarketResearchData {
  trend_sections?: {
    title: string;
    description: string;
    key_items: {
      brand_name: string;
      image_search_query: string;
      image_url?: string; 
    }[];
  }[];
  wash_effect_summary?: {
    title: string;
    table: {
      wash_type: string;
      application_effect: string;
    }[];
  };
  charts?: any[];
}


interface BaseChatMessage {
  id?: number;
  content: string;
  image?: string; // base64 data URL
  summary?: string;
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

export interface CostSheetItem {
  name: string;
  category: string;
  sku: string;
  costOfGoods: number;
  priceOnline: number;
}


// --- Local Analysis Types ---
export interface Chart {
  type: 'bar';
  title: string;
  data: { name: string; value: number }[];
  unit?: string;
  component?: React.FC<any>; 
}

export interface AnalysisResult {
  analysis: string;
  charts: Chart[];
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