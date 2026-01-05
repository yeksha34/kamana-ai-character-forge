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
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { useForgeGenerator } from '../hooks/useForgeGenerator';
import { saveCharacter, fetchUserSecrets } from '../services/supabaseDatabaseService';
import { uploadImageToStorage } from '../services/supabaseStorageService';
import { ForgeManager } from '../services/forge/ForgeManager';
import { AIProvider, CharacterData, CharacterStatus, Platform, AISecret } from '../types';
import { hashData } from '../utils/helpers';
import { downloadCharactersZip } from '../utils/exportUtils';
import { History, Heart, Zap, RefreshCw, Check, Download } from 'lucide-react';

interface StudioViewProps {
  character: CharacterData;
  // Fixed: Use React.Dispatch<React.SetStateAction<any>> to support functional updates and handle parent state compatibility
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
        // Fixed: Use functional update to avoid stale closure issues and fix type error
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
    <div className="min-h-screen flex flex-col pt-36 pb-64 animate-in fade-in duration-1000">
      <KeyRotationBanner secrets={secretsList} onDismiss={() => {}} onNavigateToSettings={() => window.location.hash = '#/settings'} />
      <main className="max-w-[1700px] mx-auto px-8 lg:px-16 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        <section className="lg:col-span-4 space-y-12">
          <GlassCard padding="md" className="rounded-[2.5rem] flex items-center justify-between border-rose-900/40 hover-animate">
            <div className="flex items-center gap-4">
              <History className="w-10 h-10 p-2 rounded-full bg-rose-950/40 text-rose-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-800">Version</span>
                <span className="text-xl serif-display italic text-rose-100">v{character.version} • {character.status.toUpperCase()}</span>
              </div>
            </div>
            <button 
              onClick={handleExport}
              title="Export Character Bundle"
              className="p-4 bg-rose-950/20 text-rose-500 rounded-2xl hover:bg-rose-900/40 transition-all active:scale-90"
            >
              <Download className="w-5 h-5" />
            </button>
          </GlassCard>
          <GlassCard padding="lg" className="rounded-[3rem] space-y-10 border-rose-900/40">
            <DisplayTitle marathi="कार्यशाळा" english="Forge Studio" size="md" />
            <div className="space-y-6">
              <div className="flex items-center justify-between ml-4">
                <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${errors.prompt ? 'text-red-500' : 'text-rose-900'}`}>{t.imagination}</span>
                {/* Fixed: Use functional update to toggle isNSFW */}
                <div onClick={() => setCharacter((p: any) => ({ ...p, isNSFW: !p.isNSFW }))} className={`w-12 h-6 rounded-full relative cursor-pointer ${character.isNSFW ? 'bg-rose-800' : 'bg-rose-950/60'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${character.isNSFW ? 'translate-x-6' : ''} flex items-center justify-center`}>
                    <Heart className={`w-2.5 h-2.5 ${character.isNSFW ? 'text-rose-600' : 'text-rose-200'}`} />
                  </div>
                </div>
              </div>
              <textarea value={promptInput} onChange={(e) => setPromptInput(e.target.value)} className="w-full h-[250px] rounded-[2rem] p-8 text-lg serif-display italic" placeholder={t.placeholderPrompt} />
            </div>
            {/* Fixed: Use functional update for tag selection */}
            <TagSelector label={t.tags} selectedTags={character.tags} isNSFW={character.isNSFW} onToggle={(tag) => setCharacter((p: any) => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter((t: string) => t !== tag) : [...p.tags, tag] }))} />
            <PlatformSelector label={t.platforms} selectedPlatforms={selectedPlatforms} onToggle={(p) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(sp => sp !== p) : [...prev, p])} />
            <div className="p-8 rounded-[2.5rem] bg-rose-950/20 border border-rose-900/10 space-y-6">
              <TextModelSelector label="Intelligence Engine" value={textModel} onSelect={setTextModel} />
              <ImageModelSelector label="Visual Engine" value={imageModel} onSelect={setImageModel} />
            </div>
          </GlassCard>
        </section>

        <section className="lg:col-span-8 space-y-24">
          {!character.name && !isGenerating ? (
            <div className="h-[800px] flex flex-col items-center justify-center border border-rose-950/10 rounded-[6rem] bg-rose-950/[0.02]">
              <Heart className="w-48 h-48 mb-10 opacity-5" />
              <div className="text-5xl serif-display italic tracking-[0.3em] px-24 text-center leading-relaxed">The canvas awaits your crave...</div>
            </div>
          ) : (
            <div className="space-y-24">
              <PromptSection character={character} setCharacter={setCharacter} showAssets={showAssets} setShowAssets={setShowAssets} />
              <VisualAssets character={character} setCharacter={setCharacter} isImageGenEnabled={imageModel !== 'None'} isRegeneratingImage={isRegeneratingImage} isGenerating={isGenerating} regenerateSingleImage={regenerateSingleImage} />
              <GlassCard padding="xl" className="rounded-[7rem] space-y-32 relative overflow-hidden shadow-2xl border-rose-900/50">
                {/* Fixed: Use functional update for name change */}
                <CharacterIdentity name={character.name} setName={(name) => setCharacter((p: any) => ({ ...p, name }))} isSaving={isSaving} onSave={handleSave} />
                {/* Fixed: Use functional update for fields modification */}
                <CharacterFields fields={character.fields} onToggleLock={(id) => setCharacter((p: any) => ({ ...p, fields: p.fields.map((f: any) => f.id === id ? { ...f, isLocked: !f.isLocked } : f) }))} onUpdateValue={(id, val) => setCharacter((p: any) => ({ ...p, fields: p.fields.map((f: any) => f.id === id ? { ...f, value: val } : f) }))} worldInfo={character.worldInfo} />
              </GlassCard>
            </div>
          )}
        </section>
      </main>
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-4">
         {isGenerating && <GlassCard padding="sm" className="rounded-full flex items-center gap-6 px-10 border-rose-500/30 bg-black/90"><div className="flex gap-1.5">{[1,2,3,4,5,6,7,8].map(i => <div key={i} className={`w-2.5 h-2.5 rounded-full ${stepIndex >= i ? 'bg-rose-500' : 'bg-rose-950'}`} />)}</div><span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-100 animate-pulse">{generationStep}</span></GlassCard>}
         <button onClick={() => generate(promptInput)} disabled={isGenerating || !promptInput.trim()} className="w-56 h-20 bg-rose-800 text-white rounded-full font-black text-[14px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-rose-700 shadow-2xl disabled:opacity-5 border-2 border-rose-950/40">
           {isGenerating ? <RefreshCw className="animate-spin w-8 h-8" /> : <><Zap className="w-6 h-6" /><span className="serif-display italic font-thin text-2xl">{t.breatheLife}</span></>}
         </button>
      </div>
      {showSaveSuccess && <div className="fixed bottom-32 right-12 z-[200] animate-in fade-in"><GlassCard padding="sm" className="rounded-full bg-green-950/80 border-green-500/30 flex items-center gap-3 px-6"><Check className="w-4 h-4 text-green-500" /><span className="text-[10px] font-black uppercase tracking-[0.4em] text-green-100">Saved Successfully!</span></GlassCard></div>}
    </div>
  );
};
