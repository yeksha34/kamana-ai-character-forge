
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverable = false,
  padding = 'md' 
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
    xl: 'p-16 md:p-24'
  };

  return (
    <div className={`
      art-glass border border-rose-950/30 
      ${paddings[padding]} 
      ${hoverable ? 'hover:border-rose-700/40 hover:shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-all duration-700' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};
