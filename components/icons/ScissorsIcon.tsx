import React from 'react';

export const ScissorsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M12 9a3 3 0 0 0-3 3 1 1 0 0 1-2 0 5 5 0 0 1 5-5 .75.75 0 0 1 0 1.5A3.5 3.5 0 0 0 12 9Z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M12 15a3 3 0 0 0 3-3 1 1 0 1 1 2 0 5 5 0 0 1-5 5 .75.75 0 0 1 0-1.5A3.5 3.5 0 0 0 12 15Z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0V3ZM12 19.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM3 12.75a.75.75 0 0 0 0-1.5H1.5a.75.75 0 0 0 0 1.5H3ZM22.5 12a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM6.31 6.31a.75.75 0 0 0 1.06-1.06L6.31 4.185a.75.75 0 0 0-1.06 1.06L6.31 6.31ZM4.185 18.78a.75.75 0 0 0 1.06 1.06L6.31 18.78a.75.75 0 0 0-1.06-1.06L4.185 18.78ZM18.78 6.31a.75.75 0 0 0-1.06-1.06L16.655 6.31a.75.75 0 0 0 1.06 1.06L18.78 6.31ZM17.719 18.78a.75.75 0 0 0-1.06 1.06l1.06-1.06a.75.75 0 0 0-1.06 1.06l1.06 1.06a.75.75 0 0 0 1.06-1.06L17.72 18.78Z" clipRule="evenodd" />
  </svg>
);
