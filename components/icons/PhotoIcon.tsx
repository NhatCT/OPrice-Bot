import React from 'react';

export const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.928l-2.002-2.002a.75.75 0 0 0-1.06 0L9 12.56l-1.22-1.22a.75.75 0 0 0-1.06 0L2.5 15.561V11.06a.75.75 0 0 0-1 0Z" clipRule="evenodd" />
    <path d="M10 7a.75.75 0 0 0-1.5 0v.546l.75.75.75-.75V7Z" />
    <path fillRule="evenodd" d="M9.25 7.5a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75h-.01a.75.75 0 0 1-.75-.75V7.5ZM10 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" clipRule="evenodd" />
  </svg>
);