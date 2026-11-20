import fs from 'fs';
import path from 'path';

const CLUBS = [
  { name: 'Racing Multi Athlon', dpt: '75', lig: 'Île-de-France', num: '075001' },
  { name: 'Lille Métropole Athlétisme', dpt: '59', lig: 'Hauts-de-France', num: '059002' },
  { name: 'Lyon Athlétisme', dpt: '69', lig: 'Auvergne-Rhône-Alpes', num: '069003' },
  { name: 'Montpellier Athletic Méditerranée', dpt: '34', lig: 'Occitanie', num: '034004' },
  { name: 'Clermont Athlétisme Auvergne', dpt: '63', lig: 'Auvergne-Rhône-Alpes', num: '063005' },
  { name: 'Stade Rennais Athlétisme', dpt: '35', lig: 'Bretagne', num: '035006' },
  { name: 'Bordeaux Athlé', dpt: '33', lig: 'Nouvelle-Aquitaine', num: '033007' },
  { name: 'Entente Franconville Cesame VO', dpt: '95', lig: 'Île-de-France', num: '095008' },
  { name: 'Athlé 91', dpt: '91', lig: 'Île-de-France', num: '091009' },
  { name: 'Nice Côte d\'Azur Athlétisme', dpt: '06', lig: "Provence-Alpes-Côte d'Azur", num: '006010' },
  { name: 'Pays de Colmar Athlétisme', dpt: '68', lig: 'Grand Est', num: '068011' },
  { name: 'Dijon UC', dpt: '21', lig: 'Bourgogne-Franche-Comté', num: '021012' },
  { name: 'Nantes Métropole Athlétisme', dpt: '44', lig: 'Pays de la Loire', num: '044013' },
  { name: 'Athlétisme Metz Métropole', dpt: '57', lig: 'Grand Est', num: '057014' },
  { name: 'Amiens UC', dpt: '80', lig: 'Hauts-de-France', num: '080015' },
  { name: 'CA Montreuil 93', dpt: '93', lig: 'Île-de-France', num: '093016' },
  { name: 'Marseille Athlétisme', dpt: '13', lig: "Provence-Alpes-Côte d'Azur", num: '013017' },
  { name: 'Toulouse Métropole Athlétisme', dpt: '31', lig: 'Occitanie', num: '031018' },
  { name: 'Rouen Normandie Athlétisme', dpt: '76', lig: 'Normandie', num: '076019' },
  { name: 'Caen Athlétic Club', dpt: '14', lig: 'Normandie', num: '014020' },
  { name: 'Etoile de Morne-à-l\'Eau', dpt: '971', lig: 'Guadeloupe', num: '971001' },
  { name: 'Saint-Denis Réunion Athlé', dpt: '974', lig: 'La Réunion', num: '974001' }
];

const PRENOMS_M = ['Gabriel', 'Sasha', 'Pablo', 'Jeff', 'Thibaut', 'Kevin', 'Jimmy', 'Azeddine', 'Yann', 'Makenson', 'Wilfried', 'Ludvy', 'Lucas', 'Hugo', 'Arthur', 'Louis', 'Jules', 'Paul', 'Thomas', 'Nathan', 'Clément', 'Mathis', 'Romain', 'Antoine', 'Valentin', 'Théo'];
const PRENOMS_F = ['Cyréna', 'Hilary', 'Alice', 'Gemima', 'Hélène', 'Pauline', 'Léa', 'Emma', 'Chloé', 'Camille', 'Sarah', 'Inès', 'Jade', 'Louise', 'Lina', 'Eva', 'Zoé', 'Juliette', 'Agathe', 'Rose', 'Lucie', 'Julia', 'Romane', 'Manon'];
const NOMS = ['TUAL', 'SAMBA-MAYELA', 'ZHOYA', 'MATEO', 'ERIUS', 'KPATCHA', 'COLLET', 'FINOT', 'MAYER', 'GRESSIER', 'HABZ', 'SCHRUB', 'GLETTY', 'HAPPIO', 'VAILLANT', 'JOSEPH', 'PARISOT', 'STEY', 'LUCAS', 'MARTIN', 'BERNARD', 'THOMAS', 'PETIT', 'ROBERT', 'RICHARD', 'DURAND', 'DUBOIS', 'MOREAU', 'LAURENT', 'SIMON', 'MICHEL', 'LEFEBVRE', 'LEROY', 'ROUX', 'DAVID', 'BERTRAND', 'FOURNIER', 'GIRARD', 'BONNET', 'DUPONT', 'ROUSSEAU', 'VINCENT', 'GUERIN', 'BOYER', 'GARNIER', 'CHEVALIER', 'GARCIA', 'ROUSSEL'];

