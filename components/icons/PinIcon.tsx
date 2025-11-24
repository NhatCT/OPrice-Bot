import React from 'react';

export const PinIcon: React.FC<{ className?: string; isFilled?: boolean }> = ({ className, isFilled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={isFilled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    className={className}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9.75v8.066l-2.541-1.27a.75.75 0 00-.934 1.258l3.36 1.679a.75.75 0 00.934 0l3.36-1.679a.75.75 0 00-.934-1.258L12 17.816V9.75m-4.5-4.5a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z"
    />
  </svg>
);