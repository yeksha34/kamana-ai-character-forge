import React from 'react';
import { RefreshCw, CheckCircle2, FileText } from 'lucide-react';
import { CharacterData, CharacterStatus } from '../../types';
import { MorphingText } from '../MorphingText';
import { useAppContext } from '../../contexts/AppContext';

interface CharacterIdentityProps {
  name: string;
  setName: (name: string) => void;
  isSaving: CharacterStatus | null;
  onSave: (status: CharacterStatus) => void;
}

export const CharacterIdentity: React.FC<CharacterIdentityProps> = ({ name, setName, isSaving, onSave }) => {
  const { language } = useAppContext();
  
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
          className="flex items-center gap-4 px-10 py-5 bg-rose-600 text-white rounded-full font-black transition-all shadow-xl disabled:opacity-50 group/save overflow-hidden"
        >
          {isSaving === 'finalized' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 group-hover/save:animate-icon-glow" />}
          <MorphingText language={language} value="finalize" english="Finalize Forge" className="text-[11px] uppercase tracking-widest text-left" />
        </button>
        <button 
          onClick={() => onSave('draft')} 
          disabled={isSaving !== null} 
          className="flex items-center gap-4 px-10 py-5 bg-rose-950/40 text-rose-50 border border-rose-900/30 rounded-full font-black transition-all disabled:opacity-50 group/draft overflow-hidden"
        >
          {isSaving === 'draft' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 group-hover/draft:animate-icon-float" />}
          <MorphingText language={language} value="draft" english="Save Draft" className="text-[11px] uppercase tracking-widest text-left" />
        </button>
      </div>
    </div>
  );
};