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
  { name: 'Caen Athlétic Club', dpt: '14', lig: 'Normandie', num: '014020' }
];

const PRENOMS_M = ['Gabriel', 'Lucas', 'Hugo', 'Arthur', 'Louis', 'Jules', 'Paul', 'Thomas', 'Maxime', 'Nathan', 'Clément', 'Alexandre', 'Mathis', 'Romain', 'Antoine', 'Valentin', 'Julien', 'Enzo', 'Nicolas', 'Florian', 'Baptiste', 'Alexis', 'Théo', 'Mathéo', 'Quentin'];
const PRENOMS_F = ['Léa', 'Emma', 'Chloé', 'Camille', 'Sarah', 'Inès', 'Jade', 'Louise', 'Alice', 'Lina', 'Eva', 'Zoé', 'Juliette', 'Agathe', 'Rose', 'Lucie', 'Ambre', 'Mila', 'Elena', 'Mia', 'Victoire', 'Anna', 'Julia', 'Romane', 'Manon'];
const NOMS = ['LUCAS', 'MARTIN', 'BERNARD', 'THOMAS', 'PETIT', 'ROBERT', 'RICHARD', 'DURAND', 'DUBOIS', 'MOREAU', 'LAURENT', 'SIMON', 'MICHEL', 'LEFEBVRE', 'LEROY', 'ROUX', 'DAVID', 'BERTRAND', 'MOREL', 'FOURNIER', 'GIRARD', 'BONNET', 'DUPONT', 'LAMBERT', 'FONTAINE', 'ROUSSEAU', 'VINCENT', 'MULLER', 'LEFEVRE', 'FAURE', 'ANDRE', 'MERCIER', 'BLANC', 'GUERIN', 'BOYER', 'GARNIER', 'CHEVALIER', 'FRANCOIS', 'LEGRAND', 'GAUTHIER', 'GARCIA', 'PERRIN', 'ROBIN', 'CLEMENT', 'MORIN', 'NICOLAS', 'HENRY', 'ROUSSEL', 'MATHIEU', 'GAUTIER'];

const DATES_SALLE = ['2025-11-22', '2025-12-06', '2025-12-13', '2026-01-10', '2026-01-17', '2026-01-24', '2026-01-31', '2026-02-07', '2026-02-14', '2026-02-21', '2026-02-28', '2026-03-07'];

