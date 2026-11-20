import { PerformanceRecord } from '../types/athletics';
import { 
  formatPerformanceDisplay, 
  getDisciplineNature, 
  markPersonalRecords, 
  parsePerformanceString,
  normalizeDistanceValue,
  isIndoorRecord,
  isFFAOfficialIndoorCode,
  cleanDisciplineBaseName
} from './performanceUtils';
import { lookupOfficialCodeEp } from '../data/officialDisciplines';

// En-têtes officiels FFA Logica (27 colonnes)
export const FFA_LOGICA_HEADERS = [
  'num_compet',
  'date_compet',
  'nom_compet',
  'dpt_compet',
  'lieu_compet',
  'ep_logica',
  'code_ep',
  'nom_ep',
  'perf_formatee',
  'perf_num',
  'perf_ajustee',
  'type_chrono',
  'niveau',
  'points',
  'type_vent',
  'vent',
  'nom_ath',
  'prenom_ath',
  'nat_ath',
  'cat',
  'sexe',
  'annee_nais',
  'licence',
  'num_club',
  'nom_club',
  'dpt_club',
  'lig_club'
] as const;

export interface CSVParseResult {
  records: PerformanceRecord[];
  errors: string[];
  totalRows: number;
  detectedColumns: string[];
  delimiterUsed: string;
  headerRowIndex: number;
  hasNoHeader: boolean;
  athleteCount?: number;
  disciplineCount?: number;
  clubCount?: number;
}

export interface ColumnMapping {
  athlete: number; // nom_ath ou nom complet
  athletePrenom?: number; // prenom_ath
  discipline: number; // nom_ep
  performance: number; // perf_formatee
  performanceNum?: number; // perf_num
  vent: number; // vent
  date: number; // date_compet
  saison: number;
  lieu: number; // lieu_compet
  club: number; // nom_club
  departement: number; // dpt_club
  region: number; // lig_club
  entraineur: number;
  niveau: number; // niveau
  points: number; // points
  sexe: number; // sexe
  categorie: number; // cat
  code_ep?: number; // code_ep (colonne G FFA Logica)
  nationalite?: number; // nat_ath (colonne S FFA Logica)
  annee_nais?: number; // annee_nais (colonne V FFA Logica)
  licence?: number; // licence (colonne W FFA Logica)
  perf_ajustee?: number; // Colonne K "perf_ajustee" (FFA Logica)
  perf_formatee?: number; // Colonne I "perf_formatee" (FFA Logica)
  nom_compet?: number; // Colonne C "nom_compet" (FFA Logica)
  num_compet?: number; // Colonne A "num_compet" (FFA Logica)
  dpt_compet?: number; // Colonne D "dpt_compet" (FFA Logica)
  ep_logica?: number; // Colonne F "ep_logica" (FFA Logica)
  defaultDiscipline?: string;
  defaultSaison?: number;
  hasNoHeader?: boolean;
}

// Détection du délimiteur le plus probable (\t, ;, ,)
export function detectDelimiter(text: string, force?: string): string {
  if (force && (force === '\t' || force === ';' || force === ',')) {
    return force;
  }
  const sampleLines = text.split(/\r?\n/).slice(0, 15).join('\n');
  const countTab = (sampleLines.match(/\t/g) || []).length;
  const countSemicolon = (sampleLines.match(/;/g) || []).length;
  const countComma = (sampleLines.match(/,/g) || []).length;

  if (countTab >= countSemicolon && countTab >= countComma && countTab > 0) return '\t';
  if (countSemicolon > countComma && countSemicolon > 0) return ';';
  if (countComma > 0) return ',';
  return countTab > 0 ? '\t' : ';';
}

