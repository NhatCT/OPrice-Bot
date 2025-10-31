import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { TagIcon } from './icons/TagIcon';

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

const jsonInstruction = `

**YÊU CẦU ĐỊNH DẠNG ĐẦU RA (CỰC KỲ QUAN TRỌNG):**
Toàn bộ phản hồi của bạn **BẮT BUỘC** phải là một khối mã JSON duy nhất, hợp lệ (sử dụng \`\`\`json). Không được có bất kỳ văn bản nào bên ngoài khối mã này. JSON phải có cấu trúc như sau, bao gồm cả cấu trúc chi tiết cho các biểu đồ:
{
  "analysis": "...",
  "charts": [
    {
      "type": "bar",
      "title": "Tiêu đề của biểu đồ",
      "data": [
        { "name": "Tên cột 1", "value": 12345 },
        { "name": "Tên cột 2", "value": 67890 }
      ]
    }
  ]
}

**QUY TẮC CHO TRƯỜỜNG "charts":**
1.  "charts" **PHẢI** là một mảng (array) các đối tượng biểu đồ.
2.  Mỗi đối tượng biểu đồ **PHẢI** có các trường: "type", "title", và "data".
3.  Trường "data" bên trong mỗi biểu đồ **BẮT BUỘC PHẢI** là một mảng (array) các đối tượng. Mỗi đối tượng trong mảng "data" phải có dạng \`{ "name": "string", "value": number }\`.

**QUY TẮC CHO TRƯỜNG "analysis" (TUYỆT ĐỐI PHẢI TUÂN THỦ):**
1.  Giá trị của trường "analysis" **PHẢI** là một chuỗi (string) JSON hợp lệ.
2.  Tất cả các ký tự xuống dòng (newlines) bên trong nội dung phân tích **BẮT BUỘC** phải được thay thế bằng chuỗi ký tự \`\\n\`.
3.  Tất cả các dấu nháy kép (") bên trong nội dung phân tích **BẮT BUỘC** phải được escape bằng cách thêm dấu \\ đằng trước (ví dụ: \`\\"\`).

**VÍ DỤ VỀ GIÁ TRỊ "analysis" HỢP LỆ:**
"analysis": "Đây là dòng đầu tiên của phân tích.\\nĐây là dòng thứ hai, với một trích dẫn: \\"tuyệt vời\\".\\n- Gạch đầu dòng 1\\n- Gạch đầu dòng 2"
`;


