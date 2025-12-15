import React, { useEffect, useRef } from 'react';
import { MediaItem } from '../types';
import { Loader2, MapPin, Image as ImageIcon } from 'lucide-react';

declare global {
  interface Window {
    L: any;
  }
}

interface MapViewProps {
  items: MediaItem[];
  onScanExif: () => void;
  isScanning: boolean;
  onItemClick: (item: MediaItem) => void;
}

const MapView: React.FC<MapViewProps> = ({ items, onScanExif, isScanning, onItemClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersGroup = useRef<any>(null);

  const itemsWithGeo = items.filter(i => i.lat && i.lng);
  const percentScanned = Math.round((items.filter(i => i.hasCheckedExif).length / items.length) * 100) || 0;

  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof window.L === 'undefined') return;

    if (!leafletMap.current) {
      leafletMap.current = window.L.map(mapRef.current).setView([46.603354, 1.888334], 6); // France center

      // Dark Matter Map Tile
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(leafletMap.current);

      markersGroup.current = window.L.layerGroup().addTo(leafletMap.current);
    }

    // Update markers
    markersGroup.current.clearLayers();

    itemsWithGeo.forEach(item => {
      if (!item.lat || !item.lng) return;

      const icon = window.L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-image: url('${item.url}'); background-size: cover; width: 40px; height: 40px; border-radius: 8px; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      const marker = window.L.marker([item.lat, item.lng], { icon });
      
      marker.on('click', () => onItemClick(item));
      
      marker.addTo(markersGroup.current);
    });

    // Fit bounds if we have points
    if (itemsWithGeo.length > 0) {
      const group = new window.L.featureGroup(markersGroup.current.getLayers());
      leafletMap.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [itemsWithGeo.length]);

  return (
    <div className="relative w-full h-[70vh] rounded-3xl overflow-hidden border border-white/5 bg-rev-surface shadow-2xl animate-fade-in mt-4">
      <div id="map" ref={mapRef} className="w-full h-full z-0" />

      {/* Control overlay */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 items-end">
         <div className="bg-rev-surface/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl max-w-xs">
            <h3 className="text-white font-bold text-sm mb-1">Carte des photos</h3>
            <p className="text-rev-textSub text-xs mb-3">
               Les positions sont extraites des métadonnées (EXIF). Cela nécessite de télécharger les entêtes des images.
            </p>
            
            <div className="flex flex-col gap-2">
               <div className="flex justify-between text-xs font-medium">
                  <span className="text-white">{itemsWithGeo.length} localisées</span>
                  <span className="text-rev-textSub">{percentScanned}% scanné</span>
               </div>
               
               {/* Progress bar */}
               <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${percentScanned}%` }}></div>
               </div>

               <button 
                  onClick={onScanExif}
                  disabled={isScanning || percentScanned === 100}
                  className="mt-2 w-full py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors"
               >
                  {isScanning ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                  {isScanning ? 'Scan en cours...' : percentScanned === 100 ? 'Scan terminé' : 'Lancer le scan GPS'}
               </button>
            </div>
         </div>
      </div>

      {itemsWithGeo.length === 0 && !isScanning && (
         <div className="absolute inset-0 flex items-center justify-center z-[399] pointer-events-none">
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-3xl text-center pointer-events-auto">
               <MapPin size={32} className="text-rev-textSub mx-auto mb-2" />
               <p className="text-white font-medium text-sm">Aucune photo localisée pour le moment</p>
               <button onClick={onScanExif} className="text-blue-400 text-xs font-bold mt-2 hover:underline">
                  Lancer la détection
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default MapView;