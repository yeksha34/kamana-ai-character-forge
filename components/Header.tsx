
import React from 'react';
import { Flame, Grid, LogOut, Heart } from 'lucide-react';
import { MorphingText } from './MorphingText';
import { LanguageToggle } from './LanguageToggle';
import { User } from '../types';
import { Language, translations } from '../i18n/translations';

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
  user, isNSFW, onToggleNSFW, onNavigate, onSignOut, language, onLanguageChange 
}) => {
  const t = translations[language];

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] art-glass border-b border-rose-950/20 px-8 py-4 md:px-16 flex items-center justify-between">
      <div className="flex items-center gap-8 group">
        <div className="relative cursor-pointer transition-transform duration-700 hover:rotate-12" onClick={() => onNavigate('#/login')}>
          <div className="w-16 h-16 bg-gradient-to-tr from-rose-950 to-rose-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.3)]">
            <Flame className="text-white w-8 h-8" />
          </div>
        </div>
        <MorphingText options={t.morphing.desire} english="Desire" className="text-4xl serif-display leading-none glow-text tracking-tighter" />
      </div>

      <div className="flex items-center gap-10">
        <LanguageToggle current={language} onChange={onLanguageChange} />
        
        <button onClick={() => onNavigate('#/museum')} className="flex flex-col items-center gap-1 px-8 py-2.5 rounded-full hover:bg-rose-900/10 transition-all text-rose-950 hover:text-rose-500">
           <Grid className="w-5 h-5" />
           <span className="text-[8px] font-black tracking-widest uppercase">{t.museum}</span>
        </button>
        
        <div className="h-10 w-[1px] bg-rose-950/20" />

        {user && (
          <div className="flex items-center gap-6">
             <div className="flex flex-col text-right">
                <span className="text-[10px] font-black tracking-widest text-rose-100 uppercase">{user.name}</span>
             </div>
             <button onClick={onSignOut} className="p-3 bg-rose-950/30 text-rose-950 hover:text-rose-500 rounded-full transition-all">
               <LogOut className="w-4 h-4" />
             </button>
          </div>
        )}

        <div className="flex items-center gap-4 px-6 py-2.5 bg-black/40 border border-rose-900/10 rounded-full group/nsfw transition-all hover:border-rose-700/40">
          <Heart className={`w-5 h-5 transition-all duration-700 ${isNSFW ? 'text-rose-600 fill-rose-600 scale-125' : 'text-rose-950'}`} />
          <button onClick={onToggleNSFW} className={`w-12 h-6 rounded-full relative transition-all ${isNSFW ? 'bg-rose-800' : 'bg-rose-950/40'}`}>
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-500 ${isNSFW ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
