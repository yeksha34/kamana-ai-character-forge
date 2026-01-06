import React, { useState, useRef } from 'react';
import { CharacterData } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { DisplayTitle } from '../components/ui/DisplayTitle';
import { Badge } from '../components/ui/Badge';
import { useAppContext } from '../contexts/AppContext';
import { ImageIcon, Trash2, Download, Upload, CheckSquare, Square, RefreshCw, MessageSquareShare, FileEdit } from 'lucide-react';
import { downloadCharactersZip } from '../utils/exportUtils';
import { useViewport } from '../hooks/useViewport';

interface MuseumViewProps {
  characters: CharacterData[];
  onNavigate: (route: string) => void;
  onEdit: (character: CharacterData) => void;
  onDelete: (id: string) => void;
  onDuplicate: (character: CharacterData) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const MuseumView: React.FC<MuseumViewProps> = (props) => {
  const { isMobile } = useViewport();
  const { language } = useAppContext();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSelect = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  
  const handleBulkExport = async () => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);
    try { 
      await downloadCharactersZip(props.characters.filter(c => selectedIds.includes(c.id!)), `Museum_Backup_${Date.now()}.zip`); 
    } finally { 
      setIsExporting(false); 
      setSelectedIds([]); 
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsImporting(true);
    try {
      await props.onImport(e);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col animate-in fade-in slide-in-from-right-10 duration-1000 ${isMobile ? 'p-6 pt-24' : 'p-16 pt-32'}`}>
      <div className={`flex items-end justify-between border-b border-rose-950/20 ${isMobile ? 'pb-6 mb-8' : 'pb-12 mb-16'}`}>
        <DisplayTitle marathi="दालन" english="Gallery Museum" size={isMobile ? 'sm' : 'md'} />
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json,.zip" />
            <button 
              onClick={handleImportClick} 
              disabled={isImporting}
              className="flex items-center gap-3 px-4 lg:px-8 py-3 lg:py-3.5 bg-rose-950/20 border border-rose-900/20 text-rose-500 rounded-full font-black text-[9px] lg:text-[10px] uppercase tracking-widest hover:bg-rose-900/40 transition-all active:scale-95 disabled:opacity-20"
            >
              {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
              <span className="hidden sm:inline">Import</span>
            </button>
            {selectedIds.length > 0 && (
              <button onClick={handleBulkExport} disabled={isExporting} className="flex items-center gap-3 px-4 lg:px-8 py-3 lg:py-3.5 bg-rose-600 text-white rounded-full font-black text-[9px] lg:text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 disabled:opacity-20 transition-all">
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                <span className="hidden sm:inline">Export {selectedIds.length}</span>
                <span className="sm:hidden">{selectedIds.length}</span>
              </button>
            )}
          </div>
          <div className="text-right hidden xs:block">
            <p className="text-[10px] font-black uppercase text-rose-900 tracking-widest">Collection</p>
            <p className={`${isMobile ? 'text-xl' : 'text-3xl'} serif-display italic text-rose-500`}>{props.characters.length}</p>
          </div>
        </div>
      </div>

      <div className={`grid gap-8 lg:gap-12 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-3'}`}>
        {props.characters.map(c => (
          <GlassCard key={c.id} hoverable padding="none" className={`rounded-[3rem] overflow-hidden flex flex-col shadow-2xl group transition-all ${selectedIds.includes(c.id!) ? 'ring-2 ring-rose-500' : ''}`}>
            <div className="aspect-square relative overflow-hidden bg-rose-950/10">
              <button onClick={() => toggleSelect(c.id!)} className="absolute top-6 left-6 z-30 p-3 rounded-full backdrop-blur-xl bg-black/40 border border-white/10 text-white outline-none">
                {selectedIds.includes(c.id!) ? <CheckSquare className="w-5 h-5 text-rose-500" /> : <Square className="w-5 h-5 opacity-40" />}
              </button>
              {c.characterImageUrl ? (
                <img src={c.characterImageUrl} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" alt={c.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-10"><ImageIcon className="w-20 h-20" /></div>
              )}
              <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 items-end">
                <Badge label={c.status} variant={c.status === 'finalized' ? 'green' : 'rose'} />
                <Badge label={`v${c.version}`} variant="neutral" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <h4 className={`${isMobile ? 'text-2xl' : 'text-4xl'} serif-display italic text-rose-50 mb-1 truncate`}>{c.name}</h4>
                <div className="flex gap-2"><span className="text-[7px] font-black uppercase text-rose-500/60 border border-rose-500/20 px-2 py-0.5 rounded-full">Meta Manifest</span></div>
              </div>
            </div>
            <div className="p-8 bg-black/40 space-y-4">
              <button onClick={() => props.onNavigate(`#/chat/${c.id}`)} className="w-full py-4 bg-rose-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-500 active:scale-95 transition-all"><MessageSquareShare className="w-4 h-4" /> Interact</button>
              <div className="flex gap-3">
                <button onClick={() => props.onEdit(c)} className="flex-1 py-3 bg-rose-900/10 border border-rose-900/20 text-rose-500 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-rose-900/30 transition-all flex items-center justify-center gap-2"><FileEdit className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => props.onDelete(c.id!)} className="p-3 bg-rose-950/40 text-rose-900 hover:text-rose-600 rounded-full transition-all active:scale-90"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      
      {isMobile && selectedIds.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full px-6">
          <button onClick={handleBulkExport} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4">
             <Download className="w-5 h-5" /> Export {selectedIds.length} Archetypes
          </button>
        </div>
      )}
    </div>
  );
};