// Parse une ligne en gérant les guillemets et séparateurs (norme CSV : seuls les guillemets doubles " délimitent les champs, pas les apostrophes ')
export function parseCSVLine(line: string, delimiter: string): string[] {
  // Chemin ultra-rapide pour 99% des lignes sans guillemets
  if (!line.includes('"')) {
    return line.split(delimiter).map(s => s.trim());
  }

  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Normalise une chaîne pour matching souple
export function normalizeHeader(h: string): string {
  return h.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Vérifie si une ligne contient des en-têtes FFA Logica
export function isFFALogicaHeaderLine(lineCols: string[]): boolean {
  const norm = lineCols.map(normalizeHeader);
  return norm.includes('numcompet') || norm.includes('perfformatee') || norm.includes('nomath');
}

// Configuration officielle FFA Logica (27 colonnes)
export function getFFALogicaMapping(hasNoHeader = false): ColumnMapping {
  return {
    athlete: 16, // nom_ath
    athletePrenom: 17, // prenom_ath
    discipline: 7, // nom_ep
    performance: 8, // perf_formatee
    performanceNum: 9, // perf_num
    vent: 15, // vent
    date: 1, // date_compet
    saison: -1, // déduit automatiquement
    lieu: 4, // lieu_compet
    club: 24, // nom_club
    departement: 25, // dpt_club
    region: 26, // lig_club
    entraineur: -1,
    niveau: 12, // niveau
    points: 13, // points
    sexe: 20, // sexe (colonne U)
    categorie: 19, // cat (colonne T)
    code_ep: 6, // code_ep (colonne G, ex: 105 pour 50m salle)
    perf_formatee: 8, // perf_formatee (colonne I)
    perf_ajustee: 10, // perf_ajustee (colonne K)
    nationalite: 18, // nat_ath (colonne S)
    annee_nais: 21, // annee_nais (colonne V)
    licence: 22, // licence (colonne W)
    nom_compet: 2, // nom_compet (colonne C)
    num_compet: 0, // num_compet (colonne A)
    dpt_compet: 3, // dpt_compet (colonne D)
    ep_logica: 5, // ep_logica (colonne F)
    defaultDiscipline: '100m',
    hasNoHeader,
  };
}

// Détection intelligente de la présence ou de l'absence d'en-tête
export function findHeaderRow(
  lines: string[], 
  delimiter: string
): { headerIndex: number; headers: string[]; hasNoHeader: boolean; isFFALogica: boolean } {
  if (lines.length === 0) {
    return { headerIndex: 0, headers: [], hasNoHeader: false, isFFALogica: false };
  }

  const firstCols = parseCSVLine(lines[0], delimiter);

  // 1. Cas où la 1ère ligne est explicitement l'en-tête FFA Logica
  if (isFFALogicaHeaderLine(firstCols)) {
    return {
      headerIndex: 0,
      headers: firstCols,
      hasNoHeader: false,
      isFFALogica: true,
    };
  }

  // 2. Recherche d'un en-tête FFA sur les premières lignes
  const maxScan = Math.min(lines.length, 10);
  for (let i = 0; i < maxScan; i++) {
    const cols = parseCSVLine(lines[i], delimiter);
    if (isFFALogicaHeaderLine(cols)) {
      return {
        headerIndex: i,
        headers: cols,
        hasNoHeader: false,
        isFFALogica: true,
      };
    }
  }

  // 3. Fichier .txt ou sans en-tête avec les 27 colonnes FFA Logica
  // Si la 1ère ligne a 26, 27 ou 28 colonnes et n'est pas un texte d'en-tête
  if (firstCols.length >= 25 && firstCols.length <= 29) {
    return {
      headerIndex: -1,
      headers: [...FFA_LOGICA_HEADERS],
      hasNoHeader: true,
      isFFALogica: true,
    };
  }

  // 4. Recherche générale pour tout autre type de fichier avec en-têtes
  const keyWords = [
    'nom', 'athlete', 'participant', 'perf', 'temps', 'distance', 
    'epreuve', 'discipline', 'club', 'date', 'vent', 'cat', 'sexe', 'pts'
  ];

  let bestIndex = 0;
  let maxScore = 0;
  let bestHeaders = firstCols;

  for (let i = 0; i < maxScan; i++) {
    const cols = parseCSVLine(lines[i], delimiter);
    if (cols.length < 2) continue;
    let score = 0;
    cols.forEach(c => {
      const n = normalizeHeader(c);
      if (keyWords.some(k => n.includes(k))) score++;
    });
    if (score > maxScore) {
      maxScore = score;
      bestIndex = i;
      bestHeaders = cols;
    }
  }

  const hasHeadersDetected = maxScore >= 2;

  return {
    headerIndex: hasHeadersDetected ? bestIndex : -1,
    headers: hasHeadersDetected ? bestHeaders : [...FFA_LOGICA_HEADERS],
    hasNoHeader: !hasHeadersDetected,
    isFFALogica: !hasHeadersDetected && firstCols.length >= 25,
  };
}

// Détection du mapping automatique à partir des en-têtes
export function detectColumnMapping(headers: string[], hasNoHeader = false): ColumnMapping {
  // Si le fichier est au format officiel FFA Logica (ou sans en-tête 27 colonnes)
  const norm = headers.map(normalizeHeader);
  if (
    hasNoHeader || 
    norm.includes('numcompet') || 
    norm.includes('perfformatee') || 
    norm.includes('nomath') || 
    headers.length === 27
  ) {
    return getFFALogicaMapping(hasNoHeader);
  }

  const findCol = (keywords: string[]): number => {
    return norm.findIndex(h => keywords.some(k => h.includes(k)));
  };

  return {
    athlete: findCol(['nomath', 'athlete', 'nomprenom', 'participant', 'identite', 'nom']),
    athletePrenom: findCol(['prenomath', 'prenom']),
    discipline: findCol(['nomep', 'codeep', 'epreuve', 'discipline', 'event', 'course', 'concours']),
    performance: findCol(['perfformatee', 'perf', 'temps', 'distance', 'marque', 'resultat', 'chrono']),
    performanceNum: findCol(['perfnum', 'valeur']),
    vent: findCol(['vent', 'wind']),
    date: findCol(['datecompet', 'date', 'jour']),
    saison: findCol(['saison', 'annee', 'season', 'year']),
    lieu: findCol(['lieucompet', 'lieu', 'ville', 'stade', 'place']),
    club: findCol(['nomclub', 'club', 'structure', 'equipe', 'association', 'assoc']),
    departement: findCol(['dptclub', 'dptcompet', 'dep', 'departement', 'dept', 'cp']),
    region: findCol(['ligclub', 'region', 'ligue', 'comite']),
    entraineur: findCol(['entraineur', 'coach']),
    niveau: findCol(['niveau', 'cotation', 'table', 'bareme']),
    points: findCol(['point', 'points', 'pts']),
    sexe: findCol(['sexe', 'genre', 'sx']),
    categorie: findCol(['cat', 'categorie']),
    code_ep: findCol(['codeep', 'code_ep']),
    perf_formatee: findCol(['perfformatee', 'perf_formatee', 'formatee']),
    perf_ajustee: findCol(['perfajustee', 'perf_ajustee', 'ajustee']),
    nationalite: findCol(['natath', 'nat', 'nationalite', 'pays']),
    annee_nais: findCol(['anneenais', 'annee', 'naiss', 'naissance', 'birthyear']),
    licence: findCol(['licence', 'numlicence', 'lic']),
    nom_compet: findCol(['nomcompet', 'nom_compet', 'competition', 'tournoi', 'chpt', 'championnat']),
    num_compet: findCol(['numcompet', 'num_compet']),
    dpt_compet: findCol(['dptcompet', 'dpt_compet']),
    ep_logica: findCol(['eplogica', 'ep_logica', 'tour', 'serie', 'finale']),
    defaultDiscipline: '100m',
    hasNoHeader,
  };
}

// Normalisation des sigles de ligues régionales FFA en noms complets
export function normalizeFFARegion(rawRegion: string): string {
  if (!rawRegion) return 'National';
  const r = rawRegion.trim().toUpperCase();

  const REGION_MAP: Record<string, string> = {
    'I-F': 'Île-de-France',
    'IDF': 'Île-de-France',
    'ARA': 'Auvergne-Rhône-Alpes',
    'AURA': 'Auvergne-Rhône-Alpes',
    'HDF': 'Hauts-de-France',
    'PCA': "Provence-Alpes-Côte d'Azur",
    'PACA': "Provence-Alpes-Côte d'Azur",
    'NAQ': 'Nouvelle-Aquitaine',
    'N-A': 'Nouvelle-Aquitaine',
    'OCC': 'Occitanie',
    'BRE': 'Bretagne',
    'CEN': 'Centre-Val de Loire',
    'NOR': 'Normandie',
    'G-E': 'Grand Est',
    'GES': 'Grand Est',
    'BFC': 'Bourgogne-Franche-Comté',
    'P-L': 'Pays de la Loire',
    'COR': 'Corse',
    'GUA': 'Guadeloupe',
    'MAR': 'Martinique',
    'REU': 'La Réunion',
    'GUY': 'Guyane',
    'MAY': 'Mayotte'
  };

  return REGION_MAP[r] || rawRegion.trim();
}

// Parseur de date française (JJ/MM/AAAA, JJ-MM-AAAA, AAAA-MM-JJ)
export function parseFrenchDate(raw: string): { isoDate: string; saison: number } {
  const currentYear = new Date().getFullYear();
  if (!raw || !raw.trim()) {
    return { isoDate: new Date().toISOString().split('T')[0], saison: currentYear };
  }

  const clean = raw.trim();

  // JJ/MM/AAAA ou JJ.MM.AAAA ou JJ-MM-AAAA
  const dmyMatch = clean.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const dStr = day < 10 ? `0${day}` : `${day}`;
    const mStr = month < 10 ? `0${month}` : `${month}`;
    const iso = `${year}-${mStr}-${dStr}`;
    const saison = month >= 9 ? year + 1 : year;
    return { isoDate: iso, saison };
  }

  // Format ISO AAAA-MM-JJ
  const isoMatch = clean.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const dStr = day < 10 ? `0${day}` : `${day}`;
    const mStr = month < 10 ? `0${month}` : `${month}`;
    const saison = month >= 9 ? year + 1 : year;
    return { isoDate: `${year}-${mStr}-${dStr}`, saison };
  }

  // Année seule
  const yearMatch = clean.match(/(19\d\d|20\d\d)/);
  if (yearMatch) {
    const yr = parseInt(yearMatch[1], 10);
    return { isoDate: `${yr}-06-15`, saison: yr };
  }

  return { isoDate: new Date().toISOString().split('T')[0], saison: currentYear };
}

