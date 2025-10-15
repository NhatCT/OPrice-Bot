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

type FormErrors = { [key: string]: string | undefined };


const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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


const SellingPriceForm: React.FC<FormProps> = ({ onSubmit, onCancel, isLoading }) => {
  const [productName, setProductName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [variableCost, setVariableCost] = useState('');
  const [totalFixedCost, setTotalFixedCost] = useState('');
  const [salesVolume, setSalesVolume] = useState('');
  const [targetProfit, setTargetProfit] = useState('');
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
  
  const validateField = (name: string, value: string, requiredMessage: string, isPositiveNumber = true) => {
    if (!value.trim()) return requiredMessage;
    if (isPositiveNumber && (isNaN(Number(value)) || Number(value) <= 0)) {
        return 'Vui lòng nhập một số dương hợp lệ.';
    }
    return undefined;
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    newErrors.productName = validateField('productName', productName, 'Tên sản phẩm là bắt buộc.', false);
    newErrors.costPrice = validateField('costPrice', costPrice, 'Giá vốn là bắt buộc.');
    newErrors.totalFixedCost = validateField('totalFixedCost', totalFixedCost, 'Tổng chi phí cố định là bắt buộc.');
    newErrors.salesVolume = validateField('salesVolume', salesVolume, 'Doanh số kỳ vọng là bắt buộc.');
    newErrors.targetProfit = validateField('targetProfit', targetProfit, 'Lợi nhuận mục tiêu là bắt buộc.');

    if (variableCost.trim() && (isNaN(Number(variableCost)) || Number(variableCost) < 0)) {
      newErrors.variableCost = 'Vui lòng nhập một số hợp lệ (lớn hơn hoặc bằng 0).';
    }

    const validErrors = Object.entries(newErrors).reduce((acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
    }, {} as FormErrors);

    setErrors(validErrors);
    return Object.keys(validErrors).length === 0;
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
    
    let prompt = `Hãy tính và phân tích giá bán cho sản phẩm '${productName}' để đạt được lợi nhuận mục tiêu là ${targetProfit} VND/tháng. Các thông tin chi tiết: giá vốn ${costPrice} VND/sản phẩm, chi phí biến đổi ${variableCost || '0'} VND/sản phẩm, tổng chi phí cố định ${totalFixedCost} VND/tháng, và doanh số kỳ vọng là ${salesVolume} sản phẩm/tháng. Hãy phân tích chi tiết công thức tính, giá bán đề xuất, điểm hòa vốn và đưa ra lời khuyên.`;
    
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
            <label htmlFor="costPrice" className={commonLabelClass}>Giá vốn (VND/sp)</label>
            <input id="costPrice" type="number" value={costPrice} onChange={(e) => { setCostPrice(e.target.value); clearError('costPrice'); }} placeholder="VD: 150000" className={getInputClass(!!errors.costPrice)} disabled={isLoading} required />
            <FieldError message={errors.costPrice} />
        </div>
        <div>
            <label htmlFor="variableCost" className={commonLabelClass}>Chi phí biến đổi (VND/sp)</label>
            <input id="variableCost" type="number" value={variableCost} onChange={(e) => { setVariableCost(e.target.value); clearError('variableCost'); }} placeholder="VD: 10000" className={getInputClass(!!errors.variableCost)} disabled={isLoading} />
            <FieldError message={errors.variableCost} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
         <div>
            <label htmlFor="totalFixedCost" className={commonLabelClass}>Tổng chi phí cố định (VND/tháng)</label>
            <input id="totalFixedCost" type="number" value={totalFixedCost} onChange={(e) => { setTotalFixedCost(e.target.value); clearError('totalFixedCost'); }} placeholder="VD: 5000000" className={getInputClass(!!errors.totalFixedCost)} disabled={isLoading} required />
            <FieldError message={errors.totalFixedCost} />
        </div>
        <div>
            <label htmlFor="salesVolume" className={commonLabelClass}>Doanh số kỳ vọng (sp/tháng)</label>
            <input id="salesVolume" type="number" value={salesVolume} onChange={(e) => { setSalesVolume(e.target.value); clearError('salesVolume'); }} placeholder="VD: 200" className={getInputClass(!!errors.salesVolume)} disabled={isLoading} required />
            <FieldError message={errors.salesVolume} />
        </div>
      </div>

       <div>
        <label htmlFor="targetProfit" className={commonLabelClass}>Lợi nhuận mục tiêu (VND/tháng)</label>
        <input id="targetProfit" type="number" value={targetProfit} onChange={(e) => { setTargetProfit(e.target.value); clearError('targetProfit'); }} placeholder="VD: 20000000" className={getInputClass(!!errors.targetProfit)} disabled={isLoading} required />
        <FieldError message={errors.targetProfit} />
      </div>

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
    const [costPrice, setCostPrice] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');
    const [currentSalesVolume, setCurrentSalesVolume] = useState('');
    const [expectedSalesVolume, setExpectedSalesVolume] = useState('');
    const [promotionGoal, setPromotionGoal] = useState<'maximize_profit' | 'maximize_revenue'>('maximize_profit');
    const [errors, setErrors] = useState<FormErrors>({});

    const clearError = (fieldName: string) => {
        if (errors[fieldName]) {
            setErrors(prev => ({ ...prev, [fieldName]: undefined }));
        }
    };

    const validate = () => {
        const newErrors: FormErrors = {};
        if (!productName.trim()) newErrors.productName = 'Tên sản phẩm là bắt buộc.';
        if (!costPrice.trim() || isNaN(Number(costPrice)) || Number(costPrice) <= 0) newErrors.costPrice = 'Giá vốn phải là số dương hợp lệ.';
        if (!currentPrice.trim() || isNaN(Number(currentPrice)) || Number(currentPrice) <= 0) newErrors.currentPrice = 'Giá bán phải là số dương hợp lệ.';
        if (!currentSalesVolume.trim() || isNaN(Number(currentSalesVolume)) || Number(currentSalesVolume) <= 0) newErrors.currentSalesVolume = 'Doanh số phải là số dương hợp lệ.';
        if (!expectedSalesVolume.trim() || isNaN(Number(expectedSalesVolume)) || Number(expectedSalesVolume) <= 0) newErrors.expectedSalesVolume = 'Doanh số kỳ vọng phải là số dương hợp lệ.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).every(key => !newErrors[key]);
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const goalText = promotionGoal === 'maximize_profit' ? 'tối đa hóa lợi nhuận' : 'tối đa hóa doanh thu';
      let prompt = `Hãy tính giá khuyến mãi và phân tích hiệu quả cho sản phẩm '${productName}'. Thông tin: giá vốn ${costPrice} VND, giá bán hiện tại ${currentPrice} VND, doanh số hiện tại ${currentSalesVolume} sản phẩm/tháng. Mục tiêu của chương trình là ${goalText} với doanh số kỳ vọng tăng lên ${expectedSalesVolume} sản phẩm/tháng. Hãy đề xuất mức giảm giá tối ưu (theo % và/hoặc số tiền), so sánh lợi nhuận trước và sau khuyến mãi để đưa ra kết luận.`;

      onSubmit(prompt);
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="promoProductName" className={commonLabelClass}>Tên sản phẩm</label>
          <input id="promoProductName" type="text" value={productName} onChange={(e) => { setProductName(e.target.value); clearError('productName'); }} placeholder="VD: Quần Jean rách gối" className={getInputClass(!!errors.productName)} disabled={isLoading} required />
          <FieldError message={errors.productName} />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label htmlFor="costPrice" className={commonLabelClass}>Giá vốn (VND/sp)</label>
                <input id="costPrice" type="number" value={costPrice} onChange={(e) => { setCostPrice(e.target.value); clearError('costPrice'); }} placeholder="VD: 250000" className={getInputClass(!!errors.costPrice)} disabled={isLoading} required />
                <FieldError message={errors.costPrice} />
            </div>
            <div>
                <label htmlFor="currentPrice" className={commonLabelClass}>Giá bán hiện tại (VND/sp)</label>
                <input id="currentPrice" type="number" value={currentPrice} onChange={(e) => { setCurrentPrice(e.target.value); clearError('currentPrice'); }} placeholder="VD: 450000" className={getInputClass(!!errors.currentPrice)} disabled={isLoading} required />
                <FieldError message={errors.currentPrice} />
            </div>
        </div>
         <div className="grid grid-cols-2 gap-3">
            <div>
                <label htmlFor="currentSalesVolume" className={commonLabelClass}>Doanh số hiện tại (sp/tháng)</label>
                <input id="currentSalesVolume" type="number" value={currentSalesVolume} onChange={(e) => { setCurrentSalesVolume(e.target.value); clearError('currentSalesVolume'); }} placeholder="VD: 100" className={getInputClass(!!errors.currentSalesVolume)} disabled={isLoading} required />
                <FieldError message={errors.currentSalesVolume} />
            </div>
            <div>
                <label htmlFor="expectedSalesVolume" className={commonLabelClass}>Doanh số kỳ vọng (sp/tháng)</label>
                <input id="expectedSalesVolume" type="number" value={expectedSalesVolume} onChange={(e) => { setExpectedSalesVolume(e.target.value); clearError('expectedSalesVolume'); }} placeholder="VD: 150" className={getInputClass(!!errors.expectedSalesVolume)} disabled={isLoading} required />
                <FieldError message={errors.expectedSalesVolume} />
            </div>
        </div>
        <div>
            <label className={commonLabelClass}>Mục tiêu khuyến mãi</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <button type="button" onClick={() => setPromotionGoal('maximize_profit')} className={`py-1.5 rounded-md text-sm transition-colors ${promotionGoal === 'maximize_profit' ? 'bg-sky-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Tối đa hóa lợi nhuận</button>
                <button type="button" onClick={() => setPromotionGoal('maximize_revenue')} className={`py-1.5 rounded-md text-sm transition-colors ${promotionGoal === 'maximize_revenue' ? 'bg-sky-600 text-white' : 'hover:bg-slate-600'}`}>Tối đa hóa doanh thu</button>
            </div>
        </div>
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
    const [salesIncrease, setSalesIncrease] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});

    const clearError = (fieldName: string) => {
        if (errors[fieldName]) {
            setErrors(prev => ({ ...prev, [fieldName]: undefined }));
        }
    };

    const validate = () => {
        const newErrors: FormErrors = {};
        if (!products.trim()) newErrors.products = 'Danh sách sản phẩm là bắt buộc.';
        if (!targetFlatPrice.trim() || isNaN(Number(targetFlatPrice)) || Number(targetFlatPrice) <= 0) newErrors.targetFlatPrice = 'Giá đồng giá phải là số dương hợp lệ.';
        if (!salesIncrease.trim() || isNaN(Number(salesIncrease)) || Number(salesIncrease) <= 0) newErrors.salesIncrease = 'Tỷ lệ tăng doanh số phải là số dương hợp lệ.';

        setErrors(newErrors);
        return Object.keys(newErrors).every(key => !newErrors[key]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!validate()) return;
        
        const prompt = `Tôi có nhóm sản phẩm sau (định dạng: Tên sản phẩm, Giá vốn, Giá bán hiện tại, Doanh số/tháng):\n${products}\nTôi muốn chạy chương trình bán đồng giá tất cả sản phẩm này ở mức ${targetFlatPrice} VND. Tôi kỳ vọng doanh số của cả nhóm sẽ tăng ${salesIncrease}%. Hãy phân tích chi tiết về hiệu quả, so sánh lợi nhuận trước và sau khi áp dụng, và cho tôi lời khuyên có nên thực hiện chiến dịch này không.`;
        onSubmit(prompt);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="products" className={commonLabelClass}>Danh sách sản phẩm</label>
                <textarea id="products" value={products} onChange={(e) => { setProducts(e.target.value); clearError('products'); }} rows={4} placeholder={"VD:\nÁo sơ mi, 180000, 299000, 150\nQuần tây, 250000, 450000, 100\nThắt lưng da, 120000, 250000, 80"} className={`${getInputClass(!!errors.products)} min-h-[100px]`} disabled={isLoading} required />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Định dạng: Tên, Giá vốn, Giá bán, Doanh số/tháng. Mỗi sản phẩm một dòng.</p>
                <FieldError message={errors.products} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="targetFlatPrice" className={commonLabelClass}>Giá đồng giá mục tiêu (VND)</label>
                    <input id="targetFlatPrice" type="number" value={targetFlatPrice} onChange={(e) => { setTargetFlatPrice(e.target.value); clearError('targetFlatPrice'); }} placeholder="VD: 199000" className={getInputClass(!!errors.targetFlatPrice)} disabled={isLoading} required />
                    <FieldError message={errors.targetFlatPrice} />
                </div>
                <div>
                    <label htmlFor="salesIncrease" className={commonLabelClass}>Doanh số kỳ vọng tăng (%)</label>
                    <input id="salesIncrease" type="number" value={salesIncrease} onChange={(e) => { setSalesIncrease(e.target.value); clearError('salesIncrease'); }} placeholder="VD: 30" className={getInputClass(!!errors.salesIncrease)} disabled={isLoading} required />
                    <FieldError message={errors.salesIncrease} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={onCancel} className={secondaryButtonClass} disabled={isLoading}>Hủy</button>
                <button type="submit" className={primaryButtonClass} disabled={isLoading}>
                    {isLoading ? <SpinnerIcon className="h-5 w-5" /> : 'Phân tích'}
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