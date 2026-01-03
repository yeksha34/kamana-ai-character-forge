
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BadgeProps {
  label: string;
  icon?: LucideIcon;
  variant?: 'rose' | 'green' | 'amber' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  label, 
  icon: Icon, 
  variant = 'rose',
  className = ''
}) => {
  const variants = {
    rose: 'bg-rose-600/20 text-rose-400 border-rose-500/20',
    green: 'bg-green-600/20 text-green-400 border-green-500/20',
    amber: 'bg-amber-600/20 text-amber-400 border-amber-500/20',
    neutral: 'bg-black/60 text-white/60 border-white/10'
  };

  return (
    <div className={`
      inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md
      ${variants[variant]} 
      ${className}
    `}>
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </div>
  );
};
