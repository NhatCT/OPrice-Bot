import React from 'react';

export const TextSizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className}
        aria-hidden="true"
    >
        <path d="M5.25 12.563A2.625 2.625 0 1 1 10.5 12.563V18a.75.75 0 0 1-1.5 0V7.81a.75.75 0 0 1 1.5 0V12.563Zm8.375-3.313a.75.75 0 0 1 .75.75v8.25a.75.75 0 0 1-1.5 0V10a.75.75 0 0 1 .75-.75Z" />
        <path d="M12 2.25a.75.75 0 0 1 .75.75v18a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Z" />
    </svg>
);