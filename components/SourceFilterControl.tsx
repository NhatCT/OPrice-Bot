import React, { useState, useRef, useEffect } from 'react';
import { FunnelIcon } from './icons/FunnelIcon';
import { XIcon } from './icons/XIcon';

interface Source {
    uri: string;
    title: string;
}

interface SourceFilterControlProps {
    sources: Source[];
    activeFilter: string | null;
    onFilterChange: (uri: string | null) => void;
}

export const SourceFilterControl: React.FC<SourceFilterControlProps> = ({ sources, activeFilter, onFilterChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeSourceTitle = sources.find(s => s.uri === activeFilter)?.title || activeFilter;

    if (activeFilter) {
        return (
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/50 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 animate-fade-in-fast">
                <span className="pl-3 pr-1 truncate max-w-48">Lọc theo: {activeSourceTitle}</span>
                <button
                    onClick={() => onFilterChange(null)}
                    className="p-1 rounded-full text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/60"
                    title="Bỏ lọc"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        )
    }

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(p => !p)}
                className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Lọc theo nguồn"
            >
                <FunnelIcon className="w-6 h-6" />
            </button>
            {isOpen && (
                <div
                    className="absolute top-full right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-2 z-10 animate-popover-enter"
                    role="menu"
                >
                    <h4 className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lọc theo nguồn</h4>
                    <ul>
                        {sources.map(source => (
                            <li key={source.uri}>
                                <button
                                    onClick={() => {
                                        onFilterChange(source.uri);
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600/70 rounded-md transition-colors duration-200 truncate"
                                    title={source.title}
                                >
                                    {source.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const style = document.createElement('style');
if (!document.querySelector('[data-animation="popover-enter"]')) {
    style.setAttribute('data-animation', 'popover-enter');
    style.innerHTML = `
        @keyframes popover-enter {
            from { opacity: 0; transform: translateY(-5px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-popover-enter {
            animation: popover-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transform-origin: top right;
        }
        @keyframes fadeInFast {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in-fast {
            animation: fadeInFast 0.3s ease-out forwards;
        }
    `;
    document.head.appendChild(style);
}