import type { Product } from '../types';

const COST_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1W7M_cwgMvBRk-IO3wu-Qk-WSNqfx8mF7PJwuprZdc_0/export?format=csv&gid=1670533396';

export interface CostSheetItem {
    name: string;
    sku: string;
    costOfGoods: string; // Giá vốn
    variableCost: string; // Chi phí biến đổi
    totalCost: string; // Tổng chi phí
    price: string; // Giá bán
    operatingCost: string; // Chi phí vận hành
}

let cachedData: CostSheetItem[] | null = null;

const parseCsv = (csvText: string): CostSheetItem[] => {
    const lines = csvText.trim().replace(/\r/g, '').split('\n');
    if (lines.length < 2) return [];

    const headerIdentifiers = ['Tên sản phẩm', 'Giá bán', 'Mã hàng', 'SKU'];
    let headerIndex = -1;
    let headers: string[] = [];

    // Find the header row by looking for at least two identifying headers (scan up to 10 lines)
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const potentialHeaders = lines[i].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
        const foundIdentifiers = headerIdentifiers.filter(h => potentialHeaders.includes(h));
        if (foundIdentifiers.length >= 2) {
            headerIndex = i;
            headers = potentialHeaders;
            break;
        }
    }

    if (headerIndex === -1) {
        console.error("Could not find a valid header row in the CSV. Looked for identifiers like:", headerIdentifiers.join(', '));
        console.error("First 5 lines of CSV:\n", lines.slice(0, 5).join('\n'));
        return [];
    }

    const dataLines = lines.slice(headerIndex + 1);

    const getIndex = (names: string[]) => {
        for (const name of names) {
            const index = headers.indexOf(name);
            if (index !== -1) return index;
        }
        return -1;
    };
    
    const nameIndex = getIndex(['Tên sản phẩm']);
    const skuIndex = getIndex(['SKU', 'Mã hàng']); // Handle both 'SKU' and 'Mã hàng'
    const costOfGoodsIndex = getIndex(['Giá vốn']);
    const variableCostIndex = getIndex(['Chi phí biến đổi']);
    const totalCostIndex = getIndex(['Tổng chi phí']);
    const priceIndex = getIndex(['Giá bán']);
    const operatingCostIndex = getIndex(['Chi phí vận hành']);

    // Check for essential columns
    const missingHeaders: string[] = [];
    if (nameIndex === -1) missingHeaders.push('Tên sản phẩm');
    if (skuIndex === -1) missingHeaders.push('SKU or Mã hàng');
    if (costOfGoodsIndex === -1) missingHeaders.push('Giá vốn');
    if (priceIndex === -1) missingHeaders.push('Giá bán');

    if (missingHeaders.length > 0) {
        console.error("CSV is missing essential columns after finding header row:", missingHeaders.join(', '));
        console.error("Found headers:", headers);
        return [];
    }

    return dataLines.map((line) => {
        // Regex to split by comma, but not if it's inside quotes.
        const columns = line
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map(c => c.trim().replace(/^"|"$/g, ''));

        const getColumnValue = (index: number) => {
            if (index === -1 || index >= columns.length || !columns[index]) return '';
            // remove non-digit characters to clean up numbers
            return columns[index].replace(/\D/g, '');
        };

        return {
            name: columns[nameIndex] || '',
            sku: columns[skuIndex] || '',
            costOfGoods: getColumnValue(costOfGoodsIndex),
            variableCost: getColumnValue(variableCostIndex),
            totalCost: getColumnValue(totalCostIndex),
            price: getColumnValue(priceIndex),
            operatingCost: getColumnValue(operatingCostIndex),
        };
    }).filter(item => item.name && item.price); // Filter out empty or invalid lines
};


export const getCostSheetData = async (): Promise<CostSheetItem[]> => {
    if (cachedData) {
        return cachedData;
    }

    try {
        const response = await fetch(COST_SHEET_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch costsheet data: ${response.statusText}`);
        }
        const csvText = await response.text();
        const items = parseCsv(csvText);
        
        if (items.length > 0) {
            cachedData = items;
            return items;
        } else {
            throw new Error("Parsed no products from CSV");
        }
    } catch (error) {
        console.error("Failed to fetch or parse dynamic costsheet, returning empty array.", error);
        return [];
    }
};

export const costSheetToProducts = (items: CostSheetItem[]): Product[] => {
    return items.map((item, index) => ({
        id: `gs-prod-${index}-${item.sku}`,
        sku: item.sku,
        name: item.name,
        cost: item.costOfGoods, // 'cost' in Product type is 'Giá vốn'
        price: item.price
    }));
};