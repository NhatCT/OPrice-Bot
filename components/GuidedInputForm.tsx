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

const COMPETITOR_SUGGESTIONS = [
  'YODY', 'MUJI', 'UNIQLO', 'ROUTINE', 'GENVIET', '#icon denim', 'PT2000', 
  'ZARA', 'Levi\'s', 'Lee', 'Calvin Klein Jeans', 'GUESS', 'VERSACE', 
  'GUCCI', 'LOUIS VUITTON', 'DSQUARED2', 'DIESEL'
];

interface CompetitorSelectorBarProps {
    selected: string[];
    onToggle: (brand: string) => void;
}

const CompetitorSelectorBar: React.FC<CompetitorSelectorBarProps> = ({ selected, onToggle }) => (
    <div className="flex flex-wrap gap-2 mb-3">
      {COMPETITOR_SUGGESTIONS.map(brand => {
        const isSelected = selected.includes(brand);
        return (
          <button
            type="button"
            key={brand}
            onClick={() => onToggle(brand)}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors duration-200 ${
              isSelected 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : 'bg-white dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-500'
            }`}
          >
            {brand}
          </button>
        );
      })}
    </div>
);


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
                                        className="w-full text-left px-4 py-3 text-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                                    >
                                        <p className="font-semibold">{product.name}</p>
                                        <p className="text-xl text-slate-500 dark:text-slate-400">SKU: {product.sku} | Vốn: {Number(product.cost).toLocaleString('vi-VN')}đ | Giá: {Number(product.price).toLocaleString('vi-VN')}đ</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-3 text-2xl text-slate-500 dark:text-slate-400 text-center">Không tìm thấy sản phẩm.</p>
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
        <h3 className="text-4xl font-bold text-center text-slate-800 dark:text-slate-100">{title}</h3>
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
type Period = 'monthly' | 'quarterly' | 'seasonally' | 'annually';
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
    
    const periodButtonLabels: Record<Period, string> = {
        monthly: 'Theo Tháng',
        quarterly: 'Theo Quý',
        seasonally: 'Theo Mùa',
        annually: 'Theo Năm',
    };
    const periodLabels: Record<Period, string> = {
        monthly: 'Tháng',
        quarterly: 'Quý',
        seasonally: 'Mùa',
        annually: 'Năm',
    };

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
            sellingPrice: calculationTarget !== 'sellingPrice' ? product.price : '',
        }));
    };

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.productName.trim()) newErrors.productName = 'Tên sản phẩm là bắt buộc.';
        newErrors.cost = validateNumberField(formData.cost, 'Giá vốn', true);
        newErrors.variableCost = validateNumberField(formData.variableCost, 'Chi phí biến đổi', false);
        
        const validErrors = Object.values(newErrors).filter(Boolean);
        if (validErrors.length > 0) {
            setErrors(newErrors);
            return false;
        }
        setErrors({});
        return true;
    };

    const validateStep2 = () => {
        const newErrors: Record<string, string> = {};
        newErrors.fixedCost = validateNumberField(formData.fixedCost, 'Chi phí cố định', false);
        if (calculationTarget !== 'sellingPrice') newErrors.sellingPrice = validateNumberField(formData.sellingPrice, 'Giá bán', true);
        if (calculationTarget !== 'salesVolume') newErrors.salesVolume = validateNumberField(formData.salesVolume, 'Số lượng bán', true);
        if (calculationTarget !== 'profit') {
            if (profitTargetType === 'amount') {
                newErrors.targetProfit = validateNumberField(formData.targetProfit, 'Lợi nhuận mục tiêu', true);
            } else {
                newErrors.targetProfitPercent = validateNumberField(formData.targetProfitPercent, 'Tỷ suất lợi nhuận', true);
            }
        }
        
        const validErrors = Object.values(newErrors).filter(Boolean);
        if (validErrors.length > 0) {
            setErrors(newErrors);
            return false;
        }
        setErrors({});
        return true;
    };

    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        }
        if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        }
    };
    
    const handlePrev = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
    }
    
    const handleSubmit = useCallback(() => {
        if (!validateStep1() || !validateStep2()) {
            alert('Vui lòng kiểm tra lại các thông tin đã nhập.');
            if (!validateStep1()) setCurrentStep(1);
            else if(!validateStep2()) setCurrentStep(2);
            return;
        }
        const params = {
            productName: formData.productName,
            cost: formData.cost,
            variableCost: formData.variableCost,
            fixedCost: formData.fixedCost,
            sellingPrice: formData.sellingPrice,
            salesVolume: formData.salesVolume,
            targetProfit: formData.targetProfit,
            targetProfitPercent: formData.targetProfitPercent,
            calculationTarget: calculationTarget,
            period: period,
            profitTargetType: profitTargetType,
            competitors: formData.competitors,
        };
        onSubmit(params);
    }, [formData, calculationTarget, period, profitTargetType, onSubmit]);
    
    const formLabelClass = "block text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-3";
    const formInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-lg px-6 py-5 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";
    const formErrorClass = "text-sm text-red-500 mt-1";
    
    const getButtonClass = (isActive: boolean) => 
    `w-full text-center px-4 py-4 text-2xl rounded-md transition-colors duration-200 font-semibold ${
      isActive
        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/60'
    }`;
    
    return (
        <FormWrapper title={taskTitles['profit-analysis']} onCancel={onCancel} currentStep={currentStep} totalSteps={3} setStep={setCurrentStep}>
            {/* Step 1: Thông tin Sản phẩm */}
            {currentStep === 1 && (
                 <div className="space-y-6">
                    <div>
                        <label htmlFor="productName" className={formLabelClass}>Tên sản phẩm</label>
                         <ProductSelector
                            id="productName"
                            products={businessProfile?.products || []}
                            value={formData.productName}
                            onChange={(value) => handleChange({ target: { name: 'productName', value } } as React.ChangeEvent<HTMLInputElement>)}
                            onSelect={handleProductSelect}
                            placeholder="Chọn hoặc nhập tên sản phẩm..."
                            className={formInputClass}
                        />
                        {errors.productName && <p className={formErrorClass}>{errors.productName}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="cost" className={formLabelClass}>Giá vốn / sản phẩm (VND)</label>
                            <input type="number" id="cost" name="cost" value={formData.cost} onChange={handleChange} placeholder="VD: 250000" className={formInputClass} />
                            {errors.cost && <p className={formErrorClass}>{errors.cost}</p>}
                        </div>
                        <div>
                            <label htmlFor="variableCost" className={formLabelClass}>Chi phí biến đổi / sản phẩm (VND)</label>
                            <input type="number" id="variableCost" name="variableCost" value={formData.variableCost} onChange={handleChange} placeholder="VD: 20000" className={formInputClass} />
                            {errors.variableCost && <p className={formErrorClass}>{errors.variableCost}</p>}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Step 2: Kế hoạch Kinh doanh */}
            {currentStep === 2 && (
                 <div className="space-y-6">
                    <div>
                        <label className={formLabelClass}>Mục tiêu cần tính</label>
                        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200 dark:bg-slate-800/60 rounded-lg">
                            <button type="button" onClick={() => setCalculationTarget('profit')} className={getButtonClass(calculationTarget === 'profit')}>Lợi nhuận</button>
                            <button type="button" onClick={() => setCalculationTarget('sellingPrice')} className={getButtonClass(calculationTarget === 'sellingPrice')}>Giá bán</button>
                            <button type="button" onClick={() => setCalculationTarget('salesVolume')} className={getButtonClass(calculationTarget === 'salesVolume')}>Số lượng</button>
                        </div>
                    </div>
                    <div>
                         <label className={formLabelClass}>Kỳ kế hoạch</label>
                         <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 p-1 bg-slate-200 dark:bg-slate-800/60 rounded-lg">
                             {(Object.keys(periodButtonLabels) as Period[]).map(p => (
                                 <button
                                     key={p}
                                     type="button"
                                     onClick={() => setPeriod(p)}
                                     className={getButtonClass(period === p)}
                                 >
                                     {periodButtonLabels[p]}
                                 </button>
                             ))}
                         </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="fixedCost" className={formLabelClass}>Tổng chi phí cố định / {periodLabels[period]} (VND)</label>
                            <input type="number" id="fixedCost" name="fixedCost" value={formData.fixedCost} onChange={handleChange} placeholder="VD: 50000000" className={formInputClass} />
                            {errors.fixedCost && <p className={formErrorClass}>{errors.fixedCost}</p>}
                        </div>
                        <div>
                            <label htmlFor="salesVolume" className={formLabelClass}>{calculationTarget === 'salesVolume' ? 'Mục tiêu Số lượng bán' : `Số lượng bán dự kiến / ${periodLabels[period]}`}</label>
                            <input type="number" id="salesVolume" name="salesVolume" value={formData.salesVolume} onChange={handleChange} placeholder="VD: 400" className={formInputClass} disabled={calculationTarget === 'salesVolume'} />
                            {errors.salesVolume && <p className={formErrorClass}>{errors.salesVolume}</p>}
                        </div>
                        <div>
                            <label htmlFor="sellingPrice" className={formLabelClass}>Giá bán / sản phẩm (VND)</label>
                            <input type="number" id="sellingPrice" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} placeholder="VD: 750000" className={formInputClass} disabled={calculationTarget === 'sellingPrice'}/>
                            {errors.sellingPrice && <p className={formErrorClass}>{errors.sellingPrice}</p>}
                        </div>
                       
                        {calculationTarget !== 'profit' && (
                            <div>
                                <label className={formLabelClass}>Lợi nhuận mục tiêu</label>
                                 <div className="flex">
                                     <button type="button" onClick={() => setProfitTargetType('amount')} className={`px-4 py-3 rounded-l-lg border-t border-b border-l ${profitTargetType === 'amount' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500'}`}>VND</button>
                                     <button type="button" onClick={() => setProfitTargetType('percent')} className={`px-4 py-3 rounded-r-lg border-t border-b border-r ${profitTargetType === 'percent' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500'}`}>%</button>
                                 </div>
                                {profitTargetType === 'amount' ? (
                                    <>
                                        <input type="number" id="targetProfit" name="targetProfit" value={formData.targetProfit} onChange={handleChange} placeholder="VD: 100000000" className={formInputClass + ' mt-2'}/>
                                        {errors.targetProfit && <p className={formErrorClass}>{errors.targetProfit}</p>}
                                    </>
                                ) : (
                                    <>
                                        <input type="number" id="targetProfitPercent" name="targetProfitPercent" value={formData.targetProfitPercent} onChange={handleChange} placeholder="VD: 25" className={formInputClass + ' mt-2'} />
                                        {errors.targetProfitPercent && <p className={formErrorClass}>{errors.targetProfitPercent}</p>}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Step 3: Phân tích Thị trường */}
            {currentStep === 3 && (
                <div className="space-y-6">
                    <div>
                        <label className={`${formLabelClass} flex items-center gap-2`}>
                            <GlobeAltIcon className="w-5 h-5" />
                            Phân tích Cạnh tranh (Tùy chọn)
                        </label>
                         <p className="text-2xl text-slate-500 dark:text-slate-400 mb-3">Chọn hoặc nhập tên các đối thủ để AI tìm kiếm và so sánh giá trên thị trường.</p>
                         <TagInput
                            value={formData.competitors}
                            onChange={(newValue) => setFormData(p => ({...p, competitors: newValue}))}
                            placeholder="Nhập tên đối thủ rồi nhấn Enter..."
                            suggestions={COMPETITOR_SUGGESTIONS}
                         />
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex justify-between items-center">
                <div>
                    {currentStep > 1 && (
                         <button type="button" onClick={handlePrev} className="px-7 py-4 text-2xl font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-300">
                             Quay lại
                         </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={onCancel} className="px-7 py-4 text-2xl font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors duration-300">
                        Hủy
                    </button>
                     {currentStep < 3 ? (
                         <button type="button" onClick={handleNext} className="px-7 py-4 text-2xl font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors duration-300">
                             Tiếp theo
                         </button>
                     ) : (
                          <button type="button" onClick={handleSubmit} disabled={isLoading} className="px-7 py-4 text-2xl font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors duration-300 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading ? 'Đang phân tích...' : 'Bắt đầu Phân tích'}
                          </button>
                     )}
                </div>
            </div>
        </FormWrapper>
    );
};

const PromoPriceAnalysisForm: React.FC<{
    onSubmit: (params: Record<string, any>) => void;
    onCancel: () => void;
    isLoading: boolean;
    initialData?: Record<string, any>;
    businessProfile: BusinessProfile | null;
}> = ({ onSubmit, onCancel, isLoading, initialData, businessProfile }) => {
     const [formData, setFormData] = useState({
        productName: '', cost: '', originalPrice: '', currentSales: '500', discount: '20', promoGoal: 'profit', competitors: [] as string[]
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);
    
     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleProductSelect = (product: BusinessProduct) => {
        setFormData(prev => ({
            ...prev,
            productName: product.name,
            cost: product.cost,
            originalPrice: product.price,
        }));
    };
    
    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.productName.trim()) newErrors.productName = 'Tên sản phẩm là bắt buộc.';
        newErrors.cost = validateNumberField(formData.cost, 'Giá vốn', true);
        newErrors.originalPrice = validateNumberField(formData.originalPrice, 'Giá bán gốc', true);
        newErrors.currentSales = validateNumberField(formData.currentSales, 'Số lượng', true);
        newErrors.discount = validateNumberField(formData.discount, 'Tỷ lệ giảm giá', true);

        const validErrors = Object.values(newErrors).filter(Boolean);
        if (validErrors.length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});
        onSubmit(formData);
    };

    const formLabelClass = "block text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-3";
    const formInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-lg px-6 py-5 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";
    const formErrorClass = "text-sm text-red-500 mt-1";

    return (
         <FormWrapper title={taskTitles['promo-price']} onCancel={onCancel} currentStep={1} totalSteps={1} setStep={()=>{}}>
            <div className="space-y-6">
                <div>
                    <label htmlFor="productName" className={formLabelClass}>Sản phẩm cần phân tích</label>
                    <ProductSelector
                        id="productName"
                        products={businessProfile?.products || []}
                        value={formData.productName}
                        onChange={(value) => handleChange({ target: { name: 'productName', value } } as React.ChangeEvent<HTMLInputElement>)}
                        onSelect={handleProductSelect}
                        placeholder="Chọn hoặc nhập tên sản phẩm..."
                        className={formInputClass}
                    />
                    {errors.productName && <p className={formErrorClass}>{errors.productName}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="cost" className={formLabelClass}>Giá vốn (VND)</label>
                        <input type="number" id="cost" name="cost" value={formData.cost} onChange={handleChange} placeholder="Tự động điền" className={formInputClass} />
                        {errors.cost && <p className={formErrorClass}>{errors.cost}</p>}
                    </div>
                     <div>
                        <label htmlFor="originalPrice" className={formLabelClass}>Giá bán gốc (VND)</label>
                        <input type="number" id="originalPrice" name="originalPrice" value={formData.originalPrice} onChange={handleChange} placeholder="Tự động điền" className={formInputClass} />
                        {errors.originalPrice && <p className={formErrorClass}>{errors.originalPrice}</p>}
                    </div>
                    <div>
                        <label htmlFor="currentSales" className={formLabelClass}>Số lượng bán hiện tại / tháng</label>
                        <input type="number" id="currentSales" name="currentSales" value={formData.currentSales} onChange={handleChange} placeholder="VD: 500" className={formInputClass} />
                        {errors.currentSales && <p className={formErrorClass}>{errors.currentSales}</p>}
                    </div>
                    <div>
                        <label htmlFor="discount" className={formLabelClass}>Tỷ lệ giảm giá dự kiến (%)</label>
                        <input type="number" id="discount" name="discount" value={formData.discount} onChange={handleChange} placeholder="VD: 20" className={formInputClass} />
                        {errors.discount && <p className={formErrorClass}>{errors.discount}</p>}
                    </div>
                </div>
                 <div>
                    <label htmlFor="promoGoal" className={formLabelClass}>Mục tiêu chiến dịch</label>
                    <select id="promoGoal" name="promoGoal" value={formData.promoGoal} onChange={handleChange} className={formInputClass}>
                        <option value="profit">Tối đa hóa Lợi nhuận</option>
                        <option value="revenue">Tối đa hóa Doanh thu</option>
                    </select>
                </div>
                 <div>
                    <label className={`${formLabelClass} flex items-center gap-2`}>
                        <GlobeAltIcon className="w-5 h-5" />
                        Phân tích Cạnh tranh (Tùy chọn)
                    </label>
                     <p className="text-2xl text-slate-500 dark:text-slate-400 mb-3">Chọn hoặc nhập tên các đối thủ để so sánh.</p>
                     <TagInput
                        value={formData.competitors}
                        onChange={(newValue) => setFormData(p => ({...p, competitors: newValue}))}
                        placeholder="Nhập tên đối thủ rồi nhấn Enter..."
                        suggestions={COMPETITOR_SUGGESTIONS}
                     />
                </div>

            </div>
             <div className="mt-8 flex justify-end items-center gap-3">
                <button type="button" onClick={onCancel} className="px-7 py-4 text-2xl font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors duration-300">
                    Hủy
                </button>
                 <button type="button" onClick={handleSubmit} disabled={isLoading} className="px-7 py-4 text-2xl font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors duration-300 disabled:bg-slate-400 disabled:cursor-wait">
                    {isLoading ? 'Đang phân tích...' : 'Bắt đầu Phân tích'}
                 </button>
            </div>
        </FormWrapper>
    );
};

interface GroupPriceProduct extends BusinessProduct {
    originalPrice: string;
    currentSales: string;
}

const GroupPriceAnalysisForm: React.FC<{
    onSubmit: (params: Record<string, any>) => void;
    onCancel: () => void;
    isLoading: boolean;
    initialData?: Record<string, any>;
    businessProfile: BusinessProfile | null;
}> = ({ onSubmit, onCancel, isLoading, initialData, businessProfile }) => {
    const [products, setProducts] = useState<GroupPriceProduct[]>([]);
    const [formData, setFormData] = useState({
        flatPrice: '199000', salesIncrease: '20', competitors: [] as string[]
    });
     const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({...prev, ...initialData}));
            if (initialData.products) setProducts(initialData.products);
        }
    }, [initialData]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProductChange = (id: string, field: keyof GroupPriceProduct, value: string) => {
        setProducts(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
    };
    
    const handleProductSelect = (index: number, product: BusinessProduct) => {
        setProducts(prev => {
            const newProducts = [...prev];
            newProducts[index] = {
                ...newProducts[index],
                ...product,
                originalPrice: product.price,
            };
            return newProducts;
        });
    };

    const addProduct = () => {
        setProducts(prev => [...prev, { id: Date.now().toString(), name: '', cost: '', price: '', sku: '', originalPrice: '', currentSales: '100' }]);
    };

    const removeProduct = (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };
    
    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};
        newErrors.flatPrice = validateNumberField(formData.flatPrice, 'Giá đồng giá', true);
        newErrors.salesIncrease = validateNumberField(formData.salesIncrease, 'Tăng trưởng bán', true);

        if (products.length === 0) {
            alert("Vui lòng thêm ít nhất một sản phẩm.");
            return;
        }
        
        const validErrors = Object.values(newErrors).filter(Boolean);
        if (validErrors.length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});
        onSubmit({ ...formData, products });
    };

    const formLabelClass = "block text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-3";
    const formInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-lg px-6 py-5 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";
    const formErrorClass = "text-sm text-red-500 mt-1";
    const tableInputClass = "w-full bg-transparent text-2xl text-slate-800 dark:text-slate-200 p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-slate-100 dark:focus:bg-slate-700 rounded";

    return (
        <FormWrapper title={taskTitles['group-price']} onCancel={onCancel} currentStep={1} totalSteps={1} setStep={()=>{}}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="flatPrice" className={formLabelClass}>Giá đồng giá mục tiêu (VND)</label>
                        <input type="number" id="flatPrice" name="flatPrice" value={formData.flatPrice} onChange={handleFormChange} className={formInputClass} />
                         {errors.flatPrice && <p className={formErrorClass}>{errors.flatPrice}</p>}
                    </div>
                    <div>
                        <label htmlFor="salesIncrease" className={formLabelClass}>Tăng trưởng Số lượng bán dự kiến / sản phẩm (%)</label>
                        <input type="number" id="salesIncrease" name="salesIncrease" value={formData.salesIncrease} onChange={handleFormChange} className={formInputClass} />
                         {errors.salesIncrease && <p className={formErrorClass}>{errors.salesIncrease}</p>}
                    </div>
                </div>

                <div>
                    <h4 className={formLabelClass}>Sản phẩm áp dụng</h4>
                     <div className="overflow-x-auto border border-slate-300 dark:border-slate-600 rounded-lg">
                        <table className="w-full text-2xl">
                            <thead className="bg-slate-100 dark:bg-slate-700">
                                <tr>
                                    <th className="p-3 text-left font-semibold">Tên sản phẩm</th>
                                    <th className="p-3 text-left font-semibold">Giá gốc (VND)</th>
                                    <th className="p-3 text-left font-semibold">Giá vốn (VND)</th>
                                    <th className="p-3 text-left font-semibold">Số lượng bán / tháng</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p, index) => (
                                    <tr key={p.id} className="border-t border-slate-200 dark:border-slate-600">
                                        <td className="p-2 w-2/5">
                                            <ProductSelector
                                                products={businessProfile?.products || []}
                                                value={p.name}
                                                onChange={(value) => handleProductChange(p.id, 'name', value)}
                                                onSelect={(prod) => handleProductSelect(index, prod)}
                                                placeholder="Chọn hoặc nhập..."
                                                className={tableInputClass}
                                            />
                                        </td>
                                        <td className="p-2"><input type="number" value={p.originalPrice} onChange={e => handleProductChange(p.id, 'originalPrice', e.target.value)} className={tableInputClass} placeholder="0"/></td>
                                        <td className="p-2"><input type="number" value={p.cost} onChange={e => handleProductChange(p.id, 'cost', e.target.value)} className={tableInputClass} placeholder="0"/></td>
                                        <td className="p-2"><input type="number" value={p.currentSales} onChange={e => handleProductChange(p.id, 'currentSales', e.target.value)} className={tableInputClass} placeholder="100"/></td>
                                        <td className="p-2 text-center">
                                            <button type="button" onClick={() => removeProduct(p.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button type="button" onClick={addProduct} className="mt-3 flex items-center gap-2 px-3 py-2 text-lg font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 rounded-md">
                        <PlusIcon className="w-4 h-4" />
                        Thêm sản phẩm
                    </button>
                </div>
                 <div>
                    <label className={`${formLabelClass} flex items-center gap-2`}>
                        <GlobeAltIcon className="w-5 h-5" />
                        Phân tích Cạnh tranh (Tùy chọn)
                    </label>
                     <p className="text-2xl text-slate-500 dark:text-slate-400 mb-3">Chọn hoặc nhập tên các đối thủ để so sánh.</p>
                     <TagInput
                        value={formData.competitors}
                        onChange={(newValue) => setFormData(p => ({...p, competitors: newValue}))}
                        placeholder="Nhập tên đối thủ rồi nhấn Enter..."
                        suggestions={COMPETITOR_SUGGESTIONS}
                     />
                </div>
            </div>
             <div className="mt-8 flex justify-end items-center gap-3">
                <button type="button" onClick={onCancel} className="px-7 py-4 text-2xl font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors duration-300">
                    Hủy
                </button>
                 <button type="button" onClick={handleSubmit} disabled={isLoading} className="px-7 py-4 text-2xl font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors duration-300 disabled:bg-slate-400 disabled:cursor-wait">
                    {isLoading ? 'Đang phân tích...' : 'Bắt đầu Phân tích'}
                 </button>
            </div>
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
        season: 'Fall/Winter',
        year: '2025',
        style_keywords: 'Quiet Luxury, Dark Utility, Grunge',
        target_audience: 'Gen Z and Millennials who value unique, high-quality denim with a modern aesthetic.',
        markets: ['Asia', 'Europe'],
        competitors: ['#icon denim', 'ZARA', 'ROUTINE'] as string[]
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleSubmit = () => {
        if (!formData.style_keywords.trim() || !formData.target_audience.trim()) {
            alert('Vui lòng điền các từ khóa phong cách và đối tượng mục tiêu.');
            return;
        }
        onSubmit(formData);
    };

    const formLabelClass = "block text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-3";
    const formInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-lg px-6 py-5 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";
    const formErrorClass = "text-sm text-red-500 mt-1";
    
    return (
        <FormWrapper title={taskTitles['market-research']} onCancel={onCancel} currentStep={1} totalSteps={1} setStep={() => {}}>
             <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="season" className={formLabelClass}>Mùa</label>
                        <select id="season" name="season" value={formData.season} onChange={handleChange} className={formInputClass}>
                            <option value="Spring/Summer">Xuân/Hè</option>
                            <option value="Fall/Winter">Thu/Đông</option>
                            <option value="Resort">Resort</option>
                            <option value="Pre-Fall">Pre-Fall</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year" className={formLabelClass}>Năm</label>
                        <input type="number" id="year" name="year" value={formData.year} onChange={handleChange} className={formInputClass} />
                    </div>
                 </div>
                 <div>
                    <label htmlFor="style_keywords" className={formLabelClass}>Từ khóa Phong cách</label>
                    <input type="text" id="style_keywords" name="style_keywords" value={formData.style_keywords} onChange={handleChange} placeholder="VD: Quiet Luxury, Y2K, Grunge" className={formInputClass} />
                 </div>
                 <div>
                    <label htmlFor="target_audience" className={formLabelClass}>Đối tượng mục tiêu</label>
                    <textarea id="target_audience" name="target_audience" value={formData.target_audience} onChange={handleChange} rows={3} placeholder="Mô tả đối tượng khách hàng của bạn..." className={formInputClass} />
                 </div>
                  <div>
                    <label className={formLabelClass}>Thị trường tham khảo</label>
                     <TagInput
                        value={formData.markets}
                        onChange={(newValue) => setFormData(p => ({...p, markets: newValue}))}
                        placeholder="Nhập tên thị trường (VD: Asia)..."
                        suggestions={['Asia', 'Europe', 'North America', 'Vietnam', 'Korea', 'Japan']}
                     />
                 </div>
                 <div>
                    <label className={formLabelClass}>Đối thủ cạnh tranh (Để tham khảo)</label>
                     <TagInput
                        value={formData.competitors}
                        onChange={(newValue) => setFormData(p => ({...p, competitors: newValue}))}
                        placeholder="Nhập tên đối thủ rồi nhấn Enter..."
                        suggestions={COMPETITOR_SUGGESTIONS}
                     />
                 </div>
             </div>
              <div className="mt-8 flex justify-end items-center gap-3">
                <button type="button" onClick={onCancel} className="px-7 py-4 text-2xl font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors duration-300">
                    Hủy
                </button>
                 <button type="button" onClick={handleSubmit} disabled={isLoading} className="px-7 py-4 text-2xl font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors duration-300 disabled:bg-slate-400 disabled:cursor-wait">
                    {isLoading ? 'Đang nghiên cứu...' : 'Bắt đầu Nghiên cứu'}
                 </button>
            </div>
        </FormWrapper>
    );
};

// Fix: The child form components expect an onSubmit handler that only takes `params`,
// but the `GuidedInputForm` receives one that expects `(task, params)`.
// This wrapper adapts the `onSubmit` prop to match what the child components expect,
// while still passing the `task` to the original handler.
export const GuidedInputForm: React.FC<GuidedInputFormProps> = (props) => {
  const { task, onSubmit, ...rest } = props;

  const handleSubmit = (params: Record<string, any>) => {
    onSubmit(task, params);
  };
  
  const childProps = { ...rest, onSubmit: handleSubmit };

  switch (task) {
    case 'profit-analysis':
      return <ProfitAnalysisForm {...childProps} />;
    case 'promo-price':
      return <PromoPriceAnalysisForm {...childProps} />;
    case 'group-price':
      return <GroupPriceAnalysisForm {...childProps} />;
    case 'market-research':
        // The businessProfile prop is not used by MarketResearchForm, but it doesn't cause harm.
        return <MarketResearchForm {...childProps} />;
    default:
      return <div>Form for {props.task} not implemented.</div>;
  }
};