import { CategoryCode, PerformanceNature, PerformanceRecord } from '../types/athletics';

// Normalisation des codes de catégories FFA (BE, MI, CA, JU, ES, SE, MA)
export function normalizeCategory(cat?: string): CategoryCode {
  if (!cat) return 'SE';
  const c = cat.toUpperCase().trim();
  if (c.startsWith('BEN') || c === 'BE' || c === 'BEF' || c === 'BEM') return 'BE';
  if (c.startsWith('MIM') || c.startsWith('MIF') || c === 'MI') return 'MI';
  if (c.startsWith('CAD') || c === 'CAM' || c === 'CAF' || c === 'CA') return 'CA';
  if (c.startsWith('JUN') || c === 'JUM' || c === 'JUF' || c === 'JU') return 'JU';
  if (c.startsWith('ESP') || c === 'ESM' || c === 'ESF' || c === 'ES') return 'ES';
  if (c.startsWith('MAS') || c === 'MAM' || c === 'MAF' || c === 'MA' || c.startsWith('VET')) return 'MA';
  return 'SE';
}

export const CATEGORY_LABELS: Record<CategoryCode, string> = {
  BE: 'Benjamin(e)',
  MI: 'Minime',
  CA: 'Cadet(te)',
  JU: 'Junior',
  ES: 'Espoir',
  SE: 'Senior',
  MA: 'Master',
};

export function getCategoryLabel(cat?: string): string {
  return CATEGORY_LABELS[normalizeCategory(cat)] || 'Senior';
}

export interface FFACategoryResult {
  seasonYear: number;       // Millésime de la saison (ex: 2027 pour 2026-2027)
  seasonLabel: string;      // Ex: "2026-2027"
  categoryCode: string;     // Ex: "JU", "CA", "ES", "MI", "BE", "PO", "EA", "BB", "SE", "M0"
  yearInCat?: number;       // Ex: 1, 2, 3
  categoryDisplay: string;  // Ex: "JU 1", "CA 2", "ES 1", "SE", "M0"
  badgeDisplay: string;     // Ex: "Cat. 2027 : JU 1"
  fullLabel: string;        // Ex: "Junior 1ère année"
  birthYear?: number;
}

/**
 * Calcule la saison athlétique en cours selon la règle officielle FFA :
 * La saison sportive s'entend du 1er septembre de l'année N au 31 août de l'année N+1.
 * Le millésime de la saison est l'année N+1 (ex: 20 novembre 2026 -> saison 2026-2027, millésime 2027).
 */
export function getAthleticSeasonForDate(date: Date = new Date()): {
  seasonStartYear: number;
  seasonEndYear: number;
  seasonLabel: string;
  seasonYear: number;
} {
  const month = date.getMonth(); // 0 = Janvier, 7 = Août, 8 = Septembre
  const year = date.getFullYear();

  if (month >= 8) {
    // Du 1er septembre au 31 décembre : saison year-(year + 1), millésime year + 1
    return {
      seasonStartYear: year,
      seasonEndYear: year + 1,
      seasonLabel: `${year}-${year + 1}`,
      seasonYear: year + 1,
    };
  } else {
    // Du 1er janvier au 31 août : saison (year - 1)-year, millésime year
    return {
      seasonStartYear: year - 1,
      seasonEndYear: year,
      seasonLabel: `${year - 1}-${year}`,
      seasonYear: year,
    };
  }
}

/**
 * Détermine la catégorie FFA et l'année d'âge (1, 2, 3) selon l'année de naissance
 * et la saison sportive active à la date de connexion de l'utilisateur.
 * Exemple : un athlète né en 2009 connecté en nov 2026 (saison 2026-2027) -> "Cat. 2027 : JU 1".
 */
export function computeFFACategory(
  birthYear?: number,
  date: Date = new Date(),
  fallbackCat?: string
): FFACategoryResult {
  const season = getAthleticSeasonForDate(date);
  const seasonYear = season.seasonYear;

  // Si l'année de naissance n'est pas fournie, estimer à partir de la catégorie de repli
  let effectiveBirthYear = birthYear;
  if (!effectiveBirthYear || isNaN(effectiveBirthYear) || effectiveBirthYear < 1920 || effectiveBirthYear > 2030) {
    if (fallbackCat) {
      const up = fallbackCat.toUpperCase().trim();
      if (up.startsWith('BB')) effectiveBirthYear = seasonYear - 5;
      else if (up.startsWith('EA')) effectiveBirthYear = seasonYear - 8;
      else if (up.startsWith('PO')) effectiveBirthYear = seasonYear - 11;
      else if (up.startsWith('BE')) effectiveBirthYear = seasonYear - 13;
      else if (up.startsWith('MI')) effectiveBirthYear = seasonYear - 15;
      else if (up.startsWith('CA')) effectiveBirthYear = seasonYear - 17;
      else if (up.startsWith('JU')) effectiveBirthYear = seasonYear - 19;
      else if (up.startsWith('ES')) effectiveBirthYear = seasonYear - 21;
      else if (up.startsWith('MA') || up.startsWith('M0') || up.startsWith('VET')) effectiveBirthYear = seasonYear - 40;
      else effectiveBirthYear = seasonYear - 25;
    }
  }

  if (!effectiveBirthYear) {
    const rawCode = fallbackCat ? fallbackCat.slice(0, 2).toUpperCase() : 'SE';
    return {
      seasonYear,
      seasonLabel: season.seasonLabel,
      categoryCode: rawCode,
      categoryDisplay: rawCode,
      badgeDisplay: `Cat. ${seasonYear} : ${rawCode}`,
      fullLabel: fallbackCat || 'Non renseigné',
    };
  }

  const ageDiff = seasonYear - effectiveBirthYear;

  // 1. Baby Athlé (BB) : <= 6 ans
  if (ageDiff <= 6) {
    const yearInCat = ageDiff <= 4 ? 1 : (ageDiff === 5 ? 2 : 3);
    return {
      seasonYear,
      seasonLabel: season.seasonLabel,
      categoryCode: 'BB',
      yearInCat,
      categoryDisplay: `BB ${yearInCat}`,
      badgeDisplay: `Cat. ${seasonYear} : BB ${yearInCat}`,
      fullLabel: `Baby Athlé ${yearInCat}${yearInCat === 1 ? 'ère' : 'ème'} année`,
      birthYear: effectiveBirthYear,
    };
  }

  // 2. École d'Athlétisme (EA) : 7-9 ans (3 ans)
  if (ageDiff >= 7 && ageDiff <= 9) {
    const yearInCat = ageDiff - 6; // 7 -> 1, 8 -> 2, 9 -> 3
    return {
      seasonYear,
      seasonLabel: season.seasonLabel,
      categoryCode: 'EA',
      yearInCat,
      categoryDisplay: `EA ${yearInCat}`,
      badgeDisplay: `Cat. ${seasonYear} : EA ${yearInCat}`,
      fullLabel: `École d'Athlétisme ${yearInCat}${yearInCat === 1 ? 'ère' : 'ème'} année`,
      birthYear: effectiveBirthYear,
    };
  }

  // 3. Poussin (PO) : 10-11 ans (2 ans)
  if (ageDiff === 10 || ageDiff === 11) {
    const yearInCat = ageDiff === 10 ? 1 : 2;
    return {
      seasonYear,
      seasonLabel: season.seasonLabel,
      categoryCode: 'PO',
      yearInCat,
      categoryDisplay: `PO ${yearInCat}`,
      badgeDisplay: `Cat. ${seasonYear} : PO ${yearInCat}`,
      fullLabel: `Poussin(e) ${yearInCat}${yearInCat === 1 ? 'ère' : 'ème'} année`,
      birthYear: effectiveBirthYear,
    };
  }

  // 4. Benjamin (BE) : 12-13 ans (2 ans)
  if (ageDiff === 12 || ageDiff === 13) {
    const yearInCat = ageDiff === 12 ? 1 : 2;
    return {
      seasonYear,
      seasonLabel: season.seasonLabel,
      categoryCode: 'BE',
      yearInCat,
      categoryDisplay: `BE ${yearInCat}`,
      badgeDisplay: `Cat. ${seasonYear} : BE ${yearInCat}`,
      fullLabel: `Benjamin(e) ${yearInCat}${yearInCat === 1 ? 'ère' : 'ème'} année`,
      birthYear: effectiveBirthYear,
    };
  }

  // 5. Minime (MI) : 14-15 ans (2 ans)
  if (ageDiff === 14 || ageDiff === 15) {
    const yearInCat = ageDiff === 14 ? 1 : 2;
    return {
      seasonYear,
      seasonLabel: season.seasonLabel,
      categoryCode: 'MI',
      yearInCat,
      categoryDisplay: `MI ${yearInCat}`,
      badgeDisplay: `Cat. ${seasonYear} : MI ${yearInCat}`,
      fullLabel: `Minime ${yearInCat}${yearInCat === 1 ? 'ère' : 'ème'} année`,
      birthYear: effectiveBirthYear,
    };
  }

  // 6. Cadet (CA) : 16-17 ans (2 ans)
  if (ageDiff === 16 || ageDiff === 17) {
    const yearInCat = ageDiff === 16 ? 1 : 2;
    return {
      seasonYear,
      seasonLabel: season.seasonLabel,
      categoryCode: 'CA',
      yearInCat,
      categoryDisplay: `CA ${yearInCat}`,
      badgeDisplay: `Cat. ${seasonYear} : CA ${yearInCat}`,
      fullLabel: `Cadet(te) ${yearInCat}${yearInCat === 1 ? 'ère' : 'ème'} année`,
      birthYear: effectiveBirthYear,
    };
  }

  // 7. Junior (JU) : 18-19 ans (2 ans)
  if (ageDiff === 18 || ageDiff === 19) {
    const yearInCat = ageDiff === 18 ? 1 : 2;
    return {
      seasonYear,
      seasonLabel: season.seasonLabel,
      categoryCode: 'JU',
      yearInCat,
      categoryDisplay: `JU ${yearInCat}`,
      badgeDisplay: `Cat. ${seasonYear} : JU ${yearInCat}`,
      fullLabel: `Junior ${yearInCat}${yearInCat === 1 ? 'ère' : 'ème'} année`,
      birthYear: effectiveBirthYear,
    };
  }

  // 8. Espoir (ES / U23) : 20-22 ans (3 ans)
  if (ageDiff >= 20 && ageDiff <= 22) {
    const yearInCat = ageDiff - 19; // 20 -> 1, 21 -> 2, 22 -> 3
    return {
      seasonYear,
      seasonLabel: season.seasonLabel,
      categoryCode: 'ES',
      yearInCat,
      categoryDisplay: `ES ${yearInCat}`,
      badgeDisplay: `Cat. ${seasonYear} : ES ${yearInCat}`,
      fullLabel: `Espoir ${yearInCat}${yearInCat === 1 ? 'ère' : 'ème'} année`,
      birthYear: effectiveBirthYear,
    };
  }

  // 9. Senior (SE) : 23-34 ans (12 années d'âge)
  if (ageDiff >= 23 && ageDiff <= 34) {
    const yearInCat = ageDiff - 22; // 1 à 12
    return {
      seasonYear,
      seasonLabel: season.seasonLabel,
      categoryCode: 'SE',
      yearInCat,
      categoryDisplay: `SE ${yearInCat}`,
      badgeDisplay: `Cat. ${seasonYear} : SE ${yearInCat}`,
      fullLabel: `Senior ${yearInCat}${yearInCat === 1 ? 'ère' : 'ème'} année`,
      birthYear: effectiveBirthYear,
    };
  }

  // 10. Master (MA / M0-M10) : >= 35 ans
  const mIndex = Math.min(10, Math.max(0, Math.floor((ageDiff - 35) / 5)));
  const mCode = `M${mIndex}`;
  return {
    seasonYear,
    seasonLabel: season.seasonLabel,
    categoryCode: mCode,
    categoryDisplay: mCode,
    badgeDisplay: `Cat. ${seasonYear} : ${mCode}`,
    fullLabel: `Master ${mIndex}`,
    birthYear: effectiveBirthYear,
  };
}

