
import { Language } from '../i18n/translations';
import { Languages } from 'lucide-react';
import React from 'react';

interface LanguageToggleProps {
  current: Language;
  onChange: (lang: Language) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ current, onChange }) => {
  const cycleLanguage = () => {
    if (current === 'mr') onChange('hi');
    else if (current === 'hi') onChange('en');
    else onChange('mr');
  };

  const getLabel = () => {
    if (current === 'mr') return 'मराठी';
    if (current === 'hi') return 'हिन्दी';
    return 'English';
  };

  return (
    <button 
      onClick={cycleLanguage}
      className="flex items-center gap-3 px-5 py-2.5 bg-rose-950/20 border border-rose-900/20 rounded-full hover:bg-rose-900/40 transition-all group"
    >
      <Languages className="w-4 h-4 text-rose-500 group-hover:rotate-12 transition-transform" />
      <span className="text-[10px] font-black uppercase tracking-widest text-rose-100">
        {getLabel()}
      </span>
    </button>
  );
};
