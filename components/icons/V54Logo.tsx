import React from 'react';

// TODO: The filename and component name (V54Logo) seem to have a typo and should be V64Logo.
// Renaming component to match filename for consistency and to avoid potential import issues.
export const V54Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="V64 Logo"
  >
    <defs>
      <linearGradient id="v64-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#0ea5e9' }} /> 
        <stop offset="100%" style={{ stopColor: '#3b82f6' }} />
      </linearGradient>
    </defs>
    <path
      d="M50 2.5 C 23.75 2.5, 2.5 23.75, 2.5 50 S 23.75 97.5, 50 97.5 S 97.5 76.25, 97.5 50 S 76.25 2.5, 50 2.5 Z M 50 10 C 72.09 10, 90 27.91, 90 50 S 72.09 90, 50 90 S 10 72.09, 10 50 S 27.91 10, 50 10 Z"
      fill="url(#v64-grad)"
    />
    <text
      x="50%"
      y="58%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontSize="40"
      fontWeight="bold"
      fill="white"
      fontFamily="sans-serif"
    >
      V64
    </text>
  </svg>
);