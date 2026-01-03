
import { MorphingText } from '../components/MorphingText';
import { TagSelector } from '../components/TagSelector';
import { TextModelSelector, ImageModelSelector } from '../components/ModelSelector';
import { PlatformSelector } from '../components/PlatformSelector';
import { KeyRotationBanner } from '../components/KeyRotationBanner';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { ForgeManager } from '../services/forge/ForgeManager';
import { saveCharacter, fetchUserSecrets } from '../services/supabaseDatabaseService';
import { uploadImageToStorage } from '../services/supabaseStorageService';
import { AIProvider, CharacterData, CharacterField, CharacterStatus, Platform, PLATFORMS_CONFIG, AISecret } from '../types';
import { hashData } from '../utils/helpers';
import { GlassCard } from '../components/ui/GlassCard';
import { DisplayTitle } from '../components/ui/DisplayTitle';
import { CheckCircle2, ChevronDown, ChevronUp, FileText, Heart, History, Lock, RefreshCw, Unlock, Zap, Check, Layers, Binary } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';

interface StudioViewProps {
  character: CharacterData;
  setCharacter: React.Dispatch<React.SetStateAction<CharacterData>>;
}

export const StudioView: React.FC<StudioViewProps> = ({
  character,
  setCharacter,
}) => {
  const { user } = useAuth();
  const { language, models: dbModels, tags: allTags, t, userSecrets } = useAppContext();

  const [prompt, setPrompt] = useState(character.originalPrompt || '');
  const [showAssets, setShowAssets] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([Platform.CRUSHON_AI]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState<CharacterStatus | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [secretsList, setSecretsList] = useState<AISecret[]>([]);
  const [dismissRotationBanner, setDismissRotationBanner] = useState(false);

  const [textModel, setTextModel] = useState('gemini-3-flash-preview');
  const [imageModel, setImageModel] = useState('gemini-2.5-flash-image');

  useEffect(() => {
    if (user) {
      fetchUserSecrets(user.id).then(setSecretsList);
    }
  }, [user]);

  const isImageGenEnabled = useMemo(() => imageModel !== 'None' && imageModel !== '', [imageModel]);
  
  const selectedTagMetas = useMemo(() => 
    allTags.filter(t => character.tags.includes(t.name)), 
  [allTags, character.tags]);

  const onToggleNSFW = () => {
    setCharacter(p => ({ ...p, isNSFW: !p.isNSFW }));
  };

  const handleTagToggle = (tagName: string) => {
    setCharacter(p => ({
        ...p,
        tags: p.tags.includes(tagName) 
            ? p.tags.filter(t => t !== tagName)
            : [...p.tags, tagName]
    }));
  };

  const handlePlatformToggle = (p: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(p) ? prev.filter(sp => sp !== p) : [...prev, p]
    );
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const generate = async () => {
    if (!prompt.trim()) {
      setErrors({ prompt: language === 'mr' ? "प्रॉम्प्ट आवश्यक आहे" : "Prompt is required" });
      return;
    }

    setIsGenerating(true);
    setErrors({});
    
    try {
      const textModelData = dbModels.find(m => m.id === textModel);
      const txtProvider = textModelData?.provider || AIProvider.GEMINI;
      const txtKey = userSecrets[txtProvider];
      const txtService = ForgeManager.getProvider(txtProvider, txtKey);

      const imgModelData = dbModels.find(m => m.id === imageModel);
      const imgProvider = imgModelData?.provider || AIProvider.GEMINI;
      const imgKey = userSecrets[imgProvider];
      const imgService = ForgeManager.getProvider(imgProvider, imgKey);

      let currentData = { ...character, originalPrompt: prompt };

      // --- STEP 1: Refine Prompt ---
      setStepIndex(1);
      setGenerationStep(language === 'mr' ? "प्रॉम्प्ट परिष्कृत करत आहे..." : "Refining vision...");
      const modifiedPrompt = await txtService.refinePrompt({ 
        prompt, 
        tags: selectedTagMetas, 
        isNSFW: character.isNSFW,
        modelId: textModel 
      });
      currentData.modifiedPrompt = modifiedPrompt;
      await sleep(1000);

      // --- STEP 2: Generate Content ---
      setStepIndex(2);
      setGenerationStep(language === 'mr' ? "सामग्री तयार होत आहे..." : "Forging content...");
      const platformRequirements = selectedPlatforms.map(p => ({ platform: p, fields: PLATFORMS_CONFIG[p].fields }));
      const textResult = await txtService.generatePlatformContent({
        modifiedPrompt,
        platforms: selectedPlatforms,
        platformRequirements,
        existingFields: character.fields,
        isNSFW: character.isNSFW,
        tags: selectedTagMetas,
        modelId: textModel
      });
      
      const updatedFields: CharacterField[] = [];
      const requiredFieldLabels = new Set<string>();
      selectedPlatforms.forEach(p => PLATFORMS_CONFIG[p].fields.forEach(f => requiredFieldLabels.add(f)));
      requiredFieldLabels.forEach(label => {
        const existing = character.fields.find(f => f.label === label);
        if (existing && existing.isLocked) {
          updatedFields.push(existing);
        } else {
          const generated = textResult.fields?.find((f: any) => f.label === label);
          updatedFields.push({
            id: existing?.id || Math.random().toString(36).substring(2, 9),
            label,
            value: generated?.value || existing?.value || '',
            isLocked: false,
            format: existing?.format || 'markdown'
          });
        }
      });
      currentData.name = textResult.name || currentData.name;
      currentData.fields = updatedFields;
      await sleep(1000);

      // --- STEP 3: Character Image Prompt ---
      setStepIndex(3);
      setGenerationStep(language === 'mr' ? "पोर्ट्रेट प्रॉम्प्ट तयार करत आहे..." : "Scripting portrait...");
      if (!character.isCharacterImageLocked && isImageGenEnabled) {
        currentData.characterImagePrompt = await txtService.generateImagePrompt({ prompt, type: 'character', isNSFW: character.isNSFW, modelId: textModel });
      }
      await sleep(1000);

      // --- STEP 4: Character Image ---
      setStepIndex(4);
      setGenerationStep(language === 'mr' ? "पोर्ट्रेट चित्र काढत आहे..." : "Painting portrait...");
      if (!character.isCharacterImageLocked && isImageGenEnabled && currentData.characterImagePrompt) {
        const charImgBase64 = await imgService.generateImage({ prompt: currentData.characterImagePrompt, isNSFW: character.isNSFW, modelId: imageModel });
        if (charImgBase64) {
          const cloudUrl = user ? await uploadImageToStorage(user.id, charImgBase64, 'portrait') : null;
          currentData.characterImageUrl = cloudUrl || charImgBase64;
        }
      }
      await sleep(1500);

      // --- STEP 5: Scenario Image Prompt ---
      setStepIndex(5);
      setGenerationStep(language === 'mr' ? "प्रसंग प्रॉम्प्ट तयार करत आहे..." : "Sketching scene...");
      if (!character.isScenarioImageLocked && isImageGenEnabled) {
        currentData.scenarioImagePrompt = await txtService.generateImagePrompt({ prompt, type: 'scenario', isNSFW: character.isNSFW, modelId: textModel });
      }
      await sleep(1000);

      // --- STEP 6: Scenario Image ---
      setStepIndex(6);
      setGenerationStep(language === 'mr' ? "प्रसंग चित्र काढत आहे..." : "Rendering scene...");
      if (!character.isScenarioImageLocked && isImageGenEnabled && currentData.scenarioImagePrompt) {
        const scenImgBase64 = await imgService.generateImage({ prompt: currentData.scenarioImagePrompt, isNSFW: character.isNSFW, modelId: imageModel });
        if (scenImgBase64) {
          const cloudUrl = user ? await uploadImageToStorage(user.id, scenImgBase64, 'scenario') : null;
          currentData.scenarioImageUrl = cloudUrl || scenImgBase64;
        }
      }
      await sleep(1500);

      // --- STEP 7: AIDungeon Cards ---
      setStepIndex(7);
      setGenerationStep(language === 'mr' ? "कार्ड्स संकलित करत आहे..." : "Compiling Lore Cards...");
      if (selectedPlatforms.includes(Platform.AI_DUNGEON)) {
        currentData.worldInfo = await txtService.generateAIDungeonCards({ prompt, isNSFW: character.isNSFW, modelId: textModel });
      }
      await sleep(1000);

      // --- STEP 8: System Rules ---
      setStepIndex(8);
      setGenerationStep(language === 'mr' ? "नियमावली तयार करत आहे..." : "Defining logic rules...");
      const fullTextContent = updatedFields.map(f => `${f.label}: ${f.value}`).join('\n');
      currentData.systemRules = await txtService.generateSystemRules({ 
        prompt, 
        tags: selectedTagMetas, 
        content: fullTextContent, 
        isNSFW: character.isNSFW,
        modelId: textModel 
      });

      // Final State Update
      setCharacter({ ...currentData, status: 'draft' });

    } catch (e: any) {
      console.error(e);
      setErrors({ general: language === 'mr' ? "सृजन अयशस्वी." : "Forge failed. API might be busy." });
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
      setStepIndex(0);
    }
  };

  const saveToCollection = async (status: CharacterStatus = 'draft') => {
    if (!user) return;
    if (!character.name.trim()) {
      alert(language === 'mr' ? "कृपया पात्राचे नाव प्रविष्ट करा." : "Please provide a name.");
      return;
    }

    setIsSaving(status);
    try {
      let targetVersion = character.version;
      let targetParentBotId = character.parentBotId || Math.random().toString(36).substring(2, 15);
      
      if (character.status === 'finalized' && status === 'draft') {
        targetVersion = character.version + 1;
      }

      const characterToSave: CharacterData = { ...character, status, version: targetVersion, parentBotId: targetParentBotId, createdAt: Date.now() };
      const promptHash = await hashData(characterToSave.originalPrompt);
      const result = await saveCharacter(user.id, characterToSave, promptHash);
      if (result) {
        setCharacter({ ...characterToSave, id: result.id });
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
        if (character.id === 'new') window.location.hash = `#/studio/${result.id}`;
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-36 pb-64 animate-in fade-in duration-1000">
      {!dismissRotationBanner && (
        <KeyRotationBanner 
          secrets={secretsList} 
          onDismiss={() => setDismissRotationBanner(true)} 
          onNavigateToSettings={() => window.location.hash = '#/settings'}
        />
      )}

      <main className="max-w-[1700px] mx-auto px-8 lg:px-16 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        {/* Left Control Column */}
        <section className="lg:col-span-4 space-y-12">
          <GlassCard padding="md" className="rounded-[2.5rem] flex items-center justify-between border-rose-900/40 hover-animate">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${character.status === 'finalized' ? 'bg-green-950/40 text-green-500 border border-green-500/20' : 'bg-rose-950/40 text-rose-500 border border-rose-500/20'}`}>
                <History className={`w-5 h-5 ${character.status !== 'finalized' ? 'animate-icon-wiggle' : ''}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-800">Version</span>
                <span className="text-xl serif-display italic text-rose-100">v{character.version} • {character.status.toUpperCase()}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="lg" className="rounded-[3rem] space-y-10 border-rose-900/40 hover-animate">
            <div className="border-b border-rose-950/50 pb-6 flex items-center justify-between">
              <DisplayTitle marathi="कार्यशाळा" english="Forge Studio" size="md" />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between ml-4">
                <span className={`text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-500 ${errors.prompt ? 'text-red-500 animate-pulse' : 'text-rose-900'}`}>
                  {errors.prompt ? <span className="font-sans italic">{errors.prompt}</span> : <MorphingText language={language} value={"imagination"} english="Core Vision" />}
                </span>
                
                <div onClick={onToggleNSFW} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-500 shadow-inner ${character.isNSFW ? 'bg-rose-800 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'bg-rose-950/60'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-500 flex items-center justify-center ${character.isNSFW ? 'translate-x-6' : ''}`}>
                    <Heart className={`w-2.5 h-2.5 transition-colors ${character.isNSFW ? 'text-rose-600 fill-rose-600 animate-icon-heartbeat' : 'text-rose-200'}`} />
                  </div>
                </div>
              </div>
              
              <div className="relative group/input">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-[250px] rounded-[2rem] p-8 text-lg serif-display italic leading-relaxed"
                  placeholder={t.placeholderPrompt}
                />
              </div>
            </div>

            <TagSelector label={t.tags} selectedTags={character.tags} isNSFW={character.isNSFW} onToggle={handleTagToggle} />

            <PlatformSelector 
              label={t.platforms} 
              selectedPlatforms={selectedPlatforms} 
              onToggle={handlePlatformToggle} 
            />

            <div className="pt-8">
              <div className="p-8 rounded-[2.5rem] bg-rose-950/20 border border-rose-900/10 space-y-6">
                <TextModelSelector label="Intelligence Engine" value={textModel} onSelect={(id) => setTextModel(id)} />
                <ImageModelSelector label="Visual Engine" value={imageModel} onSelect={(id) => setImageModel(id)} />
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Right Output Column */}
        <section className="lg:col-span-8 space-y-24">
          {!character.name && !isGenerating ? (
            <div className="h-[800px] flex flex-col items-center justify-center text-rose-950/20 border border-rose-950/10 rounded-[6rem] bg-rose-950/[0.02] relative overflow-hidden shadow-2xl">
              <Heart className="w-48 h-48 animate-icon-heartbeat mb-10 opacity-5" />
              <div className="text-5xl serif-display italic tracking-[0.3em] px-24 text-center leading-relaxed">
                <MorphingText language={language} value={"canvas"} english="The canvas awaits your crave..." />
              </div>
            </div>
          ) : (
            <div className="space-y-24">
              <div className="flex justify-center">
                <button onClick={() => setShowAssets(!showAssets)} className="flex items-center gap-3 px-8 py-3 bg-rose-950/20 border border-rose-900/20 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-900/40 transition-all group/assets">
                  {showAssets ? <ChevronUp className="w-4 h-4 group-hover/assets:-translate-y-1 transition-transform" /> : <ChevronDown className="w-4 h-4 group-hover/assets:translate-y-1 transition-transform" />}
                  {showAssets ? 'Hide Generation Seed' : 'View Generation Seed'}
                </button>
              </div>

              {showAssets && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <GlassCard padding="md" className="rounded-[2.5rem] space-y-4 border-rose-900/30 hover-animate">
                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-800 flex items-center gap-2"><Layers className="w-3 h-3 animate-icon-float" /> Modified Prompt</span>
                    <p className="text-xs italic text-rose-200/50 leading-relaxed font-serif">{character.modifiedPrompt || 'N/A'}</p>
                  </GlassCard>
                  <GlassCard padding="md" className="rounded-[2.5rem] space-y-4 border-rose-900/30 hover-animate">
                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-800 flex items-center gap-2"><Binary className="w-3 h-3 animate-icon-wiggle" /> System Logic</span>
                    <p className="text-xs italic text-rose-200/50 leading-relaxed font-serif">{character.systemRules || 'N/A'}</p>
                  </GlassCard>
                </div>
              )}

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 ${!isImageGenEnabled ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
                {(['character', 'scenario'] as const).map(type => (
                  <GlassCard key={type} padding="sm" className="rounded-[4rem] group relative border-rose-900/40 hover-animate">
                    <div className="absolute top-10 right-10 z-20 flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setCharacter(p => ({ ...p, [type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked']: !p[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] }))} className={`p-5 rounded-full backdrop-blur-3xl shadow-2xl transition-all ${character[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] ? 'bg-rose-700 text-white' : 'bg-black/60 text-rose-400 border border-rose-950/30'}`}>
                        {character[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] ? <Lock className="w-6 h-6 animate-icon-glow" /> : <Unlock className="w-6 h-6" />}
                      </button>
                    </div>
                    <div className="aspect-[3/4] rounded-[3.5rem] overflow-hidden bg-rose-950/5 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                      {(type === 'character' ? character.characterImageUrl : character.scenarioImageUrl) ? (
                        <img src={type === 'character' ? character.characterImageUrl : character.scenarioImageUrl} alt={type} className="w-full h-full object-cover transform transition-transform duration-[8s] group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                           <RefreshCw className="w-12 h-12 animate-spin text-rose-900/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-8"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-800">{type} Asset</span></div>
                  </GlassCard>
                ))}
              </div>

              <GlassCard padding="xl" className="rounded-[7rem] space-y-32 relative overflow-hidden shadow-[0_80px_200px_rgba(0,0,0,1)] border-rose-900/50 hover-animate">
                <div className="flex flex-col lg:flex-row items-end justify-between border-b border-rose-950/30 pb-20 gap-16 relative z-10">
                  <div className="flex flex-col gap-6 w-full">
                    <span className="text-[16px] font-black uppercase tracking-[1.2em] text-rose-950">IDENTITY</span>
                    <input className="text-[6rem] md:text-[8rem] serif-display italic tracking-tighter bg-transparent border-none outline-none text-rose-50 w-full focus:text-rose-400 transition-all duration-1000 leading-none" value={character.name} onChange={(e) => setCharacter(p => ({ ...p, name: e.target.value }))} placeholder="Unnamed..." />
                  </div>

                  <div className="flex flex-col gap-4">
                    <button onClick={() => saveToCollection('finalized')} disabled={isSaving !== null} className="flex items-center gap-4 px-10 py-5 bg-rose-600 text-white rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl disabled:opacity-50 group/save">
                      {isSaving === 'finalized' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 group-hover/save:animate-icon-glow" />}
                      Finalize Forge
                    </button>
                    <button onClick={() => saveToCollection('draft')} disabled={isSaving !== null} className="flex items-center gap-4 px-10 py-5 bg-rose-950/40 text-rose-50 border border-rose-900/30 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-rose-900/20 transition-all disabled:opacity-50 group/draft">
                      {isSaving === 'draft' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 group-hover/draft:animate-icon-float" />}
                      Save Draft
                    </button>
                  </div>
                </div>

                <div className="space-y-48 relative z-10">
                  {character.fields.map((field) => (
                    <div key={field.id} className="group/field relative space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                      <div className="flex items-center justify-between px-8">
                        <span className="text-[11px] font-black text-rose-900 uppercase tracking-[0.4em]">{field.label}</span>
                        <button onClick={() => setCharacter(p => ({ ...p, fields: p.fields.map(f => f.id === field.id ? { ...f, isLocked: !f.isLocked } : f) }))} className={`p-2.5 rounded-full transition-all ${field.isLocked ? 'bg-rose-800 text-white' : 'bg-black/40 text-rose-900 border border-rose-900/20'}`}>
                          {field.isLocked ? <Lock className="w-4 h-4 animate-icon-glow" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <textarea 
                        disabled={field.isLocked} 
                        value={field.value} 
                        onChange={(e) => setCharacter(p => ({ ...p, fields: p.fields.map(f => f.id === field.id ? { ...f, value: e.target.value } : f) }))} 
                        className={`w-full min-h-[300px] rounded-[3rem] p-10 text-xl leading-[2.2] serif-display italic transition-all ${field.isLocked ? 'opacity-30' : 'text-rose-100'}`} 
                        placeholder={`Enter ${field.label}...`}
                      />
                    </div>
                  ))}

                  {character.worldInfo && character.worldInfo.length > 0 && (
                    <div className="space-y-12 pt-24 border-t border-rose-950/20">
                       <span className="text-[14px] font-black uppercase tracking-[0.8em] text-rose-950 px-8">AIDungeon Knowledge Cards</span>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8">
                          {character.worldInfo.map((card, idx) => (
                            <div key={idx} className="p-8 rounded-3xl bg-black/40 border border-rose-900/20 space-y-4 hover-animate">
                               <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">{card.label}</span>
                               <p className="text-xs text-rose-100/60 leading-relaxed italic">{card.content}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-4">
         {isGenerating && (
           <GlassCard padding="sm" className="rounded-full flex items-center gap-6 px-10 border-rose-500/30 animate-in slide-in-from-bottom-10 duration-700 bg-black/90">
              <div className="flex gap-1.5">
                 {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-1000 ${stepIndex >= i ? 'bg-rose-500 shadow-[0_0_10px_#e11d48]' : 'bg-rose-950 opacity-20'}`} />
                 ))}
              </div>
              <div className="h-4 w-[1px] bg-rose-900/40" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-100 animate-pulse w-48 text-center">{generationStep}</span>
           </GlassCard>
         )}

        <button onClick={generate} disabled={isGenerating || !prompt.trim()} className="w-56 h-20 bg-rose-800 text-white rounded-full font-black text-[14px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-rose-700 active:scale-95 transition-all duration-700 shadow-[0_20px_60px_rgba(225,29,72,0.4)] disabled:opacity-5 border-2 border-rose-950/40 group overflow-hidden">
          {isGenerating ? <RefreshCw className="animate-spin w-8 h-8" /> : (
            <>
              <Zap className="w-6 h-6 group-hover:animate-icon-wiggle transition-transform fill-white/20" />
              <span className="serif-display italic font-thin text-2xl">{t.breatheLife}</span>
            </>
          )}
        </button>
      </div>

      {showSaveSuccess && (
        <div className="fixed bottom-32 right-12 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GlassCard padding="sm" className="rounded-full bg-green-950/80 border-green-500/30 flex items-center gap-3 px-6">
            <Check className="w-4 h-4 text-green-500 animate-icon-glow" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-green-100">Saved Successfully!</span>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
