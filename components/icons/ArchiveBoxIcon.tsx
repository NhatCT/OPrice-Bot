import React from 'react';

export const ArchiveBoxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 0 0-1.5 0v11.25c0 .414.336.75.75.75h1.5v-12Zm19.5 0a.75.75 0 0 0-1.5 0v11.25c0 .414.336.75.75.75h1.5v-12ZM12 1.5a.75.75 0 0 1 .75.75v11.25a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 12 1.5ZM5.25 3.75a.75.75 0 0 0-1.5 0v10.5a.75.75 0 0 0 1.5 0V3.75ZM8.25 3.75a.75.75 0 0 0-1.5 0v10.5a.75.75 0 0 0 1.5 0V3.75ZM15.75 3.75a.75.75 0 0 0-1.5 0v10.5a.75.75 0 0 0 1.5 0V3.75ZM18.75 3.75a.75.75 0 0 0-1.5 0v10.5a.75.75 0 0 0 1.5 0V3.75Z" clipRule="evenodd" />
    <path d="M1.5 15.75a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H4.5a3 3 0 0 0-3 3v9.75ZM4.5 4.5h15a1.5 1.5 0 0 1 1.5 1.5v9.75a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.75V6A1.5 1.5 0 0 1 4.5 4.5Z" />
  </svg>
);