
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Hash, X, Sparkles } from 'lucide-react';
import { TagMeta } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface BaseTagSelectorProps {
  label: string;
  selectedTags: string[];
  onToggle: (tagName: string) => void;
  availableTags: TagMeta[];
  placeholder?: string;
}

const BaseTagSelector: React.FC<BaseTagSelectorProps> = ({
  label,
  selectedTags,
  onToggle,
  availableTags,
  placeholder = "Search attributes..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredTags = useMemo(() => {
    return availableTags.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableTags, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4 relative" ref={dropdownRef}>
      <label className="text-[8px] font-bold text-rose-900 uppercase tracking-widest ml-1 block">
        {label}
      </label>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map(tag => (
          <span key={tag} className="flex items-center gap-2 px-3 py-1 bg-rose-950/40 border border-rose-900/20 rounded-full text-[9px] font-black text-rose-300 uppercase tracking-widest group animate-in zoom-in duration-300">
            <Hash className="w-2.5 h-2.5 opacity-40 animate-pulse" />
            {tag}
            <button onClick={() => onToggle(tag)} className="hover:text-white transition-colors group/del">
              <X className="w-2.5 h-2.5 group-hover/del:animate-icon-wiggle" />
            </button>
          </span>
        ))}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 border border-rose-950/20 rounded-xl px-4 py-3 text-[10px] font-bold text-rose-100 uppercase tracking-widest flex items-center justify-between hover:border-rose-700/40 transition-all group"
      >
        <div className="flex items-center gap-3">
          <Hash className="w-3 h-3 text-rose-500 group-hover:rotate-12 transition-transform" />
          <span>Select Attributes</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-rose-900 transition-transform duration-500 ${isOpen ? 'rotate-180 text-rose-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[200] art-glass rounded-2xl border border-rose-900/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-3 border-b border-rose-950/30">
            <div className="relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-rose-900 group-hover/search:scale-110 transition-transform" />
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-black/20 border-none rounded-lg pl-9 pr-4 py-2 text-[10px] text-rose-100 placeholder:text-rose-950/40 focus:ring-1 focus:ring-rose-800/30"
              />
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredTags.length === 0 ? (
              <div className="p-8 text-center text-[9px] font-black uppercase tracking-widest text-rose-950">
                No match found
              </div>
            ) : (
              filteredTags.map(t => (
                <button
                  key={t.id}
                  onClick={() => onToggle(t.name)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all group/item ${
                    selectedTags.includes(t.name) ? 'bg-rose-900/20 border border-rose-900/30' : 'hover:bg-rose-950/20 border border-transparent'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold tracking-widest uppercase ${selectedTags.includes(t.name) ? 'text-rose-400' : 'text-rose-100/60 group-hover/item:text-rose-100'}`}>
                      {t.name}
                    </span>
                    <span className="text-[7px] font-black text-rose-950 uppercase mt-0.5 line-clamp-1 group-hover/item:text-rose-800 transition-colors">
                      {t.textGenerationRule}
                    </span>
                  </div>
                  {t.isNSFW && (
                    <Sparkles className="w-3 h-3 text-rose-600 opacity-50 animate-icon-glow" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const TagSelector = (props: { label: string, selectedTags: string[], isNSFW: boolean, onToggle: (tagName: string) => void }) => {
  const { tags } = useAppContext();
  
  const availableTags = useMemo(() => {
    return tags.filter(t => {
      if (!props.isNSFW && t.isNSFW) return false;
      return true;
    });
  }, [tags, props.isNSFW]);

  return <BaseTagSelector {...props} availableTags={availableTags} />;
};
