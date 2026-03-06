
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  const borderClasses = {
    sm: 'border-[2px]',
    md: 'border-[4px]',
    lg: 'border-[6px]',
    xl: 'border-[8px]',
  };

  const textClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className={`${sizeClasses[size]} ${borderClasses[size]} bg-white rounded-full flex items-center justify-center border-zinc-900 shadow-2xl relative group transition-transform hover:scale-105 duration-300 shrink-0`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-zinc-200 to-white -z-10 opacity-50"></div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-1/2 h-1/2"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-black tracking-[0.2em] text-black dark:text-white uppercase ${textClasses[size]}`}>
            Champ
          </span>
          <span className={`font-light tracking-[0.4em] text-zinc-500 uppercase ${size === 'xl' ? 'text-sm' : 'text-[8px]'}`}>
            AI
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
