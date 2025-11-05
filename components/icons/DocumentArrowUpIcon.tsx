import React from 'react';

export const DocumentArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path fillRule="evenodd" d="M5.625 1.5H9a2.25 2.25 0 0 1 2.25 2.25v1.5a.75.75 0 0 1-1.5 0V3.75a.75.75 0 0 0-.75-.75H5.625a.75.75 0 0 0-.75.75v16.5a.75.75 0 0 0 .75.75h12.75a.75.75 0 0 0 .75-.75V12a.75.75 0 0 1 1.5 0v7.125A2.25 2.25 0 0 1 18.375 21H5.625A2.25 2.25 0 0 1 3.375 18.75V3.375A2.25 2.25 0 0 1 5.625 1.5ZM12 18a.75.75 0 0 1-.75-.75V11.06l-1.72 1.72a.75.75 0 0 1-1.06-1.06l3-3a.75.75 0 0 1 1.06 0l3 3a.75.75 0 1 1-1.06 1.06l-1.72-1.72v6.19a.75.75 0 0 1-.75.75Z" clipRule="evenodd" />
    <path d="M14.25 3.375A2.25 2.25 0 0 0 12 1.125h-1.5a2.25 2.25 0 0 0-2.25 2.25v1.5c0 .621.504 1.125 1.125 1.125h3.75c.621 0 1.125-.504 1.125-1.125v-1.5Z" />
  </svg>
);