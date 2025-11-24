
// ... (Imports same as previous)
import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage, Feedback, WatchedProduct } from '../types';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { ThumbUpIcon } from './icons/ThumbUpIcon';
import { ThumbDownIcon } from './icons/ThumbDownIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { TableCellsIcon } from './icons/TableCellsIcon';
import { MarketResearchReport } from './MarketResearchReport';
import { AnalysisChart } from './charts/AnalysisChart';
import { ColorSwatchRenderer } from './ColorSwatchRenderer';
import { BrandPositioningMap } from './BrandPositioningMap';
import { V64Logo } from './icons/V64Logo';
import { PinIcon } from './icons/PinIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { WandIcon } from './icons/WandIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { EllipsisHorizontalIcon } from './icons/EllipsisHorizontalIcon';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';
import { TypingIndicator } from './TypingIndicator';
import { FunnelIcon } from './icons/FunnelIcon';
import { toPng } from 'html-to-image';

// ... (Helper functions: parseSortValue, SortableTable remain same)
const parseSortValue = (val: string) => {
    if (!val) return 0;
    let multiplier = 1;
    if (val.toLowerCase().includes('k')) multiplier = 1000;
    if (val.toLowerCase().includes('m')) multiplier = 1000000;
    const numStr = val.replace(/[^0-9.,]/g, '').replace(/,/g, '');
    return parseFloat(numStr) * multiplier || 0;
};

