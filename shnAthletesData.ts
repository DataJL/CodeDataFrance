import { SHNAthlete, SHNCategory, SHNDisciplineFamily } from '../types/athletics';

export interface SHNCategoryMeta {
  key: SHNCategory;
  label: string;
  badgeClass: string;
  bgLight: string;
  description: string;
  criteria: string;
}

export const SHN_CATEGORIES_INFO: Record<SHNCategory, SHNCategoryMeta> = {
  'Élite': {
    key: 'Élite',
    label: 'Élite',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    bgLight: 'from-amber-950/40 to-slate-900',
    description: 'Niveau d\'excellence mondiale absolue (Jeux Olympiques, Championnats du Monde).',
    criteria: 'Podium ou finaliste aux Jeux Olympiques ou Championnats du Monde seniors.',
  },
  'Sénior': {
    key: 'Sénior',
    label: 'Sénior',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    bgLight: 'from-purple-950/40 to-slate-900',
    description: 'Membres réguliers de l\'Équipe de France A, finalistes continentaux.',
    criteria: 'Sélection en équipe de France A, finaliste européen ou minima mondiaux.',
  },
  'Relève': {
    key: 'Relève',
    label: 'Relève',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    bgLight: 'from-sky-950/40 to-slate-900',
    description: 'Sportifs à très fort potentiel d\'accès au haut niveau mondial (U20, U23).',
    criteria: 'Médaillés ou finalistes aux Mondiaux ou championnats d\'Europe U20/U23.',
  },
  'Espoir': {
    key: 'Espoir',
    label: 'Espoir',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    bgLight: 'from-emerald-950/40 to-slate-900',
    description: 'Jeunes talents identifiés dans le Plan de Performance Fédéral (PPF).',
    criteria: 'Titres nationaux jeunes et respect des critères d\'accès au haut niveau.',
  },
  'Collectifs Nationaux': {
    key: 'Collectifs Nationaux',
    label: 'Collectifs Nationaux',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    bgLight: 'from-blue-950/40 to-slate-900',
    description: 'Partenaires d\'entraînement et collectifs de relais nationaux (4x100m, 4x400m).',
    criteria: 'Intégration aux stages et collectifs préparatoires de l\'Équipe de France.',
  },
  'Reconversion': {
    key: 'Reconversion',
    label: 'Reconversion',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    bgLight: 'from-slate-800 to-slate-900',
    description: 'Anciens athlètes de haut niveau accompagnés vers leur transition professionnelle.',
    criteria: 'Ayant figuré au moins 4 ans sur les listes Élite/Sénior.',
  },
};

export const SHN_YEARS = [2025, 2024, 2023, 2022, 2021, 2020];

export const SHN_DISCIPLINE_FAMILIES: SHNDisciplineFamily[] = [
  'Sprint',
  'Haies',
  'Demi-fond',
  'Sauts',
  'Lancers',
  'Combinés',
  'Marche',
];

/**
 * Base de référence officielle des Sportifs de Haut Niveau (SHN) en Athlétisme
 * Compilée à partir des arrêtés ministériels (Ministère des Sports / FFA - Journal Officiel)
 * Période 2020-2025 couvrant Élite, Sénior, Relève, Espoir, Collectifs Nationaux et Reconversion.
 */
