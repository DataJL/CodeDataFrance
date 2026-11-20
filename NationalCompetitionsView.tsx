import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  Flag, 
  MapPin, 
  Users, 
  Calendar, 
  TrendingUp, 
  BarChart2, 
  BarChart3, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  ChevronRight, 
  Sparkles, 
  ArrowUpRight, 
  Layers,
  Building2,
  Globe2,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Download,
  AlertCircle,
  Database,
  ArrowUpDown
} from 'lucide-react';
import { PerformanceRecord } from '../../types/athletics';
import { 
  formatPerformanceDisplay, 
  getDisciplineNature, 
  isBetterPerformance,
  normalizeDistanceValue,
  getDisciplineSortPriority,
} from '../../utils/performanceUtils';
import { getEventInfoByCodeEp, OfficialCodeEpInfo } from '../../data/officialDisciplines';
import { exportToExcel, exportToWord } from '../../utils/exportUtils';
import { StorageService } from '../../services/storageService';

interface NationalCompetitionsViewProps {
  records: PerformanceRecord[];
  onSelectAthlete: (athleteName: string) => void;
  onSelectDiscipline?: (discipline: string) => void;
  onUpdateRecords?: (
    newRecords: PerformanceRecord[], 
    importCount: number, 
    sourceFileName?: string,
    seasonMeta?: {
      seasonLabel: string;
      startYear: number;
      endYear: number;
      structure: 'EXTERIEUR' | 'SALLE' | 'COMBINE';
      totalLinesDetected?: number;
      athleteCount?: number;
      replaceEntireDatabase?: boolean;
    }
  ) => void;
  onNavigate?: (tab: string) => void;
}

// Les 16 championnats et finales nationales officiels à cibler dans la colonne C (nom_compet)
export const TARGET_NATIONAL_CHAMPIONSHIPS: string[] = [
  'Championnats de France Elite en salle',
  'Championnats de France U18 & U20 en salle',
  'Championnats de France Masters en salle',
  'Championnats de France U23 en salle',
  'Championnats Nationaux en salle',
  'Championnats de France de Lancers hivernaux',
  "Championnats de France d'épreuves combinées/marche en salle",
  "Championnats Nationaux d'épreuves combinées/marche en salle",
  'Championnats de France U*NXT',
  'Championnats de France Elite',
  "Championnats de France d'épreuves combinées",
  'Championnats de France Masters',
  'Open de France',
  "Finale Nationale Equip'Athlé N1",
  "Finale Nationale Equip'Athlé N2",
  "Finale Nationale des Pointes d'Or",
];

export function normalizeCompetitionString(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bchpts\b/g, 'championnats')
    .replace(/\bchpt\b/g, 'championnat')
    .replace(/\bchampionnats?\b/g, 'championnats')
    .replace(/u\*nxt|u_nxt|unxt/g, 'unxt')
    .replace(/&/g, 'et')
    .replace(/[^a-z0-9]/g, '');
}

const SORTED_TARGET_CHAMPIONSHIPS = [...TARGET_NATIONAL_CHAMPIONSHIPS]
  .map(target => ({
    officialTitle: target,
    norm: normalizeCompetitionString(target),
  }))
  .sort((a, b) => b.norm.length - a.norm.length);

/**
 * Détecte si un nom de compétition correspond à l'un des 16 championnats nationaux officiels
 */
export function matchOfficialNationalChampionship(nomCompet?: string): string | null {
  if (!nomCompet) return null;
  const normName = normalizeCompetitionString(nomCompet);
  if (!normName) return null;

  for (const item of SORTED_TARGET_CHAMPIONSHIPS) {
    if (normName === item.norm || normName.includes(item.norm)) {
      return item.officialTitle;
    }
  }
  return null;
}

/**
 * Détermine si un championnat national relève de la période hivernale (En salle / Lancers hivernaux)
 * ou de la période estivale (Plein air / Finales)
 */
export function isWinterCompetition(title: string, structure?: string): boolean {
  const t = (title || '').toLowerCase();
  if (t.includes('en salle') || t.includes('indoor') || t.includes('lancers hivernaux') || t.includes('hivern')) {
    return true;
  }
  if (structure === 'SALLE') {
    return true;
  }
  return false;
}

/**
 * Détermine si la compétition est officiellement un Championnat de France
 * (ex: "Championnats de France Elite", "Championnats de France U18 & U20 en salle", "Championnats de France Masters")
 * par opposition aux Finales Nationales (Pointes d'Or, Equip'Athlé), Opens ou Championnats Nationaux.
 */
export function isChampionnatDeFrance(compName?: string): boolean {
  if (!compName) return false;
  const norm = normalizeCompetitionString(compName);
  return norm.includes('championnat') && norm.includes('france');
}

/**
 * Détermine si un athlète est de nationalité étrangère (non française).
 * Dans les bilans FFA, la nationalité est codée sur 3 lettres (ex: FRA, SEN, ALG, BEL...).
 * Si le code est différent de FRA / FR et non vide, l'athlète est étranger.
 */
export function isForeignAthlete(nat?: string): boolean {
  if (!nat) return false;
  const n = nat.trim().toUpperCase();
  return n !== '' && n !== 'FRA' && n !== 'FR';
}

/**
 * Retourne le titre officiel adapté au rang, au sexe de l'athlète et au statut officiel de la compétition :
 * - Si Championnat de France :
 *     1er : "CHAMPION DE FRANCE" (H) / "CHAMPIONNE DE FRANCE" (F)
 *     2e : "Vice-Champion" (H) / "Vice-Championne" (F)
 * - Si autre compétition (ex: Pointes d'Or, Equip'Athlé, Open) :
 *     1er : "1ère PLACE" (jamais Champion de France)
 *     2e : "Médaille d'Argent" (pas de mention Vice-Champion)
 * Un athlète étranger ne peut pas être Champion de France.
 */
export function getRankBadgeAndTitle(
  rank: number,
  sexe?: string,
  categorie?: string,
  compName?: string,
  nationalite?: string
): { badge: string; subtitle: string; isChampionship: boolean } {
  if (isForeignAthlete(nationalite)) {
    return {
      badge: 'Hors-Concours',
      subtitle: `Athlète étranger (${nationalite})`,
      isChampionship: false,
    };
  }

  const isChpt = isChampionnatDeFrance(compName);
  const s = (sexe || '').toUpperCase().trim();
  const c = (categorie || '').toUpperCase().trim();
  const isFemme = s === 'F' || s === 'FEMME' || s === 'FEMININ' || s === 'FÉMININ' || c.endsWith('F');

  if (rank === 1) {
    if (isChpt) {
      return {
        badge: isFemme ? '🥇 CHAMPIONNE DE FRANCE' : '🥇 CHAMPION DE FRANCE',
        subtitle: isFemme ? 'Championne de France' : 'Champion de France',
        isChampionship: true,
      };
    }
    return {
      badge: '🥇 1ère PLACE',
      subtitle: isFemme ? '1ère Place (Vainqueure)' : '1ère Place (Vainqueur)',
      isChampionship: false,
    };
  }

  if (rank === 2) {
    if (isChpt) {
      return {
        badge: '🥈 2ème Place',
        subtitle: isFemme ? 'Vice-Championne' : 'Vice-Champion',
        isChampionship: true,
      };
    }
    return {
      badge: '🥈 2ème Place',
      subtitle: "Médaille d'Argent",
      isChampionship: false,
    };
  }

  if (rank === 3) {
    return {
      badge: '🥉 3ème Place',
      subtitle: 'Médaille de Bronze',
      isChampionship: isChpt,
    };
  }

  return {
    badge: `${rank}ème Place`,
    subtitle: rank <= 8 ? 'Finaliste' : '',
    isChampionship: isChpt,
  };
}

// Dictionnaire officiel des catégories d'âge FFA
export const CATEGORY_NAMES: Record<string, { order: number; label: string; full: string }> = {
  'EA': { order: 1, label: 'EA', full: "École d'Athlé (EA)" },
  'PO': { order: 2, label: 'PO', full: 'Poussins (PO)' },
  'BE': { order: 3, label: 'BE', full: 'Benjamins (BE)' },
  'MI': { order: 4, label: 'MI', full: 'Minimes (MI)' },
  'CA': { order: 5, label: 'CA', full: 'Cadets (CA)' },
  'JU': { order: 6, label: 'JU', full: 'Juniors (JU)' },
  'ES': { order: 7, label: 'ES', full: 'Espoirs (ES)' },
  'SE': { order: 8, label: 'SE', full: 'Seniors (SE)' },
  'MA': { order: 9, label: 'MA', full: 'Masters (MA)' },
};

export function normalizeCategoryCode(cat?: string): string {
  const c = (cat || '').toUpperCase().trim();
  if (!c) return 'AUTRE';
  if (c.startsWith('EA')) return 'EA';
  if (c.startsWith('PO')) return 'PO';
  if (c.startsWith('BE')) return 'BE';
  if (c.startsWith('MI')) return 'MI';
  if (c.startsWith('CA')) return 'CA';
  if (c.startsWith('JU')) return 'JU';
  if (c.startsWith('ES')) return 'ES';
  if (c.startsWith('SE')) return 'SE';
  if (
    c.startsWith('MA') || c.startsWith('M0') || c.startsWith('M1') || c.startsWith('M2') ||
    c.startsWith('M3') || c.startsWith('M4') || c.startsWith('M5') || c.startsWith('M6') ||
    c.startsWith('M7') || c.startsWith('M8') || c.startsWith('M9') ||
    c.startsWith('F0') || c.startsWith('F1') || c.startsWith('F2') ||
    c.startsWith('F3') || c.startsWith('F4') || c.startsWith('F5') ||
    c.startsWith('F6') || c.startsWith('F7') || c.startsWith('F8') || c.startsWith('F9')
  ) {
    return 'MA';
  }
  return c.slice(0, 2);
}

// Barème officiel FFA / World Athletics pour la Placing Table (Top 8 finalistes)
const PLACING_TABLE_POINTS: Record<number, number> = {
  1: 8, // 1ère place : 8 pts (Médaille d'Or)
  2: 7, // 2ème place : 7 pts (Médaille d'Argent)
  3: 6, // 3ème place : 6 pts (Médaille de Bronze)
  4: 5, // 4ème place : 5 pts
  5: 4, // 5ème place : 4 pts
  6: 3, // 6ème place : 3 pts
  7: 2, // 7ème place : 2 pts
  8: 1, // 8ème place : 1 pt
};

// Options de tri pour les statistiques territoriales (Clubs, Ligues, Comités départementaux)
export type TerritorialSortCriterion = 'participants' | 'gold' | 'silver' | 'bronze' | 'finalists';

export const TERRITORIAL_SORT_OPTIONS: Array<{
  id: TerritorialSortCriterion;
  label: string;
  badge: string;
  activeClass: string;
}> = [
  { 
    id: 'gold', 
    label: "Nbre de Médailles d'OR", 
    badge: '🥇', 
    activeClass: 'bg-amber-500 text-slate-950 font-black border border-amber-400 shadow-amber-500/20' 
  },
  { 
    id: 'silver', 
    label: "Nbre de médailles d'ARGENT", 
    badge: '🥈', 
    activeClass: 'bg-slate-200 text-slate-950 font-black border border-white shadow-slate-200/20' 
  },
  { 
    id: 'bronze', 
    label: "Nbre de médailles de BRONZE", 
    badge: '🥉', 
    activeClass: 'bg-amber-700 text-white font-black border border-amber-600 shadow-amber-700/20' 
  },
  { 
    id: 'finalists', 
    label: "Nbre de finalistes", 
    badge: '🎖️', 
    activeClass: 'bg-purple-600 text-white font-black border border-purple-500 shadow-purple-600/20' 
  },
  { 
    id: 'participants', 
    label: "Nbre de participant.e.s", 
    badge: '👥', 
    activeClass: 'bg-sky-600 text-white font-black border border-sky-500 shadow-sky-600/20' 
  },
];

