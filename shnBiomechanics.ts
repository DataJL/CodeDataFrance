export interface HighJumpAthleteBioData {
  rank: number;
  athlete: string;
  country: string;
  mark: number; // in meters (ex: 2.35)
  seasonBest: number;
  personalBest: number;
  stature: number; // in meters (ex: 1.92)
  takeOffFoot: 'LEFT' | 'RIGHT';
  modelStyle: 'VITESSE_ELASTICITE' | 'FORCE_PUISSANCE' | 'MIXTE';
  
  // 1. Hauteurs partielles (m et % de taille)
  h1: number; // Hauteur CM au poser final TD (m)
  h1Percent: number; // % stature
  h2: number; // Hauteur CM à l'envol TO (m)
  h2Percent: number; // % stature
  h3: number; // Hauteur crête CM en vol (m)
  h3Percent: number; // % stature
  h3Diff: number; // Marge CM au-dessus de la barre (m)
  peakCmLocation: number; // Position antéro-postérieure du pic par rapport à la barre (- = au-delà, + = avant)
  peakPelvisHeight: number; // Hauteur crête du bassin (m)
  pphDiff: number; // Différence hauteur bassin - barre (m)

  // 2. Vitesses (m/s)
  vh2ndTD: number; // Vitesse horizontale au 2e appui TD
  vh3rdTD: number; // Vitesse horizontale au 3e appui TD (pénultième)
  vhTakeOffTD: number; // Vitesse horizontale au poser final (TD 4e appui)
  vhTakeOffTO: number; // Vitesse horizontale à l'envol (TO)
  deltaVhPercent: number; // Perte de vitesse horizontale à l'impulsion (%)
  vvTD: number; // Vitesse verticale au poser final TD (négative)
  vvTO: number; // Vitesse verticale à l'envol (positive, m/s)
  vrTO: number; // Vitesse résultante à l'envol (m/s)
  velocityTransferPercent: number; // Taux de conversion de vitesse horizontale en verticale (%)
  takeOffAngle: number; // Angle d'envol du CM (degrés)

  // 3. Distance d'appel et géométrie
  takeOffDistance: number; // Distance pied d'appel - barre (m)

  // 4. Longueur des 3 dernières foulées
  step1Length: number; // Longueur foulée antépénultième (m)
  step1LengthPercent: number; // % stature
  step2Length: number; // Longueur foulée pénultième (m)
  step2LengthPercent: number; // % stature
  step3Length: number; // Longueur dernière foulée d'appel (m)
  step3LengthPercent: number; // % stature
  stepPattern: 'LONG_COURT' | 'COURT_LONG' | 'REGULIER';

  // 5. Temps d'appui et de suspension
  takeOffContactTime: number; // Temps de contact au dernier appui / impulsion (s)
  contactTime3: number; // Temps de contact à l'avant-dernier appui / pénultième (s)
  flightTime3: number; // Temps de vol précédant l'appel (s)
  ratioFlightContact: number; // Ratio Temps de vol / Temps de contact au dernier appui

  // 6. Angulations articulaires
  kneeFlexionLowest: number; // Flexion minimale du genou d'appel (degrés, 180° = tendu)
  kneeRangeOfMotion: number; // Amplitude de travail du genou d'appel (degrés)
  ankleLowest: number; // Angle minimal de cheville (degrés)
  kneeFlexionDuration: number; // Durée de flexion (s)
  kneeExtensionDuration: number; // Durée d'extension (s)

  // 7. Inclinaisons corporelles
  wholeBodyLeanTD: number; // Inclinaison globale arrière au poser (degrés)
  trunkLeanTD: number; // Inclinaison du tronc au poser (degrés)
  sidewaysTrunkLeanTD: number; // Inclinaison latérale vers l'intérieur de la courbe (degrés)
  stepToBarAngleFinal: number; // Angle final de la trajectoire par rapport à la barre (degrés)
}

export interface GenericAthleteBioRow {
  rank: number;
  athlete: string;
  country: string;
  mark: string;
  velocity: string;
  contactTime?: string;
  takeOffAngle?: string;
  keyMetricLabel: string;
  keyMetricValue: string;
  modelStyle?: string;
}

export interface DisciplineCoachBenchmarkItem {
  label: string;
  range: string;
  avg: string;
  unit?: string;
}

export interface DisciplineBiomechanicStudy {
  id: string;
  disciplineName: string;
  disciplineCode: string;
  category: 'SAUTS' | 'SPRINT' | 'HAIES' | 'LANCERS' | 'DEMI_FOND';
  gender?: 'H' | 'F' | 'MIXTE';
  competition: string;
  year: number;
  title: string;
  subtitle: string;
  authors: string[];
  institution: string;
  sourcePdfUrl: string;
  pdfFileName: string;
  pdfFileSize: string;
  available: boolean;
  summary: string;
  keyTakeaways: string[];
  athletesData?: HighJumpAthleteBioData[];
  genericAthletes?: GenericAthleteBioRow[];
  benchmarksList?: DisciplineCoachBenchmarkItem[];
}
