import React, { useEffect, useState } from "react";
import type { BusinessProfile, Product, CostSheetItem } from "../types";
import { costSheetToProducts, getCostSheetData, mergeBySheetOrder } from "../services/dataService";
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './icons/CheckIcon';

const useDebouncedEffect = (effect: () => void, deps: React.DependencyList, delay: number) => {
  useEffect(() => {
    const h = setTimeout(() => effect(), delay);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
};

interface ProductCatalogProps {
  profile: BusinessProfile | null;
  onSave: (profile: BusinessProfile) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ profile, onSave }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isImporting, setIsImporting] = useState(false);
  const [sheetLink, setSheetLink] = useState("");
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");

  useEffect(() => {
    if (!profile) return;
    setProducts(profile.products?.length ? profile.products : []);
  }, [profile]);

  useDebouncedEffect(() => {
    if (!profile || JSON.stringify(products) === JSON.stringify(profile.products)) return;
    setSaveStatus("saving");
    onSave({ ...profile, products });
    setTimeout(() => setSaveStatus("saved"), 300);
    setTimeout(() => setSaveStatus("idle"), 1500);
  }, [products, onSave, profile], 800);

  const handleImport = async (file?: File) => {
    if(!file && !sheetLink) {
        alert("Vui lòng chọn file hoặc dán link Google Sheet.");
        return;
    }
    setIsImporting(true);
    try {
      const items = await getCostSheetData(file, sheetLink);
      if (!items.length) {
        alert("Không có dữ liệu hợp lệ. Hãy upload file hoặc dán link Google Sheet.");
        return;
      }
      if (importMode === "replace" || products.length === 0) {
        setProducts(costSheetToProducts(items));
      } else {
        setProducts(mergeBySheetOrder(products, items));
      }
    } catch (e) {
      console.error(e);
      alert("Không thể đọc dữ liệu. Vui lòng kiểm tra file/link.");
    } finally {
      setIsImporting(false);
    }
  };

  const clearAll = () => {
    if (confirm("Xóa toàn bộ danh mục sản phẩm?")) setProducts([]);
  };

  const addProduct = () => {
    setProducts((prev) => [
      { id: Date.now().toString(), sku: `SKU-${prev.length + 1}`, name: "", cost: "", price: "" },
      ...prev,
    ]);
  };

  const onChange = (id: string, field: keyof Omit<Product, 'id'>, value: string) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const th = "px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
  const td = "px-4 py-3 border-t border-slate-200 dark:border-slate-700";
  const input =
    "w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-slate-100 dark:focus:bg-slate-700";

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Quản lý Sản phẩm</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Nhập giá vốn / giá bán từ file Excel/CSV hoặc Google Sheet.</p>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus !== "idle" && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {saveStatus === "saved" ? (
                <><CheckIcon className="w-4 h-4 text-green-500" /> <span>Đã lưu</span></>
              ) : (
                <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Đang lưu...</span></>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
              disabled={isImporting}
            />
            <span>{isImporting ? "Đang nhập..." : "Import File"}</span>
          </label>

          <button onClick={clearAll} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500">
            Xóa toàn bộ
          </button>

          <button onClick={addProduct} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="flex gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 items-center border-b border-slate-200 dark:border-slate-700">
        <input
          type="text"
          placeholder="Dán link Google Sheet (tùy chọn)..."
          value={sheetLink}
          onChange={(e) => setSheetLink(e.target.value)}
          className="flex-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
        />
        <select
          value={importMode}
          onChange={(e) => setImportMode(e.target.value as "replace" | "merge")}
          className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          title="Chế độ nhập"
        >
          <option value="replace">Thay thế (khuyên dùng)</option>
          <option value="merge">Gộp (giữ sản phẩm cũ)</option>
        </select>
        <button
          onClick={() => handleImport()}
          disabled={isImporting}
          className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500"
        >
          {isImporting ? "Đang tải..." : "Tải từ Google Sheet"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm">
            <tr>
              <th className={th}>SKU</th>
              <th className={th}>Tên sản phẩm</th>
              <th className={th}>Giá vốn (VND)</th>
              <th className={th}>Giá bán (VND)</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className={`${td} w-1/6`}>
                  <input type="text" value={p.sku} onChange={(e) => onChange(p.id, "sku", e.target.value)} className={input} placeholder="SKU" />
                </td>
                <td className={`${td} w-2/5`}>
                  <input type="text" value={p.name} onChange={(e) => onChange(p.id, "name", e.target.value)} className={input} placeholder="Tên sản phẩm" />
                </td>
                <td className={`${td} w-1/6`}>
                  <input type="number" step="1" value={p.cost} onChange={(e) => onChange(p.id, "cost", e.target.value)} className={input} placeholder="0" />
                </td>
                <td className={`${td} w-1/6`}>
                  <input type="number" step="1" value={p.price} onChange={(e) => onChange(p.id, "price", e.target.value)} className={input} placeholder="0" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!products.length && (
          <div className="text-center p-8 text-slate-500 dark:text-slate-400">
            <p>Chưa có sản phẩm nào.</p>
            <p className="text-sm">Nhấn "Import File" hoặc "Tải từ Google Sheet" để bắt đầu.</p>
          </div>
        )}
      </div>
    </div>
  );
};