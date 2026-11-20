import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { PerformanceRecord } from '../types/athletics';
import { computeDisciplineStats } from './performanceUtils';

// ==========================================
// 1. EXPORT EXCEL (.xlsx)
// ==========================================
export function exportToExcel(
  records: PerformanceRecord[],
  filenamePrefix: string = 'Stats_France_Athle'
) {
  const wb = XLSX.utils.book_new();

  // Feuille 1 : Performances détaillées
  const perfData = records.map(r => ({
    'ID': r.id,
    'Athlète': r.athleteName,
    'Sexe': r.sexe,
    'Catégorie': r.categorie,
    'Discipline': r.discipline,
    'Performance': r.performanceDisplay,
    'Valeur Numérique': r.performanceValue,
    'Vent (m/s)': r.vent !== null && r.vent !== undefined ? r.vent : '',
    'Date': r.date,
    'Saison': r.saison,
    'Lieu': r.lieu,
    'Club': r.club,
    'Département': r.departement,
    'Région': r.region,
    'Entraîneur': r.entraineur,
    'Niveau FFA': r.niveau,
    'Points FFA': r.pointsFFA,
    'Record Personnel': (r.isPersonalRecord && (r.vent === null || r.vent === undefined || r.vent <= 2.0)) ? 'OUI (RP)' : 'NON'
  }));

  const wsPerf = XLSX.utils.json_to_sheet(perfData);
  XLSX.utils.book_append_sheet(wb, wsPerf, 'Performances');

  // Feuille 2 : Bilan par Discipline
  const discStats = computeDisciplineStats(records);
  const discData = discStats.map(d => ({
    'Discipline': d.discipline,
    'Nature': d.nature === 'time' ? 'Course (Temps)' : (d.nature === 'distance' ? 'Concours (Distance)' : 'Combiné (Points)'),
    'Total Performances': d.count,
    'Athlètes Uniques': d.athletesCount,
    'Meilleure Marque': d.bestDisplay,
    'Détenteur': d.bestAthlete,
    'Moyenne': d.averageDisplay,
    'Médiane': d.medianDisplay,
    'Saisons couvertes': d.seasons.join(', ')
  }));

  const wsDisc = XLSX.utils.json_to_sheet(discData);
  XLSX.utils.book_append_sheet(wb, wsDisc, 'Bilan Disciplines');

  // Feuille 3 : Records Personnels uniquement
  const pbRecords = records.filter(r => r.isPersonalRecord && (r.vent === null || r.vent === undefined || r.vent <= 2.0)).map(r => ({
    'Athlète': r.athleteName,
    'Discipline': r.discipline,
    'Record Personnel': r.performanceDisplay,
    'Date RP': r.date,
    'Lieu RP': r.lieu,
    'Club': r.club,
    'Entraîneur': r.entraineur,
    'Niveau FFA': r.niveau
  }));

  const wsPB = XLSX.utils.json_to_sheet(pbRecords);
  XLSX.utils.book_append_sheet(wb, wsPB, 'Records Personnels (PB)');

  // Génération du fichier
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filenamePrefix}_${dateStr}.xlsx`);
}

// ==========================================
// 2. EXPORT WORD (.doc / .docx compatible)
// ==========================================
export function exportToWord(
  title: string,
  subtitle: string,
  sections: Array<{
    heading: string;
    text?: string;
    tableHeaders?: string[];
    tableRows?: string[][];
  }>,
  filenamePrefix: string = 'Rapport_France_Athle'
) {
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  let sectionsHtml = '';
  sections.forEach(s => {
    sectionsHtml += `
      <h2 style="color: #002B49; border-bottom: 2px solid #0284C7; padding-bottom: 4px; margin-top: 24px; font-size: 16pt;">
        ${s.heading}
      </h2>
    `;
    if (s.text) {
      sectionsHtml += `<p style="font-size: 11pt; line-height: 1.6; color: #334155;">${s.text}</p>`;
    }
    if (s.tableHeaders && s.tableRows) {
      sectionsHtml += `
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 10pt; font-family: Arial, sans-serif;">
          <thead>
            <tr style="background-color: #002B49; color: #ffffff;">
              ${s.tableHeaders.map(h => `<th style="padding: 8px 10px; border: 1px solid #002B49; text-align: left;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${s.tableRows.map((row, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF'};">
                ${row.map(cell => `<td style="padding: 6px 10px; border: 1px solid #CBD5E1; color: #1E293B;">${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  });

  const fullDocHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 30px; }
          .header-box { border-left: 6px solid #0284C7; padding-left: 14px; margin-bottom: 28px; }
          .doc-title { font-size: 22pt; color: #002B49; font-weight: bold; margin: 0; }
          .doc-sub { font-size: 12pt; color: #64748B; margin: 4px 0 0 0; }
          .footer-note { margin-top: 40px; font-size: 9pt; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1 class="doc-title">${title}</h1>
          <p class="doc-sub">${subtitle} · Généré le ${dateStr}</p>
        </div>
        ${sectionsHtml}
        <div class="footer-note">
          Rapport certifié édité via Data France Athlé · Fédération Française d'Athlétisme & Clubs affiliés.
        </div>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + fullDocHtml], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 3. EXPORT PDF (.pdf via jsPDF)
// ==========================================
export function exportToPDF(
  title: string,
  records: PerformanceRecord[],
  filenamePrefix: string = 'Rapport_France_Athle'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête bleu marine
  doc.setFillColor(0, 43, 73);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('STATS FRANCE ATHLÉ', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(186, 230, 253);
  doc.text(`Rapport Officiel · ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);

  // Titre principal du rapport
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, 38);

  // Ligne de synthèse
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total de performances analysées : ${records.length}`, 14, 45);

  // Tableau simple
  let y = 54;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('ATHLÈTE', 16, y + 5.5);
  doc.text('ÉPREUVE', 60, y + 5.5);
  doc.text('PERF', 95, y + 5.5);
  doc.text('NIVEAU', 120, y + 5.5);
  doc.text('CLUB', 140, y + 5.5);
  doc.text('SAISON', 185, y + 5.5);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const displayList = records.slice(0, 32); // Page 1 summary

  displayList.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, pageWidth - 28, 6.5, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.text(r.athleteName.substring(0, 22), 16, y);
    doc.text(r.discipline.substring(0, 16), 60, y);
    doc.text(r.performanceDisplay, 95, y);
    doc.text(r.niveau || 'IR1', 120, y);
    doc.text(r.club.substring(0, 20), 140, y);
    doc.text(String(r.saison), 185, y);

    y += 6.5;
  });

  if (records.length > 32) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`... et ${records.length - 32} autres performances exportées dans la base complète.`, 14, y + 4);
  }

  // Pied de page
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Document généré par Data France Athlé · Application compatible iOS, Android et Web', 14, 285);

  doc.save(`${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ==========================================
// 4. EXPORT OFFICIEL DU BILAN EN EXCEL (.xlsx)
// ==========================================
export function exportBilanToExcel(
  entries: Array<{
    rank: number;
    record: PerformanceRecord;
    perfCount?: number;
    isAverage?: boolean;
    bestDisplay?: string;
  }>,
  title: string,
  filenamePrefix: string = 'Bilan_Officiel'
) {
  const wb = XLSX.utils.book_new();

  const data = entries.map(e => ({
    'Rang': e.rank,
    'Performance': e.record.performanceDisplay,
    ...(e.isAverage ? {
      'Nb Perfs Moyennées': e.perfCount || 1,
      'Meilleure Perf Athlète': e.bestDisplay || e.record.performanceDisplay,
    } : {}),
    'Vent (m/s)': e.record.vent !== null && e.record.vent !== undefined ? e.record.vent : '',
    'Athlète': e.record.athleteName,
    'Sexe': e.record.sexe,
    'Catégorie': e.record.categorie,
    'Nationalité': e.record.nationalite || 'FRA',
    'Année Naissance': e.record.annee_nais || '',
    'Structure': e.record.structure === 'SALLE' ? 'Salle' : 'Plein Air',
    'Discipline': e.record.discipline,
    'Date': e.record.date,
    'Saison': e.record.saisonLabel || e.record.saison,
    'Lieu': e.record.lieu,
    'Club': e.record.club,
    'Département': e.record.departement,
    'Ligue / Région': e.record.region,
    'Niveau FFA': e.record.niveau,
    'Points FFA': e.record.pointsFFA,
    'Licence': e.record.licence || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Bilan Fédéral');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filenamePrefix}_${dateStr}.xlsx`);
}