const DATES_PISTE = [
  '2026-04-18', '2026-04-25', '2026-05-02', '2026-05-09', '2026-05-16',
  '2026-05-23', '2026-05-30', '2026-06-06', '2026-06-13', '2026-06-20',
  '2026-06-27', '2026-07-04', '2026-07-11', '2026-07-18', '2026-07-25'
];

const LIEUX_PISTE = [
  { nom: 'Paris (Stade Charléty)', dpt: '75', lig: 'Île-de-France' },
  { nom: 'Angers (Stade Josué)', dpt: '49', lig: 'Pays de la Loire' },
  { nom: 'Marseille (Stade Delort)', dpt: '13', lig: "Provence-Alpes-Côte d'Azur" },
  { nom: 'Lyon (Stade de Parilly)', dpt: '69', lig: 'Auvergne-Rhône-Alpes' },
  { nom: 'Villeneuve d\'Ascq (Stadium)', dpt: '59', lig: 'Hauts-de-France' },
  { nom: 'Bordeaux (Stade Chaban)', dpt: '33', lig: 'Nouvelle-Aquitaine' },
  { nom: 'Montpellier (Stade Philippidès)', dpt: '34', lig: 'Occitanie' },
  { nom: 'Rennes (Stade Courtemanche)', dpt: '35', lig: 'Bretagne' },
  { nom: 'Nice (Parc des Sports)', dpt: '06', lig: "Provence-Alpes-Côte d'Azur" },
  { nom: 'Nancy (Stade Marcel Picot)', dpt: '54', lig: 'Grand Est' }
];