// Nettoyage et normalisation des disciplines (enlève les suffixes 'salle', 'piste', tours/concours Logica "/ 2e", etc.)
export function cleanDisciplineName(rawDisc: string): { cleanName: string; isSalle: boolean } {
  if (!rawDisc) return { cleanName: '100m', isSalle: false };
  let trimmed = rawDisc.trim();
  const lower = trimmed.toLowerCase();
  const isSalle = 
    lower.includes('salle') || 
    lower.includes('indoor') || 
    lower === '60m' || 
    lower === '60m haies';

  // 1. Supprimer les mentions de manche, tour, concours après un slash (ex: "Hauteur / 2e", "Hauteur/ 2e", "Poids / 1er")
  if (trimmed.includes('/')) {
    trimmed = trimmed.split('/')[0].trim();
  }

  // 2. Supprimer les mentions de structure du libellé de l'épreuve
  let cleaned = trimmed
    .replace(/\s*[-–(]?\s*(salle|indoor)\s*\)?/gi, '')
    .replace(/\s*[-–(]?\s*(piste|extérieur|exterieur|outdoor)\s*\)?/gi, '')
    .replace(/\s*-\s*\d+$/g, '')
    .trim();

  if (!cleaned) cleaned = rawDisc.trim();
  return { cleanName: cleaned, isSalle };
}

