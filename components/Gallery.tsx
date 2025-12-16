
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MediaItem, MediaType } from '../types';
import { PlayCircle, AlertCircle } from 'lucide-react';
import { getThumbnailUrl } from '../services/imageOptimizer';
import TimelineScrubber from './TimelineScrubber';

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
      if (width >= 1536) setColumns(6); // 2xl
      else if (width >= 1280) setColumns(5); // xl
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
      { rootMargin: '800px' } 
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
  const columns = useMemo(() => {
    type ItemWithIndex = { item: MediaItem; originalIndex: number };
    const cols: ItemWithIndex[][] = Array.from({ length: columnCount }, () => []);
    
    visibleItems.forEach((item, index) => {
      cols[index % columnCount].push({ item, originalIndex: index });
    });
    
    return cols;
  }, [visibleItems, columnCount]);

  const scrollToItem = (index: number) => {
    // If the item isn't rendered yet (because of infinite scroll), 
    // we would ideally load it, but for simplicity in this masonry layout,
    // we clamp to what is visible or just try to find it.
    
    // Ensure the item is within the "visible" range roughly
    // In a real infinite scroll, we'd need to force expand visibleCount
    if (index >= visibleCount) {
        setVisibleCount(Math.min(index + 50, items.length));
        // Give React a frame to render
        setTimeout(() => {
            const el = document.getElementById(`gallery-item-${index}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    } else {
        const el = document.getElementById(`gallery-item-${index}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="w-full pb-32 relative pr-12 md:pr-20 transition-all duration-300">
      
      {/* Visual Timeline Scrubber - Now passing ALL items */}
      <TimelineScrubber items={items} onScrollToItem={scrollToItem} />

      <div className="flex gap-4 md:gap-6 items-start">
        {columns.map((colItems, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col gap-4 md:gap-6 min-w-0">
            {colItems.map(({ item, originalIndex }) => (
              <GalleryItem 
                key={item.id} 
                id={`gallery-item-${originalIndex}`}
                item={item} 
                onClick={() => onItemClick(originalIndex)} 
              />
            ))}
          </div>
        ))}
      </div>
      
      {visibleCount < items.length && (
        <div ref={loaderRef} className="h-32 flex items-center justify-center w-full mt-12 opacity-50">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

interface GalleryItemProps {
    item: MediaItem;
    onClick: () => void;
    id: string;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ item, onClick, id }) => {
  const [imgSrc, setImgSrc] = useState(
    item.type === MediaType.IMAGE ? getThumbnailUrl(item.url) : item.url
  );
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = () => {
    if (imgSrc.includes('wsrv.nl')) {
      setImgSrc(item.url);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className="group relative w-full bg-rev-surface rounded-[2rem] overflow-hidden cursor-zoom-in transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl hover:z-10"
    >
      {item.type === MediaType.IMAGE ? (
        hasError ? (
          <div className="w-full aspect-square flex flex-col items-center justify-center text-gray-700 p-2 text-center bg-rev-surfaceHighlight">
            <AlertCircle size={24} className="mb-2 opacity-30 text-white"/>
          </div>
        ) : (
          <div className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0 bg-rev-surfaceHighlight h-64'}`}>
            <img
              src={imgSrc}
              alt={item.name}
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
              onError={handleError}
              className="w-full h-auto object-cover"
              style={{ display: 'block' }} 
            />
          </div>
        )
      ) : (
        <div className="w-full aspect-video flex items-center justify-center bg-gray-900 relative">
          <video src={item.url} className="w-full h-full object-cover opacity-60" muted />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlayCircle className="h-8 w-8 text-white fill-white" />
             </div>
          </div>
        </div>
      )}

      {/* Modern Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
         <div className="absolute bottom-4 left-4 right-4">
            <p className="text-sm font-bold text-white truncate">{item.name}</p>
            {item.size && <p className="text-[10px] text-gray-300 font-medium tracking-wide mt-0.5">{item.size}</p>}
         </div>
      </div>
    </div>
  );
};

export default Gallery;
