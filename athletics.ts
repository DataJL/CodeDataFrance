export type DisciplineType = 
  | '60m'
  | '100m'
  | '200m'
  | '400m'
  | '800m'
  | '1500m'
  | '3000m'
  | '5000m'
  | '10000m'
  | '60m Haies'
  | '100m Haies'
  | '110m Haies'
  | '400m Haies'
  | '3000m Steeple'
  | 'Hauteur'
  | 'Perche'
  | 'Longueur'
  | 'Triple Saut'
  | 'Poids'
  | 'Disque'
  | 'Marteau'
  | 'Javelot'
  | 'Pentathlon'
  | 'Heptathlon'
  | 'Décathlon';

export type PerformanceNature = 'time' | 'distance' | 'points';

export type CategoryCode = 'BE' | 'MI' | 'CA' | 'JU' | 'ES' | 'SE' | 'MA';

export type StructureType = 'EXTERIEUR' | 'SALLE' | 'COMBINE';

export type PerformanceLevel = 
  | 'IB' | 'N1' | 'N2' | 'N3' | 'N4'
  | 'IR1' | 'IR2' | 'IR3' | 'IR4'
  | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6'
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8';

export interface PerformanceRecord {
  id: string;
  athleteId: string;
  athleteName: string;
  sexe: 'M' | 'F';
  categorie: 'BEN' | 'MIM' | 'CAD' | 'JUN' | 'ESP' | 'SEN' | 'MAS' | 'CAM' | 'CAF' | 'JUM' | 'JUF' | 'ESM' | 'ESF' | 'SEM' | 'SEF' | 'MAM' | 'MAF' | string;
  discipline: DisciplineType | string;
  nature: PerformanceNature;
  performanceValue: number; // En secondes pour le temps, en mètres pour la distance, en points pour combinés
  performanceDisplay: string; // Ex: "10\"42", "1'48\"35", "7m82", "5840 pts"
  vent?: number | null; // ex: +1.2 m/s
  structure?: 'EXTERIEUR' | 'SALLE' | 'COMBINE' | string; // plein air / en salle / combiné
  date: string; // ISO date YYYY-MM-DD
  saison: number; // Ex: 2026
  lieu: string;
  club: string;
  departement: string; // Ex: "75", "93", "59", "69"
  region: string; // Ex: "Île-de-France", "Hauts-de-France", "Auvergne-Rhône-Alpes"
  entraineur: string;
  niveau: PerformanceLevel | string; // Ex: N1, IR2, R1
  pointsFFA: number;
  code_ep?: string; // Code officiel FFA Logica (colonne G, ex: 105, 501, 110)
  perf_ajustee?: number; // Colonne K "perf_ajustee" (utilisée pour comparaison et classement)
  perf_formatee?: string; // Colonne I "perf_formatee" (affichage brut fidèle)
  saisonLabel?: string; // Libellé de la saison (ex: "2022-2023", "2025-2026")
  nationalite?: string; // Nationalité de l'athlète (colonne S nat_ath, ex: FRA)
  annee_nais?: number | string; // Année de naissance (colonne V annee_nais, ex: 2012)
  licence?: string; // Numéro de licence FFA (colonne W licence)
  isPersonalRecord?: boolean; // RP au moment ou global
  sourceFile?: string; // Fichier d'origine (ex: Rslts salle 25-26.csv)
  rawDiscipline?: string; // Libellé brut d'origine de la discipline (ex: "Hauteur- Re")
  nom_compet?: string; // Nom officiel de la compétition (colonne C "nom_compet", ex: "Championnats de France Elite en salle")
  num_compet?: string; // Numéro de compétition Logica (colonne A "num_compet", ex: "295001")
  dpt_compet?: string; // Département où s'est tenue la compétition (colonne D "dpt_compet")
  ep_logica?: string; // Épreuve Logica / Tour / Série / Finale (colonne F "ep_logica")
  place?: number; // Place / rang de l'athlète dans l'épreuve
}

export interface OfficialSeasonFile {
  id: string; // Ex: "2022-2023_SALLE", "2025-2026_COMBINE"
  seasonLabel: string; // Ex: "2022-2023"
  startYear: number; // Ex: 2022
  endYear: number; // Ex: 2023
  structure: 'EXTERIEUR' | 'SALLE' | 'COMBINE';
  fileName: string;
  importedAt: string;
  recordCount: number;
  totalLinesDetected?: number; // Total des lignes détectées dans le fichier source
  athleteCount?: number; // Nombre d'athlètes uniques dans cette base
  remoteSourceUrl?: string; // Lien distant d'origine (ex: GitHub Releases, Cloudflare R2)
}