// Analyse asynchrone par flux sans duplication de mémoire pour fichiers très volumineux (jusqu'à 500 000+ lignes)
export async function parseAthleticsFileAsync(
  text: string,
  options?: {
    delimiter?: string;
    mapping?: Partial<ColumnMapping>;
    defaultDiscipline?: string;
    hasNoHeader?: boolean;
    sourceFileName?: string;
    targetStructure?: 'EXTERIEUR' | 'SALLE' | 'COMBINE';
    targetSeason?: number;
    targetSeasonLabel?: string;
    onProgress?: (processed: number, total: number, percent: number) => void;
  }
): Promise<CSVParseResult> {
  const textLen = text ? text.length : 0;
  if (!text || textLen === 0) {
    return {
      records: [],
      errors: ['Le fichier est vide.'],
      totalRows: 0,
      detectedColumns: [],
      delimiterUsed: '\t',
      headerRowIndex: 0,
      hasNoHeader: false,
      athleteCount: 0,
      disciplineCount: 0,
      clubCount: 0,
    };
  }

  // 1. Extraire un échantillon des 35 premières lignes SANS faire de text.split() complet
  const sampleLines: string[] = [];
  let sampleScanPos = 0;
  while (sampleLines.length < 35 && sampleScanPos < textLen) {
    let nextNl = text.indexOf('\n', sampleScanPos);
    if (nextNl === -1) nextNl = textLen;
    let line = text.slice(sampleScanPos, nextNl);
    if (line.endsWith('\r')) line = line.slice(0, -1);
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      sampleLines.push(trimmed);
    }
    sampleScanPos = nextNl + 1;
  }

  if (sampleLines.length === 0) {
    return {
      records: [],
      errors: ['Le fichier ne contient aucune ligne de données.'],
      totalRows: 0,
      detectedColumns: [],
      delimiterUsed: '\t',
      headerRowIndex: 0,
      hasNoHeader: false,
      athleteCount: 0,
      disciplineCount: 0,
      clubCount: 0,
    };
  }

  const delimiter = options?.delimiter || detectDelimiter(sampleLines.join('\n'));
  const headerInfo = findHeaderRow(sampleLines, delimiter);

  const hasNoHeader = options?.hasNoHeader !== undefined 
    ? options.hasNoHeader 
    : (options?.mapping?.hasNoHeader !== undefined ? options.mapping.hasNoHeader : headerInfo.hasNoHeader);

  const headers = hasNoHeader ? [...FFA_LOGICA_HEADERS] : headerInfo.headers;
  const autoMap = detectColumnMapping(headers, hasNoHeader);

  const map: ColumnMapping = {
    ...autoMap,
    ...(options?.mapping || {}),
    hasNoHeader,
  };

  const defaultDisc = options?.defaultDiscipline || map.defaultDiscipline || '100m';
  const headerIndexInFile = hasNoHeader ? -1 : headerInfo.headerIndex;

  // 2. Estimation rapide du nombre total de lignes sans allouer de tableau
  let estimatedTotalRows = 0;
  let countPos = 0;
  while (countPos < textLen) {
    const idx = text.indexOf('\n', countPos);
    estimatedTotalRows++;
    if (idx === -1) break;
    countPos = idx + 1;
  }
  const totalDataRows = hasNoHeader ? estimatedTotalRows : Math.max(0, estimatedTotalRows - (headerIndexInFile + 1));

  const parsedRecords: PerformanceRecord[] = [];
  const errors: string[] = [];
  const athletesSet = new Set<string>();
  const disciplinesSet = new Set<string>();
  const clubsSet = new Set<string>();

  let cursor = 0;
  let lineIdx = 0;
  let parsedCount = 0;
  const YIELD_EVERY = 3000;
  const idPrefix = `rec-${Date.now()}`;

  while (cursor < textLen) {
    let nextNl = text.indexOf('\n', cursor);
    if (nextNl === -1) nextNl = textLen;
    let rawLine = text.slice(cursor, nextNl);
    cursor = nextNl + 1;

    if (rawLine.endsWith('\r')) {
      rawLine = rawLine.slice(0, -1);
    }

    const currentLineNumber = lineIdx++;
    // Sauter la ligne d'en-tête
    if (!hasNoHeader && currentLineNumber <= headerIndexInFile) {
      continue;
    }

    if (!rawLine.trim()) continue;

    parsedCount++;
    if (parsedCount % YIELD_EVERY === 0) {
      if (options?.onProgress) {
        const percent = Math.min(99, Math.round((cursor / textLen) * 100));
        options.onProgress(parsedCount, totalDataRows, percent);
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const cols = parseCSVLine(rawLine, delimiter);

    // 1. Nom & Prénom
    let athleteName = '';
    if (map.athlete !== -1 && map.athletePrenom !== undefined && map.athletePrenom !== -1) {
      const nom = cols[map.athlete] ? cols[map.athlete].trim() : '';
      const prenom = cols[map.athletePrenom] ? cols[map.athletePrenom].trim() : '';
      if (prenom && nom) {
        athleteName = `${prenom} ${nom.toUpperCase()}`;
      } else {
        athleteName = nom || prenom || `Athlète ${parsedCount}`;
      }
    } else if (map.athlete !== -1 && cols[map.athlete]) {
      athleteName = cols[map.athlete].trim();
    } else {
      athleteName = `Athlète ${parsedCount}`;
    }

    // 2. Discipline (normalisée sans suffixes salle/piste)
    let rawDisc = defaultDisc;
    if (map.discipline !== -1 && cols[map.discipline] && cols[map.discipline].trim()) {
      rawDisc = cols[map.discipline].trim();
    }
    const discInfo = cleanDisciplineName(rawDisc);
    const discipline = discInfo.cleanName;

    // 3. Performance formatée (colonne I "perf_formatee") & Performance brute
    let perfFormateeRaw = '';
    if (map.perf_formatee !== undefined && map.perf_formatee !== -1 && cols[map.perf_formatee]) {
      perfFormateeRaw = cols[map.perf_formatee].trim();
    } else if (map.performance !== -1 && cols[map.performance]) {
      perfFormateeRaw = cols[map.performance].trim();
    }

    let perfRaw = perfFormateeRaw;
    if (!perfRaw && map.performanceNum !== undefined && map.performanceNum !== -1 && cols[map.performanceNum]) {
      perfRaw = cols[map.performanceNum].trim();
    }

    // Extraction de la performance ajustée (colonne K "perf_ajustee")
    let parsedPerfAjustee: number | undefined = undefined;
    if (map.perf_ajustee !== undefined && map.perf_ajustee !== -1 && cols[map.perf_ajustee]) {
      const rawAjustee = cols[map.perf_ajustee].trim().replace(',', '.');
      const numAjustee = parseFloat(rawAjustee);
      if (!isNaN(numAjustee)) {
        parsedPerfAjustee = numAjustee;
      }
    }

    if (!perfRaw || perfRaw === '-' || perfRaw.toLowerCase() === 'dns' || perfRaw.toLowerCase() === 'dnf' || perfRaw.toLowerCase() === 'dq') {
      continue;
    }

    const nature = getDisciplineNature(discipline);
    let perfValue = parsePerformanceString(perfRaw, nature);

    // Si échec avec perf_formatee, tester perf_num
    if (perfValue <= 0 && map.performanceNum !== undefined && map.performanceNum !== -1 && cols[map.performanceNum]) {
      const altPerf = cols[map.performanceNum].trim();
      perfValue = parsePerformanceString(altPerf, nature);
      if (perfValue > 0) perfRaw = altPerf;
    }

    // Si perfValue est toujours <= 0 mais que perf_ajustee est présent (ex: lancers/sauts négatifs -192)
    if (perfValue <= 0 && parsedPerfAjustee !== undefined) {
      perfValue = Math.abs(parsedPerfAjustee);
    }

    if (nature === 'distance') {
      perfValue = normalizeDistanceValue(perfValue, discipline);
    }

    if (perfValue <= 0) {
      if (errors.length < 20) {
        errors.push(`Ligne ${currentLineNumber + 1}: Performance non reconnue "${perfRaw}" pour ${athleteName}`);
      }
      continue;
    }

    // Si perf_ajustee n'était pas présent, le synthétiser
    if (parsedPerfAjustee === undefined) {
      if (nature === 'time') {
        parsedPerfAjustee = perfValue;
      } else if (nature === 'distance') {
        parsedPerfAjustee = -Math.round(perfValue * 100);
      } else {
        parsedPerfAjustee = -Math.round(perfValue);
      }
    }

    // 4. Date & Saison officielle
    const rawDate = map.date !== -1 && cols[map.date] ? cols[map.date] : '';
    const { isoDate, saison: dateSaison } = parseFrenchDate(rawDate);

    // Règle sportive fédérale : Si la ligne contient une vraie date de compétition,
    // c'est cette date qui détermine infailliblement la saison sportive (01/09 au 31/08).
    let finalSaison: number;
    if (rawDate && rawDate.trim().length >= 4 && dateSaison > 1950 && dateSaison < 2050) {
      finalSaison = dateSaison;
    } else if (options?.targetSeason) {
      finalSaison = options.targetSeason;
    } else if (map.saison !== -1 && cols[map.saison]) {
      const parsedS = parseInt(cols[map.saison].replace(/[^0-9]/g, ''), 10);
      finalSaison = (!isNaN(parsedS) && parsedS > 1980 && parsedS < 2050) ? parsedS : dateSaison;
    } else {
      finalSaison = dateSaison;
    }

    // 5. Vent
    let ventVal: number | null = null;
    if (map.vent !== -1 && cols[map.vent]) {
      const vNum = parseFloat(cols[map.vent].replace(',', '.'));
      if (!isNaN(vNum)) ventVal = vNum;
    }

    // 6. Catégorie & Sexe
    const rawCat = map.categorie !== -1 && cols[map.categorie] ? cols[map.categorie].trim().toUpperCase() : 'SEM';

    let finalSexe: 'M' | 'F' = 'M';
    if (map.sexe !== -1 && cols[map.sexe]) {
      const s = cols[map.sexe].trim().toUpperCase();
      if (s.startsWith('F') || s === 'FEMME' || s === 'FEMININ') finalSexe = 'F';
    } else {
      if (rawCat.endsWith('F') || discipline.toLowerCase().includes('fem') || discipline.toLowerCase().includes('(f)')) {
        finalSexe = 'F';
      }
    }

    // 7. Région / Ligue
    const rawRegion = map.region !== -1 && cols[map.region] ? cols[map.region] : 'National';
    const normalizedRegion = normalizeFFARegion(rawRegion);

    // 8. Points FFA
    let pointsFFA = 800;
    if (map.points !== -1 && cols[map.points]) {
      const pts = parseInt(cols[map.points].replace(/[^0-9]/g, ''), 10);
      if (!isNaN(pts)) pointsFFA = pts;
    }

    // 8bis. Code épreuve officiel (colonne G "code_ep", ex: 110 pour 100m, 105 pour 50m salle)
    const rawCodeEp = (map.code_ep !== undefined && map.code_ep !== -1 && cols[map.code_ep])
      ? cols[map.code_ep].trim()
      : (cols[6] && /^\d+$/.test(cols[6].trim()) ? cols[6].trim() : undefined);
    const cleanCodeEp = rawCodeEp ? rawCodeEp.replace(/^0+/, '') : undefined;

    // 9. Structure (En Salle vs Plein Air vs Plein air + salle)
    const isIndoorFromRecord = isIndoorRecord(
      rawDisc || discipline,
      cleanCodeEp || rawCodeEp,
      undefined,
      options?.sourceFileName,
      map.lieu !== -1 && cols[map.lieu] ? cols[map.lieu] : '',
      cols[2] || '',
      cols[5] || ''
    );

    // Épreuves strictement de plein air (ex: 100m code 110, disque 616, etc.)
    const isOutdoorOnlyCode = cleanCodeEp === '110' || cleanCodeEp === '104' || cleanCodeEp === '108' || cleanCodeEp === '112' || 
                              cleanCodeEp === '616' || cleanCodeEp === '633' || cleanCodeEp === '650' || cleanCodeEp === '660' || 
                              cleanCodeEp === '760' || cleanCodeEp === '770' || cleanCodeEp === '340';
    const discLower = (rawDisc || discipline).toLowerCase();
    const isOutdoorOnlyDisc = discLower === '100m' || discLower === '80m' || discLower === '120m' || 
                              discLower.includes('disque') || discLower.includes('marteau') || 
                              discLower.includes('javelot') || discLower.includes('steeple') || 
                              discLower.includes('décathlon') || discLower.includes('decathlon');

    let detectedStructure: 'EXTERIEUR' | 'SALLE';
    if (isIndoorFromRecord && !isOutdoorOnlyCode && !isOutdoorOnlyDisc) {
      detectedStructure = 'SALLE';
    } else if (isOutdoorOnlyCode || isOutdoorOnlyDisc) {
      detectedStructure = 'EXTERIEUR';
    } else if (options?.targetStructure === 'SALLE') {
      detectedStructure = 'SALLE';
    } else if (options?.targetStructure === 'EXTERIEUR') {
      detectedStructure = 'EXTERIEUR';
    } else {
      detectedStructure = isIndoorFromRecord ? 'SALLE' : 'EXTERIEUR';
    }

    const athleteId = 'ath-' + athleteName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24);
    const computedSeasonLabel = `${finalSaison - 1}-${finalSaison}`;
    const clubName = map.club !== -1 && cols[map.club] ? cols[map.club].trim() : 'Club Indépendant';

    // Suivi des entités uniques pour les statistiques sans recalcul JSX lourd
    athletesSet.add(athleteName.toLowerCase().trim());
    disciplinesSet.add(discipline);
    clubsSet.add(clubName);

    parsedRecords.push({
      id: `${idPrefix}-${parsedCount}`,
      athleteId,
      athleteName,
      sexe: finalSexe,
      categorie: (rawCat as any) || 'SEM',
      discipline,
      nature,
      performanceValue: perfValue,
      performanceDisplay: perfFormateeRaw || formatPerformanceDisplay(perfValue, nature),
      perf_formatee: perfFormateeRaw,
      perf_ajustee: parsedPerfAjustee,
      vent: ventVal,
      structure: detectedStructure,
      date: isoDate,
      saison: finalSaison,
      saisonLabel: computedSeasonLabel,
      lieu: map.lieu !== -1 && cols[map.lieu] ? cols[map.lieu].trim() : 'France',
      club: clubName,
      departement: map.departement !== -1 && cols[map.departement] ? cols[map.departement].trim() : '75',
      region: normalizedRegion,
      entraineur: map.entraineur !== -1 && cols[map.entraineur] ? cols[map.entraineur].trim() : 'Non renseigné',
      niveau: map.niveau !== -1 && cols[map.niveau] ? cols[map.niveau].trim().toUpperCase() : 'IR1',
      pointsFFA,
      code_ep: rawCodeEp,
      nationalite: (map.nationalite !== undefined && map.nationalite !== -1 && cols[map.nationalite]) 
        ? cols[map.nationalite].trim().toUpperCase() 
        : (cols[18] && cols[18].trim().length >= 2 ? cols[18].trim().toUpperCase() : 'FRA'),
      annee_nais: (map.annee_nais !== undefined && map.annee_nais !== -1 && cols[map.annee_nais]) 
        ? cols[map.annee_nais].trim() 
        : (cols[21] && /^\d{4}$/.test(cols[21].trim()) ? cols[21].trim() : undefined),
      licence: (map.licence !== undefined && map.licence !== -1 && cols[map.licence]) 
        ? cols[map.licence].trim() 
        : (cols[22] ? cols[22].trim() : undefined),
      sourceFile: options?.sourceFileName || (detectedStructure === 'SALLE' ? 'Rslts salle.csv' : 'Rslts piste.csv'),
      nom_compet: (map.nom_compet !== undefined && map.nom_compet !== -1 && cols[map.nom_compet]) 
        ? cols[map.nom_compet].trim() 
        : (cols[2] ? cols[2].trim() : undefined),
      num_compet: (map.num_compet !== undefined && map.num_compet !== -1 && cols[map.num_compet]) 
        ? cols[map.num_compet].trim() 
        : (cols[0] ? cols[0].trim() : undefined),
      dpt_compet: (map.dpt_compet !== undefined && map.dpt_compet !== -1 && cols[map.dpt_compet]) 
        ? cols[map.dpt_compet].trim() 
        : (cols[3] ? cols[3].trim() : undefined),
      ep_logica: (map.ep_logica !== undefined && map.ep_logica !== -1 && cols[map.ep_logica]) 
        ? cols[map.ep_logica].trim() 
        : (cols[5] ? cols[5].trim() : undefined),
    });
  }

  if (options?.onProgress) {
    options.onProgress(parsedCount, totalDataRows, 100);
  }

  const enriched = markPersonalRecords(parsedRecords);

  return {
    records: enriched,
    errors,
    totalRows: parsedCount,
    detectedColumns: headers,
    delimiterUsed: delimiter,
    headerRowIndex: hasNoHeader ? -1 : headerIndexInFile,
    hasNoHeader,
    athleteCount: athletesSet.size,
    disciplineCount: disciplinesSet.size,
    clubCount: clubsSet.size,
  };
}

