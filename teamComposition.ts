import { CategoryCode, PerformanceRecord } from './athletics';

export type CompetitionType =
  | 'CHAMPIONNAT_FRANCE_CLUBS'
  | 'INTERCLUBS_AVENIR_U23_N1'
  | 'INTERCLUBS_AVENIR_U23_N2'
  | 'INTERCLUBS_AVENIR_U20_N1'
  | 'INTERCLUBS_AVENIR_U20_N2'
  | 'EQUIP_ATHLE_BE'
  | 'EQUIP_ATHLE_MI'
  | 'AUTRES';

export type CompetitionGenderMode = 'MIXED' | 'M' | 'F';

export interface CompetitionRules {
  id: CompetitionType;
  name: string;
  description: string;
  badge: string;
  defaultGenderMode: CompetitionGenderMode;
  eligibleCategories: CategoryCode[];
  athletesPerEvent: number; // Ex: 1 ou 2
  maxEventsPerAthlete: number; // Hors relais (ex: 1, 2 ou 3)
  allowDouble: boolean; // Autorise un même athlète à faire 2 épreuves
  doubleRulesDescription?: string;
  eventsList: {
    sexe: 'M' | 'F';
    discipline: string;
    family: 'Sprint' | 'Haies' | 'Demi-fond' | 'Sauts' | 'Lancers' | 'Marche' | 'Relais';
  }[];
}

export interface AssignedAthleteSlot {
  slotIndex: number; // 1 pour Titulaire 1, 2 pour Titulaire 2
  record?: PerformanceRecord;
  points: number;
  performanceDisplay: string;
  isAlternative?: boolean;
}

export interface EventCompositionSlot {
  eventId: string; // Ex: "M-100m" ou "F-Hauteur"
  discipline: string;
  sexe: 'M' | 'F';
  family: string;
  requiredAthletes: number;
  assignedSlots: AssignedAthleteSlot[];
  substituteCandidate?: {
    record: PerformanceRecord;
    points: number;
    performanceDisplay: string;
  };
}

export interface TeamCompositionResult {
  club: string;
  season: string;
  competitionType: CompetitionType;
  competitionName: string;
  totalPoints: number;
  totalSlots: number;
  filledSlots: number;
  uniqueAthletesCount: number;
  events: EventCompositionSlot[];
  unassignedAthletes: {
    athleteName: string;
    sexe: 'M' | 'F';
    categorie: string;
    bestEvent: string;
    bestPoints: number;
  }[];
  pointsByFamily: Record<string, number>;
  pointsBySexe: { M: number; F: number };
}