export interface DownloadedRemoteSource {
  id: string;
  url: string;
  fileName: string;
  seasonLabel: string;
  structure: 'EXTERIEUR' | 'SALLE' | 'COMBINE';
  recordCount: number;
  athleteCount: number;
  totalLinesDetected: number;
  downloadedAt: string;
  fileSizeFormatted?: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'COACH' | 'ATHLETE' | 'VIEWER';

export interface UserPermission {
  canImportData: boolean;
  canExportReports: boolean;
  canEditPerformances: boolean;
  canManageUsers: boolean;
  canPurgeData: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string; // Simulé pour auth locale sécurisée
  firstName: string;
  lastName: string;
  phoneNumber?: string; // Optionnel
  role: UserRole;
  isTwoFactorEnabled: boolean;
  permissions: UserPermission;
  createdAt: string;
  lastLoginAt: string;
  club?: string;
  region?: string; // Région administrative / ligue FFA
  avatarColor?: string;
  avatarUrl?: string;
  statuses?: string[]; // Ex: ['Entraîneur', 'Athlète', 'Dirigeant', 'Jury', 'Autre']
  otherStatusDetails?: string; // Précision saisie par l'utilisateur si 'Autres' coché
}

export const FRENCH_REGIONS = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d\'Azur',
  'Guadeloupe',
  'Guyane',
  'Martinique',
  'Mayotte',
  'La Réunion',
  'Autre / International'
] as const;

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: 
    | 'CONNEXION_REUSSIE'
    | 'CONNEXION_ECHEC'
    | 'VALIDATION_2FA'
    | 'IMPORT_CSV'
    | 'EXPORT_EXCEL'
    | 'EXPORT_WORD'
    | 'EXPORT_PDF'
    | 'NOMINATION_ADMIN'
    | 'MODIFICATION_PERMISSIONS'
    | 'CREATION_COMPTE'
    | 'MODIFICATION_PROFIL'
    | 'MODIFICATION_DONNEES';
  details: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'DATA_UPDATE' | 'SYSTEM_UPDATE' | 'SECURITY' | 'INFO';
  timestamp: string;
  read: boolean;
  link?: string;
  emailSent?: boolean;
  smsSent?: boolean;
}

export interface FilterCriteria {
  searchQuery: string;
  discipline: string;
  saison: string; // 'all' or specific year
  region: string;
  departement: string;
  club: string;
  entraineur: string;
  niveau: string;
  sexe: string;
  categorie: string;
  onlyPersonalRecords: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string; // ID of recipient user or 'admin'
  recipientName: string;
  recipientEmail: string;
  content: string;
  timestamp: string;
  read: boolean;
  isAdminChannel?: boolean;
}

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  fromUserClub?: string;
  fromUserAvatarColor?: string;
  toUserId: string;
  toUserName: string;
  toUserEmail: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// LISTES MINISTÉRIELLES DES SPORTIFS DE HAUT NIVEAU (SHN)
// Source officielle : Ministère des Sports / FFA
// -------------------------------------------------------------
export type SHNCategory = 
  | 'Élite' 
  | 'Sénior' 
  | 'Relève' 
  | 'Espoir' 
  | 'Collectifs Nationaux' 
  | 'Reconversion';

export type SHNDisciplineFamily = 
  | 'Sprint' 
  | 'Haies' 
  | 'Demi-fond' 
  | 'Sauts' 
  | 'Lancers' 
  | 'Combinés' 
  | 'Marche';

export interface SHNAthlete {
  id: string;
  nom: string;
  prenom: string;
  nomComplet: string; // Ex: "MAYER Kevin"
  sexe: 'M' | 'F';
  anneeReference: number; // Ex: 2024, 2023, 2022, 2021, 2020
  categorie: SHNCategory; // 'Élite' | 'Sénior' | 'Relève' | 'Espoir' | 'Collectifs Nationaux' | 'Reconversion'
  discipline: string; // Ex: "Décathlon", "100m Haies", "800m", "Perche"
  famille: SHNDisciplineFamily; // 'Sprint' | 'Haies' | 'Demi-fond' | 'Sauts' | 'Lancers' | 'Combinés' | 'Marche'
  club: string; // Club d'appartenance
  ligue: string; // Ligue régionale d'athlétisme
  statut?: string; // Ex: "Inscrit liste ministérielle"
  source?: string; // "Ministère des Sports / FFA"
}
