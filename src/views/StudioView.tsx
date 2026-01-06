import React, { useState, useEffect } from 'react';
import { TagSelector } from '../components/TagSelector';
import { TextModelSelector, ImageModelSelector } from '../components/ModelSelector';
import { PlatformSelector } from '../components/PlatformSelector';
import { KeyRotationBanner } from '../components/KeyRotationBanner';
import { PromptSection } from '../components/Studio/PromptSection';
import { VisualAssets } from '../components/Studio/VisualAssets';
import { CharacterIdentity } from '../components/Studio/CharacterIdentity';
import { CharacterFields } from '../components/Studio/CharacterFields';
import { GlassCard } from '../components/ui/GlassCard';
import { DisplayTitle } from '../components/ui/DisplayTitle';
import { ChatView } from './ChatView';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { useForgeGenerator } from '../hooks/useForgeGenerator';
import { saveCharacter, fetchUserSecrets, fetchChatSession } from '../services/supabaseDatabaseService';
import { uploadImageToStorage } from '../services/supabaseStorageService';
import { ForgeManager } from '../services/forge/ForgeManager';
import { AIProvider, CharacterData, CharacterStatus, Platform, AISecret, ChatSession } from '../types';
import { hashData } from '../utils/helpers';
import { downloadCharactersZip, parseImportFile } from '../utils/exportUtils';
import { History, Zap, RefreshCw, Check, Download, MessageSquare, X, Globe, Heart, Sparkles, Upload, BrainCircuit } from 'lucide-react';
import { useViewport } from '../hooks/useViewport';

interface StudioViewProps {
  character: CharacterData;
  setCharacter: React.Dispatch<React.SetStateAction<any>>;
}

