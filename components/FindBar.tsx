import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { XIcon } from './icons/XIcon';

interface FindBarProps {
  isVisible: boolean;
  onClose: () => void;
  containerRef: React.RefObject<HTMLElement>;
}

// Store original content of elements that have been highlighted
const originalContentCache = new Map<HTMLElement, string>();

function escapeRegex(string: string): string {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function highlightTextInNode(node: HTMLElement, query: string): number {
    if (!query) return 0;

    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    let count = 0;
    
    // Save original content if not already saved
    if (!originalContentCache.has(node)) {
        originalContentCache.set(node, node.innerHTML);
    }
    
    const originalHTML = originalContentCache.get(node)!;
    
    // Perform highlighting on the original content to avoid nested marks
    const newHTML = originalHTML.replace(regex, (match) => {
        count++;
        return `<mark class="find-match">${match}</mark>`;
    });

    if (count > 0) {
        node.innerHTML = newHTML;
    }

    return count;
}


export const FindBar: React.FC<FindBarProps> = ({ isVisible, onClose, containerRef }) => {
    const [query, setQuery] = useState('');
    const [matches, setMatches] = useState<HTMLElement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    const clearHighlights = useCallback(() => {
        originalContentCache.forEach((originalHTML, element) => {
            element.innerHTML = originalHTML;
        });
        originalContentCache.clear();
        setMatches([]);
        setCurrentIndex(-1);
    }, []);

    useEffect(() => {
        if (isVisible) {
            inputRef.current?.focus();
        } else {
            // Clear highlights and reset state when bar is hidden
            setQuery('');
            clearHighlights();
        }
    }, [isVisible, clearHighlights]);
    
    // This is the main effect for searching and highlighting
    useEffect(() => {
        const container = containerRef.current;
        if (!isVisible || !container) {
            return;
        }

        // Always clear previous highlights before a new search
        clearHighlights();
        
        if (query.trim().length < 2) {
            return;
        }

        const elementsToSearch = container.querySelectorAll('.prose p, .prose li, .prose td, .prose th, .prose h1, .prose h2, .prose h3');
        let totalMatches = 0;
        elementsToSearch.forEach(el => {
            totalMatches += highlightTextInNode(el as HTMLElement, query);
        });

        if (totalMatches > 0) {
            // FIX: Use type assertion `as HTMLElement[]` instead of generic to fix error.
            const newMatches = Array.from(container.querySelectorAll('mark.find-match')) as HTMLElement[];
            setMatches(newMatches);
            setCurrentIndex(0);
        } else {
            setMatches([]);
            setCurrentIndex(-1);
        }
        
        // Return a cleanup function
        return () => {
             if (containerRef.current) { // Check if container still exists
                clearHighlights();
            }
        };
    }, [query, isVisible, containerRef, clearHighlights]);

    // This effect handles the 'current' match highlighting and scrolling
    useEffect(() => {
        matches.forEach((match, index) => {
            if (index === currentIndex) {
                match.classList.add('current');
                match.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                match.classList.remove('current');
            }
        });
    }, [currentIndex, matches]);
    
    const handleNext = () => {
        if (matches.length > 0) {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % matches.length);
        }
    };

    const handlePrev = () => {
        if (matches.length > 0) {
            setCurrentIndex((prevIndex) => (prevIndex - 1 + matches.length) % matches.length);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                handlePrev();
            } else {
                handleNext();
            }
        }
    };

    if (!isVisible) return null;

    return (
        <div className="absolute top-16 right-4 z-20 w-80 bg-slate-100 dark:bg-slate-700 rounded-lg shadow-lg border border-slate-300 dark:border-slate-600 p-2 flex items-center gap-2 animate-slide-down-find">
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tìm trong trang..."
                className="flex-1 w-full bg-white dark:bg-slate-800 text-sm p-2 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {matches.length > 0 ? `${currentIndex + 1} / ${matches.length}` : '0 / 0'}
            </span>
            <button onClick={handlePrev} disabled={matches.length === 0} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronUpIcon className="w-5 h-5" />
            </button>
            <button onClick={handleNext} disabled={matches.length === 0} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronDownIcon className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};


const style = document.createElement('style');
style.innerHTML = `
    mark.find-match {
        background-color: #fde047; /* yellow-300 */
        color: #1e293b; /* slate-800 */
        border-radius: 2px;
        padding: 1px 2px;
    }
    mark.find-match.current {
        background-color: #f97316; /* orange-500 */
        color: white;
    }
    @keyframes slideDownFind {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-slide-down-find {
        animation: slideDownFind 0.2s ease-out forwards;
    }
`;
document.head.appendChild(style);