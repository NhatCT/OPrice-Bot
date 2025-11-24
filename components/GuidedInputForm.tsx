import React, { useState, useEffect } from 'react';
import type { AnalysisCategory, Task, BusinessProfile } from '../types';
import { XIcon } from './icons/XIcon';
import { CheckIcon } from './icons/CheckIcon';

export interface FormProps {
    onSubmit: (params: any) => void;
    onCancel: () => void;
    isLoading: boolean;
    initialData?: Record<string, any>;
    businessProfile?: BusinessProfile | null;
}

const inputClass = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-slate-800 dark:text-slate-200";
const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1";

interface BusinessProduct {
    id: string;
    name: string;
    cost: string;
    price: string;
}

const ProductSelector: React.FC<{
    id: string;
    products: BusinessProduct[];
    value: string;
    onSelect: (product: BusinessProduct) => void;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
}> = ({ id, products, value, onSelect, onChange, placeholder, className }) => {
    return (
        <>
            <input 
                list={`${id}-list`} 
                id={id} 
                value={value} 
                onChange={(e) => {
                    onChange(e.target.value);
                    const found = products.find(p => p.name === e.target.value);
                    if(found) onSelect(found);
                }} 
                className={className} 
                placeholder={placeholder} 
            />
            <datalist id={`${id}-list`}>
                {products.map(p => (
                    <option key={p.id} value={p.name}>{p.name} - Giá: {p.price}</option>
                ))}
            </datalist>
        </>
    );
};

const FormActionButtons: React.FC<{ onCancel: () => void; isLoading: boolean }> = ({ onCancel, isLoading }) => (
    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" disabled={isLoading}>
            Hủy bỏ
        </button>
        <button type="submit" className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50" disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : <><CheckIcon className="w-4 h-4" /> Phân tích ngay</>}
        </button>
    </div>
);

const ProfitAnalysisForm: React.FC<FormProps> = ({ onSubmit, onCancel, isLoading, initialData, businessProfile }) => {
    const [productName, setProductName] = useState(initialData?.productName || '');
    const [cost, setCost] = useState(initialData?.cost || '');
    const [sellingPrice, setSellingPrice] = useState(initialData?.sellingPrice || '');
    const [salesVolume, setSalesVolume] = useState(initialData?.salesVolume || '100');
    
    const [variableCost, setVariableCost] = useState(initialData?.variableCost || '');
    const [fixedCost, setFixedCost] = useState(initialData?.fixedCost || businessProfile?.defaultCosts?.fixedCostMonthly || '');
    
    const [compareOnShopee, setCompareOnShopee] = useState(initialData?.compareOnShopee || false);
    
    const handleProductSelect = (product: BusinessProduct) => {
        setProductName(product.name);
        setCost(product.cost);
        setSellingPrice(product.price);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ 
            productName, 
            cost, 
            sellingPrice, 
            salesVolume, 
            variableCost: variableCost || '0',
            fixedCost: fixedCost || '0',
            compareOnShopee, 
            period: 'monthly', 
            calculationTarget: 'profit' 
        });
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="productName" className={labelClass}>Tên sản phẩm</label>
                <ProductSelector id="productName" products={businessProfile?.products || []} onSelect={handleProductSelect} value={productName} onChange={setProductName} placeholder="Chọn hoặc nhập sản phẩm..." className={inputClass} />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                 <div>
                    <label htmlFor="cost" className={labelClass}>Giá vốn Hàng bán (COGS)</label>
                    <input id="cost" type="number" value={cost} onChange={e => setCost(e.target.value)} className={inputClass} placeholder="Vải + Gia công" required />
                 </div>
                 <div>
                    <label htmlFor="sellingPrice" className={labelClass}>Giá bán (VND)</label>
                    <input id="sellingPrice" type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} className={inputClass} placeholder="Giá niêm yết" required />
                 </div>
             </div>
             
             <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Chi phí Vận hành (Tùy chọn)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label htmlFor="variableCost" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">CP Biến đổi / SP (Mkt, Ship, HH)</label>
                        <input id="variableCost" type="number" value={variableCost} onChange={e => setVariableCost(e.target.value)} className={`${inputClass} !text-base !py-2`} placeholder="VD: 50000" />
                    </div>
                    <div>
                        <label htmlFor="fixedCost" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">CP Cố định / Tháng (MB, Lương)</label>
                        <input id="fixedCost" type="number" value={fixedCost} onChange={e => setFixedCost(e.target.value)} className={`${inputClass} !text-base !py-2`} placeholder="VD: 20000000" />
                    </div>
                </div>
             </div>

             <div>
                 <label htmlFor="salesVolume" className={labelClass}>Số lượng bán dự kiến</label>
                 <input id="salesVolume" type="number" value={salesVolume} onChange={e => setSalesVolume(e.target.value)} className={inputClass} placeholder="VD: 100" required />
             </div>
             <div className="flex items-center gap-3">
                 <input type="checkbox" id="compareOnShopee" checked={compareOnShopee} onChange={e => setCompareOnShopee(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                 <label htmlFor="compareOnShopee" className="text-lg sm:text-xl text-slate-700 dark:text-slate-300">So sánh giá sản phẩm tương tự trên Shopee</label>
             </div>
             <FormActionButtons onCancel={onCancel} isLoading={isLoading} />
        </form>
    );
};

