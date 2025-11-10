

import React from 'react';

export const WorkflowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M15 3a3 3 0 0 0-3 3v2.25a.75.75 0 0 0 1.5 0V6a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h1.5Z" />
    <path d="M8.25 12a3 3 0 0 0-3 3v2.25a.75.75 0 0 0 1.5 0V15a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-3a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3h1.5Z" />
    <path d="M12.75 9.015a.75.75 0 0 0-1.5 0v5.97a.75.75 0 0 0 1.5 0v-5.97Z" />
    <path d="M6.75 7.5a.75.75 0 0 0-1.5 0v8.25a.75.75 0 0 0 1.5 0V7.5Z" />
    <path d="M18.75 7.5a.75.75 0 0 0-1.5 0v8.25a.75.75 0 0 0 1.5 0V7.5Z" />
  </svg>
);