// --- TASK CONFIGURATION ---
const taskConfig = {
  'profit-analysis': {
    title: 'Phân tích Lợi nhuận & Lập kế hoạch Kinh doanh',
    subtitle: 'Nhập các thông tin bạn đã có, chatbot sẽ tính toán yếu tố còn lại.',
    gradient: 'from-blue-500 to-sky-500',
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
        
        prompt += jsonInstruction;

        return prompt;
    },
  },
  'promo-price': {
    title: 'Phân tích Hiệu quả Khuyến mãi',
    subtitle: 'So sánh kịch bản trước và sau khuyến mãi để đưa ra quyết định tối ưu.',
    gradient: 'from-green-500 to-emerald-500',
     generatePrompt: (data: Record<string, any>) => {
      let prompt = `Hãy phân tích hiệu quả cho chương trình khuyến mãi của sản phẩm "${data.productName}" với các thông số sau:\n\n**KỊCH BẢN HIỆN TẠI:**\n- Giá bán gốc: ${data.originalPrice} VND\n- Giá vốn: ${data.cost} VND\n- Doanh số trung bình/tháng: ${data.currentSales} sản phẩm\n\n**KỊCH BẢN KHUYẾN MÃI:**\n- Tỉ lệ giảm giá: ${data.discount}% (Giá bán mới sẽ là ${Number(data.originalPrice) * (1 - Number(data.discount)/100)} VND)\n- Doanh số kỳ vọng/tháng: ${data.expectedSales} sản phẩm\n- Mục tiêu chiến dịch: **${data.promoGoal === 'profit' ? 'Tối đa hóa Lợi nhuận' : 'Tối đa hóa Doanh thu'}**\n\n`;
      if (data.useMarket) {
        prompt += `**YÊU CẦU ĐẶC BIỆT:**\nHãy **tham khảo giá thị trường** của sản phẩm "${data.productName}" để xem mức giá khuyến mãi có cạnh tranh không.\n\n`;
      }
      prompt += `**YÊU CẦU PHÂN TÍCH:**\nHãy so sánh chi tiết 2 kịch bản (Lợi nhuận, Doanh thu, Biên lợi nhuận) và đưa ra kết luận rõ ràng rằng có nên thực hiện chương trình khuyến mãi này hay không dựa trên mục tiêu đã chọn.`;
      
      prompt += jsonInstruction;
      return prompt;
    }
  },
  'group-price': {
    title: 'Phân tích Chiến dịch Đồng giá',
    subtitle: 'Đánh giá hiệu quả của việc áp dụng một mức giá chung cho nhiều sản phẩm.',
    gradient: 'from-purple-500 to-violet-500',
    generatePrompt: (data: Record<string, any>) => {
      let prompt = `Tôi có một nhóm sản phẩm và muốn phân tích hiệu quả của việc áp dụng chính sách bán đồng giá. Dưới đây là dữ liệu:\n\n**DANH SÁCH SẢN PHẨM:**\n(Tên sản phẩm | Giá vốn | Giá bán hiện tại | Doanh số/tháng)\n${data.products}\n\n`;
      prompt += `**KỊCH BẢN ĐỒNG GIÁ:**\n- Mức giá đồng giá mục tiêu: ${data.flatPrice} VND\n- Doanh số kỳ vọng của mỗi sản phẩm sẽ tăng: ${data.salesIncrease}% so với hiện tại.\n\n`;
       if (data.useMarket) {
        const productNames = data.products.split('\n').map((line: string) => line.split('|')[0]?.trim()).filter(Boolean);
        prompt += `**YÊU CẦU ĐẶC BIỆT:**\nHãy **tham khảo giá thị trường** của các sản phẩm sau: ${productNames.join(', ')} để đánh giá tính cạnh tranh của mức giá đồng giá.\n\n`;
      }
      prompt += `**YÊU CẦU PHÂN TÍCH:**\nHãy phân tích và so sánh tổng lợi nhuận của toàn bộ nhóm sản phẩm giữa kịch bản hiện tại và kịch bản đồng giá. Liệt kê sản phẩm nào sẽ có lợi nhuận tăng/giảm. Cuối cùng, đưa ra kết luận và lời khuyên có nên thực hiện chiến dịch này không.`;
      
      prompt += jsonInstruction;
      return prompt;
    },
  },
};

// --- FORM COMPONENTS ---

type CalculationTarget = 'sellingPrice' | 'salesVolume' | 'profit';
type Period = 'monthly' | 'annually';

const FormSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="p-4 bg-slate-100 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
            {icon}
            <h4 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h4>
        </div>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

