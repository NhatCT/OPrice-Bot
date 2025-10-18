import React from 'react';

export const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className}
        aria-hidden="true"
    >
        <path d="M10.5 1.875a1.875 1.875 0 0 0-1.875 1.875V6h3V3.75A1.875 1.875 0 0 0 10.5 1.875Z" />
        <path d="M13.5 1.875a1.875 1.875 0 0 1 1.875 1.875V6h-3V3.75A1.875 1.875 0 0 1 13.5 1.875Z" />
        <path fillRule="evenodd" d="M3 7.5A2.25 2.25 0 0 1 5.25 5.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V7.5Zm15 1.5h-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-1.5A1.5 1.5 0 0 0 12 6v3H6v9.75A.75.75 0 0 0 6.75 18h10.5a.75.75 0 0 0 .75-.75V9Z" clipRule="evenodd" />
    </svg>
);
