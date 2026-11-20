import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Activity, 
  Users, 
  MapPin, 
  FileSpreadsheet, 
  FileText, 
  FileDown, 
  TrendingUp, 
  Layers, 
  BarChart2, 
  Medal,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PerformanceRecord } from '../../types/athletics';
import { 
  computeAnnualBilan,
  formatPerformanceDisplay, 
  getDisciplineNature, 
  isBetterPerformance,
  RankedBilanEntry,
  cleanDisciplineBaseName,
  matchDiscipline,
  getPerfAjustee,
  normalizeDistanceValue,
  isIndoorRecord,
  isFFAOfficialIndoorCode
} from '../../utils/performanceUtils';
import { getFilteredOfficialDisciplines } from '../../data/officialDisciplines';
import { StorageService } from '../../services/storageService';
import { exportToExcel, exportToPDF, exportToWord } from '../../utils/exportUtils';
import { PerformanceEvolutionChart } from '../charts/PerformanceEvolutionChart';
import { FranceDisciplineMap } from '../charts/FranceDisciplineMap';

interface DisciplineReportViewProps {
  records: PerformanceRecord[];
  selectedDiscipline?: string;
  onSelectDiscipline: (discipline: string) => void;
  onSelectAthlete: (athleteName: string) => void;
}

const DisciplineReportViewComponent: React.FC<DisciplineReportViewProps> = ({
  records,
  selectedDiscipline,
  onSelectDiscipline,
  onSelectAthlete,
}) => {
  // 1. Filtrage par sexe (Masculin par défaut, ou selon l'épreuve active)
  const [selectedSexe, setSelectedSexe] = useState<'M' | 'F' | 'ALL'>('M');

  // Épreuves officielles de la FFA filtrées strictement par sexe (épreuves féminines ou masculines)
  const officialDisciplineGroups = useMemo(() => {
    return getFilteredOfficialDisciplines('ALL', 'ALL', selectedSexe);
  }, [selectedSexe]);

  const allOfficialLabels = useMemo(() => {
    const set = new Set<string>();
    officialDisciplineGroups.forEach(g => g.items.forEach(d => set.add(d)));
    return set;
  }, [officialDisciplineGroups]);

  // Changement de sexe avec adaptation automatique de l'épreuve sélectionnée
  const handleSexeChange = (newSexe: 'M' | 'F' | 'ALL') => {
    setSelectedSexe(newSexe);
    const newGroups = getFilteredOfficialDisciplines('ALL', 'ALL', newSexe);
    const newLabels = new Set<string>();
    newGroups.forEach(g => g.items.forEach(d => newLabels.add(d)));

    // Si l'épreuve actuellement sélectionnée n'existe pas dans le nouveau sexe (ex: 110m Haies en Féminin)
    if (!newLabels.has(currentDiscipline)) {
      const cleanSel = cleanDisciplineBaseName(currentDiscipline);
      let matchedDisc: string | null = null;
      for (const group of newGroups) {
        for (const item of group.items) {
          if (cleanDisciplineBaseName(item) === cleanSel) {
            matchedDisc = item;
            break;
          }
        }
        if (matchedDisc) break;
      }
      const fallback = matchedDisc || (newLabels.has('100m-110') ? '100m-110' : (newGroups[0]?.items[0] || '100m-110'));
      onSelectDiscipline(fallback);
    }
  };

  // Résolution stricte de l'épreuve active (format officiel "100m-110", "60m salle-107", etc.)
  const currentDiscipline = useMemo(() => {
    if (selectedDiscipline && allOfficialLabels.has(selectedDiscipline)) {
      return selectedDiscipline;
    }
    if (selectedDiscipline) {
      const cleanSel = cleanDisciplineBaseName(selectedDiscipline);
      for (const group of officialDisciplineGroups) {
        for (const item of group.items) {
          if (cleanDisciplineBaseName(item) === cleanSel) {
            return item;
          }
        }
      }
    }
    return allOfficialLabels.has('100m-110') ? '100m-110' : (officialDisciplineGroups[0]?.items[0] || '100m-110');
  }, [selectedDiscipline, allOfficialLabels, officialDisciplineGroups]);

  const targetCode = currentDiscipline.match(/-(\d+)$/)?.[1] || '';
  const isSalleDiscipline = currentDiscipline.toLowerCase().includes('salle') || 
                            currentDiscipline.startsWith('60m') || 
                            isFFAOfficialIndoorCode(targetCode);
  const targetStructure: 'SALLE' | 'EXTERIEUR' = isSalleDiscipline ? 'SALLE' : 'EXTERIEUR';
  const nature = getDisciplineNature(currentDiscipline);

  // 2. Fichiers bilans officiels répertoriés
  const officialSeasonFiles = useMemo(() => {
    return StorageService.getOfficialSeasonFiles();
  }, []);

  // Saisons disponibles dans le jeu de données
  const availableSeasons = useMemo(() => {
    const set = new Set<string>();
    officialSeasonFiles.forEach(f => {
      if (f.seasonLabel) set.add(f.seasonLabel);
    });
    records.forEach(r => {
      if (r.saisonLabel) set.add(r.saisonLabel);
      else if (r.saison) set.add(r.saison === 2026 ? '2025-2026' : `${r.saison - 1}-${r.saison}`);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records, officialSeasonFiles]);

  // Saison active (2025-2026 par défaut, ou première disponible)
  const [selectedSeason, setSelectedSeason] = useState<string>(() => {
    return '2025-2026';
  });

  // Filtrage par nationalité (France vs Toutes)
  const [selectedNationality, setSelectedNationality] = useState<'FRA' | 'ALL'>('FRA');

  // État des accordéons (DE BASE, TOUS LES ACCORDÉONS SONT FERMÉS)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    kpi: false,
    ranking: false,
    seasons: false,
    levels: false,
    categories: false,
    map: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    setOpenSections({
      kpi: true,
      ranking: true,
      seasons: true,
      levels: true,
      categories: true,
      map: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      kpi: false,
      ranking: false,
      seasons: false,
      levels: false,
      categories: false,
      map: false,
    });
  };

  // Fichier bilan officiel de référence pour la saison et la structure de l'épreuve
  const referenceBilanFile = useMemo(() => {
    if (selectedSeason === 'all') return null;

    // 1. Recherche exacte saison + structure (ou COMBINE) dans le catalogue
    const match = officialSeasonFiles.find(f => 
      (f.seasonLabel === selectedSeason || String(f.endYear) === selectedSeason) &&
      (f.structure === targetStructure || f.structure === 'COMBINE')
    );
    if (match) return match;

    // 2. Recherche directe dans les enregistrements réels en mémoire
    const recordWithSource = records.find(r => {
      const sLab = r.saisonLabel || (r.saison === 2026 ? '2025-2026' : (r.saison ? `${r.saison - 1}-${r.saison}` : ''));
      const matchSeason = sLab === selectedSeason || String(r.saison) === selectedSeason;
      const isRecIndoor = isIndoorRecord(r.discipline, r.code_ep, r.structure, r.sourceFile, r.lieu);
      const matchStruct = targetStructure === 'SALLE' ? isRecIndoor : !isRecIndoor;
      return matchSeason && matchStruct && r.sourceFile;
    });

    if (recordWithSource?.sourceFile) {
      return {
        id: `${selectedSeason}_${targetStructure}`,
        seasonLabel: selectedSeason,
        startYear: parseInt(selectedSeason.split('-')[0], 10) || 2025,
        endYear: parseInt(selectedSeason.split('-')[1], 10) || 2026,
        structure: targetStructure,
        fileName: recordWithSource.sourceFile,
        recordCount: records.filter(r => r.sourceFile === recordWithSource.sourceFile).length,
      };
    }

    // 3. Repli de sécurité certifié pour 2025-2026 si aucune donnée utilisateur
    if (selectedSeason === '2025-2026' || selectedSeason === '2026') {
      if (targetStructure === 'EXTERIEUR') {
        return {
          id: '2025-2026_EXTERIEUR',
          seasonLabel: '2025-2026',
          startYear: 2025,
          endYear: 2026,
          structure: 'EXTERIEUR' as const,
          fileName: 'Rslts PISTE 25-26.csv',
          recordCount: 930
        };
      } else {
        return {
          id: '2025-2026_SALLE',
          seasonLabel: '2025-2026',
          startYear: 2025,
          endYear: 2026,
          structure: 'SALLE' as const,
          fileName: 'Rslts salle 25-26.csv',
          recordCount: 672
        };
      }
    }

    return null;
  }, [officialSeasonFiles, records, selectedSeason, targetStructure]);

  // Fichiers disponibles pour la saison active (combinant catalogue officiel et fichiers réels en mémoire)
  const availableFilesForSeason = useMemo(() => {
    const fileSet = new Map<string, { id?: string; fileName: string; structure: string; recordCount?: number }>();
    
    officialSeasonFiles.forEach(f => {
      const matchSeason = selectedSeason === 'all' || f.seasonLabel === selectedSeason || String(f.endYear) === selectedSeason;
      if (matchSeason) {
        fileSet.set(f.fileName, f);
      }
    });

    records.forEach(r => {
      const sLab = r.saisonLabel || (r.saison === 2026 ? '2025-2026' : (r.saison ? `${r.saison - 1}-${r.saison}` : ''));
      const matchSeason = selectedSeason === 'all' || sLab === selectedSeason || String(r.saison) === selectedSeason;
      if (matchSeason && r.sourceFile && !fileSet.has(r.sourceFile)) {
        fileSet.set(r.sourceFile, {
          id: `file-${r.sourceFile}`,
          fileName: r.sourceFile,
          structure: r.structure || 'EXTERIEUR',
        });
      }
    });

    return Array.from(fileSet.values());
  }, [officialSeasonFiles, records, selectedSeason]);

  const [selectedFileFilter, setSelectedFileFilter] = useState<string>('AUTO');

  // Performances brutes pour cette discipline, rigoureusement extraites du fichier bilan correspondant
  const disciplineRecords = useMemo(() => {
    const is100m = currentDiscipline.includes('100m') || targetCode === '110';

    const filtered = records.filter(r => {
      // RÈGLE OFFICIELLE STRICTE 100m : code_ep === '110' et extérieur impératifs
      if (is100m) {
        if (String(r.code_ep || '').trim() !== '110') return false;
        if (r.structure === 'SALLE') return false;
        if (r.sourceFile && r.sourceFile.toLowerCase().includes('salle')) return false;
      }

      // 1. Filtrage strict par code_ep fédéral (ex: 110 pour 100m)
      if (!matchDiscipline(r.discipline, r.code_ep, r.structure, currentDiscipline)) return false;

      // 2. Filtrage par saison
      if (selectedSeason !== 'all') {
        const sLab = r.saisonLabel || (r.saison === 2026 ? '2025-2026' : (r.saison ? `${r.saison - 1}-${r.saison}` : ''));
        const matchSeason = sLab === selectedSeason || String(r.saison) === selectedSeason;
        if (!matchSeason) return false;
      }

      // 3. Filtrage par sexe
      if (selectedSexe !== 'ALL') {
        const rSexe = (r.sexe || '').toUpperCase().trim();
        if (rSexe && rSexe !== selectedSexe) return false;
      }

      // 4. Filtrage par structure cohérente avec l'épreuve officielle
      const isRecIndoor = isIndoorRecord(r.discipline, r.code_ep, r.structure, r.sourceFile, r.lieu);
      if (targetStructure === 'SALLE') {
        if (!isRecIndoor && r.structure === 'EXTERIEUR') return false;
        if (r.sourceFile && r.sourceFile.toLowerCase().includes('piste') && !isRecIndoor) return false;
      } else {
        // Plein air / Piste
        if (isRecIndoor || r.structure === 'SALLE') return false;
        if (r.sourceFile && r.sourceFile.toLowerCase().includes('salle') && !r.sourceFile.toLowerCase().includes('piste')) return false;
      }

      // 5. Filtrage par nationalité (France vs Toutes)
      if (selectedNationality !== 'ALL') {
        const nat = (r.nationalite || 'FRA').toUpperCase().trim();
        if (nat !== selectedNationality) return false;
      }

      return true;
    });

    // 6. Priorité absolue aux fichiers réels importés par l'utilisateur :
    // Si l'utilisateur a importé son propre bilan contenant des données pour cette épreuve,
    // on exclut automatiquement les enregistrements de démo synthétiques pour ne pas polluer l'affichage.
    const hasRealUserRecords = filtered.some(r => {
      const isDemo = (typeof r.id === 'string' && (r.id.startsWith('salle-2026-') || r.id.startsWith('piste-2026-') || r.id.startsWith('rec-demo-'))) ||
                     r.sourceFile === 'Rslts salle 25-26.csv' || r.sourceFile === 'Rslts PISTE 25-26.csv';
      return !isDemo;
    });

    const candidateRecords = hasRealUserRecords
      ? filtered.filter(r => {
          const isDemo = (typeof r.id === 'string' && (r.id.startsWith('salle-2026-') || r.id.startsWith('piste-2026-') || r.id.startsWith('rec-demo-'))) ||
                         r.sourceFile === 'Rslts salle 25-26.csv' || r.sourceFile === 'Rslts PISTE 25-26.csv';
          return !isDemo;
        })
      : filtered;

    return candidateRecords.sort((a, b) => {
      return isBetterPerformance(a.performanceValue, b.performanceValue, nature) ? -1 : 1;
    });
  }, [records, currentDiscipline, targetCode, selectedSeason, selectedSexe, targetStructure, selectedNationality, nature]);


  // -------------------------------------------------------------
  // CLASSEMENT OFFICIEL DES MEILLEURS ATHLÈTES SELON LA LOGIQUE DES BILANS
  // 1. Calcul direct sur disciplineRecords (garantie absolue de provenance du bon fichier bilan et code épreuve)
  // 2. Meilleure performance unique retenue par athlète
  // 3. Priorité aux performances homologuées avec vent régulier (<= +2.0 m/s)
  // 4. Règle stricte : jamais de record ni de classement faussé par vent > +2.0 m/s
  // -------------------------------------------------------------
  // Choix du nombre d'athlètes du classement (Top 3, 5, 8, 10, 12, 16, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100)
  const [topLimit, setTopLimit] = useState<number>(10);

  const rankedBilanEntries = useMemo(() => {
    // Calcul direct sur disciplineRecords pour inclure TOUS les athlètes de la sélection
    // disciplineRecords est déjà rigoureusement filtré par saison, sexe, nationalité, épreuve.
    // On passe ventCondition: 'TOUS' pour ne jamais exclure d'athlète (un athlète ayant couru avec vent > 2m/s
    // reste classé avec son vent), tout en garantissant la priorité aux marques régulières.
    return computeAnnualBilan(disciplineRecords, {
      discipline: currentDiscipline,
      seasonPeriod: 'all', // Déjà filtré par disciplineRecords
      sexe: selectedSexe,
      categorie: 'ALL',
      structure: targetStructure,
      ventCondition: 'TOUS',
      region: 'ALL',
      departement: 'ALL',
      club: 'ALL',
      nationalite: selectedNationality,
      perfLimitPerAthlete: 1, // 1 meilleure perf par athlète
      perfCalcMode: 'BEST',
    });
  }, [disciplineRecords, currentDiscipline, selectedSexe, selectedNationality, targetStructure]);

  // Top athlètes selon la sélection (Top 3, 5, 8, 10, 12, etc.)
  // RÈGLE OFFICIELLE : Si les athlètes suivants (ex: 11e, 12e...) ont la même performance que le dernier athlète qualifié,
  // ils doivent TOUS apparaître dans la liste (ex-æquo).
  const topPerformers = useMemo(() => {
    if (rankedBilanEntries.length <= topLimit) {
      return rankedBilanEntries;
    }

    const cutoffPerf = getPerfAjustee(rankedBilanEntries[topLimit - 1].record);

    let endIndex = topLimit;
    while (
      endIndex < rankedBilanEntries.length &&
      Math.abs(getPerfAjustee(rankedBilanEntries[endIndex].record) - cutoffPerf) < 0.001
    ) {
      endIndex++;
    }

    return rankedBilanEntries.slice(0, endIndex);
  }, [rankedBilanEntries, topLimit]);

  // Stats consolidées pour cette discipline officielle
  const stats = useMemo(() => {
    if (disciplineRecords.length === 0) {
      return null;
    }

    // 1. Nombre total d'athlètes uniques ayant concouru dans cette discipline (1 meilleure performance par athlète)
    const athletesCount = rankedBilanEntries.length;

    // 2. Meilleure marque de la discipline
    const bestRec = rankedBilanEntries[0]?.record || disciplineRecords[0];
    const bestValueNorm = nature === 'distance' 
      ? normalizeDistanceValue(bestRec.performanceValue, currentDiscipline) 
      : bestRec.performanceValue;

    // 3. Moyenne Globale : calculée sur la meilleure performance de CHAQUE athlète référencé dans cette discipline
    // (exactement athletesCount athlètes, évitant tout biais de répétition de performances)
    let sumUniqueBest = 0;
    const sortedBestValues: number[] = [];
    for (let i = 0; i < rankedBilanEntries.length; i++) {
      const rawVal = rankedBilanEntries[i].record.performanceValue;
      const val = nature === 'distance' ? normalizeDistanceValue(rawVal, currentDiscipline) : rawVal;
      sumUniqueBest += val;
      sortedBestValues.push(val);
    }
    const globalAvg = athletesCount > 0 ? sumUniqueBest / athletesCount : 0;
    const globalAverageDisplay = formatPerformanceDisplay(globalAvg, nature, currentDiscipline);

    // 4. Moyenne sur le Top sélectionné (Top 3, Top 10, etc.)
    let sumTop = 0;
    for (let i = 0; i < topPerformers.length; i++) {
      const rawVal = topPerformers[i].record.performanceValue;
      const val = nature === 'distance' ? normalizeDistanceValue(rawVal, currentDiscipline) : rawVal;
      sumTop += val;
    }
    const topAvg = topPerformers.length > 0 ? sumTop / topPerformers.length : 0;
    const topAverageDisplay = formatPerformanceDisplay(topAvg, nature, currentDiscipline);

    // 5. Médiane globale (milieu de distribution des meilleures marques des athlètes)
    const midIndex = Math.floor(sortedBestValues.length / 2);
    const medianVal = sortedBestValues[midIndex] ?? 0;
    const medianDisplay = formatPerformanceDisplay(medianVal, nature, currentDiscipline);

    const seasonsSet = new Set<number>();
    disciplineRecords.forEach(r => seasonsSet.add(r.saison));

    return {
      discipline: currentDiscipline,
      nature,
      count: disciplineRecords.length,
      athletesCount,
      bestValue: bestValueNorm,
      bestDisplay: formatPerformanceDisplay(bestValueNorm, nature, currentDiscipline),
      bestAthlete: bestRec.athleteName,
      globalAvg,
      globalAverageDisplay,
      topAvg,
      topAverageDisplay,
      medianValue: medianVal,
      medianDisplay,
      seasons: Array.from(seasonsSet).sort((a, b) => a - b),
    };
  }, [disciplineRecords, rankedBilanEntries, topPerformers, currentDiscipline, nature]);

  // Meilleure marque de référence (identique au bilan officiel)
  const bestBilanRecord = rankedBilanEntries[0]?.record || null;
  const bestMarkDisplay = bestBilanRecord 
    ? formatPerformanceDisplay(bestBilanRecord.performanceValue, bestBilanRecord.nature, currentDiscipline)
    : (stats ? stats.bestDisplay : '-');
  const bestMarkAthlete = bestBilanRecord?.athleteName || stats?.bestAthlete || 'N/A';

  // Moyennes et athlètes par saison
  const seasonStats = useMemo(() => {
    const map = new Map<number, { sum: number; count: number; athletes: Set<string>; bestVal: number; bestDisplay: string }>();
    disciplineRecords.forEach(r => {
      const val = nature === 'distance' ? normalizeDistanceValue(r.performanceValue, currentDiscipline) : r.performanceValue;
      const existing = map.get(r.saison);
      if (!existing) {
        map.set(r.saison, {
          sum: val,
          count: 1,
          athletes: new Set([r.athleteName]),
          bestVal: val,
          bestDisplay: formatPerformanceDisplay(val, nature, currentDiscipline),
        });
      } else {
        existing.sum += val;
        existing.count += 1;
        existing.athletes.add(r.athleteName);
        if (isBetterPerformance(val, existing.bestVal, nature)) {
          existing.bestVal = val;
          existing.bestDisplay = formatPerformanceDisplay(val, nature, currentDiscipline);
        }
      }
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([saison, d]) => {
        const avg = d.sum / d.count;
        return {
          saison,
          count: d.count,
          athletesCount: d.athletes.size,
          averageDisplay: formatPerformanceDisplay(avg, nature, currentDiscipline),
          bestDisplay: d.bestDisplay,
        };
      });
  }, [disciplineRecords, nature, currentDiscipline]);

  // Répartition par niveau de performance selon la grille officielle FFA (IA, IB, N1-N4, IR1-IR4, R1-R6, D1-D8)
  const levelDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    disciplineRecords.forEach(r => {
      const lvl = (r.niveau || 'NC').toUpperCase().trim();
      counts.set(lvl, (counts.get(lvl) || 0) + 1);
    });

    const FFA_LEVEL_ORDER = [
      'IA', 'IB',
      'N1', 'N2', 'N3', 'N4',
      'IR1', 'IR2', 'IR3', 'IR4',
      'R1', 'R2', 'R3', 'R4', 'R5', 'R6',
      'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8',
      'NC'
    ];

    const total = disciplineRecords.length;

    const sortedLevels = Array.from(counts.entries()).sort(([a], [b]) => {
      const idxA = FFA_LEVEL_ORDER.indexOf(a);
      const idxB = FFA_LEVEL_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const maxCount = Math.max(...sortedLevels.map(([, c]) => c), 1);

    const getLevelTier = (lvl: string) => {
      if (lvl.startsWith('I') && (lvl === 'IA' || lvl === 'IB')) {
        return { label: 'International', badge: 'bg-purple-900/60 text-purple-300 border-purple-600/50', bar: 'from-purple-600 via-indigo-500 to-amber-400' };
      }
      if (lvl.startsWith('N')) {
        return { label: 'National', badge: 'bg-rose-900/60 text-rose-300 border-rose-600/50', bar: 'from-rose-600 via-pink-500 to-amber-500' };
      }
      if (lvl.startsWith('IR')) {
        return { label: 'Interrégional', badge: 'bg-sky-900/60 text-sky-300 border-sky-600/50', bar: 'from-blue-600 via-sky-500 to-cyan-400' };
      }
      if (lvl.startsWith('R')) {
        return { label: 'Régional', badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-600/50', bar: 'from-emerald-600 via-teal-500 to-green-400' };
      }
      if (lvl.startsWith('D')) {
        return { label: 'Départemental', badge: 'bg-amber-900/60 text-amber-300 border-amber-600/50', bar: 'from-amber-600 via-yellow-500 to-orange-400' };
      }
      return { label: 'Non classé', badge: 'bg-slate-800 text-slate-300 border-slate-700', bar: 'from-slate-600 to-slate-400' };
    };

    return sortedLevels.map(([niveau, count]) => {
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      const barWidth = Math.max(Math.round((count / maxCount) * 100), 5);
      const tier = getLevelTier(niveau);
      return {
        niveau,
        count,
        percent,
        barWidth,
        tier,
      };
    });
  }, [disciplineRecords]);

  // Contrôles interactifs pour la statistique des catégories et années
  const [categoryMetric, setCategoryMetric] = useState<'athletes' | 'perfs'>('athletes');
  const [selectedCategoryYear, setSelectedCategoryYear] = useState<number | 'ALL'>('ALL');
  const [hoveredBar, setHoveredBar] = useState<{
    catLabel: string;
    catKey: string;
    seasonLabel: string;
    year: number;
    value: number;
    malesCount?: number;
    femalesCount?: number;
    isTotal?: boolean;
    pctOfSeason?: number;
  } | null>(null);

  // Tous les enregistrements de la discipline sur l'ensemble des saisons
  // (permet une vue transversale multi-annuelle des catégories et pratiquants)
  const allSeasonsDisciplineRecords = useMemo(() => {
    const is100m = currentDiscipline.includes('100m') || targetCode === '110';

    return records.filter(r => {
      if (is100m) {
        if (String(r.code_ep || '').trim() !== '110') return false;
        if (r.structure === 'SALLE') return false;
        if (r.sourceFile && r.sourceFile.toLowerCase().includes('salle')) return false;
      }

      if (!matchDiscipline(r.discipline, r.code_ep, r.structure, currentDiscipline)) return false;

      if (selectedSexe !== 'ALL') {
        const rSexe = (r.sexe || '').toUpperCase().trim();
        if (rSexe && rSexe !== selectedSexe) return false;
      }

      const isRecIndoor = isIndoorRecord(r.discipline, r.code_ep, r.structure, r.sourceFile, r.lieu);
      if (targetStructure === 'SALLE') {
        if (!isRecIndoor && r.structure === 'EXTERIEUR') return false;
        if (r.sourceFile && r.sourceFile.toLowerCase().includes('piste') && !isRecIndoor) return false;
      } else {
        if (isRecIndoor || r.structure === 'SALLE') return false;
      }

      if (selectedNationality === 'FRA' && r.nationalite && r.nationalite.toUpperCase().trim() !== 'FRA') {
        return false;
      }

      return true;
    });
  }, [records, currentDiscipline, targetCode, selectedSexe, targetStructure, selectedNationality]);

  // Données statistiques croisées par Catégorie FFA et par Année/Saison
  const categoryStatsData = useMemo(() => {
    // 1. Détecter toutes les saisons/années représentées dans la discipline
    const yearsSet = new Set<number>();
    allSeasonsDisciplineRecords.forEach(r => {
      if (r.saison) yearsSet.add(r.saison);
    });
    const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);

    // 2. Fonction de normalisation des catégories FFA
    const normalizeCatKey = (catRaw?: string): string => {
      if (!catRaw) return 'AUTRE';
      const up = catRaw.toUpperCase().trim();
      if (up.startsWith('EA') || up === 'EVE') return 'EA';
      if (up.startsWith('PO')) return 'PO';
      if (up.startsWith('BE')) return 'BE';
      if (up.startsWith('MI')) return 'MI';
      if (up.startsWith('CA')) return 'CA';
      if (up.startsWith('JU')) return 'JU';
      if (up.startsWith('ES')) return 'ES';
      if (up.startsWith('SE')) return 'SE';
      if (
        up.startsWith('MA') ||
        up.startsWith('M0') ||
        up.startsWith('M1') ||
        up.startsWith('M2') ||
        up.startsWith('M3') ||
        up.startsWith('M4') ||
        up.startsWith('M5') ||
        up.startsWith('M6') ||
        up.startsWith('M7') ||
        up.startsWith('M8') ||
        up.startsWith('M9') ||
        up.startsWith('VE')
      ) {
        return 'MA';
      }
      return 'AUTRE';
    };

    const CATEGORY_DEFINITIONS: Record<
      string,
      { label: string; fullTitle: string; order: number; badgeColor: string; barColor: string }
    > = {
      EA: { label: 'Éveil Athlé', fullTitle: 'Éveil Athlétique (U10)', order: 1, badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-700/50', barColor: 'from-rose-500 to-pink-500' },
      PO: { label: 'Poussin(e)', fullTitle: 'Poussin(e) (U12)', order: 2, badgeColor: 'bg-orange-950/80 text-orange-300 border-orange-700/50', barColor: 'from-orange-500 to-amber-500' },
      BE: { label: 'Benjamin(e)', fullTitle: 'Benjamin(e) (U14)', order: 3, badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-700/50', barColor: 'from-amber-500 to-yellow-500' },
      MI: { label: 'Minime', fullTitle: 'Minime (U16)', order: 4, badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50', barColor: 'from-emerald-500 to-teal-500' },
      CA: { label: 'Cadet(te)', fullTitle: 'Cadet(te) (U18)', order: 5, badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50', barColor: 'from-cyan-500 to-sky-500' },
      JU: { label: 'Junior', fullTitle: 'Junior (U20)', order: 6, badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-700/50', barColor: 'from-blue-500 to-indigo-500' },
      ES: { label: 'Espoir', fullTitle: 'Espoir (U23)', order: 7, badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50', barColor: 'from-indigo-500 to-purple-500' },
      SE: { label: 'Senior', fullTitle: 'Senior (23 - 34 ans)', order: 8, badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-700/50', barColor: 'from-purple-500 to-fuchsia-500' },
      MA: { label: 'Master', fullTitle: 'Master (35 ans et +)', order: 9, badgeColor: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-700/50', barColor: 'from-fuchsia-500 to-pink-500' },
      AUTRE: { label: 'Autre', fullTitle: 'Autre / Non précisé', order: 10, badgeColor: 'bg-slate-900 text-slate-400 border-slate-700', barColor: 'from-slate-600 to-slate-400' },
    };

    // Aggrégation des données
    const catMap = new Map<
      string,
      {
        athletesAllYears: Set<string>;
        perfsAllYears: number;
        malesAllYears: Set<string>;
        femalesAllYears: Set<string>;
        perYear: Map<number, { athletes: Set<string>; perfs: number; males: Set<string>; females: Set<string> }>;
      }
    >();

    const yearTotalsMap = new Map<number, { athletes: Set<string>; perfs: number }>();
    sortedYears.forEach(y => {
      yearTotalsMap.set(y, { athletes: new Set<string>(), perfs: 0 });
    });

    const grandAthletes = new Set<string>();
    let grandPerfs = 0;

    allSeasonsDisciplineRecords.forEach(r => {
      const catKey = normalizeCatKey(r.categorie);
      const athleteId = r.athleteName || r.athleteId;
      const yr = r.saison || 0;
      const isMale = (r.sexe || '').toUpperCase().trim() === 'M';

      if (!catMap.has(catKey)) {
        catMap.set(catKey, {
          athletesAllYears: new Set(),
          perfsAllYears: 0,
          malesAllYears: new Set(),
          femalesAllYears: new Set(),
          perYear: new Map(),
        });
      }

      const catEntry = catMap.get(catKey)!;
      catEntry.athletesAllYears.add(athleteId);
      catEntry.perfsAllYears += 1;
      if (isMale) catEntry.malesAllYears.add(athleteId);
      else catEntry.femalesAllYears.add(athleteId);

      if (yr > 0) {
        if (!catEntry.perYear.has(yr)) {
          catEntry.perYear.set(yr, {
            athletes: new Set(),
            perfs: 0,
            males: new Set(),
            females: new Set(),
          });
        }
        const yrEntry = catEntry.perYear.get(yr)!;
        yrEntry.athletes.add(athleteId);
        yrEntry.perfs += 1;
        if (isMale) yrEntry.males.add(athleteId);
        else yrEntry.females.add(athleteId);

        const yTot = yearTotalsMap.get(yr);
        if (yTot) {
          yTot.athletes.add(athleteId);
          yTot.perfs += 1;
        }
      }

      grandAthletes.add(athleteId);
      grandPerfs += 1;
    });

    // Ordonner les lignes selon l'ordre officiel FFA
    const rows = Array.from(catMap.entries())
      .map(([catKey, data]) => {
        const def = CATEGORY_DEFINITIONS[catKey] || CATEGORY_DEFINITIONS.AUTRE;
        return {
          catKey,
          label: def.label,
          fullTitle: def.fullTitle,
          order: def.order,
          badgeColor: def.badgeColor,
          barColor: def.barColor,
          athletesCount: data.athletesAllYears.size,
          perfsCount: data.perfsAllYears,
          malesCount: data.malesAllYears.size,
          femalesCount: data.femalesAllYears.size,
          percentAthletes: grandAthletes.size > 0 ? Math.round((data.athletesAllYears.size / grandAthletes.size) * 100) : 0,
          percentPerfs: grandPerfs > 0 ? Math.round((data.perfsAllYears / grandPerfs) * 100) : 0,
          yearsData: sortedYears.map(yr => {
            const yrData = data.perYear.get(yr);
            return {
              year: yr,
              athletesCount: yrData ? yrData.athletes.size : 0,
              perfsCount: yrData ? yrData.perfs : 0,
              malesCount: yrData ? yrData.males.size : 0,
              femalesCount: yrData ? yrData.females.size : 0,
            };
          }),
        };
      })
      .sort((a, b) => a.order - b.order);

    const yearTotals = sortedYears.map(yr => {
      const yTot = yearTotalsMap.get(yr)!;
      return {
        year: yr,
        athletesCount: yTot.athletes.size,
        perfsCount: yTot.perfs,
      };
    });

    const maxYearAthletes = Math.max(...yearTotals.map(y => y.athletesCount), 1);
    const maxYearPerfs = Math.max(...yearTotals.map(y => y.perfsCount), 1);

    // Trouver la catégorie N°1
    const topCategory = rows.slice().sort((a, b) => b.athletesCount - a.athletesCount)[0] || null;

    return {
      sortedYears,
      rows,
      yearTotals,
      grandTotalAthletes: grandAthletes.size,
      grandTotalPerfs: grandPerfs,
      topCategory,
      maxYearAthletes,
      maxYearPerfs,
    };
  }, [allSeasonsDisciplineRecords]);

  // Exports
  const handleExportDisciplineExcel = () => {
    exportToExcel(disciplineRecords, `Bilan_${currentDiscipline.replace(/\s+/g, '_')}`);
  };

  const handleExportDisciplineWord = () => {
    exportToWord(
      `Rapport Officiel de Discipline : ${currentDiscipline}`,
      `Fédération Française d'Athlétisme · Synthèse Technique et Historique`,
      [
        {
          heading: '1. Métriques et Records Homologués',
          text: `La discipline compte ${disciplineRecords.length} performances certifiées pour ${stats?.athletesCount || 0} athlètes référencés. Record de référence : ${stats?.bestDisplay || 'N/A'} détenu par ${stats?.bestAthlete || 'N/A'}. Moyenne globale : ${stats?.globalAverageDisplay || 'N/A'}. Moyenne Top ${topLimit} : ${stats?.topAverageDisplay || 'N/A'}. Médiane : ${stats?.medianDisplay || 'N/A'}.`,
        },
        {
          heading: `2. Top ${topLimit} Bilan Tous Temps`,
          tableHeaders: ['Rang', 'Athlète', 'Performance', 'Vent', 'Club', 'Entraîneur', 'Date', 'Niveau'],
          tableRows: topPerformers.map((entry) => [
            `#${entry.rank}`,
            entry.record.athleteName,
            formatPerformanceDisplay(entry.record.performanceValue, entry.record.nature, currentDiscipline),
            entry.record.vent !== null && entry.record.vent !== undefined ? `${entry.record.vent > 0 ? '+' : ''}${entry.record.vent}` : '-',
            entry.record.club,
            entry.record.entraineur,
            entry.record.date,
            entry.record.niveau,
          ]),
        },
        {
          heading: '3. Évolution par Saison Fédérale',
          tableHeaders: ['Saison', 'Engagés', 'Nombre de Performances', 'Moyenne Saison', 'Meilleure Marque'],
          tableRows: seasonStats.map(s => [
            String(s.saison),
            String(s.athletesCount),
            String(s.count),
            s.averageDisplay,
            s.bestDisplay,
          ]),
        }
      ],
      `Rapport_Discipline_${currentDiscipline.replace(/\s+/g, '_')}`
    );
  };

  const handleExportDisciplinePDF = () => {
    exportToPDF(
      `Rapport Fédéral : ${currentDiscipline}`,
      disciplineRecords,
      `Fiche_Discipline_${currentDiscipline.replace(/\s+/g, '_')}`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* DISCIPLINE SELECTOR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">
              Sélectionnez une Épreuve Officielle
            </h3>
            <p className="text-xs text-slate-400">
              {allOfficialLabels.size} épreuves officielles avec code épreuve FFA
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de Sexe AVANT le sélecteur d'épreuve (adapte la liste aux épreuves féminines ou masculines) */}
          <select
            value={selectedSexe}
            onChange={e => handleSexeChange(e.target.value as 'M' | 'F' | 'ALL')}
            className="bg-slate-950 border border-slate-700 hover:border-purple-500 rounded-xl px-3 py-1.5 text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
            title="Filtrer par sexe (adapte automatiquement les épreuves)"
          >
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
            <option value="ALL">Tous les sexes</option>
          </select>

          {/* Sélecteur de discipline officielle avec code épreuve */}
          <select
            value={currentDiscipline}
            onChange={e => onSelectDiscipline(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-sky-500 rounded-xl px-3 py-1.5 text-xs text-sky-300 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer min-w-[200px]"
          >
            {officialDisciplineGroups.map(grp => (
              <optgroup key={grp.family} label={`── ${grp.family} ──`}>
                {grp.items.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Sélecteur de saison */}
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500 shrink-0 cursor-pointer"
            title="Filtrer par saison fédérale"
          >
            <option value="all">Toutes saisons</option>
            {availableSeasons.map(s => (
              <option key={s} value={s}>Saison {s}</option>
            ))}
          </select>

          {/* Sélecteur de nationalité (France vs Toutes) */}
          <select
            value={selectedNationality}
            onChange={e => setSelectedNationality(e.target.value as 'FRA' | 'ALL')}
            className="bg-slate-950 border border-slate-700 hover:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-blue-300 font-bold focus:outline-none focus:border-blue-500 shrink-0 cursor-pointer"
            title="Filtrer par nationalité"
          >
            <option value="FRA">France</option>
            <option value="ALL">Toutes</option>
          </select>
        </div>
      </div>

      {!stats ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-lg">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-white">
            Aucune performance enregistrée pour {currentDiscipline}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Aucun résultat officiel avec le code épreuve {targetCode || 'fédéral'} n'a été trouvé {selectedSeason !== 'all' ? `sur la saison ${selectedSeason}` : ''}{selectedNationality === 'FRA' ? ' pour les athlètes de nationalité française' : ''}.
          </p>
        </div>
      ) : (
        <>
          {/* HEADER SUMMARY CARD */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-900/60 text-purple-300 border border-purple-700/50 font-bold font-mono">
                    {nature === 'time' ? 'Course / Chrono' : (nature === 'distance' ? 'Concours / Distance' : 'Épreuves Combinées')}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-950/70 text-indigo-300 border border-indigo-700/50 font-bold font-mono">
                    {selectedSexe === 'M' ? 'Masculin' : (selectedSexe === 'F' ? 'Féminin' : 'Tous sexes')}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-950/70 text-blue-300 border border-blue-700/50 font-bold font-mono">
                    {selectedNationality === 'FRA' ? 'Nationalité : France' : 'Toutes nationalités'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-sky-300 border border-slate-700 font-bold font-mono">
                    Code épreuve : {targetCode || 'N/A'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-mono">
                    {targetStructure === 'SALLE' ? 'En Salle' : 'Plein Air'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Saison {selectedSeason !== 'all' ? selectedSeason : stats.seasons.map(s => s === 2026 ? '2025-2026' : (s > 1900 ? `${s - 1}-${s}` : String(s))).join(', ')}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Bilan de Référence : {stats.discipline}
                </h2>

                <p className="text-xs text-slate-300 mt-2 max-w-xl">
                  Synthèse statistique consolidée du code épreuve <strong>{targetCode}</strong> regroupant <strong>{stats.count}</strong> performances certifiées et <strong>{stats.athletesCount}</strong> athlètes uniques.
                </p>
              </div>

              {/* Quick Exports */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleExportDisciplineExcel}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                  title="Exporter la discipline en Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>

                <button
                  onClick={handleExportDisciplineWord}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-sky-300 border border-blue-700/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                  title="Générer le rapport Word"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Word</span>
                </button>

                <button
                  onClick={handleExportDisciplinePDF}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-700/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                  title="Télécharger le PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>PDF</span>
                </button>
              </div>

            </div>
          </div>

          {/* BARRE D'ACCORDÉONS & CONTRÔLE RAPIDE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-sky-400" />
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Encarts d'Analyse & Cartographie
                </span>
                <span className="text-[11px] text-slate-400">
                  Accordéons fermés par défaut · Cliquez sur un bandeau pour déplier ses informations
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={expandAll}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 cursor-pointer transition-colors shadow-sm"
              >
                Tout déplier
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors shadow-sm"
              >
                Tout replier
              </button>
            </div>
          </div>

          {/* ============================================================= */}
          {/* 1. ACCORDÉON : INDICATEURS CLÉS & MOYENNES DE RÉFÉRENCE      */}
          {/* ============================================================= */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition-all">
            <button
              onClick={() => toggleSection('kpi')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Indicateurs Clés & Métriques de Référence
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Meilleure marque : <strong className="text-amber-400">{bestMarkDisplay}</strong> · Moyenne Top {topLimit} : <strong className="text-cyan-400">{stats.topAverageDisplay}</strong> · Moyenne globale : <strong className="text-emerald-400">{stats.globalAverageDisplay}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  5 indicateurs
                </span>
                {openSections.kpi ? (
                  <ChevronUp className="w-5 h-5 text-sky-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {openSections.kpi && (
              <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-950/30 animate-fade-in space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 block mb-1">Meilleure Marque Référencée</span>
                    <div className="text-2xl font-mono font-black text-amber-400">
                      {bestMarkDisplay}
                    </div>
                    <div className="text-xs text-slate-300 mt-1 truncate">
                      par <button onClick={() => onSelectAthlete(bestMarkAthlete)} className="text-sky-400 hover:underline">{bestMarkAthlete}</button>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 block mb-1">Moyenne Top {topLimit}</span>
                    <div className="text-2xl font-mono font-black text-cyan-400">
                      {stats.topAverageDisplay}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Sur les {topPerformers.length} meilleurs
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 block mb-1">Moyenne Globale</span>
                    <div className="text-2xl font-mono font-black text-emerald-400">
                      {stats.globalAverageDisplay}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Calculée sur {stats.athletesCount.toLocaleString('fr-FR')} athlètes
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 block mb-1">Médiane</span>
                    <div className="text-2xl font-mono font-black text-sky-400">
                      {stats.medianDisplay}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Milieu de distribution
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 col-span-2 md:col-span-1">
                    <span className="text-xs text-slate-400 block mb-1">Nombre d'athlètes</span>
                    <div className="text-2xl font-mono font-black text-purple-400">
                      {stats.athletesCount.toLocaleString('fr-FR')}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Sur {stats.count.toLocaleString('fr-FR')} perfs
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* 2. ACCORDÉON : CLASSEMENT DES MEILLEURS ATHLÈTES (TOP N)     */}
          {/* ============================================================= */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition-all">
            <button
              onClick={() => toggleSection('ranking')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Medal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Classement des Meilleurs Athlètes (Bilan Top {topLimit})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {topPerformers.length} athlètes répertoriés · Meilleure marque : <strong className="text-amber-400">{bestMarkDisplay}</strong> ({bestMarkAthlete})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-950/70 text-amber-300 border border-amber-800/50">
                  Top {topLimit}
                </span>
                {openSections.ranking ? (
                  <ChevronUp className="w-5 h-5 text-sky-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {openSections.ranking && (
              <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-950/30 animate-fade-in space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-300 font-semibold">
                      Bilan officiel des meilleurs performeurs sur {currentDiscipline} :
                    </span>
                    {topPerformers.length > topLimit && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-950/70 text-amber-300 border border-amber-800/50">
                        +{topPerformers.length - topLimit} ex-æquo ({topPerformers.length} athlètes)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label htmlFor="top-limit-selector" className="text-xs text-slate-400 font-medium">
                      Nombre d'athlètes :
                    </label>
                    <select
                      id="top-limit-selector"
                      value={topLimit}
                      onChange={e => setTopLimit(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-700 hover:border-amber-500 rounded-xl px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
                      title="Choisir le nombre d'athlètes du classement"
                    >
                      {[3, 5, 8, 10, 12, 16, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100].map(n => (
                        <option key={n} value={n}>Top {n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-3 font-semibold">Rang</th>
                        <th className="pb-3 font-semibold">Athlète</th>
                        <th className="pb-3 font-semibold">Performance</th>
                        <th className="pb-3 font-semibold">Vent</th>
                        <th className="pb-3 font-semibold">Niveau</th>
                        <th className="pb-3 font-semibold">Club FFA</th>
                        <th className="pb-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {topPerformers.map((entry) => {
                        const p = entry.record;
                        const formattedPerf = formatPerformanceDisplay(p.performanceValue, p.nature, currentDiscipline);
                        return (
                          <tr key={p.id || `${p.athleteId}-${entry.rank}`} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 font-mono font-bold text-slate-400">
                              #{entry.rank}
                            </td>
                            <td className="py-2.5 font-bold text-white">
                              <button
                                onClick={() => onSelectAthlete(p.athleteName)}
                                className="text-sky-400 hover:underline cursor-pointer text-left"
                              >
                                {p.athleteName}
                              </button>
                              {p.nationalite && p.nationalite !== 'FRA' && (
                                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-800/50 font-mono font-bold" title={`Nationalité : ${p.nationalite}`}>
                                  {p.nationalite}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 font-mono font-bold text-amber-400 whitespace-nowrap">
                              <span>{formattedPerf}</span>
                            </td>
                            <td className="py-2.5 font-mono text-slate-500">
                              {p.vent !== null && p.vent !== undefined ? `${p.vent > 0 ? '+' : ''}${p.vent}` : '-'}
                            </td>
                            <td className="py-2.5 font-mono font-bold text-sky-400">
                              {p.niveau}
                            </td>
                            <td className="py-2.5 text-slate-300">
                              {p.club}
                            </td>
                            <td className="py-2.5 font-mono text-slate-500">
                              {p.date}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* 3. ACCORDÉON : ÉVOLUTION & MOYENNES PAR SAISON FÉDÉRALE        */}
          {/* ============================================================= */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition-all">
            <button
              onClick={() => toggleSection('seasons')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Évolution & Synthèse par Saison Fédérale
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {seasonStats.length} saison(s) répertoriée(s) · Comparaison des densités et progressions historiques
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  {seasonStats.length} saisons
                </span>
                {openSections.seasons ? (
                  <ChevronUp className="w-5 h-5 text-sky-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {openSections.seasons && (
              <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-950/30 animate-fade-in space-y-6">
                {/* Graphique linéaire (si toutes saisons sélectionné) */}
                {selectedSeason === 'all' && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Courbes d'évolution et marqueurs saisonniers
                    </h4>
                    <PerformanceEvolutionChart
                      disciplineRecords={disciplineRecords}
                      discipline={currentDiscipline}
                      topLimit={topLimit}
                      sexe={selectedSexe}
                      nationality={selectedNationality}
                      structure={targetStructure}
                      onSelectAthlete={onSelectAthlete}
                    />
                  </div>
                )}

                {/* Cartes par saison */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Détail par saison fédérale
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {seasonStats.map(s => (
                      <div key={s.saison} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-sm text-white">
                            Saison {s.saison}
                          </span>
                          <span className="text-[11px] font-mono text-sky-400 font-semibold px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">
                            {s.athletesCount} athlètes
                          </span>
                        </div>

                        <div className="space-y-1 pt-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Performances :</span>
                            <span className="font-mono text-slate-200">{s.count}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Moyenne saison :</span>
                            <span className="font-mono font-bold text-emerald-400">{s.averageDisplay}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Meilleure marque :</span>
                            <span className="font-mono font-bold text-amber-400">{s.bestDisplay}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* 4. ACCORDÉON : RÉPARTITION PAR NIVEAU DE PERFORMANCE (FFA)    */}
          {/* ============================================================= */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition-all">
            <button
              onClick={() => toggleSection('levels')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 shrink-0">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Répartition par Niveau de Performance (Grille Officielle FFA)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Distribution officielle : International (IA, IB), National (N1-N4), Interrégional (IR1-IR4), Régional (R1-R6), Départemental (D1-D8)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  {levelDistribution.length} paliers
                </span>
                {openSections.levels ? (
                  <ChevronUp className="w-5 h-5 text-sky-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {openSections.levels && (
              <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-950/30 animate-fade-in space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span>Proportion des {disciplineRecords.length} performances certifiées selon le barème FFA :</span>
                </div>

                {levelDistribution.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 font-mono">
                    Aucune donnée de niveau disponible pour cette sélection
                  </div>
                ) : (
                  <div className="space-y-3">
                    {levelDistribution.map((item) => (
                      <div key={item.niveau} className="space-y-1.5 p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-black border ${item.tier.badge}`}>
                              {item.niveau}
                            </span>
                            <span className="text-slate-300 font-medium text-xs">
                              {item.tier.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-white text-xs">
                              {item.count} performance{item.count > 1 ? 's' : ''}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              ({item.percent}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                          <div 
                            className={`h-full bg-gradient-to-r ${item.tier.bar} rounded-full transition-all duration-500`}
                            style={{ width: `${item.barWidth}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* 5. ACCORDÉON : RÉPARTITION DES PRATIQUANTS PAR CATÉGORIES ET  */}
          {/*    PAR ANNÉE (Effectifs FFA : BE, MI, CA, JU, ES, SE, MA...) */}
          {/* ============================================================= */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition-all">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Répartition des Pratiquants par Catégorie et par Année
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Effectifs d'athlètes et volume de performances par tranche d'âge FFA (BE, MI, CA, JU, ES, SE, MA) à travers les saisons
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-950/70 text-indigo-300 border border-indigo-800/50">
                  {categoryStatsData.rows.length} catégories · {categoryStatsData.grandTotalAthletes} {selectedSexe === 'F' ? 'pratiquantes' : 'pratiquants'}
                </span>
                {openSections.categories ? (
                  <ChevronUp className="w-5 h-5 text-sky-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {openSections.categories && (
              <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-950/30 animate-fade-in space-y-6">
                
                {/* 1. Résumé en Cartes KPI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pratiquants Uniques</div>
                      <div className="text-xl font-mono font-black text-white mt-1">
                        {categoryStatsData.grandTotalAthletes} <span className="text-xs font-sans text-slate-400 font-normal">athlètes</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Tous millésimes confondus
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Volume de Performances</div>
                      <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                        {categoryStatsData.grandTotalPerfs} <span className="text-xs font-sans text-slate-400 font-normal">résultats</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Bilans officiels homologués
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catégorie Majeure</div>
                      <div className="text-xl font-mono font-black text-amber-400 mt-1">
                        {categoryStatsData.topCategory ? categoryStatsData.topCategory.label : 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {categoryStatsData.topCategory 
                          ? `${categoryStatsData.topCategory.athletesCount} athlètes (${categoryStatsData.topCategory.percentAthletes}%)`
                          : 'Aucun enregistrement'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40">
                      <Trophy className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Historique Saisons</div>
                      <div className="text-xl font-mono font-black text-cyan-400 mt-1">
                        {categoryStatsData.sortedYears.length} <span className="text-xs font-sans text-slate-400 font-normal">années</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {categoryStatsData.sortedYears.length > 0
                          ? `De ${categoryStatsData.sortedYears[0]} à ${categoryStatsData.sortedYears[categoryStatsData.sortedYears.length - 1]}`
                          : 'Aucune'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* 2. Barre d'outils interactive : Métrique (Athlètes / Performances) & Filtrage */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Métrique :</span>
                    <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                      <button
                        onClick={() => setCategoryMetric('athletes')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          categoryMetric === 'athletes'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Athlètes distincts (Pratiquants)
                      </button>
                      <button
                        onClick={() => setCategoryMetric('perfs')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          categoryMetric === 'perfs'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Nombre de performances
                      </button>
                    </div>
                  </div>

                  {/* Filtre / Focus par année */}
                  {categoryStatsData.sortedYears.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <span className="text-xs text-slate-400 font-medium mr-1 whitespace-nowrap">Focus année :</span>
                      <button
                        onClick={() => setSelectedCategoryYear('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          selectedCategoryYear === 'ALL'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        Toutes
                      </button>
                      {categoryStatsData.sortedYears.map(yr => (
                        <button
                          key={yr}
                          onClick={() => setSelectedCategoryYear(yr)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            selectedCategoryYear === yr
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {categoryStatsData.rows.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500 font-mono">
                    Aucune statistique de catégorie disponible pour cette sélection
                  </div>
                ) : (
                  <>
                    {/* 3. HISTOGRAMME EN BARRES : Catégories FFA × Saisons (+ 1 barre par saison pour le Total Général) */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-indigo-400" />
                            <span>Histogramme de Pratique : Catégories d'Âge × Saisons</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            1 barre par saison pour chaque catégorie FFA + 1 pour le total général
                          </p>
                        </div>

                        {/* Légende des saisons avec codes couleurs */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {categoryStatsData.sortedYears.map((yr, idx) => {
                            const palette = [
                              { bg: 'bg-indigo-500', text: 'text-indigo-300', border: 'border-indigo-500/50', badge: 'bg-indigo-950/80' },
                              { bg: 'bg-emerald-500', text: 'text-emerald-300', border: 'border-emerald-500/50', badge: 'bg-emerald-950/80' },
                              { bg: 'bg-sky-500', text: 'text-sky-300', border: 'border-sky-500/50', badge: 'bg-sky-950/80' },
                              { bg: 'bg-amber-500', text: 'text-amber-300', border: 'border-amber-500/50', badge: 'bg-amber-950/80' },
                              { bg: 'bg-purple-500', text: 'text-purple-300', border: 'border-purple-500/50', badge: 'bg-purple-950/80' },
                              { bg: 'bg-rose-500', text: 'text-rose-300', border: 'border-rose-500/50', badge: 'bg-rose-950/80' },
                            ][idx % 6];
                            const sLab = yr === 2026 ? '2025-2026' : `${yr - 1}-${yr}`;
                            const isFocused = selectedCategoryYear === yr;
                            return (
                              <button
                                key={yr}
                                onClick={() => setSelectedCategoryYear(selectedCategoryYear === yr ? 'ALL' : yr)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                                  isFocused
                                    ? `${palette.badge} ${palette.text} ${palette.border} ring-1 ring-white/30 font-bold`
                                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                                title={`Cliquer pour isoler la saison ${sLab}`}
                              >
                                <span className={`w-2.5 h-2.5 rounded-full ${palette.bg}`} />
                                <span>Saison {yr}</span>
                                <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">({sLab})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tooltip d'information interactive au survol d'une barre */}
                      {hoveredBar && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/50 shadow-xl flex items-center justify-between text-xs animate-fade-in">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              {hoveredBar.isTotal ? '🏆 Total Général' : `${hoveredBar.catLabel} (${hoveredBar.catKey})`}
                            </span>
                            <span className="text-slate-400 font-mono">
                              • Saison {hoveredBar.year} ({hoveredBar.seasonLabel})
                            </span>
                          </div>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="font-black text-white text-sm">
                              {hoveredBar.value} {categoryMetric === 'athletes' ? 'athlètes' : 'performances'}
                            </span>
                            {categoryMetric === 'athletes' && (hoveredBar.malesCount !== undefined || hoveredBar.femalesCount !== undefined) && (
                              <span className="text-slate-400 font-sans text-[11px]">
                                (♂ {hoveredBar.malesCount || 0} • ♀ {hoveredBar.femalesCount || 0})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Conteneur principal de l'histogramme */}
                      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/70 p-4 sm:p-6 shadow-inner">
                        {(() => {
                          const seasonsToDisplay = selectedCategoryYear === 'ALL'
                            ? categoryStatsData.sortedYears
                            : [selectedCategoryYear];

                          // Déterminer la valeur maximale pour l'échelle verticale
                          const allValues: number[] = [];
                          categoryStatsData.rows.forEach(r => {
                            r.yearsData.forEach(yd => {
                              if (seasonsToDisplay.includes(yd.year)) {
                                allValues.push(categoryMetric === 'athletes' ? yd.athletesCount : yd.perfsCount);
                              }
                            });
                          });
                          categoryStatsData.yearTotals.forEach(yt => {
                            if (seasonsToDisplay.includes(yt.year)) {
                              allValues.push(categoryMetric === 'athletes' ? yt.athletesCount : yt.perfsCount);
                            }
                          });

                          const maxVal = Math.max(...allValues, 1);
                          const yAxisSteps = [
                            maxVal,
                            Math.round(maxVal * 0.75),
                            Math.round(maxVal * 0.5),
                            Math.round(maxVal * 0.25),
                            0
                          ];

                          const seasonPalettes = [
                            { bg: 'from-indigo-600 to-indigo-400', border: 'border-indigo-400', text: 'text-indigo-300', dot: 'bg-indigo-400' },
                            { bg: 'from-emerald-600 to-teal-400', border: 'border-emerald-400', text: 'text-emerald-300', dot: 'bg-emerald-400' },
                            { bg: 'from-sky-600 to-cyan-400', border: 'border-sky-400', text: 'text-sky-300', dot: 'bg-sky-400' },
                            { bg: 'from-amber-600 to-yellow-400', border: 'border-amber-400', text: 'text-amber-300', dot: 'bg-amber-400' },
                            { bg: 'from-purple-600 to-fuchsia-400', border: 'border-purple-400', text: 'text-purple-300', dot: 'bg-purple-400' },
                            { bg: 'from-rose-600 to-pink-400', border: 'border-rose-400', text: 'text-rose-300', dot: 'bg-rose-400' },
                          ];

                          return (
                            <div className="min-w-[680px]">
                              {/* Zone graphique avec axe Y et barres */}
                              <div className="relative flex items-end">
                                {/* Graduation axe Y (Gauche) */}
                                <div className="h-64 sm:h-72 w-12 flex flex-col justify-between items-end pr-2 text-[10px] font-mono text-slate-500 shrink-0 select-none border-r border-slate-800/80">
                                  {yAxisSteps.map((step, idx) => (
                                    <span key={idx}>{step}</span>
                                  ))}
                                </div>

                                {/* Lignes directrices horizontales */}
                                <div className="absolute inset-0 left-12 flex flex-col justify-between pointer-events-none">
                                  {yAxisSteps.map((_, idx) => (
                                    <div
                                      key={idx}
                                      className={`w-full border-b ${
                                        idx === yAxisSteps.length - 1
                                          ? 'border-slate-800'
                                          : 'border-slate-800/40 border-dashed'
                                      }`}
                                    />
                                  ))}
                                </div>

                                {/* Colonnes groupées par catégorie + Total général */}
                                <div className="h-64 sm:h-72 flex-1 flex items-end justify-around pl-3 relative z-10">
                                  {/* Groupes de chaque catégorie FFA */}
                                  {categoryStatsData.rows.map(row => {
                                    return (
                                      <div
                                        key={row.catKey}
                                        className="flex flex-col items-center justify-end h-full px-1 group"
                                      >
                                        {/* Barres pour chaque saison dans la catégorie */}
                                        <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-full pb-1">
                                          {seasonsToDisplay.map(yr => {
                                            const yd = row.yearsData.find(y => y.year === yr);
                                            const val = yd
                                              ? (categoryMetric === 'athletes' ? yd.athletesCount : yd.perfsCount)
                                              : 0;
                                            const yrIdx = categoryStatsData.sortedYears.indexOf(yr);
                                            const palette = seasonPalettes[yrIdx >= 0 ? yrIdx % seasonPalettes.length : 0];
                                            const heightPct = val > 0 ? Math.max(Math.round((val / maxVal) * 100), 6) : 2;
                                            const sLab = yr === 2026 ? '2025-2026' : `${yr - 1}-${yr}`;

                                            return (
                                              <div
                                                key={yr}
                                                className="flex flex-col items-center justify-end h-full"
                                                onMouseEnter={() =>
                                                  setHoveredBar({
                                                    catLabel: row.label,
                                                    catKey: row.catKey,
                                                    seasonLabel: sLab,
                                                    year: yr,
                                                    value: val,
                                                    malesCount: yd?.malesCount,
                                                    femalesCount: yd?.femalesCount,
                                                    isTotal: false,
                                                  })
                                                }
                                                onMouseLeave={() => setHoveredBar(null)}
                                              >
                                                {/* Valeur numérique au sommet de la barre */}
                                                <span
                                                  className={`text-[10px] sm:text-xs font-mono font-bold mb-1 transition-transform group-hover:scale-110 ${
                                                    val > 0 ? palette.text : 'text-slate-600'
                                                  }`}
                                                >
                                                  {val}
                                                </span>

                                                {/* La Barre */}
                                                <div
                                                  className={`w-4 sm:w-6 rounded-t-lg transition-all duration-300 cursor-pointer ${
                                                    val > 0
                                                      ? `bg-gradient-to-t ${palette.bg} shadow-md hover:brightness-125 border-t border-x ${palette.border}/50`
                                                      : 'bg-slate-800/40 rounded-t-sm'
                                                  }`}
                                                  style={{ height: `${heightPct}%` }}
                                                />
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Séparateur visuel pour le Total Général */}
                                  <div className="h-full border-l-2 border-indigo-500/40 mx-2 shrink-0 opacity-70" />

                                  {/* GROUPE SPÉCIAL : 1 barre par saison pour le TOTAL GÉNÉRAL */}
                                  <div className="flex flex-col items-center justify-end h-full px-2 rounded-2xl bg-indigo-950/20 border border-indigo-600/30 py-1">
                                    <div className="flex items-end justify-center gap-1.5 sm:gap-2 h-full pb-1">
                                      {seasonsToDisplay.map(yr => {
                                        const yt = categoryStatsData.yearTotals.find(y => y.year === yr);
                                        const val = yt
                                          ? (categoryMetric === 'athletes' ? yt.athletesCount : yt.perfsCount)
                                          : 0;
                                        const yrIdx = categoryStatsData.sortedYears.indexOf(yr);
                                        const palette = seasonPalettes[yrIdx >= 0 ? yrIdx % seasonPalettes.length : 0];
                                        const heightPct = val > 0 ? Math.max(Math.round((val / maxVal) * 100), 6) : 2;
                                        const sLab = yr === 2026 ? '2025-2026' : `${yr - 1}-${yr}`;

                                        return (
                                          <div
                                            key={yr}
                                            className="flex flex-col items-center justify-end h-full"
                                            onMouseEnter={() =>
                                              setHoveredBar({
                                                catLabel: 'Total Général',
                                                catKey: 'TOTAL',
                                                seasonLabel: sLab,
                                                year: yr,
                                                value: val,
                                                isTotal: true,
                                              })
                                            }
                                            onMouseLeave={() => setHoveredBar(null)}
                                          >
                                            <span
                                              className={`text-[10px] sm:text-xs font-mono font-black mb-1 transition-transform group-hover:scale-110 ${
                                                val > 0 ? 'text-white' : 'text-slate-600'
                                              }`}
                                            >
                                              {val}
                                            </span>

                                            <div
                                              className={`w-5 sm:w-8 rounded-t-lg transition-all duration-300 cursor-pointer ${
                                                val > 0
                                                  ? `bg-gradient-to-t ${palette.bg} shadow-lg ring-1 ring-white/20 hover:brightness-125 border-t border-x ${palette.border}`
                                                  : 'bg-slate-800/40 rounded-t-sm'
                                              }`}
                                              style={{ height: `${heightPct}%` }}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Ligne d'étiquettes de l'axe X (Catégories + Total) */}
                              <div className="flex items-start justify-around pt-3 border-t border-slate-800 ml-12">
                                {categoryStatsData.rows.map(row => (
                                  <div
                                    key={row.catKey}
                                    className="flex flex-col items-center text-center px-1"
                                  >
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border ${row.badgeColor}`}
                                    >
                                      {row.catKey}
                                    </span>
                                    <span className="text-[11px] font-bold text-white mt-1 leading-tight line-clamp-1">
                                      {row.label}
                                    </span>
                                    {/* Mini indicateurs de saison sous chaque barre */}
                                    <div className="flex items-center gap-1 mt-1">
                                      {seasonsToDisplay.map((yr, idx) => {
                                        const yrIdx = categoryStatsData.sortedYears.indexOf(yr);
                                        const palette = seasonPalettes[yrIdx >= 0 ? yrIdx % seasonPalettes.length : idx % seasonPalettes.length];
                                        return (
                                          <span
                                            key={yr}
                                            className={`text-[9px] font-mono ${palette.text}`}
                                            title={`Saison ${yr}`}
                                          >
                                            '{String(yr).slice(-2)}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}

                                {/* Séparateur d'étiquette */}
                                <div className="w-px h-10 border-l border-transparent mx-2 shrink-0" />

                                {/* Étiquette pour le Total Général */}
                                <div className="flex flex-col items-center text-center px-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-indigo-600 text-white shadow">
                                    TOTAL
                                  </span>
                                  <span className="text-[11px] font-extrabold text-indigo-300 mt-1 leading-tight">
                                    Général
                                  </span>
                                  <div className="flex items-center gap-1 mt-1">
                                    {seasonsToDisplay.map((yr, idx) => {
                                      const yrIdx = categoryStatsData.sortedYears.indexOf(yr);
                                      const palette = seasonPalettes[yrIdx >= 0 ? yrIdx % seasonPalettes.length : idx % seasonPalettes.length];
                                      return (
                                        <span
                                          key={yr}
                                          className={`text-[9px] font-mono ${palette.text}`}
                                          title={`Saison ${yr}`}
                                        >
                                          '{String(yr).slice(-2)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 4. Fiches Graphiques Détaillées par Catégorie */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-cyan-400" />
                        <span>Fiches de Répartition et Profils par Catégorie</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {categoryStatsData.rows.map(row => {
                          const malePct = row.athletesCount > 0 ? Math.round((row.malesCount / row.athletesCount) * 100) : 0;
                          const femalePct = row.athletesCount > 0 ? Math.round((row.femalesCount / row.athletesCount) * 100) : 0;

                          return (
                            <div
                              key={row.catKey}
                              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border ${row.badgeColor}`}
                                  >
                                    {row.catKey}
                                  </span>
                                  <div>
                                    <div className="font-extrabold text-sm text-white flex items-center gap-2">
                                      <span>{row.label}</span>
                                      <span className="text-[11px] text-slate-400 font-normal">
                                        ({row.fullTitle})
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                      Ordre fédéral #{row.order}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right font-mono">
                                  <div className="font-black text-sm text-white">
                                    {row.athletesCount} <span className="text-[11px] font-sans text-slate-400 font-normal">athlètes</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {row.perfsCount} perfs · {row.percentAthletes}% du total
                                  </div>
                                </div>
                              </div>

                              {/* Barre de proportion globale */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] text-slate-400">
                                  <span>Part des {selectedSexe === 'F' ? 'pratiquantes' : 'pratiquants'} de la discipline</span>
                                  <span className="font-mono font-bold text-slate-300">{row.percentAthletes}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                  <div
                                    className={`h-full bg-gradient-to-r ${row.barColor} rounded-full transition-all duration-500`}
                                    style={{ width: `${Math.max(row.percentAthletes, 3)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Répartition Hommes / Femmes et Historique Annuel */}
                              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <span className="text-sky-400 font-medium font-mono">
                                    ♂ {row.malesCount} ({malePct}%)
                                  </span>
                                  <span>•</span>
                                  <span className="text-pink-400 font-medium font-mono">
                                    ♀ {row.femalesCount} ({femalePct}%)
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {row.yearsData.map(yd => (
                                    <span
                                      key={yd.year}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                        selectedCategoryYear === yd.year
                                          ? 'bg-indigo-950 text-indigo-300 border-indigo-700 font-bold'
                                          : 'bg-slate-950 text-slate-400 border-slate-800'
                                      }`}
                                      title={`Année ${yd.year} : ${yd.athletesCount} athlètes, ${yd.perfsCount} perfs`}
                                    >
                                      {yd.year}: <strong className="text-slate-200">{yd.athletesCount}</strong>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* 6. ACCORDÉON : CARTE DE FRANCE DE LA PRATIQUE                 */}
          {/*    Points rouges de différentes grosseurs selon la densité   */}
          {/* ============================================================= */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition-all">
            <button
              onClick={() => toggleSection('map')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 shrink-0 relative">
                  <MapPin className="w-5 h-5 text-red-500" />
                  <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>Carte de France de la Pratique (Clubs & Territoires)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cartographie avec points de différentes tailles et couleurs (bleu, vert, ambre, rouge) selon la densité de {selectedSexe === 'F' ? 'pratiquantes' : 'pratiquants'} par département ou ville
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-red-950/70 text-red-300 border border-red-800/50">
                  Carte interactive
                </span>
                {openSections.map ? (
                  <ChevronUp className="w-5 h-5 text-sky-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {openSections.map && (
              <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-950/30 animate-fade-in space-y-4">
                <FranceDisciplineMap
                  disciplineRecords={disciplineRecords}
                  discipline={currentDiscipline}
                  onSelectAthlete={onSelectAthlete}
                />
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export const DisciplineReportView = React.memo(DisciplineReportViewComponent);
