
import { LanguageToggle } from '@/components/LanguageToggle';
import { MorphingText } from '@/components/MorphingText';
import { Language, translations } from '@/i18n/translations';
import { User } from '@/types';
import { Activity, ChevronDown, Flame, Grid, Heart, LogOut, ShieldCheck, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface HeaderProps {
  user: User | null;
  isNSFW: boolean;
  onToggleNSFW: () => void;
  onNavigate: (route: string) => void;
  onSignOut: () => void;
  language: Language;
  onLanguageChange: (l: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user, isNSFW, onToggleNSFW, onNavigate, onSignOut, language = 'mr', onLanguageChange
}) => {
  const t = translations[language];
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPlanOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] art-glass border-b border-rose-950/20 px-8 py-4 md:px-16 flex items-center justify-between">
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-8 group">
          <div className="relative cursor-pointer transition-transform duration-700 hover:rotate-12" onClick={() => onNavigate('#/login')}>
            <div className="w-16 h-16 bg-gradient-to-tr from-rose-950 to-rose-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.3)]">
              <Flame className="text-white w-8 h-8" />
            </div>
          </div>
          <MorphingText language={language} value={"desire"} english="Desire" className="text-4xl serif-display leading-none glow-text tracking-tighter" />
        </div>

        <div className="h-8 w-[1px] bg-rose-950/20 hidden lg:block" />

        <div className="flex items-center gap-4 px-6 py-2.5 bg-black/20 border border-rose-900/10 rounded-full group/nsfw transition-all hover:border-rose-700/40">
          <Heart className={`w-4 h-4 transition-all duration-700 ${isNSFW ? 'text-rose-600 fill-rose-600 scale-125' : 'text-rose-950'}`} />
          <div className="flex flex-col -mt-0.5">
            <span className={`text-[7px] font-black uppercase tracking-[0.3em] mb-1.5 transition-colors ${isNSFW ? 'text-rose-500' : 'text-rose-900'}`}>
              {isNSFW ? 'NSFW Mode' : 'SFW Mode'}
            </span>
            <button onClick={onToggleNSFW} className={`w-9 h-4.5 rounded-full relative transition-all ${isNSFW ? 'bg-rose-800' : 'bg-rose-950/40'}`}>
              <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform duration-500 ${isNSFW ? 'translate-x-4.5' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-10">
        <div className="flex items-center gap-6">
          <LanguageToggle current={language} onChange={onLanguageChange} />

          <button onClick={() => onNavigate('#/museum')} className="flex flex-col items-center gap-1 px-6 py-2.5 rounded-full hover:bg-rose-900/10 transition-all text-rose-950 hover:text-rose-500">
            <Grid className="w-5 h-5" />
            <span className="text-[8px] font-black tracking-widest uppercase">{t.museum}</span>
          </button>
        </div>

        <div className="h-10 w-[1px] bg-rose-950/20" />

        {user && (
          <div className="flex items-center gap-6 relative" ref={dropdownRef}>
            <div
              className="flex flex-col text-right cursor-pointer group/user"
              onClick={() => setIsPlanOpen(!isPlanOpen)}
            >
              <div className="flex items-center justify-end gap-2">
                <span className="text-[10px] font-black tracking-widest text-rose-100 uppercase leading-none group-hover/user:text-rose-500 transition-colors">
                  {user.name}
                </span>
                <ChevronDown className={`w-3 h-3 text-rose-900 transition-transform duration-500 ${isPlanOpen ? 'rotate-180 text-rose-500' : ''}`} />
              </div>
              <span className="text-[8px] font-bold text-rose-700/60 uppercase tracking-[0.2em] mt-2 italic flex items-center justify-end gap-1 group-hover/user:text-rose-400">
                <div className="w-1 h-1 rounded-full bg-rose-600 animate-pulse" />
                Free Tier • 15 RPM
              </span>
            </div>

            {/* Plan Dropdown Menu */}
            {isPlanOpen && (
              <div className="absolute top-full right-0 mt-6 w-72 art-glass rounded-[2rem] p-6 border border-rose-900/30 shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-500 z-[110]">
                <div className="space-y-6">
                  <div className="pb-4 border-b border-rose-950/30">
                    <div className="flex items-center gap-3 mb-2">
                      <ShieldCheck className="w-4 h-4 text-rose-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-100">Membership Status</span>
                    </div>
                    <p className="text-xl serif-display italic text-rose-400">Standard Free Tier</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-rose-900" />
                        <span className="text-[9px] font-bold text-rose-800 uppercase tracking-widest">Rate Limit</span>
                      </div>
                      <span className="text-[9px] font-black text-rose-200 uppercase tracking-widest">15 RPM</span>
                    </div>
                    <div className="w-full bg-rose-950/40 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-600 h-full w-[15%] rounded-full shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
                    </div>
                    <p className="text-[8px] font-medium text-rose-900 leading-relaxed">
                      Requests are spaced sequentially to prevent rate limiting. Sequential mode active.
                    </p>
                  </div>

                  <button className="w-full py-3 bg-rose-800 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-rose-600 transition-all shadow-xl shadow-rose-950/50">
                    <Zap className="w-3 h-3 fill-white/20" />
                    Upgrade Quota
                  </button>
                </div>
              </div>
            )}

            <button onClick={onSignOut} className="p-3 bg-rose-950/30 text-rose-950 hover:text-rose-500 rounded-full transition-all hover:bg-rose-900/50 group">
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
