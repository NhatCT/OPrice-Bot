import React from "react";

const logoV64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB9AAAAIIAQMAAABMaB9UAAAABlBMVEUAAAC0lEgB0k/rAAAAAXRSTlMAQObYZgAAAI5JREFUeJztwQEBAAAAgiD/r25IQAEAAP//wD8I8IMAfwjwgwA/CPCDAD8I8IMAfwjwgwA/CPCDAD8I8IMAfwjwgwA/CPCDAD8I8IMAfwjwgwA/CPCDAD8I8IMAfwjwgwA/CPCDAD8I8IMAfwjwgwA/CPCDAD8I8IMAfwjwgwA/CPCDAD8I8IMAfwjwgwA/CPCDwF4AAS3sAwxkfN/mAAAAAElFTkSuQmCC`;

export const V64Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={`flex items-center justify-center rounded-lg bg-[#0B1221] ${className}`}
  >
    <img src={logoV64} alt="V-SIXTYFOUR Logo" className="w-full h-auto object-contain p-1" />
  </div>
);