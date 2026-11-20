import React, { useState, useMemo } from 'react';
import { 
  User, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Flame, 
  FileSpreadsheet, 
  FileText, 
  FileDown, 
  Search, 
  ArrowUpRight,
  ShieldCheck,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sun,
  Snowflake,
  Award
} from 'lucide-react';
import { PerformanceRecord } from '../../types/athletics';
import { StorageService } from '../../services/storageService';
import { 
  formatPerformanceDisplay, 
  getDisciplineNature, 
  isBetterPerformance,
  computeFFACategory,
  FFACategoryResult,
  cleanDisciplineName,
  isIndoorRecord,
  getDisciplineSortPriority
} from '../../utils/performanceUtils';
import { exportToExcel, exportToPDF, exportToWord } from '../../utils/exportUtils';

export interface AthleteEventIdentity {
  key: string;
  codeEp: string;
  canonicalDiscipline: string;
  structure: 'SALLE' | 'EXTERIEUR';
  isIndoor: boolean;
  structureLabel: string;
}

/**
 * Identifie de façon unique une épreuve pour l'athlète :
 * Règle FFA : Si le code épreuve est identique (ex: 260 pour Hauteur et Hauteur- Re), ils sont fusionnés.
 * Règle saisonnière : Les épreuves hivernales (en salle) et estivales (plein air) sont STRICTEMENT dissociées.
 */
export function getAthleteEventIdentity(r: PerformanceRecord): AthleteEventIdentity {
  const indoor = isIndoorRecord(r.discipline, r.code_ep, r.structure, r.sourceFile, r.lieu);
  const structure: 'SALLE' | 'EXTERIEUR' = indoor ? 'SALLE' : 'EXTERIEUR';
  const cleanCode = r.code_ep !== undefined && r.code_ep !== null ? String(r.code_ep).trim().replace(/^0+/, '') : '';
  const cleanDisc = (cleanDisciplineName(r.discipline) || r.discipline || '').trim();

  const key = cleanCode
    ? `ep_${cleanCode}_${structure}`
    : `disc_${cleanDisc.toLowerCase()}_${structure}`;

  return {
    key,
    codeEp: cleanCode,
    canonicalDiscipline: cleanDisc,
    structure,
    isIndoor: indoor,
    structureLabel: indoor ? 'Hivernale (Salle)' : 'Estivale (Plein air)',
  };
}

export interface PersonalBestItem {
  key: string;
  codeEp: string;
  discipline: string;
  structure: 'SALLE' | 'EXTERIEUR';
  isIndoor: boolean;
  structureLabel: string;
  record: PerformanceRecord;
}

export interface AverageDisciplineItem {
  key: string;
  codeEp: string;
  discipline: string;
  structure: 'SALLE' | 'EXTERIEUR';
  isIndoor: boolean;
  structureLabel: string;
  count: number;
  totalCount: number;
  averageValue: number;
  averageDisplay: string;
  latestDate?: string;
  selectedPerfs: PerformanceRecord[];
}

interface AthleteReportViewProps {
  records: PerformanceRecord[];
  selectedAthleteName?: string;
  onSelectAthlete: (name: string) => void;
  onSelectDiscipline: (discipline: string) => void;
}

