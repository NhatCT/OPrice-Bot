import React from 'react';

export const TableCellsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M4.5 3A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3h-15Zm0 9v6A.75.75 0 0 0 5.25 20.25h13.5a.75.75 0 0 0 .75-.75v-6h-15Zm0-1.5h15V4.5a.75.75 0 0 0-.75-.75h-13.5A.75.75 0 0 0 4.5 4.5v6Z" clipRule="evenodd" />
  </svg>
);