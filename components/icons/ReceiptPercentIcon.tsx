import React from 'react';

export const ReceiptPercentIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 20 20" 
        fill="currentColor" 
        className={className}
        aria-hidden="true"
    >
        <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.443 6.443 0 0 1 3.278 0l1.12 2.367a.75.75 0 0 0 1.342-.638V2.75a.75.75 0 0 0-1.5 0v7.68l-1.12-2.367a6.443 6.443 0 0 1-3.278 0L3.5 10.408V2.75Z" />
        <path d="M12.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0V2.75Z" />
        <path d="M14 8.25a.75.75 0 0 0 0 1.5h.25a.75.75 0 0 0 0-1.5H14Z" />
        <path fillRule="evenodd" d="M14 5.25a1.75 1.75 0 1 0 3.5 0 1.75 1.75 0 0 0-3.5 0Zm1.75-1a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5Z" clipRule="evenodd" />
        <path d="M14.75 10.5a.75.75 0 0 1 .75-.75h.25a.75.75 0 0 1 0 1.5h-.25a.75.75 0 0 1-.75-.75Z" />
        <path fillRule="evenodd" d="M14 11.25a1.75 1.75 0 1 0 3.5 0 1.75 1.75 0 0 0-3.5 0Zm1.75-1a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5Z" clipRule="evenodd" />
    </svg>
);
