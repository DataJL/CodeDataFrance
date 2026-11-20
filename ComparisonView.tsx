import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  Trophy, 
  Flame, 
  ArrowRight, 
  FileSpreadsheet, 
  FileText, 
  FileDown, 
  Check, 
  Minus,
  Sparkles,
  Calendar,
  Sun,
  Snowflake,
  Layers,
  Search,
  RotateCcw,
  Medal,
  Wind,
  Filter
} from 'lucide-react';
import { PerformanceRecord } from '../../types/athletics';
import { 
  cleanDisciplineName, 
  getDisciplineNature, 
  isBetterPerformance 
} from '../../utils/performanceUtils';
import { exportToExcel, exportToPDF, exportToWord } from '../../utils/exportUtils';

interface ComparisonViewProps {
  records: PerformanceRecord[];
  onSelectAthlete: (athleteName: string) => void;
}

/**
 * Normalise la clé d'un athlète pour regrouper "Alice CHANDON", "CHANDON Alice", etc.
 */
function normalizeAthleteKey(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
}

/**
 * Vérifie si le nom d'un enregistrement correspond à un athlète ciblé
 * Tolère l'ordre Prénom NOM ou NOM Prénom, ainsi que les suffixes de club ou catégorie entre parenthèses
 */
function matchesAthleteName(recordAthleteName: string, targetName: string): boolean {
  if (!recordAthleteName || !targetName) return false;
  const rName = recordAthleteName.trim().toLowerCase();
  const tName = targetName.trim().toLowerCase();
  if (rName === tName) return true;

  const keyR = normalizeAthleteKey(recordAthleteName);
  const keyT = normalizeAthleteKey(targetName);
  if (keyR === keyT) return true;

  // Recherche par mots-clés (ex: "Alice" et "Chandon" tous les deux présents)
  const targetWords = keyT.split(' ').filter(w => w.length >= 2);
  if (targetWords.length >= 2 && targetWords.every(w => keyR.includes(w))) {
    return true;
  }
  const recordWords = keyR.split(' ').filter(w => w.length >= 2);
  if (recordWords.length >= 2 && recordWords.every(w => keyT.includes(w))) {
    return true;
  }

  return false;
}

/**
 * Normalise le libellé d'une discipline pour rapprocher les variantes d'écritures
 * (ex: "100m haies (76)", "100m Haies (76cm)", "100m Haies-76", "100m Haies", "100 m haies (76)", etc.)
 * Garantit que les athlètes d'une même épreuve (comme le 100m Haies en Cadettes / Minimes)
 * sont parfaitement confrontés sur la même ligne de comparaison.
 */
