import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { AIProvider, AISecret } from '../types';
import { saveUserSecret, fetchUserSecrets, deleteUserSecret } from '../services/supabaseDatabaseService';
import { MigrationService } from '../services/migrationService';
import { SCHEMA_SQL } from '../data/schemaSql';
import { encryptSecret } from '../utils/encryption';
import { GlassCard } from '../components/ui/GlassCard';
import { DisplayTitle } from '../components/ui/DisplayTitle';
import { Key, Database, RefreshCw, Save, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useViewport } from '../hooks/useViewport';

export const SettingsView: React.FC<{ onNavigate?: (route: string) => void }> = ({ onNavigate }) => {
  const { isMobile } = useViewport();
  const { user } = useAuth();
  const { refreshSecrets, refreshModels, refreshTags } = useAppContext();
  const [secrets, setSecrets] = useState<AISecret[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ provider: AIProvider.CLAUDE, key: '' });

  useEffect(() => { if (user) loadSecrets(); }, [user]);

  const loadSecrets = async () => {
    if (!user) return;
    const data = await fetchUserSecrets(user.id);
    setSecrets(data);
    await refreshSecrets();
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
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleDeleteSecret = async (provider: AIProvider) => {
    if (!user || !confirm(`Purge ${provider} from vault?`)) return;
    await deleteUserSecret(user.id, provider);
    await loadSecrets();
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await MigrationService.forceSyncRegistry();
      await refreshModels();
      await refreshTags();
      alert("Creative Axis Synchronized.");
    } finally { setIsLoading(false); }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 ${isMobile ? 'pt-24 px-6 pb-40' : 'pt-48 px-16 pb-64'}`}>
      <div className="max-w-6xl w-full space-y-12">
        <div className="flex items-center justify-between border-b border-rose-950/20 pb-10">
          <DisplayTitle marathi="संरचना" english="Architect Settings" size={isMobile ? 'sm' : 'md'} />
          <button onClick={() => onNavigate?.('#/studio/new')} className="flex items-center gap-3 px-6 py-3 bg-rose-950/20 border border-rose-900/20 rounded-full text-[9px] font-black uppercase tracking-widest text-rose-500 shadow-lg active:scale-95"><ArrowLeft className="w-4 h-4" /> Return</button>
        </div>

        <section className={`grid gap-10 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <GlassCard padding="lg" className="rounded-[3rem] space-y-8 border-rose-900/30">
            <div className="flex items-center gap-4 border-b border-rose-950/10 pb-6 text-rose-100 uppercase tracking-widest font-black text-sm"><Key className="w-5 h-5 text-rose-600" /> Secret Vault</div>
            <div className="space-y-6">
               <div className="grid grid-cols-3 gap-2">
                 {[AIProvider.CLAUDE, AIProvider.OPENAI, AIProvider.GROQ, AIProvider.MISTRAL, AIProvider.TOGETHER, AIProvider.STABILITY].map(p => (
                   <button key={p} onClick={() => setForm({ ...form, provider: p })} className={`py-3 rounded-xl text-[7px] font-black uppercase transition-all border ${form.provider === p ? 'bg-rose-700 text-white border-rose-500' : 'bg-black/40 text-rose-900 border-rose-950/20'}`}>{p}</button>
                 ))}
               </div>
               <div className="relative">
                 <input type={showKey[form.provider] ? 'text' : 'password'} value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className="w-full bg-black/60 border border-rose-950/40 rounded-2xl px-6 py-4 text-xs text-rose-100 outline-none" placeholder={`Enter ${form.provider} API key...`} />
                 <button onClick={() => setShowKey({ ...showKey, [form.provider]: !showKey[form.provider] })} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-900">{showKey[form.provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
               </div>
               <button onClick={handleSaveSecret} disabled={isLoading || !form.key} className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20"><Save className="w-4 h-4" /> Vault Secret</button>
            </div>
            <div className="space-y-3 pt-6 border-t border-rose-900/10 max-h-[250px] overflow-y-auto custom-scrollbar">
              {secrets.filter(s => s.provider !== AIProvider.GEMINI).map(s => (
                <div key={s.provider} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-rose-950/20">
                  <div className="flex flex-col"><span className="text-[9px] font-bold text-rose-200 uppercase">{s.provider}</span><span className="text-[7px] text-rose-900 tracking-widest">...{s.lastFour}</span></div>
                  <button onClick={() => handleDeleteSecret(s.provider)} className="p-2 text-rose-950 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-10">
            <GlassCard padding="lg" className="rounded-[3rem] border-rose-900/30">
              <div className="flex items-center gap-4 border-b border-rose-950/10 pb-6 text-rose-100 uppercase tracking-widest font-black text-sm"><Database className="w-5 h-5 text-rose-600" /> System Axis</div>
              <div className="space-y-6">
                <button onClick={handleSync} disabled={isLoading} className="w-full py-8 bg-rose-950/20 border border-rose-900/30 text-rose-500 rounded-3xl flex flex-col items-center gap-4 hover:bg-rose-900/30 transition-all active:scale-95">
                  <RefreshCw className={`w-8 h-8 ${isLoading ? 'animate-spin' : ''}`} /> <span className="text-[10px] font-black uppercase tracking-[0.4em]">Resync Registries</span>
                </button>
                <button onClick={() => setShowSchema(!showSchema)} className="w-full p-4 bg-black/40 border border-rose-950/20 text-rose-900 rounded-2xl text-[8px] font-black uppercase tracking-widest">Inspect Master Schema</button>
              </div>
            </GlassCard>
            {showSchema && <textarea readOnly className="w-full h-48 bg-black/60 border border-rose-950/40 rounded-2xl p-4 font-mono text-[8px] text-rose-300/40 animate-in fade-in" value={SCHEMA_SQL} />}
          </div>
        </section>
      </div>
    </div>
  );
};