const ProfitAnalysisForm: React.FC<any> = ({ onSubmit, onCancel, isLoading, initialData }) => {
    const [formData, setFormData] = useState({
        productName: 'Áo Thun Thể Thao V64', cost: '80000', variableCost: '15000', fixedCost: '20000000', sellingPrice: '', salesVolume: '500', targetProfit: '50000000'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [calculationTarget, setCalculationTarget] = useState<CalculationTarget>('sellingPrice');
    const [period, setPeriod] = useState<Period>('monthly');
    const [useMarket, setUseMarket] = useState(true);
    const config = taskConfig['profit-analysis'];

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
            const prompt = config.generatePrompt(fullParams);
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
    
    const commonInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600 disabled:opacity-60 disabled:bg-slate-200 dark:disabled:bg-slate-600/50";
    
    return (
      <div className="w-full max-w-2xl mx-auto">
        <h3 className={`text-xl font-bold text-center mb-1 bg-clip-text text-transparent bg-gradient-to-r ${config.gradient}`}>{initialData ? 'Chỉnh sửa Phân tích' : config.title}</h3>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">{config.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
            <FormSection title="1. Thiết lập Kế hoạch" icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-500"><path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5h-1.5A13.5 13.5 0 0 1 2 3.5Z" clipRule="evenodd" /></svg>}>
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
            </FormSection>

            <FormSection title="2. Nhập Dữ liệu" icon={<CalculatorIcon className="w-5 h-5 text-slate-500" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                {fields.map(field => {
                  const isTarget = calculationTarget === field.name;
                  return (
                      <div key={field.name} className={field.name === 'productName' ? 'md:col-span-2' : ''}>
                        <label htmlFor={field.name} className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                          {field.label}
                        </label>
                        <input
                          id={field.name}
                          name={field.name}
                          type={field.type}
                          min={field.type === 'number' ? '0' : undefined}
                          value={formData[field.name as keyof typeof formData]}
                          onChange={handleChange}
                          placeholder={isTarget ? "AI sẽ tính toán..." : field.placeholder}
                          disabled={isLoading || isTarget}
                          className={`${commonInputClass} ${errors[field.name] ? 'ring-2 ring-red-500 border-red-500' : ''} ${isTarget ? 'ai-calculation-field animate-field-glow' : ''}`}
                        />
                         {errors[field.name] && <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>}
                      </div>
                  )
                })}
                </div>
                 <div className="flex items-center pt-2">
                    <input id="useMarket" name="useMarket" type="checkbox" checked={useMarket} onChange={(e) => setUseMarket(e.target.checked)} disabled={isLoading} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                    <label htmlFor="useMarket" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">Tham khảo giá thị trường</label>
                </div>
            </FormSection>

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
    const [newPrice, setNewPrice] = useState<number | null>(null);
    const config = taskConfig['promo-price'];

    useEffect(() => {
        if (initialData) {
            const { useMarket, ...initialFormData } = initialData;
            setFormData(initialFormData);
            if (typeof useMarket === 'boolean') setUseMarket(useMarket);
        }
    }, [initialData]);

    useEffect(() => {
        const originalPrice = parseFloat(formData.originalPrice);
        const discount = parseFloat(formData.discount);
        if (!isNaN(originalPrice) && !isNaN(discount) && discount >= 0 && discount <= 100) {
            setNewPrice(originalPrice * (1 - discount / 100));
        } else {
            setNewPrice(null);
        }
    }, [formData.originalPrice, formData.discount]);

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
        const discountError = validateNumberField(formData.discount, 'Tỉ lệ giảm giá', true);
        if (discountError) {
            newErrors.discount = discountError;
        } else if (Number(formData.discount) > 100) {
            newErrors.discount = 'Giảm giá không thể lớn hơn 100%.';
        }
        newErrors.expectedSales = validateNumberField(formData.expectedSales, 'Doanh số kỳ vọng', isPositive);
        setErrors(newErrors);
        return Object.values(newErrors).every(err => err === '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const fullParams = { ...formData, useMarket };
            const prompt = config.generatePrompt(fullParams);
            onSubmit(prompt, fullParams);
        }
    };
    
    const commonInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h3 className={`text-xl font-bold text-center mb-1 bg-clip-text text-transparent bg-gradient-to-r ${config.gradient}`}>{initialData ? 'Chỉnh sửa Phân tích' : config.title}</h3>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">{config.subtitle}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <FormSection title="Kịch bản Hiện tại" icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-500"><path d="M10 3a.75.75 0 0 1 .75.75v1.5h4.5a.75.75 0 0 1 0 1.5h-4.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-1.5A.75.75 0 0 1 10 3ZM5.25 7.5A.75.75 0 0 1 6 8.25v1.5h8.25a.75.75 0 0 1 0 1.5H6v1.5a.75.75 0 0 1-1.5 0v-1.5H3.75a.75.75 0 0 1 0-1.5h.75v-1.5A.75.75 0 0 1 5.25 7.5Z" /></svg>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                         <div>
                             <label htmlFor="productName" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tên sản phẩm</label>
                             <input id="productName" name="productName" type="text" value={formData.productName} onChange={handleChange} placeholder="VD: Áo Khoác Dù V64" disabled={isLoading} className={`${commonInputClass} ${errors.productName ? 'ring-2 ring-red-500 border-red-500' : ''}`}/>
                             {errors.productName && <p className="text-xs text-red-500 mt-1">{errors.productName}</p>}
                        </div>
                        <div>
                             <label htmlFor="cost" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giá vốn / đơn vị (VND)</label>
                             <input id="cost" name="cost" type="number" min="0" value={formData.cost} onChange={handleChange} placeholder="150000" disabled={isLoading} className={`${commonInputClass} ${errors.cost ? 'ring-2 ring-red-500 border-red-500' : ''}`}/>
                             {errors.cost && <p className="text-xs text-red-500 mt-1">{errors.cost}</p>}
                        </div>
                        <div>
                             <label htmlFor="originalPrice" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giá bán gốc (VND)</label>
                             <input id="originalPrice" name="originalPrice" type="number" min="0" value={formData.originalPrice} onChange={handleChange} placeholder="350000" disabled={isLoading} className={`${commonInputClass} ${errors.originalPrice ? 'ring-2 ring-red-500 border-red-500' : ''}`}/>
                             {errors.originalPrice && <p className="text-xs text-red-500 mt-1">{errors.originalPrice}</p>}
                        </div>
                         <div>
                             <label htmlFor="currentSales" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Doanh số/tháng hiện tại</label>
                             <input id="currentSales" name="currentSales" type="number" min="0" value={formData.currentSales} onChange={handleChange} placeholder="200" disabled={isLoading} className={`${commonInputClass} ${errors.currentSales ? 'ring-2 ring-red-500 border-red-500' : ''}`}/>
                             {errors.currentSales && <p className="text-xs text-red-500 mt-1">{errors.currentSales}</p>}
                        </div>
                    </div>
                </FormSection>
                <FormSection title="Kịch bản Khuyến mãi" icon={<TagIcon className="w-5 h-5 text-slate-500" />}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                         <div className="relative">
                             <label htmlFor="discount" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tỉ lệ giảm giá (%)</label>
                             <input id="discount" name="discount" type="number" min="0" value={formData.discount} onChange={handleChange} placeholder="20" disabled={isLoading} className={`${commonInputClass} ${errors.discount ? 'ring-2 ring-red-500 border-red-500' : ''}`}/>
                             {errors.discount && <p className="text-xs text-red-500 mt-1">{errors.discount}</p>}
                             {newPrice !== null && !errors.discount && !errors.originalPrice && (
                                <p className="absolute -bottom-5 right-0 text-xs text-slate-500 dark:text-slate-400">
                                    Giá mới: <span className="font-semibold text-green-600 dark:text-green-400">{newPrice.toLocaleString('vi-VN')} VND</span>
                                </p>
                             )}
                         </div>
                         <div>
                             <label htmlFor="expectedSales" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Doanh số kỳ vọng/tháng</label>
                             <input id="expectedSales" name="expectedSales" type="number" min="0" value={formData.expectedSales} onChange={handleChange} placeholder="350" disabled={isLoading} className={`${commonInputClass} ${errors.expectedSales ? 'ring-2 ring-red-500 border-red-500' : ''}`}/>
                             {errors.expectedSales && <p className="text-xs text-red-500 mt-1">{errors.expectedSales}</p>}
                        </div>
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
                </FormSection>
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

// --- GroupPriceForm: REFACTORED ---
interface Product {
    id: number;
    name: string;
    cost: string;
    price: string;
    sales: string;
}
interface ProductErrors {
    name?: string;
    cost?: string;
    price?: string;
    sales?: string;
}

const initialProducts: Product[] = [
    { id: 1, name: 'Áo Thun V64', cost: '80000', price: '150000', sales: '200' },
    { id: 2, name: 'Quần Short Kaki', cost: '120000', price: '250000', sales: '150' },
    { id: 3, name: 'Nón V64', cost: '50000', price: '120000', sales: '300' },
];

const parseProductsString = (productsString: string): Product[] => {
    if (!productsString || typeof productsString !== 'string') return initialProducts;
    const parsed = productsString.split('\n').map((line, index) => {
        const [name, cost, price, sales] = line.split('|').map(s => s.trim());
        return {
            id: Date.now() + index,
            name: name || '', cost: cost || '', price: price || '', sales: sales || ''
        };
    }).filter(p => p.name || p.cost || p.price || p.sales);
    return parsed.length > 0 ? parsed : initialProducts;
};

const formatProductsArray = (products: Product[]): string => {
    return products
        .map(p => `${p.name.trim()} | ${p.cost.trim()} | ${p.price.trim()} | ${p.sales.trim()}`)
        .join('\n');
};


const GroupPriceForm: React.FC<any> = ({ onSubmit, onCancel, isLoading, initialData }) => {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [productErrors, setProductErrors] = useState<ProductErrors[]>([]);
    const [flatPrice, setFlatPrice] = useState('99000');
    const [salesIncrease, setSalesIncrease] = useState('30');
    const [flatPriceError, setFlatPriceError] = useState('');
    const [salesIncreaseError, setSalesIncreaseError] = useState('');
    const [useMarket, setUseMarket] = useState(true);
    const config = taskConfig['group-price'];

    useEffect(() => {
        if (initialData) {
            setProducts(parseProductsString(initialData.products));
            setFlatPrice(initialData.flatPrice || '99000');
            setSalesIncrease(initialData.salesIncrease || '30');
            if (typeof initialData.useMarket === 'boolean') {
                setUseMarket(initialData.useMarket);
            }
        }
    }, [initialData]);

    const handleProductChange = (index: number, field: keyof Omit<Product, 'id'>, value: string) => {
        const newProducts = [...products];
        newProducts[index] = { ...newProducts[index], [field]: value };
        setProducts(newProducts);

        if (productErrors[index]?.[field]) {
            const newErrors = [...productErrors];
            if (!newErrors[index]) newErrors[index] = {};
            delete newErrors[index][field];
            setProductErrors(newErrors);
        }
    };

    const handleAddProduct = () => {
        setProducts([...products, { id: Date.now(), name: '', cost: '', price: '', sales: '' }]);
    };

    const handleRemoveProduct = (index: number) => {
        setProducts(products.filter((_, i) => i !== index));
        setProductErrors(productErrors.filter((_, i) => i !== index));
    };
    
    const validate = () => {
        let isValid = true;
        const newProductErrors: ProductErrors[] = [];
        
        products.forEach(p => {
            const errors: ProductErrors = {};
            if (!p.name.trim()) errors.name = 'Tên là bắt buộc.';
            errors.cost = validateNumberField(p.cost, 'Giá vốn', true);
            errors.price = validateNumberField(p.price, 'Giá bán', true);
            errors.sales = validateNumberField(p.sales, 'Doanh số', true);

            if (Object.values(errors).some(e => e)) {
                isValid = false;
            }
            newProductErrors.push(errors);
        });

        const flatPriceErr = validateNumberField(flatPrice, 'Mức giá đồng giá', true);
        if (flatPriceErr) {
            isValid = false;
            setFlatPriceError(flatPriceErr);
        } else {
            setFlatPriceError('');
        }

        const salesIncreaseErr = validateNumberField(salesIncrease, 'Doanh số kỳ vọng tăng', false);
        if (salesIncreaseErr) {
            isValid = false;
            setSalesIncreaseError(salesIncreaseErr);
        } else {
            setSalesIncreaseError('');
        }

        setProductErrors(newProductErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const productsString = formatProductsArray(products);
            const fullParams = { products: productsString, flatPrice, salesIncrease, useMarket };
            const prompt = config.generatePrompt(fullParams);
            onSubmit(prompt, fullParams);
        }
    };
    
    const commonInputClass = "w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";
    const errorInputClass = "ring-2 ring-red-500 border-red-500";

    return (
        <div className="w-full max-w-3xl mx-auto">
            <h3 className={`text-xl font-bold text-center mb-1 bg-clip-text text-transparent bg-gradient-to-r ${config.gradient}`}>{initialData ? 'Chỉnh sửa Phân tích' : config.title}</h3>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">{config.subtitle}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormSection title="1. Danh sách sản phẩm" icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-500"><path d="M3 4.25A2.25 2.25 0 0 1 5.25 2h9.5A2.25 2.25 0 0 1 17 4.25v11.5A2.25 2.25 0 0 1 14.75 18h-9.5A2.25 2.25 0 0 1 3 15.75V4.25ZM5.25 3.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h9.5a.75.75 0 0 0 .75-.75V4.25a.75.75 0 0 0-.75-.75h-9.5Z" /><path d="M9 6.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 9 6.5Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 9 9.5Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75ZM6 6.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 6.5ZM6 9.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 9.5ZM6 12.5a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12.5Z" /></svg>}>
                    <div className="space-y-3">
                        <div className="hidden sm:grid grid-cols-5 gap-2 items-center px-2 pb-1">
                            <div className="sm:col-span-2"><label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tên sản phẩm</label></div>
                            <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Giá vốn (VND)</label></div>
                            <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Giá bán (VND)</label></div>
                            <div className="flex-grow"><label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Doanh số/tháng</label></div>
                        </div>
                        {products.map((product, index) => (
                            <div key={product.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-start p-2 bg-white dark:bg-slate-800/50 rounded-md animate-new-row">
                                <div className="sm:col-span-2">
                                    <input type="text" placeholder="Tên sản phẩm" value={product.name} onChange={(e) => handleProductChange(index, 'name', e.target.value)} className={`${commonInputClass} ${productErrors[index]?.name ? errorInputClass : ''}`} />
                                    {productErrors[index]?.name && <p className="text-xs text-red-500 mt-1">{productErrors[index]?.name}</p>}
                                </div>
                                <div>
                                    <input type="number" min="0" placeholder="Giá vốn" value={product.cost} onChange={(e) => handleProductChange(index, 'cost', e.target.value)} className={`${commonInputClass} ${productErrors[index]?.cost ? errorInputClass : ''}`} />
                                    {productErrors[index]?.cost && <p className="text-xs text-red-500 mt-1">{productErrors[index]?.cost}</p>}
                                </div>
                                <div>
                                    <input type="number" min="0" placeholder="Giá bán" value={product.price} onChange={(e) => handleProductChange(index, 'price', e.target.value)} className={`${commonInputClass} ${productErrors[index]?.price ? errorInputClass : ''}`} />
                                    {productErrors[index]?.price && <p className="text-xs text-red-500 mt-1">{productErrors[index]?.price}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-grow">
                                        <input type="number" min="0" placeholder="Doanh số" value={product.sales} onChange={(e) => handleProductChange(index, 'sales', e.target.value)} className={`${commonInputClass} ${productErrors[index]?.sales ? errorInputClass : ''}`} />
                                        {productErrors[index]?.sales && <p className="text-xs text-red-500 mt-1">{productErrors[index]?.sales}</p>}
                                    </div>
                                    <button type="button" onClick={() => handleRemoveProduct(index)} className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-full hover:bg-red-500/10" title="Xóa sản phẩm">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                         <button type="button" onClick={handleAddProduct} className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 px-3 py-2 rounded-lg transition-colors w-full justify-center mt-2 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:text-blue-700">
                            <PlusIcon className="w-4 h-4" />
                            Thêm sản phẩm
                        </button>
                    </div>
                </FormSection>
                <FormSection title="2. Kịch bản Đồng giá" icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-500"><path d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1Zm3.25 3.25a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM19 10a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 19 10Zm-3.25 3.25a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 19a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 19Zm-3.25-3.25a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0ZM1 10a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 1 10Zm3.25-3.25a.75.75 0 0 1 1.06 0L6.37 7.81a.75.75 0 0 1-1.06 1.06L4.25 7.81a.75.75 0 0 1 0-1.06ZM10 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" /></svg>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="flatPrice" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Giá đồng giá mục tiêu (VND)</label>
                             <input id="flatPrice" name="flatPrice" type="number" min="0" value={flatPrice} onChange={(e) => { setFlatPrice(e.target.value); setFlatPriceError(''); }} placeholder="99000" disabled={isLoading} className={`${commonInputClass} ${flatPriceError ? errorInputClass : ''}`} />
                             {flatPriceError && <p className="text-xs text-red-500 mt-1">{flatPriceError}</p>}
                        </div>
                         <div>
                             <label htmlFor="salesIncrease" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Doanh số kỳ vọng tăng (%)</label>
                             <input id="salesIncrease" name="salesIncrease" type="number" min="0" value={salesIncrease} onChange={(e) => { setSalesIncrease(e.target.value); setSalesIncreaseError(''); }} placeholder="30" disabled={isLoading} className={`${commonInputClass} ${salesIncreaseError ? errorInputClass : ''}`} />
                             {salesIncreaseError && <p className="text-xs text-red-500 mt-1">{salesIncreaseError}</p>}
                        </div>
                    </div>
                     <div className="flex items-center pt-2">
                        <input id="useMarket" name="useMarket" type="checkbox" checked={useMarket} onChange={(e) => setUseMarket(e.target.checked)} disabled={isLoading} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                        <label htmlFor="useMarket" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">Tham khảo giá thị trường</label>
                    </div>
                </FormSection>
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

const style = document.createElement('style');
style.innerHTML = `
    @keyframes field-glow {
        0% { box-shadow: 0 0 0 0px theme(colors.blue.500/20%); }
        100% { box-shadow: 0 0 0 4px theme(colors.blue.500/0%); }
    }
    .animate-field-glow {
        animation: field-glow 1.5s infinite;
    }
    .ai-calculation-field {
        background-image: repeating-linear-gradient(
            -45deg,
            theme(colors.slate.200/50%),
            theme(colors.slate.200/50%) 5px,
            transparent 5px,
            transparent 10px
        );
        background-color: theme(colors.slate.100);
    }
    .dark .ai-calculation-field {
        background-image: repeating-linear-gradient(
            -45deg,
            theme(colors.slate.700/50%),
            theme(colors.slate.700/50%) 5px,
            transparent 5px,
            transparent 10px
        );
        background-color: theme(colors.slate.900/40%);
    }
    @keyframes new-row-anim {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-new-row {
        animation: new-row-anim 0.3s ease-out forwards;
    }
`;
document.head.appendChild(style);