const AthleteReportViewComponent: React.FC<AthleteReportViewProps> = ({
  records,
  selectedAthleteName,
  onSelectAthlete,
  onSelectDiscipline,
}) => {
  // Liste des athlètes disponibles (mémoïsé sans allocation d'array intermédiaire)
  const athletesList = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < records.length; i++) {
      const name = records[i].athleteName;
      if (name) set.add(name);
    }
    return Array.from(set).sort();
  }, [records]);

  const currentAthleteName = useMemo(() => {
    if (selectedAthleteName && athletesList.some(a => a.toLowerCase() === selectedAthleteName.toLowerCase())) {
      return selectedAthleteName;
    }
    return '';
  }, [selectedAthleteName, athletesList]);
  const [searchFilter, setSearchFilter] = useState('');

  // Saison sélectionnée pour les Moyennes Réalisées
  const [averagesSeason, setAveragesSeason] = useState<string>('all');

  // Saison sélectionnée pour la Trajectoire d'Évolution
  const [progressionSeason, setProgressionSeason] = useState<string>('all');

  // Discipline dont les performances de moyenne sont actuellement dépliées (identifiée par clé unique)
  const [expandedAverageKey, setExpandedAverageKey] = useState<string | null>(null);

  // Filtre de structure/période pour les moyennes : Toutes, Estivales (Plein air), Hivernales (Salle)
  const [seasonStructureFilter, setSeasonStructureFilter] = useState<'all' | 'estivale' | 'hivernale'>('all');

  // Saisons disponibles dans le jeu de données
  const availableSeasons = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (r.saisonLabel) set.add(r.saisonLabel);
      else if (r.saison) set.add(r.saison === 2026 ? '2025-2026' : `${r.saison - 1}-${r.saison}`);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  // Toutes les performances de l'athlète courant avec détection de la structure et normalisation de base
  const athleteRecords = useMemo(() => {
    if (!currentAthleteName) return [];
    return records
      .filter(r => r.athleteName.toLowerCase() === currentAthleteName.toLowerCase())
      .map(r => {
        const indoor = isIndoorRecord(r.discipline, r.code_ep, r.structure, r.sourceFile, r.lieu);
        const normStructure = indoor ? 'SALLE' : 'EXTERIEUR';
        const cleanDisc = cleanDisciplineName(r.discipline) || r.discipline;
        return {
          ...r,
          rawDiscipline: r.discipline,
          discipline: cleanDisc,
          structure: normStructure,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records, currentAthleteName]);

  // Année de naissance déduite des enregistrements de l'athlète
  const birthYear = useMemo(() => {
    for (const r of athleteRecords) {
      if (r.annee_nais) {
        const parsed = parseInt(String(r.annee_nais).trim(), 10);
        if (!isNaN(parsed) && parsed > 1920 && parsed < 2030) {
          return parsed;
        }
      }
    }
    return undefined;
  }, [athleteRecords]);

  // Catégorie FFA calculée dynamiquement selon la date de connexion (saison du 1er sept au 31 août)
  const athleteCategoryInfo = useMemo(() => {
    if (athleteRecords.length === 0) return null;
    const latest = athleteRecords[athleteRecords.length - 1];
    return computeFFACategory(birthYear, new Date(), latest?.categorie);
  }, [athleteRecords, birthYear]);

  // Informations générales
  const athleteProfile = useMemo(() => {
    if (athleteRecords.length === 0) return null;
    const latest = athleteRecords[athleteRecords.length - 1];
    return {
      name: currentAthleteName,
      sexe: latest.sexe,
      categorie: latest.categorie,
      categoryInfo: athleteCategoryInfo,
      birthYear,
      club: latest.club,
      departement: latest.departement,
      region: latest.region,
      entraineur: latest.entraineur,
      totalPerfs: athleteRecords.length,
      seasonsCovered: Array.from(new Set(athleteRecords.map(r => r.saison))).sort((a, b) => a - b),
    };
  }, [athleteRecords, currentAthleteName, athleteCategoryInfo, birthYear]);

  // Statut officiel sur les listes ministérielles de haut niveau (SHN)
  const shnStatus = useMemo(() => {
    if (!currentAthleteName) return [];
    return StorageService.getSHNStatusForAthlete(currentAthleteName);
  }, [currentAthleteName]);

  // Records Personnels (RP / PB) par épreuve :
  // RÈGLE 1 : Ne sépare PAS les disciplines qui ont le même code épreuve (ex: Hauteur et Hauteur- Re)
  // RÈGLE 2 : Sépare STRICTEMENT les épreuves estivales (Plein air) et hivernales (Salle)
  // RÈGLE 3 : Exclut les vents > +2.0 m/s sur les épreuves mesurées au vent
  const personalBests = useMemo<PersonalBestItem[]>(() => {
    const map = new Map<string, {
      bestRec: PerformanceRecord;
      canonicalDisc: string;
      codeEp: string;
      structure: 'SALLE' | 'EXTERIEUR';
      isIndoor: boolean;
      structureLabel: string;
    }>();

    athleteRecords.forEach(r => {
      // Exclure les performances avec vent trop favorable (> 2.0 m/s)
      if (r.vent !== null && r.vent !== undefined && r.vent > 2.0) {
        return;
      }
      const ident = getAthleteEventIdentity(r);
      const existing = map.get(ident.key);

      if (!existing) {
        map.set(ident.key, {
          bestRec: { ...r, discipline: ident.canonicalDiscipline },
          canonicalDisc: ident.canonicalDiscipline,
          codeEp: ident.codeEp,
          structure: ident.structure,
          isIndoor: ident.isIndoor,
          structureLabel: ident.structureLabel,
        });
      } else {
        if (isBetterPerformance(r.performanceValue, existing.bestRec.performanceValue, r.nature)) {
          existing.bestRec = { ...r, discipline: existing.canonicalDisc || ident.canonicalDiscipline };
        }
        if (ident.canonicalDiscipline && ident.canonicalDiscipline.length < existing.canonicalDisc.length) {
          existing.canonicalDisc = ident.canonicalDiscipline;
          existing.bestRec.discipline = ident.canonicalDiscipline;
        }
      }
    });

    return Array.from(map.entries())
      .map(([key, item]) => ({
        key,
        codeEp: item.codeEp,
        discipline: item.canonicalDisc,
        structure: item.structure,
        isIndoor: item.isIndoor,
        structureLabel: item.structureLabel,
        record: item.bestRec,
      }))
      .sort((a, b) => {
        // 1. Ordre officiel demandé : Courses (sprint, haies, demi-fond, marche), Sauts (hauteur, perche, longueur, triple saut), Lancers (poids, javelot, disque, marteau), Combinées
        const prioA = getDisciplineSortPriority(a.discipline);
        const prioB = getDisciplineSortPriority(b.discipline);
        if (prioA !== prioB) {
          return prioA - prioB;
        }

        // 2. Estivales (Plein air) en 1er, puis Hivernales (Salle)
        if (a.isIndoor !== b.isIndoor) {
          return a.isIndoor ? 1 : -1;
        }

        // 3. Points FFA
        if (b.record.pointsFFA !== a.record.pointsFFA) {
          return b.record.pointsFFA - a.record.pointsFFA;
        }
        return a.discipline.localeCompare(b.discipline);
      });
  }, [athleteRecords]);

  // Filtre / tri du nombre de performances pour le calcul des moyennes réalisées
  const [averageFilter, setAverageFilter] = useState<string>('all');

  // Moyennes de l'athlète par épreuve :
  // - Regroupe les variantes de même code épreuve (ex: Hauteur et Hauteur- Re)
  // - Sépare STRICTEMENT les épreuves estivales et hivernales
  // - Filtres par saison, par structure (estivale/hivernale), et par nombre de perfs
  const averagesByDiscipline = useMemo<AverageDisciplineItem[]>(() => {
    // 1. Filtrer les performances par la saison sélectionnée pour les moyennes
    let seasonFilteredRecords = averagesSeason === 'all'
      ? athleteRecords
      : athleteRecords.filter(r => {
          const sLab = r.saisonLabel || (r.saison === 2026 ? '2025-2026' : `${r.saison - 1}-${r.saison}`);
          return sLab === averagesSeason || String(r.saison) === averagesSeason;
        });

    // 2. Filtrer par structure saisonnière : Estivale (Plein air) vs Hivernale (Salle)
    if (seasonStructureFilter === 'estivale') {
      seasonFilteredRecords = seasonFilteredRecords.filter(r => !getAthleteEventIdentity(r).isIndoor);
    } else if (seasonStructureFilter === 'hivernale') {
      seasonFilteredRecords = seasonFilteredRecords.filter(r => getAthleteEventIdentity(r).isIndoor);
    }

    // 3. Regrouper par identifiant unique d'épreuve (même code épreuve fusionné, plein air et salle dissociés)
    const grouped = new Map<string, {
      ident: AthleteEventIdentity;
      canonicalDisc: string;
      perfs: PerformanceRecord[];
    }>();

    seasonFilteredRecords.forEach(r => {
      const ident = getAthleteEventIdentity(r);
      const existing = grouped.get(ident.key);
      if (!existing) {
        grouped.set(ident.key, {
          ident,
          canonicalDisc: ident.canonicalDiscipline,
          perfs: [r],
        });
      } else {
        existing.perfs.push(r);
        if (ident.canonicalDiscipline && ident.canonicalDiscipline.length < existing.canonicalDisc.length) {
          existing.canonicalDisc = ident.canonicalDiscipline;
        }
      }
    });

    const filterCount = averageFilter === 'all' ? null : parseInt(averageFilter, 10);

    return Array.from(grouped.entries())
      .map(([key, group]) => {
        // Trier par date décroissante (les plus récentes en premier)
        const sortedPerfs = [...group.perfs].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Sélectionner les N dernières performances ou toutes
        const selectedPerfs = filterCount ? sortedPerfs.slice(0, filterCount) : sortedPerfs;
        const count = selectedPerfs.length;
        const totalCount = group.perfs.length;
        const sum = selectedPerfs.reduce((acc, r) => acc + r.performanceValue, 0);
        const avg = count > 0 ? sum / count : 0;
        const nature = selectedPerfs[0]?.nature || getDisciplineNature(group.canonicalDisc);

        return {
          key,
          codeEp: group.ident.codeEp,
          discipline: group.canonicalDisc,
          structure: group.ident.structure,
          isIndoor: group.ident.isIndoor,
          structureLabel: group.ident.structureLabel,
          count,
          totalCount,
          averageValue: avg,
          averageDisplay: formatPerformanceDisplay(avg, nature, group.canonicalDisc),
          latestDate: selectedPerfs[0]?.date,
          selectedPerfs,
        };
      })
      .sort((a, b) => {
        // 1. Ordre officiel demandé : Courses (sprint, haies, demi-fond, marche), Sauts (hauteur, perche, longueur, triple saut), Lancers (poids, javelot, disque, marteau), Combinées
        const prioA = getDisciplineSortPriority(a.discipline);
        const prioB = getDisciplineSortPriority(b.discipline);
        if (prioA !== prioB) {
          return prioA - prioB;
        }

        // 2. Estivales (Plein air) en premier, puis Hivernales (Salle)
        if (a.isIndoor !== b.isIndoor) {
          return a.isIndoor ? 1 : -1;
        }

        // 3. Nombre de participations
        if (b.totalCount !== a.totalCount) {
          return b.totalCount - a.totalCount;
        }
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return (b.latestDate || '').localeCompare(a.latestDate || '');
      });
  }, [athleteRecords, averagesSeason, seasonStructureFilter, averageFilter]);

  // Clé d'épreuve sélectionnée pour la courbe de progression
  const [progressionEventKey, setProgressionEventKey] = useState<string>('');

  // Options disponibles pour la trajectoire d'évolution (agrège moyennes et PBs avec statut estival/hivernal)
  const availableProgressionOptions = useMemo(() => {
    const map = new Map<string, { key: string; discipline: string; isIndoor: boolean; structureLabel: string; codeEp: string }>();

    averagesByDiscipline.forEach(a => {
      map.set(a.key, {
        key: a.key,
        discipline: a.discipline,
        isIndoor: a.isIndoor,
        structureLabel: a.structureLabel,
        codeEp: a.codeEp,
      });
    });

    personalBests.forEach(pb => {
      if (!map.has(pb.key)) {
        map.set(pb.key, {
          key: pb.key,
          discipline: pb.discipline,
          isIndoor: pb.isIndoor,
          structureLabel: pb.structureLabel,
          codeEp: pb.codeEp,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const prioA = getDisciplineSortPriority(a.discipline);
      const prioB = getDisciplineSortPriority(b.discipline);
      if (prioA !== prioB) return prioA - prioB;
      if (a.isIndoor !== b.isIndoor) return a.isIndoor ? 1 : -1;
      return a.discipline.localeCompare(b.discipline);
    });
  }, [averagesByDiscipline, personalBests]);

  const activeProgressionEventKey = useMemo(() => {
    if (progressionEventKey && availableProgressionOptions.some(o => o.key === progressionEventKey)) {
      return progressionEventKey;
    }
    return availableProgressionOptions[0]?.key || '';
  }, [progressionEventKey, availableProgressionOptions]);

  const activeProgressionItem = useMemo(() => {
    return availableProgressionOptions.find(o => o.key === activeProgressionEventKey) || null;
  }, [availableProgressionOptions, activeProgressionEventKey]);

  // Historique de progression pour l'épreuve active (fusionne toutes les variantes du même code_ep tout en dissociant salle et plein air)
  const progressionHistory = useMemo(() => {
    if (!activeProgressionEventKey) return [];
    return athleteRecords
      .filter(r => {
        const ident = getAthleteEventIdentity(r);
        if (ident.key !== activeProgressionEventKey) return false;
        if (progressionSeason !== 'all') {
          const sLab = r.saisonLabel || (r.saison === 2026 ? '2025-2026' : `${r.saison - 1}-${r.saison}`);
          if (sLab !== progressionSeason && String(r.saison) !== progressionSeason) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [athleteRecords, activeProgressionEventKey, progressionSeason]);

  // Export handlers
  const handleExportAthleteExcel = () => {
    exportToExcel(athleteRecords, `Bilan_${currentAthleteName.replace(/\s+/g, '_')}`);
  };

  const handleExportAthleteWord = () => {
    if (!athleteProfile) return;
    exportToWord(
      `Fiche Individuelle d'Athlète : ${athleteProfile.name}`,
      `${athleteProfile.club} · Entraîneur : ${athleteProfile.entraineur} · ${athleteProfile.categoryInfo?.badgeDisplay || `Catégorie : ${athleteProfile.categorie}`}`,
      [
        {
          heading: '1. Informations Sportives et Fédérales',
          text: `Athlète ${athleteProfile.sexe === 'F' ? 'licenciée' : 'licencié'} au club ${athleteProfile.club} (${athleteProfile.region}, département ${athleteProfile.departement}). Catégorie active : ${athleteProfile.categoryInfo?.badgeDisplay || athleteProfile.categorie}${athleteProfile.categoryInfo?.fullLabel ? ` (${athleteProfile.categoryInfo.fullLabel})` : ''}${athleteProfile.birthYear ? ` · ${athleteProfile.sexe === 'F' ? 'Née' : 'Né'} en ${athleteProfile.birthYear}` : ''}. Entraîneur principal : ${athleteProfile.entraineur}. Nombre total de performances enregistrées : ${athleteProfile.totalPerfs}. Saisons couvertes : ${athleteProfile.seasonsCovered.join(', ')}.`,
        },
        {
          heading: '2. Records Personnels Homologués (RP)',
          tableHeaders: ['Épreuve', 'Structure / Période', 'Code Épreuve', 'Record Personnel', 'Date', 'Lieu', 'Niveau FFA', 'Points FFA'],
          tableRows: personalBests.map(pb => [
            pb.discipline,
            pb.structureLabel,
            pb.codeEp || '-',
            pb.record.performanceDisplay,
            pb.record.date,
            pb.record.lieu,
            pb.record.niveau,
            String(pb.record.pointsFFA),
          ]),
        },
        {
          heading: averageFilter === 'all' 
            ? `3. Moyenne des Performances par Épreuve (${averagesSeason !== 'all' ? `Saison ${averagesSeason} - ` : ''}${seasonStructureFilter === 'all' ? 'Toutes épreuves' : seasonStructureFilter === 'estivale' ? 'Épreuves estivales' : 'Épreuves hivernales'} - Toutes les perfs)` 
            : `3. Moyenne des Performances par Épreuve (${averagesSeason !== 'all' ? `Saison ${averagesSeason} - ` : ''}${seasonStructureFilter === 'all' ? 'Toutes épreuves' : seasonStructureFilter === 'estivale' ? 'Épreuves estivales' : 'Épreuves hivernales'} - Les ${averageFilter} dernières perfs réalisées)`,
          tableHeaders: ['Épreuve', 'Structure / Période', 'Code Épreuve', 'Nombre de Participations', 'Moyenne Réalisée'],
          tableRows: averagesByDiscipline.map(a => [
            a.discipline,
            a.structureLabel,
            a.codeEp || '-',
            averageFilter === 'all'
              ? `${a.count} performance${a.count > 1 ? 's' : ''}`
              : `${a.count} dernière${a.count > 1 ? 's' : ''} (sur ${a.totalCount})`,
            a.averageDisplay,
          ]),
        },
        {
          heading: '4. Historique Chronologique Complet',
          tableHeaders: ['Date', 'Saison', 'Structure', 'Épreuve', 'Performance', 'Lieu', 'Niveau'],
          tableRows: athleteRecords.map(r => [
            r.date,
            String(r.saison),
            r.structure === 'SALLE' ? 'Salle (Hivernale)' : 'Plein air (Estivale)',
            r.discipline,
            r.performanceDisplay,
            r.lieu,
            r.niveau,
          ]),
        }
      ],
      `Rapport_Athletisme_${currentAthleteName.replace(/\s+/g, '_')}`
    );
  };

  const handleExportAthletePDF = () => {
    exportToPDF(
      `Rapport Fédéral : ${currentAthleteName}`,
      athleteRecords,
      `Fiche_Athlete_${currentAthleteName.replace(/\s+/g, '_')}`
    );
  };

  const filteredAthletesList = athletesList.filter(a => 
    a.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ATHLETE SELECTOR BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">
              Sélectionnez un Athlète
            </h3>
            <p className="text-xs text-slate-400">
              {athletesList.length} athlètes répertoriés · {records.length.toLocaleString('fr-FR')} performances
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 sm:max-w-lg">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrer les athlètes..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={currentAthleteName}
            onChange={e => onSelectAthlete(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-sky-300 font-semibold focus:outline-none focus:border-sky-500 max-w-[220px]"
          >
            <option value="">-- Aucun athlète sélectionné --</option>
            {filteredAthletesList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {athleteProfile ? (
        <>
          {/* ATHLETE IDENTITY CARD & ACTIONS */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-700 flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-blue-900/40 shrink-0">
                  {athleteProfile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      {athleteProfile.name}
                    </h2>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-900/60 text-sky-300 border border-blue-700/50 font-bold font-mono shadow-sm">
                      {athleteProfile.sexe} · {athleteProfile.categoryInfo?.badgeDisplay || athleteProfile.categorie}
                    </span>
                    {athleteProfile.categoryInfo?.fullLabel && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium hidden sm:inline-block">
                        {athleteProfile.categoryInfo.fullLabel}
                      </span>
                    )}
                    {shnStatus.length > 0 && (
                      <span 
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1.5 shadow-sm"
                        title={`Inscrit${athleteProfile.sexe === 'F' ? 'e' : ''} sur arrêté ministériel des Sportifs de Haut Niveau : ${shnStatus.map(s => `${s.categorie} (${s.anneeReference})`).join(', ')}`}
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>{athleteProfile.sexe === 'F' ? 'Sportive' : 'Sportif'} de Haut Niveau ({shnStatus[0].categorie})</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
                    {athleteProfile.birthYear && (
                      <>
                        <span className="text-slate-400">
                          {athleteProfile.sexe === 'F' ? 'Née en :' : 'Né en :'} <strong className="text-emerald-400 font-semibold">{athleteProfile.birthYear}</strong>
                        </span>
                        <span>·</span>
                      </>
                    )}
                    <span className="flex items-center gap-1 text-sky-300 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      {athleteProfile.club} ({athleteProfile.departement})
                    </span>
                    <span>·</span>
                    <span className="text-slate-400">
                      Ligue : <strong className="text-slate-200">{athleteProfile.region}</strong>
                    </span>
                    <span>·</span>
                    <span className="text-slate-400">
                      Entraîneur : <strong className="text-amber-400">{athleteProfile.entraineur}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Exports pour cet athlète */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleExportAthleteExcel}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                  title="Exporter la fiche athlète en Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel Athlète</span>
                </button>

                <button
                  onClick={handleExportAthleteWord}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-sky-300 border border-blue-700/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                  title="Générer un rapport Word complet pour l'athlète"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Rapport Word</span>
                </button>

                <button
                  onClick={handleExportAthletePDF}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-700/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                  title="Exporter le certificat PDF officiel"
                >
                  <FileDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>Certificat PDF</span>
                </button>
              </div>

            </div>
          </div>

          {/* GRID: PERSONAL BESTS & AVERAGES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Records Personnels (PB/RP) */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-base text-white">
                    Records Personnels (RP / PB)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {personalBests.length} épreuve{personalBests.length > 1 ? 's' : ''} (salle & plein air dissociés)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {personalBests.map(pb => (
                  <div 
                    key={pb.key}
                    onClick={() => setProgressionEventKey(pb.key)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      activeProgressionEventKey === pb.key
                        ? 'bg-blue-950/50 border-sky-500 shadow-md ring-1 ring-sky-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-200">
                          {pb.discipline}
                        </span>
                        {pb.isIndoor ? (
                          <span className="text-[10px] font-semibold text-sky-300 px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/60 flex items-center gap-1">
                            <Snowflake className="w-2.5 h-2.5 text-sky-400" /> Salle
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-300 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 flex items-center gap-1">
                            <Sun className="w-2.5 h-2.5 text-amber-400" /> Plein air
                          </span>
                        )}
                        {pb.codeEp && (
                          <span className="text-[9px] font-mono text-slate-400 px-1 py-0.5 rounded bg-slate-900 border border-slate-800" title={`Code épreuve FFA Logica : ${pb.codeEp}`}>
                            code {pb.codeEp}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 shrink-0">
                        {pb.record.niveau}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-2">
                      <div className="text-2xl font-black font-mono text-white tracking-tight">
                        {pb.record.performanceDisplay}
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        {pb.record.pointsFFA} pts FFA
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                      <span className="truncate max-w-[140px]" title={pb.record.lieu}>{pb.record.lieu}</span>
                      <span className="font-mono text-slate-500">{pb.record.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Moyennes par épreuve */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
                  <h3 className="font-bold text-base text-white whitespace-nowrap">
                    Moyennes Réalisées
                  </h3>
                </div>

                {/* Filtres : Saison, Période Estivale/Hivernale, & Tri du nombre de perfs */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Filtre Saison pour les moyennes */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <select
                      value={averagesSeason}
                      onChange={e => setAveragesSeason(e.target.value)}
                      aria-label="Saison pour le calcul des moyennes"
                      className="bg-slate-950 border border-slate-700/80 hover:border-emerald-500/60 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors shadow-inner"
                      title="Filtrer les moyennes par saison"
                    >
                      <option value="all">Toutes saisons</option>
                      {availableSeasons.map(s => (
                        <option key={s} value={s}>Saison {s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtre Estivales / Hivernales (Plein air vs Salle) */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={seasonStructureFilter}
                      onChange={e => setSeasonStructureFilter(e.target.value as 'all' | 'estivale' | 'hivernale')}
                      aria-label="Période des épreuves (Estivales ou Hivernales)"
                      className="bg-slate-950 border border-slate-700/80 hover:border-emerald-500/60 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors shadow-inner"
                      title="Séparer les épreuves estivales (Plein air) et hivernales (Salle)"
                    >
                      <option value="all">Toutes épreuves</option>
                      <option value="estivale">☀️ Estivales (Plein air)</option>
                      <option value="hivernale">❄️ Hivernales (Salle)</option>
                    </select>
                  </div>

                  {/* Fenêtre de tri à côté du titre "Moyennes Réalisées" */}
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <select
                      value={averageFilter}
                      onChange={e => setAverageFilter(e.target.value)}
                      aria-label="Fenêtre de tri des moyennes réalisées"
                      className="bg-slate-950 border border-slate-700/80 hover:border-emerald-500/60 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors shadow-inner"
                      title="Nombre de performances prises en compte"
                    >
                      <option value="all">Toutes les perfs</option>
                      <option value="2">Les 2 dernières perfs</option>
                      <option value="3">Les 3 dernières perfs</option>
                      <option value="4">Les 4 dernières perfs</option>
                      <option value="5">Les 5 dernières perfs</option>
                      <option value="6">Les 6 dernières perfs</option>
                      <option value="7">Les 7 dernières perfs</option>
                      <option value="8">Les 8 dernières perfs</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sous-titre indicatif / Régularité */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800/60 gap-2">
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Variantes regroupées par code épreuve · Salles et Plein air dissociés
                </span>
                <span className="text-emerald-400 font-mono text-[10px]">
                  {averagesSeason !== 'all' ? `Saison ${averagesSeason} · ` : ''}
                  {seasonStructureFilter === 'estivale' ? '☀️ Estivales uniquement · ' : seasonStructureFilter === 'hivernale' ? '❄️ Hivernales uniquement · ' : ''}
                  {averageFilter === 'all' 
                    ? 'Toutes les performances' 
                    : `Max. ${averageFilter} dernières`}
                </span>
              </div>

              <div className="space-y-3">
                {averagesByDiscipline.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    {averagesSeason !== 'all'
                      ? `Aucune performance pour cet athlète sur la saison ${averagesSeason}`
                      : 'Aucune performance enregistrée pour cet athlète'}
                  </div>
                ) : (
                  averagesByDiscipline.map(a => {
                    const isExpanded = expandedAverageKey === a.key;
                    const isActiveProgression = activeProgressionEventKey === a.key;

                    return (
                      <div 
                        key={a.key}
                        className={`rounded-xl border transition-all ${
                          isExpanded || isActiveProgression
                            ? 'bg-emerald-950/30 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/20'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Ligne principale cliquable */}
                        <div
                          onClick={() => {
                            setProgressionEventKey(a.key);
                            setExpandedAverageKey(prev => prev === a.key ? null : a.key);
                          }}
                          className="p-3 flex items-center justify-between cursor-pointer select-none"
                          title="Cliquez pour afficher les performances prises en compte et synchroniser la trajectoire"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded-md text-slate-400 hover:text-emerald-300 transition-colors">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-xs text-white">
                                  {a.discipline}
                                </h4>
                                {a.isIndoor ? (
                                  <span className="text-[10px] font-semibold text-sky-300 px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/60 flex items-center gap-1">
                                    <Snowflake className="w-2.5 h-2.5 text-sky-400" /> Hivernale (Salle)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-amber-300 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 flex items-center gap-1">
                                    <Sun className="w-2.5 h-2.5 text-amber-400" /> Estivale (Plein air)
                                  </span>
                                )}
                                {a.codeEp && (
                                  <span className="text-[9px] font-mono text-slate-400 px-1 py-0.5 rounded bg-slate-900 border border-slate-800" title={`Code épreuve FFA Logica : ${a.codeEp}`}>
                                    code {a.codeEp}
                                  </span>
                                )}
                                {isActiveProgression && (
                                  <span className="text-[10px] text-emerald-400 font-mono">● actif</span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {averageFilter === 'all'
                                  ? `${a.count} performance${a.count > 1 ? 's' : ''} prise${a.count > 1 ? 's' : ''} en compte`
                                  : a.totalCount <= a.count
                                    ? `${a.count} performance${a.count > 1 ? 's' : ''} prise${a.count > 1 ? 's' : ''} en compte`
                                    : `${a.count} dernières perfs prises en compte (sur ${a.totalCount} dispo)`}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-emerald-400 block">
                              {a.averageDisplay}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {averageFilter === 'all' ? 'Moyenne globale' : `Moyenne (${a.count} perfs)`}
                            </span>
                          </div>
                        </div>

                        {/* SECTION DÉTAIL DÉPLIÉE DES PERFORMANCES RETENUES */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-2 border-t border-slate-800/80 space-y-2 bg-slate-950/60 rounded-b-xl">
                            <div className="flex items-center justify-between text-[11px] text-emerald-400 font-medium pb-1 border-b border-slate-800/50">
                              <span className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                Performances prises en compte pour la moyenne ({a.selectedPerfs.length}) :
                              </span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                Moyenne : <strong className="text-emerald-300 font-bold">{a.averageDisplay}</strong>
                              </span>
                            </div>

                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                              {a.selectedPerfs.map((p, idx) => (
                                <div
                                  key={p.id || `${p.date}-${idx}`}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0" title={`Performance #${idx + 1} (${idx === 0 ? 'la plus récente' : 'chronologique'})`}>
                                      #{idx + 1}
                                    </span>
                                    <span className="font-mono font-extrabold text-white text-sm">
                                      {p.performanceDisplay}
                                    </span>
                                    {p.isPersonalRecord && (p.vent === null || p.vent === undefined || p.vent <= 2.0) && (
                                      <span className="px-1.5 py-0.5 rounded bg-rose-600/80 text-white text-[9px] font-bold font-mono" title="Record Personnel homologué (vent <= +2.0 m/s)">
                                        RP
                                      </span>
                                    )}
                                    <span className="text-[10px] font-mono text-amber-400 font-semibold px-1 py-0.5 rounded bg-amber-950/40 border border-amber-900/30">
                                      {p.niveau}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {p.pointsFFA} pts
                                    </span>
                                    {p.rawDiscipline && p.rawDiscipline !== a.discipline && (
                                      <span className="text-[10px] text-slate-400 italic" title="Libellé brut d'origine">
                                        (noté {p.rawDiscipline})
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 text-[11px] text-slate-400 sm:justify-end pl-7 sm:pl-0">
                                    <span className="font-mono text-slate-300">{p.date}</span>
                                    <span>·</span>
                                    <span className="truncate max-w-[130px]" title={p.lieu}>{p.lieu}</span>
                                    {p.vent !== null && p.vent !== undefined && (
                                      <>
                                        <span>·</span>
                                        <span className="font-mono text-slate-400">v: {p.vent > 0 ? '+' : ''}{p.vent}</span>
                                      </>
                                    )}
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                                      {a.isIndoor ? 'Salle' : 'Plein air'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {a.totalCount > a.count && (
                              <p className="text-[10px] text-slate-500 italic pt-1">
                                * {a.totalCount - a.count} autre{a.totalCount - a.count > 1 ? 's' : ''} performance{a.totalCount - a.count > 1 ? 's' : ''} plus ancienne{a.totalCount - a.count > 1 ? 's' : ''} non prise{a.totalCount - a.count > 1 ? 's' : ''} en compte conformément au filtre « {averageFilter} dernières perfs ».
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* DYNAMIC PROGRESSION TIMELINE */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-400" />
                  Trajectoire d'Évolution Chronologique : {activeProgressionItem ? `${activeProgressionItem.discipline} (${activeProgressionItem.isIndoor ? 'Salle' : 'Plein air'})` : 'Épreuve'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Progression chronologique (variantes regroupées par code épreuve, plein air et salle dissociés)
                  {progressionSeason !== 'all' ? ` · Saison ${progressionSeason}` : ' · Toutes saisons'}
                </p>
              </div>

              {/* Sélecteurs Épreuve & Saison pour la Trajectoire */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Épreuve :</span>
                  <select
                    value={activeProgressionEventKey}
                    onChange={e => setProgressionEventKey(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-sky-300 font-semibold focus:outline-none focus:border-sky-500"
                  >
                    {availableProgressionOptions.map(opt => (
                      <option key={opt.key} value={opt.key}>
                        {opt.discipline} · {opt.isIndoor ? '❄️ Hivernale (Salle)' : '☀️ Estivale (Plein air)'}{opt.codeEp ? ` (code ${opt.codeEp})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-xs text-slate-400">Saison :</span>
                  <select
                    value={progressionSeason}
                    onChange={e => setProgressionSeason(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-sky-300 font-semibold focus:outline-none focus:border-sky-500"
                    title="Filtrer la trajectoire d'évolution par saison"
                  >
                    <option value="all">Toutes saisons</option>
                    {availableSeasons.map(s => (
                      <option key={s} value={s}>Saison {s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {progressionHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                {progressionSeason !== 'all'
                  ? `Aucune performance enregistrée sur cette discipline pour la saison ${progressionSeason}.`
                  : 'Aucune performance enregistrée sur cette discipline.'}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual chronological bar line */}
                <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-600/40 space-y-6">
                  {progressionHistory.map((rec, idx) => (
                    <div key={rec.id} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-125 ${
                        (rec.isPersonalRecord && (rec.vent === null || rec.vent === undefined || rec.vent <= 2.0))
                          ? 'bg-rose-500 border-white shadow-md shadow-rose-500/50' 
                          : 'bg-slate-900 border-sky-400'
                      }`} />

                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 group-hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-sm text-white">
                              {rec.performanceDisplay}
                            </span>
                            {rec.isPersonalRecord && (rec.vent === null || rec.vent === undefined || rec.vent <= 2.0) && (
                              <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold font-mono shadow-sm" title="Record Personnel homologué (vent <= +2.0 m/s)">
                                RP / PB
                              </span>
                            )}
                            <span className="font-mono text-xs text-amber-400 font-semibold">
                              [{rec.niveau}]
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="font-mono text-slate-300">{rec.date}</span>
                            <span>·</span>
                            <span>{rec.lieu}</span>
                            {rec.vent !== null && rec.vent !== undefined && (
                              <>
                                <span>·</span>
                                <span className="font-mono">Vent: {rec.vent > 0 ? '+' : ''}{rec.vent} m/s</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-sky-400 block">
                            Saison {rec.saison}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {rec.pointsFFA} pts FFA
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center max-w-xl mx-auto space-y-4 shadow-xl my-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-sky-400 mx-auto flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Aucun athlète sélectionné
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Sélectionnez un athlète dans le menu déroulant ci-dessus ou utilisez la recherche pour consulter sa fiche individuelle, ses records personnels et ses moyennes par épreuve.
            </p>
          </div>
          {searchFilter && filteredAthletesList.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60">
              <p className="text-[11px] text-slate-500 mb-2">Athlètes correspondants à « {searchFilter} » :</p>
              <div className="flex flex-wrap gap-1.5 justify-center max-h-36 overflow-y-auto">
                {filteredAthletesList.slice(0, 8).map(name => (
                  <button
                    key={name}
                    onClick={() => onSelectAthlete(name)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-xs text-slate-300 hover:text-sky-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export const AthleteReportView = React.memo(AthleteReportViewComponent);
