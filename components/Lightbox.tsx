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
  
  // Slider / Drag State
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for gestures and zoom tracking
  const scaleRef = useRef(1);
  const startXRef = useRef<number | null>(null);
  
  // We use the optimizer logic directly in the src now, but keep fallback state
  const [loadOriginal, setLoadOriginal] = useState(false);

  const currentItem = items[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsImgLoading(true);
      setLoadOriginal(false);
      setShowShareMenu(false);
      scaleRef.current = 1;
      setDragOffset(0);
    }
  }, [currentIndex, items.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsImgLoading(true);
      setLoadOriginal(false);
      setShowShareMenu(false);
      scaleRef.current = 1;
      setDragOffset(0);
    }
  }, [currentIndex]);

  // Touch / Slider Logic
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scaleRef.current > 1.05 || e.touches.length > 1) return;
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || startXRef.current === null || scaleRef.current > 1.05) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Add resistance at the edges
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === items.length - 1;
    
    if ((isFirst && diff > 0) || (isLast && diff < 0)) {
        setDragOffset(diff * 0.3); // Heavy resistance
    } else {
        setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || startXRef.current === null) return;
    
    const threshold = window.innerWidth * 0.20; // 20% screen width to trigger switch
    
    if (dragOffset < -threshold && currentIndex < items.length - 1) {
       handleNext();
    } else if (dragOffset > threshold && currentIndex > 0) {
       handlePrev();
    }
    
    // Reset state. 
    // If we switched, the key={currentIndex} on the div will force a re-mount at pos 0, avoiding "slide back" animation.
    // If we didn't switch, the transition will snap it back to 0.
    setDragOffset(0);
    setIsDragging(false);
    startXRef.current = null;
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
    if (loadOriginal) return item.url;
    return getFullScreenUrl(item.url);
  };

  const handleError = () => {
    if (!loadOriginal) {
      setLoadOriginal(true);
    }
  };

  const downloadItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = currentItem.url;
    link.download = currentItem.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
        Image Container with Swipe Logic 
        key={currentIndex} ensures we get a fresh container on image switch (no transition artifacts)
      */}
      <div 
        key={currentIndex}
        className="flex-1 relative flex items-center justify-center overflow-hidden w-full h-full" 
        onClick={() => { setShowShareMenu(false); onClose(); }}
        onTouchStartCapture={handleTouchStart}
        onTouchMoveCapture={handleTouchMove}
        onTouchEndCapture={handleTouchEnd}
        style={{ 
            transform: `translateX(${dragOffset}px)`, 
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            touchAction: 'none'
        }}
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
                  src={getDisplayUrl(currentItem)}
                  alt={currentItem.name}
                  className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isImgLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setIsImgLoading(false)}
                  onError={handleError}
                  draggable={false} // Prevent native drag
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

                {/* Share Menu */}
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