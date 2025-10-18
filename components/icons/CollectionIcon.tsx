import React from 'react';

export const CollectionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M4.5 2.25a.75.75 0 0 0 0 1.5v16.5a.75.75 0 0 0 1.5 0V3.75a.75.75 0 0 0-1.5 0Z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M8.625 2.25a.75.75 0 0 0 0 1.5v16.5a.75.75 0 0 0 1.5 0V3.75a.75.75 0 0 0-1.5 0Z" clipRule="evenodd" />
    <path d="M12 2.25a.75.75 0 0 1 .75.75v16.5a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 12 2.25Z" />
    <path d="M16.5 3.75a.75.75 0 0 0-1.5 0v16.5a.75.75 0 0 0 1.5 0V3.75Z" />
    <path fillRule="evenodd" d="M20.25 3.75a.75.75 0 0 0-1.5 0v16.5a.75.75 0 0 0 1.5 0V3.75Z" clipRule="evenodd" />
  </svg>
);
