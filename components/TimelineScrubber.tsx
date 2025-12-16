
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MediaItem } from '../types';

interface TimelineScrubberProps {
  items: MediaItem[];
  onScrollToItem: (index: number) => void;
}

interface Marker {
    index: number;
    type: 'MAJOR' | 'MEDIUM' | 'MINOR';
    label: string;
    defaultVisible: boolean; 
}

const TimelineScrubber: React.FC<TimelineScrubberProps> = ({ items, onScrollToItem }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [topOffset, setTopOffset] = useState(150); 
  
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Dynamic Header Height
  useEffect(() => {
    const updatePosition = () => {
      const header = document.getElementById('app-header');
      if (header) {
        setTopOffset(header.offsetHeight + 16);
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    const headerEl = document.getElementById('app-header');
    let observer: ResizeObserver | null = null;
    if (headerEl) {
        observer = new ResizeObserver(updatePosition);
        observer.observe(headerEl);
    }

    return () => {
        window.removeEventListener('resize', updatePosition);
        if (observer) observer.disconnect();
    };
  }, [items]);

  // Generate markers with persistent data
  const markers = useMemo(() => {
    if (items.length === 0) return [];

    const total = items.length;
    // Determine sampling step to keep DOM light if huge list, 
    // but try to keep 1:1 for precision if < 3000
    const step = total > 3000 ? 2 : 1;
    
    const result: Marker[] = [];

    // Geometric Keys (First, Last, Middle, Quarters)
    const geometricKeys = new Set<number>();
    geometricKeys.add(0);
    geometricKeys.add(total - 1);
    geometricKeys.add(Math.floor(total * 0.5));
    geometricKeys.add(Math.floor(total * 0.25));
    geometricKeys.add(Math.floor(total * 0.75));

    let lastDateStr = '';
    let lastLabelIndex = -100; // Track visual density
    
    for (let i = 0; i < total; i += step) {
        const item = items[i];
        let type: 'MAJOR' | 'MEDIUM' | 'MINOR' = 'MINOR';
        
        // Extract Date/Time
        let dateStr = '';
        let timeStr = '';
        let fullDateStr = '';

        if (item.date) {
             const d = new Date(item.date);
             if (!isNaN(d.getTime())) {
                dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                fullDateStr = dateStr;
             }
        }

        // Detect Date Change (New Day)
        const isDateChange = fullDateStr && fullDateStr !== lastDateStr;
        if (isDateChange) lastDateStr = fullDateStr;

        // --- Priority Logic (Determines Visual Weight) ---

        if (geometricKeys.has(i) || isDateChange) {
            type = 'MAJOR';
        } else if ((i - lastLabelIndex) > 15) { 
             type = 'MEDIUM';
        }

        // --- Label Calculation ---
        // CRITICAL FIX: Always calculate the best label for this item, 
        // even if we decide not to show it by default.
        // This ensures when you scroll over a "minor" tick, it still knows what time it is.
        let label = isDateChange ? dateStr : timeStr;
        
        // Fallback for missing dates
        if (!label) label = item.name.substring(0, 10);

        // --- Visibility Logic (Anti-Crowding) ---
        // We only "hide" the default visibility, we do NOT delete the label data.
        let defaultVisible = false;

        if (type !== 'MINOR') {
            const dist = i - lastLabelIndex;
            const isGeometric = geometricKeys.has(i);

            // If we are Major/Medium but too close to previous visible label
            if (dist < 4 && !isGeometric) {
                 // Downgrade visual style to minor to avoid clutter
                 type = 'MINOR';
                 defaultVisible = false;
            } else {
                 // It's far enough, show it
                 defaultVisible = true;
                 lastLabelIndex = i;
            }
        }

        result.push({ index: i, type, label, defaultVisible });
    }

    return result;
  }, [items]);

  // Scroll Spy
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
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, [markers]);

  // Auto-scroll timeline
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

  if (items.length < 5) return null;

  return (
    <div 
      className="fixed right-0 bottom-0 z-30 flex flex-col items-end pointer-events-none transition-[top] duration-300 ease-out"
      style={{ top: `${topOffset}px` }}
    >
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
      
      {/* Container - Widened (w-24) to prevent clipping and reduced gradient opacity */}
      <div 
        ref={containerRef}
        className="relative flex flex-col items-end h-full overflow-y-auto scrollbar-hide pr-1 pointer-events-auto gap-[1px] py-4 w-24 hover:w-28 transition-all duration-300 bg-gradient-to-l from-black/30 to-transparent"
        style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)' }}
        onMouseEnter={() => setHoveredIndex(activeIndex)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        
        {markers.map((marker, i) => {
          const isActive = i === activeIndex;
          const isHovered = i === hoveredIndex;
          
          const isMajor = marker.type === 'MAJOR';
          const isMedium = marker.type === 'MEDIUM';

          // --- RULER STYLING ---
          
          let widthClass = 'w-1.5'; // Minor
          let bgClass = 'bg-white/20';

          if (isMajor) {
             widthClass = 'w-6';
             bgClass = 'bg-white/90 shadow-[0_0_4px_rgba(255,255,255,0.4)]';
          } else if (isMedium) {
             widthClass = 'w-3';
             bgClass = 'bg-white/50';
          }

          // Active State Overrides (The Needle)
          if (isActive) {
             widthClass = 'w-8'; 
             bgClass = 'bg-rev-accent shadow-[0_0_8px_rgba(59,130,246,1)]';
          } else if (isHovered) {
             bgClass = 'bg-white';
          }

          // Show Label Conditions:
          // 1. Is it a major/medium tick that is visible by default?
          // 2. Is it the currently Active item (scrolled to)?
          // 3. Is it currently hovered by the mouse?
          const showLabel = marker.defaultVisible || isActive || isHovered;

          return (
            <div 
                key={marker.index}
                ref={isActive ? activeItemRef : null}
                className="group flex items-center justify-end cursor-pointer h-2 min-h-[4px] w-full relative" 
                onMouseEnter={() => setHoveredIndex(i)}
                onClick={() => onScrollToItem(marker.index)}
            >
               {/* Label - Reduced spacing: right-10 instead of right-12 */}
               <div className={`
                  absolute right-10 px-1.5 py-0.5 rounded backdrop-blur-md transition-all duration-200 
                  text-[9px] font-mono font-bold tracking-tight shadow-lg whitespace-nowrap border border-white/10
                  ${showLabel ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}
                  ${isActive ? 'bg-rev-accent text-white border-transparent scale-110 z-50' : 'bg-black/70 text-gray-300'}
               `}>
                  {marker.label}
               </div>

               {/* Line */}
               <div className={`
                  rounded-l-sm transition-all duration-200 ease-out
                  h-[1.5px]
                  ${widthClass} 
                  ${bgClass}
                  ${isActive ? 'h-[2px]' : ''}
               `}/>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineScrubber;
