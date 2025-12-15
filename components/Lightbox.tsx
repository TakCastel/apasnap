import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem, MediaType } from '../types';
import { X, ChevronLeft, ChevronRight, Download, Share2, Link2, Check, Twitter, Facebook } from 'lucide-react';
import { getFullScreenUrl } from '../services/imageOptimizer';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface LightboxProps {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ items, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isImgLoading, setIsImgLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  
  // Track current zoom scale to disable swipe when zoomed in
  const scaleRef = useRef(1);
  
  // Custom Swipe Logic refs
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // We use the optimizer logic directly in the src now, but keep fallback state
  const [loadOriginal, setLoadOriginal] = useState(false);

  const currentItem = items[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsImgLoading(true);
      setLoadOriginal(false);
      setShowShareMenu(false);
      scaleRef.current = 1; // Reset scale tracker
    }
  }, [currentIndex, items.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsImgLoading(true);
      setLoadOriginal(false);
      setShowShareMenu(false);
      scaleRef.current = 1; // Reset scale tracker
    }
  }, [currentIndex]);

  // Custom Swipe Handlers (Capture Phase)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only track single touch for swipe
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      touchStart.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    
    // If zoomed in significantly, don't swipe navigate
    if (scaleRef.current > 1.1) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStart.current.x - touchEndX;
    const diffY = touchStart.current.y - touchEndY;

    // Thresholds
    const minSwipeDistance = 50;
    const maxVerticalDistance = 80; // Allow some diagonal movement

    // Check if it's a horizontal swipe
    if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffY) < maxVerticalDistance) {
      if (diffX > 0) {
        // Swiped Left -> Next
        handleNext();
      } else {
        // Swiped Right -> Prev
        handlePrev();
      }
    }
    
    touchStart.current = null;
  };

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
    const link = document.createElement('a');
    link.href = currentItem.url;
    link.download = currentItem.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Use Native Share if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentItem.name,
          text: `Regarde cette photo : ${currentItem.name}`,
          url: currentItem.url,
        });
      } catch (err) {
        console.debug('Share cancelled or failed', err);
      }
    } else {
      // Toggle custom menu
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentItem.url);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    setShowShareMenu(false);
  };

  const openSocial = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in touch-none">
      
      {/* 
        Image Area 
        Includes custom Capture Phase listeners to handle swipe before children (zoom lib) consume events
      */}
      <div 
        className="flex-1 relative flex items-center justify-center overflow-hidden w-full h-full" 
        onClick={() => { setShowShareMenu(false); onClose(); }}
        onTouchStartCapture={handleTouchStart}
        onTouchEndCapture={handleTouchEnd}
      >
        
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
            className="max-w-full max-h-full object-contain z-10"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={5}
              centerOnInit={true}
              wheel={{ step: 0.2 }}
              onTransformed={(e) => {
                scaleRef.current = e.state.scale;
              }}
            >
              <TransformComponent 
                wrapperClass="!w-full !h-full" 
                contentClass="!w-full !h-full flex items-center justify-center"
              >
                <img
                  key={currentItem.id} // Remount on change to reset zoom
                  src={getDisplayUrl(currentItem)}
                  alt={currentItem.name}
                  className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isImgLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setIsImgLoading(false)}
                  onError={handleError}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>
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
          
          <div className="flex gap-3">
             <button 
                onClick={downloadItem}
                className="flex items-center justify-center h-12 w-12 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition active:scale-95"
                title="Télécharger"
             >
                <Download size={20} />
             </button>

             <div className="relative">
                <button 
                  onClick={handleShareClick}
                  className="flex items-center justify-center h-12 w-12 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition active:scale-95"
                  title="Partager"
                >
                  <Share2 size={20} />
                </button>

                {/* Share Menu Fallback for Desktop */}
                {showShareMenu && (
                  <div className="absolute bottom-full left-0 mb-3 bg-rev-surface border border-white/10 rounded-2xl shadow-xl overflow-hidden min-w-[200px] animate-slide-up flex flex-col p-1">
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 rounded-xl text-left transition-colors text-sm font-medium text-white"
                    >
                      {hasCopied ? <Check size={16} className="text-green-500"/> : <Link2 size={16}/>}
                      {hasCopied ? 'Lien copié !' : 'Copier le lien'}
                    </button>
                    <div className="h-px bg-white/10 mx-2 my-1"></div>
                    <button 
                      onClick={(e) => openSocial(e, `https://wa.me/?text=${encodeURIComponent(currentItem.url)}`)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 rounded-xl text-left transition-colors text-sm font-medium text-white"
                    >
                       <span className="font-bold text-green-500">WA</span> WhatsApp
                    </button>
                    <button 
                      onClick={(e) => openSocial(e, `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentItem.url)}`)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 rounded-xl text-left transition-colors text-sm font-medium text-white"
                    >
                       <Twitter size={16} className="text-blue-400"/> X / Twitter
                    </button>
                    <button 
                      onClick={(e) => openSocial(e, `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentItem.url)}`)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 rounded-xl text-left transition-colors text-sm font-medium text-white"
                    >
                       <Facebook size={16} className="text-blue-600"/> Facebook
                    </button>
                  </div>
                )}
             </div>
          </div>
          
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