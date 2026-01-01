
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Platform, CharacterData, CharacterField, PLATFORMS_CONFIG, User, AIProvider, CharacterStatus } from './types';
import { GeminiService } from './services/geminiService';
import { ClaudeService } from './services/claudeService';
import { supabase, uploadImageToStorage } from './services/supabaseClient';
import { hashData } from './utils/helpers';
import { Language, translations } from './i18n/translations';

// Import split components/views
import { Header } from './components/Header';
import { LoginView } from './views/LoginView';
import { MuseumView } from './views/MuseumView';
import { StudioView } from './views/StudioView';

const gemini = new GeminiService();
const claude = new ClaudeService();

const PREPOPULATED_MODELS = {
  [AIProvider.GEMINI]: {
    text: ['gemini-3-pro-preview', 'gemini-3-flash-preview', 'Custom'],
    image: ['None', 'gemini-2.5-flash-image', 'gemini-3-pro-image-preview', 'imagen-4.0-generate-001', 'Custom']
  },
  [AIProvider.CLAUDE]: {
    text: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku', 'Custom'],
    image: ['None', 'claude-image-pro', 'gemini-2.5-flash-image', 'Custom']
  }
};

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState(() => window.location.hash || '#/login');
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('kamana_lang') as Language) || 'mr');
  const [ageVerified, setAgeVerified] = useState(() => localStorage.getItem('kamana_age_verified') === 'true');
  const [savedCharacters, setSavedCharacters] = useState<CharacterData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

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
    isNSFW: false,
    version: 1,
    status: 'draft',
    originalPrompt: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [provider, setProvider] = useState<AIProvider>(AIProvider.GEMINI);
  const [textModel, setTextModel] = useState(PREPOPULATED_MODELS[AIProvider.GEMINI].text[0]);
  const [imageModel, setImageModel] = useState(PREPOPULATED_MODELS[AIProvider.GEMINI].image[1]);
  const [customTextModel] = useState('');
  const [customImageModel] = useState('');

  useEffect(() => {
    setTextModel(PREPOPULATED_MODELS[provider].text[0]);
    setImageModel(PREPOPULATED_MODELS[provider].image[1]);
  }, [provider]);

  const activeTextModel = useMemo(() => textModel === 'Custom' ? customTextModel : textModel, [textModel, customTextModel]);
  const activeImageModel = useMemo(() => imageModel === 'Custom' ? customImageModel : imageModel, [imageModel, customImageModel]);
  const isImageGenEnabled = useMemo(() => activeImageModel !== 'None' && activeImageModel !== '', [activeImageModel]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    localStorage.setItem('kamana_lang', language);
  }, [language]);

  useEffect(() => {
    const handleHashChange = () => setCurrentRoute(window.location.hash || '#/login');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string) => { window.location.hash = route; };

  const fetchCharacters = useCallback(async (userId: string) => {
    if (!supabase) return;
    setIsSyncing(true);
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSavedCharacters(data.map(item => ({
        ...item.data,
        id: item.id,
        createdAt: new Date(item.created_at).getTime()
      })));
    }
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      if (ageVerified) {
        setUser({ id: 'local-user', name: 'स्थानिक कलाकार', email: 'local@kamana.app', isLoggedIn: true });
        if (currentRoute === '#/login') navigateTo('#/studio');
      }
      return;
    }

    const checkUser = async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Unknown',
          email: session.user.email || '',
          isLoggedIn: true
        });
        if (ageVerified && currentRoute === '#/login') navigateTo('#/studio');
        fetchCharacters(session.user.id);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Unknown',
          email: session.user.email || '',
          isLoggedIn: true
        });
        if (ageVerified) navigateTo('#/studio');
        fetchCharacters(session.user.id);
      } else {
        setUser(null);
        setSavedCharacters([]);
        navigateTo('#/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [ageVerified, currentRoute, fetchCharacters]);

  const signIn = async () => {
    if (!supabase) {
      setUser({ id: 'local-user', name: 'स्थानिक कलाकार', email: 'local@kamana.app', isLoggedIn: true });
      setAgeVerified(true);
      localStorage.setItem('kamana_age_verified', 'true');
      navigateTo('#/studio');
      return;
    }
    setIsLoggingIn(true);
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    });
    setIsLoggingIn(false);
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem('kamana_age_verified');
    setAgeVerified(false);
    setUser(null);
    navigateTo('#/login');
  };

  const generate = async () => {
    if (!prompt.trim()) {
      setErrors({ prompt: language === 'mr' ? "प्रॉम्प्ट आवश्यक आहे" : "Prompt is required" });
      return;
    }
    
    setIsGenerating(true);
    setGenerationStep(language === 'mr' ? "आराखडा तयार होत आहे..." : "Drafting persona...");
    
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function' && activeImageModel.includes('pro')) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) await aistudio.openSelectKey();
      }

      // 1. Text Generation
      const service = provider === AIProvider.GEMINI ? gemini : claude;
      const textResult = await service.generateCharacterText({
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

      let charImgUrl = character.characterImageUrl;
      let scenImgUrl = character.scenarioImageUrl;
      let charImgPrompt = character.characterImagePrompt;
      let scenImgPrompt = character.scenarioImagePrompt;

      // 2. Sequential Image Generation
      if (isImageGenEnabled) {
        await sleep(1000);
        
        if (!character.isCharacterImageLocked) {
          setGenerationStep(language === 'mr' ? "पोर्ट्रेट तयार होत आहे..." : "Painting portrait...");
          charImgPrompt = `Portrait: ${textResult.name}. ${prompt}`;
          const charImgBase64 = await service.generateImage({
            prompt: charImgPrompt,
            type: 'character',
            isNSFW: character.isNSFW,
            selectedModel: activeImageModel
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
          const scenImgBase64 = await service.generateImage({
            prompt: scenImgPrompt,
            type: 'scenario',
            isNSFW: character.isNSFW,
            selectedModel: activeImageModel
          });
          if (scenImgBase64) {
            const cloudUrl = user ? await uploadImageToStorage(user.id, scenImgBase64, 'scenario') : null;
            scenImgUrl = cloudUrl || scenImgBase64;
          }
        }
      }

      setCharacter(prev => ({ 
        ...prev, 
        name: textResult.name, 
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
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.openSelectKey === 'function' && e.message?.includes("Requested entity was not found.")) {
        await aistudio.openSelectKey();
      }
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
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function' && activeImageModel.includes('pro')) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) await aistudio.openSelectKey();
      }

      const service = provider === AIProvider.GEMINI ? gemini : claude;
      const imgBase64 = await service.generateImage({
        prompt: imgPrompt,
        type,
        isNSFW: character.isNSFW,
        selectedModel: activeImageModel
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
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.openSelectKey === 'function' && e.message?.includes("Requested entity was not found.")) {
        await aistudio.openSelectKey();
      }
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const saveToCollection = async (status: CharacterStatus = 'draft') => {
    if (!character.name || !user) return;
    setIsSyncing(true);
    
    let targetVersion = character.version;
    let targetParentBotId = character.parentBotId || Math.random().toString(36).substring(2, 15);

    if (character.status === 'finalized' && status === 'draft') {
      targetVersion = character.version + 1;
    }

    const characterToSave: CharacterData = {
      ...character,
      status,
      version: targetVersion,
      parentBotId: targetParentBotId,
      createdAt: Date.now()
    };

    const promptHash = await hashData(character.originalPrompt || prompt);

    if (supabase) {
      const { data, error } = await supabase.from('characters').insert([{ 
        user_id: user.id, 
        data: characterToSave, 
        content_hash: promptHash,
        parent_bot_id: targetParentBotId
      }]).select();
      
      if (!error && data) {
        setCharacter({ ...characterToSave, id: data[0].id });
        await fetchCharacters(user.id);
      } else if (error) {
        console.error('Database save failed:', error);
      }
    } else {
      const newId = 'local-' + Date.now();
      const updated = [{ ...characterToSave, id: newId }, ...savedCharacters];
      setSavedCharacters(updated);
      setCharacter({ ...characterToSave, id: newId });
    }
    setIsSyncing(false);
  };

  const deleteCharacter = async (id: string) => {
    if (!user) return;
    setIsSyncing(true);
    if (supabase) {
      await supabase.from('characters').delete().eq('id', id);
      await fetchCharacters(user.id);
    } else {
      setSavedCharacters(savedCharacters.filter(c => c.id !== id));
    }
    setIsSyncing(false);
  };

  const renderView = () => {
    switch (currentRoute) {
      case '#/studio': 
        return (
          <>
            <Header user={user} isNSFW={character.isNSFW} onToggleNSFW={() => setCharacter(p => ({...p, isNSFW: !p.isNSFW}))} onNavigate={navigateTo} onSignOut={signOut} language={language} onLanguageChange={setLanguage} />
            <StudioView
              prompt={prompt} setPrompt={setPrompt} selectedPlatforms={selectedPlatforms}
              onTogglePlatform={(p) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
              character={character} setCharacter={setCharacter} isGenerating={isGenerating}
              generationStep={generationStep}
              onGenerate={generate} onRegenerateImage={regenerateSingleImage} onSave={saveToCollection}
              textModel={textModel} setTextModel={setTextModel} imageModel={imageModel} setImageModel={setImageModel}
              isImageGenEnabled={isImageGenEnabled} errors={errors} models={PREPOPULATED_MODELS[provider]} language={language}
              provider={provider} setProvider={setProvider}
            />
          </>
        );
      case '#/museum':
        return (
          <>
            <Header user={user} isNSFW={character.isNSFW} onToggleNSFW={() => setCharacter(p => ({...p, isNSFW: !p.isNSFW}))} onNavigate={navigateTo} onSignOut={signOut} language={language} onLanguageChange={setLanguage} />
            <MuseumView characters={savedCharacters} onNavigate={navigateTo} onEdit={(c) => { setCharacter(c); setPrompt(c.originalPrompt || ''); navigateTo('#/studio'); }} onDelete={deleteCharacter} />
          </>
        );
      case '#/login':
      default: return <LoginView onSignIn={signIn} isLoggingIn={isLoggingIn} language={language} />;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="aura-blob bg-rose-900 top-[-10%] left-[-10%]" />
      <div className="aura-blob bg-rose-950 bottom-[-10%] right-[-10%]" style={{ animationDelay: '-15s' }} />
      {renderView()}
    </div>
  );
};

export default App;
