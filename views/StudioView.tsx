
import React from 'react';
import { Settings, RefreshCw, Lock, Unlock, Save, Zap, Heart, Cpu, Sparkles } from 'lucide-react';
import { Platform, CharacterData, CharacterField, AIProvider } from '../types';
import { MorphingText } from '../components/MorphingText';
import { TagManager } from '../components/TagManager';
import { Language, translations } from '../i18n/translations';

interface StudioViewProps {
  prompt: string;
  setPrompt: (v: string) => void;
  selectedPlatforms: Platform[];
  onTogglePlatform: (p: Platform) => void;
  character: CharacterData;
  setCharacter: React.Dispatch<React.SetStateAction<CharacterData>>;
  isGenerating: boolean;
  generationStep?: string;
  onGenerate: () => void;
  onRegenerateImage: (type: 'character' | 'scenario') => void;
  onSave: () => void;
  textModel: string;
  setTextModel: (v: string) => void;
  imageModel: string;
  setImageModel: (v: string) => void;
  isImageGenEnabled: boolean;
  errors: Record<string, string>;
  models: { text: string[]; image: string[] };
  language: Language;
  provider: AIProvider;
  setProvider: (p: AIProvider) => void;
}

export const StudioView: React.FC<StudioViewProps> = ({
  prompt, setPrompt, selectedPlatforms, onTogglePlatform, character, setCharacter,
  isGenerating, generationStep, onGenerate, onRegenerateImage, onSave,
  textModel, setTextModel, imageModel, setImageModel, isImageGenEnabled, errors, models, language,
  provider, setProvider
}) => {
  const t = translations[language];

  return (
    <div className="min-h-screen selection:bg-rose-900 selection:text-rose-100 flex flex-col animate-in fade-in duration-1000 pt-36 pb-64">
      <main className="max-w-[1700px] mx-auto px-8 lg:px-16 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        <section className="lg:col-span-4 space-y-12">
          <div className="art-glass p-10 rounded-[3rem] space-y-10 border border-rose-950/30">
            <div className="border-b border-rose-950/50 pb-6 flex items-center justify-between">
              <MorphingText options={t.morphing.studio} english="Studio" className="text-3xl serif-display text-rose-50" />
              <span className="text-[10px] font-black tracking-[0.4em] text-rose-800/40 uppercase">{t.studio}</span>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col ml-4">
                <span className={`text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-500 ${errors.prompt ? 'text-red-500 animate-pulse' : 'text-rose-900'}`}>
                  {errors.prompt ? <span className="font-sans italic">{errors.prompt}</span> : <MorphingText options={t.morphing.imagination} english="Imagination" />}
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-[300px] bg-rose-950/10 border-none rounded-[2rem] p-8 text-lg leading-[2] serif-display italic focus:ring-1 focus:ring-rose-800/20 text-rose-100 resize-none placeholder:opacity-20 shadow-inner"
                placeholder={t.placeholderPrompt}
              />
            </div>

            <div className="space-y-8">
              <div className="flex flex-col ml-4">
                <span className="text-[10px] font-black text-rose-900 uppercase tracking-[0.5em]">{t.tags}</span>
              </div>
              <TagManager tags={character.tags} onTagsChange={(tags) => setCharacter(p => ({ ...p, tags }))} />
            </div>

            <div className="space-y-8">
              <div className="flex flex-col ml-4">
                <span className="text-[10px] font-black text-rose-900 uppercase tracking-[0.5em]">{t.platforms}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(Platform).map(p => (
                  <button key={p} onClick={() => onTogglePlatform(p)} className={`px-4 py-3.5 rounded-2xl text-[10px] font-black tracking-widest transition-all border ${selectedPlatforms.includes(p) ? 'bg-rose-800 text-white border-rose-600 shadow-xl' : 'bg-black/20 text-rose-700/30 border-rose-950/40 hover:text-rose-400'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-8">
               <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-900/10 space-y-4">
                  <div className="flex items-center gap-3">
                     <Settings className="w-4 h-4 text-rose-700" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-rose-700">{t.modelConfig}</span>
                  </div>
                  <div className="space-y-3">
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-bold text-rose-900 uppercase tracking-widest ml-1">{t.provider}</span>
                        <div className="flex gap-2">
                           {Object.values(AIProvider).map(p => (
                              <button 
                                key={p} 
                                onClick={() => setProvider(p)} 
                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${provider === p ? 'bg-rose-800 text-white border-rose-600' : 'bg-black/40 text-rose-900 border-rose-950/20 hover:text-rose-400'}`}
                              >
                                {p}
                              </button>
                           ))}
                        </div>
                     </div>
                     <select value={textModel} onChange={(e) => setTextModel(e.target.value)} className="w-full bg-black/40 border-none rounded-xl px-4 py-2.5 text-[10px] font-bold text-rose-100 uppercase tracking-widest">
                        {models.text.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                     <select value={imageModel} onChange={(e) => setImageModel(e.target.value)} className="w-full bg-black/40 border-none rounded-xl px-4 py-2.5 text-[10px] font-bold text-rose-100 uppercase tracking-widest">
                        {models.image.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                  </div>
               </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-24">
          {!character.name && !isGenerating ? (
            <div className="h-[800px] flex flex-col items-center justify-center text-rose-950/20 border border-rose-950/10 rounded-[6rem] bg-rose-950/[0.02] relative overflow-hidden shadow-2xl transition-all">
              <Heart className="w-48 h-48 animate-pulse mb-10 opacity-5" />
              <div className="text-5xl serif-display italic tracking-[0.3em] px-24 text-center leading-relaxed">
                <MorphingText options={t.morphing.canvas} english="The canvas awaits your crave..." />
              </div>
            </div>
          ) : (
            <div className="space-y-32">
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 transition-all duration-[2s] ${!isImageGenEnabled ? 'opacity-0 scale-95 pointer-events-none' : ''}`}>
                {(['character', 'scenario'] as const).map(type => (
                  <div key={type} className="group relative art-glass p-3 rounded-[4rem] transition-all duration-700 hover:shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                    <div className="absolute top-10 right-10 z-20 flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setCharacter(p => ({...p, [type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked']: !p[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked']}))} className={`p-5 rounded-full backdrop-blur-3xl shadow-2xl transition-all ${character[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] ? 'bg-rose-700 text-white' : 'bg-black/60 text-rose-400 border border-rose-950/30'}`}>
                        {character[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                      </button>
                      <button disabled={character[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] || isGenerating} onClick={() => onRegenerateImage(type)} className="p-5 rounded-full bg-rose-800 text-white hover:bg-rose-600 transition-all shadow-2xl active:scale-95">
                        <RefreshCw className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="aspect-[3/4] rounded-[3.5rem] overflow-hidden bg-rose-950/5 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                      {(type === 'character' ? character.characterImageUrl : character.scenarioImageUrl) ? (
                        <img src={type === 'character' ? character.characterImageUrl : character.scenarioImageUrl} alt={type} className="w-full h-full object-cover transform transition-transform duration-[8s] group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-6 group-hover:bg-rose-900/10 transition-colors cursor-pointer" onClick={() => !isGenerating && onRegenerateImage(type)}>
                           {isGenerating && generationStep?.includes(type === 'character' ? 'portrait' : 'scene') ? (
                             <RefreshCw className="w-16 h-16 animate-spin text-rose-600" />
                           ) : (
                             <div className="flex flex-col items-center gap-4 text-rose-950 opacity-20 group-hover:opacity-100 group-hover:text-rose-500 transition-all">
                               <Sparkles className="w-16 h-16" />
                               <span className="text-[10px] font-black uppercase tracking-[0.4em]">{type === 'character' ? 'Generate Portrait' : 'Generate Scenario'}</span>
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="art-glass p-16 md:p-24 rounded-[7rem] space-y-32 relative overflow-hidden shadow-[0_80px_200px_rgba(0,0,0,1)]">
                <div className="flex flex-col lg:flex-row items-end justify-between border-b border-rose-950/30 pb-20 gap-16 relative z-10">
                  <div className="flex flex-col gap-6 w-full">
                    <span className="text-[16px] font-black uppercase tracking-[1.2em] text-rose-950">{t.sculptor}</span>
                    <input className="text-[6rem] md:text-[8rem] serif-display italic tracking-tighter bg-transparent border-none outline-none text-rose-50 w-full focus:text-rose-400 transition-all duration-1000 leading-none" value={character.name} onChange={(e) => setCharacter(p => ({ ...p, name: e.target.value }))} placeholder="Unnamed..." />
                  </div>
                  <button onClick={onSave} className="p-8 text-rose-950 hover:text-rose-500 rounded-full transition-all group">
                    <Save className="w-10 h-10 group-active:scale-90" />
                  </button>
                </div>

                <div className="space-y-48 relative z-10">
                  {character.fields.map((field) => (
                    <div key={field.id} className="group/field relative space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                      <div className="flex items-center justify-between px-8">
                         <span className="text-[11px] font-black text-rose-900 uppercase tracking-[0.4em]">{field.label}</span>
                         <button onClick={() => setCharacter(p => ({...p, fields: p.fields.map(f => f.id === field.id ? {...f, isLocked: !f.isLocked} : f)}))} className={`p-2.5 rounded-full transition-all ${field.isLocked ? 'bg-rose-800 text-white' : 'bg-black/40 text-rose-900 border border-rose-900/20'}`}>
                            {field.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                      </div>
                      <textarea disabled={field.isLocked} value={field.value} onChange={(e) => setCharacter(p => ({...p, fields: p.fields.map(f => f.id === field.id ? {...f, value: e.target.value} : f)}))} className={`w-full min-h-[300px] bg-rose-950/[0.03] border-none rounded-[3rem] p-10 text-xl leading-[2.2] serif-display italic transition-all shadow-[inset_0_10px_40px_rgba(0,0,0,0.6)] ${field.isLocked ? 'opacity-30' : 'text-rose-100'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-10 right-10 z-[150] flex flex-col items-center gap-6 p-4">
        <button onClick={onGenerate} disabled={isGenerating || !prompt.trim()} className="w-48 h-48 bg-rose-800 text-white rounded-full font-black text-[14px] uppercase tracking-[0.3em] flex flex-col items-center justify-center gap-3 hover:bg-rose-700 active:scale-90 transition-all duration-700 shadow-[0_20px_60px_rgba(225,29,72,0.5)] forge-button disabled:opacity-5 border-4 border-rose-950/40">
          {isGenerating ? <RefreshCw className="animate-spin w-12 h-12" /> : (
            <>
              <Zap className="w-12 h-12 fill-white/20" />
              <span className="serif-display italic font-thin text-xl text-center">{t.breatheLife}</span>
            </>
          )}
        </button>
        {isGenerating && generationStep && (
          <div className="absolute top-[-80px] w-max art-glass px-8 py-4 rounded-full border border-rose-900/30 animate-pulse">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-400">{generationStep}</span>
          </div>
        )}
      </div>
    </div>
  );
};