// Configuration complète des épreuves sur piste / plein air
const PISTE_CONFIGS = [
  // --- BENJAMINS (BE) ---
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '104', disc: '50m', label: '50m-104', nature: 'time', baseVal: 7.15, step: 0.05, unit: 's', hasWind: true, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '304', disc: '50m Haies', label: '50m haies-304', nature: 'time', baseVal: 8.30, step: 0.08, unit: 's', hasWind: true, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '210', disc: '1000m', label: '1000m-210', nature: 'time', baseVal: 192.0, step: 2.5, unit: 'time', hasWind: false, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '501', disc: 'Hauteur', label: 'Hauteur-501', nature: 'distance', baseVal: 1.48, step: 0.03, unit: 'm', hasWind: false, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '502', disc: 'Perche', label: 'Perche-502', nature: 'distance', baseVal: 2.55, step: 0.05, unit: 'm', hasWind: false, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '503', disc: 'Longueur', label: 'Longueur-503', nature: 'distance', baseVal: 4.90, step: 0.06, unit: 'm', hasWind: true, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '504', disc: 'Triple Saut', label: 'Triple Saut-504', nature: 'distance', baseVal: 10.40, step: 0.10, unit: 'm', hasWind: true, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '601', disc: 'Poids', label: 'Poids-601', nature: 'distance', baseVal: 10.20, step: 0.15, unit: 'm', hasWind: false, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '602', disc: 'Disque', label: 'Disque-602', nature: 'distance', baseVal: 28.50, step: 0.40, unit: 'm', hasWind: false, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '603', disc: 'Marteau', label: 'Marteau-603', nature: 'distance', baseVal: 32.00, step: 0.50, unit: 'm', hasWind: false, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '604', disc: 'Javelot', label: 'Javelot-604', nature: 'distance', baseVal: 31.00, step: 0.45, unit: 'm', hasWind: false, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '724', disc: 'Tétrathlon', label: 'Tétrathlon-724', nature: 'points', baseVal: 1820, step: 40, unit: 'pts', hasWind: false, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '798', disc: 'Triathlon', label: 'Triathlon-798', nature: 'points', baseVal: 98, step: 3, unit: 'pts', hasWind: false, birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '902', disc: '2000m Marche', label: '2000m marche-902', nature: 'time', baseVal: 680.0, step: 10, unit: 'time', hasWind: false, birth: [2013, 2014] },

  // --- MINIMES (MI) ---
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '108', disc: '80m', label: '80m-108', nature: 'time', baseVal: 9.60, step: 0.05, unit: 's', hasWind: true, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '112', disc: '120m', label: '120m-112', nature: 'time', baseVal: 14.10, step: 0.08, unit: 's', hasWind: true, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['F'], code_ep: '308', disc: '80m Haies', label: '80m haies-308', nature: 'time', baseVal: 12.10, step: 0.08, unit: 's', hasWind: true, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M'], code_ep: '310', disc: '100m Haies', label: '100m haies-310', nature: 'time', baseVal: 13.90, step: 0.08, unit: 's', hasWind: true, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '320', disc: '200m Haies', label: '200m haies-320', nature: 'time', baseVal: 27.20, step: 0.12, unit: 's', hasWind: true, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '210', disc: '1000m', label: '1000m-210', nature: 'time', baseVal: 168.0, step: 2.0, unit: 'time', hasWind: false, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '230', disc: '2000m', label: '2000m-230', nature: 'time', baseVal: 375.0, step: 3.0, unit: 'time', hasWind: false, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '501', disc: 'Hauteur', label: 'Hauteur-501', nature: 'distance', baseVal: 1.74, step: 0.03, unit: 'm', hasWind: false, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '502', disc: 'Perche', label: 'Perche-502', nature: 'distance', baseVal: 3.50, step: 0.08, unit: 'm', hasWind: false, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '503', disc: 'Longueur', label: 'Longueur-503', nature: 'distance', baseVal: 5.95, step: 0.07, unit: 'm', hasWind: true, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '504', disc: 'Triple Saut', label: 'Triple Saut-504', nature: 'distance', baseVal: 12.40, step: 0.12, unit: 'm', hasWind: true, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '601', disc: 'Poids', label: 'Poids-601', nature: 'distance', baseVal: 13.60, step: 0.20, unit: 'm', hasWind: false, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '602', disc: 'Disque', label: 'Disque-602', nature: 'distance', baseVal: 39.50, step: 0.50, unit: 'm', hasWind: false, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '603', disc: 'Marteau', label: 'Marteau-603', nature: 'distance', baseVal: 44.00, step: 0.60, unit: 'm', hasWind: false, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '604', disc: 'Javelot', label: 'Javelot-604', nature: 'distance', baseVal: 46.00, step: 0.60, unit: 'm', hasWind: false, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '798', disc: 'Triathlon', label: 'Triathlon-798', nature: 'points', baseVal: 115, step: 2, unit: 'pts', hasWind: false, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M'], code_ep: '780', disc: 'Octathlon', label: 'Octathlon-780', nature: 'points', baseVal: 4200, step: 60, unit: 'pts', hasWind: false, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['F'], code_ep: '770', disc: 'Heptathlon', label: 'Heptathlon-770', nature: 'points', baseVal: 4100, step: 60, unit: 'pts', hasWind: false, birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '903', disc: '3000m Marche', label: '3000m marche-903', nature: 'time', baseVal: 910.0, step: 12, unit: 'time', hasWind: false, birth: [2011, 2012] },

  // --- CADETS (CA) ---
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '110', disc: '100m', label: '100m-110', nature: 'time', baseVal: 10.95, step: 0.04, unit: 's', hasWind: true, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '120', disc: '200m', label: '200m-120', nature: 'time', baseVal: 22.10, step: 0.08, unit: 's', hasWind: true, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '140', disc: '400m', label: '400m-140', nature: 'time', baseVal: 49.80, step: 0.15, unit: 's', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '200', disc: '800m', label: '800m-200', nature: 'time', baseVal: 116.0, step: 0.8, unit: 'time', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '220', disc: '1500m', label: '1500m-220', nature: 'time', baseVal: 244.0, step: 1.5, unit: 'time', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '230', disc: '3000m', label: '3000m-230', nature: 'time', baseVal: 520.0, step: 2.5, unit: 'time', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['F'], code_ep: '310', disc: '100m Haies', label: '100m haies-310', nature: 'time', baseVal: 14.10, step: 0.07, unit: 's', hasWind: true, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M'], code_ep: '311', disc: '110m Haies', label: '110m haies-311', nature: 'time', baseVal: 14.20, step: 0.07, unit: 's', hasWind: true, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '340', disc: '400m Haies', label: '400m haies-340', nature: 'time', baseVal: 55.40, step: 0.20, unit: 's', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '280', disc: '2000m Steeple', label: '2000m steeple-280', nature: 'time', baseVal: 380.0, step: 2.5, unit: 'time', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '501', disc: 'Hauteur', label: 'Hauteur-501', nature: 'distance', baseVal: 1.98, step: 0.03, unit: 'm', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '502', disc: 'Perche', label: 'Perche-502', nature: 'distance', baseVal: 4.50, step: 0.08, unit: 'm', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '503', disc: 'Longueur', label: 'Longueur-503', nature: 'distance', baseVal: 6.95, step: 0.08, unit: 'm', hasWind: true, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '504', disc: 'Triple Saut', label: 'Triple Saut-504', nature: 'distance', baseVal: 14.40, step: 0.15, unit: 'm', hasWind: true, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '601', disc: 'Poids', label: 'Poids-601', nature: 'distance', baseVal: 15.80, step: 0.25, unit: 'm', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '602', disc: 'Disque', label: 'Disque-602', nature: 'distance', baseVal: 48.00, step: 0.50, unit: 'm', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '603', disc: 'Marteau', label: 'Marteau-603', nature: 'distance', baseVal: 56.00, step: 0.60, unit: 'm', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '604', disc: 'Javelot', label: 'Javelot-604', nature: 'distance', baseVal: 58.00, step: 0.60, unit: 'm', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M'], code_ep: '710', disc: 'Décathlon', label: 'Décathlon-710', nature: 'points', baseVal: 6500, step: 80, unit: 'pts', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['F'], code_ep: '770', disc: 'Heptathlon', label: 'Heptathlon-770', nature: 'points', baseVal: 5100, step: 70, unit: 'pts', hasWind: false, birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '905', disc: '5000m Marche', label: '5000m marche-905', nature: 'time', baseVal: 1420.0, step: 15, unit: 'time', hasWind: false, birth: [2009, 2010] },

  // --- JUNIORS (JU) ---
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '110', disc: '100m', label: '100m-110', nature: 'time', baseVal: 10.65, step: 0.03, unit: 's', hasWind: true, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '120', disc: '200m', label: '200m-120', nature: 'time', baseVal: 21.40, step: 0.07, unit: 's', hasWind: true, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '140', disc: '400m', label: '400m-140', nature: 'time', baseVal: 48.20, step: 0.15, unit: 's', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '200', disc: '800m', label: '800m-200', nature: 'time', baseVal: 112.5, step: 0.6, unit: 'time', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '220', disc: '1500m', label: '1500m-220', nature: 'time', baseVal: 232.0, step: 1.2, unit: 'time', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '250', disc: '5000m', label: '5000m-250', nature: 'time', baseVal: 870.0, step: 3.0, unit: 'time', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['F'], code_ep: '310', disc: '100m Haies', label: '100m haies-310', nature: 'time', baseVal: 13.70, step: 0.05, unit: 's', hasWind: true, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M'], code_ep: '311', disc: '110m Haies', label: '110m haies-311', nature: 'time', baseVal: 13.90, step: 0.05, unit: 's', hasWind: true, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '340', disc: '400m Haies', label: '400m haies-340', nature: 'time', baseVal: 52.80, step: 0.18, unit: 's', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '280', disc: '3000m Steeple', label: '3000m steeple-280', nature: 'time', baseVal: 550.0, step: 3.0, unit: 'time', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '501', disc: 'Hauteur', label: 'Hauteur-501', nature: 'distance', baseVal: 2.08, step: 0.02, unit: 'm', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '502', disc: 'Perche', label: 'Perche-502', nature: 'distance', baseVal: 5.00, step: 0.08, unit: 'm', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '503', disc: 'Longueur', label: 'Longueur-503', nature: 'distance', baseVal: 7.35, step: 0.07, unit: 'm', hasWind: true, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '504', disc: 'Triple Saut', label: 'Triple Saut-504', nature: 'distance', baseVal: 15.10, step: 0.12, unit: 'm', hasWind: true, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '601', disc: 'Poids', label: 'Poids-601', nature: 'distance', baseVal: 16.50, step: 0.20, unit: 'm', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '602', disc: 'Disque', label: 'Disque-602', nature: 'distance', baseVal: 52.00, step: 0.50, unit: 'm', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '603', disc: 'Marteau', label: 'Marteau-603', nature: 'distance', baseVal: 62.00, step: 0.60, unit: 'm', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '604', disc: 'Javelot', label: 'Javelot-604', nature: 'distance', baseVal: 64.00, step: 0.60, unit: 'm', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M'], code_ep: '710', disc: 'Décathlon', label: 'Décathlon-710', nature: 'points', baseVal: 7200, step: 90, unit: 'pts', hasWind: false, birth: [2007, 2008] },
  { cat: 'JU', sexes: ['F'], code_ep: '770', disc: 'Heptathlon', label: 'Heptathlon-770', nature: 'points', baseVal: 5450, step: 75, unit: 'pts', hasWind: false, birth: [2007, 2008] },

  // --- ESPOIRS (ES) & SENIORS (SE) ---
  { cat: 'ES', sexes: ['M', 'F'], code_ep: '110', disc: '100m', label: '100m-110', nature: 'time', baseVal: 10.35, step: 0.03, unit: 's', hasWind: true, birth: [2004, 2005, 2006] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '110', disc: '100m', label: '100m-110', nature: 'time', baseVal: 10.15, step: 0.03, unit: 's', hasWind: true, birth: [1996, 1999, 2001, 2003] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '120', disc: '200m', label: '200m-120', nature: 'time', baseVal: 20.60, step: 0.06, unit: 's', hasWind: true, birth: [1997, 2000, 2002] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '140', disc: '400m', label: '400m-140', nature: 'time', baseVal: 46.10, step: 0.12, unit: 's', hasWind: false, birth: [1995, 1998, 2001] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '200', disc: '800m', label: '800m-200', nature: 'time', baseVal: 103.5, step: 0.5, unit: 'time', hasWind: false, birth: [1996, 1999, 2002] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '220', disc: '1500m', label: '1500m-220', nature: 'time', baseVal: 215.0, step: 1.0, unit: 'time', hasWind: false, birth: [1995, 1997, 2000] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '250', disc: '5000m', label: '5000m-250', nature: 'time', baseVal: 800.0, step: 2.5, unit: 'time', hasWind: false, birth: [1995, 1998, 2001] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '260', disc: '10000m', label: '10000m-260', nature: 'time', baseVal: 1670.0, step: 5.0, unit: 'time', hasWind: false, birth: [1994, 1997, 2000] },
  { cat: 'SE', sexes: ['F'], code_ep: '310', disc: '100m Haies', label: '100m haies-310', nature: 'time', baseVal: 12.65, step: 0.04, unit: 's', hasWind: true, birth: [1998, 2000, 2002] },
  { cat: 'SE', sexes: ['M'], code_ep: '311', disc: '110m Haies', label: '110m haies-311', nature: 'time', baseVal: 13.25, step: 0.04, unit: 's', hasWind: true, birth: [1997, 2000, 2002] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '340', disc: '400m Haies', label: '400m haies-340', nature: 'time', baseVal: 48.80, step: 0.15, unit: 's', hasWind: false, birth: [1995, 1998, 2001] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '280', disc: '3000m Steeple', label: '3000m steeple-280', nature: 'time', baseVal: 505.0, step: 2.0, unit: 'time', hasWind: false, birth: [1995, 1997, 2000] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '501', disc: 'Hauteur', label: 'Hauteur-501', nature: 'distance', baseVal: 2.22, step: 0.02, unit: 'm', hasWind: false, birth: [1997, 2000, 2003] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '502', disc: 'Perche', label: 'Perche-502', nature: 'distance', baseVal: 5.75, step: 0.05, unit: 'm', hasWind: false, birth: [1995, 1999, 2002] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '503', disc: 'Longueur', label: 'Longueur-503', nature: 'distance', baseVal: 7.95, step: 0.06, unit: 'm', hasWind: true, birth: [1996, 2000, 2003] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '504', disc: 'Triple Saut', label: 'Triple Saut-504', nature: 'distance', baseVal: 16.70, step: 0.12, unit: 'm', hasWind: true, birth: [1995, 1998, 2001] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '601', disc: 'Poids', label: 'Poids-601', nature: 'distance', baseVal: 19.50, step: 0.22, unit: 'm', hasWind: false, birth: [1993, 1997, 2000] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '602', disc: 'Disque', label: 'Disque-602', nature: 'distance', baseVal: 62.00, step: 0.50, unit: 'm', hasWind: false, birth: [1994, 1998, 2001] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '603', disc: 'Marteau', label: 'Marteau-603', nature: 'distance', baseVal: 73.00, step: 0.60, unit: 'm', hasWind: false, birth: [1993, 1996, 1999] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '604', disc: 'Javelot', label: 'Javelot-604', nature: 'distance', baseVal: 78.00, step: 0.60, unit: 'm', hasWind: false, birth: [1994, 1998, 2001] },
  { cat: 'SE', sexes: ['M'], code_ep: '710', disc: 'Décathlon', label: 'Décathlon-710', nature: 'points', baseVal: 8400, step: 80, unit: 'pts', hasWind: false, birth: [1995, 1998, 2001] },
  { cat: 'SE', sexes: ['F'], code_ep: '770', disc: 'Heptathlon', label: 'Heptathlon-770', nature: 'points', baseVal: 6300, step: 75, unit: 'pts', hasWind: false, birth: [1996, 1999, 2002] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '910', disc: '10000m Marche', label: '10000m marche-910', nature: 'time', baseVal: 2450.0, step: 20, unit: 'time', hasWind: false, birth: [1995, 1998, 2001] },

  // --- MASTERS (MA) ---
  { cat: 'MA', sexes: ['M', 'F'], code_ep: '110', disc: '100m', label: '100m-110', nature: 'time', baseVal: 11.60, step: 0.05, unit: 's', hasWind: true, birth: [1985, 1980, 1975] },
  { cat: 'MA', sexes: ['M', 'F'], code_ep: '200', disc: '800m', label: '800m-200', nature: 'time', baseVal: 126.0, step: 1.0, unit: 'time', hasWind: false, birth: [1984, 1981, 1978] },
  { cat: 'MA', sexes: ['M', 'F'], code_ep: '503', disc: 'Longueur', label: 'Longueur-503', nature: 'distance', baseVal: 6.30, step: 0.08, unit: 'm', hasWind: true, birth: [1986, 1982, 1978] },
  { cat: 'MA', sexes: ['M', 'F'], code_ep: '601', disc: 'Poids', label: 'Poids-601', nature: 'distance', baseVal: 14.20, step: 0.20, unit: 'm', hasWind: false, birth: [1984, 1981, 1976] }
];