function canonicalizeDiscipline(discipline: string, record?: PerformanceRecord): { key: string; displayName: string } {
  if (!discipline) return { key: '', displayName: '' };
  
  let d = discipline.trim();

  // 1. Nettoyage des suffixes de manche / tour Logica après un slash (ex: "/ 1er", "/ 2e", "/ Finale", "/ MIF", "/ CAF")
  if (d.includes('/')) {
    d = d.split('/')[0].trim();
  }

  // 2. Retirer les mentions de structure (salle, indoor, plein air, piste)
  d = d.replace(/\s*[-–(]?\s*(salle|indoor|plein\s*air|piste|extérieur|exterieur)\s*\)?/gi, '').trim();

  // 3. Normaliser les espaces dans les distances (ex: "100 m" -> "100m", "50 m" -> "50m")
  d = d.replace(/(\d+)\s+m\b/gi, '$1m');
  d = d.replace(/(\d+)\s*m\s*h(aies)?\b/gi, '$1m Haies');

  // 4. Détection et normalisation intelligente des hauteurs de haies
  const is100mH = /\b100\s*m?\s*h(aies)?\b/i.test(d);
  const is60mH = /\b60\s*m?\s*h(aies)?\b/i.test(d);
  const is80mH = /\b80\s*m?\s*h(aies)?\b/i.test(d);
  const is50mH = /\b50\s*m?\s*h(aies)?\b/i.test(d);
  const is110mH = /\b110\s*m?\s*h(aies)?\b/i.test(d);
  const is400mH = /\b400\s*m?\s*h(aies)?\b/i.test(d);

  if (is100mH) {
    // Si hauteur explicitée à 84cm (Seniors / Espoirs / Juniors F)
    if (/(?:0[.,]84m?|84\s*cm?|84)/i.test(d)) {
      d = '100m Haies (84)';
    } else {
      // Pour Cadettes (CAF) et Minimes (MIF) ainsi que toutes les variantes 76cm ou 100m Haies sans précision pour les femmes
      d = '100m Haies (76)';
    }
  } else if (is80mH) {
    if (/(?:0[.,]84m?|84\s*cm?|84)/i.test(d)) {
      d = '80m Haies (84)';
    } else {
      d = '80m Haies (76)';
    }
  } else if (is60mH) {
    if (/(?:0[.,]76m?|76\s*cm?|76)/i.test(d)) {
      d = '60m Haies (76)';
    } else if (/(?:0[.,]84m?|84\s*cm?|84)/i.test(d)) {
      d = '60m Haies (84)';
    } else if (/(?:0[.,]91m?|91\s*cm?|91)/i.test(d)) {
      d = '60m Haies (91)';
    } else if (/(?:1[.,]06m?|106\s*cm?|106)/i.test(d)) {
      d = '60m Haies (106)';
    } else {
      d = '60m Haies';
    }
  } else if (is50mH) {
    if (/(?:0[.,]65m?|65\s*cm?|65)/i.test(d)) {
      d = '50m Haies (65)';
    } else {
      d = '50m Haies (76)';
    }
  } else if (is110mH) {
    if (/(?:0[.,]91m?|91\s*cm?|91)/i.test(d)) {
      d = '110m Haies (91)';
    } else if (/(?:0[.,]99m?|99\s*cm?|99|1[.,]00m?)/i.test(d)) {
      d = '110m Haies (99)';
    } else if (/(?:1[.,]06m?|106\s*cm?|106)/i.test(d)) {
      d = '110m Haies (106)';
    } else {
      d = '110m Haies';
    }
  } else if (is400mH) {
    if (/(?:0[.,]76m?|76\s*cm?|76)/i.test(d)) {
      d = '400m Haies (76)';
    } else if (/(?:0[.,]84m?|84\s*cm?|84)/i.test(d)) {
      d = '400m Haies (84)';
    } else if (/(?:0[.,]91m?|91\s*cm?|91)/i.test(d)) {
      d = '400m Haies (91)';
    } else {
      d = '400m Haies';
    }
  } else {
    // Retirer les codes épreuves FFA en fin (ex: "-105")
    d = d.replace(/\s*-\s*\d+$/g, '').trim();

    // Normalisation des poids de lancers
    d = d.replace(/\((?:3\s*kg|3kg)\)/gi, '(3 kg)');
    d = d.replace(/\((?:4\s*kg|4kg)\)/gi, '(4 kg)');
    d = d.replace(/\((?:5\s*kg|5kg)\)/gi, '(5 kg)');
    d = d.replace(/\((?:6\s*kg|6kg)\)/gi, '(6 kg)');
    d = d.replace(/\((?:7[.,]26\s*kg|7[.,]260\s*kg|7\.26kg)\)/gi, '(7.26 kg)');
  }

  // 5. Normaliser les espaces
  d = d.replace(/\s+/g, ' ').trim();

  // Clé canonique (minuscule sans accents)
  const key = d
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Nom d'affichage élégant et homogène
  let displayName = d;
  displayName = displayName
    .replace(/\bhaies\b/gi, 'Haies')
    .replace(/\blongueur\b/gi, 'Longueur')
    .replace(/\bhauteur\b/gi, 'Hauteur')
    .replace(/\bperche\b/gi, 'Perche')
    .replace(/\btriple\s*saut\b/gi, 'Triple Saut')
    .replace(/\bpoids\b/gi, 'Poids')
    .replace(/\bdisque\b/gi, 'Disque')
    .replace(/\bmarteau\b/gi, 'Marteau')
    .replace(/\bjavelot\b/gi, 'Javelot')
    .replace(/\bmarche\b/gi, 'Marche')
    .replace(/\bsteeple\b/gi, 'Steeple');

  return { key, displayName };
}

/**
 * Compare deux performances pour déterminer laquelle constitue le véritable Record Personnel (RP).
 * Règle athlétique stricte :
 * - Course (temps) : le plus petit temps est TOUJOURS le meilleur record.
 * - Concours (distance / points) : la plus grande mesure est TOUJOURS le meilleur record.
 * - En cas d'égalité : privilégier le vent régulier (<= +2.0 m/s), puis la certification isPersonalRecord, puis la plus récente.
 */
