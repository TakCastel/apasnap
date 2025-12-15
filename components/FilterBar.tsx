import React from 'react';
import { Search, ArrowUpAZ } from 'lucide-react';
import { MediaType } from '../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortOption: string;
  onSortChange: (value: string) => void;
  filterType: 'ALL' | MediaType;
  onFilterTypeChange: (value: 'ALL' | MediaType) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  filterType,
  onFilterTypeChange
}) => {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 pb-3 animate-fade-in">
      {/* 
        Responsive Layout:
        - Mobile/Tablet: Horizontal scrolling row (instagram style) for accessibility and space saving.
        - Desktop: Flex row justified to end.
      */}
      
      <div className="flex flex-nowrap items-center gap-3 overflow-x-auto no-scrollbar md:justify-end pb-1">
        
        {/* Search Input - Expands but has min-width */}
        <div className="relative group shrink-0 w-[180px] md:w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500 group-focus-within:text-white transition-colors" />
          </div>
          <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-rev-surface border border-white/5 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm font-medium transition-all"
          />
        </div>

        {/* Divider for visual separation on larger screens if needed, but spacing is usually enough */}

        {/* Type Filter Pills */}
        <div className="flex bg-rev-surface border border-white/5 rounded-2xl p-1 gap-1 shrink-0">
          {['ALL', MediaType.IMAGE, MediaType.VIDEO].map((type) => (
            <button
              key={type}
              onClick={() => onFilterTypeChange(type as any)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === type ? 'bg-rev-surfaceHighlight text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {type === 'ALL' ? 'Tout' : type === MediaType.IMAGE ? 'Photos' : 'Vidéos'}
            </button>
          ))}
        </div>
        
        {/* Sort Dropdown */}
        <div className="relative shrink-0 group">
          <select 
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2.5 bg-rev-surface border border-white/5 rounded-2xl text-white text-sm font-bold focus:outline-none cursor-pointer hover:bg-rev-surfaceHighlight transition-colors"
          >
            <option value="date_desc">Récent</option>
            <option value="date_asc">Ancien</option>
            <option value="name_asc">A-Z</option>
          </select>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-white transition-colors">
            <ArrowUpAZ size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;