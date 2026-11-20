import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Users, 
  Activity, 
  Trophy, 
  Info, 
  ExternalLink, 
  CheckCircle2, 
  Search,
  Maximize2
} from 'lucide-react';
import { PerformanceRecord } from '../../types/athletics';
import { 
  DEPT_BY_CODE, 
  FRANCE_DEPARTMENTS, 
  FranceDepartment, 
  extractDepartmentCode 
} from '../../data/franceDepartmentsData';
import { formatPerformanceDisplay, isBetterPerformance } from '../../utils/performanceUtils';

interface FranceDisciplineMapProps {
  disciplineRecords: PerformanceRecord[];
  discipline: string;
  onSelectAthlete: (athleteName: string) => void;
}

export type DensityIntensity = 'low' | 'medium' | 'high' | 'major';

export interface DensityTierConfig {
  key: DensityIntensity;
  label: string;
  name: string;
  athleteRange: string;
  fill: string;
  stroke: string;
  halo: string;
  glowId: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  textColor: string;
  dotSizePx: number;
}

export const DENSITY_TIERS: Record<DensityIntensity, DensityTierConfig> = {
  low: {
    key: 'low',
    name: 'Moins de 20',
    label: '< 20 athlètes',
    athleteRange: '< 20',
    fill: '#38bdf8', // Cyan / Bleu ciel lumineux
    stroke: '#bae6fd',
    halo: 'rgba(56, 189, 248, 0.35)',
    glowId: 'glow-sky',
    badgeBg: 'bg-sky-950/80',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-500/40',
    textColor: 'text-sky-400',
    dotSizePx: 7,
  },
  medium: {
    key: 'medium',
    name: '20 à 50',
    label: '20 à 50 athlètes',
    athleteRange: '20-50',
    fill: '#10b981', // Vert émeraude
    stroke: '#a7f3d0',
    halo: 'rgba(16, 185, 129, 0.35)',
    glowId: 'glow-emerald',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    dotSizePx: 12,
  },
  high: {
    key: 'high',
    name: '51 à 99',
    label: '51 à 99 athlètes',
    athleteRange: '51-99',
    fill: '#f59e0b', // Jaune ambre / Or
    stroke: '#fde68a',
    halo: 'rgba(245, 158, 11, 0.4)',
    glowId: 'glow-amber',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    textColor: 'text-amber-400',
    dotSizePx: 17,
  },
  major: {
    key: 'major',
    name: '100 et +',
    label: '100+ athlètes',
    athleteRange: '100+',
    fill: '#ef4444', // Rouge vif éclatant
    stroke: '#fca5a5',
    halo: 'rgba(239, 68, 68, 0.45)',
    glowId: 'glow-red',
    badgeBg: 'bg-red-950/80',
    badgeText: 'text-red-300',
    badgeBorder: 'border-red-500/40',
    textColor: 'text-red-400',
    dotSizePx: 23,
  },
};

export interface DepartmentPracticeStats {
  dept: FranceDepartment;
  athletes: string[];
  athleteCount: number;
  perfsCount: number;
  clubs: string[];
  bestPerf: PerformanceRecord | null;
  dotRadius: number;
  intensity: DensityIntensity;
  tier: DensityTierConfig;
}

