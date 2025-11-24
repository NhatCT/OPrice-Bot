
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
   CORE CALCULATION LOGIC (THE "BRAIN")
====================================================== */

export interface CalculatedResult {
    metrics: Record<string, string | number>;
    charts: Chart[];
    summaryText: string; // A concise summary of the numbers for the AI
}

export const performProfitAnalysis = (params: any): CalculatedResult => {
    // Input Parsing
    const cost = toNum(params.cost); // Giá vốn (COGS)
    const price = toNum(params.sellingPrice);
    const volume = toNum(params.salesVolume);
    
    // Operating Costs (OpEx)
    const fixedCost = toNum(params.fixedCost || 0); // CP Cố định (Mặt bằng, lương cứng)
    const variableCost = toNum(params.variableCost || 0); // CP Biến đổi khác (Mkt/đơn, Ship)

    // 1. Revenue
    const revenue = price * volume;

    // 2. COGS (Cost of Goods Sold) - Chỉ tính giá vốn sản phẩm
    const totalCOGS = cost * volume;

    // 3. Gross Profit (Lợi nhuận gộp)
    const grossProfit = revenue - totalCOGS;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // 4. Total Operating Expenses (OpEx)
    const totalOpEx = (variableCost * volume) + fixedCost;
    const totalCost = totalCOGS + totalOpEx;

    // 5. Net Profit (Lợi nhuận ròng)
    // STRICT RULE: If OpEx is not provided (0), we treat Net Profit mathematically as Gross Profit
    // but flag it as "OpEx Missing"
    const netProfit = revenue - totalCost;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // 6. Break-even
    // Unit Contribution = Price - (Unit COGS + Unit Variable OpEx)
    const unitContribution = price - (cost + variableCost);
    const breakEvenVolume = (unitContribution > 0 && fixedCost > 0)
        ? Math.ceil(fixedCost / unitContribution) 
        : 0;

    // Detect if OpEx is missing (common user error)
    const isOpExMissing = totalOpEx === 0;

    // --- OPTIMAL PRICING ENGINE ---
    // STRICT RULE: Do NOT calculate suggested prices if OpEx is missing.
    let safePrice = 0;
    let recommendedPrice = 0;
    let boldPrice = 0;

    if (!isOpExMissing) {
        safePrice = (cost + variableCost) * 1.3 + (fixedCost / (volume || 1));
        recommendedPrice = (cost + variableCost + (fixedCost / (volume || 1))) / (1 - 0.55);
        boldPrice = recommendedPrice * 1.2;
    }

    const charts: Chart[] = [
        {
            type: "bar",
            title: "Cấu trúc Tài chính (VND)",
            unit: "VND",
            data: [
                { name: "Doanh thu", value: revenue },
                { name: "Giá vốn (COGS)", value: totalCOGS },
                { name: "Lợi nhuận Gộp", value: grossProfit },
                ...(isOpExMissing ? [] : [
                    { name: "Chi phí Vận hành", value: totalOpEx },
                    { name: "Lợi nhuận Ròng", value: netProfit }
                ])
            ]
        }
    ];
    
    if (!isOpExMissing) {
         charts.push({
            type: "pie",
            title: "Tỷ trọng Chi phí & Lợi nhuận",
            unit: "VND",
            data: [
                { name: "Giá vốn hàng bán", value: totalCOGS },
                { name: "Chi phí Vận hành", value: totalOpEx },
                { name: "Lợi nhuận Ròng", value: netProfit > 0 ? netProfit : 0 }
            ]
        });
    }

    const summaryText = `
    KẾT QUẢ TÍNH TOÁN CHÍNH XÁC:
    1. Doanh thu: ${formatVND(revenue)}
    2. Giá vốn hàng bán (COGS): ${formatVND(totalCOGS)}
    3. Lợi nhuận Gộp (Gross Profit): ${formatVND(grossProfit)} (Margin Gộp: ${grossMargin.toFixed(1)}%)
    
    ${isOpExMissing 
        ? `⚠️ LƯU Ý QUAN TRỌNG: Chưa có dữ liệu Chi phí Vận hành (OpEx = 0).
           - Lợi nhuận Ròng hiện tại = Lợi nhuận Gộp (Chưa trừ chi phí Mkt, Mặt bằng, Nhân sự...).
           - KHÔNG THỂ tính toán Giá đề xuất (Pricing) hoặc Điểm hòa vốn (BEP) chính xác.` 
        : `4. Chi phí Vận hành (OpEx): ${formatVND(totalOpEx)}
           5. Lợi nhuận Ròng (Net Profit): ${formatVND(netProfit)} (Margin Ròng: ${netMargin.toFixed(1)}%)
           6. Điểm hòa vốn: ${breakEvenVolume} sản phẩm`}
           
    GIÁ ĐỀ XUẤT (Dựa trên cấu trúc chi phí):
    ${isOpExMissing 
        ? "- KHÔNG CÓ DỮ LIỆU (Cần nhập Chi phí Vận hành để tính giá an toàn & mục tiêu)" 
        : `- An toàn: ${formatVND(Math.round(safePrice))}
           - Mục tiêu: ${formatVND(Math.round(recommendedPrice))}`}
    `;

    return {
        metrics: { 
            revenue, totalCOGS, grossProfit, grossMargin, 
            totalOpEx, netProfit, netMargin, 
            breakEvenVolume, safePrice, recommendedPrice, boldPrice,
            isOpExMissing: isOpExMissing ? 'yes' : 'no'
        },
        charts,
        summaryText
    };
};

