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
    sm: { main: 'text-xl md:text-2xl', sub: 'text-[7px] md:text-[8px] tracking-[0.2em]' },
    md: { main: 'text-2xl md:text-3xl', sub: 'text-[8px] md:text-[10px] tracking-[0.4em]' },
    lg: { main: 'text-4xl md:text-8xl', sub: 'text-[10px] md:text-[12px] tracking-[0.6em] md:tracking-[1em]' },
    xl: { main: 'text-5xl md:text-[9rem]', sub: 'text-[10px] md:text-[14px] tracking-[0.8em] md:tracking-[1.5em]' }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <h2 className={`${sizes[size].main} serif-display italic text-rose-50 leading-none glow-text`}>
        {marathi}
      </h2>
      <span className={`${sizes[size].sub} font-black uppercase text-rose-900 mt-1 md:mt-2`}>
        {english}
      </span>
    </div>
  );
};