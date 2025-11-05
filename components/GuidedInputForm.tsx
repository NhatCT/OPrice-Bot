import React, { useState, useEffect, useRef } from 'react';
import type { Task, BusinessProfile, Product } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { TagIcon } from './icons/TagIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { DocumentArrowUpIcon } from './icons/DocumentArrowUpIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { ScaleIcon } from './icons/ScaleIcon';
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
    products: Product[];
    onSelect: (product: Product) => void;
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

    const handleSelect = (product: Product) => {
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

const taskTitles = {
  'profit-analysis': 'Phân tích Lợi nhuận & Lập kế hoạch Kinh doanh',
  'promo-price': 'Phân tích & Dự báo Hiệu quả Khuyến mãi',
  'group-price': 'Phân tích Chiến dịch Đồng giá',
  'market-research': 'Nghiên cứu Xu hướng & Lên ý tưởng Bộ sưu tập',
};


const FormWrapper = ({ children, title, onCancel, currentStep, totalSteps, setStep }: any) => (
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
        productName: 'Áo Sơ mi Lụa Công sở', cost: '250000', variableCost: '20000', fixedCost: businessProfile?.defaultCosts?.fixedCostMonthly || '50000000', sellingPrice: '750000', salesVolume: '400', targetProfit: '100000000', targetProfitPercent: '25', competitors: 'Massimo Dutti\nCOS'
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
    
    const handleProductSelect = (product: Product) => {
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
            const fullParams = { ...formData, calculationTarget, period, profitTargetType, competitors: formData.competitors.trim() };
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
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">Cuối cùng, thêm đối thủ để AI so sánh với giá thị trường.</p>
                        <div>
                            <label htmlFor="competitors" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Đối thủ cạnh tranh (Tùy chọn)</label>
                            <textarea id="competitors" name="competitors" rows={4} value={formData.competitors} onChange={handleChange} placeholder="Massimo Dutti&#10;COS&#10;Zara&#10;Uniqlo" className={commonInputClass} />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Nhập mỗi đối thủ trên một dòng. Để trống nếu bạn muốn AI tự động tìm kiếm.</p>
                        </div>
                    </div>
                 )}
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50">Hủy</button>
                    <div className="flex items-center gap-3">
                        {currentStep > 1 && (
                            <button type="button" onClick={handleBack} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors duration-200 disabled:opacity-50">Quay lại</button>
                        )}
                        {currentStep < 3 ? (
                             <button type="button" onClick={handleNext} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors duration-200">Tiếp theo</button>
                        ) : (
                             <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors duration-200 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                                {isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                             </button>
                        )}
                    </div>
                </div>
            </form>
        </FormWrapper>
    );
};

