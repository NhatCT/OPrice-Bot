import React from 'react';

export const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        aria-hidden="true"
    >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6v2H5v11h11v-6h2Z" />
        <path d="M15 3h6v6h-2V5h-4V3Z" />
        <path d="M10 14 20 4l-1.4-1.4L9 12.6 10 14Z" />
    </svg>
);