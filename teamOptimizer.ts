import { CategoryCode, PerformanceRecord } from '../types/athletics';
import { 
  CompetitionRules, 
  CompetitionType, 
  EventCompositionSlot, 
  TeamCompositionResult,
  AssignedAthleteSlot
} from '../types/teamComposition';
import { normalizeCategory, cleanDisciplineName } from './performanceUtils';

// Épreuves officielles par type de compétition
const STANDARD_INTERCLUBS_EVENTS: { sexe: 'M' | 'F'; discipline: string; family: any }[] = [
  // Hommes - Courses
  { sexe: 'M', discipline: '100m', family: 'Sprint' },
  { sexe: 'M', discipline: '200m', family: 'Sprint' },
  { sexe: 'M', discipline: '400m', family: 'Sprint' },
  { sexe: 'M', discipline: '800m', family: 'Demi-fond' },
  { sexe: 'M', discipline: '1500m', family: 'Demi-fond' },
  { sexe: 'M', discipline: '3000m', family: 'Demi-fond' },
  { sexe: 'M', discipline: '5000m', family: 'Demi-fond' },
  { sexe: 'M', discipline: '110m Haies', family: 'Haies' },
  { sexe: 'M', discipline: '400m Haies', family: 'Haies' },
  { sexe: 'M', discipline: '3000m Steeple', family: 'Demi-fond' },
  { sexe: 'M', discipline: '5000m Marche', family: 'Marche' },
  // Hommes - Concours
  { sexe: 'M', discipline: 'Hauteur', family: 'Sauts' },
  { sexe: 'M', discipline: 'Perche', family: 'Sauts' },
  { sexe: 'M', discipline: 'Longueur', family: 'Sauts' },
  { sexe: 'M', discipline: 'Triple Saut', family: 'Sauts' },
  { sexe: 'M', discipline: 'Poids', family: 'Lancers' },
  { sexe: 'M', discipline: 'Disque', family: 'Lancers' },
  { sexe: 'M', discipline: 'Marteau', family: 'Lancers' },
  { sexe: 'M', discipline: 'Javelot', family: 'Lancers' },

  // Femmes - Courses
  { sexe: 'F', discipline: '100m', family: 'Sprint' },
  { sexe: 'F', discipline: '200m', family: 'Sprint' },
  { sexe: 'F', discipline: '400m', family: 'Sprint' },
  { sexe: 'F', discipline: '800m', family: 'Demi-fond' },
  { sexe: 'F', discipline: '1500m', family: 'Demi-fond' },
  { sexe: 'F', discipline: '3000m', family: 'Demi-fond' },
  { sexe: 'F', discipline: '100m Haies', family: 'Haies' },
  { sexe: 'F', discipline: '400m Haies', family: 'Haies' },
  { sexe: 'F', discipline: '3000m Steeple', family: 'Demi-fond' },
  { sexe: 'F', discipline: '3000m Marche', family: 'Marche' },
  // Femmes - Concours
  { sexe: 'F', discipline: 'Hauteur', family: 'Sauts' },
  { sexe: 'F', discipline: 'Perche', family: 'Sauts' },
  { sexe: 'F', discipline: 'Longueur', family: 'Sauts' },
  { sexe: 'F', discipline: 'Triple Saut', family: 'Sauts' },
  { sexe: 'F', discipline: 'Poids', family: 'Lancers' },
  { sexe: 'F', discipline: 'Disque', family: 'Lancers' },
  { sexe: 'F', discipline: 'Marteau', family: 'Lancers' },
  { sexe: 'F', discipline: 'Javelot', family: 'Lancers' },
];

