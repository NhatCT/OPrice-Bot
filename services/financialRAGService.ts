
// financialRAGService.ts
import { financialQuestions } from "../data/financialQuestions";

// Normalize text
const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

// Keyword match scoring
function score(query: string, target: string) {
  const qWords = norm(query).split(/\s+/);
  const t = norm(target);
  let hit = 0;

  for (const w of qWords) {
    if (w.length > 2 && t.includes(w)) hit++;
  }
  return hit;
}

// RAG retrieval
export function retrieveFinancialKnowledge(query: string, topK = 5) {
  const scored = financialQuestions.map(q => ({
    ...q,
    score: score(query, q.question)
  }));

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// Simple finance intent detection
export function isFinanceQuery(text: string): boolean {
  const t = norm(text);
  const keywords = [
    "taichinh", "chiphi", "giavon", "bienlai",
    "dinhgia", "dongtien", "tonkho", "ketoan",
    "von", "morong", "kpi", "baocao"
  ];
  return keywords.some(k => t.includes(k));
}
