import React from 'react';

export const PaperclipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M15.04 4.94a.75.75 0 0 0-1.06 1.06l5.22 5.22a2.5 2.5 0 0 1-3.54 3.54l-6.88-6.88a4 4 0 1 1 5.66-5.66l6.18 6.18a.75.75 0 1 1-1.06 1.06l-6.18-6.18a2.5 2.5 0 0 0-3.54-3.54l-6.88 6.88a5.5 5.5 0 0 0 7.78 7.78l6.18-6.18a.75.75 0 0 1 1.06 1.06l-6.18 6.18a7 7 0 0 1-9.9-9.9l6.88-6.88a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
  </svg>
);
