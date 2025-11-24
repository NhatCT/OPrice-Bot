
import * as XLSX from "xlsx";
import type { Product, CostSheetItem, FinancialQuestion } from "../types";
// import financialQuestions from '../data/financial_questions_v64.json';

/* ================= helpers ================= */
const parseExcelFile = (file: File): Promise<CostSheetItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        // Map columns loosely
        const items: CostSheetItem[] = jsonData.map((row: any) => ({
          sku: row['SKU'] || row['sku'] || row['Mã'] || `SKU-${Math.random().toString(36).substr(2, 5)}`,
          name: row['Product Name'] || row['Name'] || row['Tên sản phẩm'] || 'Unknown Product',
          cost: Number(row['Cost'] || row['Giá vốn'] || 0),
          price: Number(row['Price'] || row['Selling Price'] || row['Giá bán'] || 0),
        }));
        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

const fetchFromGoogleSheet = async (url: string): Promise<CostSheetItem[]> => {
    // Simple heuristic for public Google Sheets CSV export
    // Transform /edit#gid=... to /export?format=csv
    try {
        let csvUrl = url;
        if (url.includes('docs.google.com/spreadsheets')) {
             csvUrl = url.replace(/\/edit.*$/, '/export?format=csv');
        }
        
        // Multi-proxy fallback
        const proxies = [
            (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
            (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
            (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`
        ];

        let response;
        let lastError;

        for (const proxy of proxies) {
            try {
                response = await fetch(proxy(csvUrl));
                if (response.ok) break;
            } catch (e) {
                lastError = e;
            }
        }

        if (!response || !response.ok) throw lastError || new Error('Failed to fetch sheet');
        
        const csvText = await response.text();
        
        const workbook = XLSX.read(csvText, { type: "string" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        return jsonData.map((row: any) => ({
          sku: row['SKU'] || row['sku'] || row['Mã'] || `SKU-${Math.random().toString(36).substr(2, 5)}`,
          name: row['Product Name'] || row['Name'] || row['Tên sản phẩm'] || 'Unknown Product',
          cost: Number(row['Cost'] || row['Giá vốn'] || 0),
          price: Number(row['Price'] || row['Selling Price'] || row['Giá bán'] || 0),
        }));

    } catch (e) {
        console.error("Fetch Google Sheet failed", e);
        return [];
    }
}

/* =============== Public APIs =============== */

export const getCostSheetData = async (file?: File, sheetUrl?: string): Promise<CostSheetItem[]> => {
  try {
    if (file) return await parseExcelFile(file);
    if (sheetUrl) return await fetchFromGoogleSheet(sheetUrl);
    return [];
  } catch (e) {
    console.error("read costsheet failed:", e);
    return [];
  }
};

export const getFinancialQuestions = (): FinancialQuestion[] => {
  return financialQuestions as FinancialQuestion[];
};

export const costSheetToProducts = (items: CostSheetItem[]): Product[] => {
    return items.map((item, index) => ({
        id: `imported-${Date.now()}-${index}`,
        sku: item.sku,
        name: item.name,
        cost: item.cost.toString(),
        price: item.price.toString()
    }));
}

export const mergeBySheetOrder = (existingProducts: Product[], newItems: CostSheetItem[]): Product[] => {
    // Merge logic: update existing by SKU or Name, append new
    const productMap = new Map<string, Product>();
    existingProducts.forEach(p => {
        const key = p.sku ? p.sku : p.name;
        productMap.set(key, p);
    });

    newItems.forEach(item => {
        const key = item.sku ? item.sku : item.name;
        const existing = productMap.get(key);
        if (existing) {
            productMap.set(key, { 
                ...existing, 
                cost: item.cost.toString(), 
                price: item.price.toString() 
            });
        } else {
            productMap.set(key, {
                id: `imported-${Date.now()}-${Math.random()}`,
                sku: item.sku,
                name: item.name,
                cost: item.cost.toString(),
                price: item.price.toString()
            });
        }
    });
    
    return Array.from(productMap.values());
};