/**
 * Retourne les années d'âge possibles dans la catégorie (ex: BE -> [1, 2], ES -> [1, 2, 3]).
 */
export function getYearsForCategory(category?: string): number[] {
  if (!category || category === 'ALL') return [];
  const c = category.toUpperCase().trim();
  if (c.startsWith('BE') || c.startsWith('BEN')) return [1, 2];
  if (c.startsWith('MI') || c.startsWith('MIM')) return [1, 2];
  if (c.startsWith('CA') || c.startsWith('CAD')) return [1, 2];
  if (c.startsWith('JU') || c.startsWith('JUN')) return [1, 2];
  if (c.startsWith('PO')) return [1, 2];
  if (c.startsWith('ES') || c.startsWith('ESP')) return [1, 2, 3];
  if (c.startsWith('EA')) return [1, 2, 3];
  if (c.startsWith('BB')) return [1, 2, 3];
  if (c.startsWith('SE') || c.startsWith('SEN')) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return [];
}

/**
 * Calcule l'année d'âge dans la catégorie (1, 2 ou 3) pour une performance
 * en fonction de la catégorie, de la saison et de l'année de naissance.
 */
export function getAthleteYearInCategory(
  record: PerformanceRecord,
  targetSeasonYear?: number
): number | undefined {
  let seasonYear = targetSeasonYear || record.saison;
  if (!seasonYear) {
    if (record.date && record.date.length >= 7) {
      const y = parseInt(record.date.slice(0, 4), 10);
      const m = parseInt(record.date.slice(5, 7), 10);
      if (!isNaN(y)) {
        seasonYear = (!isNaN(m) && m >= 9) ? y + 1 : y;
      }
    }
  }
  if (!seasonYear) seasonYear = 2026;

  const birthYear = record.annee_nais ? parseInt(String(record.annee_nais).trim(), 10) : undefined;
  if (birthYear && !isNaN(birthYear) && birthYear > 1920 && birthYear < 2030) {
    const ageDiff = seasonYear - birthYear;
    // BE (12-13 ans) : 12 -> 1, 13 -> 2
    if (ageDiff === 12) return 1;
    if (ageDiff === 13) return 2;
    // MI (14-15 ans) : 14 -> 1, 15 -> 2
    if (ageDiff === 14) return 1;
    if (ageDiff === 15) return 2;
    // CA (16-17 ans) : 16 -> 1, 17 -> 2
    if (ageDiff === 16) return 1;
    if (ageDiff === 17) return 2;
    // JU (18-19 ans) : 18 -> 1, 19 -> 2
    if (ageDiff === 18) return 1;
    if (ageDiff === 19) return 2;
    // ES (20-22 ans) : 20 -> 1, 21 -> 2, 22 -> 3
    if (ageDiff === 20) return 1;
    if (ageDiff === 21) return 2;
    if (ageDiff === 22) return 3;
    // SE (23-34 ans : 12 années d'âge) : 23 -> 1, ..., 34 -> 12
    if (ageDiff >= 23 && ageDiff <= 34) return ageDiff - 22;
    // PO (10-11 ans) : 10 -> 1, 11 -> 2
    if (ageDiff === 10) return 1;
    if (ageDiff === 11) return 2;
    // EA (7-9 ans) : 7 -> 1, 8 -> 2, 9 -> 3
    if (ageDiff === 7) return 1;
    if (ageDiff === 8) return 2;
    if (ageDiff === 9) return 3;
    // BB (4-6 ans) : 4 -> 1, 5 -> 2, 6 -> 3
    if (ageDiff <= 4) return 1;
    if (ageDiff === 5) return 2;
    if (ageDiff === 6) return 3;
  }

  // Si annee_nais non renseignée ou non standard, vérifier le libellé de catégorie (ex: "JU1", "ES2", "SE 4", "BE 1")
  if (record.categorie) {
    const m = record.categorie.match(/(?:^|[^\d])(\d{1,2})(?:$|[^\d])/);
    if (m) {
      return parseInt(m[1], 10);
    }
  }

  return undefined;
}

// Vérifie si le vent est réglementairement mesuré pour une discipline.
// Règle fédérale officielle : mesuré UNIQUEMENT en plein air pour :
// 50m, 80m, 120m, 100m, 200 (200m), 50m haies, 80m haies, tous les 100m haies, tous les 110m haies, 200m haies, longueur, triple saut.
export function isWindMeasured(discipline: string, structure?: string): boolean {
  // Le vent n'est jamais mesuré en salle
  if (structure === 'SALLE') return false;
  if (!discipline) return false;

  const d = discipline.toLowerCase().trim();
  if (d.includes('salle') || d.includes('indoor')) return false;

  // Nettoyage de l'épreuve (retire les codes épreuves FFA tels que "-105", etc.)
  const clean = d.replace(/-\d+$/, '').trim();

  // 1. Sprints plats mesurés au vent : 50m, 80m, 120m, 100m, 200 / 200m
  if (clean === '50m' || clean === '80m' || clean === '100m' || clean === '120m') return true;
  if (clean === '200' || clean === '200m') return true;

  // 2. Haies mesurées au vent : 50m haies, 80m haies, tous les 100m haies, tous les 110m haies, 200m haies
  if (clean.includes('50m haies') || clean.startsWith('50m h')) return true;
  if (clean.includes('80m haies') || clean.startsWith('80m h')) return true;
  if (clean.includes('100m haies') || clean.startsWith('100m h')) return true;
  if (clean.includes('110m haies') || clean.startsWith('110m h')) return true;
  if (clean.includes('200m haies') || clean.startsWith('200m h')) return true;

  // 3. Sauts horizontaux mesurés au vent : longueur, triple saut
  if (clean.includes('longueur')) return true;
  if (clean.includes('triple saut') || clean.includes('triple-saut') || clean.includes('triplesaut')) return true;

  return false;
}

// Nettoie et normalise le libellé officiel d'une discipline (retire les suffixes "salle", "piste", tours/concours Logica "/ 2e", "- Re", etc.)
export function cleanDisciplineName(discipline: string): string {
  if (!discipline) return '';
  let d = discipline.trim();

  // 1. Supprimer les suffixes de manche, tour, concours après un slash (ex: "Hauteur / 2e", "Hauteur/ 2e", "Poids / 2e", "Hauteur / TCF")
  if (d.includes('/')) {
    d = d.split('/')[0].trim();
  }

  // 2. Retirer les suffixes "salle", "piste", "indoor", etc.
  d = d.replace(/\s*-\s*(salle|piste|indoor|plein air)$/i, '');
  d = d.replace(/\s+(salle|piste|indoor|plein air)$/i, '');
  d = d.replace(/\s*\((salle|piste|indoor|plein air)\)$/i, '');

  // 3. Retirer les suffixes Logica de repêchage, relais, finale, qualifications, etc. (ex: "Hauteur - Re", "Hauteur- Re", "Hauteur - Rep", "50m - Re")
  d = d.replace(/\s*-\s*(re|rep|repechage|repêchage|relais|qualif|qual|q|demi|demie|finale|fin|f|serie|série|concours|tour)\b.*$/i, '');
  d = d.replace(/\s*-\s*\d+$/g, '');

  return d.trim();
}

