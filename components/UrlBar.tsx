
import React, { useState, useEffect } from 'react';
import { Loader2, Link2, ArrowRight, Home, Zap, Settings, Info, Lock, Share2, ExternalLink, Check, AlertTriangle, Sparkles } from 'lucide-react';
import LegalModals from './LegalModals';

interface UrlBarProps {
  onLoad: (url: string) => void;
  onDemo: () => void;
  onHome?: () => void;
  isLoading: boolean;
  error: string | null;
  compact?: boolean;
  lastValidUrl?: string;
  useProxy: boolean;
  onToggleProxy: (enabled: boolean) => void;
  // New props for integrated actions
  onShare?: () => void;
  justShared?: boolean;
  currentUrl?: string;
}

const UrlBar: React.FC<UrlBarProps> = ({ 
  onLoad, 
  onDemo, 
  onHome, 
  isLoading, 
  error, 
  compact = false, 
  lastValidUrl,
  useProxy,
  onToggleProxy,
  onShare,
  justShared,
  currentUrl
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [modalType, setModalType] = useState<'PRIVACY' | 'TERMS' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSettings(false);
    if (inputUrl.trim()) {
      onLoad(inputUrl.trim());
    }
  };

  useEffect(() => {
    if (!compact && lastValidUrl) {
      setInputUrl(lastValidUrl);
    }
  }, [compact, lastValidUrl]);

  const SettingsMenu = () => (
    <div className="absolute top-full right-0 mt-4 w-72 bg-[#161616] border border-white/10 rounded-3xl shadow-2xl p-2 z-50 animate-scale-in origin-top-right overflow-hidden">
       <div className="px-4 py-3 border-b border-white/5 mb-2">
         <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Options</span>
       </div>
       
       <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => onToggleProxy(!useProxy)}>
         <div className="flex items-center gap-3">
           <div className={`p-2 rounded-full ${useProxy ? 'bg-rev-accent/20 text-rev-accent' : 'bg-white/5 text-gray-400'}`}>
              <Zap size={18} fill={useProxy ? "currentColor" : "none"} />
           </div>
           <div className="flex flex-col">
             <span className="text-sm font-bold text-white">Turbo Proxy</span>
             <span className="text-[10px] text-gray-500">Contourner les blocages</span>
           </div>
         </div>
         <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${useProxy ? 'bg-rev-accent' : 'bg-white/10'}`}>
           <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform duration-300 ${useProxy ? 'translate-x-4' : 'translate-x-0'}`}></div>
         </div>
       </div>

       <div className="h-px bg-white/5 my-2 mx-2"></div>

       <div className="flex flex-col gap-1">
         <button onClick={() => setModalType('PRIVACY')} className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-white/5 text-left transition-colors group">
            <Lock size={16} className="text-gray-500 group-hover:text-white transition-colors"/>
            <span className="text-xs font-bold text-gray-400 group-hover:text-white">Confidentialité</span>
         </button>
         <button onClick={() => setModalType('TERMS')} className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-white/5 text-left transition-colors group">
            <Info size={16} className="text-gray-500 group-hover:text-white transition-colors"/>
            <span className="text-xs font-bold text-gray-400 group-hover:text-white">Conditions</span>
         </button>
       </div>
    </div>
  );

  return (
    <>
      {modalType && <LegalModals type={modalType} onClose={() => setModalType(null)} />}
      
      {/* Compact Mode (Unified Header) */}
      {compact ? (
        <div className="w-full max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-3 justify-between">
           {/* Left: Home */}
           <button 
             onClick={onHome}
             className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-rev-surface hover:bg-rev-surfaceHighlight text-rev-textSub hover:text-white rounded-full transition-all active:scale-95 border border-white/5 shadow-sm shrink-0"
             title="Retour à l'accueil"
           >
             <Home size={18} strokeWidth={2.5} />
           </button>

           {/* Center: Search/URL Input */}
           <form onSubmit={handleSubmit} className="flex-1 flex items-center relative h-10 md:h-12 max-w-2xl group mx-auto w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Link2 className="h-4 w-4 text-gray-600 group-focus-within:text-rev-accent transition-colors" />
              </div>
              <input
                 type="url"
                 className="block w-full h-full pl-10 pr-12 bg-rev-surface border border-white/5 focus:border-white/10 rounded-full text-white placeholder-gray-600 focus:outline-none focus:bg-[#1a1a1a] text-sm font-medium transition-all shadow-inner truncate"
                 placeholder="https://..."
                 value={inputUrl}
                 onChange={(e) => setInputUrl(e.target.value)}
                 disabled={isLoading}
              />
              <button
                 type="submit"
                 disabled={isLoading || !inputUrl || inputUrl === lastValidUrl}
                 className={`absolute top-1.5 bottom-1.5 right-1.5 aspect-square bg-rev-primary hover:bg-white/90 text-black rounded-full transition-all flex items-center justify-center z-10 shadow-lg ${(!inputUrl || inputUrl === lastValidUrl) ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}
              >
                 {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <ArrowRight size={16} strokeWidth={3} />}
              </button>
           </form>

           {/* Right: Actions Group */}
           <div className="flex items-center gap-2 shrink-0">
             
             {/* Desktop Actions */}
             <div className="hidden md:flex items-center gap-2">
                {onShare && (
                    <button 
                    onClick={onShare}
                    className={`h-12 px-5 flex items-center justify-center gap-2 rounded-full border border-white/5 transition-all font-bold text-sm ${justShared ? 'bg-green-500/20 text-green-500 border-green-500/20' : 'bg-rev-surface text-white hover:bg-rev-surfaceHighlight'}`}
                    >
                    {justShared ? <Check size={18} /> : <Share2 size={18} />}
                    <span className="hidden lg:inline">{justShared ? 'Copié' : 'Partager'}</span>
                    </button>
                )}
             </div>

             {/* Mobile / Settings */}
             <div className="relative">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-full transition-all border ${showSettings ? 'bg-white text-black border-transparent' : 'bg-rev-surface border-white/5 text-gray-400 hover:text-white hover:bg-rev-surfaceHighlight'}`}
                >
                    <Settings size={20} strokeWidth={2.5} className={showSettings ? 'rotate-90 transition-transform duration-500' : 'transition-transform duration-500'} />
                </button>
                
                {/* Click outside overlay */}
                {showSettings && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)}></div>
                        <SettingsMenu />
                    </>
                )}
             </div>
           </div>
        </div>
      ) : (
        /* Landing Mode (Hero) */
        isLoading ? (
            <div className="w-full h-screen flex flex-col items-center justify-center animate-fade-in text-center px-6 -mt-20">
                <div className="flex flex-col items-center gap-8">
                    <div className="relative">
                       <div className="absolute inset-0 bg-rev-accent/30 blur-3xl rounded-full"></div>
                       <Loader2 className="h-20 w-20 text-rev-primary animate-spin relative z-10 opacity-90" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-white tracking-tighter">Chargement</h2>
                        <p className="text-rev-textSub text-xl">Nous préparons votre galerie...</p>
                    </div>
                </div>
            </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-6xl mx-auto px-6 animate-slide-up py-6 relative">
            
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="text-center mb-16 relative z-10">
               {/* Badge removed as requested */}
               <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
                 Apasnap
               </h1>
               <p className="text-rev-textSub text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
                  L'outil ultime pour visualiser vos répertoires Apache. <br/>
                  <span className="text-white">Rapide. Élégant. Puissant.</span>
               </p>
            </div>

            <div className="w-full max-w-3xl relative z-20 mb-20">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
                    <Link2 className="h-6 w-6 text-gray-500 group-focus-within:text-white transition-colors duration-500" />
                  </div>
                  <input
                    type="url"
                    className="block w-full h-24 pl-20 pr-8 bg-[#111] border-2 border-transparent hover:border-white/10 focus:border-rev-accent/50 rounded-[2.5rem] text-white placeholder-gray-600 focus:outline-none focus:bg-[#161616] text-2xl font-bold transition-all duration-300 shadow-2xl shadow-black/50"
                    placeholder="Collez votre lien ici..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-4">
                   <button
                     type="submit"
                     disabled={isLoading || !inputUrl}
                     className="flex-1 h-20 bg-white hover:bg-gray-100 text-black font-black text-xl rounded-[2rem] transition-all active:scale-[0.98] disabled:opacity-40 disabled:scale-100 flex justify-center items-center shadow-lg hover:shadow-2xl hover:shadow-white/10"
                   >
                     {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'Visualiser le dossier'}
                   </button>
                   
                   <div className="relative">
                      <button 
                        type="button"
                        onClick={() => setShowSettings(!showSettings)}
                        className={`h-20 w-20 flex items-center justify-center rounded-[2rem] border-2 transition-all duration-300 ${showSettings ? 'bg-[#222] border-white/20 text-white' : 'bg-[#111] border-transparent text-gray-500 hover:text-white hover:bg-[#161616]'}`}
                      >
                         <Settings size={28} strokeWidth={2.5} className={showSettings ? 'rotate-90 transition-transform duration-500' : 'transition-transform duration-500'} />
                      </button>
                      {showSettings && (
                        <>
                           <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)}></div>
                           <SettingsMenu />
                        </>
                      )}
                   </div>
                </div>
              </form>
            </div>

            {error && (
              <div className="mb-12 p-6 bg-red-500/10 border border-red-500/10 rounded-3xl flex items-center gap-4 animate-slide-up w-full max-w-2xl backdrop-blur-md">
                <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                   <AlertTriangle size={24} />
                </div>
                <div>
                   <h3 className="text-red-400 font-bold mb-1">Erreur de chargement</h3>
                   <p className="text-red-200/80 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="mt-auto pb-10 flex flex-col items-center gap-8">
              <button
                onClick={onDemo}
                className="group flex items-center gap-4 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5 hover:border-white/20 backdrop-blur-md"
              >
                <div className="w-8 h-8 rounded-full bg-rev-accent flex items-center justify-center text-black shadow-lg shadow-rev-accent/20">
                   <Sparkles size={18} strokeWidth={2.5} />
                </div>
                <span>Voir la démo</span>
              </button>
            </div>
          </div>
        )
      )}
    </>
  );
};

export default UrlBar;
