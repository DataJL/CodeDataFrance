import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  Trophy, 
  FileSpreadsheet, 
  FileText, 
  FileDown, 
  Printer, 
  RotateCcw, 
  Medal, 
  Sun, 
  Building2, 
  Wind, 
  Calendar, 
  MapPin, 
  SlidersHorizontal, 
  Search, 
  ChevronDown, 
  TrendingUp, 
  ArrowLeft,
  Flame,
  UserCheck,
  BookOpen,
  Filter,
  Check,
  Sparkles,
  Database,
  Lock,
  ShieldCheck,
  HelpCircle,
  HardDrive,
  Flag,
  Calculator,
  Hash,
  Upload,
  RefreshCw,
  AlertCircle,
  Trash2,
  Layers
} from 'lucide-react';
import { CategoryCode, OfficialSeasonFile, PerformanceRecord, UserAccount } from '../../types/athletics';
import { 
  computeAnnualBilan, 
  formatPerformanceDisplay, 
  getCategoryLabel, 
  getDisciplineNature, 
  isWindMeasured, 
  CATEGORY_LABELS,
  normalizeCategory,
  getYearsForCategory,
  getAthleteYearInCategory,
  isIndoorRecord,
  isFFAOfficialIndoorCode
} from '../../utils/performanceUtils';
import { exportToWord, exportBilanToExcel, exportBilanToPDF } from '../../utils/exportUtils';
import { ALL_FRENCH_DEPARTEMENTS, OFFICIAL_FFA_CLUBS } from '../../data/frenchAthleticsClubs';
import { 
  OFFICIAL_FFA_DISCIPLINES, 
  OFFICIAL_DISCIPLINE_GROUPS, 
  getFilteredOfficialDisciplines 
} from '../../data/officialDisciplines';
import { parseAthleticsFileAsync } from '../../utils/csvParser';
import { StorageService } from '../../services/storageService';
import { StorageInfoModal } from '../StorageInfoModal';

interface BilanGeneralViewProps {
  records: PerformanceRecord[];
  onSelectAthlete: (athleteName: string) => void;
  onSelectDiscipline: (discipline: string) => void;
  onNavigate: (tab: string) => void;
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
    }
  ) => void;
  currentUser?: UserAccount | null;
}

// Ordre canonique des régions : Île-de-France est placée DIRECTEMENT après Hauts-de-France
const REGION_ORDER = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France', // Placé immédiatement après Hauts-de-France
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  "Provence-Alpes-Côte d'Azur",
  'Guadeloupe',
  'Guyane',
  'Martinique',
  'La Réunion',
  'Mayotte',
];

// Pré-indexation statique des clubs FFA pour éliminer les recalculs lourds
const STATIC_FFA_CLUB_MAP = new Map<string, { name: string; departement: string; region: string }>();
OFFICIAL_FFA_CLUBS.forEach(c => {
  STATIC_FFA_CLUB_MAP.set(c.name, c);
});

