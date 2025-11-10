import React from 'react';

export const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M10.5 3A2.25 2.25 0 0 0 8.25 5.25v.041a2.25 2.25 0 0 1-.22-.676A2.25 2.25 0 0 1 10.25 2.5h3.5a2.25 2.25 0 0 1 2.22 2.116A2.25 2.25 0 0 1 15.75 5.25v.041a2.25 2.25 0 0 1-.22-.676A2.25 2.25 0 0 1 13.75 2.5h-3.5ZM8.25 6.75a.75.75 0 0 0-1.5 0v10.5a.75.75 0 0 0 .75.75h10.5a.75.75 0 0 0 .75-.75V6.75a.75.75 0 0 0-1.5 0v10.5a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75V6.75Z" clipRule="evenodd" />
  </svg>
);