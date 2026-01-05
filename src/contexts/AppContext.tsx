import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, translations } from '../i18n/translations';
import { AIModelMeta, AIProvider, TagMeta, Theme } from '../types';
import { fetchAllModels, fetchUserSecrets, fetchAllTags } from '../services/supabaseDatabaseService';
import { decryptSecret } from '../utils/encryption';
import { useAuth } from './AuthContext';
import { categorizedProfanity } from '../i18n/profanity';

interface AppContextType {
  language: Language;
  setLanguage: (l: Language) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  isGlobalNSFW: boolean;
  toggleGlobalNSFW: () => void;
  models: AIModelMeta[];
  tags: TagMeta[];
  userSecrets: Record<AIProvider, string>;
  refreshModels: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshSecrets: () => Promise<void>;
  isKeyAvailable: (provider: AIProvider) => boolean;
  t: any; // Dynamic translation object
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [language, setLanguageState] = useState<Language>(() => 
    (localStorage.getItem('kamana_lang') as Language) || 'mr'
  );
  
  const [theme, setThemeState] = useState<Theme>(() => 
    (localStorage.getItem('kamana_theme') as Theme) || Theme.DEFAULT
  );

  const [isGlobalNSFW, setIsNSFWState] = useState<boolean>(() => 
    localStorage.getItem('kamana_isNSFW') !== 'false'
  );

  const [models, setModels] = useState<AIModelMeta[]>([]);
  const [tags, setTags] = useState<TagMeta[]>([]);
  const [userSecrets, setUserSecrets] = useState<Record<AIProvider, string>>({} as any);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    localStorage.setItem('kamana_lang', l);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('kamana_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleGlobalNSFW = useCallback(() => {
    setIsNSFWState(prev => {
      const newVal = !prev;
      localStorage.setItem('kamana_isNSFW', newVal.toString());
      return newVal;
    });
  }, []);

  const refreshModels = useCallback(async () => {
    try {
      const data = await fetchAllModels();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  }, []);

  const refreshTags = useCallback(async () => {
    try {
      const data = await fetchAllTags();
      setTags(data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  }, []);

  const refreshSecrets = useCallback(async () => {
    if (!user) {
      setUserSecrets({} as any);
      return;
    }
    try {
      const secrets = await fetchUserSecrets(user.id);
      const decrypted: any = {};
      for (const s of secrets) {
        decrypted[s.provider] = await decryptSecret(s.encryptedKey, user.id);
      }
      setUserSecrets(decrypted);
    } catch (err) {
      console.error('Failed to decrypt secrets:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshModels();
    refreshTags();
    refreshSecrets();
  }, [refreshModels, refreshTags, refreshSecrets]);

  const isKeyAvailable = useCallback((provider: AIProvider) => {
    // Guidelines: Gemini API key must be obtained exclusively from process.env.API_KEY.
    // Assume this variable is pre-configured, valid, and accessible.
    if (provider === AIProvider.GEMINI) return true;
    
    if (userSecrets[provider]) return true;
    
    return false;
  }, [userSecrets]);

  // Dynamically calculate translations and morphing text based on theme and language (MR, HI, EN)
  const t = useMemo(() => {
    const base = translations[language];
    const profanity = categorizedProfanity[language];
    
    return {
      ...base,
      morphing: {
        ...base.morphing,
        desire: profanity.desire[theme],
        imagination: profanity.imagination[theme],
        studio: profanity.studio[theme],
        canvas: profanity.canvas[theme],
        chatNow: profanity.chatNow[theme]
      }
    };
  }, [language, theme]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    theme,
    setTheme,
    isGlobalNSFW,
    toggleGlobalNSFW,
    models,
    tags,
    userSecrets,
    refreshModels,
    refreshTags,
    refreshSecrets,
    isKeyAvailable,
    t
  }), [language, setLanguage, theme, setTheme, isGlobalNSFW, toggleGlobalNSFW, models, tags, userSecrets, refreshModels, refreshTags, refreshSecrets, isKeyAvailable, t]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};