const EQUIP_ATHLE_BE_EVENTS: { sexe: 'M' | 'F'; discipline: string; family: any }[] = [
  { sexe: 'F', discipline: '50m', family: 'Sprint' },
  { sexe: 'F', discipline: '50m Haies', family: 'Haies' },
  { sexe: 'F', discipline: '1000m', family: 'Demi-fond' },
  { sexe: 'F', discipline: '2000m Marche', family: 'Marche' },
  { sexe: 'F', discipline: 'Hauteur', family: 'Sauts' },
  { sexe: 'F', discipline: 'Perche', family: 'Sauts' },
  { sexe: 'F', discipline: 'Longueur', family: 'Sauts' },
  { sexe: 'F', discipline: 'Triple Saut', family: 'Sauts' },
  { sexe: 'F', discipline: 'Poids', family: 'Lancers' },
  { sexe: 'F', discipline: 'Disque', family: 'Lancers' },
  { sexe: 'F', discipline: 'Marteau', family: 'Lancers' },
  { sexe: 'F', discipline: 'Javelot', family: 'Lancers' },

  { sexe: 'M', discipline: '50m', family: 'Sprint' },
  { sexe: 'M', discipline: '50m Haies', family: 'Haies' },
  { sexe: 'M', discipline: '1000m', family: 'Demi-fond' },
  { sexe: 'M', discipline: '2000m Marche', family: 'Marche' },
  { sexe: 'M', discipline: 'Hauteur', family: 'Sauts' },
  { sexe: 'M', discipline: 'Perche', family: 'Sauts' },
  { sexe: 'M', discipline: 'Longueur', family: 'Sauts' },
  { sexe: 'M', discipline: 'Triple Saut', family: 'Sauts' },
  { sexe: 'M', discipline: 'Poids', family: 'Lancers' },
  { sexe: 'M', discipline: 'Disque', family: 'Lancers' },
  { sexe: 'M', discipline: 'Marteau', family: 'Lancers' },
  { sexe: 'M', discipline: 'Javelot', family: 'Lancers' },
];

const EQUIP_ATHLE_MI_EVENTS: { sexe: 'M' | 'F'; discipline: string; family: any }[] = [
  { sexe: 'F', discipline: '80m', family: 'Sprint' },
  { sexe: 'F', discipline: '120m', family: 'Sprint' },
  { sexe: 'F', discipline: '1000m', family: 'Demi-fond' },
  { sexe: 'F', discipline: '2000m', family: 'Demi-fond' },
  { sexe: 'F', discipline: '80m Haies', family: 'Haies' },
  { sexe: 'F', discipline: '200m Haies', family: 'Haies' },
  { sexe: 'F', discipline: '3000m Marche', family: 'Marche' },
  { sexe: 'F', discipline: 'Hauteur', family: 'Sauts' },
  { sexe: 'F', discipline: 'Perche', family: 'Sauts' },
  { sexe: 'F', discipline: 'Longueur', family: 'Sauts' },
  { sexe: 'F', discipline: 'Triple Saut', family: 'Sauts' },
  { sexe: 'F', discipline: 'Poids', family: 'Lancers' },
  { sexe: 'F', discipline: 'Disque', family: 'Lancers' },
  { sexe: 'F', discipline: 'Marteau', family: 'Lancers' },
  { sexe: 'F', discipline: 'Javelot', family: 'Lancers' },

  { sexe: 'M', discipline: '80m', family: 'Sprint' },
  { sexe: 'M', discipline: '120m', family: 'Sprint' },
  { sexe: 'M', discipline: '1000m', family: 'Demi-fond' },
  { sexe: 'M', discipline: '2000m', family: 'Demi-fond' },
  { sexe: 'M', discipline: '100m Haies', family: 'Haies' },
  { sexe: 'M', discipline: '200m Haies', family: 'Haies' },
  { sexe: 'M', discipline: '3000m Marche', family: 'Marche' },
  { sexe: 'M', discipline: 'Hauteur', family: 'Sauts' },
  { sexe: 'M', discipline: 'Perche', family: 'Sauts' },
  { sexe: 'M', discipline: 'Longueur', family: 'Sauts' },
  { sexe: 'M', discipline: 'Triple Saut', family: 'Sauts' },
  { sexe: 'M', discipline: 'Poids', family: 'Lancers' },
  { sexe: 'M', discipline: 'Disque', family: 'Lancers' },
  { sexe: 'M', discipline: 'Marteau', family: 'Lancers' },
  { sexe: 'M', discipline: 'Javelot', family: 'Lancers' },
];

