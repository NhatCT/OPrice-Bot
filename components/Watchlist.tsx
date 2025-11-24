import React, { useState } from 'react';
import type { WatchedProduct } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { PinIcon } from './icons/PinIcon';

interface WatchlistProps {
  watchlist: WatchedProduct[];
  onUpdate: (productId: string) => Promise<void>;
  onRemove: (productId: string) => void;
  onUpdateAll: () => Promise<void>;
}

export const Watchlist: React.FC<WatchlistProps> = ({ watchlist, onUpdate, onRemove, onUpdateAll }) => {
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const [isUpdatingAll, setIsUpdatingAll] = useState(false);

    const handleUpdate = async (id: string) => {
        setUpdatingIds(prev => [...prev, id]);
        await onUpdate(id);
        setUpdatingIds(prev => prev.filter(i => i !== id));
    };

    const handleUpdateAll = async () => {
        setIsUpdatingAll(true);
        await onUpdateAll();
        setIsUpdatingAll(false);
    };

    const th = "px-4 py-3 text-left text-lg font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
    const td = "px-4 py-3 border-t border-slate-200 dark:border-slate-700 text-lg";

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <PinIcon className="w-6 h-6" isFilled />
                        Danh sách Theo dõi Đối thủ
                    </h2>
                     <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">Giám sát giá và hiệu suất của các sản phẩm cạnh tranh.</p>
                </div>
                <button
                    onClick={handleUpdateAll}
                    disabled={isUpdatingAll || watchlist.length === 0}
                    className="flex items-center gap-2 px-4 py-2 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isUpdatingAll ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <ArrowPathIcon className="w-5 h-5" />}
                    <span>{isUpdatingAll ? 'Đang cập nhật...' : 'Cập nhật Tất cả'}</span>
                </button>
            </div>
            <div className="flex-1 overflow-auto">
                {watchlist.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 dark:text-slate-400">
                        <p className="text-lg">Danh sách theo dõi của bạn đang trống.</p>
                        <p className="mt-2">Ghim sản phẩm từ báo cáo Phân tích Đối thủ hoặc Phân tích Từ khoá để bắt đầu theo dõi.</p>
                    </div>
                ) : (
                    <table className="w-full text-lg min-w-[600px]">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm">
                            <tr>
                                <th className={th}>Sản phẩm</th>
                                <th className={th}>Giá ban đầu</th>
                                <th className={th}>Giá hiện tại</th>
                                <th className={th}>Ngày thêm</th>
                                <th className={th}>Cập nhật lần cuối</th>
                                <th className={th}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchlist.map(product => {
                                const isUpdating = updatingIds.includes(product.id) || isUpdatingAll;
                                const priceChanged = product.lastPrice !== product.initialPrice;
                                const priceNumInitial = parseFloat(product.initialPrice.replace(/[^\d]/g, ''));
                                const priceNumLast = parseFloat(product.lastPrice.replace(/[^\d]/g, ''));
                                const priceIncreased = priceNumLast > priceNumInitial;
                                return (
                                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className={td}>
                                        <a href={product.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline">
                                            <span>{product.name}</span>
                                            <ExternalLinkIcon className="w-4 h-4" />
                                        </a>
                                        <span className="text-base text-slate-400">{product.platform}</span>
                                    </td>
                                    <td className={td}>{product.initialPrice}</td>
                                    <td className={`${td} font-semibold ${priceChanged ? (priceIncreased ? 'text-red-500' : 'text-green-500') : ''}`}>
                                        {product.lastPrice}
                                    </td>
                                    <td className={td}>{new Date(product.dateAdded).toLocaleDateString('vi-VN')}</td>
                                    <td className={td}>{new Date(product.lastUpdated).toLocaleString('vi-VN')}</td>
                                    <td className={td}>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleUpdate(product.id)} disabled={isUpdating} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50" title="Cập nhật">
                                                {isUpdating ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <ArrowPathIcon className="w-5 h-5" />}
                                            </button>
                                            <button onClick={() => onRemove(product.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" title="Xóa">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};