// Identifie la nature de l'épreuve (temps de sprint, demi-fond, concours saut/lancer, ou épreuves combinées)
export function getDisciplineNature(discipline: string): PerformanceNature {
  const d = discipline.toLowerCase().trim();
  if (
    d.includes('pt') || 
    d.includes('athlon') || 
    d.includes('heptathlon') || 
    d.includes('décathlon') || 
    d.includes('decathlon') || 
    d.includes('pentathlon') ||
    d.includes('tétrathlon') ||
    d.includes('tetrathlon') ||
    d.includes('octathlon')
  ) {
    return 'points';
  }
  if (
    (d.includes('m') || d.includes('relais') || d.includes('marche')) && 
    !d.includes('longueur') && 
    !d.includes('hauteur') && 
    !d.includes('perche') && 
    !d.includes('triple') && 
    !d.includes('poids') && 
    !d.includes('disque') && 
    !d.includes('marteau') && 
    !d.includes('javelot')
  ) {
    return 'time';
  }
  return 'distance';
}

/**
 * Détermine la priorité de classement officiel des épreuves selon la hiérarchie demandée :
 * 1. Courses :
 *    - Sprint (50m, 60m, 80m, 100m, 150m, 200m, 300m, 400m, relais...)
 *    - Haies (50mH, 60mH, 80mH, 100mH, 110mH, 200mH, 400mH...)
 *    - Demi-fond (800m, 1000m, 1500m, 2000m, 3000m, steeple, 5000m, 10000m, cross, route...)
 *    - Marche (2000m marche, 3000m marche, 5000m marche, 10km marche, 20km marche...)
 * 2. Sauts :
 *    - Hauteur
 *    - Perche
 *    - Longueur
 *    - Triple saut
 * 3. Lancers :
 *    - Poids
 *    - Javelot (et vortex / balle)
 *    - Disque
 *    - Marteau
 * 4. Épreuves combinées :
 *    - Triathlon, Tétrathlon, Pentathlon, Hexathlon, Heptathlon, Octathlon, Décathlon...
 */
export function getDisciplineSortPriority(discipline: string): number {
  if (!discipline) return 9999;
  const raw = cleanDisciplineName(discipline).toLowerCase().trim();
  // Suppression des espaces pour les comparaisons de distances (ex: "1 000m" -> "1000m", "100 m" -> "100m")
  const compact = raw.replace(/\s+/g, '');

  // 1. COURSES :
  // 1.4 Marche (toujours en fin des courses : 4000+)
  if (raw.includes('marche')) {
    const distMatch = compact.match(/(\d+)(m|km)?marche/);
    const dist = distMatch ? parseInt(distMatch[1], 10) : 3000;
    return 4000 + Math.min(dist / 10, 999);
  }

  // 1.2 Haies (après sprint plat : 2000+)
  if (
    raw.includes('haie') || 
    raw.includes('haies') || 
    compact.includes('110mh') || 
    compact.includes('100mh') || 
    compact.includes('400mh') || 
    compact.includes('60mh') || 
    compact.includes('50mh') ||
    compact.includes('80mh') ||
    compact.includes('200mh') ||
    compact.includes('320mh')
  ) {
    const distMatch = compact.match(/(\d+)/);
    const dist = distMatch ? parseInt(distMatch[1], 10) : 100;
    return 2000 + dist;
  }

  // 1.1 Sprint plat (50m à 400m et relais : 1000+)
  const isSprintDist = (d: number) => [50, 60, 80, 100, 120, 150, 200, 250, 300, 400].includes(d);
  const sprintMatch = compact.match(/^(\d+)m$/);
  if (sprintMatch) {
    const dist = parseInt(sprintMatch[1], 10);
    if (isSprintDist(dist)) {
      return 1000 + dist;
    }
  }
  // Sprint pur sans 'm' explicite (ex: "100", "200")
  if (/^(50|60|80|100|120|150|200|250|300|400)$/.test(compact)) {
    return 1000 + parseInt(compact, 10);
  }
  if (compact.includes('4x') || compact.includes('relais')) {
    return 1500;
  }

  // 1.3 Demi-fond & Fond (800m, 1000m, 1500m, 2000m, 3000m, steeple, 5000m, 10000m, cross, route : 3000+)
  if (
    compact.includes('800') || 
    compact.includes('1000') || 
    compact.includes('1500') || 
    compact.includes('2000') || 
    compact.includes('3000') || 
    compact.includes('5000') || 
    compact.includes('10000') || 
    raw.includes('steeple') || 
    raw.includes('cross') || 
    raw.includes('semi') || 
    raw.includes('marathon') || 
    compact.includes('10km') ||
    compact.includes('5km')
  ) {
    if (compact.includes('800')) return 3080;
    if (compact.includes('1000') && !compact.includes('10000')) return 3100;
    if (compact.includes('1500')) return 3150;
    if (compact.includes('2000') && !raw.includes('steeple')) return 3200;
    if (compact.includes('3000') && !raw.includes('steeple')) return 3300;
    if (raw.includes('steeple')) return 3350;
    if (compact.includes('5000') || compact.includes('5km')) return 3500;
    if (compact.includes('10000') || compact.includes('10km')) return 3600;
    if (raw.includes('semi')) return 3700;
    if (raw.includes('marathon')) return 3800;
    if (raw.includes('cross')) return 3900;
    return 3400;
  }

  // Autres courses reconnues par distance métrique
  const anyMeterMatch = compact.match(/^(\d+)m$/);
  if (anyMeterMatch) {
    const dist = parseInt(anyMeterMatch[1], 10);
    if (dist <= 400) return 1000 + dist;
    return 3000 + dist;
  }

  // 2. SAUTS :
  // - Hauteur : 5010
  // - Perche : 5020
  // - Longueur : 5030
  // - Triple saut : 5040
  if (raw.includes('hauteur')) return 5010;
  if (raw.includes('perche')) return 5020;
  if (raw.includes('longueur')) return 5030;
  if (raw.includes('triple')) return 5040;

  // 3. LANCERS :
  // - Poids : 6010
  // - Javelot (puis balle / vortex) : 6020
  // - Disque : 6030
  // - Marteau : 6040
  if (raw.includes('poids')) return 6010;
  if (raw.includes('javelot') || raw.includes('balle') || raw.includes('vortex')) return 6020;
  if (raw.includes('disque')) return 6030;
  if (raw.includes('marteau')) return 6040;

  // 4. ÉPREUVES COMBINÉES :
  if (raw.includes('triathlon')) return 7010;
  if (raw.includes('tétrathlon') || raw.includes('tetrathlon')) return 7020;
  if (raw.includes('pentathlon')) return 7030;
  if (raw.includes('hexathlon')) return 7040;
  if (raw.includes('heptathlon')) return 7050;
  if (raw.includes('octathlon')) return 7060;
  if (raw.includes('décathlon') || raw.includes('decathlon')) return 7070;
  if (raw.includes('athlon') || raw.includes('combin')) return 7080;

  return 8000;
}

/**
 * Normalise les valeurs de distance pour garantir qu'elles soient toujours exprimées en MÈTRES.
 * Dans les fichiers FFA Logica, la colonne K perf_ajustee ou certaines colonnes brutes peuvent
 * être exprimées en centimètres (ex: -175 ou 175 pour 1m75 en hauteur).
 */
export function normalizeDistanceValue(val: number, discipline: string = ''): number {
  if (val <= 0 || isNaN(val)) return 0;
  const d = discipline.toLowerCase().trim();

  // 1. Saut en hauteur (records 0.60m à 2.50m) : toute valeur >= 20 est en cm (ex: 175 -> 1.75m)
  if (d.includes('hauteur')) {
    if (val >= 20) return Number((val / 100).toFixed(2));
    return val;
  }

  // 2. Saut à la perche (records 1.50m à 6.50m) : toute valeur >= 30 est en cm (ex: 450 -> 4.50m)
  if (d.includes('perche')) {
    if (val >= 30) return Number((val / 100).toFixed(2));
    return val;
  }

  // 3. Saut en longueur (records 1.50m à 9.00m) : toute valeur >= 30 est en cm (ex: 680 -> 6.80m)
  if (d.includes('longueur')) {
    if (val >= 30) return Number((val / 100).toFixed(2));
    return val;
  }

  // 4. Triple saut (records 5.00m à 19.00m) : toute valeur >= 30 est en cm (ex: 1420 -> 14.20m)
  if (d.includes('triple')) {
    if (val >= 30) return Number((val / 100).toFixed(2));
    return val;
  }

  // 5. Lancer du poids (records 3.00m à 24.00m) : toute valeur >= 40 est en cm (ex: 1540 -> 15.40m)
  if (d.includes('poids')) {
    if (val >= 40) return Number((val / 100).toFixed(2));
    return val;
  }

  // 6. Autres lancers (disque, marteau, javelot)
  if (d.includes('disque') || d.includes('marteau') || d.includes('javelot')) {
    if (val >= 200) return Number((val / 100).toFixed(2));
    return val;
  }

  // 7. Règle générale concours : si val >= 100, c'est en centimètres
  if (val >= 100) {
    return Number((val / 100).toFixed(2));
  }

  return val;
}

