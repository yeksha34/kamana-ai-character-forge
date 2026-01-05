import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { CharacterData, CharacterField } from '../../types';

interface CharacterFieldsProps {
  fields: CharacterField[];
  onToggleLock: (id: string) => void;
  onUpdateValue: (id: string, value: string) => void;
  worldInfo?: { label: string; content: string }[];
}

export const CharacterFields: React.FC<CharacterFieldsProps> = ({ fields, onToggleLock, onUpdateValue, worldInfo }) => {
  return (
    <div className="space-y-48 relative z-10">
      {fields.map((field) => (
        <div key={field.id} className="group/field relative space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="flex items-center justify-between px-8">
            <span className="text-[11px] font-black text-rose-900 uppercase tracking-[0.4em]">{field.label}</span>
            <button 
              onClick={() => onToggleLock(field.id)} 
              className={`p-2.5 rounded-full transition-all ${field.isLocked ? 'bg-rose-800 text-white' : 'bg-black/40 text-rose-900 border border-rose-900/20'}`}
            >
              {field.isLocked ? <Lock className="w-4 h-4 animate-icon-glow" /> : <Unlock className="w-4 h-4" />}
            </button>
          </div>
          
          <textarea 
            disabled={field.isLocked} 
            value={field.value} 
            onChange={(e) => onUpdateValue(field.id, e.target.value)} 
            className={`w-full min-h-[300px] rounded-[3rem] p-10 text-xl leading-[2.2] serif-display italic transition-all ${field.isLocked ? 'opacity-30' : 'text-rose-100'}`} 
            placeholder={`Enter ${field.label}...`}
          />
        </div>
      ))}

      {worldInfo && worldInfo.length > 0 && (
        <div className="space-y-12 pt-24 border-t border-rose-950/20">
           <span className="text-[14px] font-black uppercase tracking-[0.8em] text-rose-950 px-8">AIDungeon Knowledge Cards</span>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8">
              {worldInfo.map((card, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-black/40 border border-rose-900/20 space-y-4 hover-animate">
                   <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">{card.label}</span>
                   <p className="text-xs text-rose-100/60 leading-relaxed italic">{card.content}</p>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};