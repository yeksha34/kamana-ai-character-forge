
import { CharacterData } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { DisplayTitle } from '../components/ui/DisplayTitle';
import { Badge } from '../components/ui/Badge';
import { CheckCircle2, FileText, Grid, History, ImageIcon, Trash2 } from 'lucide-react';
import React from 'react';

interface MuseumViewProps {
  characters: CharacterData[];
  onNavigate: (route: string) => void;
  onEdit: (character: CharacterData) => void;
  onDelete: (id: string) => void;
}

export const MuseumView: React.FC<MuseumViewProps> = ({ characters = [], onNavigate, onEdit, onDelete }) => {
  return (
    <div className="min-h-screen flex flex-col p-8 md:p-16 pt-72 animate-in fade-in slide-in-from-right-10 duration-1000">
      <div className="flex items-center justify-between mb-24 border-b border-rose-950/30 pb-20">
        <DisplayTitle marathi="दालन" english="Gallery Museum" size="lg" />
        
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-900 mb-1">संग्रह संख्या (Total)</p>
          <p className="text-3xl serif-display italic text-rose-500">{characters.length} पात्रे</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-16">
        {characters.length === 0 ? (
          <div className="col-span-full h-[600px] flex flex-col items-center justify-center opacity-10">
            <Grid className="w-48 h-48 mb-10" />
            <p className="text-5xl serif-display italic tracking-widest text-center">अद्याप काहीही जतन केलेले नाही...</p>
          </div>
        ) : (
          characters.map(c => (
            <GlassCard key={c.id} hoverable padding="none" className="rounded-[4rem] overflow-hidden flex flex-col shadow-2xl">
              <div className="aspect-square relative overflow-hidden bg-rose-950/10">
                {c.characterImageUrl ? (
                  <img src={c.characterImageUrl} className="w-full h-full object-cover transition-transform duration-[12s] group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10">
                    <ImageIcon className="w-24 h-24" />
                  </div>
                )}

                <div className="absolute top-8 right-8 z-20 flex flex-col gap-2 items-end">
                  <Badge 
                    label={c.status} 
                    icon={c.status === 'finalized' ? CheckCircle2 : FileText} 
                    variant={c.status === 'finalized' ? 'green' : 'rose'} 
                  />
                  <Badge label={`v${c.version}`} icon={History} variant="neutral" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-12 left-12 right-12">
                  <h4 className="text-6xl serif-display italic text-rose-50 glow-text drop-shadow-2xl mb-4">{c.name}</h4>
                  <p className="text-[10px] text-rose-200/40 line-clamp-2 italic mb-6">"{c.originalPrompt}"</p>
                  <div className="flex gap-2 mt-4 overflow-hidden">
                    {c.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-[8px] font-black uppercase tracking-widest text-rose-500/60 border border-rose-500/20 px-3 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-12 flex-1 flex flex-col justify-between bg-black/20">
                <div className="flex gap-4">
                  <button
                    onClick={() => onEdit(c)}
                    className="flex-1 py-6 bg-rose-800/10 border border-rose-900/20 text-rose-500 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-rose-800 hover:text-white transition-all shadow-xl"
                  >
                    संपादन करा (Edit)
                  </button>
                  <button
                    onClick={() => onDelete(c.id!)}
                    className="p-6 bg-rose-950/50 text-rose-950 hover:text-rose-500 rounded-full transition-all border border-rose-900/10 hover:border-rose-700/50 active:scale-90"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};
