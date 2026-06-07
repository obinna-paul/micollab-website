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

const FilterSidebar = ({ filters, setFilters }) => {
  
  const handleToggle = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? '' : value
    }));
  };

  return (
    <div className="bg-[var(--bg-base)] border border-[var(--border-primary)] p-6 rounded-3xl space-y-8">
      {/* Category */}
      <div>
        <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
           <Briefcase size={14} className="text-[#7B5CFA]" /> Category
        </h3>
        <select 
          value={filters.category}
          onChange={(e) => setFilters(p => ({ ...p, category: e.target.value }))}
          className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-xl py-3 px-4 text-xs font-bold text-[var(--text-primary)] focus:border-[#7B5CFA]/40 outline-none transition-all cursor-pointer appearance-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
           <Globe size={14} className="text-[#7B5CFA]" /> Work Type
        </h3>
        <div className="flex flex-col gap-2">
           <button 
             onClick={() => handleToggle('locationType', 'REMOTE')}
             className={`flex items-center justify-between py-2.5 px-4 border rounded-xl text-xs font-bold transition-all ${filters.locationType === 'REMOTE' ? 'border-[#7B5CFA] bg-[#7B5CFA]/10 text-[#7B5CFA]' : 'border-[var(--border-primary)] bg-[var(--bg-surface-alt)] text-[var(--text-muted)] hover:text-white hover:border-[var(--border-secondary)]'}`}
           >
              Remote
              {filters.locationType === 'REMOTE' && <CheckCircle size={14} />}
           </button>
           <button 
             onClick={() => handleToggle('locationType', 'IN_PERSON')}
             className={`flex items-center justify-between py-2.5 px-4 border rounded-xl text-xs font-bold transition-all ${filters.locationType === 'IN_PERSON' ? 'border-[#7B5CFA] bg-[#7B5CFA]/10 text-[#7B5CFA]' : 'border-[var(--border-primary)] bg-[var(--bg-surface-alt)] text-[var(--text-muted)] hover:text-white hover:border-[var(--border-secondary)]'}`}
           >
              In-Person
              {filters.locationType === 'IN_PERSON' && <CheckCircle size={14} />}
           </button>
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
           <Filter size={14} className="text-[#7B5CFA]" /> Experience
        </h3>
        <div className="space-y-3">
           {['BEGINNER', 'INTERMEDIATE', 'EXPERT'].map(level => (
             <label key={level} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  className="w-4 h-4 rounded bg-[var(--bg-surface-alt)] border-[var(--border-primary)] text-[#7B5CFA] focus:ring-[#7B5CFA]"
                  checked={filters.experienceLevel === level}
                  onChange={() => handleToggle('experienceLevel', level)}
                />
                <span className={`text-xs font-bold uppercase transition-colors ${filters.experienceLevel === level ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`}>
                  {level.toLowerCase()}
                </span>
             </label>
           ))}
        </div>
      </div>

      {/* Verified Only */}
      <div className="pt-6 border-t border-[var(--border-primary)]">
         <label className="flex items-center justify-between cursor-pointer group">
            <span className={`text-xs font-black uppercase transition-colors ${filters.verifiedOnly ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>Verified Postings Only</span>
            <div 
              onClick={() => setFilters(p => ({ ...p, verifiedOnly: !p.verifiedOnly }))}
              className={`w-10 h-5 rounded-full relative transition-colors ${filters.verifiedOnly ? 'bg-[#7B5CFA]' : 'bg-[var(--bg-surface-alt)] border border-[var(--border-primary)]'}`}
            >
               <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${filters.verifiedOnly ? 'right-0.5' : 'left-0.5'}`} />
            </div>
         </label>
      </div>

      <button 
        onClick={() => setFilters({ category: '', locationType: '', experienceLevel: '', budgetRange: 'ALL', verifiedOnly: false })}
        className="w-full py-3 text-[10px] font-black uppercase text-[var(--text-muted)] hover:text-[#7B5CFA] transition-colors mt-8 bg-white/[0.02] hover:bg-[#7B5CFA]/10 rounded-xl"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterSidebar;
