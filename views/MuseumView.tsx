
import React from 'react';
import { ArrowLeft, Grid, ImageIcon, Trash2 } from 'lucide-react';
import { CharacterData } from '../types';

interface MuseumViewProps {
  characters: CharacterData[];
  onNavigate: (route: string) => void;
  onEdit: (character: CharacterData) => void;
  onDelete: (id: string) => void;
}

export const MuseumView: React.FC<MuseumViewProps> = ({ characters, onNavigate, onEdit, onDelete }) => {
  return (
    <div className="min-h-screen flex flex-col p-8 md:p-16 animate-in fade-in slide-in-from-right-10 duration-1000">
      <div className="flex items-center justify-between mb-24 border-b border-rose-950/30 pb-12">
        <div className="flex items-center gap-10">
          <button onClick={() => onNavigate('#/studio')} className="p-5 hover:bg-rose-900/20 rounded-full transition-all text-rose-500">
            <ArrowLeft className="w-10 h-10" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-7xl serif-display text-rose-50 italic">दालन</h2>
            <span className="text-[11px] font-black uppercase tracking-[1.5em] text-rose-950 mt-2">Gallery Museum</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-900">संग्रह संख्या</p>
              <p className="text-2xl serif-display italic text-rose-500">{characters.length} पात्रे</p>
           </div>
           <div className="h-10 w-[1px] bg-rose-950/20 mx-4" />
           <button onClick={() => onNavigate('#/studio')} className="px-10 py-4 bg-rose-950/20 border border-rose-900/30 text-rose-500 rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-900 hover:text-white transition-all">परत जा</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-16">
        {characters.length === 0 ? (
          <div className="col-span-full h-[600px] flex flex-col items-center justify-center opacity-10">
            <Grid className="w-48 h-48 mb-10" />
            <p className="text-4xl serif-display italic">अद्याप काहीही जतन केलेले नाही...</p>
          </div>
        ) : (
          characters.map(c => (
            <div key={c.id} className="group art-glass rounded-[4rem] overflow-hidden border border-rose-950/20 hover:border-rose-700/40 transition-all duration-700 flex flex-col">
              <div className="aspect-square relative overflow-hidden bg-rose-950/10">
                 {c.characterImageUrl ? (
                   <img src={c.characterImageUrl} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center opacity-10"><ImageIcon className="w-24 h-24" /></div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                 <div className="absolute bottom-10 left-10">
                    <h4 className="text-5xl serif-display italic text-rose-50 glow-text">{c.name}</h4>
                 </div>
              </div>
              <div className="p-12 flex-1 flex flex-col justify-between">
                 <div className="flex gap-4">
                    <button 
                      onClick={() => onEdit(c)} 
                      className="flex-1 py-5 bg-rose-800/10 border border-rose-900/20 text-rose-500 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-rose-800 hover:text-white transition-all"
                    >
                      संपादन करा (Edit)
                    </button>
                    <button 
                      onClick={() => onDelete(c.id!)} 
                      className="p-5 bg-rose-950/30 text-rose-950 hover:text-rose-500 rounded-full transition-all border border-rose-900/10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
