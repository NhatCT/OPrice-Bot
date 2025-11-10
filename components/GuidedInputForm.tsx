import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Task, BusinessProfile, Product as BusinessProduct } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { TagInput } from './TagInput';


interface GuidedInputFormProps {
  task: Task;
  onSubmit: (task: Task, params: Record<string, any>) => void;
  onCancel: () => void;
  isLoading: boolean;
  initialData?: Record<string, any>;
  businessProfile: BusinessProfile | null;
}

// --- PRODUCT SELECTOR COMPONENT ---
interface ProductSelectorProps {
    id?: string;
    products: BusinessProduct[];
    onSelect: (product: BusinessProduct) => void;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ id, products, onSelect, value, onChange, placeholder, className, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (product: BusinessProduct) => {
        onSelect(product);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setSearchTerm(e.target.value);
        setIsOpen(true);
    };
    
    const handleFocus = () => {
        setIsOpen(true);
        setSearchTerm(value); // Start search with current value
    }

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                 <input
                    id={id}
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className={className}
                    autoComplete="off"
                    disabled={disabled}
                />
                 <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg z-10">
                    {filteredProducts.length > 0 ? (
                        <ul>
                            {filteredProducts.map(product => (
                                <li key={product.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(product)}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                                    >
                                        <p className="font-semibold">{product.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {product.sku} | Vốn: {Number(product.cost).toLocaleString('vi-VN')}đ | Giá: {Number(product.price).toLocaleString('vi-VN')}đ</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center">Không tìm thấy sản phẩm.</p>
                    )}
                </div>
            )}
        </div>
    );
};


// --- VALIDATION HELPER ---
const validateNumberField = (value: string, fieldName: string, isPositive = true, isRequired = true) => {
    if (!isRequired && !value) return '';
    if (isRequired && !value) return `${fieldName} là bắt buộc.`;
    const num = Number(value);
    if (isNaN(num)) return `${fieldName} phải là một con số.`;
    if (isPositive && num <= 0) return `${fieldName} phải là một số dương.`;
    if (!isPositive && num < 0) return `${fieldName} không được là số âm.`;
    return '';
};

const taskTitles: Record<Task, string> = {
  'profit-analysis': 'Phân tích Lợi nhuận & Lập kế hoạch Kinh doanh',
  'promo-price': 'Phân tích & Dự báo Hiệu quả Khuyến mãi',
  'group-price': 'Phân tích Chiến dịch Đồng giá',
  'market-research': 'Nghiên cứu Xu hướng & Lên ý tưởng Bộ sưu tập',
  'brand-positioning': 'Định vị Thương hiệu'
};


const FormWrapper: React.FC<{ children: React.ReactNode, title: string, onCancel: () => void, currentStep: number, totalSteps: number, setStep: (step: number) => void }> = ({ children, title, onCancel, currentStep, totalSteps, setStep }) => (
    <div className="w-full max-w-2xl mx-auto animate-form-step-in">
        <h3 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100">{title}</h3>
        <div className="flex items-center justify-center gap-2 my-4">
            {Array.from({ length: totalSteps }).map((_, index) => (
                 <div
                    key={index}
                    onClick={() => setStep(index + 1)}
                    className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${index < currentStep ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    style={{width: `${100 / totalSteps}%`}}
                 />
            ))}
        </div>
        <div className="mt-6">
            {children}
        </div>
    </div>
);


// --- FORM COMPONENTS ---

type CalculationTarget = 'sellingPrice' | 'salesVolume' | 'profit';
type Period = 'monthly' | 'annually';
type ProfitTargetType = 'amount' | 'percent';

const ProfitAnalysisForm: React.FC<{
    onSubmit: (params: Record<string, any>) => void;
    onCancel: () => void;
    isLoading: boolean;
    initialData?: Record<string, any>;
    businessProfile: BusinessProfile | null;
}> = ({ onSubmit, onCancel, isLoading, initialData, businessProfile }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        productName: 'Áo Sơ mi Lụa Công sở', cost: '250000', variableCost: '20000', fixedCost: businessProfile?.defaultCosts?.fixedCostMonthly || '50000000', sellingPrice: '750000', salesVolume: '400', targetProfit: '100000000', targetProfitPercent: '25', competitors: ['Massimo Dutti', 'COS']
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [calculationTarget, setCalculationTarget] = useState<CalculationTarget>('profit');
    const [period, setPeriod] = useState<Period>('monthly');
    const [profitTargetType, setProfitTargetType] = useState<ProfitTargetType>('amount');

    useEffect(() => {
        if (initialData) {
            const { calculationTarget, period, profitTargetType, ...initialFormData } = initialData;
            setFormData(prev => ({...prev, ...initialFormData}));
            if (calculationTarget) setCalculationTarget(calculationTarget);
            if (period) setPeriod(period);
            if (profitTargetType) setProfitTargetType(profitTargetType);
        }
    }, [initialData]);

    useEffect(() => {
        const newFormData = { ...formData };
        if (calculationTarget === 'sellingPrice') newFormData.sellingPrice = '';
        if (calculationTarget === 'salesVolume') newFormData.salesVolume = '';
        if (calculationTarget === 'profit') {
            newFormData.targetProfit = '';
            newFormData.targetProfitPercent = '';
        }
        setFormData(newFormData);
        setErrors({});
    }, [calculationTarget]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
    
    const handleProductSelect = (product: BusinessProduct) => {
        setFormData(prev => ({
            ...prev,
            productName: product.name,
            cost: product.cost,
            sellingPrice: product.price,
        }));
    }

    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};
        if (step === 2) {
            newErrors.productName = formData.productName.trim() ? '' : 'Tên sản phẩm là bắt buộc.';
            newErrors.cost = validateNumberField(formData.cost, 'Giá vốn', true);
            newErrors.variableCost = validateNumberField(formData.variableCost, 'Chi phí biến đổi', false);
            newErrors.fixedCost = validateNumberField(formData.fixedCost, 'Chi phí cố định', false);
            if (calculationTarget !== 'sellingPrice') newErrors.sellingPrice = validateNumberField(formData.sellingPrice, 'Giá bán', true);
            if (calculationTarget !== 'salesVolume') newErrors.salesVolume = validateNumberField(formData.salesVolume, 'Doanh số', true);
            if (calculationTarget !== 'profit') {
                if (profitTargetType === 'amount') {
                    newErrors.targetProfit = validateNumberField(formData.targetProfit, 'Lợi nhuận', false);
                } else {
                    newErrors.targetProfitPercent = validateNumberField(formData.targetProfitPercent, 'Tỷ lệ lợi nhuận', false);
                }
            }
        }
        setErrors(newErrors);
        return Object.values(newErrors).every(err => err === '');
    };
    
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(s => Math.min(s + 1, 3));
        }
    }
    const handleBack = () => setCurrentStep(s => Math.max(s - 1, 1));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep(1) && validateStep(2)) {
            const fullParams = { ...formData, calculationTarget, period, profitTargetType };
            onSubmit(fullParams);
        }
    };
    
    const commonInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600 disabled:opacity-60 disabled:bg-slate-200 dark:disabled:bg-slate-600/50";
    const segmentButtonClass = (isActive: boolean) => `flex-1 text-sm font-semibold py-2 rounded-md transition-colors duration-200 ${isActive ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-800/40'}`;

    return (
        <FormWrapper title={initialData ? 'Chỉnh sửa Phân tích' : taskTitles['profit-analysis']} onCancel={onCancel} currentStep={currentStep} totalSteps={3} setStep={setCurrentStep}>
            <form onSubmit={handleSubmit}>
                {currentStep === 1 && (
                    <div className="space-y-4 animate-form-step-in">
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">Đầu tiên, hãy thiết lập mục tiêu và kỳ kế hoạch của bạn.</p>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mục tiêu cần tính</label>
                            <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-lg">
                                {(['profit', 'sellingPrice', 'salesVolume'] as CalculationTarget[]).map(target => (
                                    <button type="button" key={target} onClick={() => setCalculationTarget(target)} className={segmentButtonClass(calculationTarget === target)}>
                                        {target === 'sellingPrice' ? 'Giá Bán' : target === 'salesVolume' ? 'Doanh Số' : 'Lợi Nhuận'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Kỳ kế hoạch</label>
                            <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-lg">
                                {(['monthly', 'annually'] as Period[]).map(p => (
                                    <button type="button" key={p} onClick={() => setPeriod(p)} className={segmentButtonClass(period === p)}>
                                        {p === 'monthly' ? 'Theo Tháng' : 'Theo Năm'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                 {currentStep === 2 && (
                    <div className="space-y-4 animate-form-step-in">
                         <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">Tiếp theo, nhập các thông số bạn có. AI sẽ tính toán mục tiêu còn lại.</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            <div className="md:col-span-2">
                                <label htmlFor="profit-analysis-productName" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tên sản phẩm</label>
                                <ProductSelector 
                                    id="profit-analysis-productName"
                                    products={businessProfile?.products || []}
                                    onSelect={handleProductSelect}
                                    value={formData.productName}
                                    onChange={(value) => setFormData(p => ({ ...p, productName: value }))}
                                    className={`${commonInputClass} ${errors.productName ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                                    placeholder="Tìm kiếm hoặc nhập tên sản phẩm..."
                                />
                                {errors.productName && <p className="text-xs text-red-500 mt-1">{errors.productName}</p>}
                            </div>
                            <div>
                                <label htmlFor="cost" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giá vốn / đơn vị (VND)</label>
                                <input id="cost" name="cost" type="number" min="0" value={formData.cost} onChange={handleChange} className={`${commonInputClass} ${errors.cost ? 'ring-2 ring-red-500 border-red-500' : ''}`} />
                                {errors.cost && <p className="text-xs text-red-500 mt-1">{errors.cost}</p>}
                            </div>
                             <div>
                                <label htmlFor="variableCost" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Chi phí biến đổi / đơn vị (VND)</label>
                                <input id="variableCost" name="variableCost" type="number" min="0" value={formData.variableCost} onChange={handleChange} className={`${commonInputClass} ${errors.variableCost ? 'ring-2 ring-red-500 border-red-500' : ''}`} />
                                {errors.variableCost && <p className="text-xs text-red-500 mt-1">{errors.variableCost}</p>}
                            </div>
                             <div className="md:col-span-2">
                                <label htmlFor="fixedCost" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{`Tổng chi phí cố định / ${period === 'monthly' ? 'Tháng' : 'Năm'} (VND)`}</label>
                                <input id="fixedCost" name="fixedCost" type="number" min="0" value={formData.fixedCost} onChange={handleChange} className={`${commonInputClass} ${errors.fixedCost ? 'ring-2 ring-red-500 border-red-500' : ''}`} />
                                {errors.fixedCost && <p className="text-xs text-red-500 mt-1">{errors.fixedCost}</p>}
                            </div>
                            <div>
                                <label htmlFor="sellingPrice" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giá bán / đơn vị (VND)</label>
                                <input id="sellingPrice" name="sellingPrice" type="number" min="0" value={formData.sellingPrice} onChange={handleChange} disabled={isLoading || calculationTarget === 'sellingPrice'} placeholder={calculationTarget === 'sellingPrice' ? 'AI sẽ tính toán...' : ''} className={`${commonInputClass} ${errors.sellingPrice ? 'ring-2 ring-red-500 border-red-500' : ''}`} />
                                {errors.sellingPrice && <p className="text-xs text-red-500 mt-1">{errors.sellingPrice}</p>}
                            </div>
                            <div>
                                <label htmlFor="salesVolume" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{`Doanh số / ${period === 'monthly' ? 'Tháng' : 'Năm'}`}</label>
                                <input id="salesVolume" name="salesVolume" type="number" min="0" value={formData.salesVolume} onChange={handleChange} disabled={isLoading || calculationTarget === 'salesVolume'} placeholder={calculationTarget === 'salesVolume' ? 'AI sẽ tính toán...' : ''} className={`${commonInputClass} ${errors.salesVolume ? 'ring-2 ring-red-500 border-red-500' : ''}`} />
                                {errors.salesVolume && <p className="text-xs text-red-500 mt-1">{errors.salesVolume}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{`Lợi nhuận mục tiêu / ${period === 'monthly' ? 'Tháng' : 'Năm'}`}</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-lg">
                                        <button type="button" onClick={() => setProfitTargetType('amount')} className={segmentButtonClass(profitTargetType === 'amount')} disabled={calculationTarget === 'profit'}>VND</button>
                                        <button type="button" onClick={() => setProfitTargetType('percent')} className={segmentButtonClass(profitTargetType === 'percent')} disabled={calculationTarget === 'profit'}>%</button>
                                    </div>
                                    {profitTargetType === 'amount' ? (
                                        <input id="targetProfit" name="targetProfit" type="number" value={formData.targetProfit} onChange={handleChange} disabled={isLoading || calculationTarget === 'profit'} placeholder={calculationTarget === 'profit' ? 'AI sẽ tính toán...' : ''} className={`${commonInputClass} ${errors.targetProfit ? 'ring-2 ring-red-500 border-red-500' : ''}`} />
                                    ) : (
                                        <div className="relative flex-grow">
                                            <input id="targetProfitPercent" name="targetProfitPercent" type="number" value={formData.targetProfitPercent} onChange={handleChange} disabled={isLoading || calculationTarget === 'profit'} placeholder={calculationTarget === 'profit' ? 'AI sẽ tính...' : 'VD: 25'} className={`${commonInputClass} pr-12 ${errors.targetProfitPercent ? 'ring-2 ring-red-500 border-red-500' : ''}`} />
                                            <span className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-500 dark:text-slate-400">%</span>
                                        </div>
                                    )}
                                </div>
                                {errors.targetProfit && <p className="text-xs text-red-500 mt-1">{errors.targetProfit}</p>}
                                {errors.targetProfitPercent && <p className="text-xs text-red-500 mt-1">{errors.targetProfitPercent}</p>}
                            </div>
                         </div>
                    </div>
                )}
                 {currentStep === 3 && (
                     <div className="space-y-4 animate-form-step-in">
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">Cuối cùng, thêm đối thủ để AI so sánh với giá thị trường (tùy chọn).</p>
                        <div>
                            <label htmlFor="competitors" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Đối thủ cạnh tranh</label>
                            <TagInput
                                value={formData.competitors}
                                onChange={(newTags) => setFormData(p => ({...p, competitors: newTags}))}
                                placeholder="Nhập tên đối thủ và nhấn Enter..."
                                suggestions={['Routine', 'Coolmate', 'Uniqlo', 'Zara', 'H&M']}
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cung cấp tên đối thủ sẽ giúp AI đưa ra phân tích sâu sắc hơn.</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors duration-200 disabled:opacity-50">Hủy</button>
                    {currentStep > 1 && <button type="button" onClick={handleBack} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors duration-200 disabled:opacity-50">Quay lại</button>}
                    {currentStep < 3 ? (
                        <button type="button" onClick={handleNext} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors duration-200">Tiếp theo</button>
                    ) : (
                        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors duration-200 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                        </button>
                    )}
                </div>
            </form>
        </FormWrapper>
    );
};
const PromoPriceForm: React.FC<any> = ({ onSubmit, onCancel, isLoading, initialData, businessProfile }) => {
    // This form can be implemented similarly with steps if needed
    // For now, keeping it simple as a single step form
    const [formData, setFormData] = useState({ productName: '', cost: '', originalPrice: '', currentSales: '100', discount: '20', promoGoal: 'profit', competitors: [] });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleProductSelect = (product: BusinessProduct) => {
        setFormData(prev => ({ ...prev, productName: product.name, cost: product.cost, originalPrice: product.price }));
    };

    const validate = () => { /* ... validation logic ... */ return true; };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) onSubmit(formData);
    };

    const commonInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";
    
    return (
        <FormWrapper title={taskTitles['promo-price']} onCancel={onCancel} currentStep={1} totalSteps={1} setStep={()=>{}}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">So sánh kịch bản hiện tại và kịch bản khuyến mãi để đưa ra quyết định.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                    <div className="md:col-span-2">
                        <label htmlFor="promo-productName" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Sản phẩm</label>
                        <ProductSelector id="promo-productName" products={businessProfile?.products || []} onSelect={handleProductSelect} value={formData.productName} onChange={(value) => setFormData(p => ({ ...p, productName: value }))} className={commonInputClass} placeholder="Tìm hoặc nhập tên sản phẩm..."/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giá vốn (VND)</label>
                        <input name="cost" type="number" value={formData.cost} onChange={handleChange} className={commonInputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giá bán gốc (VND)</label>
                        <input name="originalPrice" type="number" value={formData.originalPrice} onChange={handleChange} className={commonInputClass} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Doanh số/tháng hiện tại</label>
                        <input name="currentSales" type="number" value={formData.currentSales} onChange={handleChange} className={commonInputClass} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tỷ lệ giảm giá (%)</label>
                        <input name="discount" type="number" value={formData.discount} onChange={handleChange} className={commonInputClass} />
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mục tiêu chiến dịch</label>
                        <select name="promoGoal" value={formData.promoGoal} onChange={handleChange} className={commonInputClass}>
                            <option value="profit">Tối đa hóa Lợi nhuận</option>
                            <option value="revenue">Tối đa hóa Doanh thu</option>
                        </select>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Đối thủ cạnh tranh (tùy chọn)</label>
                        <TagInput value={formData.competitors} onChange={(tags) => setFormData(p => ({...p, competitors: tags}))} placeholder="Nhập tên đối thủ..."/>
                    </div>
                 </div>
                 <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Hủy</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-400">{isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}</button>
                </div>
            </form>
        </FormWrapper>
    );
};
const GroupPriceForm: React.FC<any> = ({ onSubmit, onCancel, isLoading, initialData, businessProfile }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [flatPrice, setFlatPrice] = useState('99000');
    const [salesIncrease, setSalesIncrease] = useState('30');
    const [competitors, setCompetitors] = useState<string[]>([]);
    
    useEffect(() => {
        if (initialData?.products) {
            setProducts(initialData.products);
        } else if (businessProfile?.products) {
            setProducts(businessProfile.products.map(p => ({
                id: p.id, name: p.name, cost: p.cost, originalPrice: p.price, currentSales: '100'
            })));
        }
    }, [initialData, businessProfile]);

    const handleProductChange = (index: number, field: string, value: string) => {
        const newProducts = [...products];
        newProducts[index][field] = value;
        setProducts(newProducts);
    }
    const addProduct = () => setProducts([...products, { id: Date.now(), name: '', cost: '', originalPrice: '', currentSales: '' }]);
    const removeProduct = (index: number) => setProducts(products.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ products, flatPrice, salesIncrease, competitors });
    }
    
    const commonInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";

    return (
        <FormWrapper title={taskTitles['group-price']} onCancel={onCancel} currentStep={1} totalSteps={1} setStep={()=>{}}>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giá đồng giá mục tiêu (VND)</label>
                         <input type="number" value={flatPrice} onChange={e => setFlatPrice(e.target.value)} className={commonInputClass} />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Doanh số kỳ vọng tăng (%)</label>
                         <input type="number" value={salesIncrease} onChange={e => setSalesIncrease(e.target.value)} className={commonInputClass} />
                     </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Sản phẩm áp dụng</label>
                     <div className="space-y-2">
                        {products.map((p, i) => (
                            <div key={p.id} className="grid grid-cols-5 gap-2 items-center">
                                <input value={p.name} onChange={e => handleProductChange(i, 'name', e.target.value)} placeholder="Tên SP" className={`${commonInputClass} col-span-2`} />
                                <input value={p.cost} onChange={e => handleProductChange(i, 'cost', e.target.value)} placeholder="Giá vốn" type="number" className={commonInputClass} />
                                <input value={p.originalPrice} onChange={e => handleProductChange(i, 'originalPrice', e.target.value)} placeholder="Giá bán gốc" type="number" className={commonInputClass} />
                                <div className="flex items-center gap-1">
                                    <input value={p.currentSales} onChange={e => handleProductChange(i, 'currentSales', e.target.value)} placeholder="Doanh số" type="number" className={commonInputClass} />
                                    <button type="button" onClick={() => removeProduct(i)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                     </div>
                     <button type="button" onClick={addProduct} className="mt-2 text-sm text-blue-600 font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4" /> Thêm sản phẩm</button>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Đối thủ cạnh tranh (tùy chọn)</label>
                    <TagInput value={competitors} onChange={setCompetitors} placeholder="Nhập tên đối thủ..."/>
                </div>
                 <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Hủy</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-400">{isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}</button>
                </div>
            </form>
        </FormWrapper>
    );
};
const MarketResearchForm: React.FC<any> = ({ onSubmit, onCancel, isLoading, initialData }) => {
    const [params, setParams] = useState({ season: 'Thu-Đông', year: '2025', style_keywords: 'Minimalism, Office core, Smart casual', target_audience: 'Nữ, 25-35, nhân viên văn phòng, thu nhập B', markets: ['Hàn Quốc', 'Châu Âu'], competitors: ['Massimo Dutti', 'COS', 'Other Stories'] });

    const handleChange = (field: string, value: any) => {
        setParams(p => ({...p, [field]: value}));
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(params);
    }
    
    const commonInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";
    
    return (
         <FormWrapper title={taskTitles['market-research']} onCancel={onCancel} currentStep={1} totalSteps={1} setStep={()=>{}}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">Cung cấp các tiêu chí để AI thực hiện nghiên cứu và lên ý tưởng bộ sưu tập.</p>
                 <div className="grid grid-cols-2 gap-4">
                    <div >
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mùa</label>
                        <select value={params.season} onChange={e => handleChange('season', e.target.value)} className={commonInputClass}>
                            <option>Xuân-Hè</option>
                            <option>Thu-Đông</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Năm</label>
                        <input type="number" value={params.year} onChange={e => handleChange('year', e.target.value)} className={commonInputClass} />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Từ khóa Phong cách</label>
                    <input type="text" value={params.style_keywords} onChange={e => handleChange('style_keywords', e.target.value)} className={commonInputClass} placeholder="VD: Minimalism, Smart casual, ..."/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Đối tượng Khách hàng</label>
                    <input type="text" value={params.target_audience} onChange={e => handleChange('target_audience', e.target.value)} className={commonInputClass} placeholder="VD: Nữ, 25-35, nhân viên văn phòng..."/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Thị trường tham chiếu</label>
                    <TagInput value={params.markets} onChange={v => handleChange('markets', v)} placeholder="Nhập tên quốc gia/khu vực..."/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Đối thủ cạnh tranh</label>
                    <TagInput value={params.competitors} onChange={v => handleChange('competitors', v)} placeholder="Nhập tên đối thủ..."/>
                </div>

                 <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Hủy</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-400">{isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}</button>
                </div>
            </form>
        </FormWrapper>
    );
};


export const GuidedInputForm: React.FC<GuidedInputFormProps> = ({ task, onSubmit, onCancel, isLoading, initialData, businessProfile }) => {
  const handleSubmit = (params: Record<string, any>) => {
      onSubmit(task, params);
  };
    
  switch (task) {
    case 'profit-analysis':
      return <ProfitAnalysisForm onSubmit={handleSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} businessProfile={businessProfile} />;
    case 'promo-price':
      return <PromoPriceForm onSubmit={handleSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} businessProfile={businessProfile} />;
    case 'group-price':
      return <GroupPriceForm onSubmit={handleSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} businessProfile={businessProfile} />;
    case 'market-research':
      return <MarketResearchForm onSubmit={handleSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} />;
    default:
      return null;
  }
};