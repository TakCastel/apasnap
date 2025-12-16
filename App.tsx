
import React, { useState, useEffect, useMemo } from 'react';
import UrlBar from './components/UrlBar';
import Gallery from './components/Gallery';
import GallerySkeleton from './components/GallerySkeleton';
import Lightbox from './components/Lightbox';
import FilterBar from './components/FilterBar';
import { parseApacheDirectoryHtml, generateDemoData, parseManifestJson } from './services/parser';
import { isValidTargetUrl } from './services/validator';
import { MediaItem, MediaType } from './types';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  
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
  const [lastValidUrl, setLastValidUrl] = useState<string>(''); 
  const [usingProxy, setUsingProxy] = useState(false);
  const [proxyEnabled, setProxyEnabled] = useState(true);
  const [justShared, setJustShared] = useState(false);
  const [isManifestMode, setIsManifestMode] = useState(false);

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

  const handleLoadUrl = async (inputUrl: string) => {
    const url = normalizeUrl(inputUrl);
    setIsLoading(true);
    setError(null);
    setItems([]);
    setUsingProxy(false);
    setIsManifestMode(false);
    
    // 1. Security Validation
    const validation = isValidTargetUrl(url);
    if (!validation.valid) {
      setError(validation.error || "URL invalide");
      setIsLoading(false);
      return;
    }

    try {
      let parsedItems: MediaItem[] = [];

      // 2. Try Manifest Mode First (apasnap.json)
      try {
         const manifestUrl = url.endsWith('/') ? `${url}apasnap.json` : `${url}/apasnap.json`;
         let response;
         
         if (proxyEnabled) {
            response = await fetch(`https://corsproxy.io/?${encodeURIComponent(manifestUrl)}`);
         } else {
            response = await fetch(manifestUrl);
         }

         if (response.ok) {
            const json = await response.json();
            parsedItems = parseManifestJson(json, url);
            if (parsedItems.length > 0) {
               setIsManifestMode(true);
            }
         }
      } catch (manifestErr) {
         console.debug("Manifest not found or blocked, falling back to HTML", manifestErr);
      }

      // 3. Fallback to HTML Scraping
      if (parsedItems.length === 0) {
         if (proxyEnabled) {
            // Explicit Proxy Mode
            setUsingProxy(true);

            // Robust multi-proxy fetcher
            const fetchHtmlViaProxy = async (targetUrl: string) => {
                const proxies = [
                   // Primary: CorsProxy.io
                   (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
                   // Fallback: AllOrigins (Raw)
                   (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
                ];

                let lastError: any = new Error("Aucun proxy n'a fonctionné");

                for (const proxyGen of proxies) {
                    try {
                        const res = await fetch(proxyGen(targetUrl));
                        
                        // Handle Auth errors immediately without fallback
                        if (res.status === 401) throw new Error("401_AUTH");
                        if (res.status === 403) throw new Error("403_FORBIDDEN");

                        if (!res.ok) throw new Error(`HTTP_${res.status}`);
                        
                        return await res.text();
                    } catch (e: any) {
                        lastError = e;
                        // If it's auth related, stop trying other proxies
                        if (e.message === "401_AUTH" || e.message === "403_FORBIDDEN") {
                            throw e;
                        }
                        console.warn("Proxy failed, trying next...", e);
                    }
                }
                throw lastError;
            };

            try {
               const html = await fetchHtmlViaProxy(url);
               parsedItems = parseApacheDirectoryHtml(html, url);
            } catch (err: any) {
               if (err.message === "401_AUTH") {
                   throw new Error("Accès refusé (401). Ce dossier est protégé par un mot de passe.");
               } else if (err.message === "403_FORBIDDEN") {
                   throw new Error("Accès interdit (403). Le serveur refuse l'accès.");
               } else {
                   throw new Error(`Erreur de chargement via Proxy. Vérifiez l'URL ou réessayez.`);
               }
            }

         } else {
            // Direct Mode
            try {
              const response = await fetch(url);
              if (!response.ok) throw new Error(`Erreur Directe (${response.status})`);
              const html = await response.text();
              parsedItems = parseApacheDirectoryHtml(html, url);
            } catch (directErr) {
               throw new Error(
                  "Impossible d'accéder au dossier directement. Le mode 'Turbo Proxy' est recommandé pour ce site."
               );
            }
         }
      }
      
      if (parsedItems.length === 0) {
        setError("Aucun fichier média trouvé. Le dossier est peut-être vide ou protégé.");
      } else {
        setItems(parsedItems);
        setLoadedUrl(url);
        setLastValidUrl(url);
        
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
    setItems(generateDemoData());
    setLoadedUrl("Mode Démo");
    setIsLoading(false);
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('url');
      window.history.pushState({}, '', newUrl);
    } catch (e) { console.warn("URL update skipped (sandbox env)"); }
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

  const showCompact = items.length > 0 || isLoading;

  return (
    <div className={`min-h-screen bg-rev-bg text-white font-sans selection:bg-rev-accent selection:text-white ${showCompact ? 'pb-20' : ''}`}>
      
      <div 
        id="app-header"
        className={`transition-all duration-300 ${
          showCompact 
            ? 'sticky top-0 z-30 glass border-b border-white/5' 
            : 'relative'
        }`}
      >
        
        <UrlBar 
          onLoad={handleLoadUrl} 
          onDemo={handleDemo}
          onHome={handleReset}
          isLoading={isLoading} 
          error={error}
          compact={showCompact}
          lastValidUrl={lastValidUrl}
          useProxy={proxyEnabled}
          onToggleProxy={setProxyEnabled}
          // Actions passed to header
          onShare={handleShare}
          justShared={justShared}
          currentUrl={loadedUrl}
        />
        
        {showCompact && (
          <div className="flex flex-col gap-1">
            {isLoading ? (
               <div className="w-full max-w-[1600px] mx-auto px-4 pb-3">
                  <div className="flex gap-3 overflow-hidden">
                     <div className="h-10 w-full bg-rev-surfaceHighlight rounded-full animate-pulse"></div>
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
                 totalItems={items.length}
               />
            )}
          </div>
        )}
      </div>

      {showCompact && (
        <main className="max-w-[1600px] mx-auto px-4 min-h-[50vh] pt-6">
          {isLoading && <GallerySkeleton />}

          <Gallery items={processedItems} onItemClick={(index) => setLightboxIndex(index)} />
          
          {!isLoading && items.length > 0 && processedItems.length === 0 && (
            <div className="text-center py-32 text-rev-textSub">
                <p className="text-lg">Aucun résultat.</p>
                <button onClick={() => {setSearchQuery(''); setFilterType('ALL')}} className="mt-4 text-rev-accent font-medium hover:underline">Réinitialiser les filtres</button>
            </div>
          )}
        </main>
      )}

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