export const FranceDisciplineMap: React.FC<FranceDisciplineMapProps> = ({
  disciplineRecords,
  discipline,
  onSelectAthlete,
}) => {
  const [selectedDeptCode, setSelectedDeptCode] = useState<string | null>(null);
  const [hoveredDeptCode, setHoveredDeptCode] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [selectedFilterTier, setSelectedFilterTier] = useState<DensityIntensity | 'ALL'>('ALL');

  // 1. Agréger les statistiques par département avec attribution des couleurs
  const deptStats = useMemo(() => {
    const map = new Map<string, {
      athletesSet: Set<string>;
      perfs: PerformanceRecord[];
      clubsSet: Set<string>;
      bestPerf: PerformanceRecord | null;
    }>();

    disciplineRecords.forEach(r => {
      const code = extractDepartmentCode(r.departement, r.club, r.lieu, r.region);
      if (!code) return;

      const existing = map.get(code) || {
        athletesSet: new Set<string>(),
        perfs: [],
        clubsSet: new Set<string>(),
        bestPerf: null,
      };

      if (r.athleteName) {
        existing.athletesSet.add(r.athleteName.trim());
      }
      if (r.club) {
        existing.clubsSet.add(r.club.trim());
      }
      existing.perfs.push(r);

      if (!existing.bestPerf) {
        existing.bestPerf = r;
      } else if (isBetterPerformance(r.performanceValue, existing.bestPerf.performanceValue, r.nature)) {
        existing.bestPerf = r;
      }

      map.set(code, existing);
    });

    let maxAthletesInAnyDept = 1;
    map.forEach(item => {
      if (item.athletesSet.size > maxAthletesInAnyDept) {
        maxAthletesInAnyDept = item.athletesSet.size;
      }
    });

    const result: Record<string, DepartmentPracticeStats> = {};

    map.forEach((item, code) => {
      const dept = DEPT_BY_CODE[code];
      if (!dept) return;

      const count = item.athletesSet.size;

      // Attribution de la catégorie de densité et de couleur :
      // - Bleu : Moins de 20 (< 20 athlètes)
      // - Vert : Entre 20 et 50 (20 à 50 athlètes)
      // - Jaune : Entre 51 et 99 (51 à 99 athlètes)
      // - Rouge : 100 et + (>= 100 athlètes)
      let intensity: DensityIntensity = 'low';
      if (count >= 100) intensity = 'major';
      else if (count >= 51) intensity = 'high';
      else if (count >= 20) intensity = 'medium';

      const tier = DENSITY_TIERS[intensity];

      // Rayon dynamique du point selon le palier et le volume :
      let dotRadius = 7;
      if (intensity === 'low') {
        dotRadius = Math.round(5.5 + Math.min(count / 20, 1) * 3);
      } else if (intensity === 'medium') {
        dotRadius = Math.round(9.5 + ((count - 20) / 30) * 3.5);
      } else if (intensity === 'high') {
        dotRadius = Math.round(14 + ((count - 51) / 48) * 4);
      } else {
        const extraScale = Math.min((count - 100) / 300, 1);
        dotRadius = Math.round(19 + extraScale * 6);
      }

      result[code] = {
        dept,
        athletes: Array.from(item.athletesSet).sort((a, b) => a.localeCompare(b)),
        athleteCount: count,
        perfsCount: item.perfs.length,
        clubs: Array.from(item.clubsSet).sort((a, b) => a.localeCompare(b)),
        bestPerf: item.bestPerf,
        dotRadius,
        intensity,
        tier,
      };
    });

    return result;
  }, [disciplineRecords]);

  // Liste triée par nombre d'athlètes décroissant
  const sortedActiveDepts = useMemo(() => {
    return Object.values(deptStats).sort((a, b) => {
      if (b.athleteCount !== a.athleteCount) return b.athleteCount - a.athleteCount;
      return b.perfsCount - a.perfsCount;
    });
  }, [deptStats]);

  // Décomptes par palier de couleur
  const tierCounts = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, major: 0 };
    sortedActiveDepts.forEach(d => {
      counts[d.intensity]++;
    });
    return counts;
  }, [sortedActiveDepts]);

  // Totaux
  const totalActiveDepts = sortedActiveDepts.length;
  const totalClubs = useMemo(() => {
    const s = new Set<string>();
    sortedActiveDepts.forEach(d => d.clubs.forEach(c => s.add(c)));
    return s.size;
  }, [sortedActiveDepts]);

  const activeDeptForDetails = selectedDeptCode 
    ? deptStats[selectedDeptCode] 
    : (hoveredDeptCode ? deptStats[hoveredDeptCode] : null);

  // Filtrage du tableau par recherche et par palier de couleur
  const filteredTableDepts = useMemo(() => {
    return sortedActiveDepts.filter(d => {
      if (selectedFilterTier !== 'ALL' && d.intensity !== selectedFilterTier) {
        return false;
      }
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
        return (
          d.dept.name.toLowerCase().includes(q) ||
          d.dept.code.toLowerCase().includes(q) ||
          d.dept.chefLieu.toLowerCase().includes(q) ||
          d.dept.region.toLowerCase().includes(q) ||
          d.clubs.some(c => c.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [sortedActiveDepts, tableSearch, selectedFilterTier]);

  return (
    <div className="space-y-6">
      
      {/* 1. RÉSUMÉ GÉOGRAPHIQUE & LÉGENDE MULTI-COULEURS */}
      <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs font-extrabold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Échelle de densité colorimétrique :</span>
            </span>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700">
              {totalActiveDepts} département{totalActiveDepts > 1 ? 's' : ''} actif{totalActiveDepts > 1 ? 's' : ''}
            </span>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700">
              {totalClubs} club{totalClubs > 1 ? 's' : ''}
            </span>
          </div>

          <span className="text-[11px] text-slate-400">
            Couleurs et tailles adaptées pour un repérage rapide
          </span>
        </div>

        {/* LÉGENDE COLORÉE INTERACTIVE (CLIQUEZ POUR FILTRER) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* PALIER 1 : BLEU (< 20) */}
          <button
            onClick={() => setSelectedFilterTier(selectedFilterTier === 'low' ? 'ALL' : 'low')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedFilterTier === 'low'
                ? 'bg-sky-950 border-sky-400 shadow-md shadow-sky-950'
                : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-sky-500/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50 shrink-0" />
              <div>
                <span className="text-xs font-bold text-sky-300 block leading-tight">
                  Moins de 20
                </span>
                <span className="text-[10px] text-slate-400">&lt; 20 athlètes</span>
              </div>
            </div>
            <span className="font-mono font-black text-xs text-sky-400 px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/40">
              {tierCounts.low}
            </span>
          </button>

          {/* PALIER 2 : VERT (20 à 50) */}
          <button
            onClick={() => setSelectedFilterTier(selectedFilterTier === 'medium' ? 'ALL' : 'medium')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedFilterTier === 'medium'
                ? 'bg-emerald-950 border-emerald-400 shadow-md shadow-emerald-950'
                : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-300 block leading-tight">
                  Entre 20 et 50
                </span>
                <span className="text-[10px] text-slate-400">20 à 50 athlètes</span>
              </div>
            </div>
            <span className="font-mono font-black text-xs text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40">
              {tierCounts.medium}
            </span>
          </button>

          {/* PALIER 3 : JAUNE (51 à 99) */}
          <button
            onClick={() => setSelectedFilterTier(selectedFilterTier === 'high' ? 'ALL' : 'high')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedFilterTier === 'high'
                ? 'bg-amber-950 border-amber-400 shadow-md shadow-amber-950'
                : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50 shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-300 block leading-tight">
                  Entre 51 et 99
                </span>
                <span className="text-[10px] text-slate-400">51 à 99 athlètes</span>
              </div>
            </div>
            <span className="font-mono font-black text-xs text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/40">
              {tierCounts.high}
            </span>
          </button>

          {/* PALIER 4 : ROUGE (100 et +) */}
          <button
            onClick={() => setSelectedFilterTier(selectedFilterTier === 'major' ? 'ALL' : 'major')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedFilterTier === 'major'
                ? 'bg-red-950 border-red-400 shadow-md shadow-red-950'
                : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-red-500/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-red-500 ring-2 ring-red-400/50 shadow-sm shadow-red-500/50 animate-pulse shrink-0" />
              <div>
                <span className="text-xs font-bold text-red-300 block leading-tight">
                  100 et +
                </span>
                <span className="text-[10px] text-slate-400">100+ athlètes</span>
              </div>
            </div>
            <span className="font-mono font-black text-xs text-red-400 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800/40">
              {tierCounts.major}
            </span>
          </button>
        </div>
      </div>

      {/* 2. ZONE CENTRALE : CARTE DE FRANCE SVG + PANNEAU DÉTAIL DÉPARTEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CARTE SVG DE FRANCE */}
        <div className="lg:col-span-7 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-400">
            <span className="font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Cartographie Multicolore de la Pratique</span>
            </span>
            <span className="text-[11px] text-slate-500">Cliquez sur un point pour inspecter</span>
          </div>

          <div className="w-full max-w-[560px] aspect-[620/580] relative">
            <svg
              viewBox="0 0 620 580"
              className="w-full h-full select-none"
              style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
            >
              <defs>
                {/* Glow filters spécifiques pour chaque couleur */}
                <filter id="glow-sky" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.6"/>
                </filter>
                <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.6"/>
                </filter>
                <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f59e0b" floodOpacity="0.7"/>
                </filter>
                <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#ef4444" floodOpacity="0.8"/>
                </filter>

                <linearGradient id="france-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.65" />
                </linearGradient>
              </defs>

              {/* SILHOUETTE GÉOMÉTRIQUE DE LA FRANCE (Hexagone & Côtes) */}
              <path
                d="M 320 55 
                   L 350 70 
                   L 390 100 
                   L 460 115 
                   L 520 150 
                   L 525 210 
                   L 485 240 
                   L 485 285 
                   L 510 325 
                   L 490 390 
                   L 510 445 
                   L 435 480 
                   L 375 470 
                   L 315 510 
                   L 260 500 
                   L 175 440 
                   L 170 380 
                   L 190 310 
                   L 150 280 
                   L 70 250 
                   L 40 195 
                   L 110 185 
                   L 165 170 
                   L 205 130 
                   L 255 120 
                   L 300 85 Z"
                fill="url(#france-bg-grad)"
                stroke="#334155"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* CORSE */}
              <path
                d="M 545 490 
                   L 570 505 
                   L 565 555 
                   L 540 545 
                   L 535 510 Z"
                fill="url(#france-bg-grad)"
                stroke="#334155"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <text x="535" y="482" fill="#64748b" fontSize="9" fontWeight="bold">Corse</text>

              {/* REPÈRES GÉOGRAPHIQUES DISCRETS */}
              <line x1="200" y1="180" x2="480" y2="180" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.35" />
              <line x1="160" y1="320" x2="490" y2="320" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.35" />
              <line x1="310" y1="90" x2="310" y2="490" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.35" />

              {/* ENCADRÉ OUTRE-MER (DOM-TOM) */}
              <rect
                x="20"
                y="450"
                width="145"
                height="115"
                rx="12"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1.2"
                opacity="0.85"
              />
              <text x="32" y="470" fill="#94a3b8" fontSize="10" fontWeight="bold">
                Outre-Mer (DOM-TOM)
              </text>
              <line x1="32" y1="475" x2="150" y2="475" stroke="#334155" strokeWidth="0.8" />

              <text x="35" y="500" fill="#64748b" fontSize="8">Gua (971)</text>
              <text x="75" y="500" fill="#64748b" fontSize="8">Mar (972)</text>
              <text x="35" y="540" fill="#64748b" fontSize="8">Guy (973)</text>
              <text x="75" y="540" fill="#64748b" fontSize="8">Réu (974)</text>
              <text x="115" y="520" fill="#64748b" fontSize="8">May (976)</text>

              {/* POINTS DES DÉPARTEMENTS NON ACTIFS (POINTS GRIS SUBTILS) */}
              {FRANCE_DEPARTMENTS.map(dept => {
                if (deptStats[dept.code]) return null;
                return (
                  <circle
                    key={`empty-${dept.code}`}
                    cx={dept.svgX}
                    cy={dept.svgY}
                    r="2.5"
                    fill="#334155"
                    opacity="0.3"
                  />
                );
              })}

              {/* POINTS DE DIFFÉRENTES TAILLES ET DIFFÉRENTES COULEURS SELON LA DENSITÉ */}
              {Object.values(deptStats).map(stat => {
                const { dept, dotRadius, athleteCount, intensity, tier } = stat;
                const isSelected = selectedDeptCode === dept.code;
                const isHovered = hoveredDeptCode === dept.code;

                // Si un filtre de couleur est actif et ce point n'y correspond pas, l'atténuer
                const isDimmed = selectedFilterTier !== 'ALL' && intensity !== selectedFilterTier;

                return (
                  <g
                    key={`active-${dept.code}`}
                    className={`cursor-pointer transition-all ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
                    onClick={() => setSelectedDeptCode(selectedDeptCode === dept.code ? null : dept.code)}
                    onMouseEnter={() => setHoveredDeptCode(dept.code)}
                    onMouseLeave={() => setHoveredDeptCode(null)}
                  >
                    {/* HALO PULSANT POUR LES POINTS MAJEURS OU SURVOLÉS */}
                    {(intensity === 'major' || isHovered || isSelected) && (
                      <circle
                        cx={dept.svgX}
                        cy={dept.svgY}
                        r={dotRadius + 8}
                        fill="none"
                        stroke={tier.fill}
                        strokeWidth="2"
                        opacity={isHovered || isSelected ? "0.9" : "0.5"}
                        className={intensity === 'major' ? "animate-ping origin-center" : ""}
                        style={{ transformOrigin: `${dept.svgX}px ${dept.svgY}px` }}
                      />
                    )}

                    {/* SECOND HALO TRANSPARENT AVEC LA COULEUR DU PALIER */}
                    <circle
                      cx={dept.svgX}
                      cy={dept.svgY}
                      r={dotRadius + 3}
                      fill={tier.fill}
                      opacity={isSelected ? "0.45" : (isHovered ? "0.35" : "0.2")}
                    />

                    {/* POINT CENTRAL AVEC SA COULEUR DÉDIÉE (BLEU, VERT, AMBRE OU ROUGE) */}
                    <circle
                      cx={dept.svgX}
                      cy={dept.svgY}
                      r={dotRadius}
                      fill={tier.fill}
                      stroke={isSelected ? "#ffffff" : (isHovered ? "#ffffff" : tier.stroke)}
                      strokeWidth={isSelected ? "3" : (isHovered ? "2.5" : "1.5")}
                      filter={`url(#${tier.glowId})`}
                    />

                    {/* CHIFFRE D'ATHLÈTES AFFICHÉ DIRECTEMENT DANS LE CERCLE SI LA TAILLE LE PERMET */}
                    {dotRadius >= 10 && (
                      <text
                        x={dept.svgX}
                        y={dept.svgY + 3.5}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={dotRadius >= 16 ? "10" : "8"}
                        fontWeight="bold"
                        className="pointer-events-none select-none font-mono"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                      >
                        {athleteCount}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-slate-500 mt-2 px-2">
            <span>Projection conforme France métropolitaine + Outre-Mer</span>
            <span>Épreuve active : <strong className="text-slate-300">{discipline}</strong></span>
          </div>
        </div>

        {/* 3. PANNEAU DÉTAIL DÉPARTEMENT SÉLECTIONNÉ OU SURVOLÉ */}
        <div className="lg:col-span-5 space-y-4">
          {activeDeptForDetails ? (
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-5 animate-fade-in relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span 
                      className={`w-9 h-9 rounded-2xl border flex items-center justify-center font-mono font-black text-sm shadow-sm ${activeDeptForDetails.tier.badgeBg} ${activeDeptForDetails.tier.badgeText} ${activeDeptForDetails.tier.badgeBorder}`}
                      style={{ boxShadow: `0 0 12px ${activeDeptForDetails.tier.halo}` }}
                    >
                      {activeDeptForDetails.dept.code}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-white">
                          {activeDeptForDetails.dept.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeDeptForDetails.tier.badgeBg} ${activeDeptForDetails.tier.badgeText} ${activeDeptForDetails.tier.badgeBorder}`}>
                          {activeDeptForDetails.tier.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {activeDeptForDetails.dept.region} · Chef-lieu : <strong className="text-slate-300">{activeDeptForDetails.dept.chefLieu}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedDeptCode(null);
                    setHoveredDeptCode(null);
                  }}
                  className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors"
                >
                  Fermer
                </button>
              </div>

              {/* STATS RAPIDES AVEC COULEUR DU PALIER */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Athlètes Pratiquants</span>
                  <div className={`text-2xl font-black font-mono mt-0.5 ${activeDeptForDetails.tier.textColor}`}>
                    {activeDeptForDetails.athleteCount}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Palier : {activeDeptForDetails.tier.label}
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Performances Réalisées</span>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    {activeDeptForDetails.perfsCount}
                  </div>
                  <span className="text-[10px] text-slate-500">enregistrées sur l'épreuve</span>
                </div>
              </div>

              {/* MEILLEUR ATHLÈTE DU DÉPARTEMENT */}
              {activeDeptForDetails.bestPerf && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Meilleure Performance Déparmentale</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onSelectAthlete(activeDeptForDetails.bestPerf!.athleteName)}
                      className="font-extrabold text-sm text-white hover:text-sky-300 transition-colors text-left"
                    >
                      {activeDeptForDetails.bestPerf.athleteName}
                    </button>
                    <span className="font-mono font-black text-sm text-amber-300">
                      {formatPerformanceDisplay(activeDeptForDetails.bestPerf.performanceValue, activeDeptForDetails.bestPerf.nature, discipline)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {activeDeptForDetails.bestPerf.club} · {activeDeptForDetails.bestPerf.date}
                  </div>
                </div>
              )}

              {/* CLUBS DU DÉPARTEMENT */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Clubs Actifs ({activeDeptForDetails.clubs.length}) :
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto no-scrollbar">
                  {activeDeptForDetails.clubs.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-xl bg-slate-950 text-slate-200 border border-slate-800"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* ATHLÈTES DU DÉPARTEMENT */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Athlètes Détectés ({activeDeptForDetails.athletes.length}) :
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {activeDeptForDetails.athletes.map((name, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectAthlete(name)}
                      className="text-xs px-2.5 py-1 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-sky-300 border border-blue-800/50 cursor-pointer transition-colors"
                      title="Consulter la fiche athlète"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <MapPin className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">
                  Sélectionnez un point coloré sur la carte
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Les points varient en taille et en couleur : <strong className="text-sky-300">bleu</strong> (&lt; 20), <strong className="text-emerald-300">vert</strong> (20 à 50), <strong className="text-amber-300">jaune</strong> (51 à 99) et <strong className="text-red-400">rouge</strong> (100 et +).
                </p>
              </div>

              {sortedActiveDepts.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Top département pour cette épreuve :</span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-white">
                      {sortedActiveDepts[0].dept.code} - {sortedActiveDepts[0].dept.name}
                    </span>
                    <span className={`font-mono font-bold ${sortedActiveDepts[0].tier.textColor}`}>
                      {sortedActiveDepts[0].athleteCount} athlètes
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. TABLEAU DES DÉPARTEMENTS ET CLUBS PRATIQUANTS AVEC COULEURS DE RAPPEL */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-lg space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">
              Classement des Départements par Nombre de Pratiquants ({filteredTableDepts.length})
            </h4>
            {selectedFilterTier !== 'ALL' && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${DENSITY_TIERS[selectedFilterTier].badgeBg} ${DENSITY_TIERS[selectedFilterTier].badgeText} ${DENSITY_TIERS[selectedFilterTier].badgeBorder}`}>
                Filtre : {DENSITY_TIERS[selectedFilterTier].name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedFilterTier !== 'ALL' && (
              <button
                onClick={() => setSelectedFilterTier('ALL')}
                className="text-xs text-sky-400 hover:underline px-2 py-1"
              >
                Afficher tout
              </button>
            )}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer département, ville ou club..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {filteredTableDepts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Aucun département ne correspond aux critères de recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Rang</th>
                  <th className="py-2.5 px-3">Département</th>
                  <th className="py-2.5 px-3">Chef-lieu / Ville</th>
                  <th className="py-2.5 px-3">Région</th>
                  <th className="py-2.5 px-3 text-center">Niveau de Pratique</th>
                  <th className="py-2.5 px-3 text-center">Athlètes</th>
                  <th className="py-2.5 px-3 text-center">Perfs</th>
                  <th className="py-2.5 px-3">Meilleure Marque</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTableDepts.map((d, index) => {
                  const isSelected = selectedDeptCode === d.dept.code;
                  return (
                    <tr 
                      key={d.dept.code}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-slate-800/70 border-l-4' : ''
                      }`}
                      style={{ borderLeftColor: isSelected ? d.tier.fill : undefined }}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                        #{index + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span 
                            className={`font-mono font-black text-xs px-2 py-0.5 rounded-md border ${d.tier.badgeBg} ${d.tier.badgeText} ${d.tier.badgeBorder}`}
                          >
                            {d.dept.code}
                          </span>
                          <span className="font-bold text-white">{d.dept.name}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-300">
                        {d.dept.chefLieu}
                      </td>

                      <td className="py-2.5 px-3 text-slate-400">
                        {d.dept.region}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${d.tier.badgeBg} ${d.tier.badgeText} ${d.tier.badgeBorder}`}>
                          <span 
                            className="w-1.5 h-1.5 rounded-full" 
                            style={{ backgroundColor: d.tier.fill }}
                          />
                          <span>{d.tier.name} ({d.tier.label})</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-black" style={{ color: d.tier.fill }}>
                        {d.athleteCount}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                        {d.perfsCount}
                      </td>

                      <td className="py-2.5 px-3">
                        {d.bestPerf ? (
                          <div>
                            <span className="font-mono font-bold text-amber-300">
                              {formatPerformanceDisplay(d.bestPerf.performanceValue, d.bestPerf.nature, discipline)}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                              {d.bestPerf.athleteName}
                            </span>
                          </div>
                        ) : '-'}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedDeptCode(d.dept.code)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                        >
                          Localiser
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
