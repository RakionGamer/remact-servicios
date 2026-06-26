'use client';

import { useState, useEffect } from 'react';
import { processImagesLayout, ProcessedGroup } from '@/lib/imageUtils';

export function PreviewImagesGrid({ imageUrls }: { imageUrls: any[] }) {
  const [groups, setGroups] = useState<ProcessedGroup[] | null>(null);

  useEffect(() => {
    if (imageUrls.length > 0) {
      processImagesLayout(imageUrls).then(setGroups);
    } else {
      setGroups([]);
    }
  }, [imageUrls]);

  if (!groups) return <div className="text-center text-zinc-500 py-4">Cargando imágenes...</div>;
  if (groups.length === 0) return null;

  return (
    <>
      <div className="mb-4 mt-4 border border-blue-600">
        <div className="bg-blue-600 text-white p-[5px] text-[10px] font-bold text-center uppercase">
          REGISTRO FOTOGRÁFICO
        </div>
        <div className="flex flex-col gap-0 print:break-before-page print:break-inside-auto">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="border-t border-blue-600 first:border-t-0">
            {group.tag && (
              <div className="border-b border-blue-600 bg-blue-50/50 p-2 text-[14px] font-bold text-blue-600 text-center uppercase tracking-wide print:break-after-avoid">
                {group.tag}
              </div>
            )}
            {group.layout.map((row, rIdx) => (
              <div key={rIdx} className="flex w-full print:break-inside-avoid border-b border-blue-600 last:border-b-0">
                {row.map((img, iIdx) => (
                  <div key={iIdx} className="p-2 flex-1 flex justify-center items-center w-full h-full border-r border-blue-600 last:border-r-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={img.url?.includes('cloudinary.com') ? img.url.replace('/upload/', '/upload/f_jpg/') : (img.url || '')} 
                      alt={`Imagen`} 
                      className="w-full max-h-[650px] object-contain"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
        </div>
      </div>
    </>
  );
}
