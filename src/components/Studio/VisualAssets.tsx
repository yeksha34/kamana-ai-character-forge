import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { RefreshCw, Lock, Unlock, ImageIcon } from 'lucide-react';
import { CharacterData } from '../../types';

interface VisualAssetsProps {
  character: CharacterData;
  setCharacter: React.Dispatch<React.SetStateAction<CharacterData>>;
  isImageGenEnabled: boolean;
  isRegeneratingImage: 'character' | 'scenario' | null;
  isGenerating: boolean;
  regenerateSingleImage: (type: 'character' | 'scenario') => Promise<void>;
}

export const VisualAssets: React.FC<VisualAssetsProps> = ({
  character,
  setCharacter,
  isImageGenEnabled,
  isRegeneratingImage,
  isGenerating,
  regenerateSingleImage
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 ${!isImageGenEnabled ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
      {(['character', 'scenario'] as const).map(type => {
        const isLocked = type === 'character' ? character.isCharacterImageLocked : character.isScenarioImageLocked;
        const isRegening = isRegeneratingImage === type;
        const imageUrl = type === 'character' ? character.characterImageUrl : character.scenarioImageUrl;
        const label = type === 'character' ? 'Portrait' : 'Scenario';

        return (
          <GlassCard key={type} padding="sm" className="rounded-[4rem] group relative border-rose-900/40 hover-animate">
            <div className="absolute top-10 right-10 z-20 flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                disabled={isLocked || isRegening || isGenerating}
                onClick={() => regenerateSingleImage(type)}
                className={`p-5 rounded-full backdrop-blur-3xl shadow-2xl transition-all bg-black/60 text-rose-400 border border-rose-950/30 hover:text-white disabled:opacity-20 active:scale-90`}
              >
                <RefreshCw className={`w-6 h-6 ${isRegening ? 'animate-spin text-rose-500' : ''}`} />
              </button>
              <button onClick={() => setCharacter(p => ({ ...p, [type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked']: !isLocked }))} className={`p-5 rounded-full backdrop-blur-3xl shadow-2xl transition-all ${isLocked ? 'bg-rose-700 text-white' : 'bg-black/60 text-rose-400 border border-rose-950/30'}`}>
                {isLocked ? <Lock className="w-6 h-6 animate-icon-glow" /> : <Unlock className="w-6 h-6" />}
              </button>
            </div>
            <div className="aspect-[3/4] rounded-[3.5rem] overflow-hidden bg-rose-950/5 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
              {imageUrl ? (
                <div className="relative w-full h-full overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt={type} 
                    className={`w-full h-full object-cover transform transition-all duration-[8s] group-hover:scale-105 ${isRegening ? 'scale-110 blur-xl opacity-50' : ''}`} 
                  />
                  {isRegening && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <RefreshCw className="w-12 h-12 text-rose-500 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-20">
                  <ImageIcon className="w-20 h-20" />
                  <span className="text-[10px] font-black uppercase tracking-widest">No {label} Drafted</span>
                </div>
              )}
              <div className="absolute bottom-10 left-10 z-20">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-1 block">{label} Asset</span>
                <span className="text-2xl serif-display italic text-rose-100">{character.name || 'Unnamed Art'}</span>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};