import type { BusinessProfile, AnalysisResult, Chart, Product } from "../types";

/* ======================================================
   🧮 HÀM TIỆN ÍCH CHUNG
====================================================== */
const toNum = (v: any): number => {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[,.\s₫đvnđvnd]/gi, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const formatVND = (v: number) => v.toLocaleString("vi-VN") + " VND";

/* ======================================================
   🧾 LẤY DANH MỤC SẢN PHẨM
====================================================== */
const getCatalog = (bp: BusinessProfile | null): Product[] =>
  (bp?.products ?? []).filter((p) => (p.name ?? "").trim().length > 0);

const findProduct = (bp: BusinessProfile | null, name: string) => {
  const key = (name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return getCatalog(bp).find(
    (p) =>
      (p.name || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") === key
  );
};

/* ======================================================
   💰 PHÂN TÍCH LỢI NHUẬN (Profit Analysis)
====================================================== */
export const buildProfitAnalysis = (
  bp: BusinessProfile | null,
  params: any
): AnalysisResult | null => {
  const { productName, cost, sellingPrice, salesVolume = 100 } = params;
  const fromCat = productName ? findProduct(bp, productName) : undefined;

  const c = toNum(cost ?? fromCat?.cost);
  const p = toNum(sellingPrice ?? fromCat?.price);
  const q = toNum(salesVolume);

  if (!p || !c) return null;

  const revenue = p * q;
  const totalCost = c * q;
  const profit = revenue - totalCost;

  const analysis = `
Phân tích lợi nhuận (Local)
• Sản phẩm: ${productName || fromCat?.name || "(Chưa đặt tên)"}
• Giá vốn/sp: ${formatVND(c)}
• Giá bán/sp: ${formatVND(p)}
• Số lượng bán dự kiến: ${q.toLocaleString("vi-VN")} sp
• Doanh thu: ${formatVND(revenue)}
• Tổng vốn: ${formatVND(totalCost)}
• Lợi nhuận: ${formatVND(profit)}
• Tỷ suất lợi nhuận: ${totalCost > 0 ? ((profit / totalCost) * 100).toFixed(2) + '%' : 'N/A'}
`;

  const charts: Chart[] = [
    {
      type: "bar",
      title: "Cơ cấu Doanh thu – Chi phí – Lợi nhuận",
      unit: "VND",
      data: [
        { name: "Doanh thu", value: revenue },
        { name: "Tổng chi phí", value: totalCost },
        { name: "Lợi nhuận", value: profit },
      ],
    },
  ];

  return { analysis, charts };
};

/* ======================================================
   🎯 PHÂN TÍCH KHUYẾN MÃI (Promo Price)
====================================================== */
export const buildPromoAnalysis = (
  bp: BusinessProfile | null,
  params: any
): AnalysisResult | null => {
  const { productName, discount = 20, currentSales = 100 } = params;
  const fromCat = productName ? findProduct(bp, productName) : undefined;

  const name = productName || fromCat?.name || "(Chưa đặt tên)";
  const cost = toNum(fromCat?.cost ?? params.cost);
  const price = toNum(fromCat?.price ?? params.originalPrice);
  const disc = Number(discount) / 100;
  const priceAfter = Math.max(0, Math.round(price * (1 - disc)));

  const q0 = toNum(currentSales);
  const demandBoost = Math.min(1 + disc * 1.2, 1.8); // ví dụ: giảm 20% → tăng ~24% sales
  const q1 = Math.round(q0 * demandBoost);

  const rev0 = price * q0;
  const profit0 = (price - cost) * q0;
  const rev1 = priceAfter * q1;
  const profit1 = (priceAfter - cost) * q1;

  const analysis = `
Phân tích khuyến mãi (Local)
• Sản phẩm: ${name}
• Giá vốn: ${formatVND(cost)}
• Giá gốc: ${formatVND(price)}
• Giảm giá: ${discount}% → Giá sau KM: ${formatVND(priceAfter)}
• Số lượng bán: ${q0} → ${q1} (ước tính)
• Doanh thu: ${formatVND(rev0)} → ${formatVND(rev1)}
• Lợi nhuận: ${formatVND(profit0)} → ${formatVND(profit1)}
`;

  const charts: Chart[] = [
    {
      type: "bar",
      title: "So sánh Trước & Sau Khuyến mãi",
      unit: "VND",
      data: [
        { name: "DT Trước", value: rev0 },
        { name: "DT Sau", value: rev1 },
        { name: "LN Trước", value: profit0 },
        { name: "LN Sau", value: profit1 },
      ],
    },
  ];

  return { analysis, charts };
};

/* ======================================================
   💵 PHÂN TÍCH ĐỒNG GIÁ (Group Price)
====================================================== */
export const buildGroupPriceAnalysis = (
  bp: BusinessProfile | null,
  params: any
): AnalysisResult | null => {
  const { flatPrice = 199000, salesIncrease = 20 } = params;
  let items = params.products;

  if (!items || !Array.isArray(items) || items.length === 0) {
    const catalog = getCatalog(bp);
    if (!catalog.length) return null;
    // Adapt catalog items to have the fields the form would provide
    items = catalog.map((p) => ({ 
      ...p, 
      originalPrice: p.price, 
      currentSales: '100' // Assume 100 sales if not specified for catalog items
    }));
  }

  const inc = Number(salesIncrease) / 100;
  let rev0 = 0,
    profit0 = 0,
    rev1 = 0,
    profit1 = 0;

  const perItem = items.map((p: any) => {
    const c = toNum(p.cost);
    const price = toNum(p.originalPrice || p.price);
    const q0 = toNum(p.currentSales);
    if (q0 === 0) return { name: p.name, before: 0, after: 0 };

    const q1 = Math.round(q0 * (1 + inc));

    const r0 = price * q0;
    const pr0 = (price - c) * q0;
    const r1 = toNum(flatPrice) * q1;
    const pr1 = (toNum(flatPrice) - c) * q1;

    rev0 += r0;
    profit0 += pr0;
    rev1 += r1;
    profit1 += pr1;

    return { name: p.name, before: pr0, after: pr1 };
  });

  const analysis = `
Phân tích chính sách Đồng giá (Local)
• Số sản phẩm: ${items.length}
• Giá đồng giá áp dụng: ${formatVND(toNum(flatPrice))}
• Tăng trưởng số lượng bán/sp: ${salesIncrease}%
• Doanh thu: ${formatVND(rev0)} → ${formatVND(rev1)}
• Lợi nhuận: ${formatVND(profit0)} → ${formatVND(profit1)}
`;

  const bars = perItem.slice(0, 8).map((x) => ({
    name: x.name,
    value: x.after - x.before,
  }));

  const charts: Chart[] = [
    {
      type: "bar",
      title: "Tổng quan Doanh thu & Lợi nhuận (Trước → Sau Đồng giá)",
      unit: "VND",
      data: [
        { name: "DT Trước", value: rev0 },
        { name: "DT Sau", value: rev1 },
        { name: "LN Trước", value: profit0 },
        { name: "LN Sau", value: profit1 },
      ],
    },
    {
      type: "bar",
      title: "Biến động Lợi nhuận theo Sản phẩm (Sau - Trước)",
      unit: "VND",
      data: bars,
    },
  ];

  return { analysis, charts };
};