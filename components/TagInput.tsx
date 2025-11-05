import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon';

interface TagInputProps {
  value: string[];
  onChange: (newValue: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}

export const TagInput: React.FC<TagInputProps> = ({ value, onChange, placeholder, suggestions = [] }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const addTag = (tag: string) => {
    const newTag = tag.trim();
    if (newTag && !value.includes(newTag)) {
      onChange([...value, newTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
  );

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="w-full flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-3 py-2 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 transition duration-300 border border-slate-300 dark:border-slate-600"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full px-2 py-0.5 animate-fade-in-fast">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              aria-label={`Xóa ${tag}`}
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent focus:outline-none min-w-[120px]"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg z-10 animate-popover-enter">
          <ul>
            {filteredSuggestions.map(suggestion => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className="w-full flex items-center justify-between text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                >
                  <span>{suggestion}</span>
                  <PlusIcon className="w-4 h-4 text-slate-400" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};