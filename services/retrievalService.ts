
import { financialQuestions } from "../data/financialQuestions";

// Simple text tokenizer (removes accents, lowercases, splits by space)
const tokenize = (text: string): Set<string> => {
    return new Set(
        text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2) // Filter out short noise words
    );
};

export interface RetrievedContext {
    question: string;
    topic: string;
    score: number;
}

// "Soft RAG" Retrieval Function
export const retrieveFinancialKnowledge = (query: string, topK: number = 3): RetrievedContext[] => {
    const queryTokens = tokenize(query);
    if (queryTokens.size === 0) return [];

    const scoredDocs = financialQuestions.map(item => {
        const itemTokens = tokenize(item.question + " " + item.topic);
        
        // Calculate Jaccard Similarity (Intersection / Union)
        let intersection = 0;
        queryTokens.forEach(token => {
            if (itemTokens.has(token)) intersection++;
        });
        
        const union = new Set([...queryTokens, ...itemTokens]).size;
        const score = union === 0 ? 0 : intersection / union;

        return {
            question: item.question,
            topic: item.topic,
            score
        };
    });

    // Filter relevant results (threshold 0.1) and sort by score
    return scoredDocs
        .filter(d => d.score > 0.1) 
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
};

export const isFinanceQuery = (text: string): boolean => {
    const financeKeywords = ['tài chính', 'lợi nhuận', 'doanh thu', 'chi phí', 'ngân sách', 'tồn kho', 'dòng tiền', 'thuế', 'vốn', 'lãi', 'lỗ', 'kpi', 'báo cáo', 'margin', 'profit', 'cost', 'budget', 'inventory', 'cashflow'];
    const lowerText = text.toLowerCase();
    return financeKeywords.some(kw => lowerText.includes(kw));
};
