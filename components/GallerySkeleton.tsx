
import React from 'react';

const GallerySkeleton: React.FC = () => {
  return (
    <div className="w-full pb-20 animate-pulse">
      {/* Imitation de la grille Masonry (5 colonnes max selon breakpoints) */}
      <div className="flex gap-4 items-start">
         
         {/* Colonne 1 (Toujours visible) */}
         <div className="flex-1 flex flex-col gap-4">
            <div className="w-full aspect-[3/4] bg-rev-surfaceHighlight/50 rounded-2xl"></div>
            <div className="w-full aspect-[4/3] bg-rev-surfaceHighlight/50 rounded-2xl"></div>
            <div className="w-full aspect-square bg-rev-surfaceHighlight/50 rounded-2xl"></div>
         </div>

         {/* Colonne 2 (Toujours visible) */}
         <div className="flex-1 flex flex-col gap-4">
            <div className="w-full aspect-video bg-rev-surfaceHighlight/50 rounded-2xl"></div>
            <div className="w-full aspect-square bg-rev-surfaceHighlight/50 rounded-2xl"></div>
            <div className="w-full aspect-[3/4] bg-rev-surfaceHighlight/50 rounded-2xl"></div>
         </div>

         {/* Colonne 3 (Visible md+) */}
         <div className="flex-1 flex flex-col gap-4 hidden md:flex">
            <div className="w-full aspect-square bg-rev-surfaceHighlight/50 rounded-2xl"></div>
            <div className="w-full aspect-[3/4] bg-rev-surfaceHighlight/50 rounded-2xl"></div>
            <div className="w-full aspect-video bg-rev-surfaceHighlight/50 rounded-2xl"></div>
         </div>

         {/* Colonne 4 (Visible lg+) */}
         <div className="flex-1 flex flex-col gap-4 hidden lg:flex">
            <div className="w-full aspect-[4/3] bg-rev-surfaceHighlight/50 rounded-2xl"></div>
            <div className="w-full aspect-video bg-rev-surfaceHighlight/50 rounded-2xl"></div>
            <div className="w-full aspect-square bg-rev-surfaceHighlight/50 rounded-2xl"></div>
         </div>

         {/* Colonne 5 (Visible xl+) */}
         <div className="flex-1 flex flex-col gap-4 hidden xl:flex">
            <div className="w-full aspect-[3/4] bg-rev-surfaceHighlight/50 rounded-2xl"></div>
            <div className="w-full aspect-square bg-rev-surfaceHighlight/50 rounded-2xl"></div>
            <div className="w-full aspect-[4/3] bg-rev-surfaceHighlight/50 rounded-2xl"></div>
         </div>

      </div>
    </div>
  );
};

export default GallerySkeleton;
