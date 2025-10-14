import React from 'react';

export const PaletteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className}
        aria-hidden="true"
    >
        <path d="M12 2.25a.75.75 0 0 1 .75.75v2.012a8.938 8.938 0 0 1 6.132 2.442.75.75 0 0 1-.82 1.258A7.438 7.438 0 0 0 12.75 6.01V4.5a.75.75 0 0 1-.75-.75Z" />
        <path fillRule="evenodd" d="M12.75 18a.75.75 0 0 0-1.5 0v1.135a8.94 8.94 0 0 1-6.121-2.433.75.75 0 1 0-.82-1.258 10.44 10.44 0 0 0 7.691 2.846V18ZM13.5 3.844a10.44 10.44 0 0 0-7.691 2.846.75.75 0 1 0 .82 1.258A8.94 8.94 0 0 1 12 6.818V3.844Z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M12 21.75a9.75 9.75 0 1 0 0-19.5 9.75 9.75 0 0 0 0 19.5ZM12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z" clipRule="evenodd" />
    </svg>
);