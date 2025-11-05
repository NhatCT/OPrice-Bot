import React from 'react';

export const SwatchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071 1.052A3.75 3.75 0 0 1 15.75 9.75a.75.75 0 0 0 1.5 0A5.25 5.25 0 0 0 12.963 2.286Z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.75 9.75A2.25 2.25 0 0 0 7.5 12a2.25 2.25 0 0 0 2.25 2.25h.51a.75.75 0 0 1 0 1.5H9.75A3.75 3.75 0 0 1 6 12a3.75 3.75 0 0 1 3.75-3.75h.51a.75.75 0 0 1 0 1.5H9.75Z" clipRule="evenodd" />
  </svg>
);
