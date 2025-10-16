import React from 'react';

export const BeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M11.25 3.375A3.375 3.375 0 0 0 7.875 0h-1.5A3.375 3.375 0 0 0 3 3.375c0 1.621.934 3.026 2.25 3.797V18a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7.172c1.316-.77 2.25-2.176 2.25-3.797A3.375 3.375 0 0 0 17.625 0h-1.5A3.375 3.375 0 0 0 12.75 3.375h-1.5Z" />
    <path fillRule="evenodd" d="M12.75 6a.75.75 0 0 0-1.5 0v1.875a.75.75 0 0 0 1.5 0V6ZM9.75 12a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3Zm3 0a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3Zm3 0a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3Z" clipRule="evenodd" />
  </svg>
);