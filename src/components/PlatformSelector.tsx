
import React from 'react';
import { Platform } from '../types';
import { Heart, Sword, ShieldAlert, Box, Check } from 'lucide-react';

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onToggle: (platform: Platform) => void;
  label: string;
}

interface PlatformMeta {
  id: Platform;
  icon: React.ElementType;
  color: string;
  glow: string;
  description: string;
  tagline: string;
  animationClass?: string;
}

const PLATFORM_METADATA: Record<Platform, PlatformMeta> = {
  [Platform.CRUSHON_AI]: {
    id: Platform.CRUSHON_AI,
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    glow: 'shadow-rose-500/20',
    description: 'Persona-driven intimacy',
    tagline: 'INTIMATE',
    animationClass: 'animate-icon-heartbeat'
  },
  [Platform.AI_DUNGEON]: {
    id: Platform.AI_DUNGEON,
    icon: Sword,
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/20',
    description: 'Infinite world lore',
    tagline: 'ADVENTURE',
    animationClass: 'animate-icon-wiggle'
  },
  [Platform.JANITOR_AI]: {
    id: Platform.JANITOR_AI,
    icon: ShieldAlert,
    color: 'from-violet-500 to-fuchsia-600',
    glow: 'shadow-violet-500/20',
    description: 'Unfiltered bot logic',
    tagline: 'RAW RP',
    animationClass: 'animate-pulse'
  },
  [Platform.GENERIC]: {
    id: Platform.GENERIC,
    icon: Box,
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
    description: 'Universal structure',
    tagline: 'BLUEPRINT',
    animationClass: 'animate-icon-float'
  }
};

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({ selectedPlatforms, onToggle, label }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <span className="text-[10px] font-black text-rose-900 uppercase tracking-[0.5em]">{label}</span>
        <span className="text-[8px] font-bold text-rose-950 uppercase tracking-widest bg-rose-950/20 px-3 py-1 rounded-full border border-rose-900/10">
          {selectedPlatforms.length} Selected
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(Object.values(Platform) as Platform[]).map((p) => {
          const meta = PLATFORM_METADATA[p];
          const isSelected = selectedPlatforms.includes(p);
          const Icon = meta.icon;

          return (
            <button
              key={p}
              onClick={() => onToggle(p)}
              className={`
                relative group flex flex-col items-start text-left p-5 rounded-[2rem] border transition-all duration-500 overflow-hidden outline-none
                ${isSelected 
                  ? `bg-black/40 border-rose-700/50 shadow-2xl ${meta.glow}` 
                  : 'bg-black/10 border-rose-950/20 hover:border-rose-800/40 opacity-60 hover:opacity-100'}
              `}
            >
              {/* Background Glow Ring */}
              {isSelected && (
                <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${meta.color} opacity-10 blur-3xl rounded-full`} />
              )}

              <div className="flex items-center justify-between w-full mb-4">
                <div className={`
                  p-2.5 rounded-2xl transition-all duration-700 
                  ${isSelected ? `bg-gradient-to-br ${meta.color} text-white shadow-lg` : 'bg-rose-950/20 text-rose-900 group-hover:text-rose-500'}
                `}>
                  <Icon className={`w-4 h-4 ${isSelected ? meta.animationClass : ''}`} />
                </div>
                
                {isSelected && (
                  <div className="bg-rose-500 rounded-full p-1 animate-in zoom-in duration-300 shadow-[0_0_10px_var(--rose-gold)]">
                    <Check className="w-2 h-2 text-white stroke-[4px]" />
                  </div>
                )}
              </div>

              <div className="space-y-1 z-10">
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isSelected ? 'text-rose-400' : 'text-rose-950'}`}>
                  {meta.tagline}
                </span>
                <h4 className={`text-[11px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-rose-100/40'}`}>
                  {p}
                </h4>
                <p className="text-[9px] text-rose-900/60 leading-tight line-clamp-1 italic font-serif">
                  {meta.description}
                </p>
              </div>

              {/* Interactive Bottom Bar */}
              <div className={`
                absolute bottom-0 left-0 h-1 transition-all duration-700
                ${isSelected ? `w-full bg-gradient-to-r ${meta.color}` : 'w-0 bg-rose-950/20'}
              `} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
