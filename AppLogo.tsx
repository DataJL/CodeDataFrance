import React from 'react';

interface AppLogoProps {
  variant?: 'full' | 'header' | 'hero' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  variant = 'header',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  // Dimensions based on size
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20 sm:w-24 sm:h-24',
  };

  const textSizes = {
    sm: { title: 'text-sm', sub: 'text-[9px]' },
    md: { title: 'text-base sm:text-lg', sub: 'text-[10px] sm:text-xs' },
    lg: { title: 'text-xl sm:text-2xl', sub: 'text-xs sm:text-sm' },
    xl: { title: 'text-3xl sm:text-4xl lg:text-5xl', sub: 'text-sm sm:text-base' },
  };

  // Modern Dynamic Athletics + Data SVG Icon
  const Emblem = (
    <div className={`relative ${iconSizes[size]} flex-shrink-0 group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_4px_16px_rgba(37,99,235,0.35)]`}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-md"
      >
        <defs>
          {/* Main Shield Gradients */}
          <linearGradient id="dfa_bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="45%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          <linearGradient id="dfa_border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="35%" stopColor="#2563EB" />
            <stop offset="70%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>

          {/* Track lanes / Speed streaks (Bleu - Blanc - Rouge) */}
          <linearGradient id="lane_blue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <linearGradient id="lane_white" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          <linearGradient id="lane_red" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>

          {/* Golden Flame / Data Pulse */}
          <linearGradient id="gold_pulse" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>

          {/* Dynamic Glow */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hexagonal Shield with athletic slant */}
        <path
          d="M60 4 L106 20 L106 82 L60 116 L14 82 L14 20 Z"
          fill="url(#dfa_bg)"
          stroke="url(#dfa_border)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Inner subtle grid lines (representing data / timing / track) */}
        <path
          d="M26 38 L94 38 M20 58 L100 58 M24 78 L96 78"
          stroke="#334155"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.4"
        />

        {/* Dynamic Curved Athletics Track Lanes (Lanes 1, 2, 3) */}
        {/* Lane 1: French Cobalt Blue */}
        <path
          d="M 22 76 C 36 86, 68 88, 86 64 C 92 56, 96 44, 98 32"
          stroke="url(#lane_blue)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Lane 2: White Olympic Precision */}
        <path
          d="M 26 83 C 44 94, 76 92, 94 70 C 100 62, 103 50, 104 38"
          stroke="url(#lane_white)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Lane 3: Athletic Red Victory Pulse */}
        <path
          d="M 32 90 C 50 100, 84 98, 100 78"
          stroke="url(#lane_red)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Ascending Data Analytics Bars (Barre 1, 2, 3) emerging from track */}
        {/* Bar 1 */}
        <rect x="36" y="52" width="6" height="22" rx="3" fill="#0284C7" opacity="0.9" />
        {/* Bar 2 */}
        <rect x="46" y="38" width="6.5" height="36" rx="3" fill="#38BDF8" opacity="0.95" />
        {/* Bar 3 */}
        <rect x="57" y="24" width="7" height="50" rx="3.5" fill="url(#lane_blue)" />
        {/* Bar 4: Breakthrough Peak (Gold/Amber) */}
        <rect x="68" y="16" width="7" height="58" rx="3.5" fill="url(#gold_pulse)" filter="url(#glow)" />

        {/* Dynamic Arrow / Runner Impulse Crest bursting out of the peak */}
        <path
          d="M 62 18 L 84 10 L 76 30 Z"
          fill="url(#gold_pulse)"
        />

        {/* Stylized Sprinter In Full Propulsion (Silhouette en vitesse) */}
        {/* Sprinter Head */}
        <circle cx="58" cy="24" r="3.2" fill="#FFFFFF" />
        {/* Torso & dynamic forward lean */}
        <path
          d="M 58 28 L 52 40 L 40 48 M 52 40 L 59 52 L 67 62"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arms driving forward */}
        <path
          d="M 47 33 L 55 36 L 66 31"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Micro Sparkle / Record Star */}
        <path
          d="M 88 12 L 90 6 L 92 12 L 98 14 L 92 16 L 90 22 L 88 16 L 82 14 Z"
          fill="#FDE047"
          opacity="0.9"
        />

        {/* French Tricolor micro dots at bottom center */}
        <circle cx="53" cy="104" r="2.2" fill="#2563EB" />
        <circle cx="60" cy="104" r="2.2" fill="#FFFFFF" />
        <circle cx="67" cy="104" r="2.2" fill="#EF4444" />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {Emblem}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`flex flex-col sm:flex-row items-center gap-5 sm:gap-6 ${className}`}>
        {Emblem}
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-blue-600/30 via-sky-500/20 to-red-500/30 text-sky-200 border border-sky-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Fédération & Clubs · Saison 2026
            </span>
          </div>
          <h1 className={`${textSizes[size].title} font-black tracking-tight text-white leading-none uppercase`}>
            Data{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-amber-400">
              France Athlé
            </span>
          </h1>
          {showSubtitle && (
            <p className={`${textSizes[size].sub} font-medium text-slate-300 tracking-wide flex items-center justify-center sm:justify-start gap-2 pt-0.5`}>
              <span className="text-amber-400 font-bold">PERFORMANCE</span>
              <span className="text-slate-600">•</span>
              <span className="text-sky-300 font-bold">ANALYTICS</span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400 font-bold">RECORDS</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default 'header' / 'full' variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {Emblem}
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <span className={`${textSizes[size].title} font-black tracking-tight text-white flex items-center gap-1.5`}>
            <span>Data</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-amber-400">
              France Athlé
            </span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-950/80 text-sky-300 border border-blue-700/50 font-mono font-bold hidden sm:inline-block shadow-sm">
            v3.2 FFA
          </span>
        </div>
        {showSubtitle && (
          <p className={`${textSizes[size].sub} text-slate-400 font-medium flex items-center gap-1.5 hidden sm:flex`}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Performance & Analytics Fédérales
          </p>
        )}
      </div>
    </div>
  );
};
