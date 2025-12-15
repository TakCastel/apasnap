import React, { useState, useEffect } from 'react';
import { Search, Loader2, Link2, AlertTriangle, PlayCircle, ArrowRight, Home, Zap, Image as ImageIcon, Lock } from 'lucide-react';

interface UrlBarProps {
  onLoad: (url: string) => void;
  onDemo: () => void;
  onHome?: () => void;
  isLoading: boolean;
  error: string | null;
  compact?: boolean;
  lastValidUrl?: string;
}

const UrlBar: React.FC<UrlBarProps> = ({ onLoad, onDemo, onHome, isLoading, error, compact = false, lastValidUrl }) => {
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onLoad(inputUrl.trim());
    }
  };

  // Pre-fill URL if we are returning to Home (compact=false) and have a previous valid URL
  useEffect(() => {
    if (!compact && lastValidUrl) {
      setInputUrl(lastValidUrl);
    }
  }, [compact, lastValidUrl]);

  // Compact Header Mode (Active)
  if (compact) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-3">
         {/* Home Button - Fixed Dimensions */}
         <button 
           onClick={onHome}
           className="h-12 w-12 flex items-center justify-center bg-rev-surface hover:bg-rev-surfaceHighlight text-gray-400 hover:text-white rounded-2xl transition-all active:scale-95 border border-white/10 shadow-lg shrink-0"
           title="Retour à l'accueil"
         >
           <Home size={20} />
         </button>

         {/* Form - Flex 1 to take available space, ensuring alignment */}
         <form onSubmit={handleSubmit} className="flex-1 flex items-center relative h-12 max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Link2 className="h-4 w-4 text-gray-500" />
            </div>
            <input
               type="url"
               className="block w-full h-full pl-10 pr-12 bg-rev-surface border border-white/10 focus:border-blue-500/50 rounded-2xl text-white placeholder-gray-600 focus:outline-none text-sm transition-all shadow-lg appearance-none leading-normal"
               placeholder="Entrez une autre URL..."
               value={inputUrl}
               onChange={(e) => setInputUrl(e.target.value)}
               disabled={isLoading}
            />
            <button
               type="submit"
               disabled={isLoading || !inputUrl}
               className="absolute top-1.5 bottom-1.5 right-1.5 aspect-square bg-rev-surfaceHighlight hover:bg-blue-500 hover:text-white rounded-xl text-gray-300 transition-all disabled:opacity-0 disabled:scale-75 flex items-center justify-center z-10"
            >
               {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <ArrowRight size={16} />}
            </button>
         </form>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center animate-fade-in text-center px-6 -mt-20">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                   <Loader2 className="h-16 w-16 text-blue-500 animate-spin relative z-10" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Chargement</h2>
                    <p className="text-rev-textSub text-lg">Analyse du dossier en cours...</p>
                </div>
            </div>
        </div>
    );
  }

  // Welcome / Hero Mode (CTA Focused)
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] w-full max-w-4xl mx-auto px-6 animate-slide-up py-8">
      
      {/* Title Section */}
      <div className="text-center mb-10">
         <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-gray-500">
           Apasnap
         </h1>
         <p className="text-rev-textSub text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Le visualisateur moderne pour vos dossiers Apache.
         </p>
      </div>

      {/* MAIN CTA - Primary Focus */}
      <div className="w-full max-w-2xl bg-rev-surface rounded-3xl p-3 shadow-2xl shadow-blue-900/10 border border-white/10 relative z-20 mb-16 ring-1 ring-white/5 hover:ring-blue-500/30 transition-all duration-500">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Link2 className="h-6 w-6 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input
              type="url"
              className="block w-full pl-14 pr-4 py-5 bg-black/20 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:bg-black/40 text-lg font-medium transition-all"
              placeholder="https://mon-site.fr/photos/..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !inputUrl}
            className="w-full py-5 bg-white hover:bg-gray-100 text-black font-extrabold text-lg rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex justify-center items-center shadow-lg hover:shadow-xl hover:shadow-white/10"
          >
            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'Visualiser le dossier'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-10 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-slide-up w-full max-w-2xl">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-red-200 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Features - Secondary - Fully Visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-12">
        <div className="flex flex-col items-center text-center gap-2">
           <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
             <Zap className="h-5 w-5 text-yellow-400" />
           </div>
           <div>
             <h3 className="font-bold text-sm text-white">Instantané</h3>
             <p className="text-xs text-rev-textSub mt-1">Collez l'URL, c'est prêt.</p>
           </div>
        </div>
        <div className="flex flex-col items-center text-center gap-2">
           <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
             <ImageIcon className="h-5 w-5 text-blue-400" />
           </div>
           <div>
             <h3 className="font-bold text-sm text-white">Galerie</h3>
             <p className="text-xs text-rev-textSub mt-1">Photos & Vidéos HD.</p>
           </div>
        </div>
        <div className="flex flex-col items-center text-center gap-2">
           <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <Lock className="h-5 w-5 text-green-400" />
           </div>
           <div>
             <h3 className="font-bold text-sm text-white">Privé</h3>
             <p className="text-xs text-rev-textSub mt-1">Aucune donnée stockée.</p>
           </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-auto flex flex-col items-center gap-4">
        <button
          onClick={onDemo}
          className="text-sm font-semibold text-rev-textSub hover:text-white transition-colors flex items-center gap-2 px-5 py-2"
        >
          <PlayCircle size={14}/>
          Voir la démo
        </button>

        <a 
          href="https://tariktalhaoui.fr" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[10px] uppercase tracking-widest font-bold text-rev-textSub/40 hover:text-rev-textSub transition-colors"
        >
          Créé par Tarik Talhaoui
        </a>
      </div>
    </div>
  );
};

export default UrlBar;