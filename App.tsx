
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  User, 
  Layers, 
  Settings, 
  ImageIcon, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Plus, 
  X, 
  Flame, 
  Heart, 
  Key, 
  ChevronDown, 
  Download, 
  Eye, 
  Sparkles,
  Type as TypeIcon,
  Wand2,
  Trash2,
  Zap
} from 'lucide-react';
import { Platform, CharacterData, CharacterField, PLATFORMS_CONFIG, ContentFormat } from './types';
import { GeminiService } from './geminiService';

const gemini = new GeminiService();

const PREPOPULATED_MODELS = {
  text: ['gemini-3-pro-preview', 'gemini-3-flash-preview', 'Custom'],
  image: ['None', 'gemini-2.5-flash-image', 'gemini-3-pro-image-preview', 'Custom']
};

/**
 * A component that oscillates text between sensual and lewd versions
 */
const MorphingText: React.FC<{ options: string[]; english: string; className?: string }> = ({ options, english, className }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % options.length);
    }, 4000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [options]);

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="transition-all duration-1000 ease-in-out">
        {options[index]}
      </span>
      <span className="text-[9px] uppercase tracking-[0.4em] opacity-40 font-bold -mt-1">
        {english}
      </span>
    </div>
  );
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([Platform.CRUSHON_AI]);
  const [character, setCharacter] = useState<CharacterData>({
    name: '',
    fields: [],
    characterImageUrl: '',
    scenarioImageUrl: '',
    isCharacterImageLocked: false,
    isScenarioImageLocked: false,
    tags: [],
    isNSFW: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  // Errors for profane transition
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [textModel, setTextModel] = useState(PREPOPULATED_MODELS.text[0]);
  const [imageModel, setImageModel] = useState(PREPOPULATED_MODELS.image[1]);
  const [customTextModel, setCustomTextModel] = useState('');
  const [customImageModel, setCustomImageModel] = useState('');

  const activeTextModel = useMemo(() => textModel === 'Custom' ? customTextModel : textModel, [textModel, customTextModel]);
  const activeImageModel = useMemo(() => imageModel === 'Custom' ? customImageModel : imageModel, [imageModel, customImageModel]);
  const isImageGenEnabled = useMemo(() => activeImageModel !== 'None' && activeImageModel !== '', [activeImageModel]);

  const handleTogglePlatform = (p: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!prompt.trim()) {
      newErrors.prompt = "काय गांडूगिरी आहे? आधी काहीतरी लिही!";
    }
    if (textModel === 'Custom' && !customTextModel.trim()) {
      newErrors.textModel = "भिकारचोट, मॉडेलचं नाव कोण टाकणार?";
    }
    if (imageModel === 'Custom' && !customImageModel.trim()) {
      newErrors.imageModel = "डोकं ठिकाणावर आहे का? चित्र मॉडेलचं नाव टाक!";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generate = async () => {
    if (!validate()) return;
    setIsGenerating(true);
    try {
      const textResult = await gemini.generateCharacterText({
        prompt,
        platforms: selectedPlatforms,
        isNSFW: character.isNSFW,
        tags: character.tags,
        existingFields: character.fields,
        selectedModel: activeTextModel
      });

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

      let charImg = character.characterImageUrl;
      if (isImageGenEnabled && !character.isCharacterImageLocked) {
        charImg = await gemini.generateImage({
          prompt: `Highly evocative masterpiece portrait: ${textResult.name}. ${prompt}`,
          type: 'character',
          isNSFW: character.isNSFW,
          selectedModel: activeImageModel
        }) || charImg;
      }

      let scenImg = character.scenarioImageUrl;
      if (isImageGenEnabled && !character.isScenarioImageLocked) {
        scenImg = await gemini.generateImage({
          prompt: `Atmospheric architectural room of desire: ${prompt}`,
          type: 'scenario',
          isNSFW: character.isNSFW,
          selectedModel: activeImageModel
        }) || scenImg;
      }

      setCharacter(prev => ({
        ...prev,
        name: textResult.name,
        fields: updatedFields,
        characterImageUrl: charImg,
        scenarioImageUrl: scenImg
      }));
    } catch (e) {
        console.error(e);
        setErrors({ general: "ए, काहीतरी घोळ झालाय! पुन्हा प्रयत्न कर झवाड्या." });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateSingleImage = async (type: 'character' | 'scenario') => {
    if (!isImageGenEnabled) return;
    setIsGenerating(true);
    try {
      const img = await gemini.generateImage({
        prompt: `Provocative ${type === 'character' ? 'physiological form' : 'environment'} for: ${character.name}. ${prompt}`,
        type,
        isNSFW: character.isNSFW,
        selectedModel: activeImageModel
      });
      if (img) {
        setCharacter(prev => ({
          ...prev,
          [type === 'character' ? 'characterImageUrl' : 'scenarioImageUrl']: img
        }));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const CustomField = ({ field, idx }: { field: CharacterField, idx: number }) => (
    <div className="group/field relative space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700" style={{ animationDelay: `${idx * 0.1}s` }}>
      <div className="flex items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-rose-900 uppercase tracking-[0.4em]">{field.label}</span>
            <span className="text-[8px] uppercase tracking-[0.3em] opacity-40 font-bold -mt-0.5">Attributes</span>
          </div>
          {field.isLocked && <Lock className="w-3.5 h-3.5 text-rose-600" />}
        </div>
        
        <div className="flex items-center gap-4 opacity-0 group-hover/field:opacity-100 transition-all duration-500">
          <div className="flex bg-black/40 p-1.5 rounded-full border border-rose-900/10 backdrop-blur-3xl">
            {(['markdown', 'html', 'plaintext'] as ContentFormat[]).map(fmt => (
              <button
                key={fmt}
                onClick={() => setCharacter(p => ({...p, fields: p.fields.map(f => f.id === field.id ? {...f, format: fmt} : f)}))}
                className={`px-4 py-1.5 text-[9px] rounded-full uppercase font-black tracking-widest transition-all ${field.format === fmt ? 'bg-rose-800 text-white shadow-lg' : 'text-rose-900 hover:text-rose-400'}`}
              >
                {fmt === 'markdown' ? 'कागद' : fmt === 'html' ? 'वेब' : 'शब्द'}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setCharacter(p => ({...p, fields: p.fields.map(f => f.id === field.id ? {...f, isLocked: !f.isLocked} : f)}))}
            className={`p-2.5 rounded-full transition-all ${field.isLocked ? 'bg-rose-800 text-white' : 'bg-black/40 text-rose-900 border border-rose-900/20 hover:text-rose-500'}`}
          >
            {field.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          disabled={field.isLocked}
          value={field.value}
          onChange={(e) => setCharacter(p => ({...p, fields: p.fields.map(f => f.id === field.id ? {...f, value: e.target.value} : f)}))}
          className={`w-full min-h-[300px] bg-rose-950/[0.03] border-none rounded-[3rem] p-10 text-xl leading-[2.2] serif-display italic transition-all shadow-[inset_0_10px_40px_rgba(0,0,0,0.6)] ${field.isLocked ? 'opacity-30 cursor-not-allowed grayscale' : 'focus:ring-1 focus:ring-rose-800/20 text-rose-100'}`}
          placeholder={`${field.label} ची खोली वाढवा... (Deepen the manifestation)`}
        />
        <div className="absolute top-10 left-4 flex flex-col gap-2 opacity-5">
           <div className="w-1 h-16 bg-rose-600 rounded-full" />
           <div className="w-1 h-8 bg-rose-900 rounded-full" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen selection:bg-rose-900 selection:text-rose-100">
      <div className="aura-blob bg-rose-900 top-[-10%] left-[-10%]" />
      <div className="aura-blob bg-rose-950 bottom-[-10%] right-[-10%]" style={{ animationDelay: '-15s' }} />

      {/* Cinematic Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] art-glass border-b border-rose-950/20 px-8 py-4 md:px-16 flex items-center justify-between">
        <div className="flex items-center gap-8 group">
          <div className="relative cursor-pointer transition-transform duration-700 hover:rotate-12">
            <div className="w-16 h-16 bg-gradient-to-tr from-rose-950 to-rose-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.3)]">
              <Flame className="text-white w-8 h-8" />
            </div>
            <div className="absolute inset-0 bg-rose-500 rounded-full blur-2xl opacity-10 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <MorphingText 
              options={["कामना", "हव्यास"]} 
              english="Desire" 
              className="text-4xl serif-display leading-none glow-text tracking-tighter"
            />
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4 px-6 py-2.5 bg-black/40 border border-rose-900/10 rounded-full shadow-lg group/nsfw transition-all hover:border-rose-700/40">
            <Heart className={`w-5 h-5 transition-all duration-700 ${character.isNSFW ? 'text-rose-600 fill-rose-600 scale-125' : 'text-rose-950'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-rose-100 uppercase hidden sm:block">
                {character.isNSFW ? 'बेबंद' : 'संयमित'}
              </span>
              <span className="text-[8px] font-bold tracking-widest opacity-40 uppercase -mt-0.5 hidden sm:block">
                {character.isNSFW ? 'Uncensored' : 'Restrained'}
              </span>
            </div>
            <button 
              onClick={() => setCharacter(p => ({ ...p, isNSFW: !p.isNSFW }))}
              className={`w-12 h-6 rounded-full relative transition-all ${character.isNSFW ? 'bg-rose-800' : 'bg-rose-950/40'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-500 ${character.isNSFW ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto px-8 lg:px-16 pt-36 pb-64 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        
        {/* Sidebar: The Artist's Lab */}
        <section className="lg:col-span-4 space-y-12">
          <div className="art-glass p-10 rounded-[3rem] space-y-10 border border-rose-950/30">
            <div className="border-b border-rose-950/50 pb-6 flex items-center justify-between">
              <MorphingText 
                options={["माजलेली रांड", "विखारी शृंगार"]} 
                english="Studio" 
                className="text-3xl serif-display text-rose-50"
              />
              <span className="text-[10px] font-black tracking-[0.4em] text-rose-800/40 serif not-italic italic uppercase">सृजन शाळा</span>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col ml-4">
                <span className={`text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-500 ${errors.prompt ? 'text-red-500 animate-bounce' : 'text-rose-900'}`}>
                  {errors.prompt || "कल्पनाशक्ती"}
                </span>
                <span className="text-[8px] font-bold opacity-30 uppercase tracking-[0.4em] -mt-0.5">Imagination</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setErrors(prev => ({ ...prev, prompt: '' }));
                }}
                className="w-full h-[400px] bg-rose-950/10 border-none rounded-[2rem] p-8 text-lg leading-[2] serif-display italic focus:ring-1 focus:ring-rose-800/20 text-rose-100 resize-none placeholder:opacity-20 shadow-inner"
                placeholder="तुमची शाई येथे सांडा... तिच्या पापाचे आणि रूपाचे वर्णन करा... (Spill your ink here...)"
              />
            </div>

            <div className="space-y-8">
              <div className="flex flex-col ml-4">
                <span className="text-[10px] font-black text-rose-900 uppercase tracking-[0.5em]">मंच</span>
                <span className="text-[8px] font-bold opacity-30 uppercase tracking-[0.4em] -mt-0.5">Platforms</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(Platform).map(p => (
                  <button
                    key={p}
                    onClick={() => handleTogglePlatform(p)}
                    className={`px-4 py-3.5 rounded-2xl text-[10px] font-black tracking-widest transition-all border ${
                      selectedPlatforms.includes(p) 
                        ? 'bg-rose-800 text-white border-rose-600 shadow-xl scale-[1.02]' 
                        : 'bg-black/20 text-rose-700/30 border-rose-950/40 hover:text-rose-400 hover:border-rose-900/40'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex flex-col ml-4">
                <span className="text-[10px] font-black text-rose-900 uppercase tracking-[0.5em]">खुणा</span>
                <span className="text-[8px] font-bold opacity-30 uppercase tracking-[0.4em] -mt-0.5">Tags</span>
              </div>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      setCharacter(p => ({...p, tags: [...p.tags, tagInput.trim()]}));
                      setTagInput('');
                    }
                  }}
                  className="flex-1 bg-black/20 border-none rounded-full px-6 py-4 text-xs italic serif-display text-rose-100 placeholder:opacity-20 shadow-inner"
                  placeholder="उत्तेजक खुणा... (Provocative markers)"
                />
                <button 
                  onClick={() => { if (tagInput.trim()) { setCharacter(p => ({...p, tags: [...p.tags, tagInput.trim()]})); setTagInput(''); } }}
                  className="p-4 bg-rose-900/20 text-rose-500 rounded-full hover:bg-rose-800 hover:text-white transition-all shadow-lg active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-2">
                {character.tags.map(t => (
                  <span key={t} className="flex items-center gap-3 bg-rose-950/20 border border-rose-900/10 rounded-full px-4 py-2 text-[10px] font-black text-rose-600 tracking-widest group">
                    {t}
                    <button onClick={() => setCharacter(p => ({...p, tags: p.tags.filter(tag => tag !== t)}))} className="hover:text-rose-100 opacity-40 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="art-glass p-10 rounded-[3rem] space-y-10 border border-rose-950/30">
            <div className="border-b border-rose-950/50 pb-6 flex items-center justify-between">
              <MorphingText 
                options={["चावट धंदे", "गुपित चेटूक"]} 
                english="Alchemy" 
                className="text-3xl serif-display text-rose-50"
              />
              <span className="text-[10px] font-black tracking-[0.4em] text-rose-800/40 serif not-italic italic uppercase">किमया</span>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex flex-col ml-4">
                  <span className={`text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-500 ${errors.textModel ? 'text-red-500' : 'text-rose-900'}`}>
                    {errors.textModel || "शब्द-ब्रह्म"}
                  </span>
                  <span className="text-[8px] font-bold opacity-30 uppercase tracking-[0.4em] -mt-0.5">Oracle (Text)</span>
                </div>
                <div className="relative group">
                  <select 
                    value={textModel} 
                    onChange={(e) => {
                      setTextModel(e.target.value);
                      setErrors(prev => ({ ...prev, textModel: '' }));
                    }}
                    className="w-full bg-rose-950/20 border border-rose-900/20 rounded-2xl px-6 py-4 text-xs font-medium text-rose-100 appearance-none focus:border-rose-700/40 outline-none transition-all cursor-pointer"
                  >
                    {PREPOPULATED_MODELS.text.map(m => <option key={m} value={m} className="bg-[#050203] text-rose-100">{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-800 pointer-events-none group-hover:text-rose-500 transition-colors" />
                </div>
                {textModel === 'Custom' && (
                  <input
                    type="text"
                    value={customTextModel}
                    onChange={(e) => {
                      setCustomTextModel(e.target.value);
                      setErrors(prev => ({ ...prev, textModel: '' }));
                    }}
                    placeholder="मॉडेल आयडी... (Model ID)"
                    className="w-full bg-rose-950/10 border border-rose-900/20 rounded-xl px-6 py-3 text-[11px] text-rose-300 placeholder:opacity-20"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-4">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-500 ${errors.imageModel ? 'text-red-500' : 'text-rose-900'}`}>
                      {errors.imageModel || "चित्र-दृष्टी"}
                    </span>
                    <span className="text-[8px] font-bold opacity-30 uppercase tracking-[0.4em] -mt-0.5">Lens (Image)</span>
                  </div>
                  {!isImageGenEnabled && <span className="text-[9px] text-amber-900/50 font-black tracking-tighter uppercase">आंधळे (Blind)</span>}
                </div>
                <div className="relative group">
                  <select 
                    value={imageModel} 
                    onChange={(e) => {
                      setImageModel(e.target.value);
                      setErrors(prev => ({ ...prev, imageModel: '' }));
                    }}
                    className={`w-full bg-rose-950/20 border border-rose-900/20 rounded-2xl px-6 py-4 text-xs font-medium text-rose-100 appearance-none focus:border-rose-700/40 outline-none transition-all cursor-pointer ${!isImageGenEnabled ? 'opacity-30' : ''}`}
                  >
                    {PREPOPULATED_MODELS.image.map(m => <option key={m} value={m} className="bg-[#050203] text-rose-100">{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-800 pointer-events-none group-hover:text-rose-500 transition-colors" />
                </div>
                {imageModel === 'Custom' && (
                  <input
                    type="text"
                    value={customImageModel}
                    onChange={(e) => {
                      setCustomImageModel(e.target.value);
                      setErrors(prev => ({ ...prev, imageModel: '' }));
                    }}
                    placeholder="मॉडेल आयडी... (Model ID)"
                    className="w-full bg-rose-950/10 border border-rose-900/20 rounded-xl px-6 py-3 text-[11px] text-rose-300 placeholder:opacity-20"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Workspace: The Exhibition */}
        <section className="lg:col-span-8 space-y-24">
          {!character.name && !isGenerating ? (
            <div className="h-[800px] flex flex-col items-center justify-center text-rose-950/20 border border-rose-950/10 rounded-[6rem] bg-rose-950/[0.02] relative overflow-hidden shadow-2xl transition-all hover:bg-rose-950/[0.04]">
              <Heart className="w-48 h-48 animate-pulse mb-10 opacity-5" />
              <div className="text-5xl serif-display italic tracking-[0.3em] px-24 text-center leading-relaxed">
                <MorphingText 
                  options={["कॅनव्हास तुमच्या इच्छेची वाट पाहत आहे... ती सोडा.", "तुमची वासना येथे मांडून पहा..."]} 
                  english="The canvas awaits your crave... release it." 
                />
              </div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-[0.02] pointer-events-none" />
            </div>
          ) : (
            <div className="space-y-32">
              
              {/* Image Manifestations */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 transition-all duration-[2s] ${!isImageGenEnabled ? 'opacity-0 scale-95 pointer-events-none' : ''}`}>
                {(['character', 'scenario'] as const).map(type => (
                  <div key={type} className="group relative art-glass p-3 rounded-[4rem] transition-all duration-700 hover:shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                    <div className="absolute top-10 right-10 z-20 flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                      <button 
                        onClick={() => setCharacter(p => ({...p, [type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked']: !p[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked']}))}
                        className={`p-5 rounded-full backdrop-blur-3xl shadow-2xl transition-all ${character[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] ? 'bg-rose-700 text-white' : 'bg-black/60 text-rose-400 border border-rose-950/30'}`}
                      >
                        {character[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                      </button>
                      <button 
                        disabled={character[type === 'character' ? 'isCharacterImageLocked' : 'isScenarioImageLocked'] || isGenerating}
                        onClick={() => regenerateSingleImage(type)}
                        className="p-5 rounded-full bg-rose-800 text-white hover:bg-rose-600 transition-all shadow-2xl disabled:opacity-5 active:scale-95"
                      >
                        <RefreshCw className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="aspect-[3/4] rounded-[3.5rem] overflow-hidden bg-rose-950/5 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                      {(type === 'character' ? character.characterImageUrl : character.scenarioImageUrl) ? (
                        <img 
                          src={type === 'character' ? character.characterImageUrl : character.scenarioImageUrl} 
                          alt={type} 
                          className="w-full h-full object-cover transform transition-transform duration-[8s] group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-6 opacity-30">
                           <RefreshCw className="w-16 h-16 animate-spin text-rose-950" />
                           <span className="text-[10px] uppercase font-black tracking-widest text-rose-950">आराखडा तयार करत आहे... (Drafting...)</span>
                        </div>
                      )}
                      
                      <div className="absolute bottom-12 left-0 right-0 text-center z-20">
                         <h3 className="text-4xl serif-display text-rose-100 tracking-[0.4em] glow-text drop-shadow-2xl">
                           {type === 'character' ? 'कामुक शरीर' : 'विखारी वासना'}
                         </h3>
                         <span className="text-[9px] uppercase tracking-[0.8em] text-rose-700/60 font-black mt-4 inline-block">
                           {type === 'character' ? 'देह (Body)' : 'दालन (Chamber)'}
                         </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Character Codex */}
              <div className="art-glass p-16 md:p-24 rounded-[7rem] space-y-32 relative overflow-hidden shadow-[0_80px_200px_rgba(0,0,0,1)]">
                <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-rose-800/[0.03] blur-[250px] pointer-events-none rounded-full" />
                
                <div className="flex flex-col lg:flex-row items-end justify-between border-b border-rose-950/30 pb-20 gap-16 relative z-10">
                  <div className="flex flex-col gap-6 w-full">
                    <div className="flex items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
                      <MorphingText options={["मुर्तिकार", "भोगकर्ता"]} english="Sculptor" className="text-[16px] font-black uppercase tracking-[1.2em] text-rose-950" />
                      <div className="h-[1px] w-48 bg-rose-950/20" />
                    </div>
                    <input
                      className="text-[6rem] md:text-[8rem] serif-display italic tracking-tighter bg-transparent border-none outline-none text-rose-50 w-full focus:text-rose-400 transition-all duration-1000 leading-none placeholder:opacity-5"
                      value={character.name}
                      onChange={(e) => setCharacter(p => ({ ...p, name: e.target.value }))}
                      placeholder="अनामिक... (Unnamed)"
                    />
                  </div>
                  <div className="flex gap-8 mb-6">
                    <button className="p-8 text-rose-950 hover:text-rose-500 hover:bg-rose-500/5 rounded-full transition-all shadow-3xl hover:scale-110 active:scale-95 duration-500"><Download className="w-10 h-10" /></button>
                    <button className="p-8 text-rose-950 hover:text-rose-500 hover:bg-rose-500/5 rounded-full transition-all shadow-3xl hover:scale-110 active:scale-95 duration-500"><Eye className="w-10 h-10" /></button>
                  </div>
                </div>

                <div className="space-y-48 relative z-10">
                  <div className="flex items-center gap-12 group/header">
                     <MorphingText options={["नंगा वजूद", "भोग-दर्शन"]} english="Existence" className="text-7xl serif-display italic text-rose-100 tracking-[-0.03em] font-thin" />
                     <div className="h-[1px] flex-1 bg-rose-900/10 group-hover/header:bg-rose-800/20 transition-colors duration-700" />
                     <span className="text-[11px] font-black text-rose-950 uppercase tracking-[1em]">(अस्तित्व)</span>
                  </div>
                  
                  {character.fields.map((field, idx) => (
                    <CustomField key={field.id} field={field} idx={idx} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Repositioned Orchestration Controls: Bottom-Right Corner Cluster */}
      <div className="fixed bottom-10 right-10 z-[150] flex flex-col items-center gap-6 p-4 rounded-full transition-all group/orchestra">
        
        {/* Settings Button */}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-6 art-glass text-rose-950 hover:text-rose-500 rounded-full transition-all duration-1000 hover:rotate-180 shadow-xl border border-rose-900/20"
        >
          <Settings className="w-10 h-10" />
        </button>

        {/* Main Creation Button - "Pran Phunka" (Breathe Life) */}
        <button 
          onClick={generate}
          disabled={isGenerating || !prompt.trim()}
          className="w-48 h-48 bg-rose-800 text-white rounded-full font-black text-[14px] uppercase tracking-[0.3em] flex flex-col items-center justify-center gap-3 hover:bg-rose-700 active:scale-90 transition-all duration-700 shadow-[0_20px_60px_rgba(225,29,72,0.5)] forge-button disabled:opacity-5 relative overflow-hidden group/forge border-4 border-rose-950/40"
        >
          {isGenerating ? (
            <RefreshCw className="animate-spin w-12 h-12" />
          ) : (
            <>
              <Zap className="w-12 h-12 group-hover/forge:scale-110 transition-transform duration-700 fill-white/20" />
              <MorphingText 
                options={["प्राण फुंका", "भोग सुरू करा"]} 
                english="Breathe Life" 
                className="serif-display italic font-thin text-xl text-center"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default App;
