// Client-side Product Embedding + RAG Search (no backend)
import { GoogleGenAI } from "@google/genai";
import type { Product } from "../types";

const API_KEY = process.env.API_KEY!;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Storage keys
const VECTOR_KEY = "v64_product_vectors_v2";
const META_KEY = "v64_product_meta_v2";

// Convert product to text for embedding
const productToText = (p: Product) =>
  `${p.name} | SKU: ${p.sku || ""} | Cost: ${p.cost} | Price: ${p.price}`;

// ---- EMBEDDING (Correct SDK Format) ----
export async function embedProduct(text: string): Promise<number[]> {
  const res = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: text
  });

  return res.embeddings?.[0]?.values || [];
}

// ---- SAVE ALL PRODUCT EMBEDDINGS ----
export async function saveProductEmbeddings(products: Product[]) {
  const vectors: Record<string, number[]> = {};
  const meta: Record<string, Product> = {};

  for (let i = 0; i < products.length; i++) {
    const p = products[i];

    // Tạo id nếu Excel không có
    const id = p.id || `auto_${i}_${Date.now()}`;

    const text = productToText(p);
    const vec = await embedProduct(text);

    vectors[id] = vec;
    meta[id] = { ...p, id };
  }

  localStorage.setItem(VECTOR_KEY, JSON.stringify(vectors));
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

// ---- LOAD FROM LOCALSTORAGE ----
export function loadEmbeddings() {
  try {
    return {
      vectors: JSON.parse(localStorage.getItem(VECTOR_KEY) || "{}"),
      meta: JSON.parse(localStorage.getItem(META_KEY) || "{}")
    };
  } catch {
    return { vectors: {}, meta: {} };
  }
}

// ---- COSINE ----
function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const n1 = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const n2 = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (n1 * n2);
}

// ---- SEARCH TOP K ----
export async function searchProducts(query: string, topK = 5) {
  const embedQ = await embedProduct(query);
  const { vectors, meta } = loadEmbeddings();

  const scored = Object.keys(vectors).map((id) => ({
    id,
    score: cosine(embedQ, vectors[id])
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => meta[s.id]);
}