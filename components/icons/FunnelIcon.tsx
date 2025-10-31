import React from 'react';

export const FunnelIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M3.75 3A1.5 1.5 0 0 0 2.25 4.5v.75a.75.75 0 0 0 1.5 0v-.75A.75.75 0 0 1 4.5 3h15a.75.75 0 0 1 .75.75v.75a.75.75 0 0 0 1.5 0v-.75A1.5 1.5 0 0 0 20.25 3h-16.5Z" clipRule="evenodd" />
    <path d="M11.03 8.355a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.28-.53v-3.47l-3.22 3.22a.75.75 0 0 1-1.06-1.06l3.22-3.22H3.75a.75.75 0 0 1 0-1.5h6.53L7 10.465a.75.75 0 0 1 1.06-1.06l3.22 3.22V8.885a.75.75 0 0 1 .75-.53Z" />
  </svg>
);