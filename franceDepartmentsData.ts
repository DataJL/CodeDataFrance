export interface FranceDepartment {
  code: string;
  name: string;
  region: string;
  chefLieu: string;
  lat: number;
  lon: number;
  svgX: number;
  svgY: number;
  isOutreMer?: boolean;
}

// Projection centrée sur la France métropolitaine dans une boîte viewBox 0 0 620 580
function project(lat: number, lon: number): { svgX: number; svgY: number } {
  const svgX = Math.round((310 + (lon - 2.4) * 38.0) * 10) / 10;
  const svgY = Math.round((290 - (lat - 46.5) * 54.8) * 10) / 10;
  return { svgX, svgY };
}

export const FRANCE_DEPARTMENTS: FranceDepartment[] = [
  { code: '01', name: 'Ain', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Bourg-en-Bresse', lat: 46.20, lon: 5.23, ...project(46.20, 5.23) },
  { code: '02', name: 'Aisne', region: 'Hauts-de-France', chefLieu: 'Laon', lat: 49.56, lon: 3.62, ...project(49.56, 3.62) },
  { code: '03', name: 'Allier', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Moulins', lat: 46.56, lon: 3.33, ...project(46.56, 3.33) },
  { code: '04', name: 'Alpes-de-Haute-Provence', region: 'Provence-Alpes-Côte d\'Azur', chefLieu: 'Digne-les-Bains', lat: 44.09, lon: 6.23, ...project(44.09, 6.23) },
  { code: '05', name: 'Hautes-Alpes', region: 'Provence-Alpes-Côte d\'Azur', chefLieu: 'Gap', lat: 44.56, lon: 6.08, ...project(44.56, 6.08) },
  { code: '06', name: 'Alpes-Maritimes', region: 'Provence-Alpes-Côte d\'Azur', chefLieu: 'Nice', lat: 43.70, lon: 7.26, ...project(43.70, 7.26) },
  { code: '07', name: 'Ardèche', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Privas', lat: 44.73, lon: 4.59, ...project(44.73, 4.59) },
  { code: '08', name: 'Ardennes', region: 'Grand Est', chefLieu: 'Charleville-Mézières', lat: 49.77, lon: 4.72, ...project(49.77, 4.72) },
  { code: '09', name: 'Ariège', region: 'Occitanie', chefLieu: 'Foix', lat: 42.96, lon: 1.60, ...project(42.96, 1.60) },
  { code: '10', name: 'Aube', region: 'Grand Est', chefLieu: 'Troyes', lat: 48.30, lon: 4.07, ...project(48.30, 4.07) },
  { code: '11', name: 'Aude', region: 'Occitanie', chefLieu: 'Carcassonne', lat: 43.21, lon: 2.35, ...project(43.21, 2.35) },
  { code: '12', name: 'Aveyron', region: 'Occitanie', chefLieu: 'Rodez', lat: 44.35, lon: 2.57, ...project(44.35, 2.57) },
  { code: '13', name: 'Bouches-du-Rhône', region: 'Provence-Alpes-Côte d\'Azur', chefLieu: 'Marseille', lat: 43.53, lon: 5.37, ...project(43.53, 5.37) },
  { code: '14', name: 'Calvados', region: 'Normandie', chefLieu: 'Caen', lat: 49.18, lon: -0.37, ...project(49.18, -0.37) },
  { code: '15', name: 'Cantal', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Aurillac', lat: 44.93, lon: 2.44, ...project(44.93, 2.44) },
  { code: '16', name: 'Charente', region: 'Nouvelle-Aquitaine', chefLieu: 'Angoulême', lat: 45.65, lon: 0.16, ...project(45.65, 0.16) },
  { code: '17', name: 'Charente-Maritime', region: 'Nouvelle-Aquitaine', chefLieu: 'La Rochelle', lat: 45.94, lon: -0.95, ...project(45.94, -0.95) },
  { code: '18', name: 'Cher', region: 'Centre-Val de Loire', chefLieu: 'Bourges', lat: 47.08, lon: 2.39, ...project(47.08, 2.39) },
  { code: '19', name: 'Corrèze', region: 'Nouvelle-Aquitaine', chefLieu: 'Tulle', lat: 45.27, lon: 1.77, ...project(45.27, 1.77) },
  { code: '2A', name: 'Corse-du-Sud', region: 'Corse', chefLieu: 'Ajaccio', lat: 41.92, lon: 8.74, ...project(41.92, 8.74) },
  { code: '2B', name: 'Haute-Corse', region: 'Corse', chefLieu: 'Bastia', lat: 42.70, lon: 9.45, ...project(42.70, 9.45) },
  { code: '21', name: 'Côte-d\'Or', region: 'Bourgogne-Franche-Comté', chefLieu: 'Dijon', lat: 47.32, lon: 5.04, ...project(47.32, 5.04) },
  { code: '22', name: 'Côtes-d\'Armor', region: 'Bretagne', chefLieu: 'Saint-Brieuc', lat: 48.51, lon: -2.76, ...project(48.51, -2.76) },
  { code: '23', name: 'Creuse', region: 'Nouvelle-Aquitaine', chefLieu: 'Guéret', lat: 46.17, lon: 1.87, ...project(46.17, 1.87) },
  { code: '24', name: 'Dordogne', region: 'Nouvelle-Aquitaine', chefLieu: 'Périgueux', lat: 45.18, lon: 0.72, ...project(45.18, 0.72) },
  { code: '25', name: 'Doubs', region: 'Bourgogne-Franche-Comté', chefLieu: 'Besançon', lat: 47.24, lon: 6.02, ...project(47.24, 6.02) },
  { code: '26', name: 'Drôme', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Valence', lat: 44.93, lon: 4.89, ...project(44.93, 4.89) },
  { code: '27', name: 'Eure', region: 'Normandie', chefLieu: 'Évreux', lat: 49.02, lon: 1.15, ...project(49.02, 1.15) },
  { code: '28', name: 'Eure-et-Loir', region: 'Centre-Val de Loire', chefLieu: 'Chartres', lat: 48.44, lon: 1.48, ...project(48.44, 1.48) },
  { code: '29', name: 'Finistère', region: 'Bretagne', chefLieu: 'Quimper', lat: 48.20, lon: -4.10, ...project(48.20, -4.10) },
  { code: '30', name: 'Gard', region: 'Occitanie', chefLieu: 'Nîmes', lat: 43.83, lon: 4.36, ...project(43.83, 4.36) },
  { code: '31', name: 'Haute-Garonne', region: 'Occitanie', chefLieu: 'Toulouse', lat: 43.60, lon: 1.44, ...project(43.60, 1.44) },
  { code: '32', name: 'Gers', region: 'Occitanie', chefLieu: 'Auch', lat: 43.65, lon: 0.58, ...project(43.65, 0.58) },
  { code: '33', name: 'Gironde', region: 'Nouvelle-Aquitaine', chefLieu: 'Bordeaux', lat: 44.84, lon: -0.58, ...project(44.84, -0.58) },
  { code: '34', name: 'Hérault', region: 'Occitanie', chefLieu: 'Montpellier', lat: 43.61, lon: 3.87, ...project(43.61, 3.87) },
  { code: '35', name: 'Ille-et-Vilaine', region: 'Bretagne', chefLieu: 'Rennes', lat: 48.11, lon: -1.68, ...project(48.11, -1.68) },
  { code: '36', name: 'Indre', region: 'Centre-Val de Loire', chefLieu: 'Châteauroux', lat: 46.81, lon: 1.69, ...project(46.81, 1.69) },
  { code: '37', name: 'Indre-et-Loire', region: 'Centre-Val de Loire', chefLieu: 'Tours', lat: 47.39, lon: 0.69, ...project(47.39, 0.69) },
  { code: '38', name: 'Isère', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Grenoble', lat: 45.18, lon: 5.72, ...project(45.18, 5.72) },
  { code: '39', name: 'Jura', region: 'Bourgogne-Franche-Comté', chefLieu: 'Lons-le-Saunier', lat: 46.67, lon: 5.55, ...project(46.67, 5.55) },
  { code: '40', name: 'Landes', region: 'Nouvelle-Aquitaine', chefLieu: 'Mont-de-Marsan', lat: 43.89, lon: -0.50, ...project(43.89, -0.50) },
  { code: '41', name: 'Loir-et-Cher', region: 'Centre-Val de Loire', chefLieu: 'Blois', lat: 47.59, lon: 1.33, ...project(47.59, 1.33) },
  { code: '42', name: 'Loire', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Saint-Étienne', lat: 45.43, lon: 4.39, ...project(45.43, 4.39) },
  { code: '43', name: 'Haute-Loire', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Le Puy-en-Velay', lat: 45.04, lon: 3.88, ...project(45.04, 3.88) },
  { code: '44', name: 'Loire-Atlantique', region: 'Pays de la Loire', chefLieu: 'Nantes', lat: 47.22, lon: -1.55, ...project(47.22, -1.55) },
  { code: '45', name: 'Loiret', region: 'Centre-Val de Loire', chefLieu: 'Orléans', lat: 47.90, lon: 1.90, ...project(47.90, 1.90) },
  { code: '46', name: 'Lot', region: 'Occitanie', chefLieu: 'Cahors', lat: 44.45, lon: 1.44, ...project(44.45, 1.44) },
  { code: '47', name: 'Lot-et-Garonne', region: 'Nouvelle-Aquitaine', chefLieu: 'Agen', lat: 44.20, lon: 0.62, ...project(44.20, 0.62) },
  { code: '48', name: 'Lozère', region: 'Occitanie', chefLieu: 'Mende', lat: 44.52, lon: 3.50, ...project(44.52, 3.50) },
  { code: '49', name: 'Maine-et-Loire', region: 'Pays de la Loire', chefLieu: 'Angers', lat: 47.47, lon: -0.55, ...project(47.47, -0.55) },
  { code: '50', name: 'Manche', region: 'Normandie', chefLieu: 'Saint-Lô', lat: 49.11, lon: -1.09, ...project(49.11, -1.09) },
  { code: '51', name: 'Marne', region: 'Grand Est', chefLieu: 'Reims', lat: 48.96, lon: 4.36, ...project(48.96, 4.36) },
  { code: '52', name: 'Haute-Marne', region: 'Grand Est', chefLieu: 'Chaumont', lat: 48.11, lon: 5.14, ...project(48.11, 5.14) },
  { code: '53', name: 'Mayenne', region: 'Pays de la Loire', chefLieu: 'Laval', lat: 48.07, lon: -0.77, ...project(48.07, -0.77) },
  { code: '54', name: 'Meurthe-et-Moselle', region: 'Grand Est', chefLieu: 'Nancy', lat: 48.69, lon: 6.18, ...project(48.69, 6.18) },
  { code: '55', name: 'Meuse', region: 'Grand Est', chefLieu: 'Bar-le-Duc', lat: 48.77, lon: 5.16, ...project(48.77, 5.16) },
  { code: '56', name: 'Morbihan', region: 'Bretagne', chefLieu: 'Vannes', lat: 47.75, lon: -2.76, ...project(47.75, -2.76) },
  { code: '57', name: 'Moselle', region: 'Grand Est', chefLieu: 'Metz', lat: 49.12, lon: 6.17, ...project(49.12, 6.17) },
  { code: '58', name: 'Nièvre', region: 'Bourgogne-Franche-Comté', chefLieu: 'Nevers', lat: 46.99, lon: 3.16, ...project(46.99, 3.16) },
  { code: '59', name: 'Nord', region: 'Hauts-de-France', chefLieu: 'Lille', lat: 50.63, lon: 3.06, ...project(50.63, 3.06) },
  { code: '60', name: 'Oise', region: 'Hauts-de-France', chefLieu: 'Beauvais', lat: 49.43, lon: 2.08, ...project(49.43, 2.08) },
  { code: '61', name: 'Orne', region: 'Normandie', chefLieu: 'Alençon', lat: 48.43, lon: 0.09, ...project(48.43, 0.09) },
  { code: '62', name: 'Pas-de-Calais', region: 'Hauts-de-France', chefLieu: 'Arras', lat: 50.29, lon: 2.78, ...project(50.29, 2.78) },
  { code: '63', name: 'Puy-de-Dôme', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Clermont-Ferrand', lat: 45.78, lon: 3.08, ...project(45.78, 3.08) },
  { code: '64', name: 'Pyrénées-Atlantiques', region: 'Nouvelle-Aquitaine', chefLieu: 'Pau', lat: 43.30, lon: -0.37, ...project(43.30, -0.37) },
  { code: '65', name: 'Hautes-Pyrénées', region: 'Occitanie', chefLieu: 'Tarbes', lat: 43.23, lon: 0.08, ...project(43.23, 0.08) },
  { code: '66', name: 'Pyrénées-Orientales', region: 'Occitanie', chefLieu: 'Perpignan', lat: 42.70, lon: 2.89, ...project(42.70, 2.89) },
  { code: '67', name: 'Bas-Rhin', region: 'Grand Est', chefLieu: 'Strasbourg', lat: 48.58, lon: 7.75, ...project(48.58, 7.75) },
  { code: '68', name: 'Haut-Rhin', region: 'Grand Est', chefLieu: 'Colmar', lat: 47.75, lon: 7.33, ...project(47.75, 7.33) },
  { code: '69', name: 'Rhône', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Lyon', lat: 45.76, lon: 4.83, ...project(45.76, 4.83) },
  { code: '70', name: 'Haute-Saône', region: 'Bourgogne-Franche-Comté', chefLieu: 'Vesoul', lat: 47.62, lon: 6.15, ...project(47.62, 6.15) },
  { code: '71', name: 'Saône-et-Loire', region: 'Bourgogne-Franche-Comté', chefLieu: 'Mâcon', lat: 46.30, lon: 4.83, ...project(46.30, 4.83) },
  { code: '72', name: 'Sarthe', region: 'Pays de la Loire', chefLieu: 'Le Mans', lat: 48.00, lon: 0.20, ...project(48.00, 0.20) },
  { code: '73', name: 'Savoie', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Chambéry', lat: 45.56, lon: 5.92, ...project(45.56, 5.92) },
  { code: '74', name: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes', chefLieu: 'Annecy', lat: 45.90, lon: 6.12, ...project(45.90, 6.12) },
  { code: '75', name: 'Paris', region: 'Île-de-France', chefLieu: 'Paris', lat: 48.85, lon: 2.35, ...project(48.85, 2.35) },
  { code: '76', name: 'Seine-Maritime', region: 'Normandie', chefLieu: 'Rouen', lat: 49.44, lon: 1.09, ...project(49.44, 1.09) },
  { code: '77', name: 'Seine-et-Marne', region: 'Île-de-France', chefLieu: 'Melun', lat: 48.54, lon: 2.66, ...project(48.54, 2.66) },
  { code: '78', name: 'Yvelines', region: 'Île-de-France', chefLieu: 'Versailles', lat: 48.80, lon: 2.13, ...project(48.80, 2.13) },
  { code: '79', name: 'Deux-Sèvres', region: 'Nouvelle-Aquitaine', chefLieu: 'Niort', lat: 46.32, lon: -0.46, ...project(46.32, -0.46) },
  { code: '80', name: 'Somme', region: 'Hauts-de-France', chefLieu: 'Amiens', lat: 49.89, lon: 2.30, ...project(49.89, 2.30) },
  { code: '81', name: 'Tarn', region: 'Occitanie', chefLieu: 'Albi', lat: 43.93, lon: 2.15, ...project(43.93, 2.15) },
  { code: '82', name: 'Tarn-et-Garonne', region: 'Occitanie', chefLieu: 'Montauban', lat: 44.02, lon: 1.35, ...project(44.02, 1.35) },
  { code: '83', name: 'Var', region: 'Provence-Alpes-Côte d\'Azur', chefLieu: 'Toulon', lat: 43.12, lon: 5.93, ...project(43.12, 5.93) },
  { code: '84', name: 'Vaucluse', region: 'Provence-Alpes-Côte d\'Azur', chefLieu: 'Avignon', lat: 43.95, lon: 4.80, ...project(43.95, 4.80) },
  { code: '85', name: 'Vendée', region: 'Pays de la Loire', chefLieu: 'La Roche-sur-Yon', lat: 46.67, lon: -1.43, ...project(46.67, -1.43) },
  { code: '86', name: 'Vienne', region: 'Nouvelle-Aquitaine', chefLieu: 'Poitiers', lat: 46.58, lon: 0.34, ...project(46.58, 0.34) },
  { code: '87', name: 'Haute-Vienne', region: 'Nouvelle-Aquitaine', chefLieu: 'Limoges', lat: 45.83, lon: 1.26, ...project(45.83, 1.26) },
  { code: '88', name: 'Vosges', region: 'Grand Est', chefLieu: 'Épinal', lat: 48.17, lon: 6.45, ...project(48.17, 6.45) },
  { code: '89', name: 'Yonne', region: 'Bourgogne-Franche-Comté', chefLieu: 'Auxerre', lat: 47.80, lon: 3.57, ...project(47.80, 3.57) },
  { code: '90', name: 'Territoire de Belfort', region: 'Bourgogne-Franche-Comté', chefLieu: 'Belfort', lat: 47.64, lon: 6.86, ...project(47.64, 6.86) },
  { code: '91', name: 'Essonne', region: 'Île-de-France', chefLieu: 'Évry', lat: 48.63, lon: 2.43, ...project(48.63, 2.43) },
  { code: '92', name: 'Hauts-de-Seine', region: 'Île-de-France', chefLieu: 'Nanterre', lat: 48.89, lon: 2.21, ...project(48.89, 2.21) },
  { code: '93', name: 'Seine-Saint-Denis', region: 'Île-de-France', chefLieu: 'Bobigny', lat: 48.91, lon: 2.44, ...project(48.91, 2.44) },
  { code: '94', name: 'Val-de-Marne', region: 'Île-de-France', chefLieu: 'Créteil', lat: 48.79, lon: 2.45, ...project(48.79, 2.45) },
  { code: '95', name: 'Val-d\'Oise', region: 'Île-de-France', chefLieu: 'Cergy', lat: 49.04, lon: 2.06, ...project(49.04, 2.06) },

  // Outre-Mer (positionnés dans un inset dédié en bas à gauche de la carte)
  { code: '971', name: 'Guadeloupe', region: 'Guadeloupe', chefLieu: 'Pointe-à-Pitre', lat: 16.26, lon: -61.55, svgX: 50, svgY: 480, isOutreMer: true },
  { code: '972', name: 'Martinique', region: 'Martinique', chefLieu: 'Fort-de-France', lat: 14.64, lon: -61.02, svgX: 85, svgY: 480, isOutreMer: true },
  { code: '973', name: 'Guyane', region: 'Guyane', chefLieu: 'Cayenne', lat: 4.93, lon: -52.33, svgX: 50, svgY: 520, isOutreMer: true },
  { code: '974', name: 'La Réunion', region: 'La Réunion', chefLieu: 'Saint-Denis', lat: -20.88, lon: 55.45, svgX: 85, svgY: 520, isOutreMer: true },
  { code: '976', name: 'Mayotte', region: 'Mayotte', chefLieu: 'Mamoudzou', lat: -12.78, lon: 45.22, svgX: 120, svgY: 500, isOutreMer: true },
];

export const DEPT_BY_CODE: Record<string, FranceDepartment> = {};
FRANCE_DEPARTMENTS.forEach(dept => {
  DEPT_BY_CODE[dept.code] = dept;
  // Gérer variantes sans zéro initial (ex: '6' pour '06')
  if (dept.code.startsWith('0')) {
    DEPT_BY_CODE[dept.code.slice(1)] = dept;
  }
});

// Table de correspondance ville / club / mots-clés vers code département
const CITY_TO_DEPT: Record<string, string> = {
  'paris': '75',
  'marseille': '13',
  'aix': '13',
  'lyon': '69',
  'grenoble': '38',
  'isere': '38',
  'isère': '38',
  'bordeaux': '33',
  'lille': '59',
  'toulouse': '31',
  'nice': '06',
  'nantes': '44',
  'strasbourg': '67',
  'montpellier': '34',
  'rennes': '35',
  'reims': '51',
  'toulon': '83',
  'saint-etienne': '42',
  'le havre': '76',
  'dijon': '21',
  'angers': '49',
  'nimes': '30',
  'nîmes': '30',
  'clermont': '63',
  'clermont-ferrand': '63',
  'rouen': '76',
  'amiens': '80',
  'metz': '57',
  'nancy': '54',
  'besancon': '25',
  'besançon': '25',
  'orleans': '45',
  'orléans': '45',
  'mulhouse': '68',
  'caen': '14',
  'boulogne': '62',
  'calais': '62',
  'angouleme': '16',
  'angoulême': '16',
  'poitiers': '86',
  'la rochelle': '17',
  'avignon': '84',
  'pau': '64',
  'bayonne': '64',
  'annecy': '74',
  'chambery': '73',
  'chambéry': '73',
  'colmar': '68',
  'bourges': '18',
  'troyes': '10',
  'valence': '26',
  'montgeron': '91',
  'montreuil': '93',
  'evry': '91',
  'évry': '91',
  'franconville': '95',
  'cergy': '95',
  'creteil': '94',
  'créteil': '94',
  'nanterre': '92',
  'lisses': '91',
  'sarreguemines': '57',
  'talence': '33',
  'martinique': '972',
  'guadeloupe': '971',
  'guyane': '973',
  'reunion': '974',
  'réunion': '974',
  'mayotte': '976',
};

/**
 * Extrait le code département français normalisé à partir d'un enregistrement
 */
export function extractDepartmentCode(rawDept?: string, club?: string, lieu?: string, region?: string): string | null {
  // 1. Si le champ departement est directement renseigné
  if (rawDept && rawDept.trim()) {
    const cleaned = rawDept.trim();
    // Ex: "38", "06", "75", "2A", "2B", "974"
    const match = cleaned.match(/^([0-9]{2,3}|2[AB])/i);
    if (match) {
      const code = match[1].toUpperCase();
      if (DEPT_BY_CODE[code]) {
        return DEPT_BY_CODE[code].code;
      }
    }
  }

  // 2. Recherche d'un code entre parenthèses dans le nom du club (ex: "EA Centre Isere (38)")
  if (club) {
    const parenMatch = club.match(/\(([0-9]{2,3}|2[AB])\)/i);
    if (parenMatch) {
      const code = parenMatch[1].toUpperCase();
      if (DEPT_BY_CODE[code]) {
        return DEPT_BY_CODE[code].code;
      }
    }
  }

  // 3. Recherche textuelle dans le nom du club ou de la ville
  const textToScan = `${club || ''} ${lieu || ''}`.toLowerCase();
  for (const [keyword, deptCode] of Object.entries(CITY_TO_DEPT)) {
    if (textToScan.includes(keyword)) {
      return deptCode;
    }
  }

  // 4. Correspondance régionale par défaut si connue
  if (region) {
    const regLower = region.toLowerCase();
    if (regLower.includes('bretagne')) return '35';
    if (regLower.includes('normandie')) return '76';
    if (regLower.includes('hauts-de-france')) return '59';
    if (regLower.includes('ile-de-france') || regLower.includes('île-de-france')) return '75';
    if (regLower.includes('grand est')) return '67';
    if (regLower.includes('auvergne-rhone') || regLower.includes('auvergne-rhône')) return '69';
    if (regLower.includes('provence') || regLower.includes('paca')) return '13';
    if (regLower.includes('occitanie')) return '31';
    if (regLower.includes('nouvelle-aquitaine')) return '33';
    if (regLower.includes('pays de la loire')) return '44';
    if (regLower.includes('centre-val')) return '45';
    if (regLower.includes('bourgogne')) return '21';
    if (regLower.includes('corse')) return '2A';
  }

  return null;
}
