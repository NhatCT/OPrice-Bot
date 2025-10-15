import React from 'react';

export const QuestionMarkCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className}
        aria-hidden="true"
    >
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.84-.447-1.897-.447-2.736 0L10.5 8.25H9.75a.75.75 0 0 0 0 1.5h.443c.59 0 1.15.346 1.437.899l.287.553c.128.246.388.406.668.406h.286c.28 0 .54-.16.668-.406l.287-.553a1.714 1.714 0 0 1 1.437-.899h.443a.75.75 0 0 0 0-1.5h-.75v-.033l-.386-.791ZM12 15.75a.75.75 0 0 1 .75.75v.008c0 .414-.336.75-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008c0-.414.336-.75.75-.75Z" clipRule="evenodd" />
    </svg>
);