const PromoPriceForm: React.FC<{
    onSubmit: (params: Record<string, any>) => void;
    onCancel: () => void;
    isLoading: boolean;
    initialData?: Record<string, any>;
    businessProfile: BusinessProfile | null;
}> = ({ onSubmit, onCancel, isLoading, initialData, businessProfile }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        productName: 'Quần Jeans V64-JD01', originalPrice: '899000', cost: '350000', currentSales: '300', discount: '15', promoGoal: 'profit', competitors: 'Levi\'s\nCK Jeans\nZara'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleProductSelect = (product: Product) => {
        setFormData(prev => ({
            ...prev,
            productName: product.name,
            cost: product.cost,
            originalPrice: product.price,
        }));
    }

    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};
        if (step === 1) {
            newErrors.productName = formData.productName.trim() ? '' : 'Tên sản phẩm là bắt buộc.';
            newErrors.originalPrice = validateNumberField(formData.originalPrice, 'Giá bán gốc');
            newErrors.cost = validateNumberField(formData.cost, 'Giá vốn');
            newErrors.currentSales = validateNumberField(formData.currentSales, 'Doanh số hiện tại');
        }
        if (step === 2) {
            newErrors.discount = validateNumberField(formData.discount, 'Tỉ lệ giảm giá', false);
            const discountNum = Number(formData.discount);
            if (!isNaN(discountNum) && (discountNum <= 0 || discountNum >= 100)) {
                newErrors.discount = 'Tỉ lệ giảm giá phải lớn hơn 0 và nhỏ hơn 100.';
            }
        }
        setErrors(newErrors);
        return Object.values(newErrors).every(err => err === '');
    };

    const handleNext = () => {
        if (validateStep(currentStep)) setCurrentStep(s => Math.min(s + 1, 3));
    }
    const handleBack = () => setCurrentStep(s => Math.max(s - 1, 1));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep(1) && validateStep(2)) {
            onSubmit(formData);
        }
    };

    const commonInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";
    const segmentButtonClass = (isActive: boolean) => `flex-1 text-sm font-semibold py-2 rounded-md transition-colors duration-200 ${isActive ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-800/40'}`;

    return (
        <FormWrapper title={initialData ? 'Chỉnh sửa Phân tích' : taskTitles['promo-price']} onCancel={onCancel} currentStep={currentStep} totalSteps={3} setStep={setCurrentStep}>
            <form onSubmit={handleSubmit}>
                {currentStep === 1 && (
                    <div className="space-y-4 animate-form-step-in">
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">Nhập thông tin sản phẩm và doanh số hiện tại.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label htmlFor="promo-price-productName">Tên sản phẩm</label>
                                <ProductSelector
                                    id="promo-price-productName"
                                    products={businessProfile?.products || []}
                                    onSelect={handleProductSelect}
                                    value={formData.productName}
                                    onChange={(value) => setFormData(p => ({ ...p, productName: value }))}
                                    className={`${commonInputClass} ${errors.productName ? 'ring-2 ring-red-500' : ''}`}
                                    placeholder="Tìm hoặc nhập tên sản phẩm..."
                                />
                                {errors.productName && <p className="text-xs text-red-500 mt-1">{errors.productName}</p>}
                            </div>
                            <div>
                                <label htmlFor="originalPrice">Giá bán gốc (VND)</label>
                                <input id="originalPrice" name="originalPrice" type="number" value={formData.originalPrice} onChange={handleChange} className={`${commonInputClass} ${errors.originalPrice ? 'ring-2 ring-red-500' : ''}`} />
                                {errors.originalPrice && <p className="text-xs text-red-500 mt-1">{errors.originalPrice}</p>}
                            </div>
                            <div>
                                <label htmlFor="cost">Giá vốn (VND)</label>
                                <input id="cost" name="cost" type="number" value={formData.cost} onChange={handleChange} className={`${commonInputClass} ${errors.cost ? 'ring-2 ring-red-500' : ''}`} />
                                {errors.cost && <p className="text-xs text-red-500 mt-1">{errors.cost}</p>}
                            </div>
                             <div className="md:col-span-2">
                                <label htmlFor="currentSales">Doanh số hiện tại / tháng</label>
                                <input id="currentSales" name="currentSales" type="number" value={formData.currentSales} onChange={handleChange} className={`${commonInputClass} ${errors.currentSales ? 'ring-2 ring-red-500' : ''}`} />
                                {errors.currentSales && <p className="text-xs text-red-500 mt-1">{errors.currentSales}</p>}
                            </div>
                        </div>
                    </div>
                )}
                {currentStep === 2 && (
                    <div className="space-y-4 animate-form-step-in">
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">Thiết lập chi tiết chương trình khuyến mãi.</p>
                        <div>
                            <label htmlFor="discount">Tỉ lệ giảm giá (%)</label>
                            <input id="discount" name="discount" type="number" value={formData.discount} onChange={handleChange} className={`${commonInputClass} ${errors.discount ? 'ring-2 ring-red-500' : ''}`} />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">AI sẽ tự dự báo mức tăng trưởng doanh số dựa trên con số này.</p>
                            {errors.discount && <p className="text-xs text-red-500 mt-1">{errors.discount}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mục tiêu chiến dịch</label>
                            <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-lg">
                                <button type="button" onClick={() => setFormData(p => ({...p, promoGoal: 'profit'}))} className={segmentButtonClass(formData.promoGoal === 'profit')}>Tối đa hóa Lợi nhuận</button>
                                <button type="button" onClick={() => setFormData(p => ({...p, promoGoal: 'revenue'}))} className={segmentButtonClass(formData.promoGoal === 'revenue')}>Tối đa hóa Doanh thu</button>
                            </div>
                        </div>
                    </div>
                )}
                 {currentStep === 3 && (
                     <div className="space-y-4 animate-form-step-in">
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">Thêm đối thủ để so sánh giá khuyến mãi với thị trường.</p>
                        <div>
                            <label htmlFor="competitors">Đối thủ cạnh tranh (Tùy chọn)</label>
                            <textarea id="competitors" name="competitors" rows={4} value={formData.competitors} onChange={handleChange} placeholder="Levi's&#10;CK Jeans&#10;Zara" className={commonInputClass} />
                        </div>
                    </div>
                 )}
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">Hủy</button>
                    <div className="flex items-center gap-3">
                        {currentStep > 1 && <button type="button" onClick={handleBack} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">Quay lại</button>}
                        {currentStep < 3 ? <button type="button" onClick={handleNext} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500">Tiếp theo</button> : <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-slate-400">{isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}</button>}
                    </div>
                </div>
            </form>
        </FormWrapper>
    );
};

const GroupPriceForm: React.FC<{
    onSubmit: (params: Record<string, any>) => void;
    onCancel: () => void;
    isLoading: boolean;
    initialData?: Record<string, any>;
    businessProfile: BusinessProfile | null;
}> = ({ onSubmit, onCancel, isLoading, initialData, businessProfile }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [products, setProducts] = useState([
        { id: '1', name: 'Áo Sơ mi Oxford', cost: '180000', originalPrice: '450000', currentSales: '150' },
        { id: '2', name: 'Quần Kaki Slimfit', cost: '220000', originalPrice: '550000', currentSales: '120' }
    ]);
    const [formData, setFormData] = useState({
        flatPrice: '399000', salesIncrease: '25', competitors: 'Uniqlo\nZara\nRoutine'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            if (initialData.products) setProducts(initialData.products);
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleProductChange = (id: string, field: string, value: string) => {
        setProducts(prods => prods.map(p => p.id === id ? { ...p, [field]: value } : p));
    };
    
    const handleProductSelect = (id: string, product: Product) => {
        setProducts(prods => prods.map(p => p.id === id ? { ...p, name: product.name, cost: product.cost, originalPrice: product.price } : p));
    };
    
    const addProduct = () => setProducts(prods => [...prods, { id: Date.now().toString(), name: '', cost: '', originalPrice: '', currentSales: '' }]);
    const removeProduct = (id: string) => setProducts(prods => prods.filter(p => p.id !== id));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};
        if (step === 1) {
            newErrors.flatPrice = validateNumberField(formData.flatPrice, 'Mức giá đồng giá');
            newErrors.salesIncrease = validateNumberField(formData.salesIncrease, 'Tăng trưởng doanh số', false);
        }
        if (step === 2) {
           products.forEach((p, i) => {
               if (!p.name.trim()) newErrors[`p_name_${i}`] = 'Tên là bắt buộc';
               if (validateNumberField(p.cost, 'Giá vốn')) newErrors[`p_cost_${i}`] = 'Giá vốn phải là số dương';
               if (validateNumberField(p.originalPrice, 'Giá gốc')) newErrors[`p_oprice_${i}`] = 'Giá gốc phải là số dương';
               if (validateNumberField(p.currentSales, 'Doanh số')) newErrors[`p_sales_${i}`] = 'Doanh số phải là số dương';
           });
        }
        setErrors(newErrors);
        return Object.values(newErrors).every(err => err === '');
    };
    
    const handleNext = () => {
        if (validateStep(currentStep)) setCurrentStep(s => Math.min(s + 1, 3));
    }
    const handleBack = () => setCurrentStep(s => Math.max(s - 1, 1));
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(products.length === 0) {
            alert("Vui lòng thêm ít nhất một sản phẩm.");
            return;
        }
        if (validateStep(1) && validateStep(2)) {
            const fullParams = { ...formData, products };
            onSubmit(fullParams);
        }
    };
    
    const commonInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";
    const tableInputClass = "w-full bg-transparent text-slate-800 dark:text-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

    return (
        <FormWrapper title={initialData ? 'Chỉnh sửa Phân tích' : taskTitles['group-price']} onCancel={onCancel} currentStep={currentStep} totalSteps={3} setStep={setCurrentStep}>
            <form onSubmit={handleSubmit}>
                {currentStep === 1 && (
                    <div className="space-y-4 animate-form-step-in">
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">Thiết lập kịch bản bán đồng giá.</p>
                        <div>
                            <label htmlFor="flatPrice">Mức giá đồng giá mục tiêu (VND)</label>
                            <input id="flatPrice" name="flatPrice" type="number" value={formData.flatPrice} onChange={handleChange} className={`${commonInputClass} ${errors.flatPrice ? 'ring-2 ring-red-500' : ''}`} />
                            {errors.flatPrice && <p className="text-xs text-red-500 mt-1">{errors.flatPrice}</p>}
                        </div>
                        <div>
                            <label htmlFor="salesIncrease">Tăng trưởng doanh số kỳ vọng cho mỗi sản phẩm (%)</label>
                            <input id="salesIncrease" name="salesIncrease" type="number" value={formData.salesIncrease} onChange={handleChange} className={`${commonInputClass} ${errors.salesIncrease ? 'ring-2 ring-red-500' : ''}`} />
                            {errors.salesIncrease && <p className="text-xs text-red-500 mt-1">{errors.salesIncrease}</p>}
                        </div>
                    </div>
                )}
                {currentStep === 2 && (
                    <div className="animate-form-step-in">
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">Nhập danh sách các sản phẩm áp dụng.</p>
                        <div className="space-y-3">
                           {products.map((p, index) => (
                               <div key={p.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-slate-100 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700">
                                   <div className="md:col-span-2">
                                       <label className="text-xs font-medium text-slate-500">Tên sản phẩm</label>
                                       <ProductSelector
                                            products={businessProfile?.products || []}
                                            onSelect={(product) => handleProductSelect(p.id, product)}
                                            value={p.name}
                                            onChange={(value) => handleProductChange(p.id, 'name', value)}
                                            className={tableInputClass}
                                            placeholder="Chọn hoặc nhập..."
                                       />
                                   </div>
                                   <div>
                                       <label className="text-xs font-medium text-slate-500">Giá vốn</label>
                                       <input type="number" value={p.cost} onChange={e => handleProductChange(p.id, 'cost', e.target.value)} className={tableInputClass} />
                                   </div>
                                    <div>
                                       <label className="text-xs font-medium text-slate-500">Giá gốc</label>
                                       <input type="number" value={p.originalPrice} onChange={e => handleProductChange(p.id, 'originalPrice', e.target.value)} className={tableInputClass} />
                                   </div>
                                   <div className="flex items-end gap-2">
                                       <div className="flex-grow">
                                           <label className="text-xs font-medium text-slate-500">Doanh số</label>
                                           <input type="number" value={p.currentSales} onChange={e => handleProductChange(p.id, 'currentSales', e.target.value)} className={tableInputClass} />
                                       </div>
                                       <button type="button" onClick={() => removeProduct(p.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                                   </div>
                               </div>
                           ))}
                        </div>
                        <button type="button" onClick={addProduct} className="w-full flex items-center justify-center gap-2 mt-3 p-2 text-sm font-semibold text-blue-600 dark:text-blue-400 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-blue-500/10 hover:border-blue-500">
                            <PlusIcon className="w-4 h-4" /> Thêm sản phẩm
                        </button>
                    </div>
                )}
                {currentStep === 3 && (
                    <div className="space-y-4 animate-form-step-in">
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-6">Thêm đối thủ để so sánh với thị trường.</p>
                        <div>
                            <label htmlFor="competitors">Đối thủ cạnh tranh (Tùy chọn)</label>
                            <textarea id="competitors" name="competitors" rows={4} value={formData.competitors} onChange={handleChange} placeholder="Uniqlo&#10;Zara&#10;Routine" className={commonInputClass} />
                        </div>
                    </div>
                )}
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">Hủy</button>
                    <div className="flex items-center gap-3">
                         {currentStep > 1 && <button type="button" onClick={handleBack} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">Quay lại</button>}
                        {currentStep < 3 ? <button type="button" onClick={handleNext} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500">Tiếp theo</button> : <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-slate-400">{isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}</button>}
                    </div>
                </div>
            </form>
        </FormWrapper>
    );
};

const MarketResearchForm: React.FC<{
    onSubmit: (params: Record<string, any>) => void;
    onCancel: () => void;
    isLoading: boolean;
    initialData?: Record<string, any>;
}> = ({ onSubmit, onCancel, isLoading, initialData }) => {
    const [formData, setFormData] = useState({
        season: 'spring-summer', // 'spring-summer', 'fall-winter', 'resort'
        year: (new Date().getFullYear() + 1).toString(),
        style_keywords: 'Denim, Office-casual, Tối giản, Hiện đại',
        target_audience: 'Nam & Nữ văn phòng Việt Nam, 20-35 tuổi, ưa chuộng phong cách thanh lịch, năng động.',
        markets: ['Seoul', 'Milan', 'Paris', 'Tokyo'],
        competitors: ['Routine', 'Uniqlo', 'COS', 'Massimo Dutti'],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            const initialMarkets = typeof initialData.markets === 'string' ? initialData.markets.split(',').map((s:string) => s.trim()) : initialData.markets || [];
            const initialCompetitors = typeof initialData.competitors === 'string' ? initialData.competitors.split(',').map((s:string) => s.trim()) : initialData.competitors || [];
            setFormData(prev => ({...prev, ...initialData, markets: initialMarkets, competitors: initialCompetitors}));
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
    
    const handleTagChange = (name: 'markets' | 'competitors', value: string[]) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!formData.year.trim()) newErrors.year = 'Năm là bắt buộc.';
        if (!formData.style_keywords.trim()) newErrors.style_keywords = 'Từ khóa phong cách là bắt buộc.';
        if (!formData.target_audience.trim()) newErrors.target_audience = 'Đối tượng khách hàng là bắt buộc.';
        if (formData.markets.length === 0) newErrors.markets = 'Cần ít nhất một thị trường tham chiếu.';
        
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        onSubmit(formData);
    };

    const commonInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";
    const segmentButtonClass = (isActive: boolean) => `flex-1 text-sm font-semibold py-2 rounded-md transition-colors duration-200 ${isActive ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-800/40'}`;

    return (
         <FormWrapper title={initialData ? 'Chỉnh sửa Nghiên cứu' : taskTitles['market-research']} onCancel={onCancel} currentStep={1} totalSteps={1} setStep={() => {}}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mùa</label>
                         <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-lg">
                            <button type="button" onClick={() => setFormData(p => ({...p, season: 'spring-summer'}))} className={segmentButtonClass(formData.season === 'spring-summer')}>Xuân/Hè</button>
                            <button type="button" onClick={() => setFormData(p => ({...p, season: 'fall-winter'}))} className={segmentButtonClass(formData.season === 'fall-winter')}>Thu/Đông</button>
                            <button type="button" onClick={() => setFormData(p => ({...p, season: 'resort'}))} className={segmentButtonClass(formData.season === 'resort')}>Resort</button>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="year" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Năm</label>
                        <input id="year" name="year" type="number" value={formData.year} onChange={handleChange} placeholder="VD: 2025" className={`${commonInputClass} ${errors.year ? 'ring-2 ring-red-500' : ''}`} />
                        {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year}</p>}
                    </div>
                </div>
                 <div>
                    <label htmlFor="style_keywords" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Từ khóa Phong cách</label>
                    <textarea id="style_keywords" name="style_keywords" rows={2} value={formData.style_keywords} onChange={handleChange} placeholder="VD: Minimalism, Sang trọng thầm lặng, Công sở..." className={`${commonInputClass} ${errors.style_keywords ? 'ring-2 ring-red-500' : ''}`} />
                    {errors.style_keywords && <p className="text-xs text-red-500 mt-1">{errors.style_keywords}</p>}
                </div>
                 <div>
                    <label htmlFor="target_audience" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Đối tượng Khách hàng</label>
                    <textarea id="target_audience" name="target_audience" rows={2} value={formData.target_audience} onChange={handleChange} placeholder="Mô tả đối tượng khách hàng của bạn: độ tuổi, giới tính, nghề nghiệp, phong cách sống..." className={`${commonInputClass} ${errors.target_audience ? 'ring-2 ring-red-500' : ''}`} />
                    {errors.target_audience && <p className="text-xs text-red-500 mt-1">{errors.target_audience}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="markets" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Thị trường Tham chiếu</label>
                        <TagInput
                            value={formData.markets}
                            onChange={(value) => handleTagChange('markets', value)}
                            placeholder="Thêm thị trường..."
                            suggestions={['New York', 'London', 'Việt Nam']}
                        />
                         {errors.markets && <p className="text-xs text-red-500 mt-1">{errors.markets}</p>}
                    </div>
                    <div>
                        <label htmlFor="competitors" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Đối thủ Cạnh tranh (Tùy chọn)</label>
                        <TagInput
                            value={formData.competitors}
                            onChange={(value) => handleTagChange('competitors', value)}
                            placeholder="Thêm đối thủ..."
                            suggestions={["Levi's", 'Everlane', 'DirtyCoins', 'Coolmate']}
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50">Hủy</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors duration-200 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                        {isLoading ? 'Đang nghiên cứu...' : 'Bắt đầu Nghiên cứu'}
                    </button>
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
    case 'market-research':
      return <MarketResearchForm onSubmit={handleSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} />;
    case 'promo-price':
      return <PromoPriceForm onSubmit={handleSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} businessProfile={businessProfile} />;
    case 'group-price':
      return <GroupPriceForm onSubmit={handleSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} businessProfile={businessProfile} />;
    default:
      return null;
  }
};

const style = document.createElement('style');
style.innerHTML = `
    @keyframes formStepIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
    }
    .animate-form-step-in {
        animation: formStepIn 0.3s ease-out forwards;
    }
`;
document.head.appendChild(style);