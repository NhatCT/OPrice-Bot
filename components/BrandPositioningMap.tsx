import React from 'react';

const brands = [
  // Low Price, Basic
  { name: 'YODY', x: -85, y: -70, style: 'bg-yellow-500 text-white font-bold px-3 py-1 text-sm' },
  { name: 'MUJI', x: -80, y: -5, style: 'bg-white text-[#454545] px-2 py-1 text-xs border border-gray-300' },
  { name: 'UNIQLO', x: -60, y: 10, style: 'bg-red-600 text-white font-bold p-2 text-sm' },

  // Low Price, Fashion
  { name: 'ROUTINE', x: -40, y: -40, style: 'bg-white text-black px-2 py-1 text-xs border border-gray-400' },
  { name: 'GENVIET', x: 0, y: -45, style: 'bg-[#920909] text-white font-bold px-2 py-1 text-xs' },
  { name: '#icon denim', x: 10, y: -55, style: 'bg-white text-black px-2 py-1 text-[10px] border border-gray-400' },
  { name: 'PT2000', x: 20, y: -65, style: 'bg-white text-black px-2 py-1 text-[10px] border border-gray-400' },

  // Mid Price
  { name: 'ZARA', x: -10, y: 20, style: 'text-black dark:text-white font-extrabold text-2xl tracking-tighter' },
  { name: 'Levi\'s', x: -30, y: 40, style: 'bg-red-600 text-white font-bold px-2 py-1 text-sm' },
  { name: 'Lee', x: -10, y: 40, style: 'text-black dark:text-white font-bold text-2xl' },
  { name: 'V-SIXTYFOUR', x: 30, y: 15, style: 'bg-[#393f60] text-white font-bold px-4 py-3 text-lg scale-110 shadow-lg ring-2 ring-offset-4 ring-offset-[#f0e6d6] dark:ring-offset-slate-800 ring-blue-500' },
  { name: 'Calvin Klein Jeans', x: 35, y: 55, style: 'text-black dark:text-white font-semibold text-sm' },

  // High Price, Fashion
  { name: 'GUESS', x: 40, y: 70, style: 'bg-white text-black border-2 border-black px-2 py-1 text-xs' },
  { name: 'VERSACE', x: 55, y: 80, style: 'text-black dark:text-white font-serif text-xs tracking-widest' },
  { name: 'GUCCI', x: 50, y: 95, style: 'text-black dark:text-white font-serif tracking-widest text-sm' },
  { name: 'LOUIS VUITTON', x: 70, y: 98, style: 'text-black dark:text-white font-serif text-2xl tracking-tighter' },
  { name: 'DSQUARED2', x: 75, y: 85, style: 'text-black dark:text-white font-sans font-bold text-sm' },
  { name: 'DIESEL', x: 90, y: 88, style: 'bg-red-600 text-white font-bold px-3 py-1' },
];

export const BrandPositioningMap: React.FC = () => {
  return (
    <div className="my-4">
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3 text-center">Sơ đồ Định vị Thương hiệu</h3>
      <div className="relative w-full max-w-4xl mx-auto aspect-[1.6] bg-[#f0e6d6] dark:bg-slate-800/50 rounded-lg p-8 font-serif text-black dark:text-white border border-slate-200 dark:border-slate-700">
        {/* Axes */}
        <div className="absolute top-1/2 left-4 right-4 h-px bg-black/60 dark:bg-white/60 -translate-y-1/2"></div>
        <div className="absolute left-1/2 top-4 bottom-4 w-px bg-black/60 dark:bg-white/60 -translate-x-1/2"></div>

        {/* Axis Arrows */}
        <div className="absolute top-1/2 right-2 -translate-y-1/2 text-black/60 dark:text-white/60">▶</div>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-black/60 dark:text-white/60">▲</div>

        {/* Axis Labels */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 -mt-2 text-sm font-semibold tracking-widest">HIGH PRICE</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 mb-1 text-sm font-semibold tracking-widest">LOW PRICE</div>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 -ml-2 text-sm font-semibold tracking-widest -rotate-90 origin-bottom-left">BASIC</div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold tracking-widest">FASHION</div>

        {/* Brand Logos */}
        {brands.map((brand) => (
          <div
            key={brand.name}
            className={`absolute flex items-center justify-center rounded-sm ${brand.style}`}
            style={{
              left: `calc(50% + ${brand.x * 0.45}%)`,
              top: `calc(50% - ${brand.y * 0.45}%)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {brand.name}
          </div>
        ))}
      </div>
    </div>
  );
};