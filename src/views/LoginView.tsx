import { Language, translations } from '../i18n/translations';
import { GlassCard } from '../components/ui/GlassCard';
import { DisplayTitle } from '../components/ui/DisplayTitle';
import { MorphingText } from '../components/MorphingText';
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
    <div className="h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-rose-950/20 to-black pointer-events-none" />
      <div className="aura-blob bg-rose-600 top-[-20%] left-[-10%] opacity-5" />
      <div className="aura-blob bg-rose-950 bottom-[-20%] right-[-10%] opacity-5" />
      
      <GlassCard padding="xl" className="max-w-xl w-full rounded-[2.5rem] md:rounded-[4rem] text-center space-y-6 md:space-y-16 border-rose-900/30 relative z-10 shadow-[0_0_150px_rgba(225,29,72,0.15)] animate-in fade-in zoom-in duration-1000">
        <div className="space-y-4 md:space-y-8">
           <div className="w-16 h-16 md:w-28 md:h-28 bg-gradient-to-tr from-rose-950 to-rose-600 rounded-full mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.4)] transform hover:rotate-12 transition-transform duration-700">
              <Flame className="w-8 h-8 md:w-14 md:h-14 text-white animate-icon-glow" />
           </div>
           <DisplayTitle marathi={t.appTitle} english={t.appSubtitle} size="xl" />
        </div>

        <div className="space-y-6 md:space-y-12">
          {isDevelopmentBypass && (
            <div className="px-4 md:px-6 py-1.5 md:py-2 bg-rose-500/10 border border-rose-500/20 rounded-full inline-flex items-center gap-2 md:gap-3 animate-pulse">
              <Terminal className="w-2.5 h-2.5 md:w-3 md:h-3 text-rose-500 animate-icon-wiggle" />
              <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-rose-500">
                Local Dev Mode Active
              </span>
            </div>
          )}

          <div className="space-y-4 md:space-y-6">
            <p className="text-sm md:text-xl serif-display italic text-rose-200/70 leading-relaxed px-4 hidden xs:block">
              {t.morphing.canvas[0]}
            </p>
            <div className="flex flex-col gap-1 md:gap-2 items-center">
              <span className="text-rose-900 font-black text-[7px] md:text-[9px] uppercase tracking-[0.3em] md:tracking-[0.5em]">{t.ageRestriction}</span>
              <div className="flex gap-1.5 md:gap-2 text-rose-600/50">
                <ShieldAlert className="w-3 h-3 md:w-4 md:h-4 animate-icon-float" />
                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Adults Only</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 md:gap-6 items-center">
            <button 
              onClick={onSignIn} 
              disabled={isLoggingIn}
              className={`group flex items-center gap-4 md:gap-6 px-8 md:px-16 py-4 md:py-7 rounded-full font-black transition-all shadow-2xl active:scale-95 disabled:opacity-50 overflow-hidden ${
                isDevelopmentBypass 
                ? 'bg-rose-800 text-white hover:bg-rose-700' 
                : 'bg-white text-rose-950 hover:bg-rose-50'
              }`}
            >
              {isLoggingIn ? (
                <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                isDevelopmentBypass 
                ? <Zap className="w-4 h-4 md:w-6 md:h-6 group-hover:animate-icon-wiggle transition-transform fill-white/20" />
                : <Github className="w-4 h-4 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
              )}
              <MorphingText 
                language={language} 
                value="signIn" 
                english={isDevelopmentBypass ? "Enter Studio" : "Sign In"} 
                className="text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.4em] text-left" 
              />
            </button>
            
            <div className="pt-2 md:pt-4 flex flex-col items-center gap-1 md:gap-2 opacity-30 hover:opacity-100 transition-opacity">
               <Fingerprint className="w-4 h-4 md:w-6 md:h-6 text-rose-900 animate-pulse" />
               <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-rose-950">{t.biometric}</p>
            </div>
          </div>
        </div>
      </GlassCard>
      
      <footer className="absolute bottom-6 md:bottom-12 text-rose-950/20 font-black text-[7px] md:text-[9px] uppercase tracking-[0.5em] md:tracking-[1em]">
        © २०२५ {t.appTitle}
      </footer>
    </div>
  );
};