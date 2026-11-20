import React, { useState, useMemo } from 'react';
import { TrendingUp, Trophy, Calendar, Eye, EyeOff, Sparkles, HelpCircle } from 'lucide-react';
import { PerformanceRecord, PerformanceNature } from '../../types/athletics';
import { 
  computeAnnualBilan, 
  formatPerformanceDisplay, 
  getDisciplineNature,
  isBetterPerformance,
  normalizeDistanceValue 
} from '../../utils/performanceUtils';

interface PerformanceEvolutionChartProps {
  disciplineRecords: PerformanceRecord[];
  discipline: string;
  topLimit: number;
  sexe: 'M' | 'F' | 'ALL';
  nationality: 'FRA' | 'ALL';
  structure: 'EXTERIEUR' | 'SALLE';
  onSelectAthlete?: (athleteName: string) => void;
}

// Palette chromatique distinctive et contrastée pour chaque rang du top
const RANK_COLORS = [
  { rank: 1, label: '1er', color: '#F59E0B', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/50' }, // Or / Amber
  { rank: 2, label: '2e', color: '#06B6D4', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/50' },     // Cyan
  { rank: 3, label: '3e', color: '#A855F7', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/50' }, // Violet
  { rank: 4, label: '4e', color: '#10B981', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/50' }, // Vert émeraude
  { rank: 5, label: '5e', color: '#F43F5E', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/50' },     // Rose
  { rank: 6, label: '6e', color: '#3B82F6', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/50' },     // Bleu roi
  { rank: 7, label: '7e', color: '#F97316', bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/50' }, // Orange
  { rank: 8, label: '8e', color: '#84CC16', bg: 'bg-lime-500', text: 'text-lime-400', border: 'border-lime-500/50' },     // Lime
  { rank: 9, label: '9e', color: '#EC4899', bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500/50' },     // Rose vif
  { rank: 10, label: '10e', color: '#6366F1', bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500/50' }, // Indigo
  { rank: 11, label: '11e', color: '#14B8A6', bg: 'bg-teal-500', text: 'text-teal-400', border: 'border-teal-500/50' },   // Sarcelle
  { rank: 12, label: '12e', color: '#EAB308', bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/50' }, // Jaune
];

const AVERAGE_LINE_COLOR = '#FFFFFF';

export const PerformanceEvolutionChart: React.FC<PerformanceEvolutionChartProps> = ({
  disciplineRecords,
  discipline,
  topLimit,
  sexe,
  nationality,
  structure,
  onSelectAthlete,
}) => {
  const nature = getDisciplineNature(discipline);

  // 1. Saisons chronologiques détectées
  const seasons = useMemo(() => {
    const set = new Set<string>();
    disciplineRecords.forEach(r => {
      const lab = r.saisonLabel || (r.saison === 2026 ? '2025-2026' : (r.saison ? `${r.saison - 1}-${r.saison}` : ''));
      if (lab) set.add(lab);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [disciplineRecords]);

  // 2. Classement officiel de chaque saison (1 meilleure performance unique par athlète)
  const seasonRankings = useMemo(() => {
    return seasons.map(season => {
      const seasonRecs = disciplineRecords.filter(r => {
        const lab = r.saisonLabel || (r.saison === 2026 ? '2025-2026' : (r.saison ? `${r.saison - 1}-${r.saison}` : ''));
        return lab === season;
      });

      const ranked = computeAnnualBilan(seasonRecs, {
        discipline,
        seasonPeriod: 'all', // Déjà filtré par saison
        sexe,
        categorie: 'ALL',
        structure,
        ventCondition: 'TOUS',
        region: 'ALL',
        departement: 'ALL',
        club: 'ALL',
        nationalite: nationality,
        perfLimitPerAthlete: 1,
        perfCalcMode: 'BEST',
      });

      return {
        season,
        ranked,
        athletesCount: ranked.length,
      };
    });
  }, [seasons, disciplineRecords, discipline, sexe, structure, nationality]);

  // Nombre de rangs individuels à tracer :
  // Si topLimit <= 12, on trace tous les rangs du top (ex: 1er, 2e, 3e pour Top 3).
  // Si topLimit > 12 (ex: Top 20, 50), on trace les 10 premiers + le rang topLimit.
  const ranksToPlot = useMemo(() => {
    if (topLimit <= 12) {
      return Array.from({ length: topLimit }, (_, i) => i + 1);
    }
    // Pour des tops élevés, afficher les 8 premiers et le rang seuil
    const list = [1, 2, 3, 4, 5, 6, 7, 8];
    if (!list.includes(topLimit)) {
      list.push(topLimit);
    }
    return list;
  }, [topLimit]);

  // Lignes masquées/affichées par l'utilisateur
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const toggleSeries = (id: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Survol interactif
  const [hoveredSeason, setHoveredSeason] = useState<string | null>(null);
  const [hoveredRank, setHoveredRank] = useState<number | 'AVG' | null>(null);

  // 3. Extraction des points de chaque série (chaque rang + la moyenne)
  const seriesData = useMemo(() => {
    const lines: Array<{
      id: string;
      label: string;
      rank: number | 'AVG';
      color: string;
      isAverage: boolean;
      points: Array<{
        season: string;
        seasonIndex: number;
        value: number;
        display: string;
        athleteName?: string;
        club?: string;
        vent?: number | null;
      }>;
    }> = [];

    // Séries individuelles par rang
    ranksToPlot.forEach(r => {
      const colorConf = RANK_COLORS[(r - 1) % RANK_COLORS.length] || { color: '#94A3B8' };
      const pts: Array<{
        season: string;
        seasonIndex: number;
        value: number;
        display: string;
        athleteName?: string;
        club?: string;
        vent?: number | null;
      }> = [];

      seasonRankings.forEach((sr, idx) => {
        const entry = sr.ranked[r - 1];
        if (entry) {
          const normVal = normalizeDistanceValue(entry.record.performanceValue, discipline);
          pts.push({
            season: sr.season,
            seasonIndex: idx,
            value: normVal,
            display: formatPerformanceDisplay(normVal, entry.record.nature, discipline),
            athleteName: entry.record.athleteName,
            club: entry.record.club,
            vent: entry.record.vent,
          });
        }
      });

      lines.push({
        id: `rank-${r}`,
        label: r === 1 ? '1ers' : `${r}èmes`,
        rank: r,
        color: colorConf.color,
        isAverage: false,
        points: pts,
      });
    });

    // Série Moyenne du Top sélectionné
    const avgPts: Array<{
      season: string;
      seasonIndex: number;
      value: number;
      display: string;
    }> = [];

    seasonRankings.forEach((sr, idx) => {
      const topEntries = sr.ranked.slice(0, topLimit);
      if (topEntries.length > 0) {
        const sum = topEntries.reduce((acc, e) => acc + normalizeDistanceValue(e.record.performanceValue, discipline), 0);
        const avg = sum / topEntries.length;
        avgPts.push({
          season: sr.season,
          seasonIndex: idx,
          value: avg,
          display: formatPerformanceDisplay(avg, nature, discipline),
        });
      }
    });

    lines.push({
      id: 'series-avg',
      label: `Moyenne Top ${topLimit}`,
      rank: 'AVG',
      color: AVERAGE_LINE_COLOR,
      isAverage: true,
      points: avgPts,
    });

    return lines;
  }, [ranksToPlot, seasonRankings, topLimit, discipline, nature]);

  // 4. Calcul de l'échelle numérique du graphique
  const { allValues, minVal, maxVal, bestVal, worstVal } = useMemo(() => {
    const vals: number[] = [];
    seriesData.forEach(s => {
      s.points.forEach(p => {
        if (!isNaN(p.value) && p.value > 0) {
          vals.push(p.value);
        }
      });
    });

    if (vals.length === 0) {
      return { allValues: [], minVal: 0, maxVal: 10, bestVal: 10, worstVal: 0 };
    }

    const min = Math.min(...vals);
    const max = Math.max(...vals);

    // En athlétisme :
    // - Pour les courses (time), min est le meilleur (plus rapide) et max est le moins bon
    // - Pour les concours (distance/points), max est le meilleur et min est le moins bon
    const best = nature === 'time' ? min : max;
    const worst = nature === 'time' ? max : min;

    return { allValues: vals, minVal: min, maxVal: max, bestVal: best, worstVal: worst };
  }, [seriesData, nature]);

  // Dimensions SVG et marges
  const svgWidth = 840;
  const svgHeight = 360;
  const paddingLeft = 75;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 50;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Calcul d'extension pour les bornes Y afin de ne pas coller les marqueurs aux bords
  const { yRangeMin, yRangeMax } = useMemo(() => {
    if (allValues.length === 0) return { yRangeMin: 0, yRangeMax: 10 };
    const span = Math.max(maxVal - minVal, nature === 'time' ? 0.3 : 0.5);
    const pad = span * 0.12;
    return {
      yRangeMin: Math.max(0, minVal - pad),
      yRangeMax: maxVal + pad,
    };
  }, [allValues, minVal, maxVal, nature]);

  // Coordonnée X selon la saison
  const getX = (seasonIndex: number) => {
    if (seasons.length <= 1) {
      return paddingLeft + plotWidth / 2;
    }
    return paddingLeft + (seasonIndex / (seasons.length - 1)) * plotWidth;
  };

  // Coordonnée Y :
  // Orientation sportive athlétique : LE MEILLEUR EST TOUJOURS EN HAUT !
  // Ainsi, une courbe montante (↗) symbolise toujours une PROGRESSION / AMÉLIORATION.
  const getY = (val: number) => {
    if (yRangeMax === yRangeMin) return paddingTop + plotHeight / 2;
    if (nature === 'time') {
      // Pour les courses : val plus petite (meilleure) = vers le haut (paddingTop)
      return paddingTop + ((val - yRangeMin) / (yRangeMax - yRangeMin)) * plotHeight;
    } else {
      // Pour les concours : val plus grande (meilleure) = vers le haut (paddingTop)
      return paddingTop + ((yRangeMax - val) / (yRangeMax - yRangeMin)) * plotHeight;
    }
  };

  // 5 graduations horizontales sur l'axe Y
  const yTicks = useMemo(() => {
    const ticksCount = 5;
    const step = (yRangeMax - yRangeMin) / (ticksCount - 1);
    const list: Array<{ value: number; y: number; label: string }> = [];

    for (let i = 0; i < ticksCount; i++) {
      const v = yRangeMin + i * step;
      list.push({
        value: v,
        y: getY(v),
        label: formatPerformanceDisplay(v, nature, discipline),
      });
    }
    return list;
  }, [yRangeMin, yRangeMax, nature, discipline]);

  // Données de la saison survolée pour la boîte d'information
  const activeHoverSeasonData = useMemo(() => {
    if (!hoveredSeason) return null;
    const sRank = seasonRankings.find(sr => sr.season === hoveredSeason);
    if (!sRank) return null;

    const topItems = sRank.ranked.slice(0, Math.min(topLimit, 12));
    const avg = topItems.length > 0 
      ? topItems.reduce((acc, e) => acc + e.record.performanceValue, 0) / topItems.length 
      : 0;

    return {
      season: hoveredSeason,
      items: topItems,
      avgValue: avg,
      avgDisplay: formatPerformanceDisplay(avg, nature, discipline),
    };
  }, [hoveredSeason, seasonRankings, topLimit, nature, discipline]);

  if (seasons.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in">
      
      {/* HEADER DU GRAPHIQUE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">
                Évolution des performances par saison (Top {topLimit})
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/40">
                {seasons.length} saison{seasons.length > 1 ? 's' : ''} analysée{seasons.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Trajectoire annuelle des meilleurs rangs et de la moyenne du Top {topLimit} · 
              <span className="text-emerald-400 font-semibold ml-1">Une courbe montante (↗) indique une progression athlétique</span>
            </p>
          </div>
        </div>

        {/* Boutons d'actions rapides de la légende */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <button
            onClick={() => setHiddenSeries(new Set())}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
            title="Afficher toutes les courbes"
          >
            Toutes
          </button>
          <button
            onClick={() => {
              const onlyAvg = new Set<string>();
              seriesData.forEach(s => {
                if (!s.isAverage) onlyAvg.add(s.id);
              });
              setHiddenSeries(onlyAvg);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold transition-colors cursor-pointer"
            title="Afficher uniquement la moyenne"
          >
            Moyenne seule
          </button>
        </div>
      </div>

      {/* LÉGENDE INTERACTIVE */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b border-slate-800/80">
        <span className="text-xs text-slate-400 font-semibold mr-1">Légende :</span>
        {seriesData.map(s => {
          const isHidden = hiddenSeries.has(s.id);
          const isHovered = hoveredRank === s.rank;

          return (
            <button
              key={s.id}
              onClick={() => toggleSeries(s.id)}
              onMouseEnter={() => setHoveredRank(s.rank)}
              onMouseLeave={() => setHoveredRank(null)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                isHidden 
                  ? 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60 line-through'
                  : isHovered
                    ? 'bg-slate-800 border-white text-white shadow-md scale-105'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
              title={isHidden ? `Afficher la courbe ${s.label}` : `Masquer la courbe ${s.label}`}
            >
              {s.isAverage ? (
                <span className="inline-block w-3 h-0.5 bg-white border-t border-dashed border-amber-400" />
              ) : (
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                  style={{ backgroundColor: s.color }}
                />
              )}
              <span>{s.label}</span>
              {isHidden ? (
                <EyeOff className="w-3 h-3 text-slate-500 ml-0.5" />
              ) : (
                <Eye className="w-3 h-3 text-slate-400 opacity-50 ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* ZONE GRAPHIQUE SVG NATIVE INTERACTIVE */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[680px]">
          <svg 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
            className="w-full h-auto select-none"
            style={{ maxHeight: '380px' }}
          >
            <defs>
              {/* Gradients pour chaque ligne */}
              <linearGradient id="avg-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
              </filter>
            </defs>

            {/* GRILLE DE FOND ET AXES */}
            {/* Lignes horizontales de l'axe Y */}
            {yTicks.map(t => (
              <g key={t.value}>
                <line
                  x1={paddingLeft}
                  y1={t.y}
                  x2={svgWidth - paddingRight}
                  y2={t.y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={t.y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {t.label}
                </text>
              </g>
            ))}

            {/* Colonnes verticales de chaque saison */}
            {seasons.map((s, idx) => {
              const x = getX(idx);
              const isHovered = hoveredSeason === s;

              return (
                <g key={s}>
                  {/* Zone réactive cliquable / survolable par saison */}
                  <rect
                    x={x - (plotWidth / seasons.length) / 2}
                    y={paddingTop}
                    width={plotWidth / seasons.length}
                    height={plotHeight}
                    fill={isHovered ? '#1e293b' : 'transparent'}
                    fillOpacity={isHovered ? 0.4 : 0}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredSeason(s)}
                    onMouseLeave={() => setHoveredSeason(null)}
                  />

                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={svgHeight - paddingBottom}
                    stroke={isHovered ? '#38bdf8' : '#334155'}
                    strokeWidth={isHovered ? 2 : 1}
                    strokeDasharray={isHovered ? undefined : '2 2'}
                  />

                  {/* Libellé saison sur l'axe X */}
                  <text
                    x={x}
                    y={svgHeight - paddingBottom + 22}
                    textAnchor="middle"
                    fill={isHovered ? '#38bdf8' : '#cbd5e1'}
                    fontSize="12"
                    fontFamily="monospace"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredSeason(s)}
                    onMouseLeave={() => setHoveredSeason(null)}
                  >
                    {s}
                  </text>
                </g>
              );
            })}

            {/* Indicateur de sens de progression sur l'axe Y */}
            <text
              x={paddingLeft - 10}
              y={paddingTop - 15}
              textAnchor="end"
              fill="#10b981"
              fontSize="10"
              fontWeight="bold"
            >
              ▲ Meilleur
            </text>

            {/* TRACÉ DES LIGNES INDIVIDUELLES ET MOYENNE */}
            {seriesData.map(s => {
              if (hiddenSeries.has(s.id)) return null;
              if (s.points.length === 0) return null;

              // Construction du chemin SVG (path d)
              const pathD = s.points.reduce((acc, pt, i) => {
                const x = getX(pt.seasonIndex);
                const y = getY(pt.value);
                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '');

              const isHighlighted = hoveredRank === s.rank;
              const isOtherHovered = hoveredRank !== null && hoveredRank !== s.rank;

              return (
                <g 
                  key={s.id} 
                  opacity={isOtherHovered ? 0.25 : 1} 
                  className="transition-opacity duration-200"
                >
                  {/* Ligne connectrice */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={s.isAverage ? 'url(#avg-glow)' : s.color}
                    strokeWidth={s.isAverage ? (isHighlighted ? 4.5 : 3.5) : (isHighlighted ? 3.5 : 2.5)}
                    strokeDasharray={s.isAverage ? '7 5' : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#shadow)"
                  />

                  {/* Marqueurs sur chaque point */}
                  {s.points.map(pt => {
                    const x = getX(pt.seasonIndex);
                    const y = getY(pt.value);
                    const isSeasonHovered = hoveredSeason === pt.season;

                    if (s.isAverage) {
                      // Marqueur losange distinctif pour la moyenne
                      return (
                        <g 
                          key={`${s.id}-${pt.season}`}
                          className="cursor-pointer"
                          onMouseEnter={() => {
                            setHoveredSeason(pt.season);
                            setHoveredRank('AVG');
                          }}
                          onMouseLeave={() => {
                            setHoveredSeason(null);
                            setHoveredRank(null);
                          }}
                        >
                          <polygon
                            points={`${x},${y - (isSeasonHovered ? 8 : 6)} ${x + (isSeasonHovered ? 8 : 6)},${y} ${x},${y + (isSeasonHovered ? 8 : 6)} ${x - (isSeasonHovered ? 8 : 6)},${y}`}
                            fill="#F59E0B"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            filter="url(#shadow)"
                            className="transition-transform duration-200"
                          />
                        </g>
                      );
                    }

                    // Marqueur circulaire avec bague
                    return (
                      <g 
                        key={`${s.id}-${pt.season}`}
                        className="cursor-pointer"
                        onMouseEnter={() => {
                          setHoveredSeason(pt.season);
                          setHoveredRank(s.rank);
                        }}
                        onMouseLeave={() => {
                          setHoveredSeason(null);
                          setHoveredRank(null);
                        }}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={isSeasonHovered || isHighlighted ? 7 : 5}
                          fill={s.color}
                          stroke="#0f172a"
                          strokeWidth="2.5"
                          filter="url(#shadow)"
                          className="transition-all duration-200"
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* BANDEAU DÉTAILLÉ DE LA SAISON SURVOLÉE OU RÉSUMÉ RECAP */}
      {activeHoverSeasonData ? (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 animate-fade-in shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-sm text-white font-mono">
                Saison {activeHoverSeasonData.season}
              </span>
              <span className="text-xs text-slate-400">
                · {activeHoverSeasonData.items.length} athlètes répertoriés
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-amber-300 font-bold">Moyenne Top {topLimit} :</span>
              <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/50 font-bold">
                {activeHoverSeasonData.avgDisplay}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 text-xs">
            {activeHoverSeasonData.items.map((item, idx) => {
              const r = idx + 1;
              const colorConf = RANK_COLORS[(r - 1) % RANK_COLORS.length];
              return (
                <div 
                  key={item.record.id || `${item.record.athleteId}-${r}`}
                  className={`p-2 rounded-lg bg-slate-900 border ${colorConf?.border || 'border-slate-800'} space-y-1`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono font-bold text-[11px] ${colorConf?.text || 'text-slate-400'}`}>
                      #{r}
                    </span>
                    <span className="font-mono font-bold text-white">
                      {formatPerformanceDisplay(item.record.performanceValue, item.record.nature, discipline)}
                    </span>
                  </div>
                  <div className="truncate text-slate-300 text-[11px] font-medium" title={item.record.athleteName}>
                    {onSelectAthlete ? (
                      <button 
                        onClick={() => onSelectAthlete(item.record.athleteName)}
                        className="text-sky-400 hover:underline cursor-pointer truncate max-w-full block text-left"
                      >
                        {item.record.athleteName}
                      </button>
                    ) : (
                      item.record.athleteName
                    )}
                  </div>
                  {item.record.club && (
                    <div className="truncate text-slate-500 text-[10px]" title={item.record.club}>
                      {item.record.club}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-400 px-2 pt-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Survolez une saison ou un marqueur pour afficher le détail nominatif et les performances de chaque rang.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            {seasons.join(' → ')}
          </span>
        </div>
      )}

    </div>
  );
};
