
import { translations } from '../i18n/translations';
import React, { useState, useEffect } from 'react';

interface MorphingTextProps {
  value: string;
  language: keyof typeof translations;
  english: string;
  className?: string;
}

export const MorphingText: React.FC<MorphingTextProps> = ({ value, language, english, className }) => {
  const t = translations[language];
  const options = t.morphing[value as keyof typeof t.morphing] || [value];
  // Start with a random index to ensure variety on every load
  const [index, setIndex] = useState(() => Math.floor(Math.random() * options.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % options.length);
    }, 4500 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, [options]);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 
        Container for the morphing text with stable width. 
        We use a grid layout where all options are technically rendered to calculate 
        the maximum width, but only one is visible.
      */}
      <div className="grid grid-cols-1 grid-rows-1 items-baseline">
        {/* Invisible shadow items to force the container to the maximum width of all options */}
        <div className="invisible h-0 overflow-hidden whitespace-nowrap col-start-1 row-start-1 pointer-events-none" aria-hidden="true">
          {options.map((opt, i) => (
            <div key={i}>{opt}</div>
          ))}
        </div>
        
        {/* The actually visible text */}
        <span className="col-start-1 row-start-1 transition-all duration-1000 ease-in-out whitespace-nowrap">
          {options[index]}
        </span>
      </div>

      <span className="text-[9px] uppercase tracking-[0.4em] font-bold -mt-1 whitespace-nowrap opacity-40">
        {english}
      </span>
    </div>
  );
};