export const INITIAL_SHN_ATHLETES: SHNAthlete[] = [
  // ==========================================
  // ÉLITE (Mondiaux / Jeux Olympiques)
  // ==========================================
  {
    id: 'shn-mayer-kevin-2024',
    nom: 'MAYER',
    prenom: 'Kevin',
    nomComplet: 'MAYER Kevin',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: 'Décathlon',
    famille: 'Combinés',
    club: 'Montpellier Athletic Méditerranée Métropole',
    ligue: 'Occitanie',
    statut: 'Inscrit liste ministérielle',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-mayer-kevin-2023',
    nom: 'MAYER',
    prenom: 'Kevin',
    nomComplet: 'MAYER Kevin',
    sexe: 'M',
    anneeReference: 2023,
    categorie: 'Élite',
    discipline: 'Décathlon',
    famille: 'Combinés',
    club: 'Montpellier Athletic Méditerranée Métropole',
    ligue: 'Occitanie',
    statut: 'Inscrit liste ministérielle',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-mayer-kevin-2022',
    nom: 'MAYER',
    prenom: 'Kevin',
    nomComplet: 'MAYER Kevin',
    sexe: 'M',
    anneeReference: 2022,
    categorie: 'Élite',
    discipline: 'Décathlon',
    famille: 'Combinés',
    club: 'Montpellier Athletic Méditerranée Métropole',
    ligue: 'Occitanie',
    statut: 'Inscrit liste ministérielle',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-samba-mayela-cyrena-2024',
    nom: 'SAMBA-MAYELA',
    prenom: 'Cyrena',
    nomComplet: 'SAMBA-MAYELA Cyrena',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: '100m Haies',
    famille: 'Haies',
    club: 'Lille Métropole Athlétisme',
    ligue: 'Hauts-de-France',
    statut: 'Médaillée d\'Argent JO Paris 2024',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-samba-mayela-cyrena-2023',
    nom: 'SAMBA-MAYELA',
    prenom: 'Cyrena',
    nomComplet: 'SAMBA-MAYELA Cyrena',
    sexe: 'F',
    anneeReference: 2023,
    categorie: 'Élite',
    discipline: '100m Haies',
    famille: 'Haies',
    club: 'Lille Métropole Athlétisme',
    ligue: 'Hauts-de-France',
    statut: 'Championne du Monde en salle 60mH',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-tual-gabriel-2024',
    nom: 'TUAL',
    prenom: 'Gabriel',
    nomComplet: 'TUAL Gabriel',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: '800m',
    famille: 'Demi-fond',
    club: 'US Talence',
    ligue: 'Nouvelle-Aquitaine',
    statut: 'Finaliste JO Paris 2024 / Record de France 1:41.61',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-zhoya-sasha-2024',
    nom: 'ZHOYA',
    prenom: 'Sasha',
    nomComplet: 'ZHOYA Sasha',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: '110m Haies',
    famille: 'Haies',
    club: 'Clermont Athlétisme Auvergne',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Finaliste mondial / Vainqueur Ligue de Diamant',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-finot-alice-2024',
    nom: 'FINOT',
    prenom: 'Alice',
    nomComplet: 'FINOT Alice',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: '3000m Steeple',
    famille: 'Demi-fond',
    club: 'CA Montreuil 93',
    ligue: 'Île-de-France',
    statut: 'Championne d\'Europe / Record d\'Europe 8:58.67',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-collet-thibaut-2024',
    nom: 'COLLET',
    prenom: 'Thibaut',
    nomComplet: 'COLLET Thibaut',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: 'Perche',
    famille: 'Sauts',
    club: 'EA Grenoble 38',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Finaliste mondial 5.95m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-happio-wilfried-2024',
    nom: 'HAPPIO',
    prenom: 'Wilfried',
    nomComplet: 'HAPPIO Wilfried',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: '400m Haies',
    famille: 'Haies',
    club: 'Lille Métropole Athlétisme',
    ligue: 'Hauts-de-France',
    statut: 'Vice-champion d\'Europe / 47.41',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-schrub-yann-2024',
    nom: 'SCHRUB',
    prenom: 'Yann',
    nomComplet: 'SCHRUB Yann',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: '10 000m',
    famille: 'Demi-fond',
    club: 'AS Sarreguemines Arrondissements',
    ligue: 'Grand Est',
    statut: 'Vice-champion d\'Europe 5000m / 10000m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-gletty-makenson-2024',
    nom: 'GLETTY',
    prenom: 'Makenson',
    nomComplet: 'GLETTY Makenson',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: 'Décathlon',
    famille: 'Combinés',
    club: 'Nice Côte d\'Azur Athlétisme',
    ligue: 'Provence-Alpes-Côte d\'Azur',
    statut: 'Médaillé de bronze Championnats d\'Europe 8606 pts',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-ducos-clement-2024',
    nom: 'DUCOS',
    prenom: 'Clément',
    nomComplet: 'DUCOS Clément',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: '400m Haies',
    famille: 'Haies',
    club: 'Bordeaux Athlé',
    ligue: 'Nouvelle-Aquitaine',
    statut: 'Finaliste JO Paris 2024 47.78',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-miellet-alexis-2024',
    nom: 'MIELLET',
    prenom: 'Alexis',
    nomComplet: 'MIELLET Alexis',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: '3000m Steeple',
    famille: 'Demi-fond',
    club: 'Dijon UC',
    ligue: 'Bourgogne-Franche-Comté',
    statut: 'Champion d\'Europe 2024',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-gressier-jimmy-2024',
    nom: 'GRESSIER',
    prenom: 'Jimmy',
    nomComplet: 'GRESSIER Jimmy',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: '5000m',
    famille: 'Demi-fond',
    club: 'Boulogne-sur-Mer AC',
    ligue: 'Hauts-de-France',
    statut: 'Recordman d\'Europe 5km / Finaliste JO',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-robert-michon-melina-2024',
    nom: 'ROBERT-MICHON',
    prenom: 'Melina',
    nomComplet: 'ROBERT-MICHON Melina',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Élite',
    discipline: 'Disque',
    famille: 'Lancers',
    club: 'Lyon Athlétisme',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Porte-drapeau JO Paris 2024',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-bigot-quentin-2023',
    nom: 'BIGOT',
    prenom: 'Quentin',
    nomComplet: 'BIGOT Quentin',
    sexe: 'M',
    anneeReference: 2023,
    categorie: 'Élite',
    discipline: 'Marteau',
    famille: 'Lancers',
    club: 'Metz Métropole Athlétisme',
    ligue: 'Grand Est',
    statut: 'Vice-champion du monde 80.59m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },

  // ==========================================
  // SÉNIOR (Sélections internationales A, Finalistes Euro)
  // ==========================================
  {
    id: 'shn-zeze-ryan-2024',
    nom: 'ZEZE',
    prenom: 'Ryan',
    nomComplet: 'ZEZE Ryan',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: '200m',
    famille: 'Sprint',
    club: 'Stade Bordelais Athlétisme',
    ligue: 'Nouvelle-Aquitaine',
    statut: 'Finaliste mondial Relais 4x100m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-mateo-pablo-2024',
    nom: 'MATEO',
    prenom: 'Pablo',
    nomComplet: 'MATEO Pablo',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: '100m',
    famille: 'Sprint',
    club: 'Lisses AC',
    ligue: 'Île-de-France',
    statut: 'Équipe de France 4x100m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-joseph-gemima-2024',
    nom: 'JOSEPH',
    prenom: 'Gemima',
    nomComplet: 'JOSEPH Gemima',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: '200m',
    famille: 'Sprint',
    club: 'Rou Kou',
    ligue: 'Guyane',
    statut: 'Demi-finaliste JO Paris 2024 22.57',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-brossier-amandine-2024',
    nom: 'BROSSIER',
    prenom: 'Amandine',
    nomComplet: 'BROSSIER Amandine',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: '400m',
    famille: 'Sprint',
    club: 'Angers Athlé',
    ligue: 'Pays de la Loire',
    statut: 'Équipe de France Relais 4x400m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-maraval-louise-2024',
    nom: 'MARAVAL',
    prenom: 'Louise',
    nomComplet: 'MARAVAL Louise',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: '400m Haies',
    famille: 'Haies',
    club: 'Entente Sèvre',
    ligue: 'Pays de la Loire',
    statut: 'Vice-championne d\'Europe / Finaliste JO Paris 2024',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-habz-azeddine-2024',
    nom: 'HABZ',
    prenom: 'Azeddine',
    nomComplet: 'HABZ Azeddine',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: '1500m',
    famille: 'Demi-fond',
    club: 'Val d\'Europe Athlétisme',
    ligue: 'Île-de-France',
    statut: '3:29.26 / Finaliste européen',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-kwaou-mathey-just-2023',
    nom: 'KWAOU-MATHEY',
    prenom: 'Just',
    nomComplet: 'KWAOU-MATHEY Just',
    sexe: 'M',
    anneeReference: 2023,
    categorie: 'Sénior',
    discipline: '110m Haies',
    famille: 'Haies',
    club: 'Evreux AC',
    ligue: 'Normandie',
    statut: 'Médaillé européen 13.09',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-vaillant-ludvy-2023',
    nom: 'VAILLANT',
    prenom: 'Ludvy',
    nomComplet: 'VAILLANT Ludvy',
    sexe: 'M',
    anneeReference: 2023,
    categorie: 'Sénior',
    discipline: '400m Haies',
    famille: 'Haies',
    club: 'AC Saléen',
    ligue: 'Martinique',
    statut: 'Finaliste mondial 47.85',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-kpatcha-hilary-2024',
    nom: 'KPATCHA',
    prenom: 'Hilary',
    nomComplet: 'KPATCHA Hilary',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: 'Longueur',
    famille: 'Sauts',
    club: 'Grand Toulouse Athlétisme',
    ligue: 'Occitanie',
    statut: '6.86m / Finaliste européenne',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-pontvianne-jean-marc-2024',
    nom: 'PONTVIANNE',
    prenom: 'Jean-Marc',
    nomComplet: 'PONTVIANNE Jean-Marc',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: 'Triple Saut',
    famille: 'Sauts',
    club: 'Entente Nîmes Athlétisme',
    ligue: 'Occitanie',
    statut: 'Médaillé européen 17.20m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-tavernier-alexandra-2024',
    nom: 'TAVERNIER',
    prenom: 'Alexandra',
    nomComplet: 'TAVERNIER Alexandra',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: 'Marteau',
    famille: 'Lancers',
    club: 'Annecy Haute-Savoie Athlétisme',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Record de France 75.38m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-loga-rose-2024',
    nom: 'LOGA',
    prenom: 'Rose',
    nomComplet: 'LOGA Rose',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: 'Marteau',
    famille: 'Lancers',
    club: 'AC Paris Joinville',
    ligue: 'Île-de-France',
    statut: 'Médaillée de bronze européenne 72.68m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-moutard-pauline-2024',
    nom: 'MOUTARD',
    prenom: 'Pauline',
    nomComplet: 'MOUTARD Pauline',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: '20km Marche',
    famille: 'Marche',
    club: 'Clermont Athlétisme Auvergne',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Sélectionnée Coupe du Monde de Marche',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-kuster-david-2024',
    nom: 'KUSTER',
    prenom: 'David',
    nomComplet: 'KUSTER David',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Sénior',
    discipline: '20km Marche',
    famille: 'Marche',
    club: 'Colmar Athlétisme',
    ligue: 'Grand Est',
    statut: 'Champion de France Élite',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },

  // ==========================================
  // RELÈVE (Médaillés / Finalistes U20 / U23)
  // ==========================================
  {
    id: 'shn-ammirati-anthony-2024',
    nom: 'AMMIRATI',
    prenom: 'Anthony',
    nomComplet: 'AMMIRATI Anthony',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Relève',
    discipline: 'Perche',
    famille: 'Sauts',
    club: 'Athlétisme Club Clermontais',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Champion du Monde U20 5.81m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-konate-erwan-2024',
    nom: 'KONATE',
    prenom: 'Erwan',
    nomComplet: 'KONATE Erwan',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Relève',
    discipline: 'Longueur',
    famille: 'Sauts',
    club: 'Amiens UC',
    ligue: 'Hauts-de-France',
    statut: 'Double Champion du Monde U20 8.08m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-tumba-meta-2024',
    nom: 'TUMBA',
    prenom: 'Meta',
    nomComplet: 'TUMBA Meta',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Relève',
    discipline: '400m Haies',
    famille: 'Haies',
    club: 'G2A Grand Angoulême Athlétisme',
    ligue: 'Nouvelle-Aquitaine',
    statut: 'Championne du Monde U20 Lima 2024',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-grebo-shana-2024',
    nom: 'GREBO',
    prenom: 'Shana',
    nomComplet: 'GREBO Shana',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Relève',
    discipline: '400m Haies',
    famille: 'Haies',
    club: 'Haute Bretagne Athlétisme',
    ligue: 'Bretagne',
    statut: 'Finaliste JO Paris 2024 4x400m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-erius-jeff-2024',
    nom: 'ERIUS',
    prenom: 'Jeff',
    nomComplet: 'ERIUS Jeff',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Relève',
    discipline: '100m',
    famille: 'Sprint',
    club: 'Strasbourg Agglomération Athlétisme',
    ligue: 'Grand Est',
    statut: 'Vice-champion d\'Europe U20 / Recordman de France U20 10.27',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-meziane-yanis-2024',
    nom: 'MEZIANE',
    prenom: 'Yanis',
    nomComplet: 'MEZIANE Yanis',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Relève',
    discipline: '800m',
    famille: 'Demi-fond',
    club: 'Athlé 91',
    ligue: 'Île-de-France',
    statut: 'Champion d\'Europe U23 1:43.94',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-anselmini-paul-2024',
    nom: 'ANSELMINI',
    prenom: 'Paul',
    nomComplet: 'ANSELMINI Paul',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Relève',
    discipline: '800m',
    famille: 'Demi-fond',
    club: 'Entente Franconville Cesame Val d\'Oise',
    ligue: 'Île-de-France',
    statut: '1:44.20 / Demi-finaliste JO Paris 2024',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-thiery-baptiste-2024',
    nom: 'THIERY',
    prenom: 'Baptiste',
    nomComplet: 'THIERY Baptiste',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Relève',
    discipline: 'Perche / Décathlon',
    famille: 'Sauts',
    club: 'Jeunesse Sportive Franciscaine',
    ligue: 'Martinique',
    statut: '5.70m à la perche / 8057 pts décathlon',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-bonnin-marie-julie-2024',
    nom: 'BONNIN',
    prenom: 'Marie-Julie',
    nomComplet: 'BONNIN Marie-Julie',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Relève',
    discipline: 'Perche',
    famille: 'Sauts',
    club: 'Bordeaux Athlé',
    ligue: 'Nouvelle-Aquitaine',
    statut: 'Championne d\'Europe U23 4.70m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-gogois-thomas-2024',
    nom: 'GOGOIS',
    prenom: 'Thomas',
    nomComplet: 'GOGOIS Thomas',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Relève',
    discipline: 'Triple Saut',
    famille: 'Sauts',
    club: 'Amiens UC',
    ligue: 'Hauts-de-France',
    statut: 'Médaillé de bronze Championnats d\'Europe 17.38m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },

  // ==========================================
  // ESPOIR (PPF - Pépites montantes & Cadets/Juniors)
  // ==========================================
  {
    id: 'shn-chandon-alice-2024',
    nom: 'CHANDON',
    prenom: 'Alice',
    nomComplet: 'CHANDON Alice',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Espoir',
    discipline: 'Hauteur',
    famille: 'Sauts',
    club: 'EA Centre Isere',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Inscrite liste ministérielle Espoirs',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-chandon-alice-2023',
    nom: 'CHANDON',
    prenom: 'Alice',
    nomComplet: 'CHANDON Alice',
    sexe: 'F',
    anneeReference: 2023,
    categorie: 'Espoir',
    discipline: 'Hauteur',
    famille: 'Sauts',
    club: 'EA Centre Isere',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Inscrite liste ministérielle Espoirs',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-le-corre-jade-2024',
    nom: 'LE CORRE',
    prenom: 'Jade',
    nomComplet: 'LE CORRE Jade',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Espoir',
    discipline: '3000m',
    famille: 'Demi-fond',
    club: 'EA Saint-Quentin-en-Yvelines',
    ligue: 'Île-de-France',
    statut: 'Championne de France U20 Cross / 3000m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-mihoubi-ylies-2024',
    nom: 'MIHOUBI',
    prenom: 'Ylies',
    nomComplet: 'MIHOUBI Ylies',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Espoir',
    discipline: '1500m',
    famille: 'Demi-fond',
    club: 'Athlétisme Metz Métropole',
    ligue: 'Grand Est',
    statut: 'Podium Festival Olympique Jeunesse',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-richard-mathis-2024',
    nom: 'RICHARD',
    prenom: 'Mathis',
    nomComplet: 'RICHARD Mathis',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Espoir',
    discipline: 'Poids',
    famille: 'Lancers',
    club: 'Stade Bordelais Athlétisme',
    ligue: 'Nouvelle-Aquitaine',
    statut: 'Champion de France U20 Lancers',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-leroux-chloe-2024',
    nom: 'LEROUX',
    prenom: 'Chloe',
    nomComplet: 'LEROUX Chloe',
    sexe: 'F',
    anneeReference: 2024,
    categorie: 'Espoir',
    discipline: '100m Haies',
    famille: 'Haies',
    club: 'Nantes Métropole Athlétisme',
    ligue: 'Pays de la Loire',
    statut: 'Finaliste championnats d\'Europe U18',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },

  // ==========================================
  // COLLECTIFS NATIONAUX (Relais, stages de préparation olympique)
  // ==========================================
  {
    id: 'shn-fall-mouhamadou-2024',
    nom: 'FALL',
    prenom: 'Mouhamadou',
    nomComplet: 'FALL Mouhamadou',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Collectifs Nationaux',
    discipline: '100m',
    famille: 'Sprint',
    club: 'Entente Franconville Cesame VO',
    ligue: 'Île-de-France',
    statut: 'Collectif Relais 4x100m France',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-jordier-thomas-2024',
    nom: 'JORDIER',
    prenom: 'Thomas',
    nomComplet: 'JORDIER Thomas',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Collectifs Nationaux',
    discipline: '400m',
    famille: 'Sprint',
    club: 'Amiens UC',
    ligue: 'Hauts-de-France',
    statut: 'Collectif Relais 4x400m France',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-biron-gilles-2024',
    nom: 'BIRON',
    prenom: 'Gilles',
    nomComplet: 'BIRON Gilles',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Collectifs Nationaux',
    discipline: '400m',
    famille: 'Sprint',
    club: 'Madinina Athlétisme',
    ligue: 'Martinique',
    statut: 'Collectif Relais 4x400m France',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-sow-rougui-2023',
    nom: 'SOW',
    prenom: 'Rougui',
    nomComplet: 'SOW Rougui',
    sexe: 'F',
    anneeReference: 2023,
    categorie: 'Collectifs Nationaux',
    discipline: 'Longueur',
    famille: 'Sauts',
    club: 'Montpellier Athletic Méditerranée',
    ligue: 'Occitanie',
    statut: 'Collectif Sauts France',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },

  // ==========================================
  // RECONVERSION (Accompagnement après carrière internationale)
  // ==========================================
  {
    id: 'shn-lavillenie-renaud-2024',
    nom: 'LAVILLENIE',
    prenom: 'Renaud',
    nomComplet: 'LAVILLENIE Renaud',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Reconversion',
    discipline: 'Perche',
    famille: 'Sauts',
    club: 'Clermont Athlétisme Auvergne',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Champion Olympique Londres 2012 / Ex-recordman du monde 6.16m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-martinot-lagarde-pascal-2024',
    nom: 'MARTINOT-LAGARDE',
    prenom: 'Pascal',
    nomComplet: 'MARTINOT-LAGARDE Pascal',
    sexe: 'M',
    anneeReference: 2024,
    categorie: 'Reconversion',
    discipline: '110m Haies',
    famille: 'Haies',
    club: 'ES Montgeron',
    ligue: 'Île-de-France',
    statut: 'Record de France 12.95 / Champion d\'Europe',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-tamgho-teddy-2023',
    nom: 'TAMGHO',
    prenom: 'Teddy',
    nomComplet: 'TAMGHO Teddy',
    sexe: 'M',
    anneeReference: 2023,
    categorie: 'Reconversion',
    discipline: 'Triple Saut',
    famille: 'Sauts',
    club: 'CA Montreuil 93',
    ligue: 'Île-de-France',
    statut: 'Champion du Monde 18.04m',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-diniz-yohann-2022',
    nom: 'DINIZ',
    prenom: 'Yohann',
    nomComplet: 'DINIZ Yohann',
    sexe: 'M',
    anneeReference: 2022,
    categorie: 'Reconversion',
    discipline: '50km Marche',
    famille: 'Marche',
    club: 'EFS Reims Athlétisme',
    ligue: 'Grand Est',
    statut: 'Champion du Monde / Recordman du Monde 50km',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },

  // ==========================================
  // ANNÉE 2025 (Nouvelle mandature olympique)
  // ==========================================
  {
    id: 'shn-mayer-kevin-2025',
    nom: 'MAYER',
    prenom: 'Kevin',
    nomComplet: 'MAYER Kevin',
    sexe: 'M',
    anneeReference: 2025,
    categorie: 'Élite',
    discipline: 'Décathlon',
    famille: 'Combinés',
    club: 'Montpellier Athletic Méditerranée Métropole',
    ligue: 'Occitanie',
    statut: 'Inscrit liste ministérielle Élite 2025',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-samba-mayela-cyrena-2025',
    nom: 'SAMBA-MAYELA',
    prenom: 'Cyrena',
    nomComplet: 'SAMBA-MAYELA Cyrena',
    sexe: 'F',
    anneeReference: 2025,
    categorie: 'Élite',
    discipline: '100m Haies',
    famille: 'Haies',
    club: 'Lille Métropole Athlétisme',
    ligue: 'Hauts-de-France',
    statut: 'Inscrite liste ministérielle Élite 2025',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-tual-gabriel-2025',
    nom: 'TUAL',
    prenom: 'Gabriel',
    nomComplet: 'TUAL Gabriel',
    sexe: 'M',
    anneeReference: 2025,
    categorie: 'Élite',
    discipline: '800m',
    famille: 'Demi-fond',
    club: 'US Talence',
    ligue: 'Nouvelle-Aquitaine',
    statut: 'Inscrit liste ministérielle Élite 2025',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-zhoya-sasha-2025',
    nom: 'ZHOYA',
    prenom: 'Sasha',
    nomComplet: 'ZHOYA Sasha',
    sexe: 'M',
    anneeReference: 2025,
    categorie: 'Élite',
    discipline: '110m Haies',
    famille: 'Haies',
    club: 'Clermont Athlétisme Auvergne',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Inscrit liste ministérielle Élite 2025',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-finot-alice-2025',
    nom: 'FINOT',
    prenom: 'Alice',
    nomComplet: 'FINOT Alice',
    sexe: 'F',
    anneeReference: 2025,
    categorie: 'Élite',
    discipline: '3000m Steeple',
    famille: 'Demi-fond',
    club: 'CA Montreuil 93',
    ligue: 'Île-de-France',
    statut: 'Inscrite liste ministérielle Élite 2025',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-tumba-meta-2025',
    nom: 'TUMBA',
    prenom: 'Meta',
    nomComplet: 'TUMBA Meta',
    sexe: 'F',
    anneeReference: 2025,
    categorie: 'Sénior',
    discipline: '400m Haies',
    famille: 'Haies',
    club: 'G2A Grand Angoulême Athlétisme',
    ligue: 'Nouvelle-Aquitaine',
    statut: 'Inscrite liste ministérielle Sénior 2025',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-ammirati-anthony-2025',
    nom: 'AMMIRATI',
    prenom: 'Anthony',
    nomComplet: 'AMMIRATI Anthony',
    sexe: 'M',
    anneeReference: 2025,
    categorie: 'Sénior',
    discipline: 'Perche',
    famille: 'Sauts',
    club: 'Athlétisme Club Clermontais',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Inscrit liste ministérielle Sénior 2025',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-konate-erwan-2025',
    nom: 'KONATE',
    prenom: 'Erwan',
    nomComplet: 'KONATE Erwan',
    sexe: 'M',
    anneeReference: 2025,
    categorie: 'Sénior',
    discipline: 'Longueur',
    famille: 'Sauts',
    club: 'Amiens UC',
    ligue: 'Hauts-de-France',
    statut: 'Inscrit liste ministérielle Sénior 2025',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
  {
    id: 'shn-chandon-alice-2025',
    nom: 'CHANDON',
    prenom: 'Alice',
    nomComplet: 'CHANDON Alice',
    sexe: 'F',
    anneeReference: 2025,
    categorie: 'Espoir',
    discipline: 'Hauteur',
    famille: 'Sauts',
    club: 'EA Centre Isere',
    ligue: 'Auvergne-Rhône-Alpes',
    statut: 'Inscrite liste ministérielle Espoirs 2025',
    source: 'Arrêté ministériel Sportifs de Haut Niveau',
  },
];

/**
 * Normalise un nom d'athlète pour recherche ou comparaison insensible à la casse et aux accents.
 */
export function normalizeAthleteName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compare si deux chaînes de nom d'athlète correspondent (ex: "MAYER Kevin" et "Kevin Mayer").
 */
export function isAthleteNameMatch(nameA: string, nameB: string): boolean {
  const normA = normalizeAthleteName(nameA);
  const normB = normalizeAthleteName(nameB);
  if (normA === normB) return true;

  const tokensA = new Set(normA.split(' '));
  const tokensB = new Set(normB.split(' '));
  if (tokensA.size === 0 || tokensB.size === 0) return false;

  // Si tous les mots de l'un sont présents dans l'autre
  const allAInB = Array.from(tokensA).every(t => tokensB.has(t));
  const allBInA = Array.from(tokensB).every(t => tokensA.has(t));
  return allAInB && allBInA;
}

/**
 * Exporte un jeu de données SHN au format CSV téléchargeable
 */
export function exportSHNToCSV(athletes: SHNAthlete[]): string {
  const headers = ['Nom', 'Prénom', 'Nom Complet', 'Sexe', 'Année Référence', 'Catégorie Liste', 'Discipline', 'Famille', 'Club', 'Ligue', 'Statut', 'Source'];
  const rows = athletes.map(a => [
    `"${a.nom.replace(/"/g, '""')}"`,
    `"${a.prenom.replace(/"/g, '""')}"`,
    `"${a.nomComplet.replace(/"/g, '""')}"`,
    `"${a.sexe}"`,
    a.anneeReference,
    `"${a.categorie}"`,
    `"${a.discipline.replace(/"/g, '""')}"`,
    `"${a.famille}"`,
    `"${a.club.replace(/"/g, '""')}"`,
    `"${a.ligue.replace(/"/g, '""')}"`,
    `"${(a.statut || '').replace(/"/g, '""')}"`,
    `"${(a.source || '').replace(/"/g, '""')}"`,
  ].join(';'));

  return [headers.join(';'), ...rows].join('\n');
}

/**
 * Décode un fichier CSV ministériel (séparateur point-virgule ou virgule)
 */
export function parseSHNFromCSV(csvContent: string): SHNAthlete[] {
  const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];

  // Détection du séparateur
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  const headers = firstLine.split(separator).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  // Indices
  const findIdx = (names: string[]) => headers.findIndex(h => names.some(n => h.includes(n)));
  const nomIdx = findIdx(['nom complet', 'nom', 'athlete', 'nom_prenom']);
  const prenomIdx = findIdx(['prenom', 'prénom']);
  const sexeIdx = findIdx(['sexe', 'genre']);
  const anneeIdx = findIdx(['annee', 'année', 'saison', 'reference', 'ref']);
  const catIdx = findIdx(['categorie', 'catégorie', 'liste', 'type_liste']);
  const discIdx = findIdx(['discipline', 'epreuve', 'épreuve', 'specialite', 'spécialité']);
  const famIdx = findIdx(['famille']);
  const clubIdx = findIdx(['club', 'association']);
  const ligueIdx = findIdx(['ligue', 'region', 'région']);
  const statutIdx = findIdx(['statut', 'details', 'commentaire']);

  const parsedAthletes: SHNAthlete[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Parsing sommaire gérant les guillemets
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        cols.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim().replace(/^"|"$/g, ''));

    const nomVal = nomIdx >= 0 ? cols[nomIdx] || '' : '';
    const prenomVal = prenomIdx >= 0 ? cols[prenomIdx] || '' : '';
    const nomComplet = prenomVal ? `${nomVal.toUpperCase()} ${prenomVal}` : nomVal;

    if (!nomComplet) continue;

    // Catégorie
    const rawCat = (catIdx >= 0 ? cols[catIdx] : '').toLowerCase();
    let cat: SHNCategory = 'Espoir';
    if (rawCat.includes('elite') || rawCat.includes('élite')) cat = 'Élite';
    else if (rawCat.includes('senior') || rawCat.includes('sénior')) cat = 'Sénior';
    else if (rawCat.includes('releve') || rawCat.includes('relève') || rawCat.includes('jeune')) cat = 'Relève';
    else if (rawCat.includes('collectif')) cat = 'Collectifs Nationaux';
    else if (rawCat.includes('reconversion')) cat = 'Reconversion';
    else if (rawCat.includes('espoir')) cat = 'Espoir';

    // Année
    let annee = new Date().getFullYear();
    if (anneeIdx >= 0 && cols[anneeIdx]) {
      const p = parseInt(cols[anneeIdx], 10);
      if (!isNaN(p) && p > 1990 && p < 2040) annee = p;
    }

    // Famille
    const disc = discIdx >= 0 ? cols[discIdx] : 'Athlétisme';
    let fam: SHNDisciplineFamily = 'Sprint';
    const discLower = disc.toLowerCase();
    if (famIdx >= 0 && cols[famIdx]) {
      const fVal = cols[famIdx].toLowerCase();
      if (fVal.includes('haie')) fam = 'Haies';
      else if (fVal.includes('fond') || fVal.includes('demi')) fam = 'Demi-fond';
      else if (fVal.includes('saut') || fVal.includes('perche') || fVal.includes('hauteur')) fam = 'Sauts';
      else if (fVal.includes('lancer') || fVal.includes('poids') || fVal.includes('disque')) fam = 'Lancers';
      else if (fVal.includes('combin') || fVal.includes('deca') || fVal.includes('hepta')) fam = 'Combinés';
      else if (fVal.includes('marche')) fam = 'Marche';
    } else {
      if (discLower.includes('haie') || discLower.includes('60h') || discLower.includes('100h') || discLower.includes('110h') || discLower.includes('400h')) fam = 'Haies';
      else if (discLower.includes('800') || discLower.includes('1500') || discLower.includes('3000') || discLower.includes('5000') || discLower.includes('10000') || discLower.includes('steeple') || discLower.includes('cross') || discLower.includes('route') || discLower.includes('marathon')) fam = 'Demi-fond';
      else if (discLower.includes('hauteur') || discLower.includes('perche') || discLower.includes('longueur') || discLower.includes('triple')) fam = 'Sauts';
      else if (discLower.includes('poids') || discLower.includes('disque') || discLower.includes('marteau') || discLower.includes('javelot')) fam = 'Lancers';
      else if (discLower.includes('deca') || discLower.includes('hepta') || discLower.includes('penta') || discLower.includes('combin')) fam = 'Combinés';
      else if (discLower.includes('marche')) fam = 'Marche';
    }

    parsedAthletes.push({
      id: `shn-imported-${Date.now()}-${i}`,
      nom: nomVal || nomComplet.split(' ')[0],
      prenom: prenomVal || nomComplet.split(' ').slice(1).join(' '),
      nomComplet: nomComplet.trim(),
      sexe: (sexeIdx >= 0 && cols[sexeIdx]?.toUpperCase().startsWith('F')) ? 'F' : 'M',
      anneeReference: annee,
      categorie: cat,
      discipline: disc,
      famille: fam,
      club: clubIdx >= 0 ? cols[clubIdx] || 'Non renseigné' : 'Non renseigné',
      ligue: ligueIdx >= 0 ? cols[ligueIdx] || 'France' : 'France',
      statut: statutIdx >= 0 ? cols[statutIdx] || 'Inscrit sur liste ministérielle' : 'Inscrit sur liste ministérielle',
      source: 'Import utilisateur',
    });
  }

  return parsedAthletes;
}
