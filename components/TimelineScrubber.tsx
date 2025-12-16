
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MediaItem } from '../types';

interface TimelineScrubberProps {
  items: MediaItem[];
  onScrollToItem: (index: number) => void;
}

const TimelineScrubber: React.FC<TimelineScrubberProps> = ({ items, onScrollToItem }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Refs for auto-scrolling the timeline itself
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Generate markers based on date/time distribution
  const markers = useMemo(() => {
    if (items.length === 0) return [];

    const result: { index: number; label: string; type: 'DATE' | 'TIME' | 'TICK' }[] = [];
    let lastDate = '';
    
    items.forEach((item, idx) => {
      if (!item.date) return;

      try {
          const d = new Date(item.date);
          if (isNaN(d.getTime())) return;

          const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          
          const isNewDay = dateStr !== lastDate;
          
          const lastMarkerIndex = result.length > 0 ? result[result.length - 1].index : -100;
          const dist = idx - lastMarkerIndex;

          if (isNewDay) {
             // Major Marker: Date change
             result.push({ index: idx, label: dateStr, type: 'DATE' });
             lastDate = dateStr;
          } else {
             // Determine density based on distance
             if (dist >= 3) { // Create a tick every ~3 items for high density
                 const isTimeMarker = dist > 20; // Only show time label every ~20 items
                 result.push({ 
                    index: idx, 
                    label: timeStr, 
                    type: isTimeMarker ? 'TIME' : 'TICK' 
                 });
             }
          }
      } catch (e) {
          // Fallback if date parsing fails
      }
    });

    return result;
  }, [items]);

  // Main Page Scroll Spy Logic
  useEffect(() => {
    const handleScroll = () => {
      const scanLine = window.innerHeight * 0.4; 
      let foundIndex = 0;
      
      for (let i = markers.length - 1; i >= 0; i--) {
          const m = markers[i];
          const el = document.getElementById(`gallery-item-${m.index}`);
          if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top < scanLine) {
                  foundIndex = i;
                  break;
              }
          }
      }
      setActiveIndex(foundIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Init
    return () => window.removeEventListener('scroll', handleScroll);
  }, [markers]);

  // Auto-scroll the timeline container to keep active index in view
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
        if (hoveredIndex === null) {
            activeItemRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    }
  }, [activeIndex, hoveredIndex]);

  if (items.length < 10) return null;

  return (
    <div className="fixed right-0 top-40 bottom-0 z-30 flex flex-col items-end pointer-events-none pr-1">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
      
      {/* 
         Scrollable Container 
         - top-40 to avoid header overlap (increased for mobile)
         - bottom-0 to flush with bottom of screen
         - maskImage improved to be cleaner
      */}
      <div 
        ref={containerRef}
        className="relative flex flex-col items-end h-full overflow-y-auto scrollbar-hide pr-1 pointer-events-auto gap-[3px] py-4"
        style={{ maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)' }}
        onMouseEnter={() => setHoveredIndex(activeIndex)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        
        {markers.map((marker, i) => {
          const isActive = i === activeIndex;
          const isHovered = i === hoveredIndex;
          const isDate = marker.type === 'DATE';
          const isTime = marker.type === 'TIME';
          const isTick = marker.type === 'TICK';

          // Visual Styles
          let widthClass = 'w-1.5';
          let opacityClass = 'bg-white/20';
          
          if (isActive || isHovered) {
             widthClass = 'w-6';
             opacityClass = 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]';
          } else if (isDate) {
             widthClass = 'w-4';
             opacityClass = 'bg-white/60';
          } else if (isTime) {
             widthClass = 'w-3';
             opacityClass = 'bg-white/30';
          }

          return (
            <div 
                key={marker.index}
                ref={isActive ? activeItemRef : null}
                className="group flex items-center justify-end cursor-pointer h-1 min-h-[4px]"
                onMouseEnter={() => setHoveredIndex(i)}
                onClick={() => onScrollToItem(marker.index)}
            >
               {/* Label */}
               <div className={`
                  mr-3 px-2 py-0.5 rounded backdrop-blur-md border border-white/10 transition-all duration-200 origin-right whitespace-nowrap text-[10px] font-mono tracking-wider shadow-xl z-50
                  ${(isActive || isHovered || isDate) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}
                  ${isDate ? 'text-white bg-black/90 font-bold border-white/20' : 'text-gray-300 bg-black/80'}
               `}>
                  {marker.label}
               </div>

               {/* The Tick Line */}
               <div className={`
                  rounded-full transition-all duration-200 origin-right h-[1.5px]
                  ${widthClass} ${opacityClass}
                  group-hover:bg-white group-hover:w-6
               `}/>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineScrubber;
