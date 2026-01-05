import React from 'react';
import { RefreshCw, CheckCircle2, FileText } from 'lucide-react';
import { CharacterData, CharacterStatus } from '../../types';

interface CharacterIdentityProps {
  name: string;
  setName: (name: string) => void;
  isSaving: CharacterStatus | null;
  onSave: (status: CharacterStatus) => void;
}

export const CharacterIdentity: React.FC<CharacterIdentityProps> = ({ name, setName, isSaving, onSave }) => {
  return (
    <div className="flex flex-col lg:flex-row items-end justify-between border-b border-rose-950/30 pb-20 gap-16 relative z-10">
      <div className="flex flex-col gap-6 w-full">
        <span className="text-[16px] font-black uppercase tracking-[1.2em] text-rose-950">IDENTITY</span>
        <input 
          className="text-[6rem] md:text-[8rem] serif-display italic tracking-tighter bg-transparent border-none outline-none text-rose-50 w-full focus:text-rose-400 transition-all duration-1000 leading-none" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Unnamed..." 
        />
      </div>

      <div className="flex flex-col gap-4">
        <button 
          onClick={() => onSave('finalized')} 
          disabled={isSaving !== null} 
          className="flex items-center gap-4 px-10 py-5 bg-rose-600 text-white rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl disabled:opacity-50 group/save"
        >
          {isSaving === 'finalized' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 group-hover/save:animate-icon-glow" />}
          Finalize Forge
        </button>
        <button 
          onClick={() => onSave('draft')} 
          disabled={isSaving !== null} 
          className="flex items-center gap-4 px-10 py-5 bg-rose-950/40 text-rose-50 border border-rose-900/30 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-rose-900/20 transition-all disabled:opacity-50 group/draft"
        >
          {isSaving === 'draft' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 group-hover/draft:animate-icon-float" />}
          Save Draft
        </button>
      </div>
    </div>
  );
};