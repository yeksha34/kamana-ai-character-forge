import { CharacterData } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { DisplayTitle } from '../components/ui/DisplayTitle';
import { Badge } from '../components/ui/Badge';
// Added Copy to imports
import { CheckCircle2, FileText, Grid, History, ImageIcon, Trash2, Download, CheckSquare, Square, X, RefreshCw, Copy } from 'lucide-react';
import React, { useState } from 'react';
import { downloadCharactersZip } from '../utils/exportUtils';

interface MuseumViewProps {
  characters: CharacterData[];
  onNavigate: (route: string) => void;
  onEdit: (character: CharacterData) => void;
  onDelete: (id: string) => void;
  onDuplicate: (character: CharacterData) => void;
}

export const MuseumView: React.FC<MuseumViewProps> = ({ characters = [], onNavigate, onEdit, onDelete, onDuplicate }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkExport = async () => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);
    try {
      const exportList = characters.filter(c => selectedIds.includes(c.id!));
      const filename = `Forge_Museum_Export_${Date.now()}.zip`;
      await downloadCharactersZip(exportList, filename);
    } finally {
      setIsExporting(false);
      setSelectedIds([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-8 md:p-16 pt-72 animate-in fade-in slide-in-from-right-10 duration-1000">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-24 border-b border-rose-950/30 pb-20 gap-12">
        <DisplayTitle marathi="दालन" english="Gallery Museum" size="lg" />
        
        <div className="flex items-center gap-8 self-start lg:self-end">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={handleBulkExport}
                disabled={isExporting}
                className="flex items-center gap-3 px-8 py-4 bg-rose-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 transition-all shadow-2xl disabled:opacity-50"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export {selectedIds.length} Selected
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="p-4 bg-rose-950/40 text-rose-500 border border-rose-900/20 rounded-full hover:bg-rose-900/40 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-900 mb-1">संग्रह संख्या (Total)</p>
            <p className="text-3xl serif-display italic text-rose-500">{characters.length} पात्रे</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-16">
        {characters.length === 0 ? (
          <div className="col-span-full h-[600px] flex flex-col items-center justify-center opacity-10">
            <Grid className="w-48 h-48 mb-10 animate-icon-float" />
            <p className="text-5xl serif-display italic tracking-widest text-center">अद्याप काहीही जतन केलेले नाही...</p>
          </div>
        ) : (
          characters.map(c => (
            <GlassCard 
              key={c.id} 
              hoverable 
              padding="none" 
              className={`rounded-[4rem] overflow-hidden flex flex-col shadow-2xl group hover-animate transition-all duration-500 ${selectedIds.includes(c.id!) ? 'ring-4 ring-rose-500/50 scale-[0.98]' : ''}`}
            >
              <div className="aspect-square relative overflow-hidden bg-rose-950/10">
                {/* Selection Overlay */}
                <button 
                  onClick={() => toggleSelect(c.id!)}
                  className="absolute top-8 left-8 z-30 p-4 rounded-full backdrop-blur-xl border border-white/10 bg-black/40 text-white transition-all hover:bg-rose-600 active:scale-90"
                >
                  {selectedIds.includes(c.id!) ? <CheckSquare className="w-6 h-6 text-white" /> : <Square className="w-6 h-6 opacity-40" />}
                </button>

                {c.characterImageUrl ? (
                  <img src={c.characterImageUrl} className="w-full h-full object-cover transition-transform duration-[12s] group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10">
                    <ImageIcon className="w-24 h-24 animate-pulse" />
                  </div>
                )}

                <div className="absolute top-8 right-8 z-20 flex flex-col gap-2 items-end">
                  <Badge 
                    label={c.status} 
                    icon={c.status === 'finalized' ? CheckCircle2 : FileText} 
                    variant={c.status === 'finalized' ? 'green' : 'rose'} 
                    className={c.status === 'finalized' ? 'animate-icon-glow' : ''}
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
                    className="flex-1 py-6 bg-rose-800/10 border border-rose-900/20 text-rose-500 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-rose-800 hover:text-white transition-all shadow-xl group/edit"
                  >
                    संपादन करा (Edit)
                  </button>
                  <button
                    onClick={() => onDuplicate(c)}
                    title="Duplicate Creation"
                    className="p-6 bg-rose-950/50 text-rose-950 hover:text-rose-400 rounded-full transition-all border border-rose-900/10 hover:border-rose-700/50 active:scale-90 group/duplicate"
                  >
                    <Copy className="w-6 h-6 group-hover/duplicate:animate-icon-float" />
                  </button>
                  <button
                    onClick={() => onDelete(c.id!)}
                    className="p-6 bg-rose-950/50 text-rose-950 hover:text-rose-500 rounded-full transition-all border border-rose-900/10 hover:border-rose-700/50 active:scale-90 group/delete"
                  >
                    <Trash2 className="w-6 h-6 group-hover/delete:animate-icon-wiggle" />
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