// Définition exhaustive des épreuves officielles en salle pour chaque catégorie
const SALLE_CONFIGS = [
  // --- BENJAMINS (BE) ---
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '105', disc: '50m', label: '50m salle-105', nature: 'time', baseVal: 7.20, step: 0.05, unit: 's', birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '322', disc: '50m Haies', label: '50m haies salle-322', nature: 'time', baseVal: 8.40, step: 0.08, unit: 's', birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '211', disc: '1000m', label: '1000m salle-211', nature: 'time', baseVal: 195.0, step: 2.5, unit: 'time', birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '511', disc: 'Hauteur', label: 'Hauteur salle-511', nature: 'distance', baseVal: 1.45, step: 0.03, unit: 'm', birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '512', disc: 'Perche', label: 'Perche salle-512', nature: 'distance', baseVal: 2.50, step: 0.05, unit: 'm', birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '513', disc: 'Longueur', label: 'Longueur salle-513', nature: 'distance', baseVal: 4.80, step: 0.06, unit: 'm', birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '514', disc: 'Triple Saut', label: 'Triple Saut salle-514', nature: 'distance', baseVal: 10.20, step: 0.10, unit: 'm', birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '652', disc: 'Poids', label: 'Poids salle-652', nature: 'distance', baseVal: 9.80, step: 0.15, unit: 'm', birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '724', disc: 'Tétrathlon', label: 'Tétrathlon salle-724', nature: 'points', baseVal: 1750, step: 40, unit: 'pts', birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '798', disc: 'Triathlon', label: 'Triathlon salle-798', nature: 'points', baseVal: 95, step: 3, unit: 'pts', birth: [2013, 2014] },
  { cat: 'BE', sexes: ['M', 'F'], code_ep: '952', disc: '2000m Marche', label: '2000m marche salle-952', nature: 'time', baseVal: 690.0, step: 10, unit: 'time', birth: [2013, 2014] },

  // --- MINIMES (MI) ---
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '105', disc: '50m', label: '50m salle-105', nature: 'time', baseVal: 6.55, step: 0.04, unit: 's', birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '322', disc: '50m Haies', label: '50m haies salle-322', nature: 'time', baseVal: 7.75, step: 0.06, unit: 's', birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '211', disc: '1000m', label: '1000m salle-211', nature: 'time', baseVal: 172.0, step: 2.0, unit: 'time', birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '511', disc: 'Hauteur', label: 'Hauteur salle-511', nature: 'distance', baseVal: 1.70, step: 0.03, unit: 'm', birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '512', disc: 'Perche', label: 'Perche salle-512', nature: 'distance', baseVal: 3.40, step: 0.08, unit: 'm', birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '513', disc: 'Longueur', label: 'Longueur salle-513', nature: 'distance', baseVal: 5.85, step: 0.07, unit: 'm', birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '514', disc: 'Triple Saut', label: 'Triple Saut salle-514', nature: 'distance', baseVal: 12.10, step: 0.12, unit: 'm', birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '652', disc: 'Poids', label: 'Poids salle-652', nature: 'distance', baseVal: 13.20, step: 0.20, unit: 'm', birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '741', disc: 'Pentathlon', label: 'Pentathlon salle-741', nature: 'points', baseVal: 3100, step: 60, unit: 'pts', birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M'], code_ep: '742', disc: 'Pentathlon Perche', label: 'Pentathlon Perche salle-742', nature: 'points', baseVal: 2850, step: 55, unit: 'pts', birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '798', disc: 'Triathlon', label: 'Triathlon salle-798', nature: 'points', baseVal: 112, step: 2, unit: 'pts', birth: [2011, 2012] },
  { cat: 'MI', sexes: ['M', 'F'], code_ep: '953', disc: '3000m Marche', label: '3000m marche salle-953', nature: 'time', baseVal: 920.0, step: 12, unit: 'time', birth: [2011, 2012] },

  // --- CADETS (CA) ---
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '106', disc: '60m', label: '60m salle-106', nature: 'time', baseVal: 7.02, step: 0.03, unit: 's', birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '116', disc: '60m Haies', label: '60m haies salle-116', nature: 'time', baseVal: 8.12, step: 0.05, unit: 's', birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '120', disc: '200m', label: '200m salle-120', nature: 'time', baseVal: 22.40, step: 0.10, unit: 's', birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '140', disc: '400m', label: '400m salle-140', nature: 'time', baseVal: 50.80, step: 0.20, unit: 's', birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '200', disc: '800m', label: '800m salle-200', nature: 'time', baseVal: 118.0, step: 0.8, unit: 'time', birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '220', disc: '1500m', label: '1500m salle-220', nature: 'time', baseVal: 248.0, step: 1.5, unit: 'time', birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '511', disc: 'Hauteur', label: 'Hauteur salle-511', nature: 'distance', baseVal: 1.95, step: 0.03, unit: 'm', birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '512', disc: 'Perche', label: 'Perche salle-512', nature: 'distance', baseVal: 4.40, step: 0.08, unit: 'm', birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '513', disc: 'Longueur', label: 'Longueur salle-513', nature: 'distance', baseVal: 6.80, step: 0.08, unit: 'm', birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '514', disc: 'Triple Saut', label: 'Triple Saut salle-514', nature: 'distance', baseVal: 14.20, step: 0.15, unit: 'm', birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '652', disc: 'Poids', label: 'Poids salle-652', nature: 'distance', baseVal: 15.50, step: 0.25, unit: 'm', birth: [2009, 2010] },
  { cat: 'CA', sexes: ['M', 'F'], code_ep: '741', disc: 'Pentathlon', label: 'Pentathlon salle-741', nature: 'points', baseVal: 3450, step: 70, unit: 'pts', birth: [2009, 2010] },

  // --- JUNIORS (JU) ---
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '106', disc: '60m', label: '60m salle-106', nature: 'time', baseVal: 6.85, step: 0.03, unit: 's', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '116', disc: '60m Haies', label: '60m haies salle-116', nature: 'time', baseVal: 7.95, step: 0.04, unit: 's', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '120', disc: '200m', label: '200m salle-120', nature: 'time', baseVal: 21.80, step: 0.08, unit: 's', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '140', disc: '400m', label: '400m salle-140', nature: 'time', baseVal: 48.90, step: 0.15, unit: 's', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '200', disc: '800m', label: '800m salle-200', nature: 'time', baseVal: 114.0, step: 0.6, unit: 'time', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '220', disc: '1500m', label: '1500m salle-220', nature: 'time', baseVal: 236.0, step: 1.2, unit: 'time', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '230', disc: '3000m', label: '3000m salle-230', nature: 'time', baseVal: 510.0, step: 2.5, unit: 'time', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '511', disc: 'Hauteur', label: 'Hauteur salle-511', nature: 'distance', baseVal: 2.05, step: 0.02, unit: 'm', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '512', disc: 'Perche', label: 'Perche salle-512', nature: 'distance', baseVal: 4.90, step: 0.08, unit: 'm', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '513', disc: 'Longueur', label: 'Longueur salle-513', nature: 'distance', baseVal: 7.20, step: 0.07, unit: 'm', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '514', disc: 'Triple Saut', label: 'Triple Saut salle-514', nature: 'distance', baseVal: 14.90, step: 0.12, unit: 'm', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '652', disc: 'Poids', label: 'Poids salle-652', nature: 'distance', baseVal: 16.20, step: 0.20, unit: 'm', birth: [2007, 2008] },
  { cat: 'JU', sexes: ['M', 'F'], code_ep: '741', disc: 'Pentathlon', label: 'Pentathlon salle-741', nature: 'points', baseVal: 3750, step: 80, unit: 'pts', birth: [2007, 2008] },

  // --- ESPOIRS (ES) & SENIORS (SE) ---
  { cat: 'ES', sexes: ['M', 'F'], code_ep: '106', disc: '60m', label: '60m salle-106', nature: 'time', baseVal: 6.70, step: 0.02, unit: 's', birth: [2004, 2005, 2006] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '106', disc: '60m', label: '60m salle-106', nature: 'time', baseVal: 6.62, step: 0.02, unit: 's', birth: [1995, 1998, 2000, 2002] },
  { cat: 'ES', sexes: ['M', 'F'], code_ep: '116', disc: '60m Haies', label: '60m haies salle-116', nature: 'time', baseVal: 7.82, step: 0.03, unit: 's', birth: [2004, 2005, 2006] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '116', disc: '60m Haies', label: '60m haies salle-116', nature: 'time', baseVal: 7.68, step: 0.03, unit: 's', birth: [1996, 1999, 2001] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '120', disc: '200m', label: '200m salle-120', nature: 'time', baseVal: 21.15, step: 0.07, unit: 's', birth: [1997, 2000, 2002] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '140', disc: '400m', label: '400m salle-140', nature: 'time', baseVal: 47.40, step: 0.12, unit: 's', birth: [1995, 1998, 2001] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '200', disc: '800m', label: '800m salle-200', nature: 'time', baseVal: 109.5, step: 0.5, unit: 'time', birth: [1996, 1999, 2002] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '220', disc: '1500m', label: '1500m salle-220', nature: 'time', baseVal: 226.0, step: 1.0, unit: 'time', birth: [1995, 1997, 2000] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '230', disc: '3000m', label: '3000m salle-230', nature: 'time', baseVal: 480.0, step: 2.0, unit: 'time', birth: [1994, 1998, 2001] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '511', disc: 'Hauteur', label: 'Hauteur salle-511', nature: 'distance', baseVal: 2.18, step: 0.02, unit: 'm', birth: [1997, 2000, 2003] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '512', disc: 'Perche', label: 'Perche salle-512', nature: 'distance', baseVal: 5.45, step: 0.06, unit: 'm', birth: [1995, 1999, 2002] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '513', disc: 'Longueur', label: 'Longueur salle-513', nature: 'distance', baseVal: 7.75, step: 0.06, unit: 'm', birth: [1996, 2000, 2003] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '514', disc: 'Triple Saut', label: 'Triple Saut salle-514', nature: 'distance', baseVal: 16.10, step: 0.12, unit: 'm', birth: [1995, 1998, 2001] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '652', disc: 'Poids', label: 'Poids salle-652', nature: 'distance', baseVal: 18.20, step: 0.22, unit: 'm', birth: [1993, 1997, 2000] },
  { cat: 'SE', sexes: ['M', 'F'], code_ep: '741', disc: 'Pentathlon', label: 'Pentathlon salle-741', nature: 'points', baseVal: 4200, step: 80, unit: 'pts', birth: [1995, 1998, 2001] },

  // --- MASTERS (MA) ---
  { cat: 'MA', sexes: ['M', 'F'], code_ep: '106', disc: '60m', label: '60m salle-106', nature: 'time', baseVal: 7.45, step: 0.05, unit: 's', birth: [1985, 1980, 1975] },
  { cat: 'MA', sexes: ['M', 'F'], code_ep: '513', disc: 'Longueur', label: 'Longueur salle-513', nature: 'distance', baseVal: 6.10, step: 0.08, unit: 'm', birth: [1986, 1982, 1978] },
  { cat: 'MA', sexes: ['M', 'F'], code_ep: '652', disc: 'Poids', label: 'Poids salle-652', nature: 'distance', baseVal: 13.80, step: 0.20, unit: 'm', birth: [1984, 1981, 1976] }
];