// Fonction synchrone pour compatibilité
export function parseAthleticsCSV(csvText: string): CSVParseResult {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  const delimiter = detectDelimiter(csvText);
  const headerInfo = findHeaderRow(lines, delimiter);
  const map = detectColumnMapping(headerInfo.headers, headerInfo.hasNoHeader);

  const dataStart = headerInfo.hasNoHeader ? 0 : headerInfo.headerIndex + 1;
  const parsedRecords: PerformanceRecord[] = [];

  for (let r = dataStart; r < lines.length; r++) {
    const rawLine = lines[r];
    if (!rawLine.trim()) continue;
    const cols = parseCSVLine(rawLine, delimiter);

    let athleteName = '';
    if (map.athlete !== -1 && map.athletePrenom !== undefined && map.athletePrenom !== -1) {
      const nom = cols[map.athlete] ? cols[map.athlete].trim() : '';
      const prenom = cols[map.athletePrenom] ? cols[map.athletePrenom].trim() : '';
      athleteName = prenom && nom ? `${prenom} ${nom.toUpperCase()}` : (nom || prenom || `Athlète ${r + 1}`);
    } else {
      athleteName = map.athlete !== -1 && cols[map.athlete] ? cols[map.athlete].trim() : `Athlète ${r + 1}`;
    }

    const rawDisc = map.discipline !== -1 && cols[map.discipline] ? cols[map.discipline].trim() : '100m';
    const discInfo = cleanDisciplineName(rawDisc);
    const discipline = discInfo.cleanName;
    const perfRaw = map.performance !== -1 && cols[map.performance] ? cols[map.performance].trim() : '';
    if (!perfRaw) continue;

    const nature = getDisciplineNature(discipline);
    const perfValue = parsePerformanceString(perfRaw, nature);
    if (perfValue <= 0) continue;

    const { isoDate, saison } = parseFrenchDate(map.date !== -1 && cols[map.date] ? cols[map.date] : '');

    let ventVal: number | null = null;
    if (map.vent !== -1 && cols[map.vent]) {
      const v = parseFloat(cols[map.vent].replace(',', '.'));
      if (!isNaN(v)) ventVal = v;
    }

    let detectedStructure: 'EXTERIEUR' | 'SALLE' = 'EXTERIEUR';
    const discLower = (rawDisc || discipline).toLowerCase();
    const lieuLower = (map.lieu !== -1 && cols[map.lieu] ? cols[map.lieu] : '').toLowerCase();
    if (
      discInfo.isSalle ||
      discLower === '60m' || 
      discLower === '60m haies' || 
      discLower.includes('salle') || 
      discLower.includes('indoor') ||
      lieuLower.includes('salle') || 
      lieuLower.includes('indoor')
    ) {
      detectedStructure = 'SALLE';
    }

    // Extraction code_ep officiel (colonne G)
    const rawCodeEp = (map.code_ep !== undefined && map.code_ep !== -1 && cols[map.code_ep])
      ? cols[map.code_ep].trim()
      : (cols[6] && /^\d+$/.test(cols[6].trim()) ? cols[6].trim() : undefined);

    if (rawCodeEp === '105' || rawCodeEp === '106' || rawCodeEp === '322' || rawCodeEp === '116' || rawCodeEp === '742' || rawCodeEp === '798') {
      detectedStructure = 'SALLE';
    }

    parsedRecords.push({
      id: `csv-${Date.now()}-${r}`,
      athleteId: 'ath-' + athleteName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24),
      athleteName,
      sexe: map.sexe !== -1 && cols[map.sexe] && cols[map.sexe].toUpperCase().startsWith('F') ? 'F' : 'M',
      categorie: (map.categorie !== -1 && cols[map.categorie] ? (cols[map.categorie].toUpperCase() as any) : 'SEM'),
      discipline,
      nature,
      performanceValue: perfValue,
      performanceDisplay: formatPerformanceDisplay(perfValue, nature),
      vent: ventVal,
      structure: detectedStructure,
      date: isoDate,
      saison,
      lieu: map.lieu !== -1 && cols[map.lieu] ? cols[map.lieu] : 'France',
      club: map.club !== -1 && cols[map.club] ? cols[map.club] : 'Club Indépendant',
      departement: map.departement !== -1 && cols[map.departement] ? cols[map.departement] : '75',
      region: normalizeFFARegion(map.region !== -1 && cols[map.region] ? cols[map.region] : 'National'),
      entraineur: map.entraineur !== -1 && cols[map.entraineur] ? cols[map.entraineur] : 'Non renseigné',
      niveau: map.niveau !== -1 && cols[map.niveau] ? cols[map.niveau].toUpperCase() : 'IR1',
      pointsFFA: map.points !== -1 && cols[map.points] ? parseInt(cols[map.points], 10) || 800 : 800,
      code_ep: rawCodeEp,
      nationalite: (map.nationalite !== undefined && map.nationalite !== -1 && cols[map.nationalite])
        ? cols[map.nationalite].trim().toUpperCase()
        : (cols[18] && cols[18].trim().length >= 2 ? cols[18].trim().toUpperCase() : 'FRA'),
      annee_nais: (map.annee_nais !== undefined && map.annee_nais !== -1 && cols[map.annee_nais])
        ? cols[map.annee_nais].trim()
        : (cols[21] && /^\d{4}$/.test(cols[21].trim()) ? cols[21].trim() : undefined),
      licence: (map.licence !== undefined && map.licence !== -1 && cols[map.licence])
        ? cols[map.licence].trim()
        : (cols[22] ? cols[22].trim() : undefined),
      sourceFile: detectedStructure === 'SALLE' ? 'Rslts salle 25-26.csv' : undefined,
      nom_compet: (map.nom_compet !== undefined && map.nom_compet !== -1 && cols[map.nom_compet]) 
        ? cols[map.nom_compet].trim() 
        : (cols[2] ? cols[2].trim() : undefined),
      num_compet: (map.num_compet !== undefined && map.num_compet !== -1 && cols[map.num_compet]) 
        ? cols[map.num_compet].trim() 
        : (cols[0] ? cols[0].trim() : undefined),
      dpt_compet: (map.dpt_compet !== undefined && map.dpt_compet !== -1 && cols[map.dpt_compet]) 
        ? cols[map.dpt_compet].trim() 
        : (cols[3] ? cols[3].trim() : undefined),
      ep_logica: (map.ep_logica !== undefined && map.ep_logica !== -1 && cols[map.ep_logica]) 
        ? cols[map.ep_logica].trim() 
        : (cols[5] ? cols[5].trim() : undefined),
    });
  }

  return {
    records: markPersonalRecords(parsedRecords),
    errors: [],
    totalRows: lines.length - dataStart,
    detectedColumns: headerInfo.headers,
    delimiterUsed: delimiter,
    headerRowIndex: headerInfo.hasNoHeader ? -1 : headerInfo.headerIndex,
    hasNoHeader: headerInfo.hasNoHeader,
  };
}

