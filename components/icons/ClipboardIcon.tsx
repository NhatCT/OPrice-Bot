import React from 'react';

export const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M10.5 3A2.25 2.25 0 0 0 8.25 5.25v.041a2.25 2.25 0 0 1-.22-.676A2.25 2.25 0 0 1 10.25 2.5h3.5a2.25 2.25 0 0 1 2.22 2.116A2.25 2.25 0 0 1 15.75 5.291V5.25A2.25 2.25 0 0 0 13.5 3h-3Z" clipRule="evenodd" />
    <path d="M4.5 9.75A2.25 2.25 0 0 1 6.75 7.5v10.5a2.25 2.25 0 0 1-2.25 2.25h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 0 .75-.75V9.75Z" />
    <path fillRule="evenodd" d="M6.75 6.75A.75.75 0 0 1 7.5 6h9a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75V6.75Zm.75 10.5h9V7.5h-9v9.75Z" clipRule="evenodd" />
    <path d="M19.5 9.75A2.25 2.25 0 0 0 17.25 7.5v10.5a2.25 2.25 0 0 0 2.25 2.25h1.5a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 1-.75-.75V9.75Z" />
  </svg>
);