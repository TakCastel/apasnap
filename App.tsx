import React, { useState, useEffect, useMemo } from 'react';
import UrlBar from './components/UrlBar';
import Gallery from './components/Gallery';
import GallerySkeleton from './components/GallerySkeleton';
import Lightbox from './components/Lightbox';
import FilterBar from './components/FilterBar';
import { parseApacheDirectoryHtml, generateDemoData } from './services/parser';
import { MediaItem, MediaType } from './types';
import { Image as ImageIcon, ShieldCheck, Share2, Check, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  
  // Initialize loading state based on URL presence to prevent flash of content
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return !!params.get('url');
    }
    return false;
  });

  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string>('');
  const [usingProxy, setUsingProxy] = useState(false);
  const [justShared, setJustShared] = useState(false);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date_desc'); 
  const [filterType, setFilterType] = useState<'ALL' | MediaType>('ALL');

  const normalizeUrl = (input: string) => {
    let url = input.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    return url;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      handleLoadUrl(urlParam);
    }
  }, []);

  const fetchWithProxyFallback = async (url: string) => {
    try {
      setUsingProxy(false);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Direct Status ${response.status}`);
      return await response.text();
    } catch (directError) {
      console.warn("Direct fetch failed, attempting proxy chain...", directError);
      setUsingProxy(true);
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&disableCache=${Date.now()}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`AllOrigins Status ${response.status}`);
        return await response.text();
      } catch (proxyError1) {
        try {
          const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          const response = await fetch(proxyUrl2);
          if (!response.ok) throw new Error(`CorsProxy Status ${response.status}`);
          return await response.text();
        } catch (proxyError2) {
           throw new Error("Impossible de charger le dossier. Le serveur bloque peut-être les requêtes externes.");
        }
      }
    }
  };

  const handleLoadUrl = async (inputUrl: string) => {
    const url = normalizeUrl(inputUrl);
    setIsLoading(true);
    setError(null);
    setItems([]);
    
    try {
      const html = await fetchWithProxyFallback(url);
      const parsedItems = parseApacheDirectoryHtml(html, url);
      
      if (parsedItems.length === 0) {
        setError("Aucun fichier trouvé. Vérifiez l'URL.");
      } else {
        setItems(parsedItems);
        setLoadedUrl(url);
        
        try {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('url', url);
          window.history.pushState({}, '', newUrl);
        } catch (e) { console.warn("URL update skipped (sandbox env)"); }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setItems([]);
    setLoadedUrl('');
    setSearchQuery('');
    setError(null);
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('url');
      window.history.pushState({}, '', newUrl);
    } catch (e) { console.warn("URL update skipped (sandbox env)"); }
  };

  const handleDemo = () => {
    setIsLoading(true);
    setError(null);
    setUsingProxy(false);
    setTimeout(() => {
      setItems(generateDemoData());
      setLoadedUrl("Mode Démo");
      setIsLoading(false);
      
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('url');
        window.history.pushState({}, '', newUrl);
      } catch (e) { console.warn("URL update skipped (sandbox env)"); }
    }, 800);
  };

  const handleShare = async () => {
    let shareUrl = window.location.href;
    try {
      const urlObj = new URL(window.location.href);
      if (loadedUrl && loadedUrl !== "Mode Démo") {
         urlObj.searchParams.set('url', loadedUrl);
      }
      shareUrl = urlObj.toString();
    } catch (e) { console.warn("Could not construct share URL"); }

    if (navigator.share) {
       try {
          await navigator.share({
             title: 'Apasnap',
             text: 'Regarde ce dossier photos !',
             url: shareUrl
          });
       } catch (err) {
          console.debug("Share cancelled");
       }
    } else {
       navigator.clipboard.writeText(shareUrl).then(() => {
         setJustShared(true);
         setTimeout(() => setJustShared(false), 2000);
       });
    }
  };

  // Filtering and Sorting Logic
  const processedItems = useMemo(() => {
    let result = [...items];

    if (filterType !== 'ALL') {
      result = result.filter(item => item.type === filterType);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => item.name.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
      if (sortOption === 'name_desc') return b.name.localeCompare(a.name);
      
      // Date sorting
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      if (sortOption === 'date_desc') return dateB - dateA;
      if (sortOption === 'date_asc') return dateA - dateB;
      
      return 0;
    });

    return result;
  }, [items, searchQuery, sortOption, filterType]);

  // Determine if we should show the compact interface
  const showCompact = items.length > 0 || isLoading;

  return (
    <div className="min-h-screen bg-rev-bg text-white font-sans selection:bg-blue-500 selection:text-white pb-20">
      
      {/* 
        Unified Sticky Header 
        Contains UrlBar (compact), Stats, and FilterBar to ensure they all stick together 
      */}
      <div className={`sticky top-0 z-30 transition-all duration-300 ${showCompact ? 'bg-rev-bg/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50' : 'pt-10'}`}>
        <UrlBar 
          onLoad={handleLoadUrl} 
          onDemo={handleDemo}
          onHome={handleReset}
          isLoading={isLoading} 
          error={error}
          compact={showCompact}
        />
        
        {showCompact && (
          <div className="animate-fade-in flex flex-col gap-1">
            {isLoading ? (
               // Header Skeleton (Stats area)
               <div className="max-w-[1600px] w-full mx-auto px-4 flex justify-between items-center py-3">
                  <div className="flex flex-col gap-2">
                     <div className="h-4 w-32 bg-rev-surfaceHighlight/50 rounded-md animate-pulse"></div>
                     <div className="h-3 w-16 bg-rev-surfaceHighlight/50 rounded-md animate-pulse"></div>
                  </div>
                  <div className="flex gap-2">
                     <div className="h-8 w-8 rounded-full bg-rev-surfaceHighlight/50 animate-pulse"></div>
                     <div className="h-8 w-24 rounded-full bg-rev-surfaceHighlight/50 animate-pulse"></div>
                  </div>
               </div>
            ) : (
               // Real Stats
               <div className="max-w-[1600px] w-full mx-auto px-4 flex justify-between items-center py-2">
                 <div className="flex flex-col">
                   <h2 className="text-base font-bold text-white flex items-center gap-2 max-w-[200px] sm:max-w-md truncate">
                     {loadedUrl === "Mode Démo" ? "Galerie Démo" : loadedUrl.replace(/^https?:\/\//, '')}
                     {usingProxy && (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                         <ShieldCheck size={10} /> Proxy
                       </span>
                     )}
                   </h2>
                   <p className="text-rev-textSub text-xs font-medium">
                     {processedItems.length} éléments
                   </p>
                 </div>

                 <div className="flex gap-2">
                     <a 
                       href={loadedUrl} 
                       target="_blank" 
                       rel="noreferrer"
                       className="p-2 rounded-full bg-rev-surface hover:bg-rev-surfaceHighlight text-gray-400 hover:text-white transition"
                       title="Ouvrir le dossier original"
                     >
                         <ExternalLink size={16} />
                     </a>
                     <button 
                       onClick={handleShare}
                       className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black hover:bg-gray-200 transition active:scale-95 text-xs font-bold"
                     >
                       {justShared ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
                       {justShared ? 'Copié' : 'Partager'}
                     </button>
                 </div>
               </div>
            )}

            {/* Filter Bar integrated into header */}
            {isLoading ? (
               // Filter Bar Skeleton
               <div className="w-full max-w-[1600px] mx-auto px-4 pb-3">
                  <div className="flex gap-3 overflow-hidden">
                     <div className="h-10 w-48 bg-rev-surfaceHighlight/50 rounded-2xl animate-pulse shrink-0"></div>
                     <div className="h-10 w-24 bg-rev-surfaceHighlight/50 rounded-2xl animate-pulse shrink-0"></div>
                     <div className="h-10 w-32 bg-rev-surfaceHighlight/50 rounded-2xl animate-pulse shrink-0"></div>
                  </div>
               </div>
            ) : (
               <FilterBar 
                 searchQuery={searchQuery}
                 onSearchChange={setSearchQuery}
                 sortOption={sortOption}
                 onSortChange={setSortOption}
                 filterType={filterType}
                 onFilterTypeChange={setFilterType}
               />
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 min-h-[50vh] pt-4">
        {isLoading && <GallerySkeleton />}

        {!isLoading && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center text-gray-600 mt-20 p-8 text-center opacity-60">
            <div className="w-24 h-24 bg-rev-surface rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-black border border-white/5">
              <ImageIcon size={48} className="text-gray-500" />
            </div>
            <p className="text-xl font-bold text-gray-300">Prêt à visualiser</p>
          </div>
        )}

        <Gallery items={processedItems} onItemClick={(index) => setLightboxIndex(index)} />
        
        {!isLoading && items.length > 0 && processedItems.length === 0 && (
           <div className="text-center py-20 text-gray-500">
              Aucun résultat pour ces filtres.
           </div>
        )}
      </main>

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && (
        <Lightbox 
          items={processedItems} 
          initialIndex={lightboxIndex} 
          onClose={() => setLightboxIndex(null)} 
        />
      )}
    </div>
  );
};

export default App;