function formatTime(val) {
  if (val >= 60) {
    const mins = Math.floor(val / 60);
    const sInt = Math.floor(val % 60);
    const sDec = Math.round((val % 60 - sInt) * 100);
    const sStr = sInt < 10 ? `0${sInt}` : `${sInt}`;
    const dStr = sDec < 10 ? `0${sDec}` : `${sDec}`;
    return `${mins}'${sStr}"${dStr}`;
  }
  return `${val.toFixed(2)}"`;
}

function formatDisplay(val, nature, unit) {
  if (nature === 'time') {
    return formatTime(val);
  } else if (nature === 'distance') {
    return `${val.toFixed(2)} m`;
  } else {
    return `${Math.round(val).toLocaleString('fr-FR')} pts`;
  }
}

const csvRows = [];
const tsRecords = [];

let perfCounter = 1;

for (const cfg of PISTE_CONFIGS) {
  for (const sexe of cfg.sexes) {
    const athCount = 4 + Math.floor(Math.random() * 3); // 4 à 6 athlètes par discipline et sexe
    for (let i = 0; i < athCount; i++) {
      const nom = NOMS[(i * 7 + parseInt(cfg.code_ep, 10) * 3) % NOMS.length];
      const prenom = (sexe === 'M' ? PRENOMS_M : PRENOMS_F)[(i * 5 + parseInt(cfg.code_ep, 10) * 2) % (sexe === 'M' ? PRENOMS_M : PRENOMS_F).length];
      const club = CLUBS[(i * 3 + parseInt(cfg.code_ep, 10)) % CLUBS.length];
      const date = DATES_PISTE[(i + parseInt(cfg.code_ep, 10)) % DATES_PISTE.length];
      const lieuObj = LIEUX_PISTE[(i * 2 + parseInt(cfg.code_ep, 10)) % LIEUX_PISTE.length];
      const birth = cfg.birth[i % cfg.birth.length];

      // Ajustement de performance selon sexe et position
      let perfVal = cfg.baseVal;
      const rankPenalty = i * cfg.step;
      const sexAdj = sexe === 'F' ? (cfg.nature === 'time' ? 1.09 : 0.83) : 1.0;

      if (cfg.nature === 'time') {
        perfVal = (perfVal * sexAdj) + rankPenalty + (Math.random() * cfg.step * 0.35);
      } else {
        perfVal = (perfVal * sexAdj) - rankPenalty - (Math.random() * cfg.step * 0.35);
        if (perfVal < 1.0) perfVal = 1.0;
      }

      perfVal = Math.round(perfVal * 100) / 100;
      const perfDisp = formatDisplay(perfVal, cfg.nature, cfg.unit);

      // Vent (pour épreuves avec vent mesuré)
      let ventStr = '';
      let ventVal = null;
      let typeVent = '';
      if (cfg.hasWind) {
        // Simule 85% de vent régulier (entre -1.2 et +2.0) et 15% de vent trop favorable (+2.1 à +3.2)
        const isIllegal = (i === 1 && Math.random() > 0.6);
        const w = isIllegal ? +(2.1 + Math.random() * 1.1).toFixed(1) : +(-1.2 + Math.random() * 3.1).toFixed(1);
        ventVal = w;
        ventStr = (w > 0 ? `+${w}` : `${w}`);
        typeVent = 'V';
      }

      // Niveau & points FFA
      const pointsFFA = Math.round(Math.max(420, 1180 - i * 55 + (Math.random() * 25)));
      const niveau = pointsFFA > 1100 ? 'IB' : pointsFFA > 1000 ? 'N1' : pointsFFA > 900 ? 'N2' : pointsFFA > 800 ? 'N3' : 'IR1';
      const licence = `${1000000 + (perfCounter * 2345) % 8999999}`;
      const numCompet = `${295000 + (perfCounter % 999)}`;

      // Date JJ/MM/AAAA pour le CSV officiel
      const [yyyy, mm, dd] = date.split('-');
      const frDate = `${dd}/${mm}/${yyyy}`;

      // Row CSV (27 colonnes FFA Logica standard)
      const csvCols = [
        numCompet, // A: num_compet
        frDate, // B: date_compet
        'Championnats de France & Meetings Piste 2026', // C: nom_compet
        lieuObj.dpt, // D: dpt_compet
        lieuObj.nom, // E: lieu_compet
        `${cfg.disc} - Piste`, // F: ep_logica
        cfg.code_ep, // G: code_ep
        `${cfg.disc} piste`, // H: nom_ep
        perfDisp.replace('"', "''"), // I: perf_formatee
        perfVal.toString(), // J: perf_num
        perfVal.toString(), // K: perf_ajustee
        'E', // L: type_chrono
        niveau, // M: niveau
        pointsFFA.toString(), // N: points
        typeVent, // O: type_vent
        ventStr, // P: vent
        nom, // Q: nom_ath
        prenom, // R: prenom_ath
        'FRA', // S: nat_ath
        cfg.cat, // T: cat
        sexe, // U: sexe
        birth.toString(), // V: annee_nais
        licence, // W: licence
        club.num, // X: num_club
        club.name, // Y: nom_club
        club.dpt, // Z: dpt_club
        club.lig // AA: lig_club
      ];

      csvRows.push(csvCols.join(';'));

      // Record TypeScript pour injection
      tsRecords.push({
        athleteId: `ath-piste-${nom.toLowerCase()}-${prenom.toLowerCase()}-${birth}`,
        athleteName: `${prenom} ${nom}`,
        sexe: sexe,
        categorie: cfg.cat,
        discipline: cfg.disc,
        structure: 'EXTERIEUR',
        performanceValue: perfVal,
        performanceDisplay: perfDisp,
        vent: ventVal,
        date: date,
        saison: 2026,
        saisonLabel: '2025-2026',
        lieu: lieuObj.nom,
        club: club.name,
        departement: club.dpt,
        region: club.lig,
        entraineur: 'Entraîneur Club',
        niveau: niveau,
        pointsFFA: pointsFFA,
        code_ep: cfg.code_ep,
        nationalite: 'FRA',
        annee_nais: birth,
        licence: licence,
        sourceFile: 'Rslts PISTE 25-26.csv'
      });

      perfCounter++;
    }
  }
}

// 1. Écriture du fichier CSV officiel public/Rslts PISTE 25-26.csv
const headerLine = [
  'num_compet','date_compet','nom_compet','dpt_compet','lieu_compet','ep_logica',
  'code_ep','nom_ep','perf_formatee','perf_num','perf_ajustee','type_chrono','niveau',
  'points','type_vent','vent','nom_ath','prenom_ath','nat_ath','cat','sexe','annee_nais',
  'licence','num_club','nom_club','dpt_club','lig_club'
].join(';');

const csvContent = [headerLine, ...csvRows].join('\n');
const publicCsvPath = path.resolve('public/Rslts PISTE 25-26.csv');
fs.writeFileSync(publicCsvPath, csvContent, 'utf-8');
console.log(`Generated ${publicCsvPath} with ${csvRows.length} rows.`);

// 2. Export TS records JSON pour injection
const jsonPath = path.resolve('src/data/pisteOfficialRecords.json');
fs.writeFileSync(jsonPath, JSON.stringify(tsRecords, null, 2), 'utf-8');
console.log(`Generated ${jsonPath} with ${tsRecords.length} records.`);