export const performPromoAnalysis = (params: any): CalculatedResult => {
    const originalPrice = toNum(params.originalPrice);
    const cost = toNum(params.cost);
    const currentSales = toNum(params.currentSales);
    const discountPercent = toNum(params.discount);

    const discountAmount = originalPrice * (discountPercent / 100);
    const newPrice = originalPrice - discountAmount;
    
    // Simple elasticity assumption: 1% price drop = 1.5% sales increase (configurable logic)
    const elasticity = 1.5; 
    const salesIncreasePercent = discountPercent * elasticity;
    const projectedSales = Math.round(currentSales * (1 + salesIncreasePercent / 100));

    const revenueOld = originalPrice * currentSales;
    const profitOld = (originalPrice - cost) * currentSales;
    const marginOld = revenueOld > 0 ? (profitOld / revenueOld) * 100 : 0;

    const revenueNew = newPrice * projectedSales;
    const profitNew = (newPrice - cost) * projectedSales;
    const marginNew = revenueNew > 0 ? (profitNew / revenueNew) * 100 : 0;

    const charts: Chart[] = [
        {
            type: "bar",
            title: "Hiệu quả Chiến dịch (Trước vs Sau)",
            unit: "VND",
            data: [
                { name: "DT Trước", value: revenueOld },
                { name: "DT Sau", value: revenueNew },
                { name: "LN Trước", value: profitOld },
                { name: "LN Sau", value: profitNew }
            ]
        }
    ];

    const summaryText = `
    KẾT QUẢ MÔ PHỎNG KHUYẾN MÃI:
    - Giá gốc: ${formatVND(originalPrice)} -> Giá KM: ${formatVND(newPrice)} (-${discountPercent}%)
    - Sản lượng ước tính: ${currentSales} -> ${projectedSales} (+${salesIncreasePercent.toFixed(1)}%)
    - Thay đổi Doanh thu: ${formatVND(revenueNew - revenueOld)} (${((revenueNew - revenueOld)/revenueOld * 100).toFixed(1)}%)
    - Thay đổi Lợi nhuận: ${formatVND(profitNew - profitOld)} (${((profitNew - profitOld)/profitOld * 100).toFixed(1)}%)
    - Margin thay đổi: ${marginOld.toFixed(1)}% -> ${marginNew.toFixed(1)}%
    `;

    return {
        metrics: { revenueOld, revenueNew, profitOld, profitNew, projectedSales, marginOld, marginNew },
        charts,
        summaryText
    };
};

export const performGroupPriceAnalysis = (params: any): CalculatedResult => {
    const flatPrice = toNum(params.flatPrice);
    const salesIncrease = toNum(params.salesIncrease) / 100;
    const products = params.products || [];

    let totalRevOld = 0;
    let totalProfitOld = 0;
    let totalRevNew = 0;
    let totalProfitNew = 0;

    const itemImpacts = products.map((p: any) => {
        const price = toNum(p.originalPrice || p.price);
        const cost = toNum(p.cost);
        const qOld = toNum(p.currentSales || 100);
        const qNew = Math.round(qOld * (1 + salesIncrease));

        const rOld = price * qOld;
        const pOld = (price - cost) * qOld;
        
        const rNew = flatPrice * qNew;
        const pNew = (flatPrice - cost) * qNew;

        totalRevOld += rOld;
        totalProfitOld += pOld;
        totalRevNew += rNew;
        totalProfitNew += pNew;

        return { name: p.name, profitChange: pNew - pOld };
    });

    const charts: Chart[] = [
        {
            type: "bar",
            title: "Tổng hợp Chiến dịch Đồng giá",
            unit: "VND",
            data: [
                { name: "Tổng DT Trước", value: totalRevOld },
                { name: "Tổng DT Sau", value: totalRevNew },
                { name: "Tổng LN Trước", value: totalProfitOld },
                { name: "Tổng LN Sau", value: totalProfitNew }
            ]
        },
        // Only show top 5 impacting products to keep chart clean
        {
            type: "bar",
            title: "Thay đổi Lợi nhuận theo SP",
            unit: "VND",
            data: itemImpacts.slice(0, 5).map((i: any) => ({ name: i.name, value: i.profitChange }))
        }
    ];

    const summaryText = `
    PHÂN TÍCH ĐỒNG GIÁ:
    - Giá đồng giá: ${formatVND(flatPrice)}
    - Tổng Doanh thu: ${formatVND(totalRevOld)} -> ${formatVND(totalRevNew)}
    - Tổng Lợi nhuận: ${formatVND(totalProfitOld)} -> ${formatVND(totalProfitNew)}
    - Hiệu quả LN: ${totalProfitNew > totalProfitOld ? "TĂNG" : "GIẢM"} ${formatVND(Math.abs(totalProfitNew - totalProfitOld))}
    `;

    return {
        metrics: { totalRevOld, totalRevNew, totalProfitOld, totalProfitNew },
        charts,
        summaryText
    };
};
