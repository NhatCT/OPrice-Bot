
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type Font = 'sans' | 'serif' | 'mono';

export type Task = 
  | 'profit-analysis' 
  | 'promo-price' 
  | 'group-price' 
  | 'market-research' 
  | 'brand-positioning' 
  | 'competitor-analysis' 
  | 'keyword-analysis' 
  | 'collection-analysis' 
  | 'content-generation';

export type AnalysisCategory = 'business-analysis' | 'market-research' | 'brand-positioning';

export interface ChartData {
    name: string;
    [key: string]: string | number;
}

export interface Chart {
    type: 'bar' | 'pie';
    title: string;
    data: ChartData[];
    unit?: string;
}

export interface AnalysisResult {
    metrics: Record<string, string | number>;
    charts: Chart[];
    summaryText: string;
}

export interface ShopeeProduct {
    name: string;
    price: string;
    link: string;
}

export interface ShopeeComparisonData {
    analysis: string;
    products: ShopeeProduct[];
}

export interface WatchedProduct {
    id: string;
    name: string;
    url: string;
    platform: string;
    initialPrice: string;
    lastPrice: string;
    dateAdded: string;
    lastUpdated: string;
}

export interface Feedback {
    rating: number;
    issues?: string[];
    correction?: string;
}

export interface CompetitorAnalysisData {
    executiveSummary?: string;
    comparisonTable: any[];
}

export interface KeywordAnalysisData {
    overallSummary: string;
    topProducts: any[];
}

export interface CollectionAnalysisData {
    [key: string]: any;
}

export interface TrendSection {
    title: string;
    description: string;
    key_items: {
        inspiration_source: string;
        image_urls?: string[];
    }[];
}

export interface WashEffectSummary {
    title: string;
    table: {
        wash_type: string;
        application_effect: string;
    }[];
}

export interface MarketResearchData {
    trend_sections?: TrendSection[];
    wash_effect_summary?: WashEffectSummary;
    charts?: Chart[];
}

export interface ChatMessage {
    id?: number;
    role: 'user' | 'model';
    content: string;
    image?: string;
    timestamp?: number;
    task?: Task;
    analysisParams?: Record<string, any>;
    
    // Response specific data
    sources?: { uri: string; title: string }[];
    suggestions?: string[];
    feedback?: Feedback;
    
    // Analysis data attachments
    charts?: Chart[];
    shopeeComparisonData?: ShopeeComparisonData;
    marketResearchData?: MarketResearchData;
    competitorAnalysisData?: CompetitorAnalysisData;
    keywordAnalysisData?: KeywordAnalysisData;
    collectionAnalysisData?: CollectionAnalysisData;
    
    // Component cache
    component?: ReactNode;
    
    // For user inputs
    rawPrompt?: string;
}

export interface ConversationMeta {
    id: string;
    title: string;
    groupId: string | null;
}

export interface ConversationGroup {
    id: string;
    name: string;
}

export interface UserProfile {
    name: string;
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    cost: string;
    price: string;
}

export interface BusinessProfile {
    defaultCosts: {
        fixedCostMonthly?: string;
        [key: string]: any;
    };
    products: Product[];
    brandDNA?: {
        personality: string[];
        targetCustomer: string;
        productVision: string;
    };
    watchlist?: WatchedProduct[];
    frequentProducts?: any[]; // deprecated
}

export interface ActiveTool {
    category: AnalysisCategory;
    initialTask?: Task;
    initialData?: Record<string, any>;
}

export interface CostSheetItem {
    sku: string;
    name: string;
    cost: number;
    price: number;
}

export interface FineTuningExample {
  id: string;
  originalPrompt: string;
  improvedResponse: string;
  category?: 'better_advice' | 'factual_correction' | 'tone_style' | 'formatting' | 'other';
}

export interface FinancialQuestion {
  id: number;
  question: string;
  topic: string;
}
