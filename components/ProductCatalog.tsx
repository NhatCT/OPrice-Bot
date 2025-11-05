import React, { useState, useEffect } from 'react';
import type { BusinessProfile, Product } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';
import { getCostSheetData, costSheetToProducts } from '../services/dataService';

interface ProductCatalogProps {
  profile: BusinessProfile | null;
  onSave: (profile: BusinessProfile) => void;
}

const useDebouncedEffect = (effect: () => void, deps: React.DependencyList, delay: number) => {
    useEffect(() => {
        const handler = setTimeout(() => effect(), delay);
        return () => clearTimeout(handler);
    }, [...deps, delay]);
};

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ profile, onSave }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        if (profile) {
             if (profile.products && profile.products.length > 0) {
                setProducts(profile.products);
            } else {
                // If the user's catalog is empty, populate it with data from sheet
                getCostSheetData().then(items => {
                    if (items.length > 0) {
                        const initialProducts = costSheetToProducts(items);
                        setProducts(initialProducts);
                    }
                });
            }
        }
    }, [profile]);
    
    useDebouncedEffect(() => {
        if (profile && JSON.stringify(products) !== JSON.stringify(profile.products)) {
            setSaveStatus('saving');
            onSave({ ...profile, products: products });
            setTimeout(() => setSaveStatus('saved'), 300);
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    }, [products, onSave, profile], 1000);
    
    const handleProductChange = (id: string, field: keyof Product, value: string) => {
        setProducts(currentProducts =>
            currentProducts.map(p => (p.id === id ? { ...p, [field]: value } : p))
        );
    };

    const addProduct = () => {
        const newProduct: Product = {
            id: Date.now().toString(),
            sku: '',
            name: '',
            cost: '',
            price: '',
        };
        setProducts(currentProducts => [newProduct, ...currentProducts]);
    };
    
    const removeProduct = (id: string) => {
        setProducts(currentProducts => currentProducts.filter(p => p.id !== id));
    };

    const tableHeaderClass = "px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
    const tableCellClass = "px-4 py-3 border-t border-slate-200 dark:border-slate-700";
    const inputClass = "w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-slate-100 dark:focus:bg-slate-700";
    
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
             <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Quản lý Sản phẩm</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Thêm, sửa, xóa các sản phẩm trong danh mục của bạn.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 transition-opacity" style={{ opacity: saveStatus === 'idle' ? 0 : 1 }}>
                        {saveStatus === 'saved' && <><CheckIcon className="w-4 h-4 text-green-500" /> <span>Đã lưu</span></>}
                        {saveStatus === 'saving' && <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span>Đang lưu...</span></>}
                    </div>
                    <button
                        onClick={addProduct}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Thêm sản phẩm</span>
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm">
                        <tr>
                            <th className={tableHeaderClass}>SKU</th>
                            <th className={tableHeaderClass}>Tên sản phẩm</th>
                            <th className={tableHeaderClass}>Giá vốn (VND)</th>
                            <th className={tableHeaderClass}>Giá bán (VND)</th>
                            <th className={`${tableHeaderClass} text-right`}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className={`${tableCellClass} w-1/6`}>
                                    <input type="text" value={product.sku} onChange={(e) => handleProductChange(product.id, 'sku', e.target.value)} className={inputClass} placeholder="Mã sản phẩm" />
                                </td>
                                <td className={`${tableCellClass} w-2/5`}>
                                    <input type="text" value={product.name} onChange={(e) => handleProductChange(product.id, 'name', e.target.value)} className={inputClass} placeholder="Tên sản phẩm mới" />
                                </td>
                                <td className={`${tableCellClass} w-1/6`}>
                                    <input type="number" value={product.cost} onChange={(e) => handleProductChange(product.id, 'cost', e.target.value)} className={inputClass} placeholder="0" />
                                </td>
                                <td className={`${tableCellClass} w-1/6`}>
                                    <input type="number" value={product.price} onChange={(e) => handleProductChange(product.id, 'price', e.target.value)} className={inputClass} placeholder="0" />
                                </td>
                                <td className={`${tableCellClass} text-right`}>
                                    <button
                                        onClick={() => removeProduct(product.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                        aria-label="Xóa sản phẩm"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {products.length === 0 && (
                    <div className="text-center p-8 text-slate-500 dark:text-slate-400">
                        <p>Chưa có sản phẩm nào.</p>
                        <p className="text-sm">Nhấn "Thêm sản phẩm" để bắt đầu.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