const BilanGeneralViewComponent: React.FC<BilanGeneralViewProps> = ({
  records,
  onSelectAthlete,
  onSelectDiscipline,
  onNavigate,
  onUpdateRecords,
  currentUser,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ processed: number; total: number; percent: number } | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Choix libres pour délimiter la saison officielle (ex: 2022 et 2023 pour 2022-2023)
  const [seasonStartYear, setSeasonStartYear] = useState<string>('2022');
  const [seasonEndYear, setSeasonEndYear] = useState<string>('2023');
  // Choix de l'environnement : Plein Air, Salle ou Plein air + salle
  const [targetUploadStructure, setTargetUploadStructure] = useState<'EXTERIEUR' | 'SALLE' | 'COMBINE'>('COMBINE');
  const [officialFilesRefreshTrigger, setOfficialFilesRefreshTrigger] = useState<number>(0);
  const [fileToDelete, setFileToDelete] = useState<OfficialSeasonFile | null>(null);

  // Gestion intelligente de la saisie de l'année de début
  const handleStartYearChange = (val: string) => {
    setSeasonStartYear(val);
    const num = parseInt(val.trim(), 10);
    if (!isNaN(num) && num >= 1950 && num <= 2100) {
      const curEnd = parseInt(seasonEndYear.trim(), 10);
      if (isNaN(curEnd) || curEnd === num || curEnd === num - 1 || curEnd === num + 1) {
        setSeasonEndYear(String(num + 1));
      }
    }
  };

  // Calcul du libellé de saison officiel et des années numériques
  const computedSeasonLabel = useMemo(() => {
    const s1 = seasonStartYear.trim();
    const s2 = seasonEndYear.trim();
    if (s1 && s2) return `${s1}-${s2}`;
    if (s1) return s1;
    if (s2) return s2;
    return '2025-2026';
  }, [seasonStartYear, seasonEndYear]);

  const computedEndYear = useMemo(() => {
    const s2 = parseInt(seasonEndYear.trim(), 10);
    if (!isNaN(s2) && s2 > 1950 && s2 < 2100) return s2;
    const s1 = parseInt(seasonStartYear.trim(), 10);
    if (!isNaN(s1) && s1 > 1950 && s1 < 2100) return s1 + 1;
    return 2026;
  }, [seasonStartYear, seasonEndYear]);

  const computedStartYear = useMemo(() => {
    const s1 = parseInt(seasonStartYear.trim(), 10);
    if (!isNaN(s1) && s1 > 1950 && s1 < 2100) return s1;
    return computedEndYear - 1;
  }, [seasonStartYear, computedEndYear]);

  // Bases officielles répertoriées en mémoire
  const officialFiles = useMemo(() => {
    return StorageService.getOfficialSeasonFiles();
  }, [officialFilesRefreshTrigger, records.length]);

  // Extraction ultra-rapide des métadonnées du dataset en une seule passe linéaire O(N)
  const recordsMetadata = useMemo(() => {
    const rawRegions = new Set<string>();
    const depsMap = new Map<string, { code: string; name: string; region: string }>();
    ALL_FRENCH_DEPARTEMENTS.forEach(d => depsMap.set(d.code, d));

    const clubMap = new Map<string, { name: string; departement: string; region: string }>(STATIC_FFA_CLUB_MAP);
    const natSet = new Set<string>(['FRA']);
    const yearsByCategory = new Map<string, Set<string>>();
    const seasonsSet = new Set<string>();
    let salleCount = 0;

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (r.region) rawRegions.add(r.region);
      if (r.departement && !depsMap.has(r.departement)) {
        depsMap.set(r.departement, { code: r.departement, name: `Dép. ${r.departement}`, region: r.region || 'Autre' });
      }
      if (r.club && !clubMap.has(r.club)) {
        clubMap.set(r.club, { name: r.club, departement: r.departement || '', region: r.region || '' });
      }
      if (r.nationalite && r.nationalite.trim().length >= 2) {
        natSet.add(r.nationalite.toUpperCase().trim());
      }
      if (r.annee_nais) {
        const cat = normalizeCategory(r.categorie);
        let s = yearsByCategory.get(cat);
        if (!s) {
          s = new Set<string>();
          yearsByCategory.set(cat, s);
        }
        s.add(String(r.annee_nais).trim());
      }
      if (r.saisonLabel) {
        seasonsSet.add(r.saisonLabel);
      } else if (r.saison) {
        seasonsSet.add(r.saison === 2026 ? '2025-2026' : `${r.saison - 1}-${r.saison}`);
      }

      if ((r.structure === 'SALLE' || (r.code_ep && ['105', '106', '322', '116', '742', '798'].includes(r.code_ep))) &&
          (r.saison === 2026 || (r.date >= '2025-09-01' && r.date <= '2026-08-31'))) {
        salleCount++;
      }
    }

    OFFICIAL_FFA_CLUBS.forEach(c => { if (c.region) rawRegions.add(c.region); });

    const sortedRegions = Array.from(rawRegions).sort((a, b) => {
      const idxA = REGION_ORDER.indexOf(a);
      const idxB = REGION_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const sortedDepartements = Array.from(depsMap.values()).sort((a, b) => {
      const numA = parseInt(a.code, 10);
      const numB = parseInt(b.code, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.code.localeCompare(b.code);
    });

    const sortedClubs = Array.from(clubMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    const sortedNats = Array.from(natSet).sort((a, b) => {
      if (a === 'FRA') return -1;
      if (b === 'FRA') return 1;
      return a.localeCompare(b);
    });

    return {
      regions: sortedRegions,
      departements: sortedDepartements,
      clubs: sortedClubs,
      nationalites: sortedNats,
      yearsByCategory,
      seasonsSet,
      salle2026Count: salleCount,
    };
  }, [records]);

  // Options dynamiques pour le filtre de saison (uniquement les saisons pour lesquelles un bilan a été importé)
  const availableSeasonOptions = useMemo(() => {
    const seasonsSet = new Set<string>(recordsMetadata.seasonsSet);

    officialFiles.forEach(f => {
      if (f.seasonLabel) seasonsSet.add(f.seasonLabel);
    });

    if (seasonsSet.size === 0) {
      seasonsSet.add('2025-2026');
    }

    return Array.from(seasonsSet).sort((a, b) => b.localeCompare(a));
  }, [officialFiles, recordsMetadata.seasonsSet]);

  // Détection Super Administrateur (seul habilité à télécharger la base officielle d'une saison)
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || 
    currentUser?.email?.toLowerCase() === 'jelucotte@gmail.com' || 
    currentUser?.email?.toLowerCase() === 'jerome.lucotte@yahoo.fr';

  const salle2026Count = recordsMetadata.salle2026Count;

  // Base de données fédérale officielle active (Bilans 2025-2026 et fichiers importés)
  const isRealDatasetLoaded = true;
  const lastImportedFileInfo = StorageService.getLastImportedFile();

  // Traitement officiel du fichier pour la saison et la structure ciblées (Super Administrateur)
  const processFile = async (
    file: File, 
    customParams?: {
      startYear?: number;
      endYear?: number;
      seasonLabel?: string;
      structure?: 'EXTERIEUR' | 'SALLE' | 'COMBINE';
    }
  ) => {
    setIsImporting(true);
    setImportProgress({ processed: 0, total: 100, percent: 0 });
    setImportNotice(`Lecture et extraction du fichier "${file.name}" en cours...`);

    const finalSeasonLabel = customParams?.seasonLabel || computedSeasonLabel;
    const finalEndYear = customParams?.endYear || computedEndYear;
    const finalStartYear = customParams?.startYear || computedStartYear;
    const finalStructure = customParams?.structure || targetUploadStructure;

    try {
      const text = await file.text();
      const res = await parseAthleticsFileAsync(text, {
        sourceFileName: file.name,
        targetSeason: finalEndYear,
        targetSeasonLabel: finalSeasonLabel,
        targetStructure: finalStructure,
        onProgress: (processed, total, percent) => {
          setImportProgress({ processed, total, percent });
        }
      });

      if (res.records.length > 0) {
        const finalRecords = res.records;
        const uniqueAthletes = new Set(finalRecords.map(r => r.athleteName.toLowerCase().trim())).size;

        const seasonMeta = {
          seasonLabel: finalSeasonLabel,
          startYear: finalStartYear,
          endYear: finalEndYear,
          structure: finalStructure,
          totalLinesDetected: res.totalRows,
          athleteCount: uniqueAthletes,
        };

        if (onUpdateRecords) {
          onUpdateRecords(finalRecords, finalRecords.length, file.name, seasonMeta);
        } else {
          const merged = StorageService.mergeOfficialSeasonRecords(records, finalRecords, {
            seasonLabel: finalSeasonLabel,
            startYear: finalStartYear,
            endYear: finalEndYear,
            structure: finalStructure,
            fileName: file.name,
            totalLinesDetected: res.totalRows,
            athleteCount: uniqueAthletes,
          });
          StorageService.savePerformances(merged, { 
            sourceFileName: file.name, 
            isOfficial: true, 
            season: finalEndYear 
          });
        }

        // Basculer les filtres d'affichage sur la saison et la structure nouvellement importées
        setSelectedSeason(finalSeasonLabel);
        setSelectedStructure(finalStructure === 'COMBINE' ? 'ALL' : finalStructure);
        setOfficialFilesRefreshTrigger(prev => prev + 1);

        const structureDisplay = finalStructure === 'COMBINE' 
          ? 'Plein air + salle (Centralisé)' 
          : (finalStructure === 'SALLE' ? 'En Salle' : 'Plein Air');

        setImportNotice(`✓ Fichier "${file.name}" enregistré : ${res.totalRows.toLocaleString('fr-FR')} lignes détectées, ${finalRecords.length.toLocaleString('fr-FR')} performances de ${uniqueAthletes.toLocaleString('fr-FR')} athlètes intégrées pour la saison ${finalSeasonLabel} (${structureDisplay}) !`);
        setIsUploadModalOpen(false);
        setTimeout(() => setImportNotice(null), 10000);
      } else {
        setImportNotice("⚠️ Aucune performance valide n'a pu être extraite de ce fichier. Vérifiez le format FFA Logica (délimiteur point-virgule ou tabulation).");
      }
    } catch (err: any) {
      console.error(err);
      setImportNotice("⚠️ Erreur lors de la lecture du fichier : " + err.message);
    } finally {
      setIsImporting(false);
      setImportProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (modalFileInputRef.current) modalFileInputRef.current.value = '';
    }
  };

  // Suppression d'une base officielle stockée (100% compatible iFrame via modal de confirmation)
  const handleExecuteDeleteOfficialFile = () => {
    if (!fileToDelete) return;
    const target = fileToDelete;
    const { updatedRecords } = StorageService.deleteOfficialSeasonFileAndRecords(target.id, records);
    if (onUpdateRecords) {
      onUpdateRecords(
        updatedRecords, 
        updatedRecords.length, 
        updatedRecords.length > 0 ? (updatedRecords[0].sourceFile || 'Base mise à jour') : 'Aucune base active'
      );
    }
    setOfficialFilesRefreshTrigger(prev => prev + 1);
    setFileToDelete(null);
    setImportNotice(`✓ Base "${target.fileName}" (${target.seasonLabel}) retirée du catalogue et ${target.recordCount.toLocaleString('fr-FR')} performances purgées avec succès.`);
  };

  // Import direct d'un fichier CSV depuis la sélection
  const handleDirectCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let detectedStruct: 'EXTERIEUR' | 'SALLE' | 'COMBINE' = targetUploadStructure;
      const lower = file.name.toLowerCase();
      if (lower.includes('salle') || lower.includes('indoor')) {
        detectedStruct = 'SALLE';
      } else if (lower.includes('piste')) {
        detectedStruct = 'EXTERIEUR';
      } else {
        // Ex: "Rslts 24-25.csv" ou "Rslts 2024-2025.csv" -> fichier combiné multi-épreuves
        detectedStruct = 'COMBINE';
      }

      let detectedEndYear = computedEndYear;
      let detectedStartYear = computedStartYear;
      let detectedSeasonLabel = computedSeasonLabel;
      const seasonMatch = lower.match(/(\d{2,4})[-_](\d{2,4})/);
      if (seasonMatch) {
        let y1 = parseInt(seasonMatch[1], 10);
        let y2 = parseInt(seasonMatch[2], 10);
        if (y1 < 100) y1 += 2000;
        if (y2 < 100) y2 += 2000;
        if (y2 === y1 + 1) {
          detectedStartYear = y1;
          detectedEndYear = y2;
          detectedSeasonLabel = `${y1}-${y2}`;
          setSeasonStartYear(String(y1));
          setSeasonEndYear(String(y2));
        }
      }

      await processFile(file, {
        startYear: detectedStartYear,
        endYear: detectedEndYear,
        seasonLabel: detectedSeasonLabel,
        structure: detectedStruct,
      });
    }
  };

  // Recharger le jeu de données officiel étalon démo (Rslts salle 25-26.csv)
  const handleReloadOfficialDataset = () => {
    const official = StorageService.resetToOfficialDataset();
    if (onUpdateRecords) {
      onUpdateRecords(official, official.length, 'Rslts salle 25-26.csv');
    }
    setImportNotice(`✓ Base de référence rechargée : ${official.length.toLocaleString('fr-FR')} performances certifiées actives.`);
    setTimeout(() => setImportNotice(null), 6000);
  };

  // -------------------------------------------------------------
  // ÉTATS DES FILTRES DES BILANS (Fenêtres de tri)
  // -------------------------------------------------------------
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('100m-110');
  const [selectedSexe, setSelectedSexe] = useState<'ALL' | 'M' | 'F'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | CategoryCode>('ALL');
  const [selectedStructure, setSelectedStructure] = useState<'ALL' | 'EXTERIEUR' | 'SALLE'>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<string>('2025-2026'); // '2025-2026' (01/09/2025 - 31/08/2026)
  const [customStartDate, setCustomStartDate] = useState<string>('2025-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-08-31');
  const [selectedVent, setSelectedVent] = useState<'REGULIER' | 'TOUS'>('REGULIER'); // <= 2m/s vs Tous vents
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedDepartement, setSelectedDepartement] = useState<string>('ALL');
  const [selectedClub, setSelectedClub] = useState<string>('ALL');

  // NOUVEAUX TRIS & FILTRES DEMANDÉS :
  const [selectedNationalite, setSelectedNationalite] = useState<string>('ALL'); // Nationalité (colonne S nat_ath)
  const [selectedAnneeAge, setSelectedAnneeAge] = useState<string>('ALL'); // Année d'âge dans la catégorie (1, 2, 3 ou 'ALL')
  const [selectedPerfLimit, setSelectedPerfLimit] = useState<number | 'ALL'>(1); // 1 (défaut FFA), 2, 3, 5, 10, 'ALL'
  const [selectedPerfCalcMode, setSelectedPerfCalcMode] = useState<'BEST' | 'AVERAGE'>('BEST'); // 'BEST' = Meilleure, 'AVERAGE' = Moyenne

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState<number>(50);

  // Années d'âge disponibles selon la catégorie choisie (ex: BE -> [1, 2], ES -> [1, 2, 3])
  const availableCategoryYears = useMemo(() => {
    return getYearsForCategory(selectedCategory);
  }, [selectedCategory]);

  // Année d'âge sélectionnable si une catégorie avec années d'âge est sélectionnée
  const isAnneeAgeEnabled = selectedCategory !== 'ALL' && availableCategoryYears.length > 0;

  // Si la saison sélectionnée ne fait pas partie des saisons importées, basculer sur la 1ère saison disponible
  useEffect(() => {
    if (availableSeasonOptions.length > 0 && !availableSeasonOptions.includes(selectedSeason)) {
      setSelectedSeason(availableSeasonOptions[0]);
    }
  }, [availableSeasonOptions, selectedSeason]);

  // Si la catégorie change et ne permet plus l'année sélectionnée, réinitialiser à 'ALL' (défaut)
  useEffect(() => {
    if (selectedAnneeAge !== 'ALL') {
      const num = parseInt(selectedAnneeAge, 10);
      if (!availableCategoryYears.includes(num)) {
        setSelectedAnneeAge('ALL');
      }
    }
  }, [availableCategoryYears, selectedAnneeAge]);

  // En mode 'AVERAGE' (Moyenne des performances), le choix 1 performance n'est pas sélectionnable
  // car cela revient à faire un bilan normal avec la meilleure perf.
  useEffect(() => {
    if (selectedPerfCalcMode === 'AVERAGE' && selectedPerfLimit === 1) {
      setSelectedPerfLimit('ALL');
    }
  }, [selectedPerfCalcMode, selectedPerfLimit]);

  const [isStorageInfoOpen, setIsStorageInfoOpen] = useState<boolean>(false);
  const [adaptDisciplinesToCategory, setAdaptDisciplinesToCategory] = useState<boolean>(true);

  // Groupes d'épreuves officielles de la FFA (Salle et Plein Air selon les catégories)
  const activeDisciplineGroups = useMemo(() => {
    if (!adaptDisciplinesToCategory) {
      return OFFICIAL_DISCIPLINE_GROUPS;
    }
    const filtered = getFilteredOfficialDisciplines(selectedCategory, selectedStructure, selectedSexe);
    return filtered.length > 0 ? filtered : OFFICIAL_DISCIPLINE_GROUPS;
  }, [adaptDisciplinesToCategory, selectedCategory, selectedStructure, selectedSexe]);

  // Épreuves disponibles dans la sélection actuelle
  const allAvailableDisciplineNames = useMemo(() => {
    const names = new Set<string>();
    activeDisciplineGroups.forEach(grp => grp.items.forEach(d => names.add(d)));
    return names;
  }, [activeDisciplineGroups]);

  // Si l'épreuve active ne fait pas partie des épreuves officielles de la catégorie/structure,
  // basculer automatiquement sur la 1ère épreuve officielle (ex: 50m pour les Benjamins BE)
  useEffect(() => {
    if (adaptDisciplinesToCategory && (selectedCategory !== 'ALL' || selectedStructure !== 'ALL')) {
      if (!allAvailableDisciplineNames.has(selectedDiscipline)) {
        const first = activeDisciplineGroups[0]?.items[0];
        if (first) {
          setSelectedDiscipline(first);
        }
      }
    }
  }, [selectedCategory, selectedStructure, adaptDisciplinesToCategory, allAvailableDisciplineNames, activeDisciplineGroups, selectedDiscipline]);

  // 1. Régions, Départements, Clubs et Nationalités (issus de la passe unique recordsMetadata)
  const availableRegions = recordsMetadata.regions;
  const availableDepartements = recordsMetadata.departements;
  const availableClubs = recordsMetadata.clubs;
  const availableNationalites = recordsMetadata.nationalites;

  // 3ter. Années de naissance éligibles (recherche instantanée par catégorie sans re-parcourir la base)
  const availableAnneesNaissance = useMemo(() => {
    const yearsSet = new Set<string>();
    if (selectedCategory !== 'ALL') {
      const catYears = recordsMetadata.yearsByCategory.get(selectedCategory);
      if (catYears) {
        catYears.forEach(y => yearsSet.add(y));
      }
    } else {
      recordsMetadata.yearsByCategory.forEach(set => {
        set.forEach(y => yearsSet.add(y));
      });
    }

    // Années de référence FFA si jeu restreint
    const REFERENCE_YEARS_BY_CAT: Record<string, string[]> = {
      BE: ['2014', '2013'],
      MI: ['2012', '2011'],
      CA: ['2010', '2009'],
      JU: ['2008', '2007'],
      SE: ['2003', '2002', '2001', '2000', '1999', '1998', '1997', '1996', '1995', '1994', '1993', '1992'], // 12 années d'âge (23 à 34 ans)
      MA: ['1991', '1990', '1989', '1988', '1987', '1986', '1985', '1980', '1975', '1970'],
    };

    if (selectedCategory !== 'ALL' && REFERENCE_YEARS_BY_CAT[selectedCategory]) {
      REFERENCE_YEARS_BY_CAT[selectedCategory].forEach(y => yearsSet.add(y));
    }

    return Array.from(yearsSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }, [recordsMetadata.yearsByCategory, selectedCategory]);

  // Clubs filtrés selon la région ou le département sélectionné
  const filteredClubs = useMemo(() => {
    return availableClubs.filter(c => {
      if (selectedRegion !== 'ALL' && c.region !== selectedRegion) return false;
      if (selectedDepartement !== 'ALL' && c.departement !== selectedDepartement) return false;
      return true;
    });
  }, [availableClubs, selectedRegion, selectedDepartement]);

  // Vérifier si le vent s'applique à la discipline courante (mesuré uniquement en plein air sur 12 disciplines spécifiques)
  const windIsApplicable = useMemo(() => {
    return isWindMeasured(selectedDiscipline, selectedStructure === 'ALL' ? undefined : selectedStructure);
  }, [selectedDiscipline, selectedStructure]);

  // Si le vent n'est pas mesuré sur la discipline ou en salle, forcer le filtre vent à 'TOUS'
  useEffect(() => {
    if (!windIsApplicable && selectedVent !== 'TOUS') {
      setSelectedVent('TOUS');
    }
  }, [windIsApplicable, selectedVent]);

  // -------------------------------------------------------------
  // ÉTATS DES FILTRES APPLIQUÉS (Après clic sur 'Rechercher')
  // -------------------------------------------------------------
  const [hasExecutedSearch, setHasExecutedSearch] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<{
    discipline: string;
    sexe: 'ALL' | 'M' | 'F';
    categorie: 'ALL' | CategoryCode;
    structure: 'ALL' | 'EXTERIEUR' | 'SALLE';
    season: string;
    customStartDate: string;
    customEndDate: string;
    vent: 'REGULIER' | 'TOUS';
    region: string;
    departement: string;
    club: string;
    nationalite: string;
    anneeAge: string;
    perfLimit: number | 'ALL';
    perfCalcMode: 'BEST' | 'AVERAGE';
    searchQuery: string;
  }>({
    discipline: '100m-110',
    sexe: 'ALL',
    categorie: 'ALL',
    structure: 'ALL',
    season: '2025-2026',
    customStartDate: '2025-09-01',
    customEndDate: '2026-08-31',
    vent: 'REGULIER',
    region: 'ALL',
    departement: 'ALL',
    club: 'ALL',
    nationalite: 'ALL',
    anneeAge: 'ALL',
    perfLimit: 1,
    perfCalcMode: 'BEST',
    searchQuery: '',
  });

  // Détection des modifications en cours dans les fenêtres de tri
  const hasUnappliedChanges = useMemo(() => {
    if (!hasExecutedSearch) return false;
    return (
      selectedDiscipline !== appliedFilters.discipline ||
      selectedSexe !== appliedFilters.sexe ||
      selectedCategory !== appliedFilters.categorie ||
      selectedStructure !== appliedFilters.structure ||
      selectedSeason !== appliedFilters.season ||
      customStartDate !== appliedFilters.customStartDate ||
      customEndDate !== appliedFilters.customEndDate ||
      (selectedStructure !== 'SALLE' && selectedVent !== appliedFilters.vent) ||
      selectedRegion !== appliedFilters.region ||
      selectedDepartement !== appliedFilters.departement ||
      selectedClub !== appliedFilters.club ||
      selectedNationalite !== appliedFilters.nationalite ||
      (isAnneeAgeEnabled && selectedAnneeAge !== appliedFilters.anneeAge) ||
      selectedPerfLimit !== appliedFilters.perfLimit ||
      selectedPerfCalcMode !== appliedFilters.perfCalcMode ||
      searchQuery.trim() !== appliedFilters.searchQuery
    );
  }, [
    hasExecutedSearch,
    selectedDiscipline,
    selectedSexe,
    selectedCategory,
    selectedStructure,
    selectedSeason,
    customStartDate,
    customEndDate,
    selectedVent,
    selectedRegion,
    selectedDepartement,
    selectedClub,
    selectedNationalite,
    selectedAnneeAge,
    isAnneeAgeEnabled,
    selectedPerfLimit,
    selectedPerfCalcMode,
    searchQuery,
    appliedFilters,
  ]);

  // Exécution de la recherche au clic sur le bouton "Rechercher"
  const handleExecuteSearch = () => {
    setHasExecutedSearch(true);
    setAppliedFilters({
      discipline: selectedDiscipline,
      sexe: selectedSexe,
      categorie: selectedCategory,
      structure: selectedStructure,
      season: selectedSeason,
      customStartDate,
      customEndDate,
      vent: selectedStructure === 'SALLE' ? 'TOUS' : selectedVent,
      region: selectedRegion,
      departement: selectedDepartement,
      club: selectedClub,
      nationalite: selectedNationalite,
      anneeAge: isAnneeAgeEnabled ? selectedAnneeAge : 'ALL',
      perfLimit: selectedPerfLimit,
      perfCalcMode: selectedPerfCalcMode,
      searchQuery: searchQuery.trim(),
    });
  };

  // Source de données pour le bilan : filtrage cohérent avec l'épreuve et le fichier bilan de la saison
  const activeRecordsForBilan = useMemo(() => {
    const targetDisc = appliedFilters.discipline || '';
    const targetCode = targetDisc.match(/-(\d+)$/)?.[1] || '';
    const isTarget100m = targetDisc.includes('100m') || targetCode === '110';
    const isTargetSalle = targetDisc.toLowerCase().includes('salle') || 
                          targetDisc.startsWith('60m') || 
                          isFFAOfficialIndoorCode(targetCode);

    // Priorité intelligente aux fichiers réels importés par l'utilisateur :
    // Pour la saison sélectionnée, si l'utilisateur a importé ses propres performances,
    // on masque les données de base de cette saison pour afficher exclusivement ses données réelles.
    const selectedSeasonLabel = appliedFilters.season;
    const isBaselineRecord = (r: PerformanceRecord) => {
      return (typeof r.id === 'string' && (r.id.startsWith('salle-') || r.id.startsWith('piste-') || r.id.startsWith('bilan-2025-') || r.id.startsWith('rec-demo-'))) ||
             r.sourceFile === 'Rslts salle 25-26.csv' || r.sourceFile === 'Rslts PISTE 25-26.csv' ||
             r.sourceFile === 'Rslts salle 24-25.csv' || r.sourceFile === 'Rslts PISTE 24-25.csv' ||
             r.sourceFile === 'Bases fédérales 2024-2025 & 2025-2026 certifiées';
    };

    const hasRealUserRecordsForSeason = records.some(r => {
      const matchSeason = r.saisonLabel === selectedSeasonLabel || (r.saison && `${r.saison - 1}-${r.saison}` === selectedSeasonLabel);
      return matchSeason && !isBaselineRecord(r);
    });

    const dataset = records.filter(r => {
      const matchSeason = r.saisonLabel === selectedSeasonLabel || (r.saison && `${r.saison - 1}-${r.saison}` === selectedSeasonLabel);
      if (matchSeason && hasRealUserRecordsForSeason) {
        return !isBaselineRecord(r);
      }
      return true;
    });

    return dataset.filter(r => {
      // Pour le 100m (code 110), ne JAMAIS inclure de performances issues d'un fichier salle ni de structure salle
      if (isTarget100m) {
        if (r.structure === 'SALLE') return false;
        if (r.sourceFile && r.sourceFile.toLowerCase().includes('salle') && !r.sourceFile.toLowerCase().includes('piste')) return false;
      }
      // Pour une épreuve exclusivement en salle (ex: 60m salle), ne JAMAIS inclure de performances de plein air
      if (isTargetSalle) {
        const isRecIndoor = isIndoorRecord(r.discipline, r.code_ep, r.structure, r.sourceFile, r.lieu);
        if (!isRecIndoor && r.structure === 'EXTERIEUR') return false;
      }
      return true;
    });
  }, [records, appliedFilters.discipline]);

  const rankedBilanEntries = useMemo(() => {
    // Par défaut, ne pas calculer ni afficher le classement tant que la recherche n'est pas lancée
    if (!hasExecutedSearch) {
      return [];
    }

    let sDate = appliedFilters.customStartDate;
    let eDate = appliedFilters.customEndDate;
    const sMatch = typeof appliedFilters.season === 'string' ? appliedFilters.season.match(/^(\d{4})-(\d{4})$/) : null;
    if (sMatch) {
      sDate = `${sMatch[1]}-09-01`;
      eDate = `${sMatch[2]}-08-31`;
    }

    return computeAnnualBilan(activeRecordsForBilan, {
      discipline: appliedFilters.discipline,
      seasonPeriod: appliedFilters.season,
      startDate: appliedFilters.season === 'custom' ? appliedFilters.customStartDate : sDate,
      endDate: appliedFilters.season === 'custom' ? appliedFilters.customEndDate : eDate,
      sexe: appliedFilters.sexe,
      categorie: appliedFilters.categorie,
      structure: appliedFilters.structure,
      ventCondition: appliedFilters.structure === 'SALLE' ? 'TOUS' : appliedFilters.vent,
      region: appliedFilters.region,
      departement: appliedFilters.departement,
      club: appliedFilters.club,
      nationalite: appliedFilters.nationalite,
      anneeAge: appliedFilters.anneeAge,
      perfLimitPerAthlete: appliedFilters.perfLimit,
      perfCalcMode: appliedFilters.perfCalcMode,
      searchQuery: appliedFilters.searchQuery,
    });
  }, [hasExecutedSearch, activeRecordsForBilan, appliedFilters]);

  const displayedEntries = useMemo(() => {
    if (!hasExecutedSearch) return [];
    if (displayLimit === -1) return rankedBilanEntries;
    return rankedBilanEntries.slice(0, displayLimit);
  }, [hasExecutedSearch, rankedBilanEntries, displayLimit]);

  // Métriques du Bilan affiché
  const bilanStats = useMemo(() => {
    if (!hasExecutedSearch || rankedBilanEntries.length === 0) return null;
    const nature = getDisciplineNature(appliedFilters.discipline);
    const bestEntry = rankedBilanEntries[0];
    const sum = rankedBilanEntries.reduce((acc, curr) => acc + curr.record.performanceValue, 0);
    const avg = sum / rankedBilanEntries.length;
    const pbs = rankedBilanEntries.filter(e => e.record.isPersonalRecord && (e.record.vent === null || e.record.vent === undefined || e.record.vent <= 2.0)).length;
    const hommesCount = rankedBilanEntries.filter(e => e.record.sexe === 'M').length;
    const femmesCount = rankedBilanEntries.filter(e => e.record.sexe === 'F').length;

    return {
      totalAthletes: rankedBilanEntries.length,
      bestDisplay: bestEntry.record.performanceDisplay,
      bestAthlete: bestEntry.record.athleteName,
      bestClub: bestEntry.record.club,
      averageDisplay: formatPerformanceDisplay(avg, nature),
      pbsCount: pbs,
      hommesCount,
      femmesCount
    };
  }, [hasExecutedSearch, rankedBilanEntries, appliedFilters.discipline]);

  // Réinitialisation de tous les filtres
  const handleResetFilters = () => {
    setHasExecutedSearch(false);
    setSelectedDiscipline('100m');
    setSelectedSexe('ALL');
    setSelectedCategory('ALL');
    setSelectedStructure('ALL');
    setSelectedSeason('2025-2026');
    setCustomStartDate('2025-09-01');
    setCustomEndDate('2026-08-31');
    setSelectedVent('REGULIER');
    setSelectedRegion('ALL');
    setSelectedDepartement('ALL');
    setSelectedClub('ALL');
    setSelectedNationalite('ALL');
    setSelectedAnneeAge('ALL');
    setSelectedPerfLimit(1);
    setSelectedPerfCalcMode('BEST');
    setSearchQuery('');
    setDisplayLimit(50);

    setAppliedFilters({
      discipline: '100m',
      sexe: 'ALL',
      categorie: 'ALL',
      structure: 'ALL',
      season: '2025-2026',
      customStartDate: '2025-09-01',
      customEndDate: '2026-08-31',
      vent: 'REGULIER',
      region: 'ALL',
      departement: 'ALL',
      club: 'ALL',
      nationalite: 'ALL',
      anneeAge: 'ALL',
      perfLimit: 1,
      perfCalcMode: 'BEST',
      searchQuery: '',
    });
  };

  // Exports du Bilan actuellement filtré (accessibles à tous les utilisateurs)
  const handleExportBilanExcel = () => {
    if (rankedBilanEntries.length === 0) {
      alert("Aucune performance ne correspond aux filtres actuels pour l'export Excel.");
      return;
    }
    const title = `Bilan Officiel · ${appliedFilters.discipline} · Saison ${appliedFilters.season}`;
    exportBilanToExcel(
      rankedBilanEntries, 
      title, 
      `Bilan_${appliedFilters.discipline}_${appliedFilters.season}`
    );
  };

  const handleExportBilanWord = () => {
    exportToWord(
      `Bilan Annuel Officiel · ${appliedFilters.discipline}`,
      `Saison ${appliedFilters.season} · ${appliedFilters.structure === 'SALLE' ? 'En salle (sans vent)' : (appliedFilters.vent === 'REGULIER' ? 'Vent Régulier (<=2m/s)' : 'Tous Vents')}`,
      [
        {
          heading: '1. Paramètres et Filtres du Bilan',
          text: `Discipline : ${appliedFilters.discipline} | Sexe : ${appliedFilters.sexe} | Catégorie : ${appliedFilters.categorie} | Structure : ${appliedFilters.structure} | Total athlètes classés : ${rankedBilanEntries.length}`
        },
        {
          heading: '2. Classement Officiel (Meilleure Performance Unique par Athlète)',
          tableHeaders: ['Rang', 'Performance', 'Vent', 'Athlète', 'Sexe', 'Cat.', 'Date', 'Lieu', 'Club', 'Niveau', 'Points'],
          tableRows: rankedBilanEntries.map(e => [
            String(e.rank),
            e.record.performanceDisplay,
            e.record.vent !== null && e.record.vent !== undefined ? `${e.record.vent > 0 ? '+' : ''}${e.record.vent} m/s` : '-',
            e.record.athleteName,
            e.record.sexe,
            e.record.categorie,
            e.record.date,
            e.record.lieu,
            e.record.club,
            e.record.niveau,
            String(e.record.pointsFFA)
          ])
        }
      ],
      `Bilan_${appliedFilters.discipline}_${appliedFilters.season}`
    );
  };

  const handleExportBilanPDF = () => {
    if (rankedBilanEntries.length === 0) {
      alert("Aucune performance ne correspond aux filtres actuels pour l'export PDF.");
      return;
    }
    const title = `Bilan Fédéral · ${appliedFilters.discipline} (${appliedFilters.structure === 'SALLE' ? 'En Salle' : 'Plein Air'})`;
    const subtitle = `Saison ${appliedFilters.season} · Sexe : ${appliedFilters.sexe} · Catégorie : ${appliedFilters.categorie} · ${rankedBilanEntries.length} ${appliedFilters.sexe === 'F' ? (rankedBilanEntries.length > 1 ? 'classées' : 'classée') : appliedFilters.sexe === 'M' ? (rankedBilanEntries.length > 1 ? 'classés' : 'classé') : 'classé(e)s'}`;
    exportBilanToPDF(
      title, 
      subtitle, 
      rankedBilanEntries, 
      `Bilan_${appliedFilters.discipline}_${appliedFilters.season}`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ------------------------------------------------------------- */}
      {/* BARRE SUPÉRIEURE : RETOUR TABLEAU DE BORD & TITRE CENTRÉ      */}
      {/* ------------------------------------------------------------- */}
      <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
        {/* Bouton retour vers le Tableau de bord */}
        <div className="flex items-center justify-between mb-4 sm:mb-0 sm:absolute sm:top-5 sm:left-5 z-10">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-400 hover:text-sky-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Tableau de bord</span>
          </button>
        </div>

        {/* Titre recentré et grossi avec indication Base fédérale active */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2.5">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 shrink-0" />
            <span>Bilans Fédéraux</span>
          </h1>

          {isRealDatasetLoaded && (
            <div className="flex justify-center flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Base active : {records.length.toLocaleString('fr-FR')} performances ({new Set(records.map(r => r.athleteName)).size.toLocaleString('fr-FR')} athlètes)
                {lastImportedFileInfo?.name && (
                  <span className="text-sky-300 ml-1">· Fichier : "{lastImportedFileInfo.name}"</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* BANNIÈRE DE PROGRESSION EN CAS D'IMPORTATION EN COURS */}
      {isImporting && (
        <div className="bg-slate-900 border border-blue-500/40 p-4 rounded-2xl shadow-xl space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-blue-300 font-semibold">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              {importNotice || 'Traitement et indexation de la base officielle en cours...'}
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {importProgress ? `${importProgress.percent}%` : ''}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-sky-400 h-2.5 rounded-full transition-all duration-150"
              style={{ width: `${importProgress?.percent || 15}%` }}
            />
          </div>
          {importProgress && (
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Lignes traitées : {importProgress.processed.toLocaleString('fr-FR')} / {importProgress.total.toLocaleString('fr-FR')}</span>
              <span>Enregistrement persistant dans IndexedDB</span>
            </div>
          )}
        </div>
      )}

      {importNotice && !isImporting && (
        <div className="text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{importNotice}</span>
          </div>
          <button
            onClick={() => setImportNotice(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LES 9 FENÊTRES DE TRI & FILTRES DES BILANS                     */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        
        {/* Titre & Reset */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm text-white">
              Fenêtres de Tri & Filtres des Bilans
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              {rankedBilanEntries.length} athlète{rankedBilanEntries.length > 1 ? 's' : ''} {appliedFilters.sexe === 'F' ? (rankedBilanEntries.length > 1 ? 'classées' : 'classée') : appliedFilters.sexe === 'M' ? (rankedBilanEntries.length > 1 ? 'classés' : 'classé') : (rankedBilanEntries.length > 1 ? 'classé(e)s' : 'classé(e)')}
            </span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer transition-colors"
              title="Réinitialiser tous les filtres aux valeurs par défaut"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>

        {/* Grille principale des filtres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          
          {/* 1. CATÉGORIES (Benjamin à Master avec abréviations exactes : BE, MI, CA, JU, ES, SE, MA) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center gap-1.5">
              <Medal className="w-3.5 h-3.5 text-purple-400" />
              <span>1. Catégorie d'Âge</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-purple-500 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toutes les catégories (BE à MA)</option>
              <option value="BE">BE - Benjamin / Benjamine</option>
              <option value="MI">MI - Minime</option>
              <option value="CA">CA - Cadet / Cadette</option>
              <option value="JU">JU - Junior</option>
              <option value="ES">ES - Espoir</option>
              <option value="SE">SE - Senior</option>
              <option value="MA">MA - Master</option>
            </select>
          </div>

          {/* 2. SEXE (Hommes / Femmes / Tous) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>2. Sexe (Genre)</span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedSexe('ALL')}
                className={`py-1.5 rounded-lg font-semibold text-center cursor-pointer transition-colors ${
                  selectedSexe === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setSelectedSexe('M')}
                className={`py-1.5 rounded-lg font-semibold text-center cursor-pointer transition-colors ${
                  selectedSexe === 'M'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hommes
              </button>
              <button
                type="button"
                onClick={() => setSelectedSexe('F')}
                className={`py-1.5 rounded-lg font-semibold text-center cursor-pointer transition-colors ${
                  selectedSexe === 'F'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Femmes
              </button>
            </div>
          </div>

          {/* 3. PLEIN AIR / EN SALLE */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Plein Air / Salle</span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedStructure('ALL')}
                className={`py-1.5 rounded-lg font-semibold text-center cursor-pointer transition-colors ${
                  selectedStructure === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setSelectedStructure('EXTERIEUR')}
                className={`py-1.5 rounded-lg font-semibold text-center cursor-pointer transition-colors ${
                  selectedStructure === 'EXTERIEUR'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Plein Air
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedStructure('SALLE');
                  setSelectedVent('TOUS');
                }}
                className={`py-1.5 rounded-lg font-semibold text-center cursor-pointer transition-colors ${
                  selectedStructure === 'SALLE'
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                En Salle
              </button>
            </div>
          </div>

          {/* 4. DISCIPLINE (Épreuves officielles FFA selon catégories & structure) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>4. Discipline</span>
            </label>

            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              {activeDisciplineGroups.map(grp => (
                <optgroup key={grp.family} label={`── ${grp.family} ──`}>
                  {grp.items.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* Sélecteur d'adaptation aux catégories et indicateur */}
            <div className="flex items-center justify-between text-[11px] pt-0.5 text-slate-400">
              <label className="flex items-center gap-1.5 hover:text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={adaptDisciplinesToCategory}
                  onChange={(e) => setAdaptDisciplinesToCategory(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                />
                <span>Épreuves par catégorie</span>
              </label>
              <span className="text-[10px] text-sky-400 font-mono">
                {allAvailableDisciplineNames.size} épreuve{allAvailableDisciplineNames.size > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* 5. SAISON */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>5. Saison</span>
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-emerald-500 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {availableSeasonOptions.map(s => {
                const match = s.match(/^(\d{4})-(\d{4})$/);
                const detail = match ? `(01/09/${match[1]} au 31/08/${match[2]})` : '';
                return (
                  <option key={s} value={s}>
                    Saison {s} {detail}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 6. VENT (Vent régulier <= 2m/s vs Tous vents) - Non sélectionnable pour toutes les disciplines où le vent n'est pas mesuré, ou en salle */}
          <div className={`space-y-1.5 transition-all ${
            !windIsApplicable 
              ? 'opacity-40 cursor-not-allowed select-none bg-slate-950/80 p-2 rounded-xl border border-dashed border-slate-800' 
              : ''
          }`}>
            <label className="block font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>6. Condition Vent</span>
              </span>
              <span className="text-[10px] font-mono">
                {!windIsApplicable ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    <Lock className="w-3 h-3" /> Non mesuré {selectedStructure === 'SALLE' ? '(en salle)' : `(${selectedDiscipline})`}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Mesuré en plein air
                  </span>
                )}
              </span>
            </label>
            <div className={`grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border ${
              !windIsApplicable ? 'border-slate-800/80' : 'border-slate-700'
            }`}>
              <button
                type="button"
                disabled={!windIsApplicable}
                onClick={() => setSelectedVent('REGULIER')}
                className={`py-1.5 rounded-lg font-semibold text-center transition-colors ${
                  !windIsApplicable
                    ? 'text-slate-600 bg-slate-900/40 cursor-not-allowed pointer-events-none'
                    : selectedVent === 'REGULIER'
                      ? 'bg-blue-600 text-white shadow-sm cursor-pointer'
                      : 'text-slate-400 hover:text-white cursor-pointer'
                }`}
                title={!windIsApplicable ? "Non sélectionnable : le vent n'est pas mesuré pour cette sélection" : 'Considère uniquement les performances avec vent régulier (<= +2.0 m/s)'}
              >
                Régulier (≤ 2.0 m/s)
              </button>
              <button
                type="button"
                disabled={!windIsApplicable}
                onClick={() => setSelectedVent('TOUS')}
                className={`py-1.5 rounded-lg font-semibold text-center transition-colors ${
                  !windIsApplicable
                    ? 'text-slate-500 bg-slate-900/20 cursor-not-allowed pointer-events-none'
                    : selectedVent === 'TOUS'
                      ? 'bg-amber-600 text-white shadow-sm cursor-pointer'
                      : 'text-slate-400 hover:text-white cursor-pointer'
                }`}
                title={!windIsApplicable ? "Non sélectionnable : le vent n'est pas mesuré pour cette sélection" : 'Considère toutes les performances quel que soit le vent'}
              >
                Tous Vents
              </button>
            </div>
            {!windIsApplicable && (
              <p className="text-[10px] text-amber-300/80 italic pt-0.5 leading-tight">
                {selectedStructure === 'SALLE' 
                  ? "Non sélectionnable : épreuves disputées en salle fermée sans anémomètre." 
                  : "Non sélectionnable : en plein air, le vent est mesuré uniquement sur 50m, 80m, 120m, 100m, 200m, haies courtes (50m, 80m, 100m, 110m, 200m H) et sauts horizontaux (longueur, triple saut)."}
              </p>
            )}
          </div>

          {/* 7. RÉGION (Avec Île-de-France positionnée juste après Hauts-de-France) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>7. Région</span>
              </span>
              {selectedRegion !== 'ALL' && (
                <span className="text-[10px] text-sky-400 truncate max-w-[120px]">{selectedRegion}</span>
              )}
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedClub('ALL');
              }}
              className="w-full bg-slate-950 border border-slate-700 hover:border-rose-500 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toutes les régions ({availableRegions.length})</option>
              {availableRegions.map(reg => (
                <option key={reg} value={reg}>
                  {reg} {reg === 'Île-de-France' ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 8. DÉPARTEMENT (101 départements français complets) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>8. Département</span>
              </span>
              {selectedDepartement !== 'ALL' && (
                <span className="text-[10px] text-sky-400 font-mono">Dép. {selectedDepartement}</span>
              )}
            </label>
            <select
              value={selectedDepartement}
              onChange={(e) => {
                setSelectedDepartement(e.target.value);
                setSelectedClub('ALL');
              }}
              className="w-full bg-slate-950 border border-slate-700 hover:border-indigo-500 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tous départements (101 dép. métropole & DOM)</option>
              {availableDepartements.map(dep => (
                <option key={dep.code} value={dep.code}>
                  {dep.code} - {dep.name} ({dep.region})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* NOUVELLE LIGNE DE TRIS : Nationalité, Année de naissance, Nb de perfs, Mode Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3 border-t border-slate-800 text-xs">
          
          {/* 9. NATIONALITÉ (Colonne S "nat_ath", ex: FRA) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-rose-400" />
                <span>9. Nationalité</span>
              </span>
              <span className="text-[10px] text-rose-400 font-mono">
                {selectedNationalite === 'ALL' ? 'Toutes' : selectedNationalite}
              </span>
            </label>
            <select
              value={selectedNationalite}
              onChange={(e) => setSelectedNationalite(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-rose-500 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toutes les nationalités ({availableNationalites.length})</option>
              {availableNationalites.map(nat => (
                <option key={nat} value={nat}>
                  {nat === 'FRA' ? '🇫🇷 Française (FRA)' : `🌍 ${nat}`}
                </option>
              ))}
            </select>
          </div>

          {/* 10. ANNÉE D'ÂGE DANS LA CATÉGORIE (1, 2 ou 3 selon la catégorie choisie) */}
          <div className={`space-y-1.5 transition-all ${
            !isAnneeAgeEnabled 
              ? 'opacity-40 cursor-not-allowed select-none bg-slate-950/80 p-2 rounded-xl border border-dashed border-slate-800' 
              : ''
          }`}>
            <label className="block font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>10. Année d'âge dans la catégorie</span>
              </span>
              <span className="text-[10px] font-mono">
                {!isAnneeAgeEnabled ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    <Lock className="w-3 h-3" /> Catégorie requise
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold">
                    {selectedAnneeAge === 'ALL' ? 'Toutes les années' : `Année ${selectedAnneeAge}`}
                  </span>
                )}
              </span>
            </label>
            <select
              disabled={!isAnneeAgeEnabled}
              value={selectedAnneeAge}
              onChange={(e) => setSelectedAnneeAge(e.target.value)}
              className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-white font-medium focus:outline-none ${
                !isAnneeAgeEnabled 
                  ? 'border-slate-800 text-slate-500 cursor-not-allowed pointer-events-none' 
                  : 'border-slate-700 hover:border-emerald-500 focus:ring-2 focus:ring-emerald-500 cursor-pointer'
              }`}
            >
              <option value="ALL">
                {!isAnneeAgeEnabled 
                  ? 'Verrouillé (Catégorie requise)' 
                  : 'Toutes les années'}
              </option>
              {isAnneeAgeEnabled && availableCategoryYears.map(y => (
                <option key={y} value={String(y)}>
                  {y} {y === 1 ? '(1ère année)' : `(${y}ème année)`}
                </option>
              ))}
            </select>
            {!isAnneeAgeEnabled && (
              <p className="text-[10px] text-amber-300/80 italic pt-0.5 leading-tight">
                {selectedCategory === 'ALL'
                  ? 'Sélectionnez une catégorie (ex: BE, MI, CA, JU, ES, SE) pour filtrer par année d’âge (1 à 2 pour BE/MI/CA/JU, 1 à 3 pour ES, 1 à 12 pour SE).'
                  : `La catégorie ${selectedCategory} n’a pas de subdivision d'années.`}
              </p>
            )}
          </div>

          {/* 11. NOMBRE DE PERFORMANCES PAR ATHLÈTE */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                <span>11. Nb Perfs par Athlète</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {selectedPerfLimit === 'ALL' ? 'Toutes' : `${selectedPerfLimit} max`}
              </span>
            </label>
            <select
              value={selectedPerfLimit}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedPerfLimit(v === 'ALL' ? 'ALL' : Number(v));
              }}
              className="w-full bg-slate-950 border border-slate-700 hover:border-cyan-500 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
            >
              <option 
                value={1} 
                disabled={selectedPerfCalcMode === 'AVERAGE'}
                className={selectedPerfCalcMode === 'AVERAGE' ? 'text-slate-600 bg-slate-900 cursor-not-allowed font-normal' : ''}
              >
                {selectedPerfCalcMode === 'AVERAGE' 
                  ? '1 performance (Non sélectionnable en mode moyenne)' 
                  : '1 performance (Règle standard FFA)'}
              </option>
              <option value={2}>2 meilleures performances</option>
              <option value={3}>3 meilleures performances</option>
              <option value={5}>5 meilleures performances</option>
              <option value={10}>10 meilleures performances</option>
              <option value="ALL">Toutes les performances de l'athlète</option>
            </select>
            {selectedPerfCalcMode === 'AVERAGE' && (
              <p className="text-[10px] text-amber-300/90 italic pt-0.5 leading-tight">
                Option 1 perf désactivée : faire la moyenne d'une seule perf équivaut au bilan standard avec la meilleure perf.
              </p>
            )}
          </div>

          {/* 12. MODE PERFORMANCE (Meilleure performance vs Moyenne de toutes les performances) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>12. Tri Performance</span>
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">
                {selectedPerfCalcMode === 'BEST' ? 'Meilleure' : 'Moyenne'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedPerfCalcMode('BEST')}
                className={`py-1.5 px-1 rounded-lg font-semibold text-[11px] text-center cursor-pointer transition-colors truncate ${
                  selectedPerfCalcMode === 'BEST'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Classement établi sur la meilleure performance individuelle de chaque athlète"
              >
                Meilleure perf
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPerfCalcMode('AVERAGE');
                  if (selectedPerfLimit === 1) {
                    setSelectedPerfLimit('ALL');
                  }
                }}
                className={`py-1.5 px-1 rounded-lg font-semibold text-[11px] text-center cursor-pointer transition-colors truncate ${
                  selectedPerfCalcMode === 'AVERAGE'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Classement établi sur la moyenne arithmétique de toutes les performances de chaque athlète"
              >
                Moyenne perfs
              </button>
            </div>
            <p className="text-[10px] text-slate-400 pt-0.5 leading-tight truncate">
              {selectedPerfCalcMode === 'BEST' 
                ? 'Retient la meilleure performance par athlète' 
                : 'Moyenne arithmétique des performances par athlète'}
            </p>
          </div>

        </div>

        {/* Ligne inférieure : Club, Recherche et Limite */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t border-slate-800 text-xs">
          
          {/* 13. CLUB FFA (Répertoire étendu complet de 250+ clubs) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>13. Club Affilié FFA</span>
              </span>
              <span className="text-[10px] text-teal-400 font-mono">
                {filteredClubs.length} clubs
              </span>
            </label>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-teal-500 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tous les clubs affiliés ({filteredClubs.length})</option>
              {filteredClubs.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} {c.departement ? `(${c.departement})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 14. RECHERCHE LIBRE (Athlète ou Entraîneur) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-sky-400" />
              <span>14. Recherche par Nom / Prénom</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Mayer, Samba, Zhoya, Robert..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteSearch();
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 hover:border-sky-500 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 15. Limite d'affichage */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300 flex items-center justify-between">
              <span>15. Lignes affichées</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {displayedEntries.length} / {rankedBilanEntries.length}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
              {[25, 50, 100, -1].map((lim) => (
                <button
                  key={lim}
                  type="button"
                  onClick={() => setDisplayLimit(lim)}
                  className={`py-1.5 rounded-lg font-semibold text-center cursor-pointer transition-colors ${
                    displayLimit === lim
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lim === -1 ? 'Tous' : lim}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* BARRE D'ACTION PRINCIPALE : BOUTON RECHERCHER & ÉTAT DES BILANS */}
        {/* ------------------------------------------------------------- */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/50 -mx-5 -mb-5 p-4 sm:p-5 rounded-b-2xl">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {!hasExecutedSearch ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/30 font-semibold shadow-sm">
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                Sélectionnez vos critères puis cliquez sur « Rechercher »
              </span>
            ) : hasUnappliedChanges ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Filtres modifiés · Cliquez sur « Rechercher » pour actualiser
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Affichage synchronisé avec les filtres sélectionnés
              </span>
            )}
            <span className="text-slate-400 hidden lg:inline">
              Sélection : <strong className="text-white">{selectedDiscipline}</strong> · {selectedStructure === 'ALL' ? 'Tous' : selectedStructure} · {selectedCategory} · {selectedSexe}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 border border-slate-700"
              title="Réinitialiser tous les filtres aux valeurs par défaut"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteSearch}
              className={`flex-1 sm:flex-initial px-7 py-2.5 rounded-xl font-black text-xs tracking-wide cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg ${
                !hasExecutedSearch || hasUnappliedChanges
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white ring-2 ring-blue-400/50 shadow-blue-500/30 scale-105'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
              }`}
              title="Lancer la recherche et actualiser l'affichage des bilans"
            >
              <Search className="w-4 h-4" />
              <span>Rechercher</span>
              {(!hasExecutedSearch || hasUnappliedChanges) && (
                <span className="text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                  {!hasExecutedSearch ? 'Lancer' : 'Valider'}
                </span>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* BANNIÈRE DE RAPPEL LORSQUE LES FILTRES ONT ÉTÉ MODIFIÉS */}
      {hasUnappliedChanges && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Vous avez modifié vos critères de tri (<strong>{selectedDiscipline}</strong>, <strong>{selectedStructure === 'ALL' ? 'Tous' : selectedStructure}</strong>, <strong>{selectedCategory}</strong>). Cliquez sur <strong>« Rechercher »</strong> pour mettre à jour les résultats du tableau ci-dessous.
            </span>
          </div>
          <button
            onClick={handleExecuteSearch}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow whitespace-nowrap self-end sm:self-auto"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Lancer la recherche</span>
          </button>
        </div>
      )}

      {/* Input de sélection de fichier caché pour téléchargement */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleDirectCSVUpload}
        className="hidden"
      />

      {/* ------------------------------------------------------------- */}
      {/* TABLEAU OFFICIEL DES BILANS                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80">
          <div>
            <h3 className="font-black text-base text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span>Classement des Bilans{hasExecutedSearch ? ` · ${appliedFilters.discipline}` : ''}</span>
              {!hasExecutedSearch ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/30">
                  En attente de recherche
                </span>
              ) : (
                <>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    appliedFilters.perfCalcMode === 'AVERAGE' 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {appliedFilters.perfCalcMode === 'AVERAGE' ? 'Mode Moyenne des perfs' : 'Meilleure performance'}
                  </span>
                  {appliedFilters.nationalite !== 'ALL' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Nat: {appliedFilters.nationalite}
                    </span>
                  )}
                  {appliedFilters.anneeAge !== 'ALL' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      {appliedFilters.anneeAge === '1' ? '1ère année' : `${appliedFilters.anneeAge}ème année`}
                    </span>
                  )}
                  {appliedFilters.perfLimit !== 1 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                      {appliedFilters.perfLimit === 'ALL' ? 'Toutes perfs' : `${appliedFilters.perfLimit} perfs/ath.`}
                    </span>
                  )}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/30">
                    {appliedFilters.sexe === 'ALL' ? 'Mixte (H & F)' : (appliedFilters.sexe === 'M' ? 'Hommes' : 'Femmes')}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {appliedFilters.categorie === 'ALL' ? 'Toutes Catégories' : appliedFilters.categorie}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {appliedFilters.structure === 'ALL' ? 'Plein air & Salle' : (appliedFilters.structure === 'SALLE' ? 'En Salle' : 'Plein Air')}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border bg-sky-500/20 text-sky-300 border-sky-500/40 font-mono">
                    <Calendar className="w-3 h-3 text-sky-400" />
                    <span>Saison {appliedFilters.season}</span>
                  </span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {!hasExecutedSearch ? (
                <span>Définissez vos critères de sélection puis lancez la recherche pour visualiser le bilan officiel.</span>
              ) : appliedFilters.perfCalcMode === 'AVERAGE' ? (
                <span>Règle appliquée : classement établi sur la <strong className="text-amber-300">moyenne arithmétique de toutes les performances retenues</strong> par athlète.</span>
              ) : appliedFilters.perfLimit === 1 ? (
                <span>Règle fédérale appliquée : <strong>1 seule meilleure performance par athlète</strong> retenue sur la période.</span>
              ) : (
                <span>Règle appliquée : jusqu'à <strong>{appliedFilters.perfLimit === 'ALL' ? 'toutes les' : appliedFilters.perfLimit} meilleures performances par athlète</strong> retenues.</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExportBilanExcel}
              disabled={!hasExecutedSearch || rankedBilanEntries.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                !hasExecutedSearch || rankedBilanEntries.length === 0
                  ? 'bg-slate-800/40 text-slate-500 border-slate-700/40 cursor-not-allowed'
                  : 'bg-emerald-600/25 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/40 cursor-pointer shadow-sm hover:scale-[1.02]'
              }`}
              title="Exporter les résultats actuels de votre recherche au format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export .xlsx</span>
            </button>
            <button
              type="button"
              onClick={handleExportBilanPDF}
              disabled={!hasExecutedSearch || rankedBilanEntries.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                !hasExecutedSearch || rankedBilanEntries.length === 0
                  ? 'bg-slate-800/40 text-slate-500 border-slate-700/40 cursor-not-allowed'
                  : 'bg-rose-600/25 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-500/40 cursor-pointer shadow-sm hover:scale-[1.02]'
              }`}
              title="Exporter les résultats actuels de votre recherche au format PDF (.pdf)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export .PDF</span>
            </button>
            <span className="text-xs text-slate-400 font-mono ml-1">
              {!hasExecutedSearch ? 'En attente' : rankedBilanEntries.length === 0 ? '0 résultat' : `${rankedBilanEntries.length} ligne${rankedBilanEntries.length > 1 ? 's' : ''} classée${rankedBilanEntries.length > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Corps de table */}
        <div className="overflow-x-auto">
          {!hasExecutedSearch ? (
            <div className="p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-sky-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-sky-400 shadow-lg shadow-blue-900/20">
                <Filter className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-slate-100 font-bold text-lg">
                  Consultation des bilans fédéraux
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Cette zone reste volontairement vide par défaut pour une vitesse d'affichage instantanée. Choisissez vos critères de tri ci-dessus (Discipline, Saison, Catégorie, Sexe...) puis cliquez sur <strong className="text-sky-300">« Rechercher »</strong> pour afficher le classement officiel correspondant.
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleExecuteSearch}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs cursor-pointer transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2 hover:scale-[1.02]"
                >
                  <Search className="w-4 h-4" />
                  <span>Afficher le bilan ({selectedDiscipline} · {selectedSeason})</span>
                </button>
              </div>
            </div>
          ) : displayedEntries.length === 0 ? (
            <div className="p-10 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                <Trophy className="w-7 h-7" />
              </div>

              <div>
                <p className="text-slate-200 font-bold text-base">
                  Aucune performance ne correspond aux critères filtrés
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Filtres actuels : Épreuve <strong className="text-white font-mono">{appliedFilters.discipline}</strong> · Catégorie <strong className="text-white">{appliedFilters.categorie}</strong> · Sexe <strong className="text-white">{appliedFilters.sexe}</strong> · Structure <strong className="text-white">{appliedFilters.structure}</strong> · Saison <strong className="text-white">{appliedFilters.season}</strong>.
                </p>
              </div>

              {hasUnappliedChanges && (
                <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-center justify-between gap-2 text-left">
                  <span>Des critères de recherche ont été sélectionnés ci-dessus mais pas encore validés.</span>
                  <button
                    onClick={handleExecuteSearch}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Valider et Rechercher
                  </button>
                </div>
              )}

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 text-left space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  <span>État de la base de données :</span>
                </div>
                <p>• {records.length.toLocaleString('fr-FR')} performances totales enregistrées</p>
                <p>• {salle2026Count.toLocaleString('fr-FR')} performances pour la saison 2025-2026 en salle</p>
              </div>

              {/* Suggestions d'actions rapides */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {appliedFilters.categorie !== 'ALL' && (
                  <button
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setAppliedFilters(prev => ({ ...prev, categorie: 'ALL' }));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
                  >
                    Toutes catégories
                  </button>
                )}
                {appliedFilters.sexe !== 'ALL' && (
                  <button
                    onClick={() => {
                      setSelectedSexe('ALL');
                      setAppliedFilters(prev => ({ ...prev, sexe: 'ALL' }));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
                  >
                    Mixte (Tous sexes)
                  </button>
                )}
                {appliedFilters.structure !== 'ALL' && (
                  <button
                    onClick={() => {
                      setSelectedStructure('ALL');
                      setAppliedFilters(prev => ({ ...prev, structure: 'ALL' }));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
                  >
                    Plein air & Salle
                  </button>
                )}
                <button
                  onClick={handleReloadOfficialDataset}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold cursor-pointer border border-indigo-500/40 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recharger la référence officielle étalon</span>
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  <span>Réinitialiser</span>
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <th className="py-3 px-3.5 text-center w-14">Rang</th>
                  <th className="py-3 px-3.5">{appliedFilters.perfCalcMode === 'AVERAGE' ? 'Perf. Moyenne' : 'Perf.'}</th>
                  {appliedFilters.perfCalcMode === 'AVERAGE' && (
                    <th className="py-3 px-2 text-center" title="Nombre de performances moyennées">Nb Perfs</th>
                  )}
                  {appliedFilters.perfCalcMode === 'AVERAGE' && (
                    <th className="py-3 px-2.5 text-center" title="Meilleure performance individuelle de l'athlète">Meilleure</th>
                  )}
                  <th className="py-3 px-2 text-center">Nat.</th>
                  <th className="py-3 px-2 text-center">Né(e)</th>
                  <th className="py-3 px-3 text-center">Vent</th>
                  <th className="py-3 px-3.5">Athlète</th>
                  <th className="py-3 px-2.5 text-center">Sexe</th>
                  <th className="py-3 px-2.5 text-center">Cat.</th>
                  <th className="py-3 px-2.5 text-center">Env.</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Lieu</th>
                  <th className="py-3 px-3.5">Club Affilié</th>
                  <th className="py-3 px-2.5 text-center">Ligue</th>
                  <th className="py-3 px-2.5 text-center">Niveau</th>
                  <th className="py-3 px-3 text-right">Pts FFA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {displayedEntries.map((entry) => {
                  const r = entry.record;
                  const rankBadgeClass = 
                    entry.rank === 1 ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-black' :
                    entry.rank === 2 ? 'bg-slate-300/20 text-slate-200 border-slate-300/40 font-black' :
                    entry.rank === 3 ? 'bg-amber-700/20 text-amber-500 border-amber-600/40 font-black' :
                    'text-slate-400 font-mono';

                  const hasWind = r.vent !== null && r.vent !== undefined;
                  const windIsLegal = hasWind ? r.vent! <= 2.0 : true;

                  return (
                    <tr 
                      key={`${entry.rank}-${entry.record.id}`}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Rang */}
                      <td className="py-2.5 px-3.5 text-center">
                        <span className={`inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-lg border text-xs ${rankBadgeClass}`}>
                          {entry.rank}
                        </span>
                      </td>

                      {/* Performance (ou Moyenne) */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-sm font-black tracking-tight ${
                            appliedFilters.perfCalcMode === 'AVERAGE' ? 'text-amber-300' : 'text-white'
                          }`}>
                            {r.performanceDisplay}
                          </span>
                          {entry.isAverage && (
                            <span 
                              className="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              title={`Moyenne de ${entry.perfCount} performance(s)`}
                            >
                              MOY
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Si mode moyenne : Nombre de perfs prises en compte */}
                      {appliedFilters.perfCalcMode === 'AVERAGE' && (
                        <td className="py-2.5 px-2 text-center whitespace-nowrap font-mono text-[11px] text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-bold">
                            {entry.perfCount} perf{entry.perfCount && entry.perfCount > 1 ? 's' : ''}
                          </span>
                        </td>
                      )}

                      {/* Si mode moyenne : Meilleure performance individuelle */}
                      {appliedFilters.perfCalcMode === 'AVERAGE' && (
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap font-mono text-[11px] text-emerald-300 font-bold">
                          {entry.bestValue !== undefined ? formatPerformanceDisplay(entry.bestValue, getDisciplineNature(r.discipline)) : '-'}
                        </td>
                      )}

                      {/* Nationalité (colonne S nat_ath) */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {r.nationalite || 'FRA'}
                        </span>
                      </td>

                      {/* Année de naissance (colonne V annee_nais) */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {r.annee_nais || '-'}
                      </td>

                      {/* Vent */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {hasWind ? (
                          <span 
                            className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                              windIsLegal 
                                ? 'bg-sky-500/10 text-sky-300 border-sky-500/30' 
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                            }`}
                            title={windIsLegal ? 'Vent régulier homologable' : 'Vent trop favorable non homologable (> +2.0m/s)'}
                          >
                            {r.vent! > 0 ? `+${r.vent}` : r.vent}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      {/* Nom de l'Athlète */}
                      <td className="py-2.5 px-3.5">
                        <button
                          onClick={() => onSelectAthlete(r.athleteName)}
                          className="font-bold text-slate-100 hover:text-sky-400 transition-colors text-left group-hover:underline cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{r.athleteName}</span>
                        </button>
                      </td>

                      {/* Sexe */}
                      <td className="py-2.5 px-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          r.sexe === 'M' ? 'bg-blue-600/20 text-sky-300' : 'bg-pink-600/20 text-pink-300'
                        }`}>
                          {r.sexe}
                        </span>
                      </td>

                      {/* Catégorie */}
                      <td className="py-2.5 px-2.5 text-center">
                        <span 
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20 font-mono"
                          title={getCategoryLabel(r.categorie)}
                        >
                          {(() => {
                            const yr = getAthleteYearInCategory(r);
                            const norm = normalizeCategory(r.categorie);
                            return yr ? `${norm} ${yr}` : r.categorie;
                          })()}
                        </span>
                      </td>

                      {/* Environnement (Ext / Salle) */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          r.structure === 'SALLE' 
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
                            : 'bg-amber-600/10 text-amber-300 border border-amber-500/20'
                        }`}>
                          {r.structure === 'SALLE' ? 'Salle' : 'Plein air'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                        {r.date}
                      </td>

                      {/* Lieu */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                        {r.lieu}
                      </td>

                      {/* Club */}
                      <td className="py-2.5 px-3.5 text-slate-200 truncate max-w-[160px]" title={r.club}>
                        {r.club}
                      </td>

                      {/* Région / Ligue */}
                      <td className="py-2.5 px-2.5 text-center text-slate-400 text-[11px] truncate max-w-[90px]" title={r.region}>
                        {r.region || '-'}
                      </td>

                      {/* Niveau FFA */}
                      <td className="py-2.5 px-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {r.niveau || 'IR'}
                        </span>
                      </td>

                      {/* Points FFA */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                        {r.pointsFFA} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pied de tableau avec résumé et pagination */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Affichage de <strong>{displayedEntries.length}</strong> athlètes sur <strong>{rankedBilanEntries.length}</strong> {appliedFilters.sexe === 'F' ? 'classées' : appliedFilters.sexe === 'M' ? 'classés' : 'classé(e)s'} dans les Bilans de l'épreuve.
          </div>
          {rankedBilanEntries.length > displayedEntries.length && (
            <button
              onClick={() => setDisplayLimit(-1)}
              className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline"
            >
              Afficher l'intégralité du classement ({rankedBilanEntries.length} athlètes) →
            </button>
          )}
        </div>

      </div>



      {/* MODAL EXPLICATIF DU STOCKAGE DES FICHIERS & RÉFÉRENCE Rslts salle 25-26.csv */}
      <StorageInfoModal
        isOpen={isStorageInfoOpen}
        onClose={() => setIsStorageInfoOpen(false)}
        totalRecordsCount={records.length}
      />

      {/* MODAL SUPER ADMINISTRATEUR : TÉLÉCHARGER LES RÉSULTATS D'UNE SAISON */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-sky-300 border border-blue-500/40">
                    Super Administrateur
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Base Officielle</span>
                </div>
                <h3 className="text-lg font-black text-white">Télécharger les résultats d'une saison</h3>
                <p className="text-xs text-slate-300">
                  Le fichier importé constituera la base officielle permanente pour la saison ciblée. Vos futures recherches l'utiliseront directement sans besoin de re-téléchargement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isImporting) setIsUploadModalOpen(false);
                }}
                disabled={isImporting}
                className="text-slate-400 hover:text-white text-base font-bold px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. CONFIGURATION DE LA SAISON : 2 CHAMPS LIBRES POUR DÉLIMITER LA SAISON */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saison officielle ciblée (2 champs libres) :</span>
                </label>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Saison {computedSeasonLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Saisissez librement les deux années délimitant la saison officielle (ex: <strong>2024</strong> et <strong>2025</strong> pour <strong>2024-2025</strong>) ou cliquez sur un raccourci :
              </p>

              {/* Raccourcis saisons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { start: '2025', end: '2026', label: '2025-2026' },
                  { start: '2024', end: '2025', label: '2024-2025' },
                  { start: '2023', end: '2024', label: '2023-2024' },
                  { start: '2022', end: '2023', label: '2022-2023' },
                  { start: '2021', end: '2022', label: '2021-2022' },
                ].map(s => {
                  const isSel = seasonStartYear === s.start && seasonEndYear === s.end;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      disabled={isImporting}
                      onClick={() => {
                        setSeasonStartYear(s.start);
                        setSeasonEndYear(s.end);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        isSel
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Année début
                  </span>
                  <input
                    type="text"
                    value={seasonStartYear}
                    onChange={(e) => handleStartYearChange(e.target.value)}
                    placeholder="Ex: 2022"
                    disabled={isImporting}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white font-mono text-sm font-bold rounded-lg px-3 py-2 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Année fin
                  </span>
                  <input
                    type="text"
                    value={seasonEndYear}
                    onChange={(e) => setSeasonEndYear(e.target.value)}
                    placeholder="Ex: 2023"
                    disabled={isImporting}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white font-mono text-sm font-bold rounded-lg px-3 py-2 text-center"
                  />
                </div>
              </div>

              <div className="text-[11px] text-sky-300/90 font-mono bg-sky-950/40 border border-sky-800/40 rounded-lg px-3 py-1.5 flex items-center justify-between">
                <span>Période fédérale : 01/09/{computedStartYear} au 31/08/{computedEndYear}</span>
                <span className="text-slate-400 text-[10px]">Affectation automatique</span>
              </div>
            </div>

            {/* 2. CHOIX STRUCTURE / ENVIRONNEMENT : PLEIN AIR OU SALLE */}
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Structure / Environnement ciblé :</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Séparation étanche des fichiers
                </span>
              </label>
              <p className="text-[11px] text-slate-400">
                Précisez si ce fichier correspond à la saison en salle ou au plein air pour stocker et isoler correctement tous vos bilans :
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => setTargetUploadStructure('EXTERIEUR')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    targetUploadStructure === 'EXTERIEUR'
                      ? 'bg-amber-500/20 border-amber-500 text-white ring-2 ring-amber-500/30'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <Sun className={`w-5 h-5 ${targetUploadStructure === 'EXTERIEUR' ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-black">Plein Air (Extérieur)</span>
                  <span className="text-[10px] text-slate-400">100m, 200m, Hauteur, Disque...</span>
                </button>

                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => setTargetUploadStructure('SALLE')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    targetUploadStructure === 'SALLE'
                      ? 'bg-blue-600/30 border-blue-500 text-white ring-2 ring-blue-500/30'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <Building2 className={`w-5 h-5 ${targetUploadStructure === 'SALLE' ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-black">En Salle (Indoor)</span>
                  <span className="text-[10px] text-slate-400">50m, 60m, Poids en salle...</span>
                </button>

                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => setTargetUploadStructure('COMBINE')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    targetUploadStructure === 'COMBINE'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white ring-2 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <Layers className={`w-5 h-5 ${targetUploadStructure === 'COMBINE' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-black">Plein air + salle</span>
                  <span className="text-[10px] text-slate-400">Fichier unique centralisé pour la saison</span>
                </button>
              </div>
            </div>

            {/* Zone de glisser-déposer / sélection de fichier */}
            <input
              ref={modalFileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processFile(f);
              }}
              className="hidden"
            />

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) processFile(f);
              }}
              onClick={() => {
                if (!isImporting) modalFileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragOver 
                  ? 'border-blue-400 bg-blue-950/60 ring-2 ring-blue-500/40' 
                  : 'border-slate-700 hover:border-blue-500/70 bg-slate-950/50 hover:bg-slate-950'
              } ${isImporting ? 'pointer-events-none opacity-60' : ''}`}
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-600/20 text-sky-400 flex items-center justify-center mb-3 border border-blue-500/30">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white mb-1">
                Cliquez pour choisir votre fichier ou glissez-le ici
              </p>
              <p className="text-xs text-slate-400">
                Fichiers FFA Logica acceptés : <strong>.csv</strong> ou <strong>.txt</strong> (ex: <em>Rslts salle 25-26.csv</em>, <em>Rslts PISTE 25-26.csv</em>)
              </p>
              <div className="mt-2 text-[11px] font-mono text-emerald-300">
                Destination : Saison <strong>{computedSeasonLabel}</strong> · Structure <strong>{
                  targetUploadStructure === 'COMBINE' 
                    ? 'Plein air + salle (Centralisé)' 
                    : (targetUploadStructure === 'SALLE' ? 'En Salle' : 'Plein Air')
                }</strong>
              </div>
            </div>

            {/* Progression en direct */}
            {isImporting && (
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-blue-500/40">
                <div className="flex items-center justify-between text-xs text-blue-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    {importNotice || 'Indexation de la base officielle...'}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {importProgress ? `${importProgress.percent}%` : ''}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-150"
                    style={{ width: `${importProgress?.percent || 15}%` }}
                  />
                </div>
                {importProgress && (
                  <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                    <span>Lignes traitées : {importProgress.processed.toLocaleString('fr-FR')} / {importProgress.total.toLocaleString('fr-FR')}</span>
                    <span>Stockage permanent IndexedDB</span>
                  </div>
                )}
              </div>
            )}

            {/* 3. CATALOGUE DES BASES OFFICIELLES ENREGISTRÉES */}
            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  <span>Bases officielles enregistrées ({officialFiles.length}) :</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {officialFiles.length > 0 ? 'Consommation immédiate' : 'Aucune base'}
                </span>
              </div>

              {officialFiles.length === 0 ? (
                <div className="p-4 text-center rounded-lg bg-slate-900/40 border border-dashed border-slate-800">
                  <p className="text-xs text-slate-400">
                    Aucune base officielle enregistrée actuellement.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sélectionnez un fichier bilan FFA ci-dessus pour alimenter l'application.
                  </p>
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {officialFiles.map(file => (
                    <div 
                      key={file.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs hover:border-slate-700 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="font-mono font-bold text-sky-300 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded text-[11px]">
                            {file.seasonLabel}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            file.structure === 'COMBINE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : (file.structure === 'SALLE' 
                                ? 'bg-blue-500/20 text-sky-300 border border-blue-500/40' 
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40')
                          }`}>
                            {file.structure === 'COMBINE' ? 'Plein air + salle' : (file.structure === 'SALLE' ? 'Salle' : 'Plein Air')}
                          </span>
                          <span className="text-slate-300 font-mono text-[11px] truncate max-w-[170px]" title={file.fileName}>
                            {file.fileName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSeason(file.seasonLabel);
                              setSelectedStructure(file.structure === 'COMBINE' ? 'ALL' : file.structure);
                              setIsUploadModalOpen(false);
                            }}
                            className="text-[11px] text-sky-400 hover:text-sky-300 underline font-semibold cursor-pointer"
                          >
                            Afficher
                          </button>
                          <button
                            type="button"
                            onClick={() => setFileToDelete(file)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title={`Supprimer la base ${file.fileName} et purger ses performances`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 3 indicateurs clés */}
                      <div className="grid grid-cols-3 gap-1 font-mono text-[9px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <div>Lignes : <strong className="text-cyan-400">{file.totalLinesDetected ? file.totalLinesDetected.toLocaleString('fr-FR') : '—'}</strong></div>
                        <div>Perfs : <strong className="text-emerald-400">{file.recordCount.toLocaleString('fr-FR')}</strong></div>
                        <div>Athlètes : <strong className="text-sky-400">{file.athleteCount ? file.athleteCount.toLocaleString('fr-FR') : '—'}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-500 font-mono">
                Base actuelle : {records.length.toLocaleString('fr-FR')} performances en mémoire
              </span>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold cursor-pointer transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION DE SUPPRESSION D'UNE BASE OFFICIELLE (100% compatible iFrame) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Supprimer cette base officielle ?</h3>
                <p className="text-xs text-slate-400">Purgera les données de tous les bilans</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Fichier :</span>
                <span className="font-mono text-slate-200 font-semibold truncate max-w-[220px]" title={fileToDelete.fileName}>
                  {fileToDelete.fileName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Saison fédérale :</span>
                <span className="font-mono text-sky-300 font-bold">{fileToDelete.seasonLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Structure / Environnement :</span>
                <span className="text-emerald-300 font-semibold">
                  {fileToDelete.structure === 'COMBINE' ? 'Plein air + salle (Centralisé)' : fileToDelete.structure === 'SALLE' ? 'En Salle' : 'Plein Air'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Lignes détectées :</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {fileToDelete.totalLinesDetected ? fileToDelete.totalLinesDetected.toLocaleString('fr-FR') : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Performances à purger :</span>
                <span className="font-mono text-rose-400 font-bold">
                  {fileToDelete.recordCount.toLocaleString('fr-FR')} perfs
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Athlètes concernés :</span>
                <span className="font-mono text-sky-400 font-bold">
                  {fileToDelete.athleteCount ? fileToDelete.athleteCount.toLocaleString('fr-FR') : '—'} athlètes
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir retirer <strong>{fileToDelete.fileName}</strong> ? Ses <strong>{fileToDelete.recordCount.toLocaleString('fr-FR')}</strong> performances seront immédiatement supprimées de l'ensemble des modules.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteOfficialFile}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-rose-900/40 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export const BilanGeneralView = React.memo(BilanGeneralViewComponent);
