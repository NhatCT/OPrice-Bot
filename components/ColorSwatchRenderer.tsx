import React from 'react';

interface ColorSwatchRendererProps {
  text: string | null | undefined;
}

export const ColorSwatchRenderer: React.FC<ColorSwatchRendererProps> = ({ text }) => {
    if (!text) return null;

    // Ensure text is a string before splitting to prevent errors
    const safeText = String(text);

    // Regex to find hex codes (#RRGGBB or #RGB) with word boundaries
    const parts = safeText.split(/(#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b)/g);

    return (
        <>
            {parts.map((part, index) => {
                if (part && (part.match(/^#[0-9a-fA-F]{6}$/) || part.match(/^#[0-9a-fA-F]{3}$/))) {
                    return (
                        <span key={index} className="inline-flex items-center gap-1.5 align-middle mx-0.5 px-1.5 py-0.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-md">
                            <span
                                className="w-3.5 h-3.5 rounded-full block border border-white/50 shadow-sm"
                                style={{ backgroundColor: part }}
                            />
                            <code className="text-xs font-mono text-slate-600 dark:text-slate-300">{part}</code>
                        </span>
                    );
                }
                // Return plain text part, ensuring it's not empty/undefined
                return part || null;
            })}
        </>
    );
};