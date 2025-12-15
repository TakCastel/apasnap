import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MediaItem, MediaType } from '../types';
import { PlayCircle, AlertCircle } from 'lucide-react';
import { getThumbnailUrl } from '../services/imageOptimizer';

interface GalleryProps {
  items: MediaItem[];
  onItemClick: (index: number) => void;
}

const ITEMS_PER_PAGE = 48;

// Hook to calculate column count based on screen width
const useColumnCount = () => {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      // Breakpoints matching Tailwind (roughly)
      if (width >= 1280) setColumns(5); // xl
      else if (width >= 1024) setColumns(4); // lg
      else if (width >= 768) setColumns(3); // md
      else setColumns(2); // sm
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return columns;
};

const Gallery: React.FC<GalleryProps> = ({ items, onItemClick }) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const loaderRef = useRef<HTMLDivElement>(null);
  const columnCount = useColumnCount();

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [items]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, items.length));
        }
      },
      { rootMargin: '600px' } 
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [items.length]);

  const visibleItems = items.slice(0, visibleCount);

  // Distribute items into columns to enforce Left-to-Right order (Row by Row visual flow)
  // This prevents the "Vertical Column" filling issue of standard CSS Columns
  const columns = useMemo(() => {
    type ItemWithIndex = { item: MediaItem; originalIndex: number };
    const cols: ItemWithIndex[][] = Array.from({ length: columnCount }, () => []);
    
    visibleItems.forEach((item, index) => {
      cols[index % columnCount].push({ item, originalIndex: index });
    });
    
    return cols;
  }, [visibleItems, columnCount]);

  if (items.length === 0) return null;

  return (
    <div className="w-full pb-20">
      <div className="flex gap-4 items-start">
        {columns.map((colItems, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col gap-4 min-w-0">
            {colItems.map(({ item, originalIndex }) => (
              <GalleryItem 
                key={item.id} 
                item={item} 
                onClick={() => onItemClick(originalIndex)} 
              />
            ))}
          </div>
        ))}
      </div>
      
      {visibleCount < items.length && (
        <div ref={loaderRef} className="h-20 flex items-center justify-center w-full mt-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

const GalleryItem: React.FC<{ item: MediaItem; onClick: () => void }> = ({ item, onClick }) => {
  const [imgSrc, setImgSrc] = useState(
    item.type === MediaType.IMAGE ? getThumbnailUrl(item.url) : item.url
  );
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (imgSrc.includes('wsrv.nl')) {
      setImgSrc(item.url);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative w-full bg-rev-surface rounded-2xl overflow-hidden cursor-pointer border border-white/5 shadow-sm hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300 ease-out"
    >
      {item.type === MediaType.IMAGE ? (
        hasError ? (
          <div className="w-full aspect-square flex flex-col items-center justify-center text-gray-700 p-2 text-center bg-rev-surfaceHighlight">
            <AlertCircle size={20} className="mb-1 opacity-50"/>
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={item.name}
            loading="lazy"
            onError={handleError}
            className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            style={{ display: 'block' }} // Prevents bottom gap
          />
        )
      ) : (
        <div className="w-full aspect-video flex items-center justify-center bg-gray-800 relative">
          <video src={item.url} className="w-full h-full object-cover opacity-60" muted />
          <div className="absolute inset-0 flex items-center justify-center">
             <PlayCircle className="h-10 w-10 text-white drop-shadow-lg opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}

      {/* Revolut style gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
         <div className="absolute bottom-3 left-3 right-3 text-xs text-white truncate font-bold tracking-wide">
            {item.name}
         </div>
      </div>
    </div>
  );
};

export default Gallery;