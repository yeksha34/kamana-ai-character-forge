
import React from 'react';
import { Languages } from 'lucide-react';
import { Language } from '../i18n/translations';

interface LanguageToggleProps {
  current: Language;
  onChange: (lang: Language) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ current, onChange }) => {
  return (
    <button 
      onClick={() => onChange(current === 'mr' ? 'en' : 'mr')}
      className="flex items-center gap-3 px-5 py-2.5 bg-rose-950/20 border border-rose-900/20 rounded-full hover:bg-rose-900/40 transition-all group"
    >
      <Languages className="w-4 h-4 text-rose-500 group-hover:rotate-12 transition-transform" />
      <span className="text-[10px] font-black uppercase tracking-widest text-rose-100">
        {current === 'mr' ? 'English' : 'मराठी'}
      </span>
    </button>
  );
};
