import React from 'react';

export const CalculatorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2.25a.75.75 0 0 1 .75.75v.033a11.25 11.25 0 0 1 3.53 1.623.75.75 0 0 1-.66 1.328 9.75 9.75 0 0 0-6.46 0 .75.75 0 0 1-.66-1.328A11.25 11.25 0 0 1 11.25 3.033V3a.75.75 0 0 1 .75-.75Z" />
    <path fillRule="evenodd" d="M3 10.875A1.875 1.875 0 0 1 4.875 9h14.25A1.875 1.875 0 0 1 21 10.875v8.25A1.875 1.875 0 0 1 19.125 21H4.875A1.875 1.875 0 0 1 3 19.125v-8.25ZM5.625 12.75a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Zm3.75 0a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Zm4.5 0a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Zm-8.25 3a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Zm3.75 0a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Zm3.75 0a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75Z" clipRule="evenodd" />
  </svg>
);
