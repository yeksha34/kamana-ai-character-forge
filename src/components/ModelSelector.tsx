
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Sparkles, Zap, Cpu } from 'lucide-react';
import { AIProvider, AIModelMeta } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

interface BaseSelectorProps {
  label: string;
  value: string;
  onSelect: (id: string, provider: AIProvider) => void;
  models: AIModelMeta[];
  placeholder?: string;
}

/**
 * Dumb UI component for the selection dropdown
 */
const BaseModelSelector: React.FC<BaseSelectorProps> = ({
  label,
  value,
  onSelect,
  models,
  placeholder = "Search models..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = useMemo(() => 
    models.find(m => m.id === value), 
  [models, value]);

  const groupedModels = useMemo(() => {
    const filtered = models.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.provider.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<string, AIModelMeta[]> = {};
    filtered.forEach(m => {
      const pName = m.provider;
      if (!groups[pName]) groups[pName] = [];
      groups[pName].push(m);
    });
    return groups;
  }, [models, searchTerm]);

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
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="text-[8px] font-bold text-rose-900 uppercase tracking-widest ml-1 block">
        {label}
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 border border-rose-950/20 rounded-xl px-4 py-3 text-[10px] font-bold text-rose-100 uppercase tracking-widest flex items-center justify-between hover:border-rose-700/40 transition-all group"
      >
        <div className="flex items-center gap-3">
          {selectedModel?.isFree ? <Zap className="w-3 h-3 text-rose-500 animate-icon-wiggle" /> : <Sparkles className="w-3 h-3 text-amber-500 animate-icon-glow" />}
          <span>{selectedModel?.name || "Select Model"}</span>
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

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {/* Fix: Explicitly cast Object.entries result to resolve unknown type error on .length and .map */}
            {(Object.entries(groupedModels) as [string, AIModelMeta[]][]).length === 0 ? (
              <div className="p-8 text-center text-[9px] font-black uppercase tracking-widest text-rose-950">
                No match found
              </div>
            ) : (
              (Object.entries(groupedModels) as [string, AIModelMeta[]][]).map(([providerName, providerModels]) => (
                <div key={providerName} className="p-2">
                  <div className="px-3 py-1.5 flex items-center gap-2 opacity-30">
                    <Cpu className="w-2.5 h-2.5 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">{providerName}</span>
                  </div>
                  <div className="space-y-1">
                    {providerModels.map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          onSelect(m.id, m.provider);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all group/item ${
                          value === m.id ? 'bg-rose-900/20 border border-rose-900/30' : 'hover:bg-rose-950/20 border border-transparent'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold tracking-widest uppercase ${value === m.id ? 'text-rose-400' : 'text-rose-100/60 group-hover/item:text-rose-100'}`}>
                            {m.name}
                          </span>
                          <span className="text-[7px] font-black text-rose-950 uppercase mt-0.5 group-hover/item:text-rose-800 transition-colors">
                            {m.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[7px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                            m.isFree ? 'bg-rose-950/40 text-rose-500' : 'bg-amber-950/40 text-amber-500'
                          }`}>
                            {m.isFree ? 'Free' : 'Pro'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * HOC to inject models based on type and availability
 */
function withModelPopulation(
  Component: React.FC<BaseSelectorProps>, 
  modelType: 'text' | 'image'
) {
  return (props: Omit<BaseSelectorProps, 'models'>) => {
    const { models, isKeyAvailable } = useAppContext();
    const { isDevelopmentBypass } = useAuth();
    
    // Fix: Cast import.meta to any to safely check for env.DEV property in environment-agnostic code
    const isDev = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV) || isDevelopmentBypass;

    const availableModels = useMemo(() => {
      return models.filter(m => {
        if (m.type !== modelType) return false;
        if (m.id === 'None') return true;
        
        // Developer mode allows loading free models even if keys are missing
        if (isDev && m.isFree) return true;
        
        // Otherwise strictly check if the provider's key is available (User Secret or ENV)
        return isKeyAvailable(m.provider);
      });
    }, [models, isKeyAvailable, isDev, modelType]);

    return <Component {...props} models={availableModels} />;
  };
}

export const TextModelSelector = withModelPopulation(BaseModelSelector, 'text');
export const ImageModelSelector = withModelPopulation(BaseModelSelector, 'image');
