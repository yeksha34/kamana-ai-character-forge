
import { Language, translations } from '@/i18n/translations';
import { Fingerprint, Flame, Github, RefreshCw, ShieldAlert } from 'lucide-react';
import React from 'react';

interface LoginViewProps {
  onSignIn: () => void;
  isLoggingIn: boolean;
  language: Language;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSignIn, isLoggingIn, language }) => {
  const t = translations[language];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-rose-950/20 to-black pointer-events-none" />
      <div className="aura-blob bg-rose-600 top-[-20%] left-[-10%] opacity-5" />
      <div className="aura-blob bg-rose-950 bottom-[-20%] right-[-10%] opacity-5" />
      
      <div className="max-w-xl w-full art-glass rounded-[4rem] p-16 md:p-24 text-center space-y-16 border border-rose-900/30 relative z-10 shadow-[0_0_150px_rgba(225,29,72,0.15)] animate-in fade-in zoom-in duration-1000">
        <div className="space-y-8">
           <div className="w-28 h-28 bg-gradient-to-tr from-rose-950 to-rose-600 rounded-full mx-auto flex items-center justify-center shadow-[0_0_60px_rgba(225,29,72,0.4)] transform hover:rotate-12 transition-transform duration-700">
              <Flame className="w-14 h-14 text-white" />
           </div>
           <div className="space-y-4">
            <h1 className="text-[7rem] serif-display italic text-rose-50 leading-none tracking-tighter glow-text">{t.appTitle}</h1>
            <p className="text-[11px] font-black uppercase tracking-[1em] text-rose-800">{t.appSubtitle}</p>
           </div>
        </div>

        <div className="space-y-12">
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
              className="group flex items-center gap-6 px-16 py-7 bg-white text-rose-950 rounded-full font-black text-xs uppercase tracking-[0.4em] hover:bg-rose-50 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
            >
              {isLoggingIn ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Github className="w-6 h-6 group-hover:scale-110 transition-transform" />}
              {t.githubSignIn}
            </button>
            
            <div className="pt-4 flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
               <Fingerprint className="w-6 h-6 text-rose-900" />
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-rose-950">{t.biometric}</p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="absolute bottom-12 text-rose-950/20 font-black text-[9px] uppercase tracking-[1em]">
        © २०२५ {t.appTitle} आर्ट स्टुडिओ
      </footer>
    </div>
  );
};
