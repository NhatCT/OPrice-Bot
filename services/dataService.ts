import * as XLSX from "xlsx";
import type { Product, CostSheetItem } from "../types";

/* ================= helpers ================= */

export const vnNorm = (s: string) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "")
    .replace(/[^\w\d]/g, "");

const parseMoney = (v: any): number => {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v) : 0;

  let s = String(v).trim().replace(/đ|vnđ|vnd/gi, "").trim();

  // dạng thập phân chuẩn: "352000.0"
  if (/^\s*-?\d+(\.\d+)?\s*$/.test(s)) {
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }

  // loại dấu phân tách nghìn
  s = s.replace(/[\s]/g, "");
  s = s.replace(/(?<=\d)[.,](?=\d{3}(\D|$))/g, "");
  s = s.replace(/[^\d-]/g, "");

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

/* =============== Parser A – “bảng ngang” (sheet TỔNG HỢP) =============== */
function parseWideV64(table: string[][]): CostSheetItem[] {
  if (!table.length) return [];
  const norm = (x: any) => vnNorm(String(x ?? ""));

  // tìm hàng "HẠNG MỤC" + cột
  let rowIdxCategory = -1, catCol = -1;
  for (let r = 0; r < table.length && rowIdxCategory === -1; r++) {
    const row = table[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      if (norm(row[c]) === "hangmuc") { rowIdxCategory = r; catCol = c; break; }
    }
  }
  if (rowIdxCategory === -1) return [];

  const headerRow = table[rowIdxCategory] ?? [];
  let startCol = Math.max(catCol + 1, 0);
  while (startCol < headerRow.length && !String(headerRow[startCol] ?? "").trim()) startCol++;

  // "GIÁ VỐN VND"
  let rowIdxCost = table.findIndex(row => row?.some(v => norm(v) === "giavonvnd"));
  if (rowIdxCost === -1) {
    rowIdxCost = table.findIndex(row =>
      row?.some(v => { const t = norm(v); return t.includes("giavon") && t.includes("vnd") && !t.includes("usd"); })
    );
  }
  if (rowIdxCost === -1) return [];

  // "GIÁ BÁN" → hàng "Online" phía dưới
  const giabanIdx = table.findIndex(row => row?.some(v => norm(v).includes("giaban")));
  let rowIdxPriceOnline = -1;
  if (giabanIdx !== -1) {
    for (let r = giabanIdx + 1; r < Math.min(giabanIdx + 8, table.length); r++) {
      const row = table[r] ?? [];
      if (row.some(v => norm(v) === "online")) { rowIdxPriceOnline = r; break; }
    }
  }
  if (rowIdxPriceOnline === -1) {
    rowIdxPriceOnline = table.findIndex(row => row?.some(v => norm(v) === "online"));
  }

  const costRow = table[rowIdxCost] ?? [];
  const priceRow = rowIdxPriceOnline !== -1 ? table[rowIdxPriceOnline] : [];

  const items: CostSheetItem[] = [];
  let skuCounter = 1;

  for (let c = startCol; c < headerRow.length; c++) {
    const name = String(headerRow[c] ?? "").trim();
    if (!name) continue;

    const cost  = parseMoney(costRow[c]);
    const price = parseMoney(priceRow[c]);

    if (cost > 0 || price > 0) {
      items.push({
        name,
        category: name,
        sku: `SKU-${skuCounter++}`,
        costOfGoods: cost,
        priceOnline: price,
      });
    }
  }
  return items;
}

