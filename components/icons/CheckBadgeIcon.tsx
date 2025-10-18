import React from 'react';

export const CheckBadgeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.548c.996.997 1.549 2.345 1.549 3.842V12a4.49 4.49 0 0 1-1.549 3.397 4.49 4.49 0 0 1-1.548 3.498 4.491 4.491 0 0 1-3.842 1.549H12a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.548 4.491 4.491 0 0 1-1.549-3.842V12a4.49 4.49 0 0 1 1.549-3.397 4.49 4.49 0 0 1 1.548-3.498ZM10.378 13.878a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0-1.06-1.06l-2.47 2.47-1.47-1.47a.75.75 0 0 0-1.06 1.06l2 2Z" clipRule="evenodd" />
  </svg>
);