// Convertit une chaîne de performance en valeur numérique standardisée
// Temps -> secondes
// Distance -> mètres
// Points -> nombre
export function parsePerformanceString(perfStr: string, nature: PerformanceNature, discipline: string = ''): number {
  if (!perfStr) return 0;
  let str = String(perfStr).trim().replace(',', '.');

  if (nature === 'points') {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num);
  }

  if (nature === 'distance') {
    // Ex: "7m82", "7.82m", "7.82", "18m45"
    str = str.replace(/m/gi, '.');
    const parts = str.split('.');
    if (parts.length > 2) {
      str = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    const val = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(val)) return 0;
    return normalizeDistanceValue(Number(val.toFixed(2)), discipline);
  }

  // Nature === 'time'
  // Normalisation des apostrophes successives (ex: 10''00 -> 10"00, standard FFA)
  str = str.replace(/''/g, '"');

  // Format sprint direct xx'yy", xx'yy, xx"yy, xx''yy (ex: 10'00", 12'23", 10"00, 12"23, 10'00, 12''23)
  // En athlétisme français, ces notations sans heures ni minutes représentent TOUJOURS des secondes et centièmes
  const sprintQuoteMatch = str.match(/^(\d+)['"](\d{1,2})['"]?$/);
  if (sprintQuoteMatch && !str.includes(':')) {
    const sec = parseInt(sprintQuoteMatch[1], 10) || 0;
    const cent = parseInt(sprintQuoteMatch[2], 10) || 0;
    return Number((sec + cent / 100).toFixed(2));
  }

  // Si format combiné minutes et secondes (ex: 1'48"35 ou 1'48''35 ou 1:48.35)
  if (str.includes("'") && str.includes('"')) {
    const match = str.match(/^(\d+)[':](\d{1,2})["'](\d{1,2})$/);
    if (match) {
      const min = parseInt(match[1], 10) || 0;
      const sec = parseInt(match[2], 10) || 0;
      const cent = parseInt(match[3], 10) || 0;
      return Number((min * 60 + sec + cent / 100).toFixed(2));
    }
  }

  // Format mm:ss.cc ou mm:ss,cc
  if (str.includes(':')) {
    const tokens = str.split(':').filter(Boolean);
    if (tokens.length >= 2) {
      const min = parseFloat(tokens[0]) || 0;
      const sec = parseFloat(tokens[1]) || 0;
      return Number((min * 60 + sec).toFixed(2));
    }
  }

  // Format xx"yy ou xx'yy (ex: 10"00 ou 10'00 ou 7"56)
  const quoteMatch = str.match(/^(\d+)["'](\d{1,2})$/);
  if (quoteMatch) {
    const sec = parseInt(quoteMatch[1], 10) || 0;
    const cent = parseInt(quoteMatch[2], 10) || 0;
    return Number((sec + cent / 100).toFixed(2));
  }

  // Format pur secondes (ex: "10.00", "10.42", "11")
  const val = parseFloat(str.replace(/[^0-9.]/g, ''));
  return isNaN(val) ? 0 : Number(val.toFixed(2));
}

// Détection des épreuves de sprint et haies (50m, 60m, 100m, 200m, 300m, 400m, 100mH, 110mH, 400mH, etc.)
export function isSprintOrHurdles(discipline?: string): boolean {
  if (!discipline) return false;
  const d = discipline.toLowerCase().trim();
  if (/^50\s*m\b/.test(d) || d === '50m') return true;
  if (/^60\s*m\b/.test(d) || d === '60m') return true;
  if (/^100\s*m\b/.test(d) || d === '100m') return true;
  if (/^150\s*m\b/.test(d) || d === '150m') return true;
  if (/^200\s*m\b/.test(d) || d === '200m') return true;
  if (/^300\s*m\b/.test(d) || d === '300m') return true;
  if (/^400\s*m\b/.test(d) || d === '400m') return true;
  if (d.includes('haie') || d.includes('haies') || d.includes('110mh') || d.includes('100mh') || d.includes('400mh') || d.includes('60mh') || d.includes('50mh')) return true;
  if (d.includes('4x100') || d.includes('4 x 100')) return true;
  return false;
}

// Formatage officiel pour affichage selon les règles strictes des bilans de l'athlétisme français
// - sprint et haies : guillemet " entre les secondes et centièmes (ex: 10"00, 10"15, 12"23, 7"56) - JAMAIS de minutes
// - demi-fond et marche : minutes'secondes''centièmes (ex: 1'48''35, 2'48''53) ou secondes''centièmes si < 60s
// - sauts et lancers : mètre 'm' entre mètres et centimètres (ex: 1m92, 7m82, 64m50)
// - épreuves combinées : points avec espace (ex: 2 685 pts)
export function formatPerformanceDisplay(
  value: number, 
  nature: PerformanceNature,
  discipline?: string
): string {
  if (value === undefined || value === null || isNaN(value) || value === 0) return '-';

  const discLower = (discipline || '').toLowerCase();
  const isSautsLancers = nature === 'distance' || 
    discLower.includes('hauteur') || discLower.includes('longueur') || 
    discLower.includes('triple') || discLower.includes('perche') || 
    discLower.includes('poids') || discLower.includes('disque') || 
    discLower.includes('javelot') || discLower.includes('marteau') || 
    discLower.includes('balle') || discLower.includes('vortex');

  const isCombines = nature === 'points' || 
    discLower.includes('triathlon') || discLower.includes('pentathlon') || 
    discLower.includes('heptathlon') || discLower.includes('décathlon') || 
    discLower.includes('decathlon') || discLower.includes('combin');

  if (isCombines) {
    const pts = Math.round(Math.abs(value));
    return `${pts.toLocaleString('fr-FR')} pts`;
  }

  if (isSautsLancers) {
    let d = Math.abs(value);
    d = normalizeDistanceValue(d, discipline);
    const m = Math.floor(d);
    const cm = Math.round((d - m) * 100);
    const cmStr = cm < 10 ? `0${cm}` : (cm >= 100 ? '00' : String(cm));
    return `${m}m${cmStr}`;
  }

  const isSprint = isSprintOrHurdles(discipline);

  // Sprint et haies : TOUJOURS en secondes et centièmes avec apostrophes doubles '' (ex: 10''00, 10''15, 12''23, 7''56)
  // Règle formelle : les épreuves de sprint et de haies ne s'affichent JAMAIS avec des minutes
  if (isSprint) {
    let totalSec = Math.abs(value);
    // Si la valeur est en centièmes (ex: 1000 pour 10''00 ou 1223 pour 12''23), la ramener en secondes
    if (totalSec >= 100) {
      totalSec = totalSec / 100;
    }
    const sec = Math.floor(totalSec);
    let cent = Math.round((totalSec - sec) * 100);
    let finalSec = sec;
    if (cent >= 100) {
      finalSec += 1;
      cent = 0;
    }
    const centStr = cent < 10 ? `0${cent}` : String(cent);
    return `${finalSec}''${centStr}`;
  }

  const isDemiFondMarche = 
    discLower.includes('800m') || discLower.includes('1000m') || 
    discLower.includes('1500m') || discLower.includes('2000m') || 
    discLower.includes('3000m') || discLower.includes('5000m') || 
    discLower.includes('10000m') || discLower.includes('semi') || 
    discLower.includes('marathon') || discLower.includes('marche') || 
    discLower.includes('cross') || discLower.includes('steeple');

  // Demi-fond, fond, marche ou temps >= 60 secondes hors sprint
  if (isDemiFondMarche || value >= 60) {
    const totalSec = Math.abs(value);
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    let cent = Math.round((totalSec - Math.floor(totalSec)) * 100);
    let finalSec = sec;
    let finalMin = min;
    if (cent >= 100) {
      finalSec += 1;
      cent = 0;
      if (finalSec >= 60) {
        finalMin += 1;
        finalSec = 0;
      }
    }
    const secStr = finalSec < 10 ? `0${finalSec}` : String(finalSec);
    const centStr = cent < 10 ? `0${cent}` : String(cent);
    if (finalMin === 0) {
      return `${secStr}''${centStr}`;
    }
    return `${finalMin}'${secStr}''${centStr}`;
  }

  // Par défaut (autre course courte) : secondes et centièmes (ex: 10"00)
  const totalSec = Math.abs(value);
  const sec = Math.floor(totalSec);
  let cent = Math.round((totalSec - sec) * 100);
  let finalSec = sec;
  if (cent >= 100) {
    finalSec += 1;
    cent = 0;
  }
  const centStr = cent < 10 ? `0${cent}` : String(cent);
  return `${finalSec}"${centStr}`;
}

// Compare deux performances: true si a est MEILLEUR que b
export function isBetterPerformance(a: number, b: number, nature: PerformanceNature): boolean {
  if (a <= 0) return false;
  if (b <= 0) return true;
  if (nature === 'time') {
    return a < b; // Moins de secondes = meilleur
  }
  return a > b; // Plus de mètres ou de points = meilleur
}

// Détection et enrichissement des Records Personnels (RP / PB)
// RÈGLE OFFICIELLE ATHLÉTISME : Tout vent strictement supérieur à 2.0 m/s interdit formellement l'homologation d'un record (PB / RP)
export function markPersonalRecords(records: PerformanceRecord[]): PerformanceRecord[] {
  // Regrouper par athlète et par discipline (uniquement les performances avec vent régulier <= +2.0 m/s ou non mesuré)
  const bestMap = new Map<string, number>();

  // 1ère passe: trouver le RP global par (athlète, discipline) en excluant strictement le vent > +2.0 m/s
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r.vent !== null && r.vent !== undefined && r.vent > 2.0) {
      continue;
    }
    const athKey = r.athleteName ? r.athleteName.toLowerCase().trim() : (r.athleteId || 'inconnu');
    const key = `${athKey}_${cleanDisciplineBaseName(r.discipline).toLowerCase()}`;
    const currentBest = bestMap.get(key);
    if (currentBest === undefined || isBetterPerformance(r.performanceValue, currentBest, r.nature)) {
      bestMap.set(key, r.performanceValue);
    }
  }

  // 2ème passe: marquer isPersonalRecord en-place sans dupliquer les objets en mémoire (évite les crashs sur gros fichiers)
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r.vent !== null && r.vent !== undefined && r.vent > 2.0) {
      r.isPersonalRecord = false;
      continue;
    }
    const athKey = r.athleteName ? r.athleteName.toLowerCase().trim() : (r.athleteId || 'inconnu');
    const key = `${athKey}_${cleanDisciplineBaseName(r.discipline).toLowerCase()}`;
    const bestVal = bestMap.get(key);
    r.isPersonalRecord = bestVal !== undefined && Math.abs(r.performanceValue - bestVal) < 0.001;
  }

  return records;
}