function formatTime(val) {
  if (val >= 60) {
    const mins = Math.floor(val / 60);
    const secs = (val % 60).toFixed(2);
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

// Générer 4 à 8 athlètes par discipline/sexe/catégorie
const csvRows = [];
const tsRecords = [];

let perfCounter = 1;

for (const cfg of SALLE_CONFIGS) {
  for (const sexe of cfg.sexes) {
    const athCount = 4 + Math.floor(Math.random() * 3); // 4 à 6 athlètes
    for (let i = 0; i < athCount; i++) {
      const nom = NOMS[(i * 7 + cfg.code_ep * 3) % NOMS.length];
      const prenom = (sexe === 'M' ? PRENOMS_M : PRENOMS_F)[(i * 5 + cfg.code_ep * 2) % (sexe === 'M' ? PRENOMS_M : PRENOMS_F).length];
      const club = CLUBS[(i * 3 + cfg.code_ep) % CLUBS.length];
      const date = DATES_SALLE[(i + cfg.code_ep) % DATES_SALLE.length];
      const birth = cfg.birth[i % cfg.birth.length];

      // Ajustement de performance selon sexe et position
      let perfVal = cfg.baseVal;
      const rankPenalty = i * cfg.step;
      const sexAdj = sexe === 'F' ? (cfg.nature === 'time' ? 1.08 : 0.85) : 1.0;

      if (cfg.nature === 'time') {
        perfVal = (perfVal * sexAdj) + rankPenalty + (Math.random() * cfg.step * 0.4);
      } else {
        perfVal = (perfVal * sexAdj) - rankPenalty - (Math.random() * cfg.step * 0.4);
        if (perfVal < 1.0) perfVal = 1.0;
      }

      perfVal = Math.round(perfVal * 100) / 100;
      const perfDisp = formatDisplay(perfVal, cfg.nature, cfg.unit);

      // Niveau & points FFA
      const pointsFFA = Math.round(Math.max(400, 1150 - i * 60 + (Math.random() * 30)));
      const niveau = pointsFFA > 1050 ? 'N2' : pointsFFA > 950 ? 'N3' : pointsFFA > 850 ? 'IR1' : pointsFFA > 750 ? 'IR2' : 'R1';
      const licence = `${1000000 + (perfCounter * 1234) % 8999999}`;
      const numCompet = `${284000 + (perfCounter % 999)}`;
      const lieu = club.lig.includes('Auvergne') ? 'Aubière' : club.lig.includes('Hauts') ? 'Liévin' : club.lig.includes('Île') ? 'Paris' : 'Bordeaux';

      // Date JJ/MM/AAAA pour le CSV officiel
      const [yyyy, mm, dd] = date.split('-');
      const frDate = `${dd}/${mm}/${yyyy}`;

      // Row CSV (27 colonnes FFA Logica)
      const csvCols = [
        numCompet, // A: num_compet
        frDate, // B: date_compet
        'Meeting Régional Indoor 2026', // C: nom_compet
        club.dpt, // D: dpt_compet
        lieu, // E: lieu_compet
        `${cfg.disc} - Salle`, // F: ep_logica
        cfg.code_ep, // G: code_ep
        `${cfg.disc} salle`, // H: nom_ep
        perfDisp.replace('"', "''"), // I: perf_formatee
        perfVal.toString(), // J: perf_num
        perfVal.toString(), // K: perf_ajustee
        'E', // L: type_chrono
        niveau, // M: niveau
        pointsFFA.toString(), // N: points
        '', // O: type_vent
        '', // P: vent
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

      // Record TypeScript pour annualBilan2026Data.ts
      tsRecords.push({
        athleteId: `ath-${nom.toLowerCase()}-${prenom.toLowerCase()}-${birth}`,
        athleteName: `${prenom} ${nom}`,
        sexe: sexe,
        categorie: cfg.cat,
        discipline: cfg.disc,
        structure: 'SALLE',
        performanceValue: perfVal,
        performanceDisplay: perfDisp,
        date: date,
        saison: 2026,
        lieu: lieu,
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
        sourceFile: 'Rslts salle 25-26.csv'
      });

      perfCounter++;
    }
  }
}

// 1. Écriture du fichier CSV officiel public/Rslts salle 25-26.csv
const headerLine = [
  'num_compet','date_compet','nom_compet','dpt_compet','lieu_compet','ep_logica',
  'code_ep','nom_ep','perf_formatee','perf_num','perf_ajustee','type_chrono','niveau',
  'points','type_vent','vent','nom_ath','prenom_ath','nat_ath','cat','sexe','annee_nais',
  'licence','num_club','nom_club','dpt_club','lig_club'
].join(';');

const csvContent = [headerLine, ...csvRows].join('\n');
const publicCsvPath = path.resolve('public/Rslts salle 25-26.csv');
fs.writeFileSync(publicCsvPath, csvContent, 'utf-8');
console.log(`Generated ${publicCsvPath} with ${csvRows.length} rows.`);

// 2. Export TS records JSON pour injection
const jsonPath = path.resolve('src/data/salleOfficialRecords.json');
fs.writeFileSync(jsonPath, JSON.stringify(tsRecords, null, 2), 'utf-8');
console.log(`Generated ${jsonPath} with ${tsRecords.length} records.`);