function isBetterRecord(candidate: PerformanceRecord, currentBest: PerformanceRecord): boolean {
  const nature = candidate.nature || getDisciplineNature(candidate.discipline);
  const valCand = candidate.performanceValue;
  const valBest = currentBest.performanceValue;

  // Si l'une des valeurs est invalide (<= 0), privilégier celle qui est valide
  if (valCand <= 0 && valBest > 0) return false;
  if (valBest <= 0 && valCand > 0) return true;

  // 1. Comparaison par valeur athlétique réelle
  const diff = Math.abs(valCand - valBest);
  if (diff > 0.0001) {
    if (nature === 'time') {
      return valCand < valBest; // Moins de secondes = meilleur chrono (ex: 13"42 bat 14"10)
    }
    return valCand > valBest; // Plus de mètres ou de points = meilleur saut/lancer
  }

  // 2. En cas d'égalité sur la valeur brute (ex: deux perfs à 14"20) :
  // Privilégier le record certifié isPersonalRecord
  if (candidate.isPersonalRecord && !currentBest.isPersonalRecord) return true;
  if (!candidate.isPersonalRecord && currentBest.isPersonalRecord) return false;

  // 3. Privilégier le vent régulier (<= +2.0 m/s) face à un vent trop favorable (> +2.0 m/s)
  const wCand = candidate.vent ?? 0;
  const wBest = currentBest.vent ?? 0;
  if (wCand <= 2.0 && wBest > 2.0) return true;
  if (wCand > 2.0 && wBest <= 2.0) return false;

  // 4. Privilégier la date la plus récente
  return (candidate.date || '') > (currentBest.date || '');
}

/**
 * Vérifie si un enregistrement correspond aux filtres de Saison et de Période (Été / Hiver)
 */
function recordMatchesPeriod(
  r: PerformanceRecord, 
  season: string, 
  structure: 'ALL' | 'EXTERIEUR' | 'SALLE'
): boolean {
  // Filtre Saison
  if (season !== 'ALL') {
    let matchSeason = false;
    if (r.saisonLabel && r.saisonLabel === season) {
      matchSeason = true;
    } else if (r.saison && (String(r.saison) === season || `${r.saison - 1}-${r.saison}` === season)) {
      matchSeason = true;
    } else if (season.includes('-')) {
      const parts = season.split('-');
      const y1 = parseInt(parts[0], 10);
      const y2 = parseInt(parts[1], 10);
      if (r.saison === y2 || r.saison === y1) {
        matchSeason = true;
      } else if (r.date) {
        const start = `${y1}-09-01`;
        const end = `${y2}-08-31`;
        if (r.date >= start && r.date <= end) {
          matchSeason = true;
        }
      }
    } else if (r.date && r.date.startsWith(season)) {
      matchSeason = true;
    }

    if (!matchSeason) return false;
  }

  // Filtre Période Été / Hiver (Plein air / En salle)
  if (structure !== 'ALL') {
    const isSalle = r.structure === 'SALLE' || /\b(salle|indoor)\b/i.test(r.discipline);
    if (structure === 'SALLE' && !isSalle) return false;
    if (structure === 'EXTERIEUR' && isSalle) return false;
  }

  return true;
}