// Modèle CSV d'exemple avec les 27 en-têtes officiels
export function generateSampleCSV(): string {
  const headers = [...FFA_LOGICA_HEADERS];

  const rows = [
    ['C202401', '15/06/2024', 'Meeting National d\'Angers', '49', 'Angers', '100', '100', '100m', '10"28', '10.28', '10.28', 'E', 'IB', '1140', 'V', '+1.1', 'MARTIN', 'Lucas', 'FRA', 'SEM', 'M', '2001', '1234567', '059001', 'Lille Métropole Athlétisme', '59', 'Hauts-de-France'],
    ['C202302', '28/07/2023', 'Championnats de France Albi', '81', 'Albi', '100', '100', '100m', '10"35', '10.35', '10.35', 'E', 'N1', '1120', 'V', '+0.5', 'MARTIN', 'Lucas', 'FRA', 'SEM', 'M', '2001', '1234567', '059001', 'Lille Métropole Athlétisme', '59', 'Hauts-de-France'],
    ['C202403', '16/06/2024', 'Meeting National d\'Angers', '49', 'Angers', '200', '200', '200m', '20"64', '20.64', '20.64', 'E', 'IB', '1150', 'V', '+0.8', 'MARTIN', 'Lucas', 'FRA', 'SEM', 'M', '2001', '1234567', '059001', 'Lille Métropole Athlétisme', '59', 'Hauts-de-France'],
    ['C202404', '06/07/2024', 'Meeting de Paris Charléty', '75', 'Paris', '800', '800', '800m', '2\'02"40', '122.40', '122.40', 'E', 'IB', '1130', '', '', 'BERNARD', 'Camille', 'FRA', 'SEF', 'F', '2000', '2345678', '093002', 'CA Montreuil 93', '93', 'Île-de-France'],
    ['C202305', '20/06/2023', 'Meeting de Marseille', '13', 'Marseille', '800', '800', '800m', '2\'04"15', '124.15', '124.15', 'E', 'N1', '1090', '', '', 'BERNARD', 'Camille', 'FRA', 'SEF', 'F', '2000', '2345678', '093002', 'CA Montreuil 93', '93', 'Île-de-France'],
    ['C202406', '18/05/2024', 'Meeting de Montreuil', '93', 'Montreuil', 'LJ', 'LJ', 'Longueur', '7m75', '7.75', '7.75', '', 'N1', '1080', 'V', '+0.7', 'LEROY', 'Thomas', 'FRA', 'SEM', 'M', '1999', '3456789', '075003', 'Stade Français Paris', '75', 'Île-de-France'],
    ['C202407', '22/06/2024', 'Meeting de Clermont', '63', 'Clermont-Ferrand', '100H', '100H', '100m Haies', '12"82', '12.82', '12.82', 'E', 'IB', '1165', 'V', '+1.2', 'GIRARD', 'Inès', 'FRA', 'SEF', 'F', '2002', '4567890', '063004', 'Clermont Athlétisme Auvergne', '63', 'Auvergne-Rhône-Alpes'],
    ['C202408', '08/06/2024', 'Meeting de Grenoble', '38', 'Grenoble', 'PV', 'PV', 'Perche', '5m70', '5.70', '5.70', '', 'IB', '1190', '', '', 'MEYER', 'Julien', 'FRA', 'SEM', 'M', '1998', '5678901', '038005', 'Entente Athlétique Grenoble 38', '38', 'Auvergne-Rhône-Alpes'],
  ];

  return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
}

