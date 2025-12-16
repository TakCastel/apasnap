
import React from 'react';
import { X, Shield, Lock, Server, Fingerprint, Globe } from 'lucide-react';

interface ModalProps {
  onClose: () => void;
  type: 'PRIVACY' | 'TERMS';
}

const LegalModals: React.FC<ModalProps> = ({ onClose, type }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <div className="bg-[#111] border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 bg-[#111]/90 backdrop-blur-md p-6 border-b border-white/5 flex justify-between items-center z-10">
          <h2 className="text-2xl font-black text-white flex items-center gap-4">
            <div className={`p-3 rounded-full ${type === 'PRIVACY' ? 'bg-blue-500/20 text-blue-500' : 'bg-purple-500/20 text-purple-500'}`}>
                {type === 'PRIVACY' ? <Lock size={24}/> : <Shield size={24}/>}
            </div>
            {type === 'PRIVACY' ? 'Confidentialité' : 'Conditions d\'utilisation'}
          </h2>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-8 text-gray-400 space-y-10 leading-relaxed text-lg font-medium">
          {type === 'PRIVACY' ? (
            <>
              <section>
                <div className="flex items-center gap-3 mb-3 text-white">
                    <Server size={24} className="text-blue-400"/>
                    <h3 className="font-bold text-xl">Traitement Local</h3>
                </div>
                <p>
                  Apasnap fonctionne exclusivement côté client (sur votre navigateur). Nous ne possédons pas de serveurs de stockage et nous n'avons aucun moyen technique de consulter votre historique de navigation ou les fichiers que vous visualisez.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-3 text-white">
                    <Globe size={24} className="text-yellow-400"/>
                    <h3 className="font-bold text-xl">Fonctionnement du Proxy</h3>
                </div>
                <p>
                  Lorsque le "Turbo Proxy" est activé, vos requêtes transitent par un service tiers (CorsProxy.io) afin de contourner les restrictions d'affichage (CORS) imposées par certains serveurs.
                  <br/><br/>
                  Bien que ce service ne stocke pas les données, <span className="text-white font-bold">nous recommandons de n'utiliser ce mode que pour des contenus publics</span> et non sensibles.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-3 text-white">
                    <Fingerprint size={24} className="text-green-400"/>
                    <h3 className="font-bold text-xl">Absence de traçage</h3>
                </div>
                <p>
                  Nous n'utilisons ni cookies publicitaires ni outils d'analyse comportementale. Vos préférences sont stockées temporairement pour la durée de votre session et sont effacées à la fermeture de l'onglet.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="text-white font-bold text-xl mb-3">1. Usage Responsable</h3>
                <p>
                  Cet outil est conçu pour la visualisation ergonomique de répertoires publics. L'utilisateur s'engage à ne pas l'utiliser à des fins de "scraping" intensif, d'analyse de vulnérabilités ou d'accès à des contenus illicites.
                </p>
              </section>

              <section>
                <h3 className="text-white font-bold text-xl mb-3">2. Limitations Techniques</h3>
                <p>
                  Apasnap agit comme une interface visuelle. Nous ne sommes pas responsables de la disponibilité, de la lenteur ou des limitations d'accès imposées par les serveurs distants que vous choisissez de consulter.
                </p>
              </section>

              <section>
                <h3 className="text-white font-bold text-xl mb-3">3. Clause de non-responsabilité</h3>
                <p>
                  Le service est fourni "en l'état". L'utilisation du mode Proxy dépend de la disponibilité de services tiers indépendants de notre volonté.
                </p>
              </section>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex justify-end bg-[#111]">
          <button 
            onClick={onClose}
            className="px-8 py-4 bg-white text-black font-black text-lg rounded-[2rem] hover:scale-105 transition-transform shadow-lg shadow-white/5"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModals;
