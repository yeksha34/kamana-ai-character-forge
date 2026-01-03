
import React, { useMemo } from 'react';
import { AlertTriangle, RotateCw, X } from 'lucide-react';
import { AISecret } from '../types';
import { GlassCard } from './ui/GlassCard';

const ROTATION_THRESHOLD_DAYS = 30;

interface KeyRotationBannerProps {
  secrets: AISecret[];
  onDismiss: () => void;
  onNavigateToSettings: () => void;
}

export const KeyRotationBanner: React.FC<KeyRotationBannerProps> = ({ secrets, onDismiss, onNavigateToSettings }) => {
  const staleSecrets = useMemo(() => {
    const now = Date.now();
    return secrets.filter(s => {
      const diffDays = (now - s.updatedAt) / (1000 * 60 * 60 * 24);
      return diffDays >= ROTATION_THRESHOLD_DAYS;
    });
  }, [secrets]);

  if (staleSecrets.length === 0) return null;

  return (
    <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[150] w-full max-w-2xl px-4 animate-in slide-in-from-top-4 duration-500">
      <GlassCard padding="sm" className="bg-amber-950/90 border-amber-500/40 rounded-3xl flex items-center justify-between gap-6 px-8 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/20 p-2 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">Security Warning</span>
            <p className="text-[9px] text-amber-200/60 font-medium tracking-tight">
              {staleSecrets.length} keys (including {staleSecrets[0].provider}) haven't been rotated in over {ROTATION_THRESHOLD_DAYS} days.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onNavigateToSettings}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-amber-950 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg active:scale-95"
          >
            <RotateCw className="w-3 h-3" />
            Rotate Now
          </button>
          <button onClick={onDismiss} className="p-2 hover:bg-white/10 rounded-full transition-colors text-amber-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