const ComparisonViewComponent: React.FC<ComparisonViewProps> = ({
  records,
  onSelectAthlete,
}) => {
  // 1. Liste unifiée des athlètes sans doublons de format de nom
  const { athletesList, athleteKeyMap } = useMemo(() => {
    const keyToDisplay = new Map<string, { display: string; count: number }>();

    for (let i = 0; i < records.length; i++) {
      const raw = records[i].athleteName;
      if (!raw || !raw.trim()) continue;
      const key = normalizeAthleteKey(raw);
      if (!key) continue;

      const existing = keyToDisplay.get(key);
      if (!existing) {
        keyToDisplay.set(key, { display: raw.trim(), count: 1 });
      } else {
        existing.count++;
        // Préférer la casse "Prénom NOM" si disponible
        if (/[a-z]/.test(raw) && /[A-Z]{2,}/.test(raw)) {
          existing.display = raw.trim();
        }
      }
    }

    const sortedList = Array.from(keyToDisplay.values())
      .map(v => v.display)
      .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

    return {
      athletesList: sortedList,
      athleteKeyMap: keyToDisplay,
    };
  }, [records]);

  // Saisons disponibles dans le jeu de données
  const availableSeasons = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (r.saisonLabel) {
        set.add(r.saisonLabel);
      } else if (r.saison) {
        set.add(r.saison === 2026 ? '2025-2026' : `${r.saison - 1}-${r.saison}`);
      }
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  // -------------------------------------------------------------
  // ÉTATS DE SÉLECTION DES ATHLÈTES
  // -------------------------------------------------------------
  const [athleteA, setAthleteA] = useState<string>(() => {
    const foundAlice = athletesList.find(a => matchesAthleteName(a, 'Alice CHANDON'));
    return foundAlice || athletesList[0] || 'Alice CHANDON';
  });

  const [athleteB, setAthleteB] = useState<string>(() => {
    const foundAnna = athletesList.find(a => matchesAthleteName(a, 'Anna PETERS'));
    return foundAnna || athletesList[1] || athletesList[0] || 'Anna PETERS';
  });

  const [searchFilterA, setSearchFilterA] = useState<string>('');
  const [searchFilterB, setSearchFilterB] = useState<string>('');

  // -------------------------------------------------------------
  // FENÊTRES DE FILTRES : SAISON & ÉTÉ/HIVER (Demandées par l'utilisateur)
  // -------------------------------------------------------------
  const [selectedSeason, setSelectedSeason] = useState<string>('ALL'); // 'ALL' ou '2025-2026', etc.
  const [selectedStructure, setSelectedStructure] = useState<'ALL' | 'EXTERIEUR' | 'SALLE'>('ALL'); // 'ALL', 'EXTERIEUR' (Été) ou 'SALLE' (Hiver)
  const [disciplineSearch, setDisciplineSearch] = useState<string>('');
  const [displayFilter, setDisplayFilter] = useState<'ALL' | 'COMMON' | 'ADV_A' | 'ADV_B'>('ALL');

  // Synchronisation si la liste des athlètes évolue
  React.useEffect(() => {
    if (athletesList.length > 0) {
      const existsA = athletesList.some(a => matchesAthleteName(a, athleteA));
      const existsB = athletesList.some(a => matchesAthleteName(a, athleteB));

      if (!athleteA || !existsA) {
        const foundAlice = athletesList.find(a => matchesAthleteName(a, 'Alice CHANDON'));
        setAthleteA(foundAlice || athletesList[0]);
      }
      if (!athleteB || !existsB) {
        const foundAnna = athletesList.find(a => matchesAthleteName(a, 'Anna PETERS'));
        setAthleteB(foundAnna || athletesList[1] || athletesList[0]);
      }
    }
  }, [athletesList]);

  // Extraction complète de toutes les performances brutes de l'athlète A
  const allRecordsA = useMemo(() => {
    return records.filter(r => matchesAthleteName(r.athleteName, athleteA));
  }, [records, athleteA]);

  // Extraction complète de toutes les performances brutes de l'athlète B
  const allRecordsB = useMemo(() => {
    return records.filter(r => matchesAthleteName(r.athleteName, athleteB));
  }, [records, athleteB]);

  // Profils de synthèse
  const profileA = allRecordsA[0] || null;
  const profileB = allRecordsB[0] || null;

  // Filtrage selon la Saison et la Période (Été / Hiver)
  const filteredRecordsA = useMemo(() => {
    return allRecordsA.filter(r => recordMatchesPeriod(r, selectedSeason, selectedStructure));
  }, [allRecordsA, selectedSeason, selectedStructure]);

  const filteredRecordsB = useMemo(() => {
    return allRecordsB.filter(r => recordMatchesPeriod(r, selectedSeason, selectedStructure));
  }, [allRecordsB, selectedSeason, selectedStructure]);

  // Trouver le MEILLEUR record (RP) par discipline canonique pour l'athlète A
  const pbsA = useMemo(() => {
    const map = new Map<string, { record: PerformanceRecord; displayName: string }>();
    filteredRecordsA.forEach(r => {
      const { key, displayName } = canonicalizeDiscipline(r.discipline, r);
      if (!key) return;
      const existing = map.get(key);
      if (!existing || isBetterRecord(r, existing.record)) {
        map.set(key, { record: r, displayName });
      }
    });
    return map;
  }, [filteredRecordsA]);

  // Trouver le MEILLEUR record (RP) par discipline canonique pour l'athlète B
  const pbsB = useMemo(() => {
    const map = new Map<string, { record: PerformanceRecord; displayName: string }>();
    filteredRecordsB.forEach(r => {
      const { key, displayName } = canonicalizeDiscipline(r.discipline, r);
      if (!key) return;
      const existing = map.get(key);
      if (!existing || isBetterRecord(r, existing.record)) {
        map.set(key, { record: r, displayName });
      }
    });
    return map;
  }, [filteredRecordsB]);

  // Ensemble unifié des disciplines canoniques disputées par au moins l'un des deux athlètes
  const allCanonicalDisciplines = useMemo(() => {
    const map = new Map<string, string>(); // key -> displayName
    pbsA.forEach((item, key) => map.set(key, item.displayName));
    pbsB.forEach((item, key) => {
      if (!map.has(key)) map.set(key, item.displayName);
    });

    return Array.from(map.entries())
      .map(([key, displayName]) => ({ key, displayName }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr', { numeric: true, sensitivity: 'base' }));
  }, [pbsA, pbsB]);

  // Confrontation directe sur les épreuves communes et calcul du score
  let scoreA = 0;
  let scoreB = 0;
  let commonEventsCount = 0;

  const comparisonRows = useMemo(() => {
    let scA = 0;
    let scB = 0;
    let commonCount = 0;

    const rows = allCanonicalDisciplines.map(({ key, displayName }) => {
      const itemA = pbsA.get(key);
      const itemB = pbsB.get(key);
      const pbRecA = itemA?.record;
      const pbRecB = itemB?.record;

      let winner: 'A' | 'B' | 'EQUAL' | 'NONE' = 'NONE';

      if (pbRecA && pbRecB) {
        commonCount++;
        if (isBetterRecord(pbRecA, pbRecB)) {
          winner = 'A';
          scA++;
        } else if (isBetterRecord(pbRecB, pbRecA)) {
          winner = 'B';
          scB++;
        } else {
          winner = 'EQUAL';
        }
      }

      return {
        key,
        discipline: itemA?.displayName || itemB?.displayName || displayName,
        recA: pbRecA,
        recB: pbRecB,
        winner,
      };
    });

    scoreA = scA;
    scoreB = scB;
    commonEventsCount = commonCount;

    return rows;
  }, [allCanonicalDisciplines, pbsA, pbsB]);

  // Filtrage du tableau de comparaison (par recherche ou par filtre d'affichage)
  const filteredComparisonRows = useMemo(() => {
    return comparisonRows.filter(row => {
      // Filtre recherche libre
      if (disciplineSearch.trim()) {
        const q = disciplineSearch.toLowerCase().trim();
        const match = row.discipline.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Filtre de mode
      if (displayFilter === 'COMMON') {
        return row.recA && row.recB;
      }
      if (displayFilter === 'ADV_A') {
        return row.winner === 'A';
      }
      if (displayFilter === 'ADV_B') {
        return row.winner === 'B';
      }

      return true;
    });
  }, [comparisonRows, disciplineSearch, displayFilter]);

  // Athlètes filtrés pour les menus déroulants
  const filteredAthletesDropdownA = useMemo(() => {
    if (!searchFilterA.trim()) return athletesList;
    const q = searchFilterA.toLowerCase().trim();
    return athletesList.filter(a => a.toLowerCase().includes(q));
  }, [athletesList, searchFilterA]);

  const filteredAthletesDropdownB = useMemo(() => {
    if (!searchFilterB.trim()) return athletesList;
    const q = searchFilterB.toLowerCase().trim();
    return athletesList.filter(a => a.toLowerCase().includes(q));
  }, [athletesList, searchFilterB]);

  // -------------------------------------------------------------
  // GESTIONNAIRES D'EXPORTS MULTI-FORMATS
  // -------------------------------------------------------------
  const periodLabel = selectedStructure === 'ALL' 
    ? 'Été & Hiver' 
    : (selectedStructure === 'EXTERIEUR' ? 'Été (Plein air)' : 'Hiver (En salle)');
  const seasonLabel = selectedSeason === 'ALL' ? 'Toutes saisons confondues' : `Saison ${selectedSeason}`;

  const handleExportComparisonWord = () => {
    exportToWord(
      `Confrontation Comparative : ${athleteA} vs ${athleteB}`,
      `Face-à-Face direct et Records Personnels · ${seasonLabel} · ${periodLabel}`,
      [
        {
          heading: '1. Bilan Général du Duel',
          text: `Score du face-à-face sur les ${commonEventsCount} épreuves communes : ${athleteA} (${scoreA}) - (${scoreB}) ${athleteB}.${scoreA > scoreB ? ` Avantage global : ${athleteA}.` : (scoreB > scoreA ? ` Avantage global : ${athleteB}.` : ' Égalité parfaite.')}`,
        },
        {
          heading: '2. Comparaison Détaillée par Épreuve',
          tableHeaders: ['Épreuve', `RP ${athleteA}`, `Date / Lieu`, `Club ${athleteA}`, `RP ${athleteB}`, `Date / Lieu`, `Club ${athleteB}`, 'Avantage'],
          tableRows: comparisonRows.map(r => [
            r.discipline,
            r.recA ? `${r.recA.perf_formatee || r.recA.performanceDisplay}${r.recA.vent !== null && r.recA.vent !== undefined ? ` (${r.recA.vent > 0 ? `+${r.recA.vent}` : r.recA.vent})` : ''}` : 'N/A',
            r.recA ? `${r.recA.date} (${r.recA.lieu})` : '-',
            r.recA?.club || '-',
            r.recB ? `${r.recB.perf_formatee || r.recB.performanceDisplay}${r.recB.vent !== null && r.recB.vent !== undefined ? ` (${r.recB.vent > 0 ? `+${r.recB.vent}` : r.recB.vent})` : ''}` : 'N/A',
            r.recB ? `${r.recB.date} (${r.recB.lieu})` : '-',
            r.recB?.club || '-',
            r.winner === 'A' ? athleteA : (r.winner === 'B' ? athleteB : (r.winner === 'EQUAL' ? 'Égalité' : '-'))
          ]),
        }
      ],
      `Comparatif_${athleteA.replace(/\s+/g, '_')}_vs_${athleteB.replace(/\s+/g, '_')}`
    );
  };

  const handleExportComparisonExcel = () => {
    exportToExcel([...filteredRecordsA, ...filteredRecordsB], `Comparatif_${athleteA}_vs_${athleteB}`);
  };

  const handleExportComparisonPDF = () => {
    exportToPDF(
      `Comparatif : ${athleteA} vs ${athleteB} (${seasonLabel} · ${periodLabel})`,
      [...filteredRecordsA, ...filteredRecordsB],
      `Comparatif_${athleteA}_vs_${athleteB}`
    );
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSelectedSeason('ALL');
    setSelectedStructure('ALL');
    setDisciplineSearch('');
    setDisplayFilter('ALL');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. BLOC DE SÉLECTION DUO DES ATHLÈTES                         */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30 flex items-center justify-center">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Comparateur Face-à-Face
              </h2>
              <p className="text-xs text-slate-400">
                Confrontation directe des records personnels et bilans de performances
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline-block">
            {athletesList.length} athlètes répertoriés
          </span>
        </div>

        {/* Sélection des deux athlètes */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
          
          {/* ATHLÈTE A (Bleu) */}
          <div className="lg:col-span-5 bg-slate-950/80 p-4 rounded-2xl border border-sky-500/40 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                Athlète 1 (Bleu)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {allRecordsA.length} perf{allRecordsA.length > 1 ? 's' : ''} au total
              </span>
            </div>

            {/* Champ de recherche rapide */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer l'athlète 1 (ex: Chandon)..."
                value={searchFilterA}
                onChange={e => setSearchFilterA(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Menu de sélection */}
            <select
              value={athleteA}
              onChange={e => {
                setAthleteA(e.target.value);
                setSearchFilterA('');
              }}
              className="w-full bg-slate-900 border border-slate-700 hover:border-sky-500 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {filteredAthletesDropdownA.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {profileA && (
              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => onSelectAthlete(athleteA)}
                  className="truncate text-sky-400 hover:text-sky-300 hover:underline cursor-pointer font-medium"
                  title="Consulter la fiche détaillée de l'athlète"
                >
                  {profileA.club || 'Club non renseigné'}
                </button>
                <span className="text-[10px] font-mono text-slate-500">
                  {profileA.sexe} · {profileA.categorie}
                </span>
              </div>
            )}
          </div>

          {/* VS Center badge */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-950/50">
              VS
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase font-bold">Duel</span>
          </div>

          {/* ATHLÈTE B (Or) */}
          <div className="lg:col-span-5 bg-slate-950/80 p-4 rounded-2xl border border-amber-500/40 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Athlète 2 (Or)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {allRecordsB.length} perf{allRecordsB.length > 1 ? 's' : ''} au total
              </span>
            </div>

            {/* Champ de recherche rapide */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer l'athlète 2 (ex: Peters)..."
                value={searchFilterB}
                onChange={e => setSearchFilterB(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Menu de sélection */}
            <select
              value={athleteB}
              onChange={e => {
                setAthleteB(e.target.value);
                setSearchFilterB('');
              }}
              className="w-full bg-slate-900 border border-slate-700 hover:border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {filteredAthletesDropdownB.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {profileB && (
              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => onSelectAthlete(athleteB)}
                  className="truncate text-amber-400 hover:text-amber-300 hover:underline cursor-pointer font-medium"
                  title="Consulter la fiche détaillée de l'athlète"
                >
                  {profileB.club || 'Club non renseigné'}
                </button>
                <span className="text-[10px] font-mono text-slate-500">
                  {profileB.sexe} · {profileB.categorie}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. DEUX FENÊTRES DISTINCTES : CHOIX SAISON & ÉTÉ / HIVER       */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-sky-400" />
              <span>Paramètres de Filtrage Temporel & Période</span>
            </span>
            {(selectedSeason !== 'ALL' || selectedStructure !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors bg-sky-950/60 border border-sky-800/60 px-2.5 py-1 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser les filtres</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* FENÊTRE 1 : CHOIX DE LA SAISON */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-sky-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Fenêtre Saison</h3>
                    <p className="text-[10px] text-slate-400">Choix de la saison sportive</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800">
                  {selectedSeason === 'ALL' ? 'Toutes saisons (RP absolus)' : `Saison ${selectedSeason}`}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Sélectionner une saison :
                </label>
                <select
                  value={selectedSeason}
                  onChange={e => setSelectedSeason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 hover:border-sky-500 rounded-xl px-3 py-2 text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">🌟 Toutes les saisons (Historique complet des RP)</option>
                  {availableSeasons.map(s => (
                    <option key={s} value={s}>📅 Saison {s}</option>
                  ))}
                </select>
              </div>

              {/* Boutons d'accès rapide */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">Raccourcis :</span>
                <button
                  type="button"
                  onClick={() => setSelectedSeason('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                    selectedSeason === 'ALL'
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-900/50'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Toutes
                </button>
                {availableSeasons.slice(0, 4).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSeason(s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                      selectedSeason === s
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-900/50'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* FENÊTRE 2 : CHOIX ÉTÉ ET HIVER */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Fenêtre Été / Hiver</h3>
                    <p className="text-[10px] text-slate-400">Structure plein air ou en salle</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  {selectedStructure === 'ALL' ? 'Été & Hiver' : (selectedStructure === 'EXTERIEUR' ? '☀️ Été (Plein air)' : '❄️ Hiver (Salle)')}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Choisir l'environnement :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStructure('ALL')}
                    className={`p-2 rounded-xl text-center cursor-pointer transition-all border flex flex-col items-center justify-center gap-1 ${
                      selectedStructure === 'ALL'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-950/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold leading-tight">Tous</span>
                    <span className="text-[9px] text-slate-400">Été & Hiver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStructure('EXTERIEUR')}
                    className={`p-2 rounded-xl text-center cursor-pointer transition-all border flex flex-col items-center justify-center gap-1 ${
                      selectedStructure === 'EXTERIEUR'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-950/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold leading-tight">☀️ Été</span>
                    <span className="text-[9px] text-slate-400">Plein air</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStructure('SALLE')}
                    className={`p-2 rounded-xl text-center cursor-pointer transition-all border flex flex-col items-center justify-center gap-1 ${
                      selectedStructure === 'SALLE'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-950/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <Snowflake className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold leading-tight">❄️ Hiver</span>
                    <span className="text-[9px] text-slate-400">En salle</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Badges de synthèse du filtrage actif */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-medium">Bilan retenu :</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-sky-950 text-sky-300 border border-sky-800 text-[11px] font-mono">
                {athleteA} : {filteredRecordsA.length} perf{filteredRecordsA.length > 1 ? 's' : ''} ({pbsA.size} épreuve{pbsA.size > 1 ? 's' : ''})
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-mono">
                {athleteB} : {filteredRecordsB.length} perf{filteredRecordsB.length > 1 ? 's' : ''} ({pbsB.size} épreuve{pbsB.size > 1 ? 's' : ''})
              </span>
            </div>

            <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{commonEventsCount} confrontation{commonEventsCount > 1 ? 's' : ''} directe{commonEventsCount > 1 ? 's' : ''} sur épreuves communes</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. BARRE DE SCORE DU DUEL & EXPORTS                            */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Score face-à-face :</span>
            <div className="flex items-center gap-2 font-mono font-black text-xl">
              <span className="text-sky-400 px-2.5 py-0.5 rounded-lg bg-sky-950 border border-sky-800/80">
                {scoreA}
              </span>
              <span className="text-slate-600">-</span>
              <span className="text-amber-400 px-2.5 py-0.5 rounded-lg bg-amber-950 border border-amber-800/80">
                {scoreB}
              </span>
            </div>
            <span className="text-xs text-slate-300 font-medium">
              ({scoreA > scoreB ? `${athleteA} domine` : (scoreB > scoreA ? `${athleteB} domine` : 'Parfaite égalité')})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportComparisonExcel}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Exporter le comparatif détaillé sous Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportComparisonWord}
              className="px-3 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-sky-300 border border-blue-700/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Exporter le rapport d'analyse sous Word (.docx)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word</span>
            </button>
            <button
              onClick={handleExportComparisonPDF}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-700/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Exporter le comparatif officiel sous format PDF (.pdf)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. TABLEAU COMPARATIF DES ÉPREUVES                            */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base text-white">
              Comparaison Directe des Records Personnels (RP)
            </h3>
          </div>

          {/* Recherche & Filtres d'affichage rapides */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer une épreuve..."
                value={disciplineSearch}
                onChange={e => setDisciplineSearch(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-44"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setDisplayFilter('ALL')}
                className={`px-2 py-1 rounded font-semibold cursor-pointer transition-colors ${
                  displayFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Toutes ({comparisonRows.length})
              </button>
              <button
                type="button"
                onClick={() => setDisplayFilter('COMMON')}
                className={`px-2 py-1 rounded font-semibold cursor-pointer transition-colors ${
                  displayFilter === 'COMMON' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Communes ({commonEventsCount})
              </button>
              <button
                type="button"
                onClick={() => setDisplayFilter('ADV_A')}
                className={`px-2 py-1 rounded font-semibold cursor-pointer transition-colors ${
                  displayFilter === 'ADV_A' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Avantage A ({scoreA})
              </button>
              <button
                type="button"
                onClick={() => setDisplayFilter('ADV_B')}
                className={`px-2 py-1 rounded font-semibold cursor-pointer transition-colors ${
                  displayFilter === 'ADV_B' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Avantage B ({scoreB})
              </button>
            </div>
          </div>
        </div>

        {/* Liste des cartes d'épreuves */}
        {filteredComparisonRows.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs space-y-2">
            <p className="font-semibold text-slate-300 text-sm">
              Aucune performance ne correspond aux critères de comparaison sélectionnés
            </p>
            <p>
              Essayez d'élargir la période sur « Toutes les saisons » ou de sélectionner « Tous environnements (Été & Hiver) ».
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Afficher tout l'historique des records
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComparisonRows.map((row) => {
              const recA = row.recA;
              const recB = row.recB;
              const hasWindA = recA?.vent !== null && recA?.vent !== undefined;
              const hasWindB = recB?.vent !== null && recB?.vent !== undefined;

              return (
                <div 
                  key={row.key}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Libellé de l'épreuve */}
                  <div className="md:w-1/4">
                    <span className="font-bold text-sm text-white block">
                      {row.discipline}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      {recA && recB ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Épreuve commune
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          Discipline individuelle
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Performance Athlète A */}
                  <div className={`flex-1 p-3.5 rounded-xl border transition-all ${
                    row.winner === 'A' 
                      ? 'bg-sky-950/40 border-sky-500/50 text-white shadow-sm' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-sky-400 truncate max-w-[180px]">
                        {athleteA}
                      </span>
                      {row.winner === 'A' && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          AVANTAGE
                        </span>
                      )}
                      {row.winner === 'EQUAL' && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                          ÉGALITÉ
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-mono font-black text-sky-300">
                        {recA ? (recA.perf_formatee || recA.performanceDisplay) : 'Non disputé'}
                      </span>
                      {hasWindA && (
                        <span className="text-[11px] font-mono text-slate-400 font-semibold flex items-center gap-0.5" title="Vitesse du vent">
                          <Wind className="w-3 h-3 text-slate-500" />
                          {recA!.vent! > 0 ? `+${recA!.vent}` : recA!.vent}
                        </span>
                      )}
                      {recA?.isPersonalRecord && (recA.vent === null || recA.vent === undefined || recA.vent <= 2.0) && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" title="Record Personnel homologué (vent <= +2.0 m/s)">
                          RP
                        </span>
                      )}
                    </div>

                    {recA && (
                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        {recA.date} · {recA.lieu} · {recA.structure === 'SALLE' ? 'Salle' : 'Plein air'} {recA.pointsFFA ? `· ${recA.pointsFFA} pts` : ''}
                      </p>
                    )}
                  </div>

                  {/* Performance Athlète B */}
                  <div className={`flex-1 p-3.5 rounded-xl border transition-all ${
                    row.winner === 'B' 
                      ? 'bg-amber-950/40 border-amber-500/50 text-white shadow-sm' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-400 truncate max-w-[180px]">
                        {athleteB}
                      </span>
                      {row.winner === 'B' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          AVANTAGE
                        </span>
                      )}
                      {row.winner === 'EQUAL' && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                          ÉGALITÉ
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-mono font-black text-amber-300">
                        {recB ? (recB.perf_formatee || recB.performanceDisplay) : 'Non disputé'}
                      </span>
                      {hasWindB && (
                        <span className="text-[11px] font-mono text-slate-400 font-semibold flex items-center gap-0.5" title="Vitesse du vent">
                          <Wind className="w-3 h-3 text-slate-500" />
                          {recB!.vent! > 0 ? `+${recB!.vent}` : recB!.vent}
                        </span>
                      )}
                      {recB?.isPersonalRecord && (recB.vent === null || recB.vent === undefined || recB.vent <= 2.0) && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" title="Record Personnel homologué (vent <= +2.0 m/s)">
                          RP
                        </span>
                      )}
                    </div>

                    {recB && (
                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        {recB.date} · {recB.lieu} · {recB.structure === 'SALLE' ? 'Salle' : 'Plein air'} {recB.pointsFFA ? `· ${recB.pointsFFA} pts` : ''}
                      </p>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export const ComparisonView = React.memo(ComparisonViewComponent);
