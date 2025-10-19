import React, { useState, useEffect } from 'react';
import type { Task } from '../types';

interface GuidedInputFormProps {
  task: Task;
  onSubmit: (prompt: string, params: Record<string, any>) => void;
  onCancel: () => void;
  isLoading: boolean;
  initialData?: Record<string, any>;
}

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


// --- TASK CONFIGURATION ---
const taskConfig = {
  'profit-analysis': {
    title: 'Phân tích Lợi nhuận & Lập kế hoạch Kinh doanh',
    generatePrompt: (data: Record<string, any>) => {
        const {
            calculationTarget, period, productName, cost, variableCost, fixedCost, 
            sellingPrice, salesVolume, targetProfit, useMarket
        } = data;

        const periodText = period === 'monthly' ? 'THÁNG' : 'NĂM';
        let targetText = '';
        switch (calculationTarget) {
            case 'sellingPrice': targetText = 'GIÁ BÁN CẦN THIẾT cho mỗi sản phẩm'; break;
            case 'salesVolume': targetText = 'DOANH SỐ CẦN THIẾT (số lượng sản phẩm cần bán)'; break;
            case 'profit': targetText = 'LỢI NHUẬN TIỀM NĂNG'; break;
        }

        let prompt = `Hãy đóng vai trò là một chuyên gia kinh doanh và thực hiện phân tích lợi nhuận chi tiết cho sản phẩm "${productName}".\n\n`;
        prompt += `**BỐI CẢNH KẾ HOẠCH:**\n- Kỳ kế hoạch: ${periodText}\n- Mục tiêu tính toán: **${targetText}**\n\n`;
        prompt += `**DỮ LIỆU ĐẦU VÀO:**\n`;
        prompt += `- Giá vốn mỗi sản phẩm: ${cost} VND\n`;
        prompt += `- Chi phí biến đổi mỗi sản phẩm: ${variableCost} VND\n`;
        prompt += `- Tổng chi phí cố định cho kỳ kế hoạch: ${fixedCost} VND\n`;

        if (calculationTarget !== 'sellingPrice') prompt += `- Giá bán dự kiến mỗi sản phẩm: ${sellingPrice} VND\n`;
        if (calculationTarget !== 'salesVolume') prompt += `- Doanh số dự kiến trong kỳ: ${salesVolume} sản phẩm\n`;
        if (calculationTarget !== 'profit') prompt += `- Lợi nhuận mục tiêu trong kỳ: ${targetProfit} VND\n`;
        
        if (useMarket) {
            prompt += `\n**YÊU CẦU ĐẶC BIỆT:**\nHãy **tham khảo giá thị trường** của sản phẩm "${productName}" để so sánh và đưa ra những nhận định sâu sắc hơn trong phần phân tích của bạn.\n\n`;
        }
        
        prompt += `**YÊU CẦU PHÂN TÍCH:**\nDựa vào các dữ liệu trên, hãy cung cấp một bản phân tích chuyên nghiệp bao gồm:\n1.  **Công thức tính toán** rõ ràng từng bước.\n2.  **Kết quả tính toán** cho mục tiêu đã đề ra.\n3.  **Phân tích Điểm hòa vốn** (cả về số lượng và doanh thu).\n4.  **Đánh giá và Lời khuyên chiến lược** dựa trên kết quả.`;

        return prompt;
    },
  },
  'promo-price': {
    title: 'Phân tích Hiệu quả Khuyến mãi',
     generatePrompt: (data: Record<string, any>) => {
      let prompt = `Hãy phân tích hiệu quả cho chương trình khuyến mãi của sản phẩm "${data.productName}" với các thông số sau:\n\n**KỊCH BẢN HIỆN TẠI:**\n- Giá bán gốc: ${data.originalPrice} VND\n- Giá vốn: ${data.cost} VND\n- Doanh số trung bình/tháng: ${data.currentSales} sản phẩm\n\n**KỊCH BẢN KHUYẾN MÃI:**\n- Tỉ lệ giảm giá: ${data.discount}% (Giá bán mới sẽ là ${Number(data.originalPrice) * (1 - Number(data.discount)/100)} VND)\n- Doanh số kỳ vọng/tháng: ${data.expectedSales} sản phẩm\n- Mục tiêu chiến dịch: **${data.promoGoal === 'profit' ? 'Tối đa hóa Lợi nhuận' : 'Tối đa hóa Doanh thu'}**\n\n`;
      if (data.useMarket) {
        prompt += `**YÊU CẦU ĐẶC BIỆT:**\nHãy **tham khảo giá thị trường** của sản phẩm "${data.productName}" để xem mức giá khuyến mãi có cạnh tranh không.\n\n`;
      }
      prompt += `**YÊU CẦU PHÂN TÍCH:**\nHãy so sánh chi tiết 2 kịch bản (Lợi nhuận, Doanh thu, Biên lợi nhuận) và đưa ra kết luận rõ ràng rằng có nên thực hiện chương trình khuyến mãi này hay không dựa trên mục tiêu đã chọn.`;
      return prompt;
    }
  },
  'group-price': {
    title: 'Phân tích Chiến dịch Đồng giá',
    generatePrompt: (data: Record<string, any>) => {
      let prompt = `Tôi có một nhóm sản phẩm và muốn phân tích hiệu quả của việc áp dụng chính sách bán đồng giá. Dưới đây là dữ liệu:\n\n**DANH SÁCH SẢN PHẨM:**\n(Tên sản phẩm | Giá vốn | Giá bán hiện tại | Doanh số/tháng)\n${data.products}\n\n`;
      prompt += `**KỊCH BẢN ĐỒNG GIÁ:**\n- Mức giá đồng giá mục tiêu: ${data.flatPrice} VND\n- Doanh số kỳ vọng của mỗi sản phẩm sẽ tăng: ${data.salesIncrease}% so với hiện tại.\n\n`;
       if (data.useMarket) {
        const productNames = data.products.split('\n').map((line: string) => line.split('|')[0]?.trim()).filter(Boolean);
        prompt += `**YÊU CẦU ĐẶC BIỆT:**\nHãy **tham khảo giá thị trường** của các sản phẩm sau: ${productNames.join(', ')} để đánh giá tính cạnh tranh của mức giá đồng giá.\n\n`;
      }
      prompt += `**YÊU CẦU PHÂN TÍCH:**\nHãy phân tích và so sánh tổng lợi nhuận của toàn bộ nhóm sản phẩm giữa kịch bản hiện tại và kịch bản đồng giá. Liệt kê sản phẩm nào sẽ có lợi nhuận tăng/giảm. Cuối cùng, đưa ra kết luận và lời khuyên có nên thực hiện chiến dịch này không.`;
      return prompt;
    },
  },
};

