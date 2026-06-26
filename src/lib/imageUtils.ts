export type ImageGroupData = {
  tag: string;
  urls: string[];
};

export type ProcessedLayoutItem = {
  url: string;
  orientation: 'landscape' | 'portrait';
};

export type ProcessedGroup = {
  tag: string;
  layout: ProcessedLayoutItem[][];
};

export const processImagesLayout = async (imagenesData: any[]): Promise<ProcessedGroup[]> => {
  if (!imagenesData || imagenesData.length === 0) return [];

  // Backward compatibility: If it's a flat array of strings, wrap it in a default group
  const isFlatArray = typeof imagenesData[0] === 'string';
  const groups: ImageGroupData[] = isFlatArray 
    ? [{ tag: '', urls: imagenesData as string[] }]
    : (imagenesData as ImageGroupData[]);

  const processedGroups: ProcessedGroup[] = [];

  for (const group of groups) {
    if (!group.urls || group.urls.length === 0) continue;

    const imagesWithDim = await Promise.all(group.urls.map(url => new Promise<ProcessedLayoutItem>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ url, orientation: img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait' });
      img.onerror = () => resolve({ url, orientation: 'landscape' }); // fallback
      img.src = url;
    })));

    const layout: ProcessedLayoutItem[][] = [];
    let i = 0;
    while (i < imagesWithDim.length) {
      if (imagesWithDim[i].orientation === 'landscape') {
        layout.push([imagesWithDim[i]]);
        i++;
      } else {
        if (i + 1 < imagesWithDim.length && imagesWithDim[i+1].orientation === 'portrait') {
          layout.push([imagesWithDim[i], imagesWithDim[i+1]]);
          i += 2;
        } else {
          layout.push([imagesWithDim[i]]);
          i++;
        }
      }
    }

    processedGroups.push({ tag: group.tag, layout });
  }

  return processedGroups;
};
