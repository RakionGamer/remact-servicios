'use client';

import { useRef, useEffect } from 'react';

export function DoubleScrollContainer({ children }: { children: React.ReactNode }) {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  const handleTopScroll = () => {
    if (bottomScrollRef.current && topScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  // Prevenir que ambos disparen eventos infinitos (opcional pero buena práctica)
  // En la mayoría de casos el simple scrollLeft = ... no dispara el evento onScroll en el otro si el valor es el mismo.

  return (
    <div className="w-full relative">
      {/* Scrollbar superior falso */}
      <div 
        ref={topScrollRef} 
        onScroll={handleTopScroll}
        className="overflow-x-auto w-full custom-scrollbar print:hidden"
      >
        <div style={{ width: '210mm', height: '1px' }}></div>
      </div>

      {/* Contenedor real */}
      <div 
        ref={bottomScrollRef}
        onScroll={handleBottomScroll}
        className="overflow-x-auto w-full pb-4 custom-scrollbar"
      >
        {children}
      </div>
    </div>
  );
}