export const NationalCompetitionsView: React.FC<NationalCompetitionsViewProps> = ({
  records,
  onSelectAthlete,
  onSelectDiscipline,
  onUpdateRecords,
  onNavigate,
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncPercent, setSyncPercent] = useState<number>(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncReferenceDataset = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncStatus('Chargement du fichier officiel de référence Rslts_25-26.csv...');
    setSyncPercent(5);

    try {
      const loaded = await StorageService.loadOfficialReferenceDatasetAsync(
        true,
        (processed, total, percent) => {
          setSyncPercent(percent);
          if (processed > 0) {
            setSyncStatus(`Indexation : ${processed.toLocaleString('fr-FR')} lignes certifiées analysées (${percent}%)...`);
          } else {
            setSyncStatus(`Téléchargement de la base officielle (${percent}%)...`);
          }
        }
      );

      if (loaded.length > 0) {
        setSyncStatus(`Terminé : ${loaded.length.toLocaleString('fr-FR')} performances synchronisées !`);
        if (onUpdateRecords) {
          onUpdateRecords(loaded, loaded.length, 'Rslts_25-26.csv', {
            seasonLabel: '2025-2026',
            startYear: 2025,
            endYear: 2026,
            structure: 'COMBINE',
            replaceEntireDatabase: true,
            totalLinesDetected: loaded.length,
          });
        }
      } else {
        setSyncError("Le chargement du fichier officiel complet (851 917 lignes) n'a pas pu aboutir. Veuillez cliquer sur le bouton ci-dessous pour réessayer ou passer par l'onglet Import.");
      }
    } catch (e: any) {
      setSyncError('Erreur lors du chargement : ' + (e?.message || 'Erreur réseau'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Détection automatique : Si l'utilisateur possède un cache ancien ou tronqué (< 500k)
  React.useEffect(() => {
    const isTruncatedCache = records.length > 0 && records.length < 500000 && records.some(r => r.sourceFile === 'Rslts_25-26.csv');
    const missingNomCompet = records.length > 0 && !records.some(r => !!r.nom_compet);
    if ((isTruncatedCache || missingNomCompet) && !isSyncing) {
      console.log('Cache partiel ou obsolète détecté, auto-synchronisation de la base complète...');
      handleSyncReferenceDataset();
    }
  }, [records.length]);

  // 1. Extraire strictement les 16 championnats nationaux officiels à partir de la colonne C nom_compet
  const availableCompetitions = useMemo(() => {
    const compMap = new Map<string, {
      id: string;
      rawName: string;
      cleanTitle: string;
      seasonYear: number;
      seasonLabel: string;
      lieu: string;
      date: string;
      structure: 'EXTERIEUR' | 'SALLE' | 'COMBINE';
      recordsCount: number;
      athletes: Set<string>;
      clubs: Set<string>;
      regions: Set<string>;
      departments: Set<string>;
      eventCodes: Set<string>;
      disciplines: Set<string>;
      sourceFiles: Set<string>;
    }>();

    records.forEach(r => {
      const rawComp = (r.nom_compet || '').trim();
      if (!rawComp) return;

      const matchedTitle = matchOfficialNationalChampionship(rawComp);
      if (!matchedTitle) return; // Filtrage strict : uniquement les 16 championnats nationaux

      // Clé unique par championnat officiel et saison
      const yr = r.saison || (r.date ? parseInt(r.date.split('-')[0], 10) : 2026);
      const sLab = r.saisonLabel || (yr === 2026 ? '2025-2026' : `${yr - 1}-${yr}`);
      const compKey = `${matchedTitle}__${yr}`;

      if (!compMap.has(compKey)) {
        compMap.set(compKey, {
          id: compKey,
          rawName: rawComp,
          cleanTitle: matchedTitle,
          seasonYear: yr,
          seasonLabel: sLab,
          lieu: r.lieu || 'France',
          date: r.date || '',
          structure: (r.structure as any) || 'EXTERIEUR',
          recordsCount: 0,
          athletes: new Set(),
          clubs: new Set(),
          regions: new Set(),
          departments: new Set(),
          eventCodes: new Set(),
          disciplines: new Set(),
          sourceFiles: new Set(),
        });
      }

      const item = compMap.get(compKey)!;
      item.recordsCount += 1;
      if (r.athleteName) item.athletes.add(r.athleteName);
      if (r.club) item.clubs.add(r.club);
      if (r.region) item.regions.add(r.region);
      if (r.departement) item.departments.add(r.departement);
      if (r.code_ep) item.eventCodes.add(r.code_ep);
      if (r.discipline) item.disciplines.add(r.discipline);
      if (r.sourceFile) item.sourceFiles.add(r.sourceFile);
    });

    // Ordonner chronologiquement (saison la plus récente d'abord, puis par volume d'épreuves)
    return Array.from(compMap.values()).sort((a, b) => {
      if (b.seasonYear !== a.seasonYear) return b.seasonYear - a.seasonYear;
      return b.recordsCount - a.recordsCount;
    });
  }, [records]);

  // Saisons disponibles alimentées par l'ensemble des fichiers bilans téléchargés et performances
  const availableSeasons = useMemo(() => {
    const set = new Set<string>();
    availableCompetitions.forEach(c => {
      if (c.seasonLabel) set.add(c.seasonLabel);
    });
    records.forEach(r => {
      if (r.saisonLabel) {
        set.add(r.saisonLabel);
      } else if (r.saison) {
        set.add(`${r.saison - 1}-${r.saison}`);
      }
    });
    StorageService.getOfficialSeasonFiles().forEach(f => {
      if (f.seasonLabel) set.add(f.seasonLabel);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [availableCompetitions, records]);

  // Filtre de la saison (avec l'option "Toutes les saisons" par défaut ou sélectionnée)
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>('ALL');

  // Compétitions filtrées par saison choisie
  const filteredCompetitions = useMemo(() => {
    if (selectedSeasonFilter === 'ALL') {
      return availableCompetitions;
    }
    return availableCompetitions.filter(c => c.seasonLabel === selectedSeasonFilter);
  }, [availableCompetitions, selectedSeasonFilter]);

  // Répartition en Période Hivernale et Période Estivale, classées chacune par ordre alphabétique
  const { winterCompetitions, summerCompetitions } = useMemo(() => {
    const winter = filteredCompetitions
      .filter(c => isWinterCompetition(c.cleanTitle, c.structure))
      .sort((a, b) => {
        const cmp = a.cleanTitle.localeCompare(b.cleanTitle, 'fr', { sensitivity: 'base' });
        if (cmp !== 0) return cmp;
        return b.seasonYear - a.seasonYear;
      });

    const summer = filteredCompetitions
      .filter(c => !isWinterCompetition(c.cleanTitle, c.structure))
      .sort((a, b) => {
        const cmp = a.cleanTitle.localeCompare(b.cleanTitle, 'fr', { sensitivity: 'base' });
        if (cmp !== 0) return cmp;
        return b.seasonYear - a.seasonYear;
      });

    return { winterCompetitions: winter, summerCompetitions: summer };
  }, [filteredCompetitions]);

  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(() => {
    return availableCompetitions[0]?.id || '';
  });

  // Mettre à jour la compétition sélectionnée si la liste ou le filtre de saison change
  React.useEffect(() => {
    if (filteredCompetitions.length > 0) {
      const exists = filteredCompetitions.some(c => c.id === selectedCompetitionId);
      if (!exists) {
        const defaultChoice = winterCompetitions[0]?.id || summerCompetitions[0]?.id || filteredCompetitions[0].id;
        setSelectedCompetitionId(defaultChoice);
      }
    }
  }, [filteredCompetitions, winterCompetitions, summerCompetitions, selectedCompetitionId]);

  // Compétition actuellement active
  const currentCompetition = useMemo(() => {
    return filteredCompetitions.find(c => c.id === selectedCompetitionId) ||
           availableCompetitions.find(c => c.id === selectedCompetitionId) ||
           filteredCompetitions[0] ||
           availableCompetitions[0] ||
           null;
  }, [filteredCompetitions, availableCompetitions, selectedCompetitionId]);

  // Performances brutes de la compétition sélectionnée (sans filtres de sexe/catégorie/discipline)
  const rawCompetitionRecords = useMemo(() => {
    if (!currentCompetition) return [];
    return records.filter(r => {
      const rawComp = (r.nom_compet || '').trim();
      const matchedTitle = matchOfficialNationalChampionship(rawComp);
      const yr = r.saison || (r.date ? parseInt(r.date.split('-')[0], 10) : 2026);
      return matchedTitle && `${matchedTitle}__${yr}` === currentCompetition.id;
    });
  }, [records, currentCompetition]);

  // Filtres complémentaires (Sexe, Catégorie, Discipline)
  const [selectedSexe, setSelectedSexe] = useState<'ALL' | 'M' | 'F'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDiscipline, setSelectedDisciplineState] = useState<string>('ALL');

  // Performances correspondant aux filtres précédents (Compétition + Discipline sélectionnée + Catégorie sélectionnée)
  // pour déterminer dynamiquement le nombre exact d'hommes et de femmes concernés
  const preSexFilteredRecords = useMemo(() => {
    if (!currentCompetition) return [];
    const cleanDiscipline = selectedDiscipline !== 'ALL' ? selectedDiscipline.replace(/^0+/, '') : null;

    return rawCompetitionRecords.filter(r => {
      // 1. Filtrage par discipline précédente si sélectionnée
      if (cleanDiscipline) {
        const code = (r.code_ep || '').trim().replace(/^0+/, '');
        if (code !== cleanDiscipline) return false;
      }

      // 2. Filtrage par catégorie précédente si sélectionnée
      if (selectedCategory !== 'ALL') {
        const catCode = normalizeCategoryCode(r.categorie);
        if (catCode !== selectedCategory) return false;
      }

      return true;
    });
  }, [rawCompetitionRecords, currentCompetition, selectedDiscipline, selectedCategory]);

  // Statistiques dynamiques d'hommes et de femmes concernés suite aux précédents tris
  const sexStats = useMemo(() => {
    let mPerfs = 0;
    let fPerfs = 0;
    const mAthletes = new Set<string>();
    const fAthletes = new Set<string>();

    preSexFilteredRecords.forEach(r => {
      const s = (r.sexe || '').toUpperCase().trim();
      const normS = (s === 'H' || s === 'HOMME' || s === 'MASCULIN') ? 'M' : (s === 'FEMME' || s === 'FÉMININ' || s === 'FEMININ') ? 'F' : s;
      const cat = (r.categorie || '').toUpperCase().trim();
      const name = (r.athleteName || '').toLowerCase().trim();

      const isM = normS === 'M' || (!normS && (cat.endsWith('M') || cat.endsWith('H')));
      const isF = normS === 'F' || (!normS && cat.endsWith('F'));

      if (isM) {
        mPerfs++;
        if (name) mAthletes.add(name);
      } else if (isF) {
        fPerfs++;
        if (name) fAthletes.add(name);
      }
    });

    const mPersons = mAthletes.size > 0 ? mAthletes.size : mPerfs;
    const fPersons = fAthletes.size > 0 ? fAthletes.size : fPerfs;
    const totalAthletes = new Set([...mAthletes, ...fAthletes]).size;
    const totalPersons = totalAthletes > 0 ? totalAthletes : (mPersons + fPersons);

    return {
      m: mPersons,
      f: fPersons,
      total: totalPersons,
      mPerfs,
      fPerfs,
      totalPerfs: mPerfs + fPerfs,
      mAthletes: mAthletes.size,
      fAthletes: fAthletes.size,
      totalAthletes,
      hasM: mPersons > 0,
      hasF: fPersons > 0,
    };
  }, [preSexFilteredRecords]);

  // Réinitialisation automatique du sexe si aucun athlète de ce sexe n'est concerné par les filtres actuels
  useEffect(() => {
    if (selectedSexe === 'M' && sexStats.m === 0 && sexStats.f > 0) {
      setSelectedSexe('F');
    } else if (selectedSexe === 'F' && sexStats.f === 0 && sexStats.m > 0) {
      setSelectedSexe('M');
    } else if (selectedSexe !== 'ALL' && ((selectedSexe === 'M' && sexStats.m === 0) || (selectedSexe === 'F' && sexStats.f === 0))) {
      setSelectedSexe('ALL');
    }
  }, [sexStats.m, sexStats.f, selectedSexe]);

  // Choix dynamiques de catégories d'âge disponibles pour la compétition active (filtrées par discipline et sexe si sélectionnés)
  const availableCategories = useMemo(() => {
    const counts = new Map<string, number>();
    const cleanDiscipline = selectedDiscipline !== 'ALL' ? selectedDiscipline.replace(/^0+/, '') : null;

    rawCompetitionRecords.forEach(r => {
      // Filtrage par discipline si active
      if (cleanDiscipline) {
        const code = (r.code_ep || '').trim().replace(/^0+/, '');
        if (code !== cleanDiscipline) return;
      }

      // Filtrage par sexe si actif
      if (selectedSexe !== 'ALL') {
        const s = (r.sexe || '').toUpperCase().trim();
        const normS = (s === 'H' || s === 'MASCULIN') ? 'M' : (s === 'FEMME' || s === 'FÉMININ') ? 'F' : s;
        if (normS && normS !== selectedSexe) return;
      }

      const code = normalizeCategoryCode(r.categorie);
      if (code && code !== 'AUTRE') {
        counts.set(code, (counts.get(code) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([code, count]) => {
        const info = CATEGORY_NAMES[code] || { order: 99, label: code, full: code };
        return {
          code,
          label: info.label,
          full: info.full,
          count,
          order: info.order,
        };
      })
      .sort((a, b) => a.order - b.order);
  }, [rawCompetitionRecords, selectedDiscipline, selectedSexe]);

  // Réinitialisation automatique de la catégorie si non présente dans la compétition / discipline / sexe
  useEffect(() => {
    if (selectedCategory !== 'ALL' && !availableCategories.some(c => c.code === selectedCategory)) {
      setSelectedCategory('ALL');
    }
  }, [availableCategories, selectedCategory]);

  // 2. Extraire et organiser les disciplines strictement basées sur les codes épreuves (code_ep)
  // Alimentées dynamiquement en fonction de la compétition, du sexe et de la catégorie sélectionnés
  const competitionEventCodes = useMemo(() => {
    if (!currentCompetition) return [];

    const codeCounts = new Map<string, number>();
    const codeFallbackDiscipline = new Map<string, string>();

    rawCompetitionRecords.forEach(r => {
      // Filtrage par sexe si actif
      if (selectedSexe !== 'ALL') {
        const s = (r.sexe || '').toUpperCase().trim();
        const normS = (s === 'H' || s === 'MASCULIN') ? 'M' : (s === 'FEMME' || s === 'FÉMININ') ? 'F' : s;
        if (normS && normS !== selectedSexe) return;
      }

      // Filtrage par catégorie si active
      if (selectedCategory !== 'ALL') {
        const code = normalizeCategoryCode(r.categorie);
        if (code !== selectedCategory) return;
      }

      const c = (r.code_ep || '').trim().replace(/^0+/, '');
      if (c) {
        codeCounts.set(c, (codeCounts.get(c) || 0) + 1);
        if (r.discipline && !codeFallbackDiscipline.has(c)) {
          codeFallbackDiscipline.set(c, r.discipline);
        }
      }
    });

    const list = Array.from(codeCounts.entries()).map(([code, count]) => {
      const info = getEventInfoByCodeEp(code, codeFallbackDiscipline.get(code));
      const sortPriority = getDisciplineSortPriority(info.name);
      return {
        code_ep: code,
        name: info.name,
        label: `${info.name} (Code ${code})`,
        family: info.family,
        nature: info.nature,
        structure: info.structure,
        count,
        sortPriority,
      };
    });

    // Tri officiel : Courses (sprint, haies, demi-fond, marche) -> Sauts -> Lancers -> Combinées
    return list.sort((a, b) => {
      if (a.sortPriority !== b.sortPriority) {
        return a.sortPriority - b.sortPriority;
      }
      return a.code_ep.localeCompare(b.code_ep, 'fr', { numeric: true });
    });
  }, [currentCompetition, rawCompetitionRecords, selectedSexe, selectedCategory]);

  // Réinitialisation automatique de la discipline si non présente dans les codes disponibles
  useEffect(() => {
    if (selectedDiscipline !== 'ALL') {
      const exists = competitionEventCodes.some(e => e.code_ep === selectedDiscipline);
      if (!exists) {
        setSelectedDisciplineState('ALL');
      }
    }
  }, [competitionEventCodes, selectedDiscipline]);

  // Métadonnées de l'épreuve active (nom, famille, nature de performance)
  const selectedEventInfo = useMemo(() => {
    if (selectedDiscipline === 'ALL') return null;
    return competitionEventCodes.find(e => e.code_ep === selectedDiscipline) || getEventInfoByCodeEp(selectedDiscipline);
  }, [selectedDiscipline, competitionEventCodes]);

  // Onglet actif : 'results' | 'placing-table' | 'territories' | 'evolution'
  const [activeTab, setActiveTab] = useState<'results' | 'placing-table' | 'territories' | 'evolution'>('results');

  // Sous-onglet de la Placing Table : 'clubs' | 'regions' | 'departments'
  const [placingTableEntity, setPlacingTableEntity] = useState<'clubs' | 'regions' | 'departments'>('clubs');

  // Tri de l'onglet Statistiques Territoriales (clubs/ligues/départements)
  // Options requises : "Nbre de Médailles d'OR", "Nbre de médailles d'ARGENT", "Nbre de médailles de BRONZE", "Nbre de finalistes", "Nbre de participant.e.s"
  const [territorialSort, setTerritorialSort] = useState<TerritorialSortCriterion>('participants');
  const [showAllClubs, setShowAllClubs] = useState<boolean>(false);
  const [showAllDepartments, setShowAllDepartments] = useState<boolean>(false);

  // Enregistrements filtrés pour la compétition sélectionnée
  const competitionRecords = useMemo(() => {
    if (!currentCompetition) return [];
    return rawCompetitionRecords.filter(r => {
      // Filtre Sexe
      if (selectedSexe !== 'ALL') {
        const s = (r.sexe || '').toUpperCase().trim();
        const normS = (s === 'H' || s === 'MASCULIN') ? 'M' : (s === 'FEMME' || s === 'FÉMININ') ? 'F' : s;
        if (normS && normS !== selectedSexe) return false;
      }

      // Filtre Catégorie
      if (selectedCategory !== 'ALL') {
        const code = normalizeCategoryCode(r.categorie);
        if (code !== selectedCategory) return false;
      }

      return true;
    });
  }, [rawCompetitionRecords, currentCompetition, selectedSexe, selectedCategory]);

  // Performances pour le code épreuve sélectionné (ou toutes si 'ALL')
  const disciplineFilteredRecords = useMemo(() => {
    if (selectedDiscipline === 'ALL') return competitionRecords;
    const cleanTarget = selectedDiscipline.replace(/^0+/, '');
    return competitionRecords.filter(r => {
      const c = (r.code_ep || '').trim().replace(/^0+/, '');
      if (c && cleanTarget) return c === cleanTarget;
      return r.discipline === selectedDiscipline;
    });
  }, [competitionRecords, selectedDiscipline]);

  // Classement trié des athlètes pour l'épreuve (du 1er au dernier) selon la nature de la discipline
  const rankedDisciplineResults = useMemo(() => {
    if (selectedDiscipline === 'ALL' || !selectedEventInfo) return [];
    const nature = selectedEventInfo.nature || getDisciplineNature(selectedEventInfo.name);

    const sorted = [...disciplineFilteredRecords].sort((a, b) => {
      const valA = nature === 'distance' ? normalizeDistanceValue(a.performanceValue, selectedEventInfo.name) : a.performanceValue;
      const valB = nature === 'distance' ? normalizeDistanceValue(b.performanceValue, selectedEventInfo.name) : b.performanceValue;

      if (a.perf_ajustee !== undefined && b.perf_ajustee !== undefined) {
        return a.perf_ajustee - b.perf_ajustee;
      }

      if (nature === 'time') return valA - valB;
      return valB - valA;
    });

    let frenchRankCounter = 0;

    return sorted.map((rec) => {
      const isForeign = isForeignAthlete(rec.nationalite);

      if (isForeign) {
        return {
          rank: null, // Pas de place indiquée pour les athlètes étrangers
          isForeign: true,
          record: rec,
          placingPoints: 0,
          isPodium: false,
          isFinalist: false,
        };
      }

      frenchRankCounter += 1;
      const rank = frenchRankCounter;
      const placingPoints = PLACING_TABLE_POINTS[rank] || 0;
      return {
        rank,
        isForeign: false,
        record: rec,
        placingPoints,
        isPodium: rank <= 3,
        isFinalist: rank <= 8,
      };
    });
  }, [disciplineFilteredRecords, selectedDiscipline, selectedEventInfo]);

  // --------------------------------------------------------------------------
  // CALCULS PLACING TABLE (CLUBS, RÉGIONS, DÉPARTEMENTS)
  // --------------------------------------------------------------------------
  const placingTableData = useMemo(() => {
    // Regrouper par code épreuve officiel (code_ep) pour attribuer les points aux places 1 à 8
    const byEvent = new Map<string, PerformanceRecord[]>();
    competitionRecords.forEach(r => {
      const codeKey = (r.code_ep || '').trim().replace(/^0+/, '') || r.discipline || '000';
      if (!byEvent.has(codeKey)) {
        byEvent.set(codeKey, []);
      }
      byEvent.get(codeKey)!.push(r);
    });

    const clubScores = new Map<string, {
      clubName: string;
      departement: string;
      region: string;
      totalPoints: number;
      finalistsCount: number;
      goldMedals: number;
      silverMedals: number;
      bronzeMedals: number;
      topPerformers: string[];
    }>();

    const regionScores = new Map<string, {
      regionName: string;
      totalPoints: number;
      finalistsCount: number;
      goldMedals: number;
      silverMedals: number;
      bronzeMedals: number;
      athletesCount: number;
      clubsCount: Set<string>;
    }>();

    const departmentScores = new Map<string, {
      dptCode: string;
      regionName: string;
      totalPoints: number;
      finalistsCount: number;
      goldMedals: number;
      silverMedals: number;
      bronzeMedals: number;
      clubsCount: Set<string>;
    }>();

    // Pour chaque code épreuve, classer les athlètes et distribuer les points Top 8
    byEvent.forEach((recordsList, codeKey) => {
      // Si une discipline précise est sélectionnée, ne compter que celle-ci si l'utilisateur le souhaite
      if (selectedDiscipline !== 'ALL' && codeKey !== selectedDiscipline.replace(/^0+/, '')) return;

      const eventInfo = getEventInfoByCodeEp(codeKey, recordsList[0]?.discipline);
      const nature = eventInfo.nature || getDisciplineNature(eventInfo.name);
      const sorted = [...recordsList].sort((a, b) => {
        const valA = nature === 'distance' ? normalizeDistanceValue(a.performanceValue, eventInfo.name) : a.performanceValue;
        const valB = nature === 'distance' ? normalizeDistanceValue(b.performanceValue, eventInfo.name) : b.performanceValue;
        if (a.perf_ajustee !== undefined && b.perf_ajustee !== undefined) return a.perf_ajustee - b.perf_ajustee;
        if (nature === 'time') return valA - valB;
        return valB - valA;
      });

      // Top 8 finalistes (réservé aux athlètes français selon les règles officielles)
      const frenchSorted = sorted.filter(r => !isForeignAthlete(r.nationalite));
      frenchSorted.slice(0, 8).forEach((rec, idx) => {
        const rank = idx + 1;
        const pts = PLACING_TABLE_POINTS[rank] || 0;
        const cName = rec.club || 'Club Indépendant';
        const reg = rec.region || 'National';
        const dpt = rec.departement || '75';

        // 1. Club
        if (!clubScores.has(cName)) {
          clubScores.set(cName, {
            clubName: cName,
            departement: dpt,
            region: reg,
            totalPoints: 0,
            finalistsCount: 0,
            goldMedals: 0,
            silverMedals: 0,
            bronzeMedals: 0,
            topPerformers: [],
          });
        }
        const cEntry = clubScores.get(cName)!;
        cEntry.totalPoints += pts;
        cEntry.finalistsCount += 1;
        if (rank === 1) cEntry.goldMedals += 1;
        else if (rank === 2) cEntry.silverMedals += 1;
        else if (rank === 3) cEntry.bronzeMedals += 1;
        if (!cEntry.topPerformers.includes(rec.athleteName) && cEntry.topPerformers.length < 3) {
          cEntry.topPerformers.push(rec.athleteName);
        }

        // 2. Région
        if (!regionScores.has(reg)) {
          regionScores.set(reg, {
            regionName: reg,
            totalPoints: 0,
            finalistsCount: 0,
            goldMedals: 0,
            silverMedals: 0,
            bronzeMedals: 0,
            athletesCount: 0,
            clubsCount: new Set(),
          });
        }
        const rEntry = regionScores.get(reg)!;
        rEntry.totalPoints += pts;
        rEntry.finalistsCount += 1;
        if (rank === 1) rEntry.goldMedals += 1;
        else if (rank === 2) rEntry.silverMedals += 1;
        else if (rank === 3) rEntry.bronzeMedals += 1;
        rEntry.clubsCount.add(cName);

        // 3. Département
        if (!departmentScores.has(dpt)) {
          departmentScores.set(dpt, {
            dptCode: dpt,
            regionName: reg,
            totalPoints: 0,
            finalistsCount: 0,
            goldMedals: 0,
            silverMedals: 0,
            bronzeMedals: 0,
            clubsCount: new Set(),
          });
        }
        const dEntry = departmentScores.get(dpt)!;
        dEntry.totalPoints += pts;
        dEntry.finalistsCount += 1;
        if (rank === 1) dEntry.goldMedals += 1;
        else if (rank === 2) dEntry.silverMedals += 1;
        else if (rank === 3) dEntry.bronzeMedals += 1;
        dEntry.clubsCount.add(cName);
      });
    });

    const clubsRanked = Array.from(clubScores.values()).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.goldMedals !== a.goldMedals) return b.goldMedals - a.goldMedals;
      return b.finalistsCount - a.finalistsCount;
    });

    const regionsRanked = Array.from(regionScores.values()).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.goldMedals - a.goldMedals;
    });

    const departmentsRanked = Array.from(departmentScores.values()).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.goldMedals - a.goldMedals;
    });

    return {
      clubsRanked,
      regionsRanked,
      departmentsRanked,
      totalFinalistsPointsDistributed: clubsRanked.reduce((acc, c) => acc + c.totalPoints, 0),
    };
  }, [competitionRecords, selectedDiscipline]);

  // --------------------------------------------------------------------------
  // STATISTIQUES TERRITORIALES (CLUBS, RÉGIONS, DÉPARTEMENTS LES PLUS REPRÉSENTÉS)
  // Calcul complet des médailles d'OR, d'ARGENT, de BRONZE, des finalistes et des participant.e.s
  // --------------------------------------------------------------------------
  const territorialStats = useMemo(() => {
    interface EntityScore {
      athletes: Set<string>;
      perfsCount: number;
      goldMedals: number;
      silverMedals: number;
      bronzeMedals: number;
      finalistsCount: number;
      totalPoints: number;
    }

    const clubMap = new Map<string, EntityScore & { name: string; dpt: string; reg: string }>();
    const regMap = new Map<string, EntityScore & { name: string; clubs: Set<string> }>();
    const dptMap = new Map<string, EntityScore & { code: string; reg: string; clubs: Set<string> }>();

    const recordsToUse = selectedDiscipline === 'ALL' ? competitionRecords : disciplineFilteredRecords;

    recordsToUse.forEach(r => {
      const c = r.club || 'Indépendant';
      const reg = r.region || 'National';
      const dpt = r.departement || '75';

      // Club
      if (!clubMap.has(c)) {
        clubMap.set(c, {
          name: c,
          dpt,
          reg,
          athletes: new Set(),
          perfsCount: 0,
          goldMedals: 0,
          silverMedals: 0,
          bronzeMedals: 0,
          finalistsCount: 0,
          totalPoints: 0,
        });
      }
      const cEnt = clubMap.get(c)!;
      cEnt.athletes.add(r.athleteName);
      cEnt.perfsCount += 1;

      // Région
      if (!regMap.has(reg)) {
        regMap.set(reg, {
          name: reg,
          clubs: new Set(),
          athletes: new Set(),
          perfsCount: 0,
          goldMedals: 0,
          silverMedals: 0,
          bronzeMedals: 0,
          finalistsCount: 0,
          totalPoints: 0,
        });
      }
      const regEnt = regMap.get(reg)!;
      regEnt.athletes.add(r.athleteName);
      regEnt.clubs.add(c);
      regEnt.perfsCount += 1;

      // Département
      if (!dptMap.has(dpt)) {
        dptMap.set(dpt, {
          code: dpt,
          reg,
          clubs: new Set(),
          athletes: new Set(),
          perfsCount: 0,
          goldMedals: 0,
          silverMedals: 0,
          bronzeMedals: 0,
          finalistsCount: 0,
          totalPoints: 0,
        });
      }
      const dptEnt = dptMap.get(dpt)!;
      dptEnt.athletes.add(r.athleteName);
      dptEnt.clubs.add(c);
      dptEnt.perfsCount += 1;
    });

    // 2. Calcul officiel des médailles d'OR, ARGENT, BRONZE et des finalistes (Top 8)
    const byEvent = new Map<string, PerformanceRecord[]>();
    recordsToUse.forEach(r => {
      const codeKey = (r.code_ep || '').trim().replace(/^0+/, '') || r.discipline;
      const s = (r.sexe || '').toUpperCase().trim();
      const normS = (s === 'H' || s === 'MASCULIN') ? 'M' : (s === 'FEMME' || s === 'FÉMININ') ? 'F' : s;
      const cat = normalizeCategoryCode(r.categorie);
      const eventKey = `${codeKey}_${normS}_${cat}`;
      if (!byEvent.has(eventKey)) byEvent.set(eventKey, []);
      byEvent.get(eventKey)!.push(r);
    });

    byEvent.forEach((recordsList) => {
      const first = recordsList[0];
      const codeKey = (first.code_ep || '').trim().replace(/^0+/, '') || first.discipline;
      const eventInfo = getEventInfoByCodeEp(codeKey, first.discipline);
      const nature = eventInfo.nature || getDisciplineNature(eventInfo.name);

      // Ne conserver que la meilleure performance par athlète pour cette épreuve
      const athleteBestInEvent = new Map<string, PerformanceRecord>();
      recordsList.forEach(rec => {
        const aKey = rec.athleteName.toLowerCase().trim();
        const existing = athleteBestInEvent.get(aKey);
        if (!existing) {
          athleteBestInEvent.set(aKey, rec);
        } else {
          const valNew = nature === 'distance' ? normalizeDistanceValue(rec.performanceValue, eventInfo.name) : rec.performanceValue;
          const valOld = nature === 'distance' ? normalizeDistanceValue(existing.performanceValue, eventInfo.name) : existing.performanceValue;
          const isBetter = nature === 'time' ? valNew < valOld : valNew > valOld;
          if (isBetter) athleteBestInEvent.set(aKey, rec);
        }
      });

      const sorted = Array.from(athleteBestInEvent.values()).sort((a, b) => {
        const valA = nature === 'distance' ? normalizeDistanceValue(a.performanceValue, eventInfo.name) : a.performanceValue;
        const valB = nature === 'distance' ? normalizeDistanceValue(b.performanceValue, eventInfo.name) : b.performanceValue;
        if (a.perf_ajustee !== undefined && b.perf_ajustee !== undefined) return a.perf_ajustee - b.perf_ajustee;
        if (nature === 'time') return valA - valB;
        return valB - valA;
      });

      // Attribution des places 1 à 8 (Or, Argent, Bronze et Finalistes) réservée aux athlètes français
      const frenchSorted = sorted.filter(r => !isForeignAthlete(r.nationalite));
      frenchSorted.slice(0, 8).forEach((rec, idx) => {
        const rank = idx + 1;
        const pts = PLACING_TABLE_POINTS[rank] || 0;
        const c = rec.club || 'Indépendant';
        const reg = rec.region || 'National';
        const dpt = rec.departement || '75';

        const cEnt = clubMap.get(c);
        if (cEnt) {
          cEnt.totalPoints += pts;
          cEnt.finalistsCount += 1;
          if (rank === 1) cEnt.goldMedals += 1;
          else if (rank === 2) cEnt.silverMedals += 1;
          else if (rank === 3) cEnt.bronzeMedals += 1;
        }

        const regEnt = regMap.get(reg);
        if (regEnt) {
          regEnt.totalPoints += pts;
          regEnt.finalistsCount += 1;
          if (rank === 1) regEnt.goldMedals += 1;
          else if (rank === 2) regEnt.silverMedals += 1;
          else if (rank === 3) regEnt.bronzeMedals += 1;
        }

        const dptEnt = dptMap.get(dpt);
        if (dptEnt) {
          dptEnt.totalPoints += pts;
          dptEnt.finalistsCount += 1;
          if (rank === 1) dptEnt.goldMedals += 1;
          else if (rank === 2) dptEnt.silverMedals += 1;
          else if (rank === 3) dptEnt.bronzeMedals += 1;
        }
      });
    });

    const totalAthletes = new Set(recordsToUse.map(r => r.athleteName)).size || 1;

    // Fonction de tri dynamique selon le critère choisi par l'utilisateur
    const sortFunction = (
      a: EntityScore,
      b: EntityScore
    ) => {
      if (territorialSort === 'gold') {
        if (b.goldMedals !== a.goldMedals) return b.goldMedals - a.goldMedals;
        if (b.silverMedals !== a.silverMedals) return b.silverMedals - a.silverMedals;
        if (b.bronzeMedals !== a.bronzeMedals) return b.bronzeMedals - a.bronzeMedals;
        if (b.finalistsCount !== a.finalistsCount) return b.finalistsCount - a.finalistsCount;
        return b.athletes.size - a.athletes.size;
      }
      if (territorialSort === 'silver') {
        if (b.silverMedals !== a.silverMedals) return b.silverMedals - a.silverMedals;
        if (b.goldMedals !== a.goldMedals) return b.goldMedals - a.goldMedals;
        if (b.bronzeMedals !== a.bronzeMedals) return b.bronzeMedals - a.bronzeMedals;
        if (b.finalistsCount !== a.finalistsCount) return b.finalistsCount - a.finalistsCount;
        return b.athletes.size - a.athletes.size;
      }
      if (territorialSort === 'bronze') {
        if (b.bronzeMedals !== a.bronzeMedals) return b.bronzeMedals - a.bronzeMedals;
        if (b.goldMedals !== a.goldMedals) return b.goldMedals - a.goldMedals;
        if (b.silverMedals !== a.silverMedals) return b.silverMedals - a.silverMedals;
        if (b.finalistsCount !== a.finalistsCount) return b.finalistsCount - a.finalistsCount;
        return b.athletes.size - a.athletes.size;
      }
      if (territorialSort === 'finalists') {
        if (b.finalistsCount !== a.finalistsCount) return b.finalistsCount - a.finalistsCount;
        if (b.goldMedals !== a.goldMedals) return b.goldMedals - a.goldMedals;
        if (b.silverMedals !== a.silverMedals) return b.silverMedals - a.silverMedals;
        if (b.bronzeMedals !== a.bronzeMedals) return b.bronzeMedals - a.bronzeMedals;
        return b.athletes.size - a.athletes.size;
      }
      // 'participants' (Nbre de participant.e.s)
      if (b.athletes.size !== a.athletes.size) return b.athletes.size - a.athletes.size;
      if (b.finalistsCount !== a.finalistsCount) return b.finalistsCount - a.finalistsCount;
      if (b.goldMedals !== a.goldMedals) return b.goldMedals - a.goldMedals;
      return b.perfsCount - a.perfsCount;
    };

    const allClubs = Array.from(clubMap.values())
      .map(c => ({
        ...c,
        athletesCount: c.athletes.size,
        percent: Math.round((c.athletes.size / totalAthletes) * 100),
      }))
      .sort(sortFunction);

    const allRegions = Array.from(regMap.values())
      .map(r => ({
        ...r,
        athletesCount: r.athletes.size,
        clubsCount: r.clubs.size,
        percent: Math.round((r.athletes.size / totalAthletes) * 100),
      }))
      .sort(sortFunction);

    const allDepartments = Array.from(dptMap.values())
      .map(d => ({
        ...d,
        athletesCount: d.athletes.size,
        clubsCount: d.clubs.size,
        percent: Math.round((d.athletes.size / totalAthletes) * 100),
      }))
      .sort(sortFunction);

    const getMetricVal = (item?: { goldMedals: number; silverMedals: number; bronzeMedals: number; finalistsCount: number; athletesCount: number }) => {
      if (!item) return 1;
      if (territorialSort === 'gold') return item.goldMedals || 1;
      if (territorialSort === 'silver') return item.silverMedals || 1;
      if (territorialSort === 'bronze') return item.bronzeMedals || 1;
      if (territorialSort === 'finalists') return item.finalistsCount || 1;
      return item.athletesCount || 1;
    };

    const topClubs = showAllClubs ? allClubs : allClubs.slice(0, 15);
    const topRegions = allRegions;
    const topDepartments = showAllDepartments ? allDepartments : allDepartments.slice(0, 15);

    return {
      allClubs,
      topClubs,
      allRegions,
      topRegions,
      allDepartments,
      topDepartments,
      totalUniqueAthletes: totalAthletes,
      totalClubsRepresented: clubMap.size,
      totalRegionsRepresented: regMap.size,
      totalDepartmentsRepresented: dptMap.size,
      maxValClubs: getMetricVal(allClubs[0]),
      maxValRegions: getMetricVal(allRegions[0]),
      maxValDepartments: getMetricVal(allDepartments[0]),
    };
  }, [competitionRecords, selectedDiscipline, disciplineFilteredRecords, territorialSort, showAllClubs, showAllDepartments]);

  // --------------------------------------------------------------------------
  // ÉVOLUTION DES PERFORMANCES SUIVANT LES ANNÉES POUR CETTE COMPÉTITION
  // --------------------------------------------------------------------------
  const multiYearEvolution = useMemo(() => {
    if (!currentCompetition || selectedDiscipline === 'ALL') return null;

    // Retrouver toutes les éditions de cette même compétition (même cleanTitle officiel)
    const seriesTitle = currentCompetition.cleanTitle.toLowerCase().trim();
    const relatedCompetitions = availableCompetitions.filter(c => {
      const t = c.cleanTitle.toLowerCase().trim();
      return t === seriesTitle;
    });

    const eventInfo = selectedEventInfo || getEventInfoByCodeEp(selectedDiscipline);
    const nature = eventInfo.nature || getDisciplineNature(eventInfo.name);

    const yearlyData = relatedCompetitions.map(comp => {
      // Trouver les perfs pour cette compétition et ce code épreuve
      const recs = records.filter(r => {
        const rawComp = (r.nom_compet || '').trim();
        const matchedTitle = matchOfficialNationalChampionship(rawComp);
        const yr = r.saison || (r.date ? parseInt(r.date.split('-')[0], 10) : 2026);
        if (!matchedTitle || `${matchedTitle}__${yr}` !== comp.id) return false;

        const c = (r.code_ep || '').trim().replace(/^0+/, '');
        const targetC = selectedDiscipline.replace(/^0+/, '');
        return (c && targetC) ? c === targetC : r.discipline === selectedDiscipline;
      });

      if (recs.length === 0) return null;

      const sorted = [...recs].sort((a, b) => {
        const valA = nature === 'distance' ? normalizeDistanceValue(a.performanceValue, eventInfo.name) : a.performanceValue;
        const valB = nature === 'distance' ? normalizeDistanceValue(b.performanceValue, eventInfo.name) : b.performanceValue;
        if (a.perf_ajustee !== undefined && b.perf_ajustee !== undefined) return a.perf_ajustee - b.perf_ajustee;
        if (nature === 'time') return valA - valB;
        return valB - valA;
      });

      // Le champion de France officiel est le 1er athlète français
      const frenchSorted = sorted.filter(r => !isForeignAthlete(r.nationalite));
      const winner = frenchSorted[0] || sorted[0];
      const podium = (frenchSorted.length >= 3 ? frenchSorted : sorted).slice(0, 3);
      const finalists = (frenchSorted.length >= 8 ? frenchSorted : sorted).slice(0, 8);
      const lastFinalist = finalists[finalists.length - 1];

      const podiumAvg = podium.reduce((acc, r) => acc + r.performanceValue, 0) / podium.length;

      return {
        year: comp.seasonYear,
        seasonLabel: comp.seasonLabel,
        lieu: comp.lieu,
        participantsCount: recs.length,
        winner: winner ? {
          name: winner.athleteName,
          perfDisplay: formatPerformanceDisplay(winner.performanceValue, nature, eventInfo.name),
          perfValue: winner.performanceValue,
          club: winner.club,
          sexe: winner.sexe,
          categorie: winner.categorie,
        } : null,
        podiumAverage: podiumAvg ? formatPerformanceDisplay(podiumAvg, nature, eventInfo.name) : '-',
        podiumAverageValue: podiumAvg,
        cutoffFinalist: lastFinalist ? {
          name: lastFinalist.athleteName,
          perfDisplay: formatPerformanceDisplay(lastFinalist.performanceValue, nature, eventInfo.name),
          perfValue: lastFinalist.performanceValue,
        } : null,
      };
    }).filter(Boolean).sort((a: any, b: any) => a.year - b.year);

    return yearlyData as Array<{
      year: number;
      seasonLabel: string;
      lieu: string;
      participantsCount: number;
      winner: { name: string; perfDisplay: string; perfValue: number; club: string; sexe?: string; categorie?: string } | null;
      podiumAverage: string;
      podiumAverageValue: number;
      cutoffFinalist: { name: string; perfDisplay: string; perfValue: number } | null;
    }>;
  }, [currentCompetition, selectedDiscipline, selectedEventInfo, availableCompetitions, records]);

  // Exports
  const handleExportExcel = () => {
    if (!currentCompetition) return;
    const discLabel = selectedEventInfo ? `${selectedEventInfo.name}_Code${selectedEventInfo.code_ep}` : 'Toutes_Epreuves';
    exportToExcel(
      disciplineFilteredRecords,
      `CompetNat_${currentCompetition.cleanTitle.replace(/\s+/g, '_')}_${discLabel}`
    );
  };

  const handleExportWord = () => {
    if (!currentCompetition) return;
    exportToWord(
      `Rapport Officiel : ${currentCompetition.rawName}`,
      `Fédération Française d'Athlétisme · Synthèse Compétitions Nationales`,
      [
        {
          heading: `1. Informations Générales & Participation`,
          text: `La compétition ${currentCompetition.rawName} (${currentCompetition.seasonLabel}) s'est déroulée à ${currentCompetition.lieu}. Elle rassemble ${competitionRecords.length} performances certifiées, ${territorialStats.totalUniqueAthletes} athlètes issus de ${territorialStats.totalClubsRepresented} clubs et ${territorialStats.totalRegionsRepresented} ligues régionales.`,
        },
        {
          heading: `2. Classement des Clubs à la Placing Table (Top 10)`,
          tableHeaders: ['Rang', 'Club', 'Points Placing Table', 'Finalistes Top 8', 'Médailles Or', 'Médailles Argent', 'Médailles Bronze'],
          tableRows: placingTableData.clubsRanked.slice(0, 10).map((c, idx) => [
            `#${idx + 1}`,
            c.clubName,
            `${c.totalPoints} pts`,
            String(c.finalistsCount),
            String(c.goldMedals),
            String(c.silverMedals),
            String(c.bronzeMedals),
          ]),
        },
      ]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      
      {/* ============================================================= */}
      {/* 1. EN-TÊTE PRINCIPAL : SÉLECTION DE LA COMPÉTITION & DISCIPLINE */}
      {/* ============================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-600/10 via-amber-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-rose-400 border border-rose-500/30 shrink-0 shadow-inner">
                <Flag className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Compétitions Nationales (Compet Nat.)
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Officiel FFA
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Résultats officiels, classements à la Placing Table (clubs, ligues, départements) et analyses d'évolution multi-saisons
                </p>
              </div>
            </div>

            {/* Actions d'export rapide et synchronisation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncReferenceDataset}
                disabled={isSyncing}
                className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                title="Synchroniser et recharger le fichier officiel de référence Rslts_25-26.csv (GitHub Releases)"
              >
                <RefreshCw className={`w-4 h-4 text-rose-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Chargement...' : 'Synchroniser Bilan Officiel'}</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Exporter les résultats au format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={handleExportWord}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Exporter le palmarès et la placing table au format Word (.doc)"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Word</span>
              </button>
            </div>
          </div>

          {/* Barre de progression si synchronisation en cours */}
          {isSyncing && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-rose-500/40 space-y-2 animate-fade-in shadow-inner">
              <div className="flex items-center justify-between text-xs text-rose-300 font-semibold">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                  <span>{syncStatus || 'Chargement et indexation des championnats nationaux...'}</span>
                </span>
                <span className="font-mono text-white">{syncPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-300"
                  style={{ width: `${syncPercent}%` }}
                />
              </div>
            </div>
          )}

          {syncError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {/* SÉLECTEURS EN CASCADE : SAISON -> PÉRIODE/COMPÉTITION -> DISCIPLINE -> SEXE -> CATÉGORIE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
            {/* 1. Choix de la Saison (Toutes les saisons + saisons détectées dans les bilans) */}
            <div className="sm:col-span-1 md:col-span-3 lg:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>1. Saison :</span>
                </span>
                <span className="text-[10px] text-sky-400 font-mono font-bold">
                  {selectedSeasonFilter === 'ALL' ? 'Toutes' : selectedSeasonFilter}
                </span>
              </label>
              <div className="relative">
                <select
                  value={selectedSeasonFilter}
                  onChange={(e) => {
                    setSelectedSeasonFilter(e.target.value);
                    setSelectedDisciplineState('ALL');
                    setSelectedSexe('ALL');
                    setSelectedCategory('ALL');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-sky-500 focus:outline-none text-xs text-white font-medium cursor-pointer shadow-sm truncate"
                >
                  <option value="ALL">★ Toutes ({availableSeasons.length})</option>
                  {availableSeasons.map(s => (
                    <option key={s} value={s}>
                      📅 Saison {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Choix de la Compétition classée par Période Hivernale puis Estivale, par ordre alphabétique */}
            <div className="sm:col-span-2 md:col-span-5 lg:col-span-4 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Compétition Nationale :</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  {filteredCompetitions.length} dispo{filteredCompetitions.length > 1 ? 's' : ''}
                </span>
              </label>
              <div className="relative">
                <select
                  value={selectedCompetitionId}
                  onChange={(e) => {
                    setSelectedCompetitionId(e.target.value);
                    setSelectedDisciplineState('ALL');
                    setSelectedSexe('ALL');
                    setSelectedCategory('ALL');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-rose-500 focus:outline-none text-xs text-white font-medium cursor-pointer shadow-sm truncate"
                >
                  {filteredCompetitions.length === 0 ? (
                    <option value="">Aucune compétition pour cette sélection</option>
                  ) : (
                    <>
                      {/* PÉRIODE HIVERNALE - PAR ORDRE ALPHABÉTIQUE */}
                      {winterCompetitions.length > 0 && (
                        <optgroup label={`❄️ PÉRIODE HIVERNALE (${winterCompetitions.length})`}>
                          {winterCompetitions.map(comp => (
                            <option key={comp.id} value={comp.id}>
                              ❄️ {comp.cleanTitle} {selectedSeasonFilter === 'ALL' ? `(${comp.seasonLabel})` : ''} — {comp.lieu} [{comp.recordsCount} perfs]
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {/* PÉRIODE ESTIVALE - PAR ORDRE ALPHABÉTIQUE */}
                      {summerCompetitions.length > 0 && (
                        <optgroup label={`☀️ PÉRIODE ESTIVALE (${summerCompetitions.length})`}>
                          {summerCompetitions.map(comp => (
                            <option key={comp.id} value={comp.id}>
                              ☀️ {comp.cleanTitle} {selectedSeasonFilter === 'ALL' ? `(${comp.seasonLabel})` : ''} — {comp.lieu} [{comp.recordsCount} perfs]
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* 3. Choix de la Discipline par Code Épreuve officiel */}
            <div className="sm:col-span-1 md:col-span-4 lg:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Medal className="w-3.5 h-3.5 text-purple-400" />
                  <span>3. Discipline (Code) :</span>
                </span>
                <span className="text-[10px] text-purple-400 font-mono font-bold">
                  {competitionEventCodes.length} codes
                </span>
              </label>
              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDisciplineState(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-purple-500 focus:outline-none text-xs text-white font-medium cursor-pointer shadow-sm truncate"
              >
                <option value="ALL">★ Toutes les épreuves (Placing Table générale)</option>
                {['Sprint et Haies', 'Demi-Fond & Fond', 'Marche', 'Sauts', 'Lancers', 'Épreuves Combinées', 'Triathlon', 'Autre'].map(fam => {
                  const famEvents = competitionEventCodes.filter(e => e.family === fam);
                  if (famEvents.length === 0) return null;
                  const famIcon = 
                    fam === 'Sprint et Haies' || fam === 'Demi-Fond & Fond' ? '🏃' :
                    fam === 'Marche' ? '⏱️' :
                    fam === 'Sauts' ? '🦅' :
                    fam === 'Lancers' ? '💥' :
                    fam === 'Épreuves Combinées' || fam === 'Triathlon' ? '🏅' : '📌';

                  return (
                    <optgroup key={fam} label={`${famIcon} ${fam}`}>
                      {famEvents.map(ev => (
                        <option key={ev.code_ep} value={ev.code_ep}>
                          {ev.name} — Code {ev.code_ep} ({ev.count} perfs)
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            {/* 4. SEXE */}
            <div className="sm:col-span-1 md:col-span-6 lg:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>4. SEXE :</span>
              </label>
              <select
                value={selectedSexe}
                onChange={(e) => setSelectedSexe(e.target.value as any)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-sky-500 focus:outline-none text-xs text-white cursor-pointer truncate font-medium shadow-sm"
                title="Filtrer par sexe"
              >
                <option value="ALL">
                  Tous ({sexStats.total.toLocaleString('fr-FR')})
                </option>
                <option value="M" disabled={sexStats.m === 0}>
                  Hommes ({sexStats.m.toLocaleString('fr-FR')})
                </option>
                <option value="F" disabled={sexStats.f === 0}>
                  Femmes ({sexStats.f.toLocaleString('fr-FR')})
                </option>
              </select>
            </div>

            {/* 5. Cat. */}
            <div className="sm:col-span-1 md:col-span-6 lg:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>5. Cat. :</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {availableCategories.length} cat.
                </span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 focus:outline-none text-xs text-white cursor-pointer truncate font-medium shadow-sm"
                title="Filtrer par catégorie d'âge"
              >
                <option value="ALL">
                  Toutes ({availableCategories.reduce((acc, c) => acc + c.count, 0)})
                </option>
                {availableCategories.map(cat => (
                  <option key={cat.code} value={cat.code}>
                    {cat.label} ({cat.count.toLocaleString('fr-FR')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FICHE D'IDENTITÉ DE LA COMPÉTITION ACTUELLE */}
          {currentCompetition && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-white text-sm">
                  {currentCompetition.rawName}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800/50 font-mono text-[11px] font-bold">
                  Saison {currentCompetition.seasonLabel}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
                  {currentCompetition.structure === 'SALLE' ? 'Salle (Indoor)' : 'Plein Air (Extérieur)'}
                </span>
                <span className="text-slate-400 flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{currentCompetition.lieu}</span>
                </span>
              </div>

              {/* Source du fichier */}
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span className="text-slate-500">Source :</span>
                <span className="text-sky-400 font-semibold">
                  {Array.from(currentCompetition.sourceFiles).join(', ') || 'GitHub Releases officiel'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SI AUCUNE COMPÉTITION NATIONALE DÉTECTÉE */}
      {availableCompetitions.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8 text-rose-400" />
          </div>

          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Aucune compétition nationale détectée dans les données en mémoire
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pour afficher les résultats officiels, les classements à la Placing Table et l'évolution des performances, cette page cible spécifiquement les 16 championnats et finales nationales répertoriés à la colonne C (<span className="font-mono text-rose-300 font-semibold">nom_compet</span>) et classés par codes épreuves officiels (<span className="font-mono text-purple-300 font-semibold">code_ep</span>).
            </p>
          </div>

          {/* Liste des 16 compétitions officielles ciblées */}
          <div className="max-w-3xl mx-auto p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Les 16 Championnats Nationaux FFA ciblés :</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {TARGET_NATIONAL_CHAMPIONSHIPS.map((target, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span className="truncate">{target}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Boutons d'action pour synchroniser */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSyncReferenceDataset}
              disabled={isSyncing}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-rose-900/30 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing ? 'Chargement du fichier officiel...' : '⚡ Charger & Synchroniser le bilan officiel (Rslts_25-26.csv)'}
              </span>
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('import')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Accéder au module Import & Export</span>
              </button>
            )}
          </div>

          {syncStatus && (
            <p className="text-xs text-slate-400 font-mono animate-fade-in">{syncStatus}</p>
          )}
          {syncError && (
            <p className="text-xs text-rose-400 font-medium animate-fade-in">{syncError}</p>
          )}
        </div>
      ) : (
        <>
          {/* ============================================================= */}
          {/* 2. 4 CARTES KPI SYNTHÉTIQUES DE LA COMPÉTITION                */}
          {/* ============================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Athlètes Engagés</div>
            <div className="text-xl font-mono font-black text-white mt-1">
              {territorialStats.totalUniqueAthletes} <span className="text-xs font-sans text-slate-400 font-normal">athlètes</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {competitionRecords.length} performances
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-950/60 text-sky-400 border border-blue-800/40">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clubs Représentés</div>
            <div className="text-xl font-mono font-black text-amber-400 mt-1">
              {territorialStats.totalClubsRepresented} <span className="text-xs font-sans text-slate-400 font-normal">clubs</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {territorialStats.topClubs[0] ? `Leader : ${territorialStats.topClubs[0].name.slice(0, 18)}` : 'Territoire national'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Territoires</div>
            <div className="text-xl font-mono font-black text-emerald-400 mt-1">
              {territorialStats.totalRegionsRepresented} <span className="text-xs font-sans text-slate-400 font-normal">ligues</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {territorialStats.totalDepartmentsRepresented} départements
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <Globe2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Points Placing Table</div>
            <div className="text-xl font-mono font-black text-rose-400 mt-1">
              {placingTableData.totalFinalistsPointsDistributed} <span className="text-xs font-sans text-slate-400 font-normal">pts</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Distribués aux finalistes Top 8
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/40">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. BARRE D'ONGLETS THÉMATIQUES                                */}
      {/* ============================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'results'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Medal className="w-4 h-4" />
          <span>Résultats & Podium {selectedEventInfo ? `(${selectedEventInfo.name})` : (selectedDiscipline !== 'ALL' ? `(${selectedDiscipline})` : '')}</span>
        </button>

        <button
          onClick={() => setActiveTab('placing-table')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'placing-table'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Classements Placing Table</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 text-rose-200">
            Points Finalistes
          </span>
        </button>

        <button
          onClick={() => setActiveTab('territories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'territories'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Clubs, Régions & Départements les plus représentés</span>
        </button>

        {multiYearEvolution && multiYearEvolution.length > 1 && (
          <button
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'evolution'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Évolution Pluriannuelle ({multiYearEvolution.length} saisons)</span>
          </button>
        )}
      </div>

      {/* ============================================================= */}
      {/* 4. CONTENU : ONGLET 1 - RÉSULTATS OFFICIELS & PODIUM           */}
      {/* ============================================================= */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Si 'ALL' disciplines est sélectionné, inciter à choisir une épreuve ou montrer le top */}
          {selectedDiscipline === 'ALL' ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
                <Medal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Sélectionnez une discipline spécifique pour afficher le palmarès et le podium officiel
                </h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1">
                  Cette compétition comporte {competitionEventCodes.length} épreuves homologuées (par code épreuve officiel). Cliquez sur une épreuve ci-dessous :
                </p>
              </div>

              {/* Badges cliquables des disciplines par code_ep */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto pt-2">
                {competitionEventCodes.map(ev => (
                  <button
                    key={ev.code_ep}
                    onClick={() => setSelectedDisciplineState(ev.code_ep)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-white border border-slate-700 hover:border-purple-500/50 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{ev.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                      Code {ev.code_ep}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({ev.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* CARTES PODIUM (1er Or, 2e Argent, 3e Bronze) */}
              {(() => {
                const compTitle = currentCompetition?.cleanTitle || currentCompetition?.rawName || '';
                // Selon les règles officielles, les titres de Champion de France et les médailles reviennent aux athlètes français
                const frenchPodium = rankedDisciplineResults.filter(r => !r.isForeign && r.rank !== null);
                if (frenchPodium.length < 3) return null;

                const firstFrench = frenchPodium.find(r => r.rank === 1) || frenchPodium[0];
                const secondFrench = frenchPodium.find(r => r.rank === 2) || frenchPodium[1];
                const thirdFrench = frenchPodium.find(r => r.rank === 3) || frenchPodium[2];

                const rank1 = getRankBadgeAndTitle(
                  1,
                  firstFrench.record.sexe,
                  firstFrench.record.categorie,
                  compTitle,
                  firstFrench.record.nationalite
                );
                const rank2 = getRankBadgeAndTitle(
                  2,
                  secondFrench.record.sexe,
                  secondFrench.record.categorie,
                  compTitle,
                  secondFrench.record.nationalite
                );
                const rank3 = getRankBadgeAndTitle(
                  3,
                  thirdFrench.record.sexe,
                  thirdFrench.record.categorie,
                  compTitle,
                  thirdFrench.record.nationalite
                );

                // Détecter si un athlète étranger a réalisé la meilleure marque
                const fastestOverall = rankedDisciplineResults[0];
                const foreignAhead = fastestOverall && fastestOverall.isForeign;

                return (
                  <div className="space-y-3.5">
                    {/* Information si un athlète étranger a réalisé la meilleure marque */}
                    {foreignAhead && (
                      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-3 shadow-md">
                        <span className="text-base select-none">ℹ️</span>
                        <div className="italic leading-relaxed">
                          Meilleure performance de l'épreuve réalisée par l'athlète étranger{' '}
                          <strong className="text-white font-bold not-italic">{fastestOverall.record.athleteName}</strong>{' '}
                          {fastestOverall.record.nationalite && (
                            <span className="not-italic font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-sky-300 border border-blue-800/50">
                              ({fastestOverall.record.nationalite})
                            </span>
                          )}{' '}
                          ({fastestOverall.record.club}) en{' '}
                          <strong className="text-amber-300 font-mono not-italic">{fastestOverall.record.performanceDisplay}</strong>.
                          Conformément à la réglementation officielle FFA, le titre de Champion de France et les médailles reviennent aux athlètes français.
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {/* 1ère PLACE (OR) - 1er ATHLÈTE FRANÇAIS */}
                      <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between relative z-10">
                          <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-mono font-black flex items-center gap-1.5 shadow-md">
                            <span>{rank1.badge}</span>
                          </span>
                          <Trophy className="w-5 h-5 text-amber-400" />
                        </div>

                        <div className="my-4 relative z-10">
                          <button
                            onClick={() => onSelectAthlete(firstFrench.record.athleteName)}
                            className="text-xl font-black text-amber-300 hover:text-amber-200 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{firstFrench.record.athleteName}</span>
                            <ExternalLink className="w-4 h-4 text-amber-400/60" />
                          </button>
                          <div className="text-xs text-slate-300 font-medium mt-1">
                            {firstFrench.record.club} ({firstFrench.record.departement})
                          </div>
                        </div>

                        <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between relative z-10">
                          <span className="text-2xl font-mono font-black text-white">
                            {firstFrench.record.performanceDisplay}
                          </span>
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {firstFrench.record.niveau} • {firstFrench.record.pointsFFA} pts
                          </span>
                        </div>
                      </div>

                      {/* 2ème PLACE (ARGENT) - 2e ATHLÈTE FRANÇAIS */}
                      <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-850 to-slate-900 border border-slate-700 shadow-lg flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-600 text-xs font-mono font-bold flex items-center gap-1.5">
                            <span>{rank2.badge}</span>
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-slate-400">
                            {rank2.subtitle}
                          </span>
                        </div>

                        <div className="my-4">
                          <button
                            onClick={() => onSelectAthlete(secondFrench.record.athleteName)}
                            className="text-lg font-black text-white hover:text-sky-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{secondFrench.record.athleteName}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <div className="text-xs text-slate-400 mt-1">
                            {secondFrench.record.club} ({secondFrench.record.departement})
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-xl font-mono font-black text-slate-200">
                            {secondFrench.record.performanceDisplay}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {secondFrench.record.niveau}
                          </span>
                        </div>
                      </div>

                      {/* 3ème PLACE (BRONZE) - 3e ATHLÈTE FRANÇAIS */}
                      <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-850 to-slate-900 border border-amber-800/40 shadow-lg flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-700/50 text-xs font-mono font-bold flex items-center gap-1.5">
                            <span>{rank3.badge}</span>
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-slate-400">
                            {rank3.subtitle}
                          </span>
                        </div>

                        <div className="my-4">
                          <button
                            onClick={() => onSelectAthlete(thirdFrench.record.athleteName)}
                            className="text-lg font-black text-white hover:text-sky-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{thirdFrench.record.athleteName}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <div className="text-xs text-slate-400 mt-1">
                            {thirdFrench.record.club} ({thirdFrench.record.departement})
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-xl font-mono font-black text-amber-300">
                            {thirdFrench.record.performanceDisplay}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {thirdFrench.record.niveau}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TABLEAU COMPLET DES RÉSULTATS DE L'ÉPREUVE */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg space-y-2 p-5 sm:p-6">
                <div className="flex items-center justify-between pb-2 flex-wrap gap-2">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Medal className="w-4 h-4 text-rose-400" />
                    <span>Classement Officiel : {selectedEventInfo?.name || selectedDiscipline}</span>
                    {selectedEventInfo && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/40 font-mono font-bold">
                        Code {selectedEventInfo.code_ep}
                      </span>
                    )}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {rankedDisciplineResults.length} résultats certifiés
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 text-center w-14">Place</th>
                        <th className="py-3 px-4">Athlète</th>
                        <th className="py-3 px-4 text-center">Performance</th>
                        <th className="py-3 px-4 text-center">Vent</th>
                        <th className="py-3 px-4">Club</th>
                        <th className="py-3 px-4 text-center">Dpt</th>
                        <th className="py-3 px-4">Ligue / Région</th>
                        <th className="py-3 px-4 text-center">Niveau</th>
                        <th className="py-3 px-4 text-center">Pts FFA</th>
                        <th className="py-3 px-4 text-center bg-rose-950/40 text-rose-300 font-black">Placing Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {rankedDisciplineResults.map((item) => {
                        const isGold = !item.isForeign && item.rank === 1;
                        const isSilver = !item.isForeign && item.rank === 2;
                        const isBronze = !item.isForeign && item.rank === 3;
                        const isFinalist = !item.isForeign && item.rank !== null && item.rank <= 8;

                        return (
                          <tr
                            key={item.record.id}
                            className={`transition-colors ${
                              item.isForeign
                                ? 'italic bg-slate-950/40 text-slate-400 hover:bg-slate-900/60'
                                : isGold
                                ? 'bg-amber-950/20 hover:bg-slate-800/50'
                                : isFinalist
                                ? 'bg-slate-900/40 hover:bg-slate-800/50'
                                : 'hover:bg-slate-800/50'
                            }`}
                          >
                            {/* Place */}
                            <td className="py-3 px-4 text-center">
                              {item.isForeign ? (
                                <span
                                  className="text-slate-600 font-mono text-xs select-none not-italic"
                                  title="Athlète étranger : non classé pour le titre ou la place officielle au Championnat de France"
                                >
                                  —
                                </span>
                              ) : isGold ? (
                                <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black inline-flex items-center justify-center text-xs shadow">
                                  1
                                </span>
                              ) : isSilver ? (
                                <span className="w-7 h-7 rounded-full bg-slate-400 text-slate-950 font-black inline-flex items-center justify-center text-xs shadow">
                                  2
                                </span>
                              ) : isBronze ? (
                                <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-black inline-flex items-center justify-center text-xs shadow">
                                  3
                                </span>
                              ) : (
                                <span className={`text-xs font-bold ${isFinalist ? 'text-white' : 'text-slate-500'}`}>
                                  {item.rank}
                                </span>
                              )}
                            </td>

                            {/* Athlète */}
                            <td className="py-3 px-4 font-sans">
                              <button
                                onClick={() => onSelectAthlete(item.record.athleteName)}
                                className={`hover:text-sky-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer ${
                                  item.isForeign ? 'italic text-slate-300' : 'font-bold text-white'
                                }`}
                              >
                                <span>{item.record.athleteName}</span>
                                {item.isForeign && item.record.nationalite && (
                                  <span
                                    className="not-italic text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950 text-sky-300 border border-blue-800/50"
                                    title={`Nationalité étrangère : ${item.record.nationalite} (Hors-concours pour le titre national)`}
                                  >
                                    ({item.record.nationalite})
                                  </span>
                                )}
                                {item.record.categorie && (
                                  <span className="not-italic text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                    {item.record.categorie}
                                  </span>
                                )}
                              </button>
                            </td>

                            {/* Performance */}
                            <td className={`py-3 px-4 text-center text-sm ${
                              item.isForeign ? 'italic text-slate-300 font-medium' : 'font-bold text-white font-mono'
                            }`}>
                              {item.record.performanceDisplay}
                            </td>

                            {/* Vent */}
                            <td className={`py-3 px-4 text-center ${item.isForeign ? 'italic text-slate-500' : 'text-slate-400'}`}>
                              {item.record.vent !== null && item.record.vent !== undefined
                                ? `${item.record.vent > 0 ? '+' : ''}${item.record.vent}`
                                : '—'}
                            </td>

                            {/* Club */}
                            <td
                              className={`py-3 px-4 font-sans truncate max-w-[200px] ${
                                item.isForeign ? 'italic text-slate-400' : 'text-slate-300'
                              }`}
                              title={item.record.club}
                            >
                              {item.record.club}
                            </td>

                            {/* Département */}
                            <td className="py-3 px-4 text-center text-slate-300">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px] not-italic">
                                {item.record.departement || '—'}
                              </span>
                            </td>

                            {/* Région */}
                            <td className={`py-3 px-4 font-sans truncate max-w-[150px] ${item.isForeign ? 'italic text-slate-400' : 'text-slate-300'}`}>
                              {item.record.region || '—'}
                            </td>

                            {/* Niveau */}
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700 not-italic">
                                {item.record.niveau}
                              </span>
                            </td>

                            {/* Points FFA */}
                            <td className={`py-3 px-4 text-center ${item.isForeign ? 'italic text-slate-400' : 'text-slate-300'}`}>
                              {item.record.pointsFFA}
                            </td>

                            {/* Placing Points */}
                            <td className="py-3 px-4 text-center font-black text-rose-300 bg-rose-950/20 text-sm">
                              {item.isForeign ? (
                                <span className="text-slate-600 font-mono text-xs select-none not-italic">—</span>
                              ) : item.placingPoints > 0 ? (
                                `${item.placingPoints} pts`
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* 5. CONTENU : ONGLET 2 - CLASSEMENT À LA PLACING TABLE          */}
      {/* ============================================================= */}
      {activeTab === 'placing-table' && (
        <div className="space-y-5 animate-fade-in">
          {/* Sous-onglets de sélection de l'entité */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Classement Officiel à la Placing Table FFA</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Règle officielle des points attribués aux finalistes : 8 pts (1er), 7 pts (2e), 6 pts (3e)... 1 pt (8e)
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0">
              <button
                onClick={() => setPlacingTableEntity('clubs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  placingTableEntity === 'clubs' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Clubs ({placingTableData.clubsRanked.length})
              </button>
              <button
                onClick={() => setPlacingTableEntity('regions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  placingTableEntity === 'regions' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ligues / Régions ({placingTableData.regionsRanked.length})
              </button>
              <button
                onClick={() => setPlacingTableEntity('departments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  placingTableEntity === 'departments' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Départements ({placingTableData.departmentsRanked.length})
              </button>
            </div>
          </div>

          {/* TABLEAU 1 : CLASSEMENT DES CLUBS */}
          {placingTableEntity === 'clubs' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-slate-400">
                  Classement général des clubs aux points finalistes :
                </span>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {placingTableData.clubsRanked.length} clubs classés
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      <th className="py-3 px-4 text-center w-14">Rang</th>
                      <th className="py-3 px-4">Club</th>
                      <th className="py-3 px-4 text-center">Dpt</th>
                      <th className="py-3 px-4">Région</th>
                      <th className="py-3 px-4 text-center bg-rose-950/40 text-rose-300 font-black">Points</th>
                      <th className="py-3 px-4 text-center">Finalistes Top 8</th>
                      <th className="py-3 px-4 text-center text-amber-400">🥇 Or</th>
                      <th className="py-3 px-4 text-center text-slate-300">🥈 Arg.</th>
                      <th className="py-3 px-4 text-center text-amber-600">🥉 Bro.</th>
                      <th className="py-3 px-4 text-center">Total Médailles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {placingTableData.clubsRanked.map((club, idx) => {
                      const totalMedals = club.goldMedals + club.silverMedals + club.bronzeMedals;
                      const isTop3 = idx < 3;

                      return (
                        <tr
                          key={club.clubName}
                          className={`hover:bg-slate-800/50 transition-colors ${
                            idx === 0 ? 'bg-amber-950/20' : (isTop3 ? 'bg-slate-900/40' : '')
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-bold">
                            {idx === 0 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black inline-flex items-center justify-center text-xs shadow">
                                1
                              </span>
                            ) : idx === 1 ? (
                              <span className="w-6 h-6 rounded-full bg-slate-400 text-slate-950 font-black inline-flex items-center justify-center text-xs shadow">
                                2
                              </span>
                            ) : idx === 2 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black inline-flex items-center justify-center text-xs shadow">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-500">{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans font-extrabold text-white">
                            {club.clubName}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px]">
                              {club.departement}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-300">
                            {club.region}
                          </td>
                          <td className="py-3 px-4 text-center font-black text-rose-300 bg-rose-950/20 text-sm">
                            {club.totalPoints} pts
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-white">
                            {club.finalistsCount}
                          </td>
                          <td className="py-3 px-4 text-center font-black text-amber-400">
                            {club.goldMedals > 0 ? club.goldMedals : '—'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-300">
                            {club.silverMedals > 0 ? club.silverMedals : '—'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-amber-600">
                            {club.bronzeMedals > 0 ? club.bronzeMedals : '—'}
                          </td>
                          <td className="py-3 px-4 text-center font-black text-white">
                            {totalMedals > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                                {totalMedals}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLEAU 2 : CLASSEMENT DES LIGUES / RÉGIONS */}
          {placingTableEntity === 'regions' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-slate-400">
                  Classement par ligue régionale aux points de finalistes :
                </span>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {placingTableData.regionsRanked.length} ligues classées
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      <th className="py-3 px-4 text-center w-14">Rang</th>
                      <th className="py-3 px-4">Ligue Régionale</th>
                      <th className="py-3 px-4 text-center bg-rose-950/40 text-rose-300 font-black">Points Placing Table</th>
                      <th className="py-3 px-4 text-center">Finalistes Top 8</th>
                      <th className="py-3 px-4 text-center text-amber-400">🥇 Or</th>
                      <th className="py-3 px-4 text-center text-slate-300">🥈 Arg.</th>
                      <th className="py-3 px-4 text-center text-amber-600">🥉 Bro.</th>
                      <th className="py-3 px-4 text-center">Clubs Engagés</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {placingTableData.regionsRanked.map((reg, idx) => (
                      <tr key={reg.regionName} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-sans font-black text-white text-sm">
                          {reg.regionName}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-rose-300 bg-rose-950/20 text-base">
                          {reg.totalPoints} pts
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-white">
                          {reg.finalistsCount}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-amber-400">
                          {reg.goldMedals || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-300">
                          {reg.silverMedals || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-amber-600">
                          {reg.bronzeMedals || '—'}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">
                          {reg.clubsCount.size} clubs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLEAU 3 : CLASSEMENT DES DÉPARTEMENTS */}
          {placingTableEntity === 'departments' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-slate-400">
                  Classement par comité départemental :
                </span>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {placingTableData.departmentsRanked.length} départements classés
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      <th className="py-3 px-4 text-center w-14">Rang</th>
                      <th className="py-3 px-4 text-center">Département</th>
                      <th className="py-3 px-4">Région de Rattachement</th>
                      <th className="py-3 px-4 text-center bg-rose-950/40 text-rose-300 font-black">Points</th>
                      <th className="py-3 px-4 text-center">Finalistes</th>
                      <th className="py-3 px-4 text-center text-amber-400">🥇 Or</th>
                      <th className="py-3 px-4 text-center text-slate-300">🥈 Arg.</th>
                      <th className="py-3 px-4 text-center text-amber-600">🥉 Bro.</th>
                      <th className="py-3 px-4 text-center">Clubs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {placingTableData.departmentsRanked.map((dpt, idx) => (
                      <tr key={dpt.dptCode} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-white text-sm">
                          <span className="px-2 py-1 rounded-lg bg-slate-800 text-sky-400 border border-slate-700">
                            Dpt {dpt.dptCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-300">
                          {dpt.regionName}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-rose-300 bg-rose-950/20 text-sm">
                          {dpt.totalPoints} pts
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-white">
                          {dpt.finalistsCount}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-amber-400">
                          {dpt.goldMedals || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-300">
                          {dpt.silverMedals || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-amber-600">
                          {dpt.bronzeMedals || '—'}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">
                          {dpt.clubsCount.size}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* 6. CONTENU : ONGLET 3 - STATISTIQUES TERRITORIALES            */}
      {/* ============================================================= */}
      {activeTab === 'territories' && (() => {
        const getSortMetricInfo = (item: {
          goldMedals: number;
          silverMedals: number;
          bronzeMedals: number;
          finalistsCount: number;
          athletesCount: number;
          perfsCount: number;
          percent?: number;
        }) => {
          switch (territorialSort) {
            case 'gold':
              return {
                primaryText: `${item.goldMedals} or`,
                primaryIcon: '🥇',
                primaryColor: 'text-amber-400',
                secondaryText: `(${item.athletesCount} part.)`,
                val: item.goldMedals,
                barGradient: 'from-amber-500 via-amber-400 to-yellow-300',
              };
            case 'silver':
              return {
                primaryText: `${item.silverMedals} argent`,
                primaryIcon: '🥈',
                primaryColor: 'text-slate-200',
                secondaryText: `(${item.athletesCount} part.)`,
                val: item.silverMedals,
                barGradient: 'from-slate-400 via-slate-300 to-slate-100',
              };
            case 'bronze':
              return {
                primaryText: `${item.bronzeMedals} bronze`,
                primaryIcon: '🥉',
                primaryColor: 'text-amber-500',
                secondaryText: `(${item.athletesCount} part.)`,
                val: item.bronzeMedals,
                barGradient: 'from-amber-700 via-amber-600 to-amber-500',
              };
            case 'finalists':
              return {
                primaryText: `${item.finalistsCount} finaliste${item.finalistsCount > 1 ? 's' : ''}`,
                primaryIcon: '🎖️',
                primaryColor: 'text-purple-400',
                secondaryText: `(${item.athletesCount} part.)`,
                val: item.finalistsCount,
                barGradient: 'from-purple-600 via-indigo-500 to-sky-400',
              };
            case 'participants':
            default:
              return {
                primaryText: `${item.athletesCount} participant${item.athletesCount > 1 ? 's' : ''}`,
                primaryIcon: '👥',
                primaryColor: 'text-sky-400',
                secondaryText: item.percent !== undefined ? `(${item.percent}%)` : `(${item.perfsCount} perfs)`,
                val: item.athletesCount,
                barGradient: 'from-sky-600 via-blue-500 to-indigo-400',
              };
          }
        };

        const activeSortLabel = TERRITORIAL_SORT_OPTIONS.find(o => o.id === territorialSort)?.label || "Nbre de participant.e.s";

        return (
          <div className="space-y-6 animate-fade-in">
            {/* ========================================================= */}
            {/* BARRE DE CHOIX DU CRITÈRE DE TRI                          */}
            {/* ========================================================= */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <ArrowUpDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">
                      Critère de Tri : Clubs, Ligues & Comités Départementaux
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Classement actif : <strong className="text-sky-300 font-semibold">{activeSortLabel}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>{territorialStats.totalUniqueAthletes} athlètes répertoriés</span>
                  <span>•</span>
                  <span>{territorialStats.totalClubsRepresented} clubs</span>
                </div>
              </div>

              {/* Les 5 boutons de tri demandés */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {TERRITORIAL_SORT_OPTIONS.map(opt => {
                  const isActive = territorialSort === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTerritorialSort(opt.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-sm ${
                        isActive
                          ? opt.activeClass
                          : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 font-medium'
                      }`}
                    >
                      <span>{opt.badge}</span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRILLE : TOP CLUBS & TOP RÉGIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 1. Clubs les plus représentés */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-5 h-5 text-amber-400" />
                      <div>
                        <h3 className="font-extrabold text-sm text-white">
                          Clubs les plus représentés ({territorialStats.allClubs.length})
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Classés par {activeSortLabel}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {territorialStats.topClubs.length} affiché{territorialStats.topClubs.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {territorialStats.topClubs.map((club, idx) => {
                      const metric = getSortMetricInfo(club);
                      const barWidth = territorialStats.maxValClubs > 0 
                        ? Math.max(Math.round((metric.val / territorialStats.maxValClubs) * 100), metric.val > 0 ? 6 : 2)
                        : 2;

                      return (
                        <div key={club.name} className="space-y-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700/80 transition-colors">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-500 font-bold w-6">#{idx + 1}</span>
                              <span className="font-bold text-white truncate max-w-[210px]" title={club.name}>
                                {club.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">({club.dpt})</span>
                            </div>
                            
                            <div className="flex items-center gap-2 font-mono">
                              <span className={`font-black text-xs flex items-center gap-1 ${metric.primaryColor}`}>
                                <span>{metric.primaryIcon}</span>
                                <span>{metric.primaryText}</span>
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                {metric.secondaryText}
                              </span>
                            </div>
                          </div>

                          {/* Barre visuelle dynamique */}
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full bg-gradient-to-r ${metric.barGradient} rounded-full transition-all duration-500`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>

                          {/* Bandeau complet des médailles, finalistes et participant.e.s */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono pt-1">
                            <span className={`px-1.5 py-0.5 rounded border ${club.goldMedals > 0 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                              🥇 {club.goldMedals} or
                            </span>
                            <span className={`px-1.5 py-0.5 rounded border ${club.silverMedals > 0 ? 'bg-slate-300/15 text-slate-200 border-slate-300/30 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                              🥈 {club.silverMedals} arg.
                            </span>
                            <span className={`px-1.5 py-0.5 rounded border ${club.bronzeMedals > 0 ? 'bg-amber-800/25 text-amber-400 border-amber-700/30 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                              🥉 {club.bronzeMedals} br.
                            </span>
                            <span className={`px-1.5 py-0.5 rounded border ${club.finalistsCount > 0 ? 'bg-purple-950/80 text-purple-300 border-purple-800/50 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                              🎖️ {club.finalistsCount} fin.
                            </span>
                            <span className="px-1.5 py-0.5 rounded border bg-sky-950/60 text-sky-300 border-sky-800/40">
                              👥 {club.athletesCount} part.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {territorialStats.allClubs.length > 15 && (
                  <div className="pt-2 text-center border-t border-slate-800/80 mt-3">
                    <button
                      onClick={() => setShowAllClubs(prev => !prev)}
                      className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                    >
                      {showAllClubs ? '▲ Réduire à 15 clubs' : `▼ Afficher tous les clubs (${territorialStats.allClubs.length})`}
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Ligues / Régions les plus représentées */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Globe2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="font-extrabold text-sm text-white">
                        Ligues Régionales les plus représentées ({territorialStats.topRegions.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Classées par {activeSortLabel}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Part des effectifs
                  </span>
                </div>

                <div className="space-y-3">
                  {territorialStats.topRegions.map((reg, idx) => {
                    const metric = getSortMetricInfo(reg);
                    const barWidth = territorialStats.maxValRegions > 0 
                      ? Math.max(Math.round((metric.val / territorialStats.maxValRegions) * 100), metric.val > 0 ? 6 : 2)
                      : 2;

                    return (
                      <div key={reg.name} className="space-y-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700/80 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-500 font-bold w-6">#{idx + 1}</span>
                            <span className="font-bold text-white">
                              {reg.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              • {reg.clubsCount} clubs
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 font-mono">
                            <span className={`font-black text-xs flex items-center gap-1 ${metric.primaryColor}`}>
                              <span>{metric.primaryIcon}</span>
                              <span>{metric.primaryText}</span>
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {metric.secondaryText}
                            </span>
                          </div>
                        </div>

                        {/* Barre visuelle dynamique */}
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full bg-gradient-to-r ${metric.barGradient} rounded-full transition-all duration-500`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                        {/* Bandeau complet des médailles, finalistes et participant.e.s */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono pt-1">
                          <span className={`px-1.5 py-0.5 rounded border ${reg.goldMedals > 0 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                            🥇 {reg.goldMedals} or
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${reg.silverMedals > 0 ? 'bg-slate-300/15 text-slate-200 border-slate-300/30 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                            🥈 {reg.silverMedals} arg.
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${reg.bronzeMedals > 0 ? 'bg-amber-800/25 text-amber-400 border-amber-700/30 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                            🥉 {reg.bronzeMedals} br.
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${reg.finalistsCount > 0 ? 'bg-purple-950/80 text-purple-300 border-purple-800/50 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                            🎖️ {reg.finalistsCount} fin.
                          </span>
                          <span className="px-1.5 py-0.5 rounded border bg-sky-950/60 text-sky-300 border-sky-800/40">
                            👥 {reg.athletesCount} part.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Départements les plus représentés */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-rose-400" />
                  <div>
                    <h3 className="font-extrabold text-sm text-white">
                      Comités Départementaux les plus actifs ({territorialStats.allDepartments.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Classés par {activeSortLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">
                    {territorialStats.topDepartments.length} affiché{territorialStats.topDepartments.length > 1 ? 's' : ''} sur {territorialStats.totalDepartmentsRepresented} comités
                  </span>
                  {territorialStats.allDepartments.length > 15 && (
                    <button
                      onClick={() => setShowAllDepartments(prev => !prev)}
                      className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors py-1 px-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                    >
                      {showAllDepartments ? '▲ Réduire à 15' : `▼ Afficher tous (${territorialStats.allDepartments.length})`}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {territorialStats.topDepartments.map((dpt, idx) => {
                  const metric = getSortMetricInfo(dpt);

                  return (
                    <div key={dpt.code} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between space-y-2 hover:border-slate-700/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-slate-500 font-bold text-xs">#{idx + 1}</span>
                          <span className="w-7 h-7 rounded-lg bg-rose-950/70 text-rose-300 border border-rose-800/50 flex items-center justify-center font-mono font-black text-xs">
                            {dpt.code}
                          </span>
                          <div>
                            <div className="font-bold text-white text-xs truncate max-w-[110px]" title={dpt.reg}>
                              {dpt.reg}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {dpt.clubsCount} club{dpt.clubsCount > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className={`font-black text-xs flex items-center justify-end gap-1 ${metric.primaryColor}`}>
                            <span>{metric.primaryIcon}</span>
                            <span>{metric.primaryText}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {metric.secondaryText}
                          </div>
                        </div>
                      </div>

                      {/* Bandeau médailles, finalistes et participant.e.s */}
                      <div className="flex items-center gap-1 flex-wrap text-[9px] font-mono pt-1 border-t border-slate-800/60">
                        <span className={`px-1 py-0.5 rounded border ${dpt.goldMedals > 0 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                          🥇 {dpt.goldMedals}
                        </span>
                        <span className={`px-1 py-0.5 rounded border ${dpt.silverMedals > 0 ? 'bg-slate-300/15 text-slate-200 border-slate-300/30 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                          🥈 {dpt.silverMedals}
                        </span>
                        <span className={`px-1 py-0.5 rounded border ${dpt.bronzeMedals > 0 ? 'bg-amber-800/25 text-amber-400 border-amber-700/30 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                          🥉 {dpt.bronzeMedals}
                        </span>
                        <span className={`px-1 py-0.5 rounded border ${dpt.finalistsCount > 0 ? 'bg-purple-950/80 text-purple-300 border-purple-800/50 font-bold' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                          🎖️ {dpt.finalistsCount} fin.
                        </span>
                        <span className="px-1 py-0.5 rounded border bg-sky-950/60 text-sky-300 border-sky-800/40">
                          👥 {dpt.athletesCount} part.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================= */}
      {/* 7. CONTENU : ONGLET 4 - ÉVOLUTION SUIVANT LES ANNÉES          */}
      {/* ============================================================= */}
      {activeTab === 'evolution' && multiYearEvolution && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Évolution Chronologique des Performances : {currentCompetition.cleanTitle} ({selectedEventInfo ? `${selectedEventInfo.name} — Code ${selectedEventInfo.code_ep}` : selectedDiscipline})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Comparatif pluriannuel des vainqueurs, de la moyenne du podium et du seuil d'accès en finale
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                {multiYearEvolution.length} éditions répertoriées
              </span>
            </div>

            {/* Cartes chronologiques édition par édition */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {multiYearEvolution.map((item, idx) => {
                const prev = idx > 0 ? multiYearEvolution[idx - 1] : null;

                return (
                  <div key={item.year} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono font-black text-xs">
                        Édition {item.year} ({item.seasonLabel})
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{item.lieu}</span>
                      </span>
                    </div>

                    {/* Vainqueur */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                        <span>
                          {(() => {
                            const isChpt = isChampionnatDeFrance(currentCompetition?.cleanTitle || currentCompetition?.rawName);
                            const isFemme = item.winner?.sexe === 'F' || (item.winner?.categorie && item.winner.categorie.toUpperCase().endsWith('F')) || selectedSexe === 'F';
                            if (isChpt) {
                              return isFemme ? '🥇 Championne de France' : '🥇 Champion de France';
                            }
                            return '🥇 1ère place';
                          })()}
                        </span>
                        {item.winner && (
                          <span className="font-mono text-white text-xs font-black">
                            {item.winner.perfDisplay}
                          </span>
                        )}
                      </div>
                      {item.winner && (
                        <div className="text-xs text-slate-200 font-bold truncate">
                          {item.winner.name} <span className="text-[11px] text-slate-400 font-normal">({item.winner.club})</span>
                        </div>
                      )}
                    </div>

                    {/* Moyenne Podium & Cut-off */}
                    <div className="space-y-1.5 text-xs font-mono pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Moyenne Podium Top 3 :</span>
                        <span className="font-black text-emerald-400">{item.podiumAverage}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Seuil 8e place finale :</span>
                        <span className="font-bold text-slate-200">
                          {item.cutoffFinalist ? item.cutoffFinalist.perfDisplay : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Effectif engagé :</span>
                        <span className="text-sky-400 font-semibold">{item.participantsCount} athlètes</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

        </>
      )}

    </div>
  );
};
