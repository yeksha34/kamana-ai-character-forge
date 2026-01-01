
import React, { useState, useEffect } from 'react';

interface MorphingTextProps {
  options: string[];
  english: string;
  className?: string;
}

export const MorphingText: React.FC<MorphingTextProps> = ({ options, english, className }) => {
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
      <span className="transition-all duration-1000 ease-in-out whitespace-nowrap">
        {options[index]}
      </span>
      <span className="text-[9px] uppercase tracking-[0.4em] font-bold -mt-1 whitespace-nowrap opacity-40">
        {english}
      </span>
    </div>
  );
};
