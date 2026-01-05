import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { MorphingText } from '../components/MorphingText';
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
import { saveCharacter, fetchUserSecrets } from '../services/supabaseDatabaseService';
import { uploadImageToStorage } from '../services/supabaseStorageService';
import { ForgeManager } from '../services/forge/ForgeManager';
import { AIProvider, CharacterData, CharacterStatus, Platform, AISecret } from '../types';
import { hashData } from '../utils/helpers';
import { downloadCharactersZip } from '../utils/exportUtils';
import { History, Heart, Zap, RefreshCw, Check, Download, MessageSquare, X, Globe, ExternalLink, Search } from 'lucide-react';

interface StudioViewProps {
  character: CharacterData;
  setCharacter: React.Dispatch<React.SetStateAction<any>>;
}

export const StudioView: React.FC<StudioViewProps> = ({ character, setCharacter }) => {
  const { user } = useAuth();
  const { language, models: dbModels, t, userSecrets } = useAppContext();

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

  const { generate, isGenerating, generationStep, stepIndex, errors } = useForgeGenerator(
    character, setCharacter, textModel, imageModel, selectedPlatforms
  );

  useEffect(() => { if (user) fetchUserSecrets(user.id).then(setSecretsList); }, [user]);

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
      const charToSave = { ...character, status, version: character.status === 'finalized' && status === 'draft' ? character.version + 1 : character.version };
      const res = await saveCharacter(user.id, charToSave, await hashData(charToSave.originalPrompt));
      if (res) {
        setCharacter({ ...charToSave, id: res.id });
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
        if (character.id === 'new') window.location.hash = `#/studio/${res.id}`;
      }
    } finally { setIsSaving(null); }
  };

  const handleExport = () => {
    const filename = `${character.name.replace(/\s+/g, '_')}_Forge_Bundle.zip`;
    downloadCharactersZip([character], filename);
  };

  return (
    <div className="min-h-screen flex flex-col pt-24 md:pt-36 pb-48 md:pb-64 animate-in fade-in duration-1000">
      <KeyRotationBanner secrets={secretsList} onDismiss={() => {}} onNavigateToSettings={() => window.location.hash = '#/settings'} />
      
      {/* Chat Now Popup Overlay */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
           <div className="relative w-full max-w-5xl h-[90vh] md:h-[85vh] art-glass rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border-rose-900/40">
              <button 
                onClick={() => setIsChatOpen(false)}
                className="absolute top-4 right-4 md:top-8 md:right-8 z-[310] p-3 md:p-4 rounded-full bg-black/40 text-rose-500 hover:bg-rose-900/40 transition-all border border-rose-900/20"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <ChatView character={character} onNavigate={(route) => { setIsChatOpen(false); window.location.hash = route; }} />
           </div>
        </div>
      )}

      <main className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-16 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-24">
        <section className="lg:col-span-4 space-y-8 md:space-y-12">
          <GlassCard padding="md" className="rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-between border-rose-900/40 hover-animate">
            <div className="flex items-center gap-3 md:gap-4">
              <History className="w-8 h-8 md:w-10 md:h-10 p-2 rounded-full bg-rose-950/40 text-rose-500" />
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-rose-800">Version</span>
                <span className="text-lg md:text-xl serif-display italic text-rose-100">v{character.version} • {character.status.toUpperCase()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsChatOpen(true)}
                title="Chat Now"
                className="p-3 md:p-4 bg-rose-600 text-white rounded-xl md:rounded-2xl hover:bg-rose-500 transition-all active:scale-90 shadow-lg"
              >
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button 
                onClick={handleExport}
                title="Export Character Bundle"
                className="p-3 md:p-4 bg-rose-950/20 text-rose-500 rounded-xl md:rounded-2xl hover:bg-rose-900/40 transition-all active:scale-90"
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </GlassCard>
          <GlassCard padding="lg" className="rounded-[2.5rem] md:rounded-[3rem] space-y-8 md:space-y-10 border-rose-900/40">
            <DisplayTitle marathi="कार्यशाळा" english="Forge Studio" size="md" />
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center justify-between ml-2 md:ml-4">
                <MorphingText 
                  language={language} 
                  value="imagination" 
                  english="Imagination" 
                  className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] ${errors.prompt ? 'text-red-500' : 'text-rose-900'}`} 
                />
                <div className="flex items-center gap-3 md:gap-4">
                  <div 
                    title="Deep Lore Research (Web Grounding)"
                    onClick={() => setCharacter((p: any) => ({ ...p, isWebResearchEnabled: !p.isWebResearchEnabled }))} 
                    className={`w-10 md:w-12 h-5 md:h-6 rounded-full relative cursor-pointer border border-rose-900/20 ${character.isWebResearchEnabled ? 'bg-emerald-900/40' : 'bg-rose-950/60'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 md:w-5 h-4 md:h-5 bg-white rounded-full transition-transform ${character.isWebResearchEnabled ? 'translate-x-5 md:translate-x-6' : ''} flex items-center justify-center`}>
                      <Globe className={`w-2 md:w-2.5 h-2 md:h-2.5 ${character.isWebResearchEnabled ? 'text-emerald-600' : 'text-rose-200'}`} />
                    </div>
                  </div>

                  <div 
                    title="NSFW Toggle"
                    onClick={() => setCharacter((p: any) => ({ ...p, isNSFW: !p.isNSFW }))} 
                    className={`w-10 md:w-12 h-5 md:h-6 rounded-full relative cursor-pointer ${character.isNSFW ? 'bg-rose-800' : 'bg-rose-950/60'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 md:w-5 h-4 md:h-5 bg-white rounded-full transition-transform ${character.isNSFW ? 'translate-x-5 md:translate-x-6' : ''} flex items-center justify-center`}>
                      <Heart className={`w-2 md:w-2.5 h-2 md:h-2.5 ${character.isNSFW ? 'text-rose-600' : 'text-rose-200'}`} />
                    </div>
                  </div>
                </div>
              </div>
              <textarea value={promptInput} onChange={(e) => setPromptInput(e.target.value)} className="w-full h-[150px] md:h-[250px] rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 text-base md:text-lg serif-display italic" placeholder={t.placeholderPrompt} />
            </div>
            <TagSelector 
              label="Attributes"
              selectedTags={character.tags} 
              isNSFW={character.isNSFW} 
              onToggle={(tag) => setCharacter((p: any) => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter((t: string) => t !== tag) : [...p.tags, tag] }))} 
            />
            <PlatformSelector 
              label="Platforms" 
              selectedPlatforms={selectedPlatforms} 
              onToggle={(p) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(sp => sp !== p) : [...prev, p])} 
            />
            <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-rose-950/20 border border-rose-900/10 space-y-4 md:space-y-6">
              <div>
                <MorphingText language={language} value="intelligence" english="Intelligence Engine" className="mb-2" />
                <TextModelSelector label="" value={textModel} onSelect={setTextModel} />
              </div>
              <div>
                <MorphingText language={language} value="visual" english="Visual Engine" className="mb-2" />
                <ImageModelSelector label="" value={imageModel} onSelect={setImageModel} />
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="lg:col-span-8 space-y-12 md:space-y-24">
          {!character.name && !isGenerating ? (
            <div className="h-[400px] md:h-[800px] flex flex-col items-center justify-center border border-rose-950/10 rounded-[3rem] md:rounded-[6rem] bg-rose-950/[0.02] p-8">
              <Heart className="w-24 md:w-48 h-24 md:h-48 mb-6 md:mb-10 opacity-5" />
              <div className="text-2xl md:text-5xl serif-display italic tracking-[0.1em] md:tracking-[0.3em] text-center leading-relaxed">The canvas awaits your crave...</div>
            </div>
          ) : (
            <div className="space-y-12 md:space-y-24">
              <PromptSection character={character} setCharacter={setCharacter} showAssets={showAssets} setShowAssets={setShowAssets} />
              
              {/* Research Grounding Sources */}
              {character.groundingChunks && character.groundingChunks.length > 0 && (
                <GlassCard padding="md" className="rounded-[1.5rem] md:rounded-[2.5rem] border-emerald-900/20 bg-emerald-950/5 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="flex items-center gap-3 mb-4 md:mb-6 border-b border-emerald-900/10 pb-3 md:pb-4">
                    <div className="p-2 bg-emerald-900/20 rounded-lg">
                      <Search className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-emerald-800">Research Insights</span>
                      <h4 className="text-xs md:text-sm font-bold text-emerald-100 uppercase tracking-tight">Verified Lore Sources</h4>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {character.groundingChunks.map((chunk, i) => chunk.web && (
                      <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 md:p-4 bg-black/40 border border-emerald-900/20 rounded-xl md:rounded-2xl hover:bg-emerald-900/20 transition-all group"
                      >
                        <span className="text-[8px] md:text-[9px] font-bold text-emerald-200/60 group-hover:text-emerald-200 truncate pr-4">{chunk.web.title || 'Untitled Source'}</span>
                        <ExternalLink className="w-3 h-3 text-emerald-900 group-hover:text-emerald-500" />
                      </a>
                    ))}
                  </div>
                </GlassCard>
              )}

              <VisualAssets character={character} setCharacter={setCharacter} isImageGenEnabled={imageModel !== 'None'} isRegeneratingImage={isRegeneratingImage} isGenerating={isGenerating} regenerateSingleImage={regenerateSingleImage} />
              <GlassCard padding="xl" className="rounded-[3rem] md:rounded-[7rem] space-y-16 md:space-y-32 relative overflow-hidden shadow-2xl border-rose-900/50">
                <CharacterIdentity name={character.name} setName={(name) => setCharacter((p: any) => ({ ...p, name }))} isSaving={isSaving} onSave={handleSave} />
                <CharacterFields fields={character.fields} onToggleLock={(id) => setCharacter((p: any) => ({ ...p, fields: p.fields.map((f: any) => f.id === id ? { ...f, isLocked: !f.isLocked } : f) }))} onUpdateValue={(id, val) => setCharacter((p: any) => ({ ...p, fields: p.fields.map((f: any) => f.id === id ? { ...f, value: val } : f) }))} worldInfo={character.worldInfo} />
              </GlassCard>
            </div>
          )}
        </section>
      </main>
      
      <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-3 md:gap-4 w-full px-4">
         {isGenerating && <GlassCard padding="sm" className="rounded-full flex items-center gap-4 md:gap-6 px-6 md:px-10 border-rose-500/30 bg-black/90"><div className="flex gap-1 md:gap-1.5">{[1,2,3,4,5,6,7,8].map(i => <div key={i} className={`w-2 md:w-2.5 h-2 md:h-2.5 rounded-full ${stepIndex >= i ? 'bg-rose-500' : 'bg-rose-950'}`} />)}</div><span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.5em] text-rose-100 animate-pulse truncate max-w-[150px] md:max-w-none">{generationStep}</span></GlassCard>}
         <button onClick={() => generate(promptInput)} disabled={isGenerating || !promptInput.trim()} className="w-56 md:w-64 h-20 md:h-24 bg-rose-800 text-white rounded-full font-black text-[12px] md:text-[14px] uppercase tracking-[0.3em] md:tracking-[0.4em] flex items-center justify-center gap-3 md:gap-4 hover:bg-rose-700 shadow-2xl disabled:opacity-5 border-2 border-rose-950/40 group/breathe transition-all active:scale-90">
           {isGenerating ? <RefreshCw className="animate-spin w-6 h-6 md:w-8 md:h-8" /> : (
             <div className="flex items-center gap-3 md:gap-4">
               <Zap className="w-6 h-6 md:w-8 md:h-8 group-hover/breathe:animate-icon-glow" />
               <MorphingText language={language} value="breatheLife" english="Breathe Life" className="serif-display italic font-thin text-2xl md:text-3xl" />
             </div>
           )}
         </button>
      </div>
      
      {showSaveSuccess && <div className="fixed bottom-32 right-4 md:right-12 z-[200] animate-in fade-in"><GlassCard padding="sm" className="rounded-full bg-green-950/80 border-green-500/30 flex items-center gap-3 px-6"><Check className="w-4 h-4 text-green-500" /><span className="text-[10px] font-black uppercase tracking-[0.4em] text-green-100">Saved!</span></GlassCard></div>}
    </div>
  );
};