export const StudioView: React.FC<StudioViewProps> = ({ character, setCharacter }) => {
  const { isMobile } = useViewport();
  const { user } = useAuth();
  const { models: dbModels, t, userSecrets } = useAppContext();
  const [promptInput, setPromptInput] = useState(character.originalPrompt || '');
  const [showAssets, setShowAssets] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([Platform.CRUSHON_AI]);
  const [isSaving, setIsSaving] = useState<CharacterStatus | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState<'character' | 'scenario' | null>(null);
  const [textModel, setTextModel] = useState('gemini-3-flash-preview');
  const [imageModel, setImageModel] = useState('gemini-2.5-flash-image');
  const [secretsList, setSecretsList] = useState<AISecret[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  const { generate, isGenerating, generationStep } = useForgeGenerator(character, setCharacter, textModel, imageModel, selectedPlatforms);

  useEffect(() => { 
    if (user) {
      fetchUserSecrets(user.id).then(setSecretsList);
      if (character.id && character.id !== 'new') {
        fetchChatSession(character.id, user.id).then(setActiveSession);
      }
    }
  }, [user, character.id]);

  const regenerateSingleImage = async (type: 'character' | 'scenario') => {
    setIsRegeneratingImage(type);
    try {
      const imgProvider = dbModels.find(m => m.id === imageModel)?.provider || AIProvider.GEMINI;
      const imgService = ForgeManager.getProvider(imgProvider, userSecrets[imgProvider]);
      const txtService = ForgeManager.getProvider(AIProvider.GEMINI, userSecrets[AIProvider.GEMINI]);
      let prompt = type === 'character' ? character.characterImagePrompt : character.scenarioImagePrompt;
      if (!prompt) prompt = await txtService.generateImagePrompt({ prompt: character.originalPrompt, type, isNSFW: character.isNSFW, modelId: textModel });
      const img = await imgService.generateImage({ prompt, isNSFW: character.isNSFW, modelId: imageModel });
      if (img) {
        const cloudUrl = user ? await uploadImageToStorage(user.id, img, type === 'character' ? 'portrait' : 'scenario') : null;
        setCharacter((p: any) => ({ ...p, [type === 'character' ? 'characterImageUrl' : 'scenarioImageUrl']: cloudUrl || img }));
      }
    } finally { setIsRegeneratingImage(null); }
  };

  const handleSave = async (status: CharacterStatus) => {
    if (!user || !character.name) return;
    setIsSaving(status);
    try {
      const res = await saveCharacter(user.id, { ...character, status }, await hashData(character.originalPrompt));
      if (res) {
        setCharacter((p: any) => ({ ...p, id: res.id }));
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
        if (!window.location.hash.includes(res.id)) window.location.hash = `#/studio/${res.id}`;
      }
    } finally { setIsSaving(null); }
  };

  const handleExport = () => downloadCharactersZip([character], `${character.name || 'Archetype'}_Manifest.zip`);
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imported = await parseImportFile(file);
    if (imported.length > 0) setCharacter({ ...imported[0], id: 'new' });
  };

  const userName = localStorage.getItem('kamana_user_name') || 'User';

  return (
    <div className={`min-h-screen animate-in fade-in duration-700 relative ${isMobile ? 'pt-24' : 'pt-32'}`}>
      <KeyRotationBanner secrets={secretsList} onDismiss={() => {}} onNavigateToSettings={() => window.location.hash = '#/settings'} />
      
      {isChatOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-2 lg:p-4 bg-black/90 backdrop-blur-3xl animate-in fade-in">
           <div className="relative w-full max-w-7xl h-full lg:h-[95vh] bg-black lg:rounded-[3rem] overflow-hidden border border-rose-900/40 shadow-2xl">
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="absolute top-4 right-4 lg:top-8 lg:right-8 z-[410] p-3 lg:p-4 rounded-full bg-rose-600 text-white shadow-2xl hover:bg-rose-500 active:scale-90 transition-all border border-rose-500/50"
              >
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
              <ChatView character={character} isFullScreen={true} onNavigate={(r) => { setIsChatOpen(false); window.location.hash = r; }} />
           </div>
        </div>
      )}

      <div className={`max-w-[1700px] mx-auto w-full border-b border-rose-950/20 mb-8 flex items-end justify-between ${isMobile ? 'px-6 pb-4' : 'px-12 pb-10'}`}>
        <DisplayTitle marathi="कार्यशाला" english="Forge Studio" size={isMobile ? 'sm' : 'md'} />
        <div className="flex items-center gap-3 lg:gap-6">
          <div className="flex gap-2 lg:gap-3">
             <label className="p-2.5 lg:px-6 lg:py-3 bg-rose-950/20 border border-rose-900/20 text-rose-500 rounded-full cursor-pointer hover:bg-rose-900/40 transition-all flex items-center gap-3">
                <Upload className="w-4 h-4" /> <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">Import</span>
                <input type="file" className="hidden" onChange={handleImport} accept=".json,.zip" />
             </label>
             <button onClick={handleExport} className="p-2.5 lg:px-6 lg:py-3 bg-rose-950/20 border border-rose-900/20 text-rose-500 rounded-full hover:bg-rose-900/40 transition-all flex items-center gap-3">
                <Download className="w-4 h-4" /> <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">Export</span>
             </button>
          </div>
          {character.name && (
            <button onClick={() => setIsChatOpen(true)} className="px-6 lg:px-8 py-2.5 lg:py-3.5 bg-rose-600 text-white rounded-full font-black text-[9px] lg:text-[10px] uppercase tracking-widest hover:bg-rose-500 shadow-xl flex items-center gap-3 active:scale-95 transition-all">
               <MessageSquare className="w-4 h-4" /> Preview
            </button>
          )}
        </div>
      </div>

      <main className={`max-w-[1700px] mx-auto grid gap-8 lg:gap-20 ${isMobile ? 'px-6 pb-48 grid-cols-1' : 'px-12 grid-cols-12'}`}>
        <section className={`${isMobile ? '' : 'col-span-4'} space-y-10`}>
          <GlassCard padding="lg" className="rounded-[2.5rem] space-y-10 border-rose-900/30">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-950">Axis Controls</span>
                <div className="flex gap-3">
                  <button onClick={() => setCharacter((p: any) => ({ ...p, isNSFW: !p.isNSFW }))} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${character.isNSFW ? 'bg-rose-600 border-rose-500 text-white' : 'bg-rose-950/20 border-rose-900/20 text-rose-900'}`}>
                    <Heart className={`w-3.5 h-3.5 ${character.isNSFW ? 'fill-current' : ''}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest">NSFW</span>
                  </button>
                  <button onClick={() => setCharacter((p: any) => ({ ...p, isWebResearchEnabled: !p.isWebResearchEnabled }))} className={`p-2.5 rounded-xl border transition-all ${character.isWebResearchEnabled ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-950/20 border-rose-900/20 text-rose-900'}`}><Globe className="w-4 h-4" /></button>
                </div>
              </div>
              <textarea value={promptInput} onChange={(e) => setPromptInput(e.target.value)} className={`w-full ${isMobile ? 'h-40' : 'h-[250px]'} rounded-2xl p-6 text-base serif-display italic leading-relaxed custom-scrollbar`} placeholder={t.placeholderPrompt} />
            </div>
            <div className="space-y-10">
              <TagSelector label="Soul Attributes" selectedTags={character.tags} isNSFW={character.isNSFW} onToggle={(tag) => setCharacter((p: any) => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter((t: string) => t !== tag) : [...p.tags, tag] }))} />
              <div className="grid grid-cols-1 gap-4 p-6 bg-black/20 rounded-[2rem] border border-rose-950/20">
                <TextModelSelector label="Intelligence" value={textModel} onSelect={setTextModel} />
                <ImageModelSelector label="Visuals" value={imageModel} onSelect={setImageModel} />
              </div>

              {activeSession && activeSession.nodes.length > 1 && (
                <div className="pt-10 border-t border-rose-950/20 space-y-6">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-rose-500 flex items-center gap-3">
                    <BrainCircuit className="w-4 h-4 animate-pulse" /> Neural Memories
                  </span>
                  <div className="space-y-4">
                    {activeSession.nodes.slice(-3).map((node, idx) => (
                      <div key={idx} className="p-4 bg-black/40 rounded-2xl border border-rose-900/20">
                        <span className="text-[7px] font-black uppercase text-rose-900 block mb-1">
                          {node.role === 'user' ? userName : character.name}
                        </span>
                        <p className="text-[10px] text-rose-100/60 italic line-clamp-2">
                          {node.text.replace(/\{\{user\}\}/gi, userName)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </section>

        <section className={`${isMobile ? '' : 'col-span-8'} space-y-16 pb-40`}>
          {!character.name && !isGenerating ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border border-dashed border-rose-900/20 rounded-[4rem] bg-rose-950/[0.02] p-12">
              <Sparkles className="w-20 h-20 mb-6 text-rose-950" />
              <div className="text-4xl serif-display italic tracking-widest text-center opacity-30">The forge awaits your ink…</div>
            </div>
          ) : (
            <div className="space-y-16 animate-in fade-in duration-1000">
              <VisualAssets character={character} setCharacter={setCharacter} isImageGenEnabled={imageModel !== 'None'} isRegeneratingImage={isRegeneratingImage} isGenerating={isGenerating} regenerateSingleImage={regenerateSingleImage} />
              <div className="space-y-16 bg-black/40 border border-rose-900/20 rounded-[4rem] p-8 lg:p-16 shadow-2xl">
                <CharacterIdentity name={character.name} setName={(name: string) => setCharacter((p: any) => ({ ...p, name }))} isSaving={isSaving} onSave={handleSave} />
                <CharacterFields 
                   fields={character.fields.map(f => ({ ...f, value: f.value.replace(/\{\{user\}\}/gi, userName) }))} 
                   onToggleLock={(id: string) => setCharacter((p: any) => ({ ...p, fields: p.fields.map((f: any) => f.id === id ? { ...f, isLocked: !f.isLocked } : f) }))} 
                   onUpdateValue={(id: string, val: string) => setCharacter((p: any) => ({ ...p, fields: p.fields.map((f: any) => f.id === id ? { ...f, value: val } : f) }))} 
                   worldInfo={character.worldInfo} 
                />
              </div>
              <PromptSection character={character} setCharacter={setCharacter} showAssets={showAssets} setShowAssets={setShowAssets} />
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-6 w-full max-w-sm px-6">
         {isGenerating && <div className="w-full bg-black/90 backdrop-blur-3xl border border-rose-500/30 rounded-full px-8 py-3 text-[10px] font-black uppercase text-rose-100 animate-pulse shadow-2xl flex justify-between"><span>{generationStep}</span></div>}
         <button 
           onClick={() => generate(promptInput)} 
           disabled={isGenerating || !promptInput.trim()} 
           className="w-24 h-24 lg:w-32 lg:h-32 bg-rose-700 text-white rounded-full font-black text-[9px] uppercase tracking-[0.3em] flex flex-col items-center justify-center gap-2 hover:bg-rose-600 shadow-[0_20px_60px_rgba(225,29,72,0.4)] transition-all active:scale-90 group disabled:opacity-20 border-b-4 border-rose-900"
         >
           {isGenerating ? <RefreshCw className="animate-spin w-8 h-8" /> : <><Zap className="w-8 h-8 lg:w-10 lg:h-10 group-hover:animate-icon-glow" /> <span>Forge</span></>}
         </button>
      </div>

      {showSaveSuccess && <div className="fixed bottom-36 right-8 z-[350] bg-emerald-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase shadow-2xl animate-in fade-in slide-in-from-right-4">Archetype Anchored</div>}
    </div>
  );
};