// Modèle .txt avec tabulations (FFA / SIFFA) SANS en-tête (la 1ère ligne est directement une donnée)
export function generateSampleTXT(): string {
  const rows = [
    ['C202401', '15/06/2024', 'Meeting National d\'Angers', '49', 'Angers', '100', '100', '100m', '10"28', '10.28', '10.28', 'E', 'IB', '1140', 'V', '+1.1', 'MARTIN', 'Lucas', 'FRA', 'SEM', 'M', '2001', '1234567', '059001', 'Lille Métropole Athlétisme', '59', 'Hauts-de-France'],
    ['C202302', '28/07/2023', 'Championnats de France Albi', '81', 'Albi', '100', '100', '100m', '10"35', '10.35', '10.35', 'E', 'N1', '1120', 'V', '+0.5', 'MARTIN', 'Lucas', 'FRA', 'SEM', 'M', '2001', '1234567', '059001', 'Lille Métropole Athlétisme', '59', 'Hauts-de-France'],
    ['C202403', '16/06/2024', 'Meeting National d\'Angers', '49', 'Angers', '200', '200', '200m', '20"64', '20.64', '20.64', 'E', 'IB', '1150', 'V', '+0.8', 'MARTIN', 'Lucas', 'FRA', 'SEM', 'M', '2001', '1234567', '059001', 'Lille Métropole Athlétisme', '59', 'Hauts-de-France'],
    ['C202404', '06/07/2024', 'Meeting de Paris Charléty', '75', 'Paris', '800', '800', '800m', '2\'02"40', '122.40', '122.40', 'E', 'IB', '1130', '', '', 'BERNARD', 'Camille', 'FRA', 'SEF', 'F', '2000', '2345678', '093002', 'CA Montreuil 93', '93', 'Île-de-France'],
    ['C202305', '20/06/2023', 'Meeting de Marseille', '13', 'Marseille', '800', '800', '800m', '2\'04"15', '124.15', '124.15', 'E', 'N1', '1090', '', '', 'BERNARD', 'Camille', 'FRA', 'SEF', 'F', '2000', '2345678', '093002', 'CA Montreuil 93', '93', 'Île-de-France'],
    ['C202406', '18/05/2024', 'Meeting de Montreuil', '93', 'Montreuil', 'LJ', 'LJ', 'Longueur', '7m75', '7.75', '7.75', '', 'N1', '1080', 'V', '+0.7', 'LEROY', 'Thomas', 'FRA', 'SEM', 'M', '1999', '3456789', '075003', 'Stade Français Paris', '75', 'Île-de-France'],
    ['C202407', '22/06/2024', 'Meeting de Clermont', '63', 'Clermont-Ferrand', '100H', '100H', '100m Haies', '12"82', '12.82', '12.82', 'E', 'IB', '1165', 'V', '+1.2', 'GIRARD', 'Inès', 'FRA', 'SEF', 'F', '2002', '4567890', '063004', 'Clermont Athlétisme Auvergne', '63', 'Auvergne-Rhône-Alpes'],
    ['C202408', '08/06/2024', 'Meeting de Grenoble', '38', 'Grenoble', 'PV', 'PV', 'Perche', '5m70', '5.70', '5.70', '', 'IB', '1190', '', '', 'MEYER', 'Julien', 'FRA', 'SEM', 'M', '1998', '5678901', '038005', 'Entente Athlétique Grenoble 38', '38', 'Auvergne-Rhône-Alpes'],
  ];

  // Fichier .txt tabulation SANS la ligne d'en-tête (la 1ère ligne est une donnée)
  return rows.map(r => r.join('\t')).join('\n');
}

export const generateAthleticsSampleCSV = generateSampleCSV;
export const generateAthleticsSampleTXT = generateSampleTXT;