const PromoPriceForm: React.FC<FormProps> = ({ onSubmit, onCancel, isLoading, initialData, businessProfile }) => {
    const [productName, setProductName] = useState(initialData?.productName || '');
    const [cost, setCost] = useState(initialData?.cost || '');
    const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice || '');
    const [currentSales, setCurrentSales] = useState(initialData?.currentSales || '100');
    const [discount, setDiscount] = useState(initialData?.discount || '20');

    const handleProductSelect = (product: BusinessProduct) => {
        setProductName(product.name);
        setCost(product.cost);
        setOriginalPrice(product.price);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ productName, cost, originalPrice, currentSales, discount, calculationTarget: 'promo' });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="promo-product" className={labelClass}>Sản phẩm</label>
                <ProductSelector id="promo-product" products={businessProfile?.products || []} onSelect={handleProductSelect} value={productName} onChange={setProductName} placeholder="Chọn sản phẩm..." className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label htmlFor="promo-cost" className={labelClass}>Giá vốn (COGS)</label>
                    <input id="promo-cost" type="number" value={cost} onChange={e => setCost(e.target.value)} className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="promo-price" className={labelClass}>Giá gốc (VND)</label>
                    <input id="promo-price" type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className={inputClass} required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label htmlFor="promo-sales" className={labelClass}>Sản lượng hiện tại</label>
                    <input id="promo-sales" type="number" value={currentSales} onChange={e => setCurrentSales(e.target.value)} className={inputClass} placeholder="VD: 100" required />
                </div>
                <div>
                    <label htmlFor="promo-discount" className={labelClass}>Mức giảm giá (%)</label>
                    <input id="promo-discount" type="number" value={discount} onChange={e => setDiscount(e.target.value)} className={inputClass} placeholder="VD: 20" required />
                </div>
            </div>
            <FormActionButtons onCancel={onCancel} isLoading={isLoading} />
        </form>
    );
};

