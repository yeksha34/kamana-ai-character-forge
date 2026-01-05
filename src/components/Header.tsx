import { LanguageToggle } from './LanguageToggle';
import { MorphingText } from './MorphingText';
import { User, Theme } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { 
  ChevronDown, Flame, Grid, Heart, LogOut, 
  ShieldCheck, PenTool, Settings, Sparkles, 
  Ghost, Skull, Menu, X 
} from 'lucide-react';
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
  const { language, setLanguage, isGlobalNSFW, toggleGlobalNSFW, t, theme, setTheme } = useAppContext();
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Close mobile menu on navigation
  const handleMobileNav = (route: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(route);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] art-glass border-b border-rose-950/20 px-4 md:px-16 py-3 md:py-4 flex items-center justify-between transition-all duration-500">
        <div className="flex items-center gap-4 md:gap-12">
          <div className="flex items-center gap-3 md:gap-8 group">
            <div className="relative cursor-pointer transition-transform duration-700 hover:rotate-12" onClick={() => onNavigate('#/studio/new')}>
              <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-tr from-rose-950 to-rose-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.3)]">
                <Flame className="text-white w-5 h-5 md:w-7 md:h-7 animate-icon-glow" />
              </div>
            </div>
            <MorphingText language={language} value={"desire"} english="Desire" className="text-xl md:text-3xl serif-display leading-none glow-text tracking-tighter hidden xs:flex" />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-8">
          {/* Desktop Only Navigation */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="theme-pill">
              <button onClick={() => setTheme(Theme.SOFTCORE)} className={`theme-pill-item flex items-center gap-1.5 ${theme === Theme.SOFTCORE ? 'active' : ''}`}>
                <Sparkles className="w-2.5 h-2.5" />
                <span>{t.themes[Theme.SOFTCORE]}</span>
              </button>
              <button onClick={() => setTheme(Theme.DEFAULT)} className={`theme-pill-item flex items-center gap-1.5 ${theme === Theme.DEFAULT ? 'active' : ''}`}>
                <Ghost className="w-2.5 h-2.5" />
                <span>{t.themes[Theme.DEFAULT]}</span>
              </button>
              <button onClick={() => setTheme(Theme.HARDCORE)} className={`theme-pill-item flex items-center gap-1.5 ${theme === Theme.HARDCORE ? 'active' : ''}`}>
                <Skull className="w-2.5 h-2.5" />
                <span>{t.themes[Theme.HARDCORE]}</span>
              </button>
            </div>

            <LanguageToggle current={language} onChange={setLanguage} />

            <button onClick={toggleGlobalNSFW} className="flex items-center gap-3 px-5 py-2.5 bg-rose-950/20 border border-rose-900/20 rounded-full hover:bg-rose-900/40 transition-all group">
              <Heart className={`w-4 h-4 transition-all duration-700 ${isGlobalNSFW ? 'text-rose-600 fill-rose-600 animate-icon-heartbeat' : 'text-rose-950'}`} />
              <MorphingText language={language} value={isGlobalNSFW ? "nsfw" : "sfw"} english={isGlobalNSFW ? "NSFW" : "SFW"} className="text-[10px] font-black uppercase tracking-widest text-rose-100" />
            </button>

            <button onClick={() => onNavigate(isAtMuseum ? '#/studio/new' : '#/museum')} className="flex items-center gap-3 px-5 py-2.5 bg-rose-950/20 border border-rose-900/20 rounded-full hover:bg-rose-900/40 transition-all group">
              {isAtMuseum ? <PenTool className="w-4 h-4 text-rose-500" /> : <Grid className="w-4 h-4 text-rose-500" />}
              <MorphingText language={language} value={isAtMuseum ? "studio" : "museum"} english={isAtMuseum ? "Studio" : "Gallery"} className="text-[10px] font-black tracking-widest uppercase text-rose-100" />
            </button>
          </div>

          <div className="h-8 md:h-10 w-[1px] bg-rose-950/20 hidden lg:block" />

          {/* User Profile Dropdown & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 md:gap-6">
            {user && (
              <div className="flex items-center gap-3 md:gap-6 relative" ref={dropdownRef}>
                <div className="flex flex-col text-right cursor-pointer group/user" onClick={() => setIsPlanOpen(!isPlanOpen)}>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[8px] md:text-[10px] font-black tracking-widest text-rose-100 uppercase leading-none group-hover/user:text-rose-500 transition-colors truncate max-w-[80px] md:max-w-none">
                      {user.name}
                    </span>
                    <ChevronDown className={`w-2.5 h-2.5 md:w-3 md:h-3 text-rose-900 transition-transform duration-500 ${isPlanOpen ? 'rotate-180 text-rose-500' : ''}`} />
                  </div>
                </div>

                {isPlanOpen && (
                  <div className="absolute top-full right-0 mt-4 md:mt-6 w-56 md:w-64 art-glass rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border border-rose-900/30 shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-500 z-[110]">
                    <div className="space-y-4">
                      <button onClick={() => { onNavigate('#/settings'); setIsPlanOpen(false); }} className="w-full py-2.5 md:py-3 bg-rose-950/40 text-rose-100 border border-rose-900/20 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-rose-900/40 transition-all group/settings">
                        <Settings className="w-3 h-3 group-hover/settings:rotate-180 transition-transform duration-700" />
                        Settings
                      </button>
                      <button onClick={onSignOut} className="w-full py-2.5 md:py-3 bg-black/40 text-rose-900 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:text-rose-400 transition-all group/logout">
                        <LogOut className="w-3 h-3 group-hover/logout:-translate-x-1 transition-transform" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="lg:hidden p-2 rounded-full bg-rose-950/20 text-rose-500 border border-rose-900/20"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden bg-black/60 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="h-full pt-28 pb-12 px-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-rose-900 uppercase tracking-[0.4em] block ml-4">Creative Theme</span>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setTheme(Theme.SOFTCORE)} className={`flex items-center justify-between px-6 py-5 rounded-2xl border transition-all ${theme === Theme.SOFTCORE ? 'bg-rose-600 border-rose-500 text-white shadow-xl' : 'bg-rose-950/20 border-rose-900/20 text-rose-100'}`}>
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-bold uppercase tracking-widest">{t.themes[Theme.SOFTCORE]}</span>
                    </div>
                  </button>
                  <button onClick={() => setTheme(Theme.DEFAULT)} className={`flex items-center justify-between px-6 py-5 rounded-2xl border transition-all ${theme === Theme.DEFAULT ? 'bg-rose-600 border-rose-500 text-white shadow-xl' : 'bg-rose-950/20 border-rose-900/20 text-rose-100'}`}>
                    <div className="flex items-center gap-3">
                      <Ghost className="w-4 h-4" />
                      <span className="text-sm font-bold uppercase tracking-widest">{t.themes[Theme.DEFAULT]}</span>
                    </div>
                  </button>
                  <button onClick={() => setTheme(Theme.HARDCORE)} className={`flex items-center justify-between px-6 py-5 rounded-2xl border transition-all ${theme === Theme.HARDCORE ? 'bg-rose-600 border-rose-500 text-white shadow-xl' : 'bg-rose-950/20 border-rose-900/20 text-rose-100'}`}>
                    <div className="flex items-center gap-3">
                      <Skull className="w-4 h-4" />
                      <span className="text-sm font-bold uppercase tracking-widest">{t.themes[Theme.HARDCORE]}</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-black text-rose-900 uppercase tracking-[0.4em] block ml-4">Localization & Filters</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-center bg-rose-950/20 rounded-2xl border border-rose-900/20 p-2">
                    <LanguageToggle current={language} onChange={setLanguage} />
                  </div>
                  <button onClick={toggleGlobalNSFW} className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${isGlobalNSFW ? 'bg-rose-950/40 border-rose-600 shadow-inner' : 'bg-rose-950/20 border-rose-900/20'}`}>
                    <Heart className={`w-5 h-5 ${isGlobalNSFW ? 'text-rose-600 fill-rose-600 animate-icon-heartbeat' : 'text-rose-950'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-100">{isGlobalNSFW ? "NSFW ON" : "SFW ONLY"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-black text-rose-900 uppercase tracking-[0.4em] block ml-4">Navigation</span>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => handleMobileNav(isAtMuseum ? '#/studio/new' : '#/museum')} className="flex items-center gap-4 px-6 py-5 bg-rose-950/40 border border-rose-900/20 rounded-2xl text-rose-100">
                    {isAtMuseum ? <PenTool className="w-5 h-5 text-rose-500" /> : <Grid className="w-5 h-5 text-rose-500" />}
                    <span className="text-sm font-bold uppercase tracking-widest">{isAtMuseum ? "Enter Studio" : "Open Gallery"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-rose-950/30">
               <div className="flex items-center gap-4 px-4">
                  <div className="w-12 h-12 rounded-full bg-rose-950 flex items-center justify-center text-rose-500 border border-rose-900/20">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-rose-100 uppercase tracking-widest block">{user?.name}</span>
                    <span className="text-[8px] font-bold text-rose-800 uppercase tracking-[0.2em]">Architect Domain</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};