// Calcul des statistiques par discipline
export interface DisciplineStats {
  discipline: string;
  nature: PerformanceNature;
  count: number;
  athletesCount: number;
  bestValue: number;
  bestDisplay: string;
  bestAthlete: string;
  averageValue: number;
  averageDisplay: string;
  medianValue: number;
  medianDisplay: string;
  seasons: number[];
}

export function computeDisciplineStats(records: PerformanceRecord[]): DisciplineStats[] {
  const grouped = new Map<string, PerformanceRecord[]>();
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const key = r.discipline;
    const list = grouped.get(key);
    if (!list) {
      grouped.set(key, [r]);
    } else {
      list.push(r);
    }
  }

  const results: DisciplineStats[] = [];

  grouped.forEach((list, discipline) => {
    if (list.length === 0) return;
    const nature = list[0].nature;
    const athleteSet = new Set<string>();
    const seasonSet = new Set<number>();
    let sum = 0;

    for (let i = 0; i < list.length; i++) {
      const rec = list[i];
      const athKey = rec.athleteName ? rec.athleteName.toLowerCase().trim() : (rec.athleteId || 'inconnu');
      athleteSet.add(athKey);
      seasonSet.add(rec.saison);
      sum += rec.performanceValue;
    }

    const seasons = Array.from(seasonSet).sort((a, b) => a - b);

    // Trier les valeurs : priorité absolue aux marques avec vent régulier (<= 2m/s) pour la meilleure marque référencée
    const sorted = [...list].sort((a, b) => {
      // Priorité au vent régulier si mesuré
      const wA = a.vent !== null && a.vent !== undefined ? a.vent : 0;
      const wB = b.vent !== null && b.vent !== undefined ? b.vent : 0;
      if (wA <= 2.0 && wB > 2.0) return -1;
      if (wA > 2.0 && wB <= 2.0) return 1;

      if (nature === 'time') return a.performanceValue - b.performanceValue;
      return b.performanceValue - a.performanceValue;
    });

    const bestRecord = sorted[0];
    const avg = sum / list.length;
    const median = sorted[Math.floor(sorted.length / 2)].performanceValue;

    results.push({
      discipline,
      nature,
      count: list.length,
      athletesCount: athleteSet.size,
      bestValue: bestRecord.performanceValue,
      bestDisplay: formatPerformanceDisplay(bestRecord.performanceValue, nature, discipline),
      bestAthlete: bestRecord.athleteName,
      averageValue: avg,
      averageDisplay: formatPerformanceDisplay(avg, nature, discipline),
      medianValue: median,
      medianDisplay: formatPerformanceDisplay(median, nature, discipline),
      seasons,
    });
  });

  return results.sort((a, b) => b.count - a.count);
}

// Distribution pour histogramme
export interface HistogramBin {
  rangeLabel: string;
  count: number;
  min: number;
  max: number;
}

export function generateHistogram(
  records: PerformanceRecord[], 
  discipline: string, 
  binCount: number = 7
): HistogramBin[] {
  const filtered = records.filter(r => r.discipline.toLowerCase() === discipline.toLowerCase() && r.performanceValue > 0);
  if (filtered.length === 0) return [];

  const nature = filtered[0].nature;
  const values = filtered.map(r => r.performanceValue);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  if (minVal === maxVal) {
    return [{
      rangeLabel: formatPerformanceDisplay(minVal, nature),
      count: filtered.length,
      min: minVal,
      max: maxVal
    }];
  }

  const step = (maxVal - minVal) / binCount;
  const bins: HistogramBin[] = [];

  for (let i = 0; i < binCount; i++) {
    const start = minVal + i * step;
    const end = i === binCount - 1 ? maxVal + 0.0001 : minVal + (i + 1) * step;
    const count = values.filter(v => v >= start && v < end).length;
    
    const label = `${formatPerformanceDisplay(start, nature)} - ${formatPerformanceDisplay(end, nature)}`;
    bins.push({
      rangeLabel: label,
      count,
      min: start,
      max: end
    });
  }

  return bins;
}

// Critères de filtrage pour le Bilan Annuel
export interface BilanFilterCriteria {
  discipline: string;
  seasonPeriod?: '2025-2026' | 'all' | 'custom' | string;
  startDate?: string;
  endDate?: string;
  sexe: 'ALL' | 'M' | 'F';
  categorie: 'ALL' | CategoryCode;
  structure: 'ALL' | 'EXTERIEUR' | 'SALLE';
  ventCondition: 'REGULIER' | 'TOUS'; // REGULIER = vent <= +2.0 m/s
  region: 'ALL' | string;
  departement: 'ALL' | string;
  club: 'ALL' | string;
  nationalite?: 'ALL' | string; // Tri par nationalité (colonne S nat_ath, ex: FRA)
  anneeNaissance?: 'ALL' | string | number; // Tri par année de naissance (colonne V annee_nais, ex: 2012)
  anneeAge?: 'ALL' | string | number; // Tri par année d'âge dans la catégorie (1, 2, 3 ou 'ALL')
  perfLimitPerAthlete?: number | 'ALL'; // Nombre de performances par athlète (1, 2, 3, 5, 10, 'ALL')
  perfCalcMode?: 'BEST' | 'AVERAGE'; // Mode de calcul : 'BEST' (Meilleure performance) ou 'AVERAGE' (Moyenne des performances)
  searchQuery?: string;
}

export interface RankedBilanEntry {
  rank: number;
  record: PerformanceRecord;
  perfCount?: number; // Nombre de performances de l'athlète prises en compte
  averageValue?: number; // Moyenne calculée (colonne K)
  averageDisplay?: string; // Formatage spécifique selon la discipline pour la moyenne
  bestValue?: number; // Meilleure perf individuelle (colonne K)
  bestDisplay?: string; // Colonne I fidèle de la meilleure performance
  isAverage?: boolean; // Vrai si cette ligne représente une moyenne
  allPerformances?: PerformanceRecord[]; // Détail des performances de l'athlète
}

/**
 * Récupère la valeur de la colonne K "perf_ajustee" pour la comparaison et le classement.
 * Dans la norme FFA Logica, des valeurs plus petites sont TOUJOURS meilleures pour toutes les disciplines.
 */
export function getPerfAjustee(r: PerformanceRecord): number {
  if (r.perf_ajustee !== undefined && !isNaN(r.perf_ajustee)) {
    return r.perf_ajustee;
  }
  const nature = getDisciplineNature(r.discipline);
  if (nature === 'time') {
    return r.performanceValue;
  }
  // Pour sauts/lancers et combinés, inversion pour que le tri croissant fonctionne universellement
  return -r.performanceValue;
}

/**
 * Formatage officiel demandé pour la moyenne des performances (colonne K):
 * - sprint et haies : mettre " avant les 2 derniers chiffres (ex: 756 -> 7"56)
 * - demi-fond et marche : ajouter " avant les 2 derniers chiffres et ' avant les 4 derniers chiffres (ex: 24853 -> 2'48''53)
 * - sauts et lancers : ajouter m avant les 2 derniers chiffres et enlever le signe - (ex: -192 -> 1m92)
 * - épreuves combinées et triathlons : ajouter pts et enlever le signe - (ex: -2685 -> 2 685pts)
 */
