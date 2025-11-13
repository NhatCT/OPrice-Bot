import React from 'react';

export const DocumentDuplicateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.16 12.84 9 12 9H5.25C4.41 9 3.75 8.16 3.75 7.312V5.25A1.875 1.875 0 0 1 5.625 3.375h1.875Z" />
    <path d="M11.25 6.375a.75.75 0 0 0-1.5 0v1.875c0 .621.504 1.125 1.125 1.125h1.125a.75.75 0 0 0 0-1.5H11.25V6.375Z" />
    <path d="M12.75 11.625a.75.75 0 0 0-1.5 0v6.375c0 .621.504 1.125 1.125 1.125h5.25c.621 0 1.125-.504 1.125-1.125V12a1.875 1.875 0 0 0-1.875-1.875h-5.25a.75.75 0 0 0-.75.75Z" />
  </svg>
);