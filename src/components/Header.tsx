
import { LanguageToggle } from './LanguageToggle';
import { MorphingText } from './MorphingText';
import { User } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { ChevronDown, Flame, Grid, Heart, LogOut, ShieldCheck, PenTool, Settings } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface HeaderProps {
  user: User | null;
  onNavigate: (route: string) => void;
  onSignOut: () => void;
  currentRoute: string;
}

export const Header: React.FC<HeaderProps> = ({
  user, onNavigate, onSignOut, currentRoute
}) => {
  const { language, setLanguage, isGlobalNSFW, toggleGlobalNSFW, t } = useAppContext();
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAtMuseum = currentRoute === '#/museum';

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
          <div className="relative cursor-pointer transition-transform duration-700 hover:rotate-12" onClick={() => onNavigate('#/studio/new')}>
            <div className="w-14 h-14 bg-gradient-to-tr from-rose-950 to-rose-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.3)]">
              <Flame className="text-white w-7 h-7" />
            </div>
          </div>
          <MorphingText language={language} value={"desire"} english="Desire" className="text-3xl serif-display leading-none glow-text tracking-tighter" />
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <LanguageToggle current={language} onChange={setLanguage} />

          <button 
            onClick={toggleGlobalNSFW}
            className="flex items-center gap-3 px-5 py-2.5 bg-rose-950/20 border border-rose-900/20 rounded-full hover:bg-rose-900/40 transition-all group"
          >
            <Heart className={`w-4 h-4 transition-all duration-700 ${isGlobalNSFW ? 'text-rose-600 fill-rose-600' : 'text-rose-950'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-100">
              {isGlobalNSFW ? 'NSFW' : 'SFW'}
            </span>
          </button>

          <button 
            onClick={() => onNavigate(isAtMuseum ? '#/studio/new' : '#/museum')} 
            className="flex items-center gap-3 px-5 py-2.5 bg-rose-950/20 border border-rose-900/20 rounded-full hover:bg-rose-900/40 transition-all group"
          >
            {isAtMuseum ? <PenTool className="w-4 h-4 text-rose-500" /> : <Grid className="w-4 h-4 text-rose-500" />}
            <span className="text-[10px] font-black tracking-widest uppercase text-rose-100">
              {isAtMuseum ? t.studio : t.museum}
            </span>
          </button>
        </div>

        <div className="h-10 w-[1px] bg-rose-950/20 hidden sm:block" />

        {user && (
          <div className="flex items-center gap-6 relative" ref={dropdownRef}>
            <div
              className="flex flex-col text-right cursor-pointer group/user flex"
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
                Architect
              </span>
            </div>

            {isPlanOpen && (
              <div className="absolute top-full right-0 mt-6 w-72 art-glass rounded-[2rem] p-6 border border-rose-900/30 shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-500 z-[110]">
                <div className="space-y-6">
                  <div className="pb-4 border-b border-rose-950/30">
                    <div className="flex items-center gap-3 mb-2">
                      <ShieldCheck className="w-4 h-4 text-rose-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-100">System Preferences</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button 
                      onClick={() => { onNavigate('#/settings'); setIsPlanOpen(false); }}
                      className="w-full py-3 bg-rose-950/40 text-rose-100 border border-rose-900/20 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-rose-900/40 transition-all"
                    >
                      <Settings className="w-3 h-3" />
                      Global Settings
                    </button>
                    <button onClick={onSignOut} className="w-full py-3 bg-black/40 text-rose-900 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:text-rose-400 transition-all">
                      <LogOut className="w-3 h-3" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
