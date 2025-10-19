
import React from 'react';

export const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-2 p-4">
    <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse"></div>
    <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
  </div>
);