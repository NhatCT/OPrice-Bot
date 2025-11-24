import React, { useState, useEffect, useCallback } from 'react';
import type { BusinessProfile, Product } from '../types';
import { XIcon } from './icons/XIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DnaIcon } from './icons/DnaIcon';
import { TagInput } from './TagInput';

interface BusinessProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  onSave: (profile: BusinessProfile) => void;
}

const useDebouncedEffect = (effect: () => void, deps: React.DependencyList, delay: number) => {
    useEffect(() => {
        const handler = setTimeout(() => effect(), delay);
        return () => clearTimeout(handler);
    }, [...deps, delay]);
};

export const BusinessProfileDialog: React.FC<BusinessProfileDialogProps> = ({ isOpen, onClose, profile, onSave }) => {
    const [localProfile, setLocalProfile] = useState<BusinessProfile>(profile);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        if (isOpen) {
            setLocalProfile(profile);
            setSaveStatus('idle');
        }
    }, [isOpen, profile]);
    
    useDebouncedEffect(() => {
        if (isOpen && JSON.stringify(localProfile) !== JSON.stringify(profile)) {
            setSaveStatus('saving');
            onSave(localProfile);
            setTimeout(() => setSaveStatus('saved'), 300);
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    }, [localProfile, isOpen], 1000);

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalProfile(p => ({
            ...p,
            defaultCosts: { ...p.defaultCosts, [name]: value }
        }));
    };
    
    const handleDnaChange = (field: 'targetCustomer' | 'productVision', value: string) => {
        setLocalProfile(p => ({
            ...p,
            brandDNA: { ...(p.brandDNA || { personality: [], targetCustomer: '', productVision: '' }), [field]: value }
        }));
    };
    const handleDnaPersonalityChange = (personality: string[]) => {
        setLocalProfile(p => ({
            ...p,
            brandDNA: { ...(p.brandDNA || { personality: [], targetCustomer: '', productVision: '' }), personality }
        }));
    };

    if (!isOpen) return null;

    const commonInputClass = "w-full bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl m-4 transform transition-all animate-dialog-in" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BriefcaseIcon className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hồ sơ Kinh doanh & AI</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Đóng">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                    <div>
                        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Chi phí Mặc định</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Các chi phí này sẽ được tự động điền vào biểu mẫu phân tích.</p>
                        <div className="space-y-3 p-4 bg-white dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div>
                                <label htmlFor="fixedCostMonthly" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tổng chi phí cố định / Tháng (VND)</label>
                                <input
                                    id="fixedCostMonthly"
                                    name="fixedCostMonthly"
                                    type="number"
                                    min="0"
                                    value={localProfile.defaultCosts.fixedCostMonthly || ''}
                                    onChange={handleCostChange}
                                    placeholder="VD: 20000000"
                                    className={commonInputClass}
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">
                            <DnaIcon className="w-4 h-4" />
                            DNA Thương hiệu
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">"Dạy" cho AI về bản sắc thương hiệu của bạn để nhận được các đề xuất phù hợp hơn.</p>
                        <div className="space-y-3 p-4 bg-white dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700">
                             <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tính cách thương hiệu (keywords)</label>
                                <TagInput value={localProfile.brandDNA?.personality || []} onChange={handleDnaPersonalityChange} placeholder="VD: Hiện đại, Tối giản..."/>
                            </div>
                            <div>
                                <label htmlFor="dnaCustomer" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Khách hàng mục tiêu</label>
                                <textarea id="dnaCustomer" value={localProfile.brandDNA?.targetCustomer || ''} onChange={(e) => handleDnaChange('targetCustomer', e.target.value)} rows={2} className={commonInputClass} placeholder="VD: Gen Z, nhân viên văn phòng..."/>
                            </div>
                            <div>
                                <label htmlFor="dnaVision" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tầm nhìn sản phẩm</label>
                                <textarea id="dnaVision" value={localProfile.brandDNA?.productVision || ''} onChange={(e) => handleDnaChange('productVision', e.target.value)} rows={2} className={commonInputClass} placeholder="VD: Tạo ra các sản phẩm denim bền vững..."/>
                            </div>
                        </div>
                    </div>
                     <p className="text-sm text-slate-500 dark:text-slate-400 text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                        Bạn có thể quản lý danh mục sản phẩm trong mục <strong className="font-semibold text-slate-600 dark:text-slate-300">Sản phẩm</strong> ở thanh điều hướng chính.
                    </p>
                </div>
                <footer className="p-4 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 transition-opacity" style={{ opacity: saveStatus === 'idle' ? 0 : 1 }}>
                        {saveStatus === 'saved' && <><CheckIcon className="w-4 h-4 text-green-500" /> <span>Đã lưu hồ sơ</span></>}
                        {saveStatus === 'saving' && <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span>Đang lưu...</span></>}
                    </div>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Đóng</button>
                </footer>
            </div>
        </div>
    );
};

// Animation styles
const style = document.createElement('style');
if (!document.head.querySelector('[data-animation="dialog-in"]')) {
    style.setAttribute('data-animation', 'dialog-in');
    style.innerHTML = `
        @keyframes dialogIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-dialog-in {
            animation: dialogIn 0.2s ease-out forwards;
        }
    `;
    document.head.appendChild(style);
}