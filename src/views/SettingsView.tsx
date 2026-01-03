
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { AIProvider, AIModelMeta, AISecret, TagMeta } from '../types';
import { saveUserSecret, fetchUserSecrets, deleteUserSecret, saveModelsBulk, saveTagsBulk } from '../services/supabaseDatabaseService';
import { encryptSecret } from '../utils/encryption';
import { GlassCard } from '../components/ui/GlassCard';
import { DisplayTitle } from '../components/ui/DisplayTitle';
import { Key, Shield, Database, RefreshCw, Save, Trash2, Eye, EyeOff, Hash, ArrowLeft } from 'lucide-react';
import { STATIC_TAGS } from '../data/staticTags';

const DEFAULT_MODELS: AIModelMeta[] = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', isFree: true, provider: AIProvider.GEMINI, type: 'text' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', isFree: false, provider: AIProvider.GEMINI, type: 'text' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', isFree: true, provider: AIProvider.GEMINI, type: 'text' },
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', isFree: true, provider: AIProvider.CLAUDE, type: 'text' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', isFree: false, provider: AIProvider.CLAUDE, type: 'text' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', isFree: false, provider: AIProvider.CLAUDE, type: 'text' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini Flash Image', isFree: true, provider: AIProvider.GEMINI, type: 'image' },
  { id: 'gemini-3-pro-image-preview', name: 'Gemini Pro Image', isFree: false, provider: AIProvider.GEMINI, type: 'image' },
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4', isFree: false, provider: AIProvider.GEMINI, type: 'image' },
  { id: 'None', name: 'Disable Visuals', isFree: true, provider: AIProvider.GEMINI, type: 'image' },
];

interface SettingsViewProps {
  onNavigate?: (route: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { refreshModels, refreshTags } = useAppContext();
  const [secrets, setSecrets] = useState<AISecret[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({ provider: AIProvider.GEMINI, key: '' });

  useEffect(() => {
    if (user) loadSecrets();
  }, [user]);

  const loadSecrets = async () => {
    if (!user) return;
    const data = await fetchUserSecrets(user.id);
    setSecrets(data);
  };

  const handleSaveSecret = async () => {
    if (!user || !form.key.trim()) return;
    setIsLoading(true);
    try {
      const encrypted = await encryptSecret(form.key.trim(), user.id);
      const lastFour = form.key.trim().slice(-4);
      await saveUserSecret(user.id, form.provider, encrypted, lastFour);
      setForm({ ...form, key: '' });
      await loadSecrets();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const handleDeleteSecret = async (provider: AIProvider) => {
    if (!user) return;
    await deleteUserSecret(user.id, provider);
    await loadSecrets();
  };

  const handleSyncRegistry = async () => {
    setIsLoading(true);
    try {
      await saveModelsBulk(DEFAULT_MODELS);
      await saveTagsBulk(STATIC_TAGS);
      await refreshModels();
      await refreshTags();
      alert("System Registry synchronized with database!");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-48 pb-64 px-8 md:px-16 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="max-w-4xl w-full space-y-16">
        <div className="flex items-center justify-between border-b border-rose-950/30 pb-12">
          <DisplayTitle marathi="संरचना" english="System Architect" size="lg" />
          {onNavigate && (
            <button 
              onClick={() => onNavigate('#/studio/new')}
              className="flex items-center gap-3 px-6 py-3 bg-rose-950/20 border border-rose-900/20 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-900/40 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Return to Studio
            </button>
          )}
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <GlassCard padding="lg" className="rounded-[3rem] space-y-10">
            <div className="flex items-center gap-4 border-b border-rose-900/10 pb-6">
              <Key className="w-5 h-5 text-rose-600" />
              <h2 className="text-2xl serif-display text-rose-100">AI Secrets</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-rose-900 ml-1">Provider</label>
                <div className="flex gap-2">
                  {[AIProvider.GEMINI, AIProvider.CLAUDE].map(p => (
                    <button 
                      key={p} 
                      onClick={() => setForm({ ...form, provider: p })}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${form.provider === p ? 'bg-rose-800 text-white border-rose-600' : 'bg-black/40 text-rose-900 border-rose-950/20'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-rose-900 ml-1">API Key</label>
                <div className="relative">
                  <input 
                    type={showKey[form.provider] ? 'text' : 'password'}
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    className="w-full bg-black/40 border border-rose-950/40 rounded-xl px-6 py-4 text-[11px] text-rose-100 focus:border-rose-700/50 outline-none"
                    placeholder={`Enter your ${form.provider} key...`}
                  />
                  <button 
                    onClick={() => setShowKey({ ...showKey, [form.provider]: !showKey[form.provider] })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-900 hover:text-rose-500 transition-colors"
                  >
                    {showKey[form.provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSaveSecret}
                disabled={isLoading || !form.key}
                className="w-full py-4 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-500 transition-all shadow-xl disabled:opacity-20"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Encrypt & Save Secret
              </button>
            </div>

            <div className="space-y-4 pt-6 border-t border-rose-900/10">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-rose-700">Stored Keys</h3>
              <div className="space-y-2">
                {secrets.length === 0 ? (
                  <p className="text-[10px] italic text-rose-950">No encrypted keys found.</p>
                ) : (
                  secrets.map(s => (
                    <div key={s.provider} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-rose-950/20">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-rose-100 uppercase tracking-widest">{s.provider}</span>
                        <span className="text-[8px] text-rose-900 font-mono">**** **** **** {s.lastFour}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteSecret(s.provider)}
                        className="p-2 text-rose-950 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="lg" className="rounded-[3rem] space-y-10">
            <div className="flex items-center gap-4 border-b border-rose-900/10 pb-6">
              <Database className="w-5 h-5 text-rose-600" />
              <h2 className="text-2xl serif-display text-rose-100">System Registry</h2>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Database className="w-3 h-3 text-rose-800" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-rose-200">AI Models</span>
                  </div>
                  <span className="text-[9px] font-mono text-rose-900">{DEFAULT_MODELS.length} defined</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Hash className="w-3 h-3 text-rose-800" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-rose-200">Attribute Tags</span>
                  </div>
                  <span className="text-[9px] font-mono text-rose-900">{STATIC_TAGS.length} defined</span>
               </div>
            </div>

            <p className="text-[11px] italic text-rose-200/50 leading-relaxed font-serif">
              Synchronize the local model and tag definitions with the database to enable cross-device consistency and global system intelligence.
            </p>

            <button 
              onClick={handleSyncRegistry}
              disabled={isLoading}
              className="w-full py-6 bg-rose-950/40 border border-rose-900/30 text-rose-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex flex-col items-center justify-center gap-3 hover:bg-rose-900/20 transition-all group"
            >
              <RefreshCw className={`w-8 h-8 group-hover:rotate-180 transition-transform duration-700 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Global Registry
            </button>

            <div className="flex items-start gap-4 p-6 bg-amber-950/10 border border-amber-900/20 rounded-2xl">
              <Shield className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="space-y-1">
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Privacy Guard</span>
                <p className="text-[9px] text-amber-900 leading-normal italic">
                  All keys are XOR-encrypted using a hash derived from your unique session ID. 
                  The server never sees your plain-text keys.
                </p>
              </div>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
};
