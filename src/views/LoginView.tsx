
import { Language, translations } from '../i18n/translations';
import { GlassCard } from '../components/ui/GlassCard';
import { DisplayTitle } from '../components/ui/DisplayTitle';
import { Fingerprint, Flame, Github, RefreshCw, ShieldAlert, Terminal, Zap } from 'lucide-react';
import React from 'react';

interface LoginViewProps {
  onSignIn: () => void;
  isLoggingIn: boolean;
  language: Language;
  isDevelopmentBypass: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ 
  onSignIn, 
  isLoggingIn, 
  language,
  isDevelopmentBypass 
}) => {
  const t = translations[language];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-rose-950/20 to-black pointer-events-none" />
      <div className="aura-blob bg-rose-600 top-[-20%] left-[-10%] opacity-5" />
      <div className="aura-blob bg-rose-950 bottom-[-20%] right-[-10%] opacity-5" />
      
      <GlassCard padding="xl" className="max-w-xl w-full rounded-[4rem] text-center space-y-16 border-rose-900/30 relative z-10 shadow-[0_0_150px_rgba(225,29,72,0.15)] animate-in fade-in zoom-in duration-1000">
        <div className="space-y-8">
           <div className="w-28 h-28 bg-gradient-to-tr from-rose-950 to-rose-600 rounded-full mx-auto flex items-center justify-center shadow-[0_0_60px_rgba(225,29,72,0.4)] transform hover:rotate-12 transition-transform duration-700">
              <Flame className="w-14 h-14 text-white" />
           </div>
           <DisplayTitle marathi={t.appTitle} english={t.appSubtitle} size="xl" />
        </div>

        <div className="space-y-12">
          {isDevelopmentBypass && (
            <div className="px-6 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full inline-flex items-center gap-3 animate-pulse">
              <Terminal className="w-3 h-3 text-rose-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500">
                Local Development Mode Active
              </span>
            </div>
          )}

          <div className="space-y-6">
            <p className="text-xl serif-display italic text-rose-200/70 leading-relaxed px-4">
              {t.morphing.canvas[0]}
            </p>
            <div className="flex flex-col gap-2 items-center">
              <span className="text-rose-900 font-black text-[9px] uppercase tracking-[0.5em]">{t.ageRestriction}</span>
              <div className="flex gap-2 text-rose-600/50">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Age Restricted Platform</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 items-center">
            <button 
              onClick={onSignIn} 
              disabled={isLoggingIn}
              className={`group flex items-center gap-6 px-16 py-7 rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95 disabled:opacity-50 ${
                isDevelopmentBypass 
                ? 'bg-rose-800 text-white hover:bg-rose-700' 
                : 'bg-white text-rose-950 hover:bg-rose-50'
              }`}
            >
              {isLoggingIn ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                isDevelopmentBypass 
                ? <Zap className="w-6 h-6 group-hover:scale-110 transition-transform fill-white/20" />
                : <Github className="w-6 h-6 group-hover:scale-110 transition-transform" />
              )}
              {isDevelopmentBypass ? 'Enter Studio (Dev)' : t.githubSignIn}
            </button>
            
            <div className="pt-4 flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
               <Fingerprint className="w-6 h-6 text-rose-900" />
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-rose-950">{t.biometric}</p>
            </div>
          </div>
        </div>
      </GlassCard>
      
      <footer className="absolute bottom-12 text-rose-950/20 font-black text-[9px] uppercase tracking-[1em]">
        © २०२५ {t.appTitle} आर्ट स्टुडिओ
      </footer>
    </div>
  );
};
