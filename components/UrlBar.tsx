import React, { useState } from 'react';
import { Search, Loader2, Link2, AlertTriangle, PlayCircle, FolderOpen, ArrowRight, Home } from 'lucide-react';

interface UrlBarProps {
  onLoad: (url: string) => void;
  onDemo: () => void;
  onHome?: () => void;
  isLoading: boolean;
  error: string | null;
  compact?: boolean;
}

const UrlBar: React.FC<UrlBarProps> = ({ onLoad, onDemo, onHome, isLoading, error, compact = false }) => {
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onLoad(inputUrl.trim());
    }
  };

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

  // Welcome / Hero Mode
  return (
    <div className="w-full max-w-lg mx-auto px-6 mt-20 animate-slide-up">
      <div className="text-center mb-10">
         <h1 className="text-5xl font-bold text-white tracking-tight mb-3">
           Apasnap
         </h1>
         <p className="text-rev-textSub text-base font-medium">
            Visualisez vos dossiers Apache instantanément.
         </p>
      </div>

      <div className="bg-rev-surface rounded-3xl p-2 shadow-2xl border border-white/5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Link2 className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="url"
              className="block w-full pl-12 pr-4 py-5 bg-transparent text-white placeholder-gray-600 focus:outline-none text-lg font-medium"
              placeholder="Collez votre lien ici..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !inputUrl}
            className="w-full py-4 bg-white hover:bg-gray-100 text-black font-bold text-base rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex justify-center items-center shadow-lg shadow-white/5"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Ouvrir'}
          </button>
        </form>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onDemo}
          className="text-sm font-semibold text-rev-textSub hover:text-white transition-colors flex items-center gap-2 px-5 py-3 rounded-full bg-rev-surface hover:bg-rev-surfaceHighlight"
        >
          <PlayCircle size={16}/>
          Voir la démo
        </button>
      </div>

      {error && (
        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-slide-up">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-red-200 text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};

export default UrlBar;