export const COMPETITION_PRESETS: Record<CompetitionType, CompetitionRules> = {
  CHAMPIONNAT_FRANCE_CLUBS: {
    id: 'CHAMPIONNAT_FRANCE_CLUBS',
    name: 'Championnat de France des clubs (Interclubs)',
    description: 'Toutes catégories (Cadets à Masters), 2 athlètes par épreuve (ou 1 en N2/R), programme complet FFA.',
    badge: 'Toutes Catégories (CA à MA)',
    defaultGenderMode: 'MIXED',
    eligibleCategories: ['CA', 'JU', 'ES', 'SE', 'MA'],
    athletesPerEvent: 2,
    maxEventsPerAthlete: 2,
    allowDouble: true,
    doubleRulesDescription: 'Max 2 épreuves individuelles (doublé possible : course + concours ou 2 concours). Pas de double demi-fond long.',
    eventsList: STANDARD_INTERCLUBS_EVENTS,
  },
  INTERCLUBS_AVENIR_U23_N1: {
    id: 'INTERCLUBS_AVENIR_U23_N1',
    name: 'Interclubs Avenir U23 N1',
    description: 'Catégories U23 (Cadets, Juniors, Espoirs), 2 athlètes par épreuve, Division Nationale 1.',
    badge: 'U23 N1 (CA, JU, ES · 2 athlètes/épreuve)',
    defaultGenderMode: 'MIXED',
    eligibleCategories: ['CA', 'JU', 'ES'],
    athletesPerEvent: 2,
    maxEventsPerAthlete: 2,
    allowDouble: true,
    doubleRulesDescription: 'Max 2 épreuves individuelles (1 course + 1 concours ou 2 concours).',
    eventsList: STANDARD_INTERCLUBS_EVENTS,
  },
  INTERCLUBS_AVENIR_U23_N2: {
    id: 'INTERCLUBS_AVENIR_U23_N2',
    name: 'Interclubs Avenir U23 N2',
    description: 'Catégories U23 (Cadets, Juniors, Espoirs), 1 athlète par épreuve, Division Nationale 2.',
    badge: 'U23 N2 (CA, JU, ES · 1 athlète/épreuve)',
    defaultGenderMode: 'MIXED',
    eligibleCategories: ['CA', 'JU', 'ES'],
    athletesPerEvent: 1,
    maxEventsPerAthlete: 2,
    allowDouble: true,
    doubleRulesDescription: 'Max 2 épreuves individuelles par athlète.',
    eventsList: STANDARD_INTERCLUBS_EVENTS,
  },
  INTERCLUBS_AVENIR_U20_N1: {
    id: 'INTERCLUBS_AVENIR_U20_N1',
    name: 'Interclubs Avenir U20 N1',
    description: 'Catégories U20 (Cadets et Juniors), 2 athlètes par épreuve, Division Nationale 1.',
    badge: 'U20 N1 (CA, JU · 2 athlètes/épreuve)',
    defaultGenderMode: 'MIXED',
    eligibleCategories: ['CA', 'JU'],
    athletesPerEvent: 2,
    maxEventsPerAthlete: 2,
    allowDouble: true,
    doubleRulesDescription: 'Max 2 épreuves individuelles (1 course + 1 concours ou 2 concours).',
    eventsList: STANDARD_INTERCLUBS_EVENTS,
  },
  INTERCLUBS_AVENIR_U20_N2: {
    id: 'INTERCLUBS_AVENIR_U20_N2',
    name: 'Interclubs Avenir U20 N2',
    description: 'Catégories U20 (Cadets et Juniors), 1 athlète par épreuve, Division Nationale 2.',
    badge: 'U20 N2 (CA, JU · 1 athlète/épreuve)',
    defaultGenderMode: 'MIXED',
    eligibleCategories: ['CA', 'JU'],
    athletesPerEvent: 1,
    maxEventsPerAthlete: 2,
    allowDouble: true,
    doubleRulesDescription: 'Max 2 épreuves individuelles par athlète.',
    eventsList: STANDARD_INTERCLUBS_EVENTS,
  },
  EQUIP_ATHLE_BE: {
    id: 'EQUIP_ATHLE_BE',
    name: "Équip'Athlé BE (Benjamins)",
    description: 'Compétition par équipes Benjamins (BE). Format triathlon : 1 course, 1 saut, 1 lancer + relais.',
    badge: 'BE (Benjamins · Triathlon)',
    defaultGenderMode: 'MIXED',
    eligibleCategories: ['BE'],
    athletesPerEvent: 1,
    maxEventsPerAthlete: 3,
    allowDouble: true,
    doubleRulesDescription: 'Max 3 épreuves individuelles par athlète (1 course + 1 saut + 1 lancer).',
    eventsList: EQUIP_ATHLE_BE_EVENTS,
  },
  EQUIP_ATHLE_MI: {
    id: 'EQUIP_ATHLE_MI',
    name: "Équip'Athlé MI (Minimes)",
    description: 'Compétition par équipes Minimes (MI). Format triathlon : 1 course, 1 saut, 1 lancer + relais.',
    badge: 'MI (Minimes · Triathlon)',
    defaultGenderMode: 'MIXED',
    eligibleCategories: ['MI'],
    athletesPerEvent: 1,
    maxEventsPerAthlete: 3,
    allowDouble: true,
    doubleRulesDescription: 'Max 3 épreuves individuelles par athlète (1 course + 1 saut + 1 lancer).',
    eventsList: EQUIP_ATHLE_MI_EVENTS,
  },
  AUTRES: {
    id: 'AUTRES',
    name: 'Autres (Compétition Personnalisée)',
    description: 'Définissez librement les catégories éligibles, le nombre d’athlètes par épreuve et les règles de doublé.',
    badge: 'Personnalisée (Règles sur-mesure)',
    defaultGenderMode: 'MIXED',
    eligibleCategories: ['CA', 'JU', 'ES', 'SE', 'MA'],
    athletesPerEvent: 1,
    maxEventsPerAthlete: 2,
    allowDouble: true,
    doubleRulesDescription: 'Configuration libre définie par l’entraîneur.',
    eventsList: STANDARD_INTERCLUBS_EVENTS,
  },
};