const GroupPriceForm: React.FC<FormProps> = ({ onSubmit, onCancel, isLoading, initialData, businessProfile }) => {
    const [flatPrice, setFlatPrice] = useState(initialData?.flatPrice || '199000');
    const [salesIncrease, setSalesIncrease] = useState(initialData?.salesIncrease || '30');
    const [selectedProducts, setSelectedProducts] = useState<BusinessProduct[]>([]);

    const availableProducts = businessProfile?.products || [];

    const toggleProduct = (product: BusinessProduct) => {
        if (selectedProducts.find(p => p.id === product.id)) {
            setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
        } else {
            setSelectedProducts(prev => [...prev, product]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProducts.length === 0) {
            alert('Vui lòng chọn ít nhất một sản phẩm.');
            return;
        }
        onSubmit({ flatPrice, salesIncrease, products: selectedProducts, calculationTarget: 'group' });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label htmlFor="flatPrice" className={labelClass}>Mức giá đồng giá (VND)</label>
                    <input id="flatPrice" type="number" value={flatPrice} onChange={e => setFlatPrice(e.target.value)} className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="salesIncrease" className={labelClass}>Dự kiến tăng trưởng (%)</label>
                    <input id="salesIncrease" type="number" value={salesIncrease} onChange={e => setSalesIncrease(e.target.value)} className={inputClass} placeholder="VD: 30" required />
                </div>
            </div>
            <div>
                <label className={labelClass}>Chọn sản phẩm tham gia ({selectedProducts.length})</label>
                <div className="max-h-60 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-lg p-2 grid grid-cols-1 gap-2">
                    {availableProducts.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 p-2">Chưa có sản phẩm nào trong danh mục.</p>
                    ) : (
                        availableProducts.map(p => (
                            <div key={p.id} onClick={() => toggleProduct(p)} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${selectedProducts.find(sp => sp.id === p.id) ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700' : 'hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent'}`}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedProducts.find(sp => sp.id === p.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-400 bg-white'}`}>
                                    {selectedProducts.find(sp => sp.id === p.id) && <CheckIcon className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-800 dark:text-slate-200">{p.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Giá vốn: {p.cost} - Giá bán: {p.price}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <FormActionButtons onCancel={onCancel} isLoading={isLoading} />
        </form>
    );
};

interface GuidedInputFormProps {
    category: AnalysisCategory;
    initialTask?: Task;
    initialData?: Record<string, any>;
    businessProfile?: BusinessProfile | null;
    onSubmit: (category: AnalysisCategory, task: Task, params: Record<string, any>) => void;
    onCancel: () => void;
    isLoading: boolean;
}

export const GuidedInputForm: React.FC<GuidedInputFormProps> = ({ category, initialTask, initialData, businessProfile, onSubmit, onCancel, isLoading }) => {
    const [task, setTask] = useState<Task>(initialTask || 'profit-analysis');

    const handleFormSubmit = (params: any) => {
        onSubmit(category, task, params);
    };

    if (category === 'business-analysis') {
        return (
            <div className="animate-fade-in-up">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    <button onClick={() => setTask('profit-analysis')} className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${task === 'profit-analysis' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>Phân tích Lợi nhuận</button>
                    <button onClick={() => setTask('promo-price')} className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${task === 'promo-price' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>Giá Khuyến mãi</button>
                    <button onClick={() => setTask('group-price')} className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${task === 'group-price' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>Giá Đồng giá</button>
                </div>
                {task === 'profit-analysis' && <ProfitAnalysisForm onSubmit={handleFormSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} businessProfile={businessProfile} />}
                {task === 'promo-price' && <PromoPriceForm onSubmit={handleFormSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} businessProfile={businessProfile} />}
                {task === 'group-price' && <GroupPriceForm onSubmit={handleFormSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} businessProfile={businessProfile} />}
            </div>
        );
    }

    if (category === 'market-research') {
        // Simple text input for now, can be expanded
        return (
            <div className="animate-fade-in-up">
                <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">Nghiên cứu Thị trường</h3>
                <p className="mb-4 text-slate-600 dark:text-slate-400">Nhập chủ đề, xu hướng hoặc từ khóa bạn muốn nghiên cứu.</p>
                <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit({ query: (e.target as any).query.value }); }}>
                    <input name="query" defaultValue={initialData?.query || ''} className={inputClass} placeholder="VD: Xu hướng denim nữ 2025, Áo khoác jean form rộng..." required />
                    <FormActionButtons onCancel={onCancel} isLoading={isLoading} />
                </form>
            </div>
        );
    }

    return null;
};
