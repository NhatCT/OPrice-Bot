
import React, { useState, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { fetchShopeeProductInfo, fetchIconDenimProductInfo, fetchLeviProductInfo } from '../services/geminiService';

interface CompetitorSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  onConfirm: (products: any[]) => void;
}

export const CompetitorSelectionDialog: React.FC<CompetitorSelectionDialogProps> = ({ isOpen, onClose, initialUrl, onConfirm }) => {
  const [url, setUrl] = useState(initialUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ name: string; price: number; platform: string } | null>(null);

  useEffect(() => {
    setUrl(initialUrl || '');
    setPreview(null);
    setError(null);
  }, [initialUrl, isOpen]);

  const handleAnalyze = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
        let info;
        let platform = 'Other';

        if (url.includes('shopee.vn')) {
            platform = 'Shopee';
            info = await fetchShopeeProductInfo(url);
        } else if (url.includes('icondenim.com')) {
            platform = 'Icon Denim';
            info = await fetchIconDenimProductInfo(url);
        } else if (url.includes('levi.com')) {
            platform = 'Levi\'s';
            info = await fetchLeviProductInfo(url);
        } else {
            throw new Error('Nền tảng chưa được hỗ trợ. Vui lòng dùng link Shopee, Icon Denim hoặc Levi\'s.');
        }

        if (info) {
            setPreview({ name: info.productName, price: info.price, platform });
        } else {
            throw new Error('Không thể lấy thông tin sản phẩm.');
        }
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Lỗi không xác định khi lấy thông tin sản phẩm.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleConfirm = () => {
      if (preview) {
          onConfirm([{
              name: preview.name,
              url: url,
              price: preview.price.toLocaleString('vi-VN') + ' VND',
              platform: preview.platform,
              // Generating a simple ID for the new item
              id: `${preview.platform}-${Date.now()}`
          }]);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 animate-dialog-in border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Thêm Sản phẩm Đối thủ</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <XIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </button>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Đường dẫn sản phẩm (URL)</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={url} 
                            onChange={e => setUrl(e.target.value)} 
                            placeholder="https://shopee.vn/..."
                            className="flex-1 p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                            onClick={handleAnalyze}
                            disabled={isLoading || !url}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                            {isLoading ? 'Đang tải...' : 'Kiểm tra'}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>

                {preview && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 animate-fade-in-fast">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">{preview.name}</h4>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">{preview.price.toLocaleString('vi-VN')} VND</p>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">{preview.platform}</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
                    <button 
                        onClick={handleConfirm}
                        disabled={!preview}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
                    >
                        Thêm vào danh sách
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
