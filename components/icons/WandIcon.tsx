import React from 'react';

export const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className}
        aria-hidden="true"
    >
        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.981A10.501 10.501 0 0 1 18 16.5a10.5 10.5 0 0 1-10.5-10.5c0-1.25.22-2.454.622-3.568a.75.75 0 0 1 .806-.316Z" clipRule="evenodd" />
        <path d="M5.25 7.5A2.25 2.25 0 0 0 3 9.75v3A2.25 2.25 0 0 0 5.25 15h3A2.25 2.25 0 0 0 10.5 12.75v-3A2.25 2.25 0 0 0 8.25 7.5h-3ZM6.75 12a1 1 0 0 0 0-2H5.75a1 1 0 1 0 0 2h1Z" />
    </svg>
);