// --- FORM COMPONENTS ---

type CalculationTarget = 'sellingPrice' | 'salesVolume' | 'profit';
type Period = 'monthly' | 'annually';

const ProfitAnalysisForm: React.FC<any> = ({ onSubmit, onCancel, isLoading, initialData }) => {
    const [formData, setFormData] = useState({
        productName: 'Áo Thun Thể Thao V64', cost: '80000', variableCost: '15000', fixedCost: '20000000', sellingPrice: '', salesVolume: '500', targetProfit: '50000000'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [calculationTarget, setCalculationTarget] = useState<CalculationTarget>('sellingPrice');
    const [period, setPeriod] = useState<Period>('monthly');
    const [useMarket, setUseMarket] = useState(true);

    useEffect(() => {
        if (initialData) {
            const { calculationTarget, period, useMarket, ...initialFormData } = initialData;
            setFormData(initialFormData);
            if (calculationTarget) setCalculationTarget(calculationTarget);
            if (period) setPeriod(period);
            if (typeof useMarket === 'boolean') setUseMarket(useMarket);
        }
    }, [initialData]);

    useEffect(() => {
        const newFormData = { ...formData };
        if (calculationTarget === 'sellingPrice') newFormData.sellingPrice = '';
        if (calculationTarget === 'salesVolume') newFormData.salesVolume = '';
        if (calculationTarget === 'profit') newFormData.targetProfit = '';
        setFormData(newFormData);
        setErrors({});
    }, [calculationTarget]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const isPositive = true;
        const isNotNegative = false;

        newErrors.productName = formData.productName.trim() ? '' : 'Tên sản phẩm là bắt buộc.';
        newErrors.cost = validateNumberField(formData.cost, 'Giá vốn', isPositive);
        newErrors.variableCost = validateNumberField(formData.variableCost, 'Chi phí biến đổi', isNotNegative);
        newErrors.fixedCost = validateNumberField(formData.fixedCost, 'Chi phí cố định', isNotNegative);

        if (calculationTarget !== 'sellingPrice') newErrors.sellingPrice = validateNumberField(formData.sellingPrice, 'Giá bán', isPositive);
        if (calculationTarget !== 'salesVolume') newErrors.salesVolume = validateNumberField(formData.salesVolume, 'Doanh số', isPositive);
        if (calculationTarget !== 'profit') newErrors.targetProfit = validateNumberField(formData.targetProfit, 'Lợi nhuận', isNotNegative);
        
        setErrors(newErrors);
        return Object.values(newErrors).every(err => err === '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const fullParams = { ...formData, calculationTarget, period, useMarket };
            const prompt = taskConfig['profit-analysis'].generatePrompt(fullParams);
            onSubmit(prompt, fullParams);
        }
    };
    
    const fields = [
        { name: 'productName', label: 'Tên sản phẩm', type: 'text', placeholder: 'VD: Áo Thun Cao Cấp V64' },
        { name: 'cost', label: 'Giá vốn / đơn vị (VND)', type: 'number', placeholder: '80000' },
        { name: 'variableCost', label: 'Chi phí biến đổi / đơn vị (VND)', type: 'number', placeholder: '15000' },
        { name: 'fixedCost', label: `Tổng chi phí cố định / ${period === 'monthly' ? 'Tháng' : 'Năm'} (VND)`, type: 'number', placeholder: '20000000' },
        { name: 'sellingPrice', label: 'Giá bán / đơn vị (VND)', type: 'number', placeholder: '250000' },
        { name: 'salesVolume', label: `Doanh số / ${period === 'monthly' ? 'Tháng' : 'Năm'} (sản phẩm)`, type: 'number', placeholder: '500' },
        { name: 'targetProfit', label: `Lợi nhuận mục tiêu / ${period === 'monthly' ? 'Tháng' : 'Năm'} (VND)`, type: 'number', placeholder: '50000000' },
    ];
    
    const commonInputClass = "w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600 disabled:opacity-60 disabled:bg-slate-200 dark:disabled:bg-slate-600/50";
    
    return (
      <div className="w-full max-w-lg mx-auto">
        <h3 className="text-lg font-semibold text-center mb-1 text-slate-800 dark:text-slate-100">{initialData ? 'Chỉnh sửa Phân tích Lợi nhuận' : taskConfig['profit-analysis'].title}</h3>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">Nhập các thông tin bạn đã có, chatbot sẽ tính toán yếu tố còn lại.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mục tiêu cần tính</label>
                    <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-lg">
                        {(['sellingPrice', 'salesVolume', 'profit'] as CalculationTarget[]).map(target => (
                            <button type="button" key={target} onClick={() => setCalculationTarget(target)} className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors duration-200 ${calculationTarget === target ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-800/40'}`}>
                                {target === 'sellingPrice' ? 'Giá Bán' : target === 'salesVolume' ? 'Doanh Số' : 'Lợi Nhuận'}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Kỳ kế hoạch</label>
                    <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-lg">
                        {(['monthly', 'annually'] as Period[]).map(p => (
                            <button type="button" key={p} onClick={() => setPeriod(p)} className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors duration-200 ${period === p ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-800/40'}`}>
                                {p === 'monthly' ? 'Theo Tháng' : 'Theo Năm'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            {fields.map(field => (
              <div key={field.name} className={field.name === 'productName' ? 'md:col-span-2' : ''}>
                <label htmlFor={field.name} className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  value={formData[field.name as keyof typeof formData]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  disabled={isLoading || calculationTarget === field.name}
                  className={`${commonInputClass} ${errors[field.name] ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                />
                 {errors[field.name] && <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>}
              </div>
            ))}
            </div>

             <div className="flex items-center pt-2">
                <input id="useMarket" name="useMarket" type="checkbox" checked={useMarket} onChange={(e) => setUseMarket(e.target.checked)} disabled={isLoading} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                <label htmlFor="useMarket" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">Tham khảo giá thị trường</label>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors duration-200 disabled:opacity-50">Hủy</button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                {isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
              </button>
            </div>
        </form>
      </div>
    );
};

const PromoPriceForm: React.FC<any> = ({ onSubmit, onCancel, isLoading, initialData }) => {
    const [formData, setFormData] = useState({ productName: 'Áo Khoác Dù V64', cost: '150000', originalPrice: '350000', currentSales: '200', discount: '20', expectedSales: '350', promoGoal: 'profit' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [useMarket, setUseMarket] = useState(true);

    useEffect(() => {
        if (initialData) {
            const { useMarket, ...initialFormData } = initialData;
            setFormData(initialFormData);
            if (typeof useMarket === 'boolean') setUseMarket(useMarket);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const isPositive = true;
        newErrors.productName = formData.productName.trim() ? '' : 'Tên sản phẩm là bắt buộc.';
        newErrors.cost = validateNumberField(formData.cost, 'Giá vốn', isPositive);
        newErrors.originalPrice = validateNumberField(formData.originalPrice, 'Giá bán gốc', isPositive);
        newErrors.currentSales = validateNumberField(formData.currentSales, 'Doanh số hiện tại', isPositive);
        newErrors.discount = validateNumberField(formData.discount, 'Tỉ lệ giảm giá', isPositive);
        newErrors.expectedSales = validateNumberField(formData.expectedSales, 'Doanh số kỳ vọng', isPositive);
        setErrors(newErrors);
        return Object.values(newErrors).every(err => err === '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const fullParams = { ...formData, useMarket };
            const prompt = taskConfig['promo-price'].generatePrompt(fullParams);
            onSubmit(prompt, fullParams);
        }
    };
    
    const fields = [
      { name: 'productName', label: 'Tên sản phẩm', type: 'text', placeholder: 'VD: Áo Thun Cao Cấp V64' },
      { name: 'cost', label: 'Giá vốn / đơn vị (VND)', type: 'number', placeholder: '80000' },
      { name: 'originalPrice', label: 'Giá bán gốc (VND)', type: 'number', placeholder: '150000' },
      { name: 'currentSales', label: 'Doanh số/tháng hiện tại', type: 'number', placeholder: '200' },
      { name: 'discount', label: 'Tỉ lệ giảm giá (%)', type: 'number', placeholder: '20' },
      { name: 'expectedSales', label: 'Doanh số kỳ vọng/tháng', type: 'number', placeholder: '350' },
    ];
    const commonInputClass = "w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";

    return (
        <div className="w-full max-w-lg mx-auto">
            <h3 className="text-lg font-semibold text-center mb-4 text-slate-800 dark:text-slate-100">{initialData ? 'Chỉnh sửa Phân tích Khuyến mãi' : taskConfig['promo-price'].title}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                    {fields.map(field => (
                        <div key={field.name} className={field.name === 'productName' ? 'md:col-span-2' : ''}>
                             <label htmlFor={field.name} className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{field.label}</label>
                             <input id={field.name} name={field.name} type={field.type} value={formData[field.name as keyof typeof formData]} onChange={handleChange} placeholder={field.placeholder} disabled={isLoading} className={`${commonInputClass} ${errors[field.name] ? 'ring-2 ring-red-500 border-red-500' : ''}`}/>
                             {errors[field.name] && <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>}
                        </div>
                    ))}
                 </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mục tiêu chiến dịch</label>
                    <select name="promoGoal" value={formData.promoGoal} onChange={handleChange} className={commonInputClass}>
                        <option value="profit">Tối đa hóa Lợi nhuận</option>
                        <option value="revenue">Tối đa hóa Doanh thu</option>
                    </select>
                </div>
                <div className="flex items-center pt-2">
                    <input id="useMarket" name="useMarket" type="checkbox" checked={useMarket} onChange={(e) => setUseMarket(e.target.checked)} disabled={isLoading} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                    <label htmlFor="useMarket" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">Tham khảo giá thị trường</label>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors duration-200 disabled:opacity-50">Hủy</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors duration-200 disabled:bg-slate-400 dark:disabled:bg-slate-600">
                        {isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const GroupPriceForm: React.FC<any> = ({ onSubmit, onCancel, isLoading, initialData }) => {
    const [formData, setFormData] = useState({ products: 'Áo Thun V64 | 80000 | 150000 | 200\nQuần Short Kaki | 120000 | 250000 | 150\nNón V64 | 50000 | 120000 | 300', flatPrice: '99000', salesIncrease: '30' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [useMarket, setUseMarket] = useState(true);

    useEffect(() => {
        if (initialData) {
            const { useMarket, ...initialFormData } = initialData;
            setFormData(initialFormData);
            if (typeof useMarket === 'boolean') setUseMarket(useMarket);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        newErrors.products = formData.products.trim() ? '' : 'Danh sách sản phẩm là bắt buộc.';
        newErrors.flatPrice = validateNumberField(formData.flatPrice, 'Mức giá đồng giá', true);
        newErrors.salesIncrease = validateNumberField(formData.salesIncrease, 'Doanh số kỳ vọng tăng', false);
        setErrors(newErrors);
        return Object.values(newErrors).every(err => err === '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const fullParams = { ...formData, useMarket };
            const prompt = taskConfig['group-price'].generatePrompt(fullParams);
            onSubmit(prompt, fullParams);
        }
    };
    
    const commonInputClass = "w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";

    return (
        <div className="w-full max-w-lg mx-auto">
            <h3 className="text-lg font-semibold text-center mb-4 text-slate-800 dark:text-slate-100">{initialData ? 'Chỉnh sửa Phân tích Đồng giá' : taskConfig['group-price'].title}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="products" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Danh sách sản phẩm</label>
                    <textarea id="products" name="products" value={formData.products} onChange={handleChange} placeholder="Định dạng: Tên sản phẩm | Giá vốn | Giá bán | Doanh số/tháng&#10;VD: Áo Thun | 80000 | 150000 | 200" disabled={isLoading} rows={4} className={`${commonInputClass} ${errors.products ? 'ring-2 ring-red-500 border-red-500' : ''}`} />
                    {errors.products && <p className="text-xs text-red-500 mt-1">{errors.products}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label htmlFor="flatPrice" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giá đồng giá mục tiêu (VND)</label>
                         <input id="flatPrice" name="flatPrice" type="number" value={formData.flatPrice} onChange={handleChange} placeholder="99000" disabled={isLoading} className={`${commonInputClass} ${errors.flatPrice ? 'ring-2 ring-red-500 border-red-500' : ''}`} />
                         {errors.flatPrice && <p className="text-xs text-red-500 mt-1">{errors.flatPrice}</p>}
                    </div>
                     <div>
                         <label htmlFor="salesIncrease" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Doanh số kỳ vọng tăng (%)</label>
                         <input id="salesIncrease" name="salesIncrease" type="number" value={formData.salesIncrease} onChange={handleChange} placeholder="30" disabled={isLoading} className={`${commonInputClass} ${errors.salesIncrease ? 'ring-2 ring-red-500 border-red-500' : ''}`} />
                         {errors.salesIncrease && <p className="text-xs text-red-500 mt-1">{errors.salesIncrease}</p>}
                    </div>
                </div>
                 <div className="flex items-center pt-2">
                    <input id="useMarket" name="useMarket" type="checkbox" checked={useMarket} onChange={(e) => setUseMarket(e.target.checked)} disabled={isLoading} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                    <label htmlFor="useMarket" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">Tham khảo giá thị trường</label>
                </div>
                 <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors duration-200 disabled:opacity-50">Hủy</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors duration-200 disabled:bg-slate-400 dark:disabled:bg-slate-600">
                        {isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                    </button>
                </div>
            </form>
        </div>
    );
};


export const GuidedInputForm: React.FC<GuidedInputFormProps> = ({ task, onSubmit, onCancel, isLoading, initialData }) => {
  switch (task) {
    case 'profit-analysis':
      return <ProfitAnalysisForm onSubmit={onSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} />;
    case 'promo-price':
      return <PromoPriceForm onSubmit={onSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} />;
    case 'group-price':
      return <GroupPriceForm onSubmit={onSubmit} onCancel={onCancel} isLoading={isLoading} initialData={initialData} />;
    default:
      return null;
  }
};