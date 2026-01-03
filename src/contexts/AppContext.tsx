
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, translations } from '../i18n/translations';
import { AIModelMeta, AIProvider, TagMeta } from '../types';
import { fetchAllModels, fetchUserSecrets, fetchAllTags } from '../services/supabaseDatabaseService';
import { decryptSecret } from '../utils/encryption';
import { useAuth } from './AuthContext';

interface AppContextType {
  language: Language;
  setLanguage: (l: Language) => void;
  isGlobalNSFW: boolean;
  toggleGlobalNSFW: () => void;
  models: AIModelMeta[];
  tags: TagMeta[];
  userSecrets: Record<AIProvider, string>;
  refreshModels: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshSecrets: () => Promise<void>;
  isKeyAvailable: (provider: AIProvider) => boolean;
  t: typeof translations['en'];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => 
    (localStorage.getItem('kamana_lang') as Language) || 'mr'
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
    if (userSecrets[provider]) return true;
    if (provider === AIProvider.GEMINI) return !!process.env.API_KEY;
    if (provider === AIProvider.CLAUDE) return !!process.env.VITE_CLAUDE_API_KEY;
    return false;
  }, [userSecrets]);

  const t = useMemo(() => translations[language], [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
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
  }), [language, setLanguage, isGlobalNSFW, toggleGlobalNSFW, models, tags, userSecrets, refreshModels, refreshTags, refreshSecrets, isKeyAvailable, t]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