/**
 * Vérifie si deux épreuves peuvent être combinées par un même athlète (règles physiologiques & fédérales).
 */
function areDisciplinesCompatibleForDouble(discA: string, discB: string, familyA: string, familyB: string): boolean {
  if (discA.toLowerCase() === discB.toLowerCase()) return false;
  // Deux courses longues (> 400m) sont généralement incompatibles lors d'une même journée
  const longRaces = ['800m', '1500m', '3000m', '5000m', '3000m steeple', '3000m marche', '5000m marche', '2000m', '2000m marche'];
  const aLower = discA.toLowerCase();
  const bLower = discB.toLowerCase();
  if (longRaces.includes(aLower) && longRaces.includes(bLower)) {
    return false;
  }
  // Course + Concours ou Concours + Concours : toujours autorisé
  return true;
}

/**
 * Moteur d'optimisation d'équipe :
 * Recherche la meilleure affectation possible des athlètes du club pour maximiser le total de points FFA.
 */
export function optimizeTeamComposition(
  records: PerformanceRecord[],
  options: {
    club: string;
    season: string; // Ex: "2025-2026" ou "all"
    competitionType: CompetitionType;
    customRules?: Partial<CompetitionRules>;
    genderFilter?: 'MIXED' | 'M' | 'F';
  }
): TeamCompositionResult {
  const baseRules = COMPETITION_PRESETS[options.competitionType] || COMPETITION_PRESETS.CHAMPIONNAT_FRANCE_CLUBS;
  const rules: CompetitionRules = {
    ...baseRules,
    ...options.customRules,
  };

  const targetGender = options.genderFilter || rules.defaultGenderMode;
  const targetClubNorm = options.club.toLowerCase().trim();

  // 1. Filtrer les performances du club sélectionné
  const clubRecords = records.filter(r => {
    const cName = (r.club || '').toLowerCase().trim();
    if (!cName.includes(targetClubNorm) && !targetClubNorm.includes(cName)) return false;

    // Filtre de saison si précisé
    if (options.season !== 'all') {
      const sLab = r.saisonLabel || (r.saison === 2026 ? '2025-2026' : `${r.saison - 1}-${r.saison}`);
      if (sLab !== options.season && String(r.saison) !== options.season) return false;
    }

    // Filtre de catégorie
    const catNorm = normalizeCategory(r.categorie);
    if (!rules.eligibleCategories.includes(catNorm)) return false;

    return true;
  });

  // 2. Extraire la meilleure performance de chaque athlète par épreuve (points FFA maximaux)
  // Clé : athleteName + discipline
  interface AthleteBest {
    athleteName: string;
    sexe: 'M' | 'F';
    categorie: string;
    discipline: string;
    cleanDiscipline: string;
    family: string;
    record: PerformanceRecord;
    points: number;
  }

  const athleteBestsMap = new Map<string, AthleteBest>();

  clubRecords.forEach(r => {
    const cleanDisc = cleanDisciplineName(r.discipline);
    const key = `${r.athleteName.toLowerCase()}||${cleanDisc.toLowerCase()}`;
    const pts = typeof r.pointsFFA === 'number' && r.pointsFFA > 0 ? r.pointsFFA : 600;

    const existing = athleteBestsMap.get(key);
    if (!existing || pts > existing.points) {
      athleteBestsMap.set(key, {
        athleteName: r.athleteName,
        sexe: r.sexe,
        categorie: r.categorie,
        discipline: cleanDisc,
        cleanDiscipline: cleanDisc,
        family: '',
        record: r,
        points: pts,
      });
    }
  });

  // 3. Définir les épreuves cibles selon le filtre de sexe
  const targetEvents = rules.eventsList.filter(ev => {
    if (targetGender === 'MIXED') return true;
    return ev.sexe === targetGender;
  });

  // 4. ALGORITHME D'AFFECTATION OPTIMALE (Branch & Bound / Greedy avec résolution des conflits)
  // Nombre d'athlètes par épreuve
  const slotsPerEvent = rules.athletesPerEvent || 1;
  const maxEventsPerAth = rules.allowDouble ? rules.maxEventsPerAthlete : 1;

  // Préparer les slots d'épreuves
  const eventSlots: EventCompositionSlot[] = targetEvents.map(ev => ({
    eventId: `${ev.sexe}-${ev.discipline}`,
    discipline: ev.discipline,
    sexe: ev.sexe,
    family: ev.family,
    requiredAthletes: slotsPerEvent,
    assignedSlots: [],
  }));

  // Trouver tous les candidats possibles par épreuve
  interface Candidate {
    athleteName: string;
    sexe: 'M' | 'F';
    categorie: string;
    discipline: string;
    family: string;
    points: number;
    record: PerformanceRecord;
  }

  const candidatesByEvent = new Map<string, Candidate[]>();

  eventSlots.forEach(slot => {
    const candidates: Candidate[] = [];
    athleteBestsMap.forEach(item => {
      if (item.sexe === slot.sexe && item.cleanDiscipline.toLowerCase() === slot.discipline.toLowerCase()) {
        candidates.push({
          ...item,
          family: slot.family,
        });
      }
    });
    // Trier par points décroissants
    candidates.sort((a, b) => b.points - a.points);
    candidatesByEvent.set(slot.eventId, candidates);
  });

  // Affectation avec suivi de la charge par athlète
  const athleteAssignedEvents = new Map<string, { discipline: string; family: string; points: number; slotId: string }[]>();

  const canAthleteTakeEvent = (athleteName: string, discipline: string, family: string): boolean => {
    const current = athleteAssignedEvents.get(athleteName.toLowerCase()) || [];
    if (current.length >= maxEventsPerAth) return false;
    // Vérifier les doublés
    for (const assigned of current) {
      if (!areDisciplinesCompatibleForDouble(assigned.discipline, discipline, assigned.family, family)) {
        return false;
      }
    }
    return true;
  };

  // Phase 1 : Remplissage par priorité de points
  // On classe tous les triplets (slot, candidate, points) et on affecte de manière gourmande optimisée
  interface PotentialAssignment {
    slotId: string;
    candidate: Candidate;
    points: number;
  }

  const allPotentials: PotentialAssignment[] = [];
  eventSlots.forEach(slot => {
    const list = candidatesByEvent.get(slot.eventId) || [];
    list.forEach(cand => {
      allPotentials.push({
        slotId: slot.eventId,
        candidate: cand,
        points: cand.points,
      });
    });
  });

  allPotentials.sort((a, b) => b.points - a.points);

  const slotFilledCount = new Map<string, number>();

  allPotentials.forEach(p => {
    const filled = slotFilledCount.get(p.slotId) || 0;
    if (filled >= slotsPerEvent) return;

    if (canAthleteTakeEvent(p.candidate.athleteName, p.candidate.discipline, p.candidate.family)) {
      // Affecter l'athlète à ce slot
      const slot = eventSlots.find(s => s.eventId === p.slotId);
      if (slot) {
        slot.assignedSlots.push({
          slotIndex: filled + 1,
          record: p.candidate.record,
          points: p.points,
          performanceDisplay: p.candidate.record.performanceDisplay,
        });

        slotFilledCount.set(p.slotId, filled + 1);

        const currentList = athleteAssignedEvents.get(p.candidate.athleteName.toLowerCase()) || [];
        currentList.push({
          discipline: p.candidate.discipline,
          family: p.candidate.family,
          points: p.points,
          slotId: p.slotId,
        });
        athleteAssignedEvents.set(p.candidate.athleteName.toLowerCase(), currentList);
      }
    }
  });

  // Phase 2 : Recherche de remplaçants potentiels (Substitutes) pour chaque épreuve
  eventSlots.forEach(slot => {
    const assignedNames = new Set(slot.assignedSlots.map(s => s.record?.athleteName.toLowerCase()));
    const candidates = candidatesByEvent.get(slot.eventId) || [];
    const substitute = candidates.find(c => !assignedNames.has(c.athleteName.toLowerCase()));
    if (substitute) {
      slot.substituteCandidate = {
        record: substitute.record,
        points: substitute.points,
        performanceDisplay: substitute.record.performanceDisplay,
      };
    }
  });

  // Calcul des métriques globales
  let totalPoints = 0;
  let filledSlots = 0;
  const totalSlots = eventSlots.length * slotsPerEvent;
  const pointsByFamily: Record<string, number> = {
    Sprint: 0,
    Haies: 0,
    'Demi-fond': 0,
    Sauts: 0,
    Lancers: 0,
    Marche: 0,
    Relais: 0,
  };
  const pointsBySexe = { M: 0, F: 0 };
  const uniqueAthletesSet = new Set<string>();

  eventSlots.forEach(slot => {
    slot.assignedSlots.forEach(assigned => {
      totalPoints += assigned.points;
      filledSlots++;
      if (assigned.record) {
        uniqueAthletesSet.add(assigned.record.athleteName.toLowerCase());
      }
      pointsByFamily[slot.family] = (pointsByFamily[slot.family] || 0) + assigned.points;
      if (slot.sexe === 'M') pointsBySexe.M += assigned.points;
      if (slot.sexe === 'F') pointsBySexe.F += assigned.points;
    });
  });

  // Identifier les athlètes du club non retenus dans la composition (réserve disponible)
  const unassignedMap = new Map<string, { athleteName: string; sexe: 'M' | 'F'; categorie: string; bestEvent: string; bestPoints: number }>();

  clubRecords.forEach(r => {
    const nameLower = r.athleteName.toLowerCase();
    if (!uniqueAthletesSet.has(nameLower)) {
      const existing = unassignedMap.get(nameLower);
      const pts = r.pointsFFA || 500;
      if (!existing || pts > existing.bestPoints) {
        unassignedMap.set(nameLower, {
          athleteName: r.athleteName,
          sexe: r.sexe,
          categorie: r.categorie,
          bestEvent: cleanDisciplineName(r.discipline),
          bestPoints: pts,
        });
      }
    }
  });

  const unassignedAthletes = Array.from(unassignedMap.values()).sort((a, b) => b.bestPoints - a.bestPoints);

  return {
    club: options.club,
    season: options.season,
    competitionType: rules.id,
    competitionName: rules.name,
    totalPoints,
    totalSlots,
    filledSlots,
    uniqueAthletesCount: uniqueAthletesSet.size,
    events: eventSlots,
    unassignedAthletes,
    pointsByFamily,
    pointsBySexe,
  };
}
