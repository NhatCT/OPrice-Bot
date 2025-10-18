import React from 'react';

export const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M8.25 4.5a3.75 3.75 0 0 1 7.5 0v4.5a3.75 3.75 0 0 1-7.5 0V4.5Z" />
    <path d="M6 10.5a.75.75 0 0 1 .75.75v.75a4.5 4.5 0 0 0 9 0V11.25a.75.75 0 0 1 1.5 0v.75a6 6 0 0 1-12 0V11.25A.75.75 0 0 1 6 10.5Z" />
    <path d="M12 15a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 12 15Z" />
    <path fillRule="evenodd" d="M9 18a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5H9Z" clipRule="evenodd" />
  </svg>
);