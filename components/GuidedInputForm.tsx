import React, { useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';

export type Task = 'selling-price' | 'promo-price' | 'group-price';

type ImageData = { data: string; mimeType: string };

interface GuidedInputFormProps {
  task: Task;
  onSubmit: (prompt: string, image?: ImageData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

interface FormProps {
  onSubmit: (prompt: string, image?: ImageData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

interface PriceTier {
    id: number;
    fromQuantity: string;
    price: string;
}

type FormErrors = { [key: string]: string | undefined };


const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
    </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.707-10.707a1 1 0 0 0-1.414-1.414L10 8.586 7.707 6.293a1 1 0 0 0-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 1 0 1.414 1.414L10 11.414l2.293 2.293a1 1 0 0 0 1.414-1.414L11.414 10l2.293-2.293Z" clipRule="evenodd" />
    </svg>
);

const FieldError: React.FC<{ message?: string }> = ({ message }) => {
    if (!message) return null;
    return <p className="text-red-500 text-xs mt-1 animate-fade-in-fast">{message}</p>;
};

const commonInputClass = "w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-lg px-4 py-2.5 focus:outline-none focus:bg-slate-200/50 dark:focus:bg-slate-600/50 focus:ring-2 focus:scale-[1.01] transform transition-all duration-300 disabled:opacity-50";
const getInputClass = (hasError: boolean) =>
  `${commonInputClass} ${
    hasError
      ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500 focus:ring-red-500'
      : 'border-slate-200 dark:border-transparent focus:ring-sky-500'
  }`;

const commonLabelClass = "block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1";
const primaryButtonClass = "w-full bg-sky-600 text-white rounded-lg py-2.5 font-semibold hover:bg-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 flex items-center justify-center";
const secondaryButtonClass = "w-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg py-2.5 font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-300";
const radioLabelClass = "flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer";
const radioInputClass = "h-4 w-4 text-sky-600 bg-slate-200 dark:bg-slate-600 border-slate-400 dark:border-slate-500 focus:ring-sky-500 focus:ring-offset-0";
const checkboxInputClass = "h-4 w-4 text-sky-600 bg-slate-200 dark:bg-slate-600 border-slate-400 dark:border-slate-500 rounded focus:ring-sky-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800";


const SellingPriceForm: React.FC<FormProps> = ({ onSubmit, onCancel, isLoading }) => {
  const [productName, setProductName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [variableCost, setVariableCost] = useState('');
  const [manufactureDate, setManufactureDate] = useState('');
  const [manufactureTime, setManufactureTime] = useState('');
  const [profitValue, setProfitValue] = useState('');
  const [profitType, setProfitType] = useState<'margin' | 'fixed'>('margin');
  const [useTieredPricing, setUseTieredPricing] = useState(false);
  const [tiers, setTiers] = useState<PriceTier[]>([{ id: Date.now(), fromQuantity: '1', price: '' }]);
  const [productImage, setProductImage] = useState<ImageData | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const clearError = (fieldName: string) => {
    if (errors[fieldName]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!productName.trim()) newErrors.productName = 'Tên sản phẩm là bắt buộc.';
    
    if (!costPrice.trim()) {
      newErrors.costPrice = 'Giá vốn là bắt buộc.';
    } else if (isNaN(Number(costPrice)) || Number(costPrice) <= 0) {
      newErrors.costPrice = 'Vui lòng nhập một số dương hợp lệ.';
    }

    if (variableCost.trim() && (isNaN(Number(variableCost)) || Number(variableCost) < 0)) {
      newErrors.variableCost = 'Vui lòng nhập một số hợp lệ.';
    }

    if (useTieredPricing) {
      tiers.forEach(tier => {
        const qtyKey = `tier_fromQuantity_${tier.id}`;
        if (!tier.fromQuantity.trim()) {
            newErrors[qtyKey] = 'Bắt buộc.';
        } else if (isNaN(Number(tier.fromQuantity)) || Number(tier.fromQuantity) <= 0) {
            newErrors[qtyKey] = 'Số lượng không hợp lệ.';
        }
        const priceKey = `tier_price_${tier.id}`;
        if (!tier.price.trim()) {
             newErrors[priceKey] = 'Bắt buộc.';
        } else if (isNaN(Number(tier.price)) || Number(tier.price) <= 0) {
            newErrors[priceKey] = 'Giá không hợp lệ.';
        }
      });
    } else {
        if (!profitValue.trim()) {
          newErrors.profitValue = 'Giá trị lợi nhuận là bắt buộc.';
        } else if (isNaN(Number(profitValue)) || Number(profitValue) <= 0) {
          newErrors.profitValue = 'Vui lòng nhập một số dương hợp lệ.';
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleTierChange = (id: number, field: 'fromQuantity' | 'price', value: string) => {
    setTiers(tiers.map(tier => 
        tier.id === id ? { ...tier, [field]: value } : tier
    ));
    clearError(`tier_${field}_${id}`);
  };
  
  const addTier = () => {
    const lastQuantity = tiers.length > 0 ? parseInt(tiers[tiers.length - 1].fromQuantity) : 0;
    const newQuantity = isNaN(lastQuantity) ? '' : (lastQuantity + 1).toString();
    setTiers([...tiers, { id: Date.now(), fromQuantity: newQuantity, price: '' }]);
  };

  const removeTier = (idToRemove: number) => {
    setTiers(tiers.filter(tier => tier.id !== idToRemove));
  };
  
  const handleImageUpload = (file: File | null) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProductImage({
            data: reader.result as string,
            mimeType: file.type,
          });
        };
        reader.readAsDataURL(file);
      } else {
        setProductImage(null);
      }
  };
  
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if(file) handleImageUpload(file);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    let prompt = `Hãy tính và phân tích giá bán cho sản phẩm '${productName}' với giá vốn là ${costPrice}`;
    if (variableCost) {
        prompt += ` và chi phí biến đổi trên mỗi sản phẩm là ${variableCost}`;
    }

    if (manufactureDate) {
        prompt += `, được sản xuất/nhập vào ngày ${manufactureDate}`;
        if (manufactureTime) {
            prompt += ` lúc ${manufactureTime}`;
        }
    }

    if (useTieredPricing) {
        prompt += `. Áp dụng chính sách giá theo bậc thang như sau:\n`;
        const tierDescriptions = tiers
            .slice()
            .sort((a, b) => Number(a.fromQuantity) - Number(b.fromQuantity))
            .map(tier => `- Mua từ ${tier.fromQuantity} sản phẩm, giá bán là ${tier.price} VND/sản phẩm.`)
            .join('\n');
        prompt += tierDescriptions;
        prompt += `\nHãy phân tích chi tiết về lợi nhuận và điểm hòa vốn cho từng bậc giá.`;
    } else {
        if (profitType === 'margin') {
            prompt += `, lợi nhuận mong muốn là ${profitValue}%.`;
        } else {
            prompt += `, lợi nhuận cố định mong muốn là ${profitValue} VND.`;
        }
    }
    onSubmit(prompt, productImage ?? undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="productName" className={commonLabelClass}>Tên sản phẩm</label>
        <input id="productName" type="text" value={productName} onChange={(e) => { setProductName(e.target.value); clearError('productName'); }} placeholder="VD: Áo thun cao cấp" className={getInputClass(!!errors.productName)} disabled={isLoading} required />
        <FieldError message={errors.productName} />
      </div>
      
       <div>
        <label className={commonLabelClass}>Hình ảnh sản phẩm (Tùy chọn)</label>
        {productImage ? (
            <div className="relative w-40 h-40">
                <img src={productImage.data} alt="Product preview" className="w-full h-full object-cover rounded-lg border-2 border-slate-300 dark:border-slate-600" />
                <button 
                    type="button" 
                    onClick={() => setProductImage(null)}
                    className="absolute -top-2 -right-2 bg-slate-700 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                    aria-label="Remove image"
                >
                    <XCircleIcon className="w-6 h-6" />
                </button>
            </div>
        ) : (
            <label 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500 dark:text-slate-400">
                    <UploadIcon className="w-8 h-8 mb-2" />
                    <p className="mb-1 text-sm"><span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả</p>
                    <p className="text-xs">PNG, JPG, WEBP</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)} />
            </label>
        )}
       </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
            <label htmlFor="costPrice" className={commonLabelClass}>Giá vốn (VND)*</label>
            <input id="costPrice" type="number" value={costPrice} onChange={(e) => { setCostPrice(e.target.value); clearError('costPrice'); }} placeholder="VD: 150000" className={getInputClass(!!errors.costPrice)} disabled={isLoading} required />
            <FieldError message={errors.costPrice} />
        </div>
        <div>
            <label htmlFor="variableCost" className={commonLabelClass}>Chi phí biến đổi (VND)</label>
            <input id="variableCost" type="number" value={variableCost} onChange={(e) => { setVariableCost(e.target.value); clearError('variableCost'); }} placeholder="VD: 10000 (tùy chọn)" className={getInputClass(!!errors.variableCost)} disabled={isLoading} />
            <FieldError message={errors.variableCost} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
            <label htmlFor="manufactureDate" className={commonLabelClass}>Ngày sản xuất/nhập hàng</label>
            <input 
                id="manufactureDate" 
                type="date" 
                value={manufactureDate} 
                onChange={(e) => setManufactureDate(e.target.value)} 
                className={getInputClass(false)}
                disabled={isLoading} 
            />
        </div>
        <div>
            <label htmlFor="manufactureTime" className={commonLabelClass}>Giờ sản xuất/nhập hàng</label>
            <input 
                id="manufactureTime" 
                type="time" 
                value={manufactureTime} 
                onChange={(e) => setManufactureTime(e.target.value)} 
                className={getInputClass(false)}
                disabled={isLoading} 
            />
        </div>
      </div>

       <div className="pt-1">
            <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                <input type="checkbox" checked={useTieredPricing} onChange={(e) => setUseTieredPricing(e.target.checked)} className={checkboxInputClass} disabled={isLoading} />
                <span>Áp dụng giá theo bậc thang (Tiered Pricing)</span>
            </label>
        </div>

      {useTieredPricing ? (
        <div className="space-y-3 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-fade-in-fast">
            <label className={commonLabelClass}>Các bậc giá</label>
            {tiers.map((tier) => (
                <div key={tier.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <div>
                        <input type="number" value={tier.fromQuantity} onChange={(e) => handleTierChange(tier.id, 'fromQuantity', e.target.value)} placeholder="Số lượng từ" className={getInputClass(!!errors[`tier_fromQuantity_${tier.id}`])} disabled={isLoading} />
                        <FieldError message={errors[`tier_fromQuantity_${tier.id}`]} />
                    </div>
                    <div>
                        <input type="number" value={tier.price} onChange={(e) => handleTierChange(tier.id, 'price', e.target.value)} placeholder="Giá bán (VND)" className={getInputClass(!!errors[`tier_price_${tier.id}`])} disabled={isLoading} />
                         <FieldError message={errors[`tier_price_${tier.id}`]} />
                    </div>
                    <button type="button" onClick={() => removeTier(tier.id)} className="text-slate-500 dark:text-slate-400 hover:text-red-500 disabled:opacity-50 p-2" disabled={isLoading || tiers.length <= 1} aria-label="Remove tier">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            ))}
            <button type="button" onClick={addTier} disabled={isLoading} className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition-colors">+ Thêm bậc giá</button>
        </div>
      ) : (
        <div className="animate-fade-in-fast space-y-4">
            <div>
                <label className={commonLabelClass}>Hình thức lợi nhuận</label>
                <div className="flex space-x-4 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <label className={radioLabelClass}>
                        <input type="radio" name="profitType" value="margin" checked={profitType === 'margin'} onChange={() => setProfitType('margin')} className={radioInputClass} />
                        <span>Theo %</span>
                    </label>
                    <label className={radioLabelClass}>
                        <input type="radio" name="profitType" value="fixed" checked={profitType === 'fixed'} onChange={() => setProfitType('fixed')} className={radioInputClass} />
                        <span>Số tiền cố định</span>
                    </label>
                </div>
            </div>
            <div>
                <label htmlFor="profitValue" className={commonLabelClass}>
                    {profitType === 'margin' ? 'Lợi nhuận mong muốn (%)*' : 'Lợi nhuận mong muốn (VND)*'}
                </label>
                <input id="profitValue" type="number" value={profitValue} onChange={(e) => { setProfitValue(e.target.value); clearError('profitValue'); }} placeholder={profitType === 'margin' ? "VD: 40" : "VD: 80000"} className={getInputClass(!!errors.profitValue)} disabled={isLoading} required />
                <FieldError message={errors.profitValue} />
            </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass} disabled={isLoading}>Hủy</button>
        <button type="submit" className={primaryButtonClass} disabled={isLoading}>
            {isLoading ? <SpinnerIcon className="h-5 w-5" /> : 'Tính giá'}
        </button>
      </div>
    </form>
  );
};

const PromoPriceForm: React.FC<FormProps> = ({ onSubmit, onCancel, isLoading }) => {
    const [productName, setProductName] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');
    const [discountValue, setDiscountValue] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'bogo'>('percentage');
    const [errors, setErrors] = useState<FormErrors>({});

    const clearError = (fieldName: string) => {
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: FormErrors = {};
        if (!productName.trim()) newErrors.productName = 'Tên sản phẩm là bắt buộc.';

        if (!currentPrice.trim()) {
            newErrors.currentPrice = 'Giá bán hiện tại là bắt buộc.';
        } else if (isNaN(Number(currentPrice)) || Number(currentPrice) <= 0) {
            newErrors.currentPrice = 'Vui lòng nhập một số dương hợp lệ.';
        }
        
        if (discountType !== 'bogo') {
            if (!discountValue.trim()) {
                newErrors.discountValue = 'Giá trị khuyến mãi là bắt buộc.';
            } else if (isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
                newErrors.discountValue = 'Vui lòng nhập một số dương hợp lệ.';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      let prompt = `Hãy tính giá và phân tích chương trình khuyến mãi cho sản phẩm '${productName}' có giá bán hiện tại là ${currentPrice}, với hình thức khuyến mãi là `;
      switch (discountType) {
          case 'percentage':
              prompt += `giảm giá ${discountValue}%.`;
              break;
          case 'fixed':
              prompt += `giảm giá ${discountValue} VND.`;
              break;
          case 'bogo':
              prompt += `mua 1 tặng 1 (BOGO).`;
              break;
      }
      onSubmit(prompt);
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="promoProductName" className={commonLabelClass}>Tên sản phẩm</label>
          <input id="promoProductName" type="text" value={productName} onChange={(e) => { setProductName(e.target.value); clearError('productName'); }} placeholder="VD: Quần Jean rách gối" className={getInputClass(!!errors.productName)} disabled={isLoading} required />
          <FieldError message={errors.productName} />
        </div>
        <div>
            <label htmlFor="currentPrice" className={commonLabelClass}>Giá bán hiện tại (VND)</label>
            <input id="currentPrice" type="number" value={currentPrice} onChange={(e) => { setCurrentPrice(e.target.value); clearError('currentPrice'); }} placeholder="VD: 450000" className={getInputClass(!!errors.currentPrice)} disabled={isLoading} required />
            <FieldError message={errors.currentPrice} />
        </div>
        <div>
            <label className={commonLabelClass}>Hình thức khuyến mãi</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <button type="button" onClick={() => setDiscountType('percentage')} className={`py-1.5 rounded-md text-sm transition-colors ${discountType === 'percentage' ? 'bg-sky-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Giảm theo %</button>
                <button type="button" onClick={() => setDiscountType('fixed')} className={`py-1.5 rounded-md text-sm transition-colors ${discountType === 'fixed' ? 'bg-sky-600 text-white' : 'hover:bg-slate-600'}`}>Giảm tiền</button>
                <button type="button" onClick={() => setDiscountType('bogo')} className={`py-1.5 rounded-md text-sm transition-colors ${discountType === 'bogo' ? 'bg-sky-600 text-white' : 'hover:bg-slate-600'}`}>Mua 1 tặng 1</button>
            </div>
        </div>

        {discountType !== 'bogo' && (
            <div className="animate-fade-in-fast">
                <label htmlFor="discountValue" className={commonLabelClass}>
                    {discountType === 'percentage' ? 'Tỷ lệ giảm giá (%)' : 'Số tiền giảm giá (VND)'}
                </label>
                <input id="discountValue" type="number" value={discountValue} onChange={(e) => { setDiscountValue(e.target.value); clearError('discountValue'); }} placeholder={discountType === 'percentage' ? "VD: 20" : "VD: 50000"} className={getInputClass(!!errors.discountValue)} disabled={isLoading} required />
                <FieldError message={errors.discountValue} />
            </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button type="button" onClick={onCancel} className={secondaryButtonClass} disabled={isLoading}>Hủy</button>
          <button type="submit" className={primaryButtonClass} disabled={isLoading}>
            {isLoading ? <SpinnerIcon className="h-5 w-5" /> : 'Tính giá khuyến mãi'}
          </button>
        </div>
      </form>
    );
};

const GroupPriceForm: React.FC<FormProps> = ({ onSubmit, onCancel, isLoading }) => {
    const [products, setProducts] = useState('');
    const [targetFlatPrice, setTargetFlatPrice] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});

    const clearError = (fieldName: string) => {
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: FormErrors = {};
        if (!products.trim()) newErrors.products = 'Danh sách sản phẩm là bắt buộc.';
        
        if (!targetFlatPrice.trim()) {
            newErrors.targetFlatPrice = 'Giá đồng giá mục tiêu là bắt buộc.';
        } else if (isNaN(Number(targetFlatPrice)) || Number(targetFlatPrice) <= 0) {
            newErrors.targetFlatPrice = 'Vui lòng nhập một số dương hợp lệ.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!validate()) return;
        
        const prompt = `Tôi có nhóm sản phẩm sau (định dạng: Tên sản phẩm, Giá vốn):\n${products}\nHãy đề xuất phương án bán đồng giá ${targetFlatPrice} và phân tích lợi nhuận.`;
        onSubmit(prompt);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="products" className={commonLabelClass}>Danh sách sản phẩm và giá vốn</label>
                <textarea id="products" value={products} onChange={(e) => { setProducts(e.target.value); clearError('products'); }} rows={4} placeholder={"VD:\nÁo sơ mi, 180000\nQuần tây, 250000\nThắt lưng da, 120000"} className={`${getInputClass(!!errors.products)} min-h-[100px]`} disabled={isLoading} required />
                <FieldError message={errors.products} />
            </div>
            <div>
                <label htmlFor="targetFlatPrice" className={commonLabelClass}>Giá đồng giá mục tiêu (VND)</label>
                <input id="targetFlatPrice" type="number" value={targetFlatPrice} onChange={(e) => { setTargetFlatPrice(e.target.value); clearError('targetFlatPrice'); }} placeholder="VD: 199000" className={getInputClass(!!errors.targetFlatPrice)} disabled={isLoading} required />
                <FieldError message={errors.targetFlatPrice} />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={onCancel} className={secondaryButtonClass} disabled={isLoading}>Hủy</button>
                <button type="submit" className={primaryButtonClass} disabled={isLoading}>
                    {isLoading ? <SpinnerIcon className="h-5 w-5" /> : 'Tính toán'}
                </button>
            </div>
        </form>
    );
};


export const GuidedInputForm: React.FC<GuidedInputFormProps> = ({ task, onSubmit, onCancel, isLoading }) => {
    const renderForm = () => {
        switch (task) {
            case 'selling-price':
              return <SellingPriceForm onSubmit={onSubmit} onCancel={onCancel} isLoading={isLoading} />;
            case 'promo-price':
              return <PromoPriceForm onSubmit={onSubmit} onCancel={onCancel} isLoading={isLoading} />;
            case 'group-price':
                return <GroupPriceForm onSubmit={onSubmit} onCancel={onCancel} isLoading={isLoading} />;
            default:
              return null;
        }
    }
    return <div className="animate-fade-in">{renderForm()}</div>;
};

// Add a simple fade-in animation for better UX
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeInFast {
        from { opacity: 0; transform: scaleY(0.9); }
        to { opacity: 1; transform: scaleY(1); }
    }
    .animate-fade-in-fast {
        animation: fadeInFast 0.2s ease-out forwards;
        transform-origin: top;
    }
`;
document.head.appendChild(style);