// ==========================================
// 5. EXPORT OFFICIEL DU BILAN EN PDF (.pdf)
// ==========================================
export function exportBilanToPDF(
  title: string,
  subtitle: string,
  entries: Array<{
    rank: number;
    record: PerformanceRecord;
    perfCount?: number;
    isAverage?: boolean;
    bestDisplay?: string;
  }>,
  filenamePrefix: string = 'Bilan_Officiel'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const printHeader = (pageNum: number) => {
    doc.setFillColor(0, 43, 73);
    doc.rect(0, 0, pageWidth, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('DATA FRANCE ATHLÉ · BILAN FÉDÉRAL OFFICIEL', 14, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(186, 230, 253);
    doc.text(`Export officiel le ${new Date().toLocaleDateString('fr-FR')} · Page ${pageNum}`, 14, 17);
  };

  let pageNum = 1;
  printHeader(pageNum);

  // Titre & Sous-titre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 14, 35);

  let y = 41;

  const printTableHeaders = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 6.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('RG', 16, y + 4.5);
    doc.text('PERF', 26, y + 4.5);
    doc.text('VENT', 46, y + 4.5);
    doc.text('ATHLÈTE', 62, y + 4.5);
    doc.text('CAT', 108, y + 4.5);
    doc.text('DATE', 120, y + 4.5);
    doc.text('CLUB', 142, y + 4.5);
    doc.text('PTS', 188, y + 4.5);
    y += 8.5;
  };

  printTableHeaders();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  entries.forEach((entry, idx) => {
    if (y > pageHeight - 18) {
      doc.addPage();
      pageNum++;
      printHeader(pageNum);
      y = 28;
      printTableHeaders();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 3.8, pageWidth - 28, 5.2, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(String(entry.rank), 16, y);

    doc.setTextColor(2, 132, 199);
    doc.text(entry.record.performanceDisplay || '-', 26, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const ventStr = entry.record.vent !== null && entry.record.vent !== undefined ? `${entry.record.vent > 0 ? '+' : ''}${entry.record.vent}` : '-';
    doc.text(ventStr, 46, y);

    doc.setTextColor(15, 23, 42);
    doc.text((entry.record.athleteName || '').substring(0, 24), 62, y);

    doc.setTextColor(71, 85, 105);
    doc.text(entry.record.categorie || 'SEM', 108, y);
    doc.text(entry.record.date || '-', 120, y);
    doc.text((entry.record.club || '').substring(0, 22), 142, y);

    doc.text(String(entry.record.pointsFFA || 0), 188, y);

    y += 5.2;
  });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Total : ${entries.length} athlète(s) classé(s) · Document certifié conforme FFA · Stats France Athlé`, 14, pageHeight - 8);

  doc.save(`${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ====================================================
// 6. EXPORT DE LA COMPOSITION D'ÉQUIPES EN EXCEL (.xlsx)
// ====================================================
export function exportTeamCompositionToExcel(
  teamResult: any,
  filenamePrefix: string = 'Composition_Equipe'
) {
  const wb = XLSX.utils.book_new();

  // Feuille 1 : Grille des épreuves et titulaires
  const sheetRows = teamResult.events.map((ev: any) => {
    const t1 = ev.assignedSlots[0];
    const t2 = ev.assignedSlots[1];
    const sub = ev.substituteCandidate;

    return {
      'Sexe': ev.sexe === 'M' ? 'Hommes' : 'Femmes',
      'Famille': ev.family,
      'Épreuve': ev.discipline,
      'Titulaire 1 - Athlète': t1?.record?.athleteName || '— À POURVOIR —',
      'Titulaire 1 - Cat.': t1?.record?.categorie || '',
      'Titulaire 1 - Perf': t1?.performanceDisplay || '',
      'Titulaire 1 - Pts FFA': t1?.points || 0,
      'Titulaire 2 - Athlète': t2?.record?.athleteName || (ev.requiredAthletes > 1 ? '— À POURVOIR —' : 'Non requis'),
      'Titulaire 2 - Cat.': t2?.record?.categorie || '',
      'Titulaire 2 - Perf': t2?.performanceDisplay || '',
      'Titulaire 2 - Pts FFA': t2?.points || (ev.requiredAthletes > 1 ? 0 : ''),
      'Total Points Épreuve': (t1?.points || 0) + (t2?.points || 0),
      'Remplaçant Conseillé': sub?.record?.athleteName || 'Aucun',
      'Remplaçant - Perf / Pts': sub ? `${sub.performanceDisplay} (${sub.points} pts)` : '',
    };
  });

  const wsRoster = XLSX.utils.json_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(wb, wsRoster, 'Composition Titulaires');

  // Feuille 2 : Bilan & Récapitulatif
  const summaryRows = [
    { 'Indicateur': 'Club', 'Valeur': teamResult.club },
    { 'Indicateur': 'Saison', 'Valeur': teamResult.season },
    { 'Indicateur': 'Type de Compétition', 'Valeur': teamResult.competitionName },
    { 'Indicateur': 'Total Points FFA Projetés', 'Valeur': teamResult.totalPoints },
    { 'Indicateur': 'Taux de Remplissage', 'Valeur': `${teamResult.filledSlots} / ${teamResult.totalSlots} slots (${Math.round((teamResult.filledSlots / (teamResult.totalSlots || 1)) * 100)}%)` },
    { 'Indicateur': 'Athlètes Uniques Mobilisés', 'Valeur': teamResult.uniqueAthletesCount },
    { 'Indicateur': 'Points Hommes', 'Valeur': teamResult.pointsBySexe.M },
    { 'Indicateur': 'Points Femmes', 'Valeur': teamResult.pointsBySexe.F },
    ...Object.entries(teamResult.pointsByFamily).map(([fam, pts]) => ({
      'Indicateur': `Points - ${fam}`,
      'Valeur': pts,
    }))
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Bilan Général');

  // Feuille 3 : Réserve disponible du club
  if (teamResult.unassignedAthletes && teamResult.unassignedAthletes.length > 0) {
    const unassignedRows = teamResult.unassignedAthletes.map((a: any) => ({
      'Athlète': a.athleteName,
      'Sexe': a.sexe,
      'Catégorie': a.categorie,
      'Meilleure Épreuve': a.bestEvent,
      'Points FFA Record': a.bestPoints,
    }));
    const wsReserve = XLSX.utils.json_to_sheet(unassignedRows);
    XLSX.utils.book_append_sheet(wb, wsReserve, 'Réserve & Athlètes Disponibles');
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filenamePrefix}_${teamResult.club.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
}
