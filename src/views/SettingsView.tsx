import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { AIProvider, AISecret } from '../types';
import { saveUserSecret, fetchUserSecrets, deleteUserSecret } from '../services/supabaseDatabaseService';
import { MigrationService } from '../services/migrationService';
import { DEFAULT_MODELS } from '../data/defaultModels';
import { STATIC_TAGS } from '../data/staticTags';
import { SCHEMA_SQL } from '../data/schemaSql';
import { encryptSecret } from '../utils/encryption';
import { GlassCard } from '../components/ui/GlassCard';
import { DisplayTitle } from '../components/ui/DisplayTitle';
import { Key, Shield, Database, RefreshCw, Save, Trash2, Eye, EyeOff, Hash, ArrowLeft, CheckCircle, Calendar, Code, ChevronRight } from 'lucide-react';

export const SettingsView: React.FC<{ onNavigate?: (route: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { refreshModels, refreshTags, isKeyAvailable } = useAppContext();
  const [secrets, setSecrets] = useState<AISecret[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  // Default to CLAUDE or another non-Gemini provider for the manual key entry form
  const [form, setForm] = useState({ provider: AIProvider.CLAUDE, key: '' });

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
      setIsLoading(false);
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
      await MigrationService.forceSyncRegistry();
      await refreshModels();
      await refreshTags();
      alert("Creative Axis synchronized with the central repository!");
    } catch (e) {
      console.error("Sync failed:", e);
      alert("Failed to synchronize axis. Check database connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStaleStatus = (ts: number) => {
    const diffDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) return 'text-amber-500';
    return 'text-rose-900/40';
  };

  return (
    <div className="min-h-screen pt-48 pb-64 px-8 md:px-16 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="max-w-6xl w-full space-y-16">
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
            <div className="flex items-center gap-4 border-b border-rose-950/10 pb-6">
              <Key className="w-5 h-5 text-rose-600" />
              <h2 className="text-2xl serif-display text-rose-100">AI Vault</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-rose-900 ml-1">Select Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(AIProvider)
                    .filter(p => p !== AIProvider.GEMINI) // Guidelines: Do not provide UI for entering or managing the Gemini API key.
                    .map(p => (
                    <button 
                      key={p} 
                      onClick={() => setForm({ ...form, provider: p })}
                      className={`py-2.5 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all border flex flex-col items-center gap-1 ${form.provider === p ? 'bg-rose-800 text-white border-rose-600' : 'bg-black/40 text-rose-900 border-rose-950/20'}`}
                    >
                      {p}
                      {isKeyAvailable(p) && <CheckCircle className="w-2 h-2 text-green-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-rose-900 ml-1">Key for {form.provider}</label>
                <div className="relative">
                  <input 
                    type={showKey[form.provider] ? 'text' : 'password'}
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    className="w-full bg-black/40 border border-rose-950/40 rounded-xl px-6 py-4 text-[11px] text-rose-100 focus:border-rose-700/50 outline-none"
                    placeholder={`Enter ${form.provider} API key...`}
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
                Vault Key
              </button>
            </div>

            <div className="space-y-4 pt-6 border-t border-rose-900/10">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-rose-700">Configured Node Access</h3>
              <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                {secrets.filter(s => s.provider !== AIProvider.GEMINI).length === 0 ? (
                  <p className="text-[10px] italic text-rose-950">No external keys in vault. Gemini is auto-managed.</p>
                ) : (
                  secrets.filter(s => s.provider !== AIProvider.GEMINI).map(s => (
                    <div key={s.provider} className="flex flex-col p-4 bg-black/20 rounded-2xl border border-rose-950/20 gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-rose-100 uppercase tracking-widest">{s.provider}</span>
                          <span className="text-[7px] text-rose-900 font-mono tracking-tighter">Vaulted: ...{s.lastFour}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteSecret(s.provider)}
                          className="p-1.5 text-rose-950 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-2.5 h-2.5 ${getStaleStatus(s.updatedAt)}`} />
                        <span className={`text-[7px] font-black uppercase tracking-widest ${getStaleStatus(s.updatedAt)}`}>
                          Last Rotated: {formatDate(s.updatedAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="lg" className="rounded-[3rem] space-y-10">
            <div className="flex items-center gap-4 border-b border-rose-900/10 pb-6">
              <Database className="w-5 h-5 text-rose-600" />
              <h2 className="text-2xl serif-display text-rose-100">Intelligence Index</h2>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><Database className="w-3 h-3 text-rose-800" /><span className="text-[9px] font-black uppercase tracking-widest text-rose-200">Total Models</span></div>
                  <span className="text-[9px] font-mono text-rose-900">{DEFAULT_MODELS.length} nodes</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><Hash className="w-3 h-3 text-rose-800" /><span className="text-[9px] font-black uppercase tracking-widest text-rose-200">Behavioral Rules</span></div>
                  <span className="text-[9px] font-mono text-rose-900">{STATIC_TAGS.length} tags</span>
               </div>
            </div>
            <p className="text-[11px] italic text-rose-200/50 leading-relaxed font-serif">Models are platform-agnostic. Vault keys to enable them in the Forge Studio.</p>
            
            <div className="space-y-4">
              <button 
                onClick={handleSyncRegistry}
                disabled={isLoading}
                className="w-full py-6 bg-rose-950/40 border border-rose-900/30 text-rose-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex flex-col items-center justify-center gap-3 hover:bg-rose-900/20 transition-all group"
              >
                <div className="relative">
                  <RefreshCw className={`w-10 h-10 transition-all duration-700 ${isLoading ? 'animate-architect-spin' : 'group-hover:rotate-180'}`} />
                </div>
                <span className="mt-2">Re-Sync Creative Axis</span>
              </button>

              <button 
                onClick={() => setShowSchema(!showSchema)}
                className="w-full py-4 bg-black/40 border border-rose-950/20 text-rose-900 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:text-rose-500 hover:border-rose-900/40 transition-all"
              >
                <Code className="w-3 h-3" />
                {showSchema ? 'Hide Database Blueprint' : 'View Database Blueprint'}
                <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${showSchema ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {showSchema && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-rose-900 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                  <textarea 
                    readOnly
                    className="relative w-full h-[200px] bg-black/60 border border-rose-950/40 rounded-xl p-4 font-mono text-[9px] text-rose-300/60 custom-scrollbar focus:ring-0"
                    value={SCHEMA_SQL}
                  />
                  <div className="absolute top-2 right-4 flex gap-2">
                    <span className="text-[7px] font-black uppercase tracking-widest text-rose-900/40">Read-Only View</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4 p-6 bg-amber-950/10 border border-amber-900/20 rounded-2xl">
              <Shield className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="space-y-1">
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">End-to-End Encryption</span>
                <p className="text-[9px] text-amber-900 leading-normal italic">AES-GCM 256-bit encryption. Rotation warning at 30 days keeps your axis secure.</p>
              </div>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
};
