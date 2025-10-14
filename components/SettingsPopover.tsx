import React, { useState, useRef, useEffect } from 'react';
import { PaletteIcon } from './icons/PaletteIcon';

type Theme = 'light' | 'dark';
type Font = 'sans' | 'serif' | 'mono';

interface SettingsPopoverProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  font: Font;
  setFont: (font: Font) => void;
}

export const SettingsPopover: React.FC<SettingsPopoverProps> = ({ theme, setTheme, font, setFont }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const handleToggle = () => {
    if (isRendered) {
        setIsOpen(false);
    } else {
        setIsRendered(true);
    }
  };
  
  useEffect(() => {
    if (isRendered) {
      // Use a timeout to allow the element to be added to the DOM before adding the 'enter' class
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isRendered]);

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsRendered(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isRendered) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isRendered]);

  const fontOptions: { key: Font; name: string }[] = [
    { key: 'sans', name: 'Mặc định' },
    { key: 'serif', name: 'Serif' },
    { key: 'mono', name: 'Mono' },
  ];
  
  const getButtonClass = (isActive: boolean) => 
    `w-full text-center px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-sky-600 text-white font-semibold'
        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600/70'
    }`;


  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={handleToggle}
        className="text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50"
        title="Tùy chỉnh giao diện"
      >
        <PaletteIcon className="w-6 h-6" />
      </button>

      {isRendered && (
        <div
          onAnimationEnd={handleAnimationEnd}
          className={`absolute top-full right-0 mt-2 w-64 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-3 z-10 space-y-4 ${isOpen ? 'animate-popover-enter' : 'animate-popover-leave'}`}
          role="menu"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Chủ đề</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200 dark:bg-slate-900/50 rounded-lg">
                <button onClick={() => setTheme('light')} className={getButtonClass(theme === 'light')}>Sáng</button>
                <button onClick={() => setTheme('dark')} className={getButtonClass(theme === 'dark')}>Tối</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Phông chữ</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200 dark:bg-slate-900/50 rounded-lg">
               {fontOptions.map(f => (
                 <button key={f.key} onClick={() => setFont(f.key)} className={getButtonClass(font === f.key)}>{f.name}</button>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const style = document.createElement('style');
style.innerHTML = `
    @keyframes popover-enter {
        from { opacity: 0; transform: translateY(-5px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes popover-leave {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(5px) scale(0.95); }
    }
    .animate-popover-enter {
        animation: popover-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        transform-origin: top right;
    }
    .animate-popover-leave {
        animation: popover-leave 0.15s ease-in forwards;
        transform-origin: top right;
    }
`;
document.head.appendChild(style);