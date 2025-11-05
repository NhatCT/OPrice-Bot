import React, { useState, useEffect } from 'react';
import type { ChatMessage, Feedback } from '../types';
import { XIcon } from './icons/XIcon';
import { StarIcon } from './icons/StarIcon';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage;
  onSave: (message: ChatMessage, feedback: Feedback) => void;
}

const issueOptions = [
    { id: 'inaccurate', label: 'Thông tin không chính xác' },
    { id: 'unhelpful', label: 'Lời khuyên không hữu ích' },
    { id: 'formatting', label: 'Định dạng kém' },
    { id: 'tone', label: 'Văn phong/Giọng điệu' },
    { id: 'other', label: 'Khác' },
];

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ isOpen, onClose, message, onSave }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
    const [correction, setCorrection] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRating(0);
            setHoverRating(0);
            setSelectedIssues([]);
            setCorrection(message.content);
        }
    }, [isOpen, message]);

    const handleIssueToggle = (issueId: string) => {
        setSelectedIssues(prev =>
            prev.includes(issueId) ? prev.filter(id => id !== issueId) : [...prev, issueId]
        );
    };

    const handleSubmit = () => {
        if (rating === 0) {
            alert('Vui lòng cung cấp đánh giá (số sao).');
            return;
        }
        const feedback: Feedback = {
            rating,
            issues: selectedIssues,
            correction: correction !== message.content ? correction : undefined,
        };
        onSave(message, feedback);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl m-4 transform transition-all animate-dialog-in" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Cung cấp Phản hồi</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Đóng">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">1. Đánh giá câu trả lời</label>
                        <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                >
                                    <StarIcon className={`w-7 h-7 transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">2. Vấn đề là gì? (Tùy chọn)</label>
                        <div className="flex flex-wrap gap-2">
                            {issueOptions.map(issue => (
                                <button
                                    key={issue.id}
                                    onClick={() => handleIssueToggle(issue.id)}
                                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${selectedIssues.includes(issue.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                >
                                    {issue.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="correction" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">3. Sửa lại cho đúng (Tùy chọn)</label>
                        <textarea
                            id="correction"
                            value={correction}
                            onChange={(e) => setCorrection(e.target.value)}
                            rows={8}
                            className="w-full bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-300 dark:border-slate-600"
                            placeholder="Chỉnh sửa câu trả lời của AI hoặc viết lại hoàn toàn..."
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Việc cung cấp phiên bản đúng sẽ giúp AI học hỏi và trả lời tốt hơn trong tương lai.</p>
                    </div>
                </div>

                <footer className="p-4 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Hủy</button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Gửi Phản hồi</button>
                </footer>
            </div>
        </div>
    );
};

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