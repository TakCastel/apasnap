
import React, { useState } from 'react';
import { Search, ArrowDownUp, Image, Video, Layers, Check } from 'lucide-react';
import { MediaType } from '../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortOption: string;
  onSortChange: (value: string) => void;
  filterType: 'ALL' | MediaType;
  onFilterTypeChange: (value: 'ALL' | MediaType) => void;
  totalItems: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  filterType,
  onFilterTypeChange,
  totalItems
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);

  const sortOptions = [
    { value: 'date_desc', label: 'Plus récent' },
    { value: 'date_asc', label: 'Plus ancien' },
    { value: 'name_asc', label: 'Nom (A-Z)' },
    { value: 'name_desc', label: 'Nom (Z-A)' },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 pb-2 animate-fade-in z-20 relative">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Main "Command Pill" */}
        <div className="w-full md:w-auto flex-1 bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-full p-1.5 flex items-center shadow-2xl relative z-30">
          
          {/* Search Section */}
          <div className="relative group flex-1 min-w-[140px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500 group-focus-within:text-white transition-colors" />
            </div>
            <input
                type="text"
                placeholder={`Chercher dans ${totalItems} fichiers...`}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm font-medium"
            />
          </div>

          <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>

          {/* Segmented Control for Type (Desktop) */}
          <div className="hidden sm:flex bg-black/40 rounded-full p-1 gap-1">
            <button
              onClick={() => onFilterTypeChange('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filterType === 'ALL' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              <Layers size={12} />
              Tout
            </button>
            <button
              onClick={() => onFilterTypeChange(MediaType.IMAGE)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filterType === MediaType.IMAGE ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              <Image size={12} />
              Photos
            </button>
            <button
              onClick={() => onFilterTypeChange(MediaType.VIDEO)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filterType === MediaType.VIDEO ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              <Video size={12} />
              Vidéos
            </button>
          </div>

          <div className="w-px h-6 bg-white/10 mx-2"></div>

          {/* Sort Custom Dropdown */}
          <div className="relative shrink-0">
             <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`flex items-center justify-center h-8 w-8 rounded-full transition-all ${isSortOpen ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'}`}
                title="Trier"
             >
                <ArrowDownUp size={16} />
             </button>

             {/* Dropdown Menu */}
             {isSortOpen && (
                <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setIsSortOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-3 w-48 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl p-1 z-[100] animate-scale-in origin-top-right overflow-hidden">
                        {sortOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onSortChange(opt.value);
                                    setIsSortOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 text-xs font-bold transition-colors text-left"
                            >
                                <span className={sortOption === opt.value ? 'text-white' : 'text-gray-400'}>{opt.label}</span>
                                {sortOption === opt.value && <Check size={14} className="text-blue-500" />}
                            </button>
                        ))}
                    </div>
                </>
             )}
          </div>
        </div>

        {/* Mobile Filter Tabs (Visible only on small screens below main pill) */}
        <div className="sm:hidden flex w-full bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-full p-1 gap-1 relative z-20">
            <button
              onClick={() => onFilterTypeChange('ALL')}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${filterType === 'ALL' ? 'bg-white text-black' : 'text-gray-400'}`}
            >
              Tout
            </button>
            <button
              onClick={() => onFilterTypeChange(MediaType.IMAGE)}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${filterType === MediaType.IMAGE ? 'bg-white text-black' : 'text-gray-400'}`}
            >
              Photos
            </button>
            <button
              onClick={() => onFilterTypeChange(MediaType.VIDEO)}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${filterType === MediaType.VIDEO ? 'bg-white text-black' : 'text-gray-400'}`}
            >
              Vidéos
            </button>
        </div>

      </div>
    </div>
  );
};

export default FilterBar;