/* =============== Parser B – “bảng dọc” (mỗi dòng 1 SP) =============== */
function parseTallRecords(sheet: XLSX.WorkSheet): CostSheetItem[] {
  const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
  if (!aoa.length) return [];

  const headerRowIdx = aoa.findIndex((row) => {
    const keys = row.map((v) => vnNorm(String(v)));
    const hits = [
      keys.some((k) => ["ten","tensanpham","sanpham","tensp","tenhang","tenmh"].includes(k)),
      keys.some((k) => ["hangmuc","danhmuc","nhomhang"].includes(k)),
      keys.some((k) => ["sku","mahv","mahang","mahanghoa","masp"].includes(k)),
      keys.some((k) => k.includes("giavon")),
      keys.some((k) => k.includes("giaban") || k.includes("giabanonline") || k.includes("banle")),
    ].filter(Boolean).length;
    return hits >= 2;
  });
  if (headerRowIdx === -1) return [];

  const header = (aoa[headerRowIdx] as string[]).map((h) => String(h));
  const body = aoa.slice(headerRowIdx + 1);

  const idx = (aliases: string[]) => {
    const set = aliases.map(vnNorm);
    const i = header.findIndex((h) => set.includes(vnNorm(h)));
    return i === -1 ? undefined : i;
  };

  const nameIdx  = idx(["Tên sản phẩm","Tên","Sản phẩm","Tên sp","ten","tensanpham","sanpham","tensp","tenhang"]);
  const catIdx   = idx(["Hạng mục","Danh mục","hang muc","danh muc","nhom hang","nhomhang"]);
  const skuIdx   = idx(["SKU","Mã hàng","Mã","mahv","mahang","mahanghoa","masp"]);
  const costIdx  = idx(["Giá vốn","Giá vốn (VND)","giá vốn vnd","giavon","giavonvnd"]);
  const priceIdx = idx(["Giá bán","Giá bán online","giaban","giabanonline","ban le","giabanle"]);

  const items: CostSheetItem[] = [];
  let skuCounter = 1;

  for (const row of body) {
    const name = String(row[nameIdx ?? -1] ?? "").trim();
    if (!name) continue;

    const category = String(row[catIdx ?? -1] ?? name).trim();
    const sku      = String(row[skuIdx ?? -1] ?? `SKU-${skuCounter++}`).trim();
    const cost     = parseMoney(row[costIdx ?? -1]);
    const price    = parseMoney(row[priceIdx ?? -1]);

    if (cost > 0 || price > 0) {
      items.push({ name, category, sku, costOfGoods: cost, priceOnline: price });
    }
  }
  return items;
}

/* =============== Router =============== */
function parseWorksheetToItems(sheet: XLSX.WorkSheet): CostSheetItem[] {
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
  const wide = parseWideV64(aoa);
  if (wide.length) return wide;
  return parseTallRecords(sheet);
}

/* =============== Public APIs =============== */
async function parseExcelFile(file: File): Promise<CostSheetItem[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return parseWorksheetToItems(sheet);
}

async function fetchFromGoogleSheet(url: string): Promise<CostSheetItem[]> {
  if (!url || !url.includes("docs.google.com")) return [];
  const xlsxUrl = url.includes("/export?")
    ? url.replace(/format=\w+/, "format=xlsx")
    : url.replace(/\/edit.*$/, "/export?format=xlsx");

  try {
    const res = await fetch(xlsxUrl);
    if (!res.ok) throw new Error(`xlsx export ${res.status}`);
    const ab = await res.arrayBuffer();
    const wb = XLSX.read(ab, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return parseWorksheetToItems(sheet);
  } catch {
    const csvUrl = url.includes("/export?")
      ? url.replace(/format=\w+/, "format=csv")
      : url.replace(/\/edit.*$/, "/export?format=csv");
    const res2 = await fetch(csvUrl);
    if (!res2.ok) return [];
    const text = await res2.text();
    const wb = XLSX.read(text, { type: "string" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return parseWorksheetToItems(sheet);
  }
}

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

export const costSheetToProducts = (items: CostSheetItem[]): Product[] =>
  items.map((item, i) => ({
    id: `prod-${i}-${item.sku || `SKU-${i + 1}`}`,
    sku: item.sku || `SKU-${i + 1}`,
    name: item.name,
    cost: String(item.costOfGoods || ""),
    price: String(item.priceOnline || ""),
  }));

/** Merge NHƯNG GIỮ THỨ TỰ THEO SHEET (tránh lệch hàng) */
export const mergeBySheetOrder = (current: Product[], sheetItems: CostSheetItem[]): Product[] => {
  const norm = (t: string) =>
    (t ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");

  const next: Product[] = [];
  for (let i = 0; i < sheetItems.length; i++) {
    const it = sheetItems[i];
    const bySku = it.sku ? current.find(p => p.sku && norm(p.sku) === norm(it.sku)) : undefined;
    const byName = bySku ? undefined : current.find(p => norm(p.name) === norm(it.name));
    const hit = bySku ?? byName;

    next.push({
      id: hit?.id ?? `prod-new-${Date.now()}-${i}`,
      sku: it.sku || hit?.sku || `SKU-${i + 1}`,
      name: it.name || hit?.name || "",
      cost: it.costOfGoods > 0 ? String(it.costOfGoods) : hit?.cost || "",
      price: it.priceOnline > 0 ? String(it.priceOnline) : hit?.price || "",
    });
  }
  return next;
};