export function formatCalculatedAverage(avg: number, discipline: string): string {
  if (isNaN(avg) || avg === 0) return '-';
  const discLower = (discipline || '').toLowerCase();
  
  const isSautsLancers = discLower.includes('hauteur') || discLower.includes('longueur') || 
    discLower.includes('triple') || discLower.includes('perche') || discLower.includes('poids') || 
    discLower.includes('disque') || discLower.includes('javelot') || discLower.includes('marteau') || 
    discLower.includes('balle') || discLower.includes('vortex');

  const isCombines = discLower.includes('triathlon') || discLower.includes('pentathlon') || 
    discLower.includes('heptathlon') || discLower.includes('décathlon') || discLower.includes('decathlon') || 
    discLower.includes('combin');

  const isDemiFondMarche = discLower.includes('800m') || discLower.includes('1000m') || 
    discLower.includes('1500m') || discLower.includes('2000m') || discLower.includes('3000m') || 
    discLower.includes('5000m') || discLower.includes('10000m') || discLower.includes('semi') || 
    discLower.includes('marathon') || discLower.includes('marche') || discLower.includes('cross') || 
    discLower.includes('steeple');

  let absVal = Math.abs(avg);

  if (isCombines) {
    const pts = Math.round(absVal);
    return `${pts.toLocaleString('fr-FR')}pts`;
  }

  if (isSautsLancers) {
    if (absVal < 100 && absVal > 0) {
      absVal = absVal * 100;
    }
    const valRounded = Math.round(absVal);
    const s = valRounded.toString();
    if (s.length <= 2) {
      return `0m${s.padStart(2, '0')}`;
    }
    const metres = s.slice(0, -2);
    const centiemes = s.slice(-2);
    return `${metres}m${centiemes}`;
  }

  if (isDemiFondMarche) {
    let valRounded = Math.round(absVal);
    const s = valRounded.toString();
    if (s.length <= 2) {
      return `0''${s.padStart(2, '0')}`;
    }
    if (s.length <= 4) {
      const sec = s.slice(0, -2);
      const cent = s.slice(-2);
      return `${sec}''${cent}`;
    }
    const minutes = s.slice(0, -4);
    const secondes = s.slice(-4, -2);
    const centiemes = s.slice(-2);
    return `${minutes}'${secondes}''${centiemes}`;
  }

  // Par défaut: sprint et haies
  if (absVal < 100 && absVal > 0) {
    absVal = absVal * 100;
  }
  const valRounded = Math.round(absVal);
  const s = valRounded.toString();
  if (s.length <= 2) {
    return `0"${s.padStart(2, '0')}`;
  }
  const sec = s.slice(0, -2);
  const cent = s.slice(-2);
  return `${sec}"${cent}`;
}

/**
 * Ensemble officiel des codes épreuves FFA spécifiques aux compétitions en Salle (Indoor)
 * Colonne G "code_ep" dans les fichiers Logica / SIFFA.
 */
export const FFA_INDOOR_CODES = new Set<string>([
  '105', '106', '107', '121', '141', '209', '211', '216', '221', '231', '241',
  '301', '302', '304', '305', '306', '307', '309', '317', '322', '323',
  '511', '512', '513', '514',
  '651', '652', '653', '654', '655', '656', '657',
  '714', '716', '721', '722', '723', '724', '725', '733', '734', '735', '741', '742',
  '798', '902', '904', '906', '952', '953', '955'
]);

/**
 * Détecte si un code épreuve correspond de manière certaine à une épreuve en salle FFA
 */
export function isFFAOfficialIndoorCode(code?: string | number | null): boolean {
  if (code === undefined || code === null) return false;
  const cleanCode = String(code).trim().replace(/^0+/, '');
  return FFA_INDOOR_CODES.has(cleanCode);
}

/**
 * Détecte infailliblement si une performance ou ligne de bilan a été réalisée en salle
 */
export function isIndoorRecord(
  discipline?: string | null,
  codeEp?: string | number | null,
  structure?: string | null,
  sourceFile?: string | null,
  lieu?: string | null,
  compet?: string | null,
  epLogica?: string | null
): boolean {
  // 1. Code épreuve officiel prioritaire
  if (isFFAOfficialIndoorCode(codeEp)) return true;

  // 2. Discipline strictement en salle (ex: 60m, 60m haies, pentathlon)
  const disc = (discipline || '').toLowerCase().trim();
  const baseName = cleanDisciplineBaseName(disc);
  if (baseName === '60m' || baseName === '60m haies' || disc.startsWith('60m ') || disc.startsWith('pentathlon')) {
    return true;
  }
  if (/\b(salle|indoor|sh|sf)\b/i.test(disc)) return true;

  // 3. Mention de salle dans ep_logica FFA Logica (ex: "60m - Salle", "SH", "SF")
  const epLog = (epLogica || '').toLowerCase().trim();
  if (epLog.includes('salle') || epLog.includes('indoor') || epLog.startsWith('sh') || epLog.startsWith('sf')) {
    return true;
  }

  // 4. Structure déclarée
  if (structure === 'SALLE') return true;

  // 5. Mention explicite dans le nom de compétition ou lieu (si non contredit par épreuve exclusivement extérieure)
  const isOutdoorOnly = disc.includes('100m') || disc.includes('disque') || disc.includes('javelot') || disc.includes('marteau') || disc.includes('steeple') || disc.includes('décathlon') || disc.includes('decathlon');
  if (!isOutdoorOnly) {
    const comp = (compet || '').toLowerCase();
    const pl = (lieu || '').toLowerCase();
    if (comp.includes('salle') || comp.includes('indoor') || pl.includes('salle') || pl.includes('indoor') || pl.includes('halle') || pl.includes('stadium')) {
      return true;
    }
  }

  // 6. Nom de fichier source
  const src = (sourceFile || '').toLowerCase();
  if ((src.includes('salle') || src.includes('indoor')) && !src.includes('piste')) return true;

  return false;
}

