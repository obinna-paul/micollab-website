import React from 'react';
import { 
  Filter, MapPin, DollarSign, Briefcase, 
  ChevronRight, CheckCircle, Globe
} from 'lucide-react';

const CATEGORIES = [
  "Music & Audio", "Film, TV, Video", "Photography & Visual Arts",
  "Writing & Content", "Acting & Performance", "Fashion & Beauty",
  "Design & Creative tech", "Digital & Social creator",
  "Event & Entertainment", "Education"
];

const BUDGET_RANGES = [
  { label: 'All Budgets', value: 'ALL' },
  { label: 'Unpaid (Collab)', value: 'UNPAID' },
  { label: '₦10k - ₦50k', value: 'LOW' },
  { label: '₦50k - ₦200k', value: 'MID' },
  { label: '₦200k+', value: 'HIGH' }
];

const FilterSidebar = ({ filters, setFilters }) => {
  
  const handleToggle = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? '' : value
    }));
  };

  return (
    <div className="space-y-8">
      {/* Category */}
      <div>
        <h3 className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-4 flex items-center gap-2">
           <Briefcase size={14} /> Category
        </h3>
        <select 
          value={filters.category}
          onChange={(e) => setFilters(p => ({ ...p, category: e.target.value }))}
          className="w-full bg-gray-50 border border-divider rounded-xl py-3 px-4 text-xs font-bold text-textMain focus:border-primary outline-none transition-all cursor-pointer"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <h3 className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-4 flex items-center gap-2">
           <Globe size={14} /> Work Type
        </h3>
        <div className="flex flex-col gap-2">
           <button 
             onClick={() => handleToggle('locationType', 'REMOTE')}
             className={`flex items-center justify-between py-2 px-3 border rounded-xl text-xs font-bold transition-all ${filters.locationType === 'REMOTE' ? 'border-primary bg-primary/5 text-primary' : 'border-divider text-textMuted hover:bg-gray-50'}`}
           >
              Remote
              {filters.locationType === 'REMOTE' && <CheckCircle size={14} />}
           </button>
           <button 
             onClick={() => handleToggle('locationType', 'IN_PERSON')}
             className={`flex items-center justify-between py-2 px-3 border rounded-xl text-xs font-bold transition-all ${filters.locationType === 'IN_PERSON' ? 'border-primary bg-primary/5 text-primary' : 'border-divider text-textMuted hover:bg-gray-50'}`}
           >
              In-Person
              {filters.locationType === 'IN_PERSON' && <CheckCircle size={14} />}
           </button>
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <h3 className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-4 flex items-center gap-2">
           <Filter size={14} /> Experience
        </h3>
        <div className="space-y-1.5">
           {['BEGINNER', 'INTERMEDIATE', 'PROFESSIONAL'].map(level => (
             <label key={level} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox"
                  className="w-4 h-4 rounded border-divider text-primary focus:ring-primary"
                  checked={filters.experienceLevel === level}
                  onChange={() => handleToggle('experienceLevel', level)}
                />
                <span className={`text-xs font-bold uppercase transition-colors ${filters.experienceLevel === level ? 'text-primary' : 'text-textMuted group-hover:text-textMain'}`}>
                  {level.toLowerCase()}
                </span>
             </label>
           ))}
        </div>
      </div>

      {/* Verified Only */}
      <div className="pt-4 border-t border-divider">
         <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-black text-textMain uppercase">Verified Only</span>
            <div 
              onClick={() => setFilters(p => ({ ...p, verifiedOnly: !p.verifiedOnly }))}
              className={`w-10 h-5 rounded-full relative transition-colors ${filters.verifiedOnly ? 'bg-primary' : 'bg-divider'}`}
            >
               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${filters.verifiedOnly ? 'right-1' : 'left-1'}`} />
            </div>
         </label>
      </div>

      <button 
        onClick={() => setFilters({ category: '', locationType: '', experienceLevel: '', budgetRange: 'ALL', verifiedOnly: false })}
        className="w-full py-3 text-[10px] font-black uppercase text-textMuted hover:text-primary transition-colors mt-8"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterSidebar;
