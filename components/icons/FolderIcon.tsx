import React from 'react';

export const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M19.5 21a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3h-4.5a3 3 0 0 0-2.598-1.5H7.5a3 3 0 0 0-3 3v1.5H19.5v3h-2.25a3 3 0 0 0-3 3v1.5H4.5a3 3 0 0 0-3 3V21a.75.75 0 0 0 .75.75h14.25a.75.75 0 0 0 .75-.75h-1.5Zm-1.5-3a1.5 1.5 0 0 0-1.5-1.5h-1.5a1.5 1.5 0 0 0-1.5 1.5v1.5h4.5v-1.5Z" />
  </svg>
);