// Nettoie un nom d'épreuve pour comparaison (retire " - Salle", " Salle", " Indoor", " - Piste", " Piste", "-105", etc.)
export function cleanDisciplineBaseName(disc: string): string {
  if (!disc) return '';
  return disc
    .replace(/\s*-\s*(salle|indoor|plein\s*air|piste)\b/gi, '')
    .replace(/\s+(salle|indoor|plein\s*air|piste)\b/gi, '')
    .replace(/-\d+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Vérifie la correspondance d'une discipline en tenant compte des codes FFA (colonne G code_ep, ex: 110 pour 100m, 107 pour 60m salle)
// et des formats d'épreuves (ex: "100m-110", "60m salle-107" ou "Hauteur-501")
export function matchDiscipline(
  recordDiscipline: string,
  recordCodeEp: string | number | undefined,
  recordStructure: string | undefined,
  targetDiscipline: string
): boolean {
  if (!targetDiscipline || targetDiscipline.trim().toLowerCase() === 'all') return true;
  const target = targetDiscipline.trim();
  const recDisc = (recordDiscipline || '').trim();

  const cleanTarget = cleanDisciplineBaseName(target);
  const cleanRec = cleanDisciplineBaseName(recDisc);

  // 1. Extraire ou résoudre le code_ep de l'épreuve cible
  let targetCode = target.match(/-(\d+)$/)?.[1];
  if (!targetCode) {
    if (cleanTarget === '100m') targetCode = '110';
    else if (cleanTarget === '60m') targetCode = '107';
    else if (cleanTarget === '50m') targetCode = /\b(salle|indoor)\b/i.test(target) ? '105' : '104';
    else if (cleanTarget === '80m') targetCode = '108';
    else if (cleanTarget === '120m') targetCode = '109';
    else if (cleanTarget === 'longueur') targetCode = /\b(salle|indoor)\b/i.test(target) ? '513' : '503';
    else if (cleanTarget === 'hauteur') targetCode = /\b(salle|indoor)\b/i.test(target) ? '511' : '501';
    else if (cleanTarget === 'perche') targetCode = /\b(salle|indoor)\b/i.test(target) ? '512' : '502';
    else if (cleanTarget === 'triple saut') targetCode = /\b(salle|indoor)\b/i.test(target) ? '514' : '504';
  }

  // Normalisation du code épreuve du record sans zéros de tête
  const recCode = (recordCodeEp !== undefined && recordCodeEp !== null) 
    ? String(recordCodeEp).trim().replace(/^0+/, '') 
    : null;
  const normTargetCode = targetCode ? targetCode.trim().replace(/^0+/, '') : null;

  // 2. Vérification stricte des environnements (Salle vs Plein Air)
  // RÈGLE FÉDÉRALE : Le 100m, 80m, 120m n'existent JAMAIS en salle
  const isOutdoorOnly = cleanTarget === '100m' || cleanTarget === '80m' || cleanTarget === '120m' || normTargetCode === '110' || normTargetCode === '108' || normTargetCode === '109';
  const isIndoorOnly = cleanTarget === '60m' || normTargetCode === '106' || normTargetCode === '107';

  const isTargetSalle = isFFAOfficialIndoorCode(normTargetCode) || (!isOutdoorOnly && (/\b(salle|indoor)\b/i.test(target) || isIndoorOnly));
  const isTargetPleinAir = isOutdoorOnly || /\bplein\s*air\b/i.test(target) || (!isTargetSalle && !/\b(salle|indoor)\b/i.test(target));
  const isRecordSalle = isIndoorRecord(recDisc, recCode, recordStructure);

  if (isOutdoorOnly && isRecordSalle) return false;
  if (isIndoorOnly && !isRecordSalle) return false;
  if (isTargetSalle && !isRecordSalle) return false;
  if (isTargetPleinAir && isRecordSalle && !isTargetSalle) return false;

  // 3. RÈGLE STRICTE 100m : Seules les performances liées au code épreuve 110 (Plein Air) sont acceptées
  if (normTargetCode === '110' || cleanTarget === '100m') {
    if (!recCode || recCode !== '110') return false;
    if (isRecordSalle) return false;
    if (cleanRec && cleanRec !== '100m') return false;
    return true;
  }

  // 4. Correspondance stricte par code_ep officiel
  if (normTargetCode) {
    if (!recCode) {
      // Si pas de code_ep dans le record, comparer sur le nom et la structure
      if (cleanTarget === cleanRec && isTargetSalle === isRecordSalle) return true;
      return false;
    }
    if (recCode === normTargetCode) return true;

    // Équivalences officielles FFA (ex: 60m salle codé 106 dans Logica vs 107 dans la nomenclature officielle)
    if ((normTargetCode === '106' || normTargetCode === '107') && (recCode === '106' || recCode === '107') && isRecordSalle) return true;
    if ((normTargetCode === '208' || normTargetCode === '120' || normTargetCode === '200') && (recCode === '208' || recCode === '120' || recCode === '200') && !isRecordSalle) return true;
    if ((normTargetCode === '209' || normTargetCode === '121' || normTargetCode === '200') && (recCode === '209' || recCode === '121' || recCode === '200') && isRecordSalle) return true;
    if ((normTargetCode === '210' || normTargetCode === '211') && (recCode === '210' || recCode === '211')) {
      if (isTargetSalle === isRecordSalle) return true;
    }
    if (['116', '301', '302', '304', '305', '306', '307', '309', '317', '322', '323'].includes(normTargetCode) && 
        ['116', '301', '302', '304', '305', '306', '307', '309', '317', '322', '323'].includes(recCode) && isRecordSalle) {
      if (cleanTarget === cleanRec || cleanTarget.includes('haie') === cleanRec.includes('haie')) return true;
    }
    if ((normTargetCode === '280' || normTargetCode === '430' || normTargetCode === '431') && (recCode === '280' || recCode === '430' || recCode === '431') && !isRecordSalle) return true;
    if ((normTargetCode === '798' || normTargetCode === '795') && (recCode === '798' || recCode === '795')) {
      if (isTargetSalle === isRecordSalle) return true;
    }
    // Lancers (Poids, Disque, Marteau, Javelot)
    if (['601', '602', '603', '604', '605', '606', '607', '608', '610', '612', '615', '616'].includes(normTargetCode)) {
      if (cleanTarget === cleanRec && !isRecordSalle) return true;
    }
    if (['651', '652', '653', '654', '655', '656', '657'].includes(normTargetCode)) {
      if (cleanTarget === cleanRec && isRecordSalle) return true;
    }
    // Sauts (Hauteur 501/511, Perche 502/512, Longueur 503/513, Triple Saut 504/514)
    if (cleanTarget === cleanRec && isTargetSalle === isRecordSalle) {
      return true;
    }
    // Épreuves combinées
    if (['714', '716', '721', '722', '723', '724', '725', '733', '734', '735', '741', '742'].includes(normTargetCode) && 
        ['714', '716', '721', '722', '723', '724', '725', '733', '734', '735', '741', '742'].includes(recCode) && isRecordSalle) return true;

    // Si la cible possède un code épreuve et qu'aucune correspondance/équivalence n'est vérifiée, rejet impératif !
    return false;
  }

  // 5. Comparaison des noms de base nettoyés
  if (cleanTarget === cleanRec && isTargetSalle === isRecordSalle) return true;
  if (recDisc.toLowerCase() === target.toLowerCase()) return true;

  return false;
}

// Helper de normalisation département (ex: "6" -> "06")
function normalizeDptCode(d?: string | number): string {
  if (!d) return '';
  const s = String(d).trim();
  if (/^\d$/.test(s)) return '0' + s;
  return s.toUpperCase();
}

// Calcul du Bilan Annuel officiel :
// - Filtre par période (ex: 1er sept 2025 au 31 août 2026)
// - Discipline ciblée (ou toutes si 'all')
// - Filtre sexe (Hommes / Femmes / Tous)
// - Filtre catégorie (Benjamin à Master)
// - Filtre plein air / en salle
// - Filtre vent (Régulier <= 2m/s vs Tous vents)
// - Règle stricte : 1 seule performance par athlète par discipline (la meilleure de sa saison !)
// - Un même athlète peut apparaître dans plusieurs disciplines différentes
export function computeAnnualBilan(
  records: PerformanceRecord[],
  criteria: BilanFilterCriteria
): RankedBilanEntry[] {
  const targetDiscipline = (criteria.discipline || '100m').trim();
  const nature = getDisciplineNature(targetDiscipline);

  // Pré-calculs optimisés hors-boucle pour une vitesse d'exécution instantanée
  let seasonStartStr: string | null = null;
  let seasonEndStr: string | null = null;
  let seasonEndYearNum: number | null = null;
  let seasonCustomStart: string | null = null;
  let seasonCustomEnd: string | null = null;
  let seasonNumeric: number | null = null;

  if (criteria.seasonPeriod && criteria.seasonPeriod !== 'all') {
    if (typeof criteria.seasonPeriod === 'string') {
      const seasonMatch = criteria.seasonPeriod.match(/^(\d{4})-(\d{4})$/);
      if (seasonMatch) {
        seasonStartStr = `${seasonMatch[1]}-09-01`;
        seasonEndStr = `${seasonMatch[2]}-08-31`;
        seasonEndYearNum = parseInt(seasonMatch[2], 10);
      } else if (criteria.seasonPeriod === 'custom' && criteria.startDate && criteria.endDate) {
        seasonCustomStart = criteria.startDate;
        seasonCustomEnd = criteria.endDate;
      }
    } else if (typeof criteria.seasonPeriod === 'number') {
      seasonNumeric = criteria.seasonPeriod;
    }
  }

  const critSexe = criteria.sexe && criteria.sexe !== 'ALL' ? criteria.sexe.toUpperCase().trim() : null;
  const critCat = criteria.categorie && criteria.categorie !== 'ALL' ? criteria.categorie : null;
  const critStructure = criteria.structure && criteria.structure !== 'ALL' ? criteria.structure : null;
  const checkVentRegular = criteria.ventCondition === 'REGULIER';
  const critRegion = criteria.region && criteria.region !== 'ALL' ? criteria.region.toLowerCase().trim() : null;
  const critDpt = criteria.departement && criteria.departement !== 'ALL' ? normalizeDptCode(criteria.departement) : null;
  const critClub = criteria.club && criteria.club !== 'ALL' ? criteria.club.toLowerCase().trim() : null;
  const critNat = criteria.nationalite && criteria.nationalite !== 'ALL' ? criteria.nationalite.toUpperCase().trim() : null;
  const critBirthYear = criteria.anneeNaissance && criteria.anneeNaissance !== 'ALL' ? String(criteria.anneeNaissance).trim() : null;
  const targetYearInCat = criteria.anneeAge && criteria.anneeAge !== 'ALL' ? parseInt(String(criteria.anneeAge), 10) : null;
  const seasonTarget = seasonEndYearNum || undefined;
  const searchQueryLower = criteria.searchQuery && criteria.searchQuery.trim().length > 0 ? criteria.searchQuery.toLowerCase().trim() : null;

  // 1. Filtrer les enregistrements bruts éligibles
  const eligibleRecords = records.filter(r => {
    // Sexe en premier (rejet rapide très économique)
    if (critSexe && r.sexe !== critSexe) {
      return false;
    }

    // Structure
    if (critStructure && (r.structure || 'EXTERIEUR') !== critStructure) {
      return false;
    }

    // Catégorie
    if (critCat && normalizeCategory(r.categorie) !== critCat) {
      return false;
    }

    // Discipline avec prise en charge du code_ep (colonne G) et du format "50m salle-105"
    if (!matchDiscipline(r.discipline, r.code_ep, r.structure, targetDiscipline)) {
      return false;
    }

    // Période annuelle ou saison ciblée
    if (seasonStartStr && seasonEndStr) {
      const isInDateRange = r.date && r.date >= seasonStartStr && r.date <= seasonEndStr;
      const isSeason = r.saison === seasonEndYearNum || r.saisonLabel === criteria.seasonPeriod;
      if (!isInDateRange && !isSeason) {
        return false;
      }
    } else if (seasonCustomStart && seasonCustomEnd) {
      if (r.date && (r.date < seasonCustomStart || r.date > seasonCustomEnd)) {
        return false;
      }
    } else if (seasonNumeric !== null) {
      if (r.saison !== seasonNumeric) return false;
    }

    // Vent (Si 'REGULIER', rejeter toute perf avec vent mesuré > 2.0 m/s)
    if (checkVentRegular) {
      const windActive = isWindMeasured(r.discipline, r.structure);
      if (windActive && r.vent !== undefined && r.vent !== null && r.vent > 2.0) {
        return false;
      }
    }

    // Région (colonne AA "lig_club")
    if (critRegion) {
      const recRegion = (r.region || '').toLowerCase().trim();
      if (recRegion !== critRegion && !recRegion.includes(critRegion) && !critRegion.includes(recRegion)) {
        return false;
      }
    }

    // Département (colonne Z "dpt_club")
    if (critDpt) {
      const recDpt = normalizeDptCode(r.departement);
      if (recDpt !== critDpt) {
        return false;
      }
    }

    // Club (colonne Y "nom_club")
    if (critClub) {
      const recClub = (r.club || '').toLowerCase().trim();
      if (!recClub.includes(critClub) && !critClub.includes(recClub)) {
        return false;
      }
    }

    // Nationalité (colonne S nat_ath)
    if (critNat) {
      const nat = (r.nationalite || 'FRA').toUpperCase().trim();
      if (nat !== critNat) {
        return false;
      }
    }

    // Année de naissance (colonne V annee_nais)
    if (critBirthYear) {
      const rYear = r.annee_nais ? String(r.annee_nais).trim() : '';
      if (rYear && rYear !== critBirthYear) {
        return false;
      }
    }

    // Année d'âge dans la catégorie (1, 2, 3, ..., 12)
    if (targetYearInCat !== null && !isNaN(targetYearInCat)) {
      const yr = getAthleteYearInCategory(r, seasonTarget);
      if (yr === undefined || yr !== targetYearInCat) {
        return false;
      }
    }

    // Recherche libre (nom, prénom, entraîneur, club)
    if (searchQueryLower) {
      const match =
        (r.athleteName && r.athleteName.toLowerCase().includes(searchQueryLower)) ||
        (r.club && r.club.toLowerCase().includes(searchQueryLower)) ||
        (r.entraineur && r.entraineur.toLowerCase().includes(searchQueryLower));
      if (!match) return false;
    }

    return true;
  });

  // 2. REGROUPEMENT PAR ATHLÈTE DANS LA DISCIPLINE
  const athleteRecordsMap = new Map<string, PerformanceRecord[]>();

  eligibleRecords.forEach(r => {
    // Clé unique de l'athlète dans cette discipline (regroupement par nom normalisé pour garantir 1 athlète unique)
    const athleteKey = r.athleteName ? r.athleteName.toLowerCase().trim() : (r.athleteId || 'inconnu');
    if (!athleteRecordsMap.has(athleteKey)) {
      athleteRecordsMap.set(athleteKey, []);
    }
    athleteRecordsMap.get(athleteKey)!.push(r);
  });

  // 3. TRAITEMENT SELON LE MODE PERFORMANCE (Meilleure vs Moyenne) ET NOMBRE DE PERFORMANCES RETENUES
  const isAverageMode = criteria.perfCalcMode === 'AVERAGE';
  const perfLimit = criteria.perfLimitPerAthlete === 'ALL' || !criteria.perfLimitPerAthlete ? 9999 : Number(criteria.perfLimitPerAthlete);

  const rawBilanEntries: Array<{
    record: PerformanceRecord;
    perfCount: number;
    averageValue?: number;
    averageDisplay?: string;
    bestValue?: number;
    bestDisplay?: string;
    isAverage: boolean;
    allPerformances: PerformanceRecord[];
  }> = [];

  athleteRecordsMap.forEach((athletePerfs) => {
    // Trier les performances de l'athlète de la meilleure à la moins bonne selon la colonne K "perf_ajustee"
    // Règle officielle : priorité à une performance réalisée avec vent régulier (<= +2.0 m/s)
    athletePerfs.sort((a, b) => {
      const windActive = isWindMeasured(a.discipline, a.structure);
      if (windActive) {
        const wA = (a.vent !== null && a.vent !== undefined) ? a.vent : 0;
        const wB = (b.vent !== null && b.vent !== undefined) ? b.vent : 0;
        const isRegA = wA <= 2.0;
        const isRegB = wB <= 2.0;
        if (isRegA && !isRegB) return -1;
        if (!isRegA && isRegB) return 1;
      }

      const pA = getPerfAjustee(a);
      const pB = getPerfAjustee(b);
      if (pA !== pB) return pA - pB;
      return a.date.localeCompare(b.date);
    });

    // Limiter le nombre de performances par athlète à prendre en compte dans le calcul
    // En mode moyenne, 1 performance n'est pas applicable (cela reviendrait à la meilleure perf), on retient toutes les perfs disponibles
    const effectiveLimit = (isAverageMode && perfLimit === 1) ? 9999 : perfLimit;
    const retainedPerfs = athletePerfs.slice(0, Math.max(1, effectiveLimit));

    if (isAverageMode) {
      // MODE MOYENNE DES PERFORMANCES D'UN MÊME ATHLÈTE (moyenne de la colonne K "perf_ajustee")
      const sum = retainedPerfs.reduce((acc, p) => acc + getPerfAjustee(p), 0);
      const avg = sum / retainedPerfs.length;
      const avgDisplay = formatCalculatedAverage(avg, targetDiscipline);
      const bestRecord = retainedPerfs[0];
      const bestDisplay = formatPerformanceDisplay(bestRecord.performanceValue, bestRecord.nature, targetDiscipline || bestRecord.discipline);

      rawBilanEntries.push({
        record: {
          ...bestRecord,
          performanceValue: avg,
          performanceDisplay: avgDisplay,
          perf_formatee: avgDisplay,
          perf_ajustee: avg,
          isPersonalRecord: false, // Une moyenne n'est jamais un record personnel
        },
        perfCount: retainedPerfs.length,
        averageValue: avg,
        averageDisplay: avgDisplay,
        bestValue: getPerfAjustee(bestRecord),
        bestDisplay: bestDisplay,
        isAverage: true,
        allPerformances: retainedPerfs,
      });
    } else {
      // MODE MEILLEURE PERFORMANCE PAR ATHLÈTE (affichage fidèle selon les règles bilans)
      if (perfLimit === 1) {
        // Mode officiel FFA : 1 seule meilleure performance retenue par athlète
        const bestRecord = retainedPerfs[0];
        const display = formatPerformanceDisplay(bestRecord.performanceValue, bestRecord.nature, targetDiscipline || bestRecord.discipline);
        const isHomologuePB = Boolean(bestRecord.isPersonalRecord && (bestRecord.vent === null || bestRecord.vent === undefined || bestRecord.vent <= 2.0));

        rawBilanEntries.push({
          record: {
            ...bestRecord,
            performanceDisplay: display,
            isPersonalRecord: isHomologuePB,
          },
          perfCount: athletePerfs.length,
          bestValue: getPerfAjustee(bestRecord),
          bestDisplay: display,
          isAverage: false,
          allPerformances: retainedPerfs,
        });
      } else {
        // Affichage des N meilleures performances retenues de chaque athlète
        retainedPerfs.forEach(p => {
          const display = formatPerformanceDisplay(p.performanceValue, p.nature, targetDiscipline || p.discipline);
          const isHomologuePB = Boolean(p.isPersonalRecord && (p.vent === null || p.vent === undefined || p.vent <= 2.0));
          rawBilanEntries.push({
            record: {
              ...p,
              performanceDisplay: display,
              isPersonalRecord: isHomologuePB,
            },
            perfCount: athletePerfs.length,
            bestValue: getPerfAjustee(retainedPerfs[0]),
            bestDisplay: formatPerformanceDisplay(retainedPerfs[0].performanceValue, retainedPerfs[0].nature, targetDiscipline || retainedPerfs[0].discipline),
            isAverage: false,
            allPerformances: retainedPerfs,
          });
        });
      }
    }
  });

  // 4. TRI FINAL DES ENTRÉES PAR PERFORMANCE (colonne K "perf_ajustee" croissant pour tous les athlètes)
  rawBilanEntries.sort((a, b) => {
    const valA = isAverageMode ? (a.averageValue ?? 0) : getPerfAjustee(a.record);
    const valB = isAverageMode ? (b.averageValue ?? 0) : getPerfAjustee(b.record);
    if (valA !== valB) return valA - valB;
    return a.record.date.localeCompare(b.record.date);
  });

  // 5. ATTRIBUTION DES RANGS (1, 2, 3...) AVEC GESTION DES EX-AEQUO
  const rankedEntries: RankedBilanEntry[] = [];
  let currentRank = 1;

  for (let i = 0; i < rawBilanEntries.length; i++) {
    const item = rawBilanEntries[i];
    if (i > 0) {
      const prev = rawBilanEntries[i - 1];
      const valItem = isAverageMode ? (item.averageValue ?? 0) : getPerfAjustee(item.record);
      const valPrev = isAverageMode ? (prev.averageValue ?? 0) : getPerfAjustee(prev.record);
      if (Math.abs(valItem - valPrev) < 0.001) {
        rankedEntries.push({
          rank: rankedEntries[i - 1].rank,
          record: item.record,
          perfCount: item.perfCount,
          averageValue: item.averageValue,
          averageDisplay: item.averageDisplay,
          bestValue: item.bestValue,
          bestDisplay: item.bestDisplay,
          isAverage: item.isAverage,
          allPerformances: item.allPerformances,
        });
        continue;
      } else {
        currentRank = i + 1;
      }
    }
    rankedEntries.push({
      rank: currentRank,
      record: item.record,
      perfCount: item.perfCount,
      averageValue: item.averageValue,
      averageDisplay: item.averageDisplay,
      bestValue: item.bestValue,
      bestDisplay: item.bestDisplay,
      isAverage: item.isAverage,
      allPerformances: item.allPerformances,
    });
  }

  return rankedEntries;
}
