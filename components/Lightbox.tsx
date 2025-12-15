import React, { useState, useEffect, useCallback } from 'react';
import { MediaItem, MediaType } from '../types';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getFullScreenUrl } from '../services/imageOptimizer';

interface LightboxProps {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ items, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isImgLoading, setIsImgLoading] = useState(true);
  
  // We use the optimizer logic directly in the src now, but keep fallback state
  const [loadOriginal, setLoadOriginal] = useState(false);

  const currentItem = items[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsImgLoading(true);
      setLoadOriginal(false);
    }
  }, [currentIndex, items.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsImgLoading(true);
      setLoadOriginal(false);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [handleNext, handlePrev, onClose]);

  const getDisplayUrl = (item: MediaItem) => {
    if (item.type === MediaType.VIDEO) return item.url;
    // If we decided to load original (fallback) or if it's explicitly requested
    if (loadOriginal) return item.url;
    // Otherwise, serve high-quality WebP
    return getFullScreenUrl(item.url);
  };

  const handleError = () => {
    // If optimized version fails, fallback to original
    if (!loadOriginal) {
      setLoadOriginal(true);
    }
  };

  const downloadItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Always download the ORIGINAL file, not the WebP version
    window.open(currentItem.url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in touch-none">
      
      {/* Image Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden" onClick={onClose}>
        
        {isImgLoading && currentItem.type === MediaType.IMAGE && (
          <div className="absolute inset-0 flex items-center justify-center z-0">
             <div className="w-10 h-10 border-4 border-gray-800 border-t-yellow-400 rounded-full animate-spin"></div>
          </div>
        )}

        {currentItem.type === MediaType.VIDEO ? (
          <video 
            src={currentItem.url} 
            controls 
            autoPlay 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            key={currentItem.id} // Remount on change
            src={getDisplayUrl(currentItem)}
            alt={currentItem.name}
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isImgLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsImgLoading(false)}
            onError={handleError}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Click Zones for Navigation */}
        {currentIndex > 0 && (
          <div onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer" />
        )}
        {currentIndex < items.length - 1 && (
          <div onClick={(e) => { e.stopPropagation(); handleNext(); }} className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer" />
        )}
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
         <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white/90">
            {currentIndex + 1} / {items.length}
         </div>
         <button onClick={onClose} className="pointer-events-auto p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition">
            <X size={20} />
         </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 flex flex-col gap-4 pointer-events-none">
        
        <div className="pointer-events-auto">
          <h3 className="text-white font-semibold text-shadow-sm truncate pr-4">{currentItem.name}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-300">
             <span>{currentItem.size || 'Taille inconnue'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pointer-events-auto">
          <button 
             onClick={downloadItem}
             className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-xl rounded-full text-white font-medium hover:bg-white/20 transition active:scale-95"
          >
             <Download size={18} />
             <span className="text-sm">Original</span>
          </button>
          
          <div className="flex gap-3">
             <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white disabled:opacity-30 hover:bg-white/20 active:scale-95 transition">
                <ChevronLeft size={24} />
             </button>
             <button onClick={handleNext} disabled={currentIndex === items.length - 1} className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white disabled:opacity-30 hover:bg-white/20 active:scale-95 transition">
                <ChevronRight size={24} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lightbox;