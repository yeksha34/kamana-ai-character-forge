
import { MorphingText } from '../components/MorphingText';
import { TagSelector } from '../components/TagSelector';
import { TextModelSelector, ImageModelSelector } from '../components/ModelSelector';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { ClaudeService } from '../services/claudeService';
import { GeminiService } from '../services/geminiService';
import { saveCharacter } from '../services/supabaseDatabaseService';
import { uploadImageToStorage } from '../services/supabaseStorageService';
import { AIProvider, CharacterData, CharacterField, CharacterStatus, Platform, PLATFORMS_CONFIG } from '../types';
import { hashData } from '../utils/helpers';
import { GlassCard } from '../components/ui/GlassCard';
import { DisplayTitle } from '../components/ui/DisplayTitle';
import { CheckCircle2, ChevronDown, ChevronUp, FileText, Heart, History, Lock, RefreshCw, Settings, Unlock, Zap, Save, Check } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface StudioViewProps {
  character: CharacterData;
  setCharacter: React.Dispatch<React.SetStateAction<CharacterData>>;
}

const gemini = new GeminiService();
const claude = new ClaudeService();

export const StudioView: React.FC<StudioViewProps> = ({
  character,
  setCharacter,
}) => {
  const { user } = useAuth();
  const { language, models: dbModels, t } = useAppContext();

  const [prompt, setPrompt] = useState(character.originalPrompt || '');
  const [showPrompts, setShowPrompts] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([Platform.CRUSHON_AI]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState<CharacterStatus | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [textModel, setTextModel] = useState('gemini-3-flash-preview');
  const [imageModel, setImageModel] = useState('gemini-2.5-flash-image');

  const isImageGenEnabled = useMemo(() => imageModel !== 'None' && imageModel !== '', [imageModel]);
  
  const onToggleNSFW = () => {
    setCharacter(p => {
        const newIsNSFW = !p.isNSFW;
        return { ...p, isNSFW: newIsNSFW };
    });
  };

  const handleTagToggle = (tagName: string) => {
    setCharacter(p => ({
        ...p,
        tags: p.tags.includes(tagName) 
            ? p.tags.filter(t => t !== tagName)
            : [...p.tags, tagName]
    }));
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const generate = async () => {
    if (!prompt.trim()) {
      setErrors({ prompt: language === 'mr' ? "प्रॉम्प्ट आवश्यक आहे" : "Prompt is required" });
      return;
    }

    setIsGenerating(true);
    setGenerationStep(language === 'mr' ? "आराखडा तयार होत आहे..." : "Drafting persona...");

    try {
      const platformRequirements = selectedPlatforms.map(p => ({
        platform: p,
        fields: PLATFORMS_CONFIG[p].fields
      }));

      const textModelData = dbModels.find(m => m.id === textModel);
      const service = textModelData?.provider === AIProvider.GEMINI ? gemini : claude;
      
      const textResult = await service.generateCharacterText({
        prompt,
        platforms: selectedPlatforms,
        platformRequirements, 
        isNSFW: character.isNSFW,
        tags: character.tags,
        existingFields: character.fields,
        selectedModel: textModel,
      });

      let charImgUrl = character.characterImageUrl;
      let scenImgUrl = character.scenarioImageUrl;
      let charImgPrompt = character.characterImagePrompt;
      let scenImgPrompt = character.scenarioImagePrompt;

      if (isImageGenEnabled) {
        await sleep(1000);
        if (!character.isCharacterImageLocked) {
          setGenerationStep(language === 'mr' ? "पोर्ट्रेट तयार होत आहे..." : "Painting portrait...");
          charImgPrompt = `Portrait: ${textResult.name}. ${prompt}`;
          const imgModelData = dbModels.find(m => m.id === imageModel);
          const imgService = imgModelData?.provider === AIProvider.GEMINI ? gemini : claude;

          const charImgBase64 = await imgService.generateImage({
            prompt: charImgPrompt,
            type: 'character',
            isNSFW: character.isNSFW,
            selectedModel: imageModel
          });
          if (charImgBase64) {
            const cloudUrl = user ? await uploadImageToStorage(user.id, charImgBase64, 'portrait') : null;
            charImgUrl = cloudUrl || charImgBase64;
          }
        }

        await sleep(1000);
        if (!character.isScenarioImageLocked) {
          setGenerationStep(language === 'mr' ? "प्रसंग तयार होत आहे..." : "Setting the scene...");
          scenImgPrompt = `Environment: ${prompt}`;
          const imgModelData = dbModels.find(m => m.id === imageModel);
          const imgService = imgModelData?.provider === AIProvider.GEMINI ? gemini : claude;

          const scenImgBase64 = await imgService.generateImage({
            prompt: scenImgPrompt,
            type: 'scenario',
            isNSFW: character.isNSFW,
            selectedModel: imageModel
          });
          if (scenImgBase64) {
            const cloudUrl = user ? await uploadImageToStorage(user.id, scenImgBase64, 'scenario') : null;
            scenImgUrl = cloudUrl || scenImgBase64;
          }
        }
      }

      const updatedFields: CharacterField[] = [];
      const requiredFieldLabels = new Set<string>();
      selectedPlatforms.forEach(p => PLATFORMS_CONFIG[p].fields.forEach(f => requiredFieldLabels.add(f)));

      requiredFieldLabels.forEach(label => {
        const existing = character.fields.find(f => f.label === label);
        if (existing && existing.isLocked) {
          updatedFields.push(existing);
        } else {
          const generated = textResult.fields.find((f: any) => f.label === label);
          updatedFields.push({
            id: existing?.id || Math.random().toString(36).substring(2, 9),
            label,
            value: generated?.value || existing?.value || '',
            isLocked: false,
            format: existing?.format || 'markdown'
          });
        }
      });

      setCharacter(prev => ({
        ...prev,
        name: textResult.name || prev.name,
        fields: updatedFields,
        characterImageUrl: charImgUrl,
        scenarioImageUrl: scenImgUrl,
        originalPrompt: prompt,
        characterImagePrompt: charImgPrompt,
        scenarioImagePrompt: scenImgPrompt,
        status: 'draft'
      }));

    } catch (e: any) {
      console.error(e);
      setErrors({ general: language === 'mr' ? "सृजन अयशस्वी." : "Generation failed." });
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const regenerateSingleImage = async (type: 'character' | 'scenario') => {
    setIsGenerating(true);
    setGenerationStep(language === 'mr' ? "पुन्हा तयार करत आहे..." : "Regenerating...");
    const imgPrompt = type === 'character' ? `Portrait: ${character.name}. ${prompt}` : `Environment: ${prompt}`;
    try {
      const imgModelData = dbModels.find(m => m.id === imageModel);
      const service = imgModelData?.provider === AIProvider.GEMINI ? gemini : claude;
      
      const imgBase64 = await service.generateImage({
        prompt: imgPrompt,
        type,
        isNSFW: character.isNSFW,
        selectedModel: imageModel
      });
      if (imgBase64) {
        const cloudUrl = user ? await uploadImageToStorage(user.id, imgBase64, type === 'character' ? 'portrait' : 'scenario') : null;
        const finalUrl = cloudUrl || imgBase64;
        setCharacter(prev => ({
          ...prev,
          [type === 'character' ? 'characterImageUrl' : 'scenarioImageUrl']: finalUrl,
          [type === 'character' ? 'characterImagePrompt' : 'scenarioImagePrompt']: imgPrompt
        }));
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const saveToCollection = async (status: CharacterStatus = 'draft') => {
    if (!user) {
      console.error("No user found to save character.");
      return;
    }

    if (!character.name.trim()) {
      alert(language === 'mr' ? "कृपया पात्राचे नाव प्रविष्ट करा." : "Please provide a character name before saving.");
      return;
    }

    setIsSaving(status);
    try {
      let targetVersion = character.version;
      let targetParentBotId = character.parentBotId || Math.random().toString(36).substring(2, 15);
      
      // If we are finalizing a draft, or creating a new finalized version
      if (character.status === 'finalized' && status === 'draft') {
        targetVersion = character.version + 1;
      }

      const characterToSave: CharacterData = { 
        ...character, 
        status, 
        version: targetVersion, 
        parentBotId: targetParentBotId, 
        createdAt: Date.now(),
        originalPrompt: prompt // Ensure the current prompt text is saved too
      };

      const promptHash = await hashData(characterToSave.originalPrompt);
      const result = await saveCharacter(user.id, characterToSave, promptHash);
      
      if (result) {
        setCharacter({ ...characterToSave, id: result.id });
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
        
        // If it was a new character, update the URL hash
        if (character.id === 'new') {
          window.location.hash = `#/studio/${result.id}`;
        }
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert(language === 'mr' ? "जतन करणे अयशस्वी झाले." : "Failed to save character.");
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="min-h-screen selection:bg-rose-900 selection:text-rose-100 flex flex-col animate-in fade-in duration-1000 pt-36 pb-64">
      <main className="max-w-[1700px] mx-auto px-8 lg:px-16 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        <section className="lg:col-span-4 space-y-12">
          <GlassCard padding="md" className="rounded-[2.5rem] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${character.status === 'finalized' ? 'bg-green-950/40 text-green-500 border border-green-500/20' : 'bg-rose-950/40 text-rose-500 border border-rose-500/20'}`}>
                <History className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-800">Version</span>
                <span className="text-xl serif-display italic text-rose-100">v{character.version} • {character.status.toUpperCase()}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="lg" className="rounded-[3rem] space-y-10">
            <div className="border-b border-rose-950/50 pb-6 flex items-center justify-between">
              <DisplayTitle marathi="कार्यशाळा" english="Studio" size="md" />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between ml-4">
                <span className={`text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-500 ${errors.prompt ? 'text-red-500 animate-pulse' : 'text-rose-900'}`}>
                  {errors.prompt ? <span className="font-sans italic">{errors.prompt}</span> : <MorphingText language={language} value={"imagination"} english="Imagination" />}
                </span>
                
                <div 
                  onClick={onToggleNSFW}
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-500 shadow-inner ${character.isNSFW ? 'bg-rose-800 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'bg-rose-950/60'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-500 flex items-center justify-center ${character.isNSFW ? 'translate-x-6' : ''}`}>
                    <Heart className={`w-2.5 h-2.5 transition-colors ${character.isNSFW ? 'text-rose-600 fill-rose-600' : 'text-rose-200'}`} />
                  </div>
                </div>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-[300px] bg-rose-950/10 border-none rounded-[2rem] p-8 text-lg serif-display italic focus:ring-1 focus:ring-rose-800/20 text-rose-100 resize-none placeholder:opacity-20 shadow-inner leading-relaxed"
                placeholder={t.placeholderPrompt}
              />
            </div>

            <div className="space-y-8">
              <TagSelector 
                label={t.tags}
                selectedTags={character.tags}
                isNSFW={character.isNSFW}
                onToggle={handleTagToggle}
              />
            </div>

            <div className="space-y-8">
              <div className="flex flex-col ml-4">
                <span className="text-[10px] font-black text-rose-900 uppercase tracking-[0.5em]">{t.platforms}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(Platform).map(p => (
                  <button key={p} onClick={() => {
                    if (selectedPlatforms.includes(p))
                      setSelectedPlatforms(selectedPlatforms.filter(sp => sp !== p))
                    else
                      setSelectedPlatforms([...selectedPlatforms, p]);
                  }} className={`px-4 py-3.5 rounded-2xl text-[10px] font-black tracking-widest transition-all border ${selectedPlatforms.includes(p) ? 'bg-rose-800 text-white border-rose-600 shadow-xl' : 'bg-black/20 text-rose-700/30 border-rose-950/40 hover:text-rose-400'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <div className="p-8 rounded-[2.5rem] bg-rose-950/20 border border-rose-900/10 space-y-6">
                <div className="flex items-center gap-3 border-b border-rose-900/10 pb-4">
                  <Settings className="w-4 h-4 text-rose-700" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-700">{t.modelConfig}</span>
                </div>
                
                <div className="space-y-6">
                  <TextModelSelector
                    label="Text Intelligence"
                    value={textModel}
                    onSelect={(id) => setTextModel(id)}
                    placeholder="Search intelligence models..."
                  />

                  <ImageModelSelector
                    label="Visual Generation"
                    value={imageModel}
                    onSelect={(id) => setImageModel(id)}
                    placeholder="Search visual engines..."
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="lg:col-span-8 space-y-24">
          {!character.name && !isGenerating ? (
            <div className="h-[800px] flex flex-col items-center justify-center text-rose-950/20 border border-rose-950/10 rounded-[6rem] bg-rose-950/[0.02] relative overflow-hidden shadow-2xl transition-all">
              <Heart className="w-48 h-48 animate-pulse mb-10 opacity-5" />
              <div className="text-5xl serif-display italic tracking-[0.3em] px-24 text-center leading-relaxed">
                <MorphingText language={language} value={"canvas"} english="The canvas awaits your crave..." />
              </div>
            </div>
          ) : (
            <div className="space-y-32">
              <div className="flex justify-center">
                <button
                  onClick={() => setShowPrompts(!showPrompts)}
                  className="flex items-center gap-3 px-8 py-3 bg-rose-950/20 border border-rose-900/20 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-900/40 transition-all"
                >
                  {showPrompts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showPrompts ? 'Hide Asset Prompts' : 'View Generation Prompts'}
                </button>
              </div>

              {showPrompts && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <GlassCard padding="md" className="rounded-[2.5rem] space-y-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-800">Portrait Prompt (Seed)</span>
                    <p className="text-xs italic text-rose-200/50 leading-relaxed font-serif">"{character.characterImagePrompt || 'N/A'}"</p>
                  </GlassCard>
                  <GlassCard padding="md" className="rounded-[2.5rem] space-y-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-800">Scenario Prompt (Seed)</span>
                    <p className="text-xs italic text-rose-200/50 leading-relaxed font-serif">"{character.scenarioImagePrompt || 'N/A'}"</p>
                  </GlassCard>
                </div>
              )}

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 transition-all duration-[2s] ${!isImageGenEnabled ? 'opacity-0 scale-95 pointer-events-none' : ''}`}>
                {(['character', 'scenario'] as const).map(type => (
                  <GlassCard key={type} padding="sm" className="rounded-[4rem] group relative">
                    <div className="absolute top-10 right-10 z-20 flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setCharacter(p => ({ ...p, [type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked']: !p[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] }))} className={`p-5 rounded-full backdrop-blur-3xl shadow-2xl transition-all ${character[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] ? 'bg-rose-700 text-white' : 'bg-black/60 text-rose-400 border border-rose-950/30'}`}>
                        {character[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                      </button>
                      <button disabled={character[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] || isGenerating} onClick={() => regenerateSingleImage(type)} className="p-5 rounded-full bg-rose-800 text-white hover:bg-rose-600 transition-all shadow-2xl active:scale-95">
                        <RefreshCw className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="aspect-[3/4] rounded-[3.5rem] overflow-hidden bg-rose-950/5 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                      {(type === 'character' ? character.characterImageUrl : character.scenarioImageUrl) ? (
                        <img src={type === 'character' ? character.characterImageUrl : character.scenarioImageUrl} alt={type} className="w-full h-full object-cover transform transition-transform duration-[8s] group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-6 group-hover:bg-rose-900/10 transition-colors cursor-pointer" onClick={() => !isGenerating && regenerateSingleImage(type)}>
                          {isGenerating && generationStep?.includes(type === 'character' ? 'portrait' : 'scene') ? (
                            <RefreshCw className="w-16 h-16 animate-spin text-rose-600" />
                          ) : (
                            <div className="flex flex-col items-center gap-4 text-rose-950 opacity-20 group-hover:opacity-100 group-hover:text-rose-500 transition-all">
                              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{type === 'character' ? 'Generate Portrait' : 'Generate Scenario'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>

              <GlassCard padding="xl" className="rounded-[7rem] space-y-32 relative overflow-hidden shadow-[0_80px_200px_rgba(0,0,0,1)]">
                <div className="flex flex-col lg:flex-row items-end justify-between border-b border-rose-950/30 pb-20 gap-16 relative z-10">
                  <div className="flex flex-col gap-6 w-full">
                    <span className="text-[16px] font-black uppercase tracking-[1.2em] text-rose-950">{t.sculptor}</span>
                    <input className="text-[6rem] md:text-[8rem] serif-display italic tracking-tighter bg-transparent border-none outline-none text-rose-50 w-full focus:text-rose-400 transition-all duration-1000 leading-none" value={character.name} onChange={(e) => setCharacter(p => ({ ...p, name: e.target.value }))} placeholder="Unnamed..." />
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => saveToCollection('finalized')}
                      disabled={isSaving !== null}
                      className="flex items-center gap-4 px-10 py-5 bg-rose-600 text-white rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl shadow-rose-950/50 disabled:opacity-50"
                    >
                      {isSaving === 'finalized' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Finalize Version
                    </button>
                    <button
                      onClick={() => saveToCollection('draft')}
                      disabled={isSaving !== null}
                      className="flex items-center gap-4 px-10 py-5 bg-rose-950/40 text-rose-50 border border-rose-900/30 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-rose-900/20 transition-all disabled:opacity-50"
                    >
                      {isSaving === 'draft' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
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
                          {field.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                      <textarea disabled={field.isLocked} value={field.value} onChange={(e) => setCharacter(p => ({ ...p, fields: p.fields.map(f => f.id === field.id ? { ...f, value: e.target.value } : f) }))} className={`w-full min-h-[300px] bg-rose-950/[0.03] border-none rounded-[3rem] p-10 text-xl leading-[2.2] serif-display italic transition-all shadow-[inset_0_10px_40px_rgba(0,0,0,0.6)] ${field.isLocked ? 'opacity-30' : 'text-rose-100'}`} />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </section>
      </main>

      {/* Floating Save Notification */}
      {showSaveSuccess && (
        <div className="fixed bottom-32 right-12 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GlassCard padding="sm" className="rounded-full bg-green-950/80 border-green-500/30 flex items-center gap-3 px-6 shadow-2xl">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-green-100">
              {language === 'mr' ? 'यशस्वीरित्या जतन केले!' : 'Saved Successfully!'}
            </span>
          </GlassCard>
        </div>
      )}

      <div className="fixed bottom-10 right-10 z-[150] flex flex-col items-center gap-6 p-4">
        <button onClick={generate} disabled={isGenerating || !prompt.trim()} className="w-48 h-48 bg-rose-800 text-white rounded-full font-black text-[14px] uppercase tracking-[0.3em] flex flex-col items-center justify-center gap-3 hover:bg-rose-700 active:scale-90 transition-all duration-700 shadow-[0_20px_60px_rgba(225,29,72,0.5)] forge-button disabled:opacity-5 border-4 border-rose-950/40">
          {isGenerating ? <RefreshCw className="animate-spin w-12 h-12" /> : (
            <>
              <Zap className="w-12 h-12 fill-white/20" />
              <span className="serif-display italic font-thin text-xl text-center">{t.breatheLife}</span>
            </>
          )}
        </button>
        {isGenerating && generationStep && (
          <GlassCard padding="sm" className="absolute top-[-80px] w-max rounded-full border border-rose-900/30 animate-pulse">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-400">{generationStep}</span>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
