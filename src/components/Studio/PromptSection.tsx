import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Layers, Binary, History, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { CharacterData, PromptHistoryEntry } from '../../types';

interface PromptSectionProps {
  character: CharacterData;
  setCharacter: React.Dispatch<React.SetStateAction<CharacterData>>;
  showAssets: boolean;
  setShowAssets: (show: boolean) => void;
}

export const PromptSection: React.FC<PromptSectionProps> = ({ character, setCharacter, showAssets, setShowAssets }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempPrompt, setTempPrompt] = useState(character.modifiedPrompt || '');
  const [showHistory, setShowHistory] = useState(false);

  const handleSaveModified = () => {
    if (tempPrompt === character.modifiedPrompt) {
      setIsEditing(false);
      return;
    }
    const historyEntry: PromptHistoryEntry = {
      text: character.modifiedPrompt || '',
      timestamp: Date.now()
    };
    setCharacter(prev => ({
      ...prev,
      modifiedPrompt: tempPrompt,
      promptHistory: prev.modifiedPrompt ? [...(prev.promptHistory || []), historyEntry] : prev.promptHistory
    }));
    setIsEditing(false);
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-center">
        <button onClick={() => setShowAssets(!showAssets)} className="flex items-center gap-3 px-8 py-3 bg-rose-950/20 border border-rose-900/20 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-900/40 transition-all group/assets">
          {showAssets ? <ChevronUp className="w-4 h-4 group-hover/assets:-translate-y-1 transition-transform" /> : <ChevronDown className="w-4 h-4 group-hover/assets:translate-y-1 transition-transform" />}
          {showAssets ? 'Hide Generation Seed' : 'View Generation Seed'}
        </button>
      </div>

      {showAssets && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <GlassCard padding="md" className="rounded-[2.5rem] space-y-4 border-rose-900/30 hover-animate">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-800 flex items-center gap-2">
                <Layers className="w-3 h-3 animate-icon-float" /> Modified Prompt
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowHistory(!showHistory)} 
                  className="p-1.5 rounded-lg bg-rose-950/20 text-rose-600 hover:bg-rose-900/40 transition-all"
                  title="View History"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
                {isEditing ? (
                  <button onClick={handleSaveModified} className="p-1.5 rounded-lg bg-green-950/20 text-green-600 hover:bg-green-900/40 transition-all">
                    <Save className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button onClick={() => { setIsEditing(true); setTempPrompt(character.modifiedPrompt || ''); }} className="text-[8px] font-black uppercase text-rose-700 hover:text-rose-400">Edit</button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <textarea 
                value={tempPrompt}
                onChange={(e) => setTempPrompt(e.target.value)}
                className="w-full h-32 bg-black/40 border border-rose-950/20 rounded-xl p-4 text-xs italic text-rose-200 leading-relaxed font-serif"
              />
            ) : (
              <p className="text-xs italic text-rose-200/50 leading-relaxed font-serif">{character.modifiedPrompt || 'N/A'}</p>
            )}

            {showHistory && character.promptHistory && character.promptHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-rose-950/20 space-y-3">
                <span className="text-[7px] font-black uppercase tracking-widest text-rose-950">Read-Only History</span>
                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                  {character.promptHistory.map((h, i) => (
                    <div key={i} className="p-3 bg-black/20 rounded-xl border border-rose-950/10">
                      <p className="text-[9px] text-rose-200/30 italic leading-relaxed line-clamp-3 mb-1">"{h.text}"</p>
                      <span className="text-[6px] font-bold text-rose-900 uppercase">{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                  )).reverse()}
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard padding="md" className="rounded-[2.5rem] space-y-4 border-rose-900/30 hover-animate">
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-800 flex items-center gap-2"><Binary className="w-3 h-3 animate-icon-wiggle" /> System Logic</span>
            <p className="text-xs italic text-rose-200/50 leading-relaxed font-serif line-clamp-6">{character.systemRules || 'N/A'}</p>
          </GlassCard>
        </div>
      )}
    </div>
  );
};