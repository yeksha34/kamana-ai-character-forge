
import React from 'react';

interface DisplayTitleProps {
  marathi: string;
  english: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const DisplayTitle: React.FC<DisplayTitleProps> = ({ 
  marathi, 
  english, 
  size = 'md',
  className = '' 
}) => {
  const sizes = {
    sm: { main: 'text-2xl', sub: 'text-[8px] tracking-[0.2em]' },
    md: { main: 'text-3xl', sub: 'text-[10px] tracking-[0.4em]' },
    lg: { main: 'text-6xl md:text-8xl', sub: 'text-[12px] tracking-[1em]' },
    xl: { main: 'text-[7rem] md:text-[9rem]', sub: 'text-[14px] tracking-[1.5em]' }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <h2 className={`${sizes[size].main} serif-display italic text-rose-50 leading-none glow-text`}>
        {marathi}
      </h2>
      <span className={`${sizes[size].sub} font-black uppercase text-rose-900 mt-2`}>
        {english}
      </span>
    </div>
  );
};
