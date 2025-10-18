import React from 'react';

export const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path fillRule="evenodd" d="M1.5 5.25A2.25 2.25 0 0 1 3.75 3h12.5A2.25 2.25 0 0 1 18.5 5.25v9.5A2.25 2.25 0 0 1 16.25 17H3.75A2.25 2.25 0 0 1 1.5 14.75v-9.5Zm2.25-.25a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75v-9.5a.75.75 0 0 0-.75-.75H3.75Z" clipRule="evenodd" />
  </svg>
);