const SortableTable: React.FC<{ data: any[]; columns: any[]; watchlist?: WatchedProduct[]; onToggleWatch?: (item: any) => void; }> = ({ data, columns, watchlist, onToggleWatch }) => {
    // ... (Same logic)
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            const valA = parseSortValue(a[sortConfig.key]);
            const valB = parseSortValue(b[sortConfig.key]);
            return sortConfig.direction === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
        });
    }, [data, sortConfig]);
    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    return (
        <div className="overflow-hidden my-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>{columns.map(col => (<th key={col.key} className="px-5 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => requestSort(col.key)}><div className="flex items-center gap-1.5">{col.label}{sortConfig?.key === col.key && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-3 h-3"/> : <ChevronDownIcon className="w-3 h-3"/>)}</div></th>))}</tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, i) => (
                            <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                {columns.map(col => (
                                    <td key={`${i}-${col.key}`} className="px-5 py-4 text-slate-700 dark:text-slate-200">
                                        {col.isLink ? <a href={row[col.key]} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1">Link <ExternalLinkIcon className="w-3 h-3"/></a> : col.isWatchable && onToggleWatch ? (
                                            <div className="flex items-center justify-between gap-3"><span className="font-medium">{row[col.key]}</span><button onClick={() => onToggleWatch(row)} className={`p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${watchlist?.some(w => w.name === row.name) ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400'}`}><PinIcon className="w-3.5 h-3.5" isFilled={watchlist?.some(w => w.name === row.name)} /></button></div>
                                        ) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface ChatMessageComponentProps {
    index: number; message: ChatMessage; onSuggestionClick: (s: string) => void; onFeedback: (f: 'positive') => void; onOpenFeedbackDialog: (m: ChatMessage, i: number) => void; onRegenerate: (i: number) => void; onRefine: () => void; onToggleCompare: (i: number) => void; isSelectedForCompare: boolean; onEditAnalysis: (m: ChatMessage) => void; onExportExcel: (m: ChatMessage) => void; onQuickAction: (t: any, d: any) => void; sourceFilter: string | null; effectiveTheme: 'light' | 'dark'; isLastMessage: boolean; isLoading: boolean; onSourceFilterChange: (u: string | null) => void; isEditing: boolean; onInitiateEdit: (id: number) => void; onSaveEdit: (id: number, c: string) => void; onCancelEdit: () => void; watchlist: WatchedProduct[]; onToggleWatch: (p: any) => void; onGenerateContent: (m: ChatMessage) => void;
}

export const ChatMessageComponent: React.FC<ChatMessageComponentProps> = ({
    index, message, onSuggestionClick, onFeedback, onOpenFeedbackDialog, onRegenerate, onRefine, onToggleCompare, isSelectedForCompare, onEditAnalysis, onExportExcel, sourceFilter, effectiveTheme, isLastMessage, isLoading, onSourceFilterChange, isEditing, onInitiateEdit, onSaveEdit, onCancelEdit, watchlist, onToggleWatch, onGenerateContent
}) => {
    const [copied, setCopied] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const actionsButtonRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const isUser = message.role === 'user';
    const canExport = true;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (actionsButtonRef.current && !actionsButtonRef.current.contains(event.target as Node)) setIsActionsMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopy = () => { navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const handleToggleWatchItem = (item: any) => {
        const watchedItem = { id: item.link || item.url || `${item.name}-${Date.now()}`, name: item.name || item.productName, url: item.link || item.url, platform: item.platform || 'Shopee', price: item.price, initialPrice: item.price, lastPrice: item.price, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() };
        onToggleWatch(watchedItem);
    };
    const handleExportReport = async () => {
        if (contentRef.current) {
            try {
                const dataUrl = await toPng(contentRef.current, { backgroundColor: effectiveTheme === 'dark' ? '#0f172a' : '#ffffff' });
                const link = document.createElement('a'); link.download = `report-${Date.now()}.png`; link.href = dataUrl; link.click();
            } catch (e) { console.error("Failed export", e); }
        }
    };

    return (
        <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-message-in group px-2`}>
            <div className="flex-shrink-0 mt-1">
                {isUser ? (
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm border border-white dark:border-slate-600"><UserCircleIcon className="w-6 h-6" /></div>
                ) : (
                    <div className="w-10 h-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm border border-white/50 dark:border-slate-700 p-1"><V64Logo className="w-full h-full" /></div>
                )}
            </div>
            <div className={`flex-1 max-w-[90%] sm:max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                <div ref={contentRef} className={`relative px-6 py-5 text-base sm:text-lg leading-relaxed shadow-sm border backdrop-blur-xl ${isUser ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-[2rem] rounded-tr-sm border-transparent shadow-blue-500/20' : 'glass-panel rounded-[2rem] rounded-tl-sm text-slate-800 dark:text-slate-200'}`}>
                    {isEditing && isUser ? (
                        <div className="flex flex-col gap-3 w-full min-w-[300px]">
                            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-3 text-slate-800 dark:text-slate-200 bg-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 resize-none" rows={4} />
                            <div className="flex justify-end gap-2"><button onClick={onCancelEdit} className="px-4 py-2 text-sm font-medium rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">Hủy</button><button onClick={() => onSaveEdit(message.id!, editContent)} className="px-4 py-2 text-sm font-bold rounded-xl bg-white text-blue-600 hover:bg-blue-50 transition-colors shadow-sm">Lưu</button></div>
                        </div>
                    ) : (
                        <>
                            {isUser && !isEditing && (<button onClick={() => { setEditContent(message.content); onInitiateEdit(message.id!); }} className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur text-slate-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg" title="Chỉnh sửa"><PencilSquareIcon className="w-4 h-4" /></button>)}
                            {isUser && message.image && (<div className="mb-4 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg max-w-sm"><img src={message.image} alt="User upload" className="w-full h-auto object-cover" /></div>)}
                            <div className={`prose prose-slate dark:prose-invert max-w-none break-words ${isUser ? 'prose-p:text-white prose-headings:text-white prose-strong:text-white prose-a:text-blue-100' : 'dark:prose-p:text-slate-300 dark:prose-headings:text-white dark:prose-strong:text-white'}`}>
                                {message.task === 'brand-positioning' && <BrandPositioningMap />}
                                {message.competitorAnalysisData && (
                                    <div className="not-prose">
                                        {message.competitorAnalysisData.executiveSummary && <div className="mb-6 p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl"><h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1"><SparklesIcon className="w-3 h-3"/> Tóm tắt Lãnh đạo</h4><p className="text-slate-700 dark:text-slate-200 italic leading-relaxed">{message.competitorAnalysisData.executiveSummary}</p></div>}
                                        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-4"><TableCellsIcon className="w-5 h-5 text-indigo-500"/> Bảng So sánh Đối thủ</h4>
                                        <SortableTable data={message.competitorAnalysisData.comparisonTable} columns={[{ key: 'productName', label: 'Sản phẩm', isWatchable: true }, { key: 'price', label: 'Giá' }, { key: 'sold', label: 'Đã bán' }, { key: 'rating', label: 'Rate' }, { key: 'link', label: 'Link', isLink: true }]} watchlist={watchlist} onToggleWatch={handleToggleWatchItem} />
                                    </div>
                                )}
                                {message.keywordAnalysisData && (
                                    <div className="not-prose">
                                        <p className="mb-6 text-lg text-slate-700 dark:text-slate-200 border-l-4 border-purple-500 pl-4 py-1 bg-purple-50/30 dark:bg-purple-900/10 rounded-r-lg">{message.keywordAnalysisData.overallSummary}</p>
                                        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-4"><SparklesIcon className="w-5 h-5 text-amber-500"/> Top Sản phẩm Bán chạy</h4>
                                        <SortableTable data={message.keywordAnalysisData.topProducts} columns={[{ key: 'name', label: 'Sản phẩm', isWatchable: true }, { key: 'price', label: 'Giá' }, { key: 'monthlySales', label: 'Bán/tháng' }, { key: 'estimatedRevenue', label: 'Doanh thu (Est)' }, { key: 'link', label: 'Link', isLink: true }]} watchlist={watchlist} onToggleWatch={handleToggleWatchItem} />
                                    </div>
                                )}
                                {message.marketResearchData ? (<div className="not-prose mt-4"><MarketResearchReport data={message.marketResearchData} theme={effectiveTheme} /></div>) : (
                                    !message.competitorAnalysisData && !message.keywordAnalysisData && !message.shopeeComparisonData && !message.collectionAnalysisData && (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (<div className="rounded-xl overflow-hidden my-6 shadow-xl border border-slate-200 dark:border-slate-700"><div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-mono text-slate-500 border-b border-slate-200 dark:border-slate-700 flex justify-between"><span>{match[1]}</span></div><SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: 0 }} {...props}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter></div>) : (<code className={`${className} bg-slate-100 dark:bg-slate-700/50 text-pink-600 dark:text-pink-400 rounded px-1.5 py-0.5 font-mono text-sm border border-slate-200 dark:border-slate-600`} {...props}>{children}</code>);
                                            },
                                            p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300"><ColorSwatchRenderer text={children?.toString()} /></p>,
                                            h1: ({ children }) => <h1 className="text-2xl font-extrabold mb-6 mt-4 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-xl font-bold mb-4 mt-6 text-slate-900 dark:text-white flex items-center gap-2"><span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-slate-100">{children}</h3>,
                                            li: ({ children }) => <li className="text-slate-700 dark:text-slate-300 pl-1 mb-1">{children}</li>,
                                            strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
                                            table: ({children}) => <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"><table className="w-full text-sm text-left">{children}</table></div>,
                                            thead: ({children}) => <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-500 font-semibold">{children}</thead>,
                                            th: ({children}) => <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{children}</th>,
                                            td: ({children}) => <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 text-slate-700 dark:text-slate-300">{children}</td>,
                                            a: ({node, ...props}: any) => <a className="text-blue-600 dark:text-blue-400 hover:underline decoration-2 underline-offset-2 font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                                        }}>{message.content}</ReactMarkdown>)
                                )}
                            </div>
                            {message.charts && message.charts.length > 0 && (<div className="grid grid-cols-1 gap-6 mt-8">{message.charts.map((chart, idx) => (<div key={idx} className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"><AnalysisChart chart={chart} theme={effectiveTheme} /></div>))}</div>)}
                            {message.sources && message.sources.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-700/60"><h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-1.5"><GlobeAltIcon className="w-3.5 h-3.5" /> Nguồn tham khảo</h4><div className="flex flex-wrap gap-3">{message.sources.map((source, i) => (<a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5"><div className="p-1 bg-slate-100 dark:bg-slate-700 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50"><ExternalLinkIcon className="w-3 h-3" /></div><span className="truncate max-w-[180px]">{source.title}</span></a>))}</div></div>
                            )}
                        </>
                    )}
                </div>
                {!isUser && !isLoading && (
                    <div className="mt-3 ml-4 flex flex-wrap items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <button onClick={handleCopy} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all" title="Sao chép">{copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}</button>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                            <button onClick={() => onFeedback('positive')} className={`p-2 rounded-lg transition-all ${message.feedback?.rating === 5 ? 'text-green-500 bg-green-50' : 'text-slate-400 hover:text-green-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`} title="Hữu ích"><ThumbUpIcon className="w-4 h-4" /></button>
                            <button onClick={() => onOpenFeedbackDialog(message, index)} className={`p-2 rounded-lg transition-all ${message.feedback && message.feedback.rating < 3 ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`} title="Báo cáo"><ThumbDownIcon className="w-4 h-4" /></button>
                        </div>
                        <button onClick={() => onRegenerate(index)} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all" title="Tạo lại"><ArrowPathIcon className="w-4 h-4" /></button>
                        <div className="relative" ref={actionsButtonRef}>
                            <button onClick={() => setIsActionsMenuOpen(p => !p)} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-400 hover:text-purple-600 hover:border-purple-300 transition-all" title="Thêm"><EllipsisHorizontalIcon className="w-4 h-4" /></button>
                            {isActionsMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 z-20 animate-popover-enter">
                                    <button onClick={() => { onEditAnalysis(message); setIsActionsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><PencilSquareIcon className="w-4 h-4 text-slate-400" /><span>Chỉnh sửa tham số</span></button>
                                    <button onClick={() => { onToggleCompare(index); setIsActionsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors ${isSelectedForCompare ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-700 dark:text-slate-200'}`}><ScaleIcon className="w-4 h-4 text-slate-400" /><span>So sánh câu trả lời</span></button>
                                    {(message.task === 'competitor-analysis' || message.task === 'keyword-analysis') && (<button onClick={() => { onGenerateContent(message); setIsActionsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><WandIcon className="w-4 h-4 text-purple-500" /><span>Tạo Content Marketing</span></button>)}
                                    {canExport && (<><div className="my-1 h-px bg-slate-100 dark:bg-slate-700"></div><button onClick={() => { handleExportReport(); setIsActionsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><DocumentArrowDownIcon className="w-4 h-4 text-blue-500" /><span>Xuất ảnh báo cáo</span></button><button onClick={() => { onExportExcel(message); setIsActionsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><TableCellsIcon className="w-4 h-4 text-green-500" /><span>Xuất Excel / CSV</span></button></>)}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {!isUser && isLastMessage && message.suggestions && message.suggestions.length > 0 && (<div className="mt-6 flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>{message.suggestions.map((suggestion, i) => (<button key={i} onClick={() => onSuggestionClick(suggestion)} className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-medium hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">{suggestion}</button>))}</div>)}
            </div>
        </div>
    );
};
