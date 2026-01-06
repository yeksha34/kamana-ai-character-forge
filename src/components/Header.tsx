import React, { useEffect, useRef, useState } from 'react';
import { LanguageToggle } from './LanguageToggle';
import { User, Theme } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { 
  ChevronDown, Flame, Grid, Heart, LogOut, 
  Settings, Sparkles, Ghost, Skull, Menu, X, PenTool
} from 'lucide-react';
import { useViewport } from '../hooks/useViewport';

interface HeaderProps {
  user: User | null;
  onNavigate: (route: string) => void;
  onSignOut: () => void;
  currentRoute: string;
}

export const Header: React.FC<HeaderProps> = ({ user, onNavigate, onSignOut, currentRoute }) => {
  const { isMobile } = useViewport();
  const { language, setLanguage, isGlobalNSFW, toggleGlobalNSFW, theme, setTheme } = useAppContext();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNav = (route: string) => {
    onNavigate(route);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-black border-b border-rose-950/30 px-6 lg:px-12 py-4 flex items-center justify-between select-none">
      <div className="flex items-center gap-6 lg:gap-12">
        <div onClick={() => handleNav('#/studio/new')} className="flex items-center gap-4 cursor-pointer group">
          <div className="w-10 h-10 bg-rose-600 rounded-lg flex items-center justify-center shadow-lg shadow-rose-600/20 group-hover:scale-105 transition-transform">
            <Flame className="text-white w-5 h-5" />
          </div>
          <span className="text-xl serif-display italic text-rose-50 font-medium hidden sm:block">कामना</span>
        </div>

        <div className="flex items-center gap-6 lg:gap-10 h-11 border-l border-rose-950/20 pl-6 lg:pl-10">
          <button onClick={() => handleNav('#/studio/new')} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all relative py-2 ${currentRoute.includes('studio') ? 'text-rose-500' : 'text-rose-100/40 hover:text-rose-100'}`}>
            Studio
            {currentRoute.includes('studio') && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />}
          </button>
          <button onClick={() => handleNav('#/museum')} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all relative py-2 ${currentRoute === '#/museum' ? 'text-rose-500' : 'text-rose-100/40 hover:text-rose-100'}`}>
            Gallery
            {currentRoute === '#/museum' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-8">
        {!isMobile && (
          <div className="flex items-center gap-6 pr-6 border-r border-rose-950/20">
            <div className="theme-pill">
              <button onClick={() => setTheme(Theme.SOFTCORE)} className={`theme-pill-item ${theme === Theme.SOFTCORE ? 'active' : ''}`}><Sparkles className="w-3 h-3" /></button>
              <button onClick={() => setTheme(Theme.DEFAULT)} className={`theme-pill-item ${theme === Theme.DEFAULT ? 'active' : ''}`}><Ghost className="w-3 h-3" /></button>
              <button onClick={() => setTheme(Theme.HARDCORE)} className={`theme-pill-item ${theme === Theme.HARDCORE ? 'active' : ''}`}><Skull className="w-3 h-3" /></button>
            </div>
            <button onClick={toggleGlobalNSFW} className={`p-2.5 rounded-full border transition-all ${isGlobalNSFW ? 'bg-rose-600/10 border-rose-500/50 text-rose-500' : 'border-rose-900/20 text-rose-900 hover:text-rose-100'}`}>
              <Heart className={`w-4 h-4 ${isGlobalNSFW ? 'fill-current animate-icon-heartbeat' : ''}`} />
            </button>
            <LanguageToggle current={language} onChange={setLanguage} />
          </div>
        )}

        {user && (
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-4 hover:opacity-80 transition-opacity outline-none">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest">{user.name}</span>
                <span className="text-[7px] text-rose-900 font-black uppercase tracking-[0.3em]">Architect</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-rose-950/30 border border-rose-900/20 flex items-center justify-center">
                <ChevronDown className={`w-3 h-3 text-rose-900 transition-transform ${isUserMenuOpen ? 'rotate-180 text-rose-500' : ''}`} />
              </div>
            </button>
            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-4 w-56 bg-black border border-rose-900/30 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
                <button onClick={() => handleNav('#/settings')} className="w-full flex items-center gap-4 p-4 text-[10px] font-black uppercase text-rose-100 hover:bg-rose-950/40 rounded-xl transition-all"><Settings className="w-4 h-4 text-rose-500" /> Settings</button>
                <div className="h-px bg-rose-950/20 my-1" />
                <button onClick={onSignOut} className="w-full flex items-center gap-4 p-4 text-[10px] font-black uppercase text-rose-600 hover:bg-rose-950/40 rounded-xl transition-all"><LogOut className="w-4 h-4" /> Terminate</button>
              </div>
            )}
          </div>
        )}

        {isMobile && (
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-rose-500 active:scale-90 transition-transform">
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        )}
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[65px] z-[90] bg-black/98 backdrop-blur-3xl animate-in fade-in duration-300 flex flex-col p-8 space-y-12">
          <div className="space-y-4">
            <span className="text-[10px] font-black text-rose-900 uppercase tracking-[0.5em] block ml-2">Axis Menu</span>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => handleNav('#/studio/new')} className="flex items-center gap-5 p-6 bg-rose-950/10 border border-rose-900/20 rounded-2xl text-rose-100 font-bold uppercase text-xs tracking-widest"><PenTool className="w-6 h-6 text-rose-500" /> Studio</button>
              <button onClick={() => handleNav('#/museum')} className="flex items-center gap-5 p-6 bg-rose-950/10 border border-rose-900/20 rounded-2xl text-rose-100 font-bold uppercase text-xs tracking-widest"><Grid className="w-6 h-6 text-rose-500" /> Gallery</button>
            </div>
          </div>
          <div className="space-y-4">
             <span className="text-[10px] font-black text-rose-900 uppercase tracking-[0.5em] block ml-2">Preferences</span>
             <button onClick={toggleGlobalNSFW} className={`w-full flex items-center justify-center gap-4 p-5 rounded-2xl border ${isGlobalNSFW ? 'bg-rose-600 text-white' : 'bg-black text-rose-950 border-rose-900/20'}`}>
                <Heart className="w-5 h-5" /> {isGlobalNSFW ? 'NSFW ACTIVE' : 'SFW ONLY'}
             </button>
             <div className="flex justify-center"><LanguageToggle current={language} onChange={setLanguage} /></div>
          </div>
          <div className="pt-10 border-t border-rose-950/30 flex flex-col gap-4">
             <button onClick={() => handleNav('#/settings')} className="flex items-center gap-5 text-rose-100/40 font-black uppercase text-[11px] tracking-[0.4em] p-4"><Settings className="w-6 h-6" /> Architect Settings</button>
             <button onClick={onSignOut} className="flex items-center gap-5 text-rose-600 font-black uppercase text-[11px] tracking-[0.4em] p-4"><LogOut className="w-6 h-6" /> Terminate Session</button>
          </div>
        </div>
      )}
    </nav>
  );
};