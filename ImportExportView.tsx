import React, { useState, useMemo, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  FileDown, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Database,
  Sliders,
  Table,
  HelpCircle,
  Check,
  Play,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Info,
  Filter,
  FileCode,
  Tag,
  Trash2,
  Calendar,
  Sun,
  Building2,
  SlidersHorizontal,
  HardDrive,
  BookOpen,
  Cloud,
  Github,
  Globe,
  Link2,
  ExternalLink
} from 'lucide-react';
import { OfficialSeasonFile, PerformanceRecord, UserAccount, DownloadedRemoteSource } from '../../types/athletics';
import { 
  generateSampleCSV, 
  generateSampleTXT, 
  detectDelimiter, 
  findHeaderRow, 
  detectColumnMapping, 
  parseAthleticsFileAsync,
  ColumnMapping, 
  parseCSVLine,
  FFA_LOGICA_HEADERS,
  getFFALogicaMapping
} from '../../utils/csvParser';
import { exportToExcel, exportToPDF, exportToWord } from '../../utils/exportUtils';
import { StorageService } from '../../services/storageService';
import { StorageInfoModal } from '../StorageInfoModal';
import { OfficialDisciplinesGuideModal } from '../OfficialDisciplinesGuideModal';
import { CloudStorageGuideModal } from '../CloudStorageGuideModal';
import { CLOUD_STORAGE_GUIDE_MARKDOWN } from '../../data/cloudStorageGuideContent';

interface ImportExportViewProps {
  records: PerformanceRecord[];
  onUpdateRecords: (
    newRecords: PerformanceRecord[], 
    importCount: number, 
    sourceFileName?: string,
    seasonMeta?: {
      seasonLabel: string;
      startYear: number;
      endYear: number;
      structure: 'EXTERIEUR' | 'SALLE' | 'COMBINE';
      totalLinesDetected?: number;
      athleteCount?: number;
      replaceEntireDatabase?: boolean;
    }
  ) => void;
  currentUser: UserAccount | null;
  onNavigate: (tab: string) => void;
}

export const ImportExportView: React.FC<ImportExportViewProps> = ({
  records,
  onUpdateRecords,
  currentUser,
  onNavigate,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCloudStorageGuideOpen, setIsCloudStorageGuideOpen] = useState(false);
  const [remoteUrlInput, setRemoteUrlInput] = useState<string>('');
  const [isFetchingRemote, setIsFetchingRemote] = useState<boolean>(false);
  const [remoteFetchStatus, setRemoteFetchStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Option d'activation automatique dès la sélection du fichier
  const [autoIntegrateOnUpload, setAutoIntegrateOnUpload] = useState<boolean>(true);
  const [lastActivatedFileName, setLastActivatedFileName] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sfa_active_user_file');
    } catch {
      return null;
    }
  });

  // 1. CONFIGURATION DE LA SAISON (2 champs libres comme sur la page Bilan)
  const [seasonStartYear, setSeasonStartYear] = useState<string>('2025');
  const [seasonEndYear, setSeasonEndYear] = useState<string>('2026');

  // 2. CHOIX STRUCTURE / ENVIRONNEMENT (3 choix : Plein Air, En Salle, Plein air + salle)
  const [targetUploadStructure, setTargetUploadStructure] = useState<'EXTERIEUR' | 'SALLE' | 'COMBINE'>('COMBINE');
  const [officialFilesRefreshTrigger, setOfficialFilesRefreshTrigger] = useState<number>(0);

  // Gestion intelligente de la saisie des années
  const handleStartYearChange = (val: string) => {
    setSeasonStartYear(val);
    const num = parseInt(val.trim(), 10);
    if (!isNaN(num) && num >= 1950 && num <= 2100) {
      const curEnd = parseInt(seasonEndYear.trim(), 10);
      if (isNaN(curEnd) || curEnd === num || curEnd === num - 1 || curEnd === num + 1) {
        setSeasonEndYear(String(num + 1));
      }
    }
  };

  const computedStartYear = useMemo(() => {
    const s = parseInt(seasonStartYear.trim(), 10);
    return !isNaN(s) ? s : 2025;
  }, [seasonStartYear]);

  const computedEndYear = useMemo(() => {
    const e = parseInt(seasonEndYear.trim(), 10);
    return !isNaN(e) ? e : computedStartYear + 1;
  }, [seasonEndYear, computedStartYear]);

  const computedSeasonLabel = useMemo(() => {
    return `${computedStartYear}-${computedEndYear}`;
  }, [computedStartYear, computedEndYear]);

  // Bases officielles déjà enregistrées
  const officialFiles = useMemo(() => {
    return StorageService.getOfficialSeasonFiles();
  }, [officialFilesRefreshTrigger, records.length]);

  // Sources distantes téléchargées (GitHub Releases, Cloudflare R2)
  const [remoteSourcesRefreshTrigger, setRemoteSourcesRefreshTrigger] = useState<number>(0);
  const downloadedRemoteSources = useMemo(() => {
    return StorageService.getDownloadedRemoteSources();
  }, [remoteSourcesRefreshTrigger, officialFilesRefreshTrigger]);

  // Recensement complet des saisons actives et disponibles dans l'application
  const availableSeasonsSummary = useMemo(() => {
    const seasonsMap = new Map<string, {
      seasonLabel: string;
      startYear: number;
      endYear: number;
      structures: Set<string>;
      recordCount: number;
      athleteCount: number;
      athletesSet: Set<string>;
      files: Set<string>;
      remoteUrl?: string;
    }>();

    // 1. Ajouter depuis le catalogue officiel
    for (const ofile of officialFiles) {
      if (!seasonsMap.has(ofile.seasonLabel)) {
        seasonsMap.set(ofile.seasonLabel, {
          seasonLabel: ofile.seasonLabel,
          startYear: ofile.startYear,
          endYear: ofile.endYear,
          structures: new Set([ofile.structure]),
          recordCount: ofile.recordCount,
          athleteCount: ofile.athleteCount || 0,
          athletesSet: new Set(),
          files: new Set([ofile.fileName]),
          remoteUrl: ofile.remoteSourceUrl
        });
      } else {
        const item = seasonsMap.get(ofile.seasonLabel)!;
        item.structures.add(ofile.structure);
        item.recordCount = Math.max(item.recordCount, ofile.recordCount);
        if (ofile.athleteCount) item.athleteCount = Math.max(item.athleteCount, ofile.athleteCount);
        item.files.add(ofile.fileName);
        if (ofile.remoteSourceUrl && !item.remoteUrl) item.remoteUrl = ofile.remoteSourceUrl;
      }
    }

    // 2. Compléter à partir des performances réelles en mémoire
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const sLabel = r.saison ? `${r.saison - 1}-${r.saison}` : '2025-2026';
      const yr = r.saison || 2026;
      if (!seasonsMap.has(sLabel)) {
        seasonsMap.set(sLabel, {
          seasonLabel: sLabel,
          startYear: yr - 1,
          endYear: yr,
          structures: new Set([r.structure || 'COMBINE']),
          recordCount: 1,
          athleteCount: 1,
          athletesSet: new Set([r.athleteName]),
          files: new Set(r.sourceFile ? [r.sourceFile] : []),
        });
      } else {
        const item = seasonsMap.get(sLabel)!;
        if (r.structure) item.structures.add(r.structure);
        item.athletesSet.add(r.athleteName);
        if (r.sourceFile) item.files.add(r.sourceFile);
      }
    }

    // Synchroniser les comptages finaux
    const result = Array.from(seasonsMap.values()).map(item => ({
      seasonLabel: item.seasonLabel,
      startYear: item.startYear,
      endYear: item.endYear,
      structures: Array.from(item.structures),
      recordCount: Math.max(item.recordCount, records.filter(r => (r.saison ? `${r.saison - 1}-${r.saison}` : '2025-2026') === item.seasonLabel).length),
      athleteCount: item.athletesSet.size > 0 ? item.athletesSet.size : item.athleteCount,
      files: Array.from(item.files),
      remoteUrl: item.remoteUrl,
    }));

    return result.sort((a, b) => b.endYear - a.endYear);
  }, [records, officialFiles, downloadedRemoteSources]);

  // Analyse précise de la composition des données actives (fichiers importés par l'utilisateur vs base de référence fédérale)
  const dataComposition = useMemo(() => {
    let userRecordsCount = 0;
    let referenceRecordsCount = 0;
    const userFilesSet = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const isBaseline = (typeof r.id === 'string' && (r.id.startsWith('salle-') || r.id.startsWith('piste-') || r.id.startsWith('bilan-2025-') || r.id.startsWith('rec-demo-'))) ||
        r.sourceFile === 'Rslts salle 25-26.csv' || r.sourceFile === 'Rslts PISTE 25-26.csv' ||
        r.sourceFile === 'Rslts salle 24-25.csv' || r.sourceFile === 'Rslts PISTE 24-25.csv' ||
        r.sourceFile === 'Bases fédérales 2024-2025 & 2025-2026 certifiées';

      if (isBaseline) {
        referenceRecordsCount++;
      } else {
        userRecordsCount++;
        if (r.sourceFile) userFilesSet.add(r.sourceFile);
      }
    }

    const isEmpty = records.length === 0;

    return {
      userRecordsCount,
      referenceRecordsCount,
      totalCount: records.length,
      hasUserFiles: userRecordsCount > 0,
      isFullyUser: userRecordsCount > 0 && referenceRecordsCount === 0,
      isMixed: userRecordsCount > 0 && referenceRecordsCount > 0,
      isPureReference: !isEmpty && userRecordsCount === 0,
      isEmpty,
      userFilesList: Array.from(userFilesSet),
    };
  }, [records]);

  // Async processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState<{
    processed: number;
    total: number;
    percent: number;
  }>({ processed: 0, total: 100, percent: 0 });

  // Parsing result & preview
  const [parsedResult, setParsedResult] = useState<{
    records: PerformanceRecord[];
    errors: string[];
    totalRows: number;
    sourceFileName: string;
    athleteCount: number;
    disciplineCount: number;
    clubCount: number;
  } | null>(null);

  // État de confirmation de suppression d'une base officielle (remplace confirm bloqué dans les iframes)
  const [fileToDelete, setFileToDelete] = useState<OfficialSeasonFile | null>(null);

  const [previewSearch, setPreviewSearch] = useState('');
  const [previewPage, setPreviewPage] = useState(1);
  const PREVIEW_PAGE_SIZE = 15;

  // Status message
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    showNavigationButtons?: boolean;
  } | null>(null);

  // Traiter un fichier sélectionné
  const handleProcessFile = async (file: File) => {
    setStatusBanner(null);
    setParsedResult(null);
    setIsProcessing(true);
    setProgressState({ processed: 0, total: 100, percent: 0 });

    try {
      const text = await file.text();
      if (!text || !text.trim()) {
        setStatusBanner({
          type: 'error',
          message: 'Le fichier sélectionné est vide.',
        });
        setIsProcessing(false);
        return;
      }

      let effectiveUploadStruct = targetUploadStructure;
      const lower = file.name.toLowerCase();
      if (lower.includes('salle') || lower.includes('indoor')) {
        effectiveUploadStruct = 'SALLE';
      } else if (lower.includes('piste')) {
        effectiveUploadStruct = 'EXTERIEUR';
      } else {
        effectiveUploadStruct = 'COMBINE';
      }

      let effectiveStartYear = computedStartYear;
      let effectiveEndYear = computedEndYear;
      let effectiveSeasonLabel = computedSeasonLabel;
      const seasonMatch = lower.match(/(\d{2,4})[-_](\d{2,4})/);
      if (seasonMatch) {
        let y1 = parseInt(seasonMatch[1], 10);
        let y2 = parseInt(seasonMatch[2], 10);
        if (y1 < 100) y1 += 2000;
        if (y2 < 100) y2 += 2000;
        if (y2 === y1 + 1) {
          effectiveStartYear = y1;
          effectiveEndYear = y2;
          effectiveSeasonLabel = `${y1}-${y2}`;
          setSeasonStartYear(String(y1));
          setSeasonEndYear(String(y2));
        }
      }

      const res = await parseAthleticsFileAsync(text, {
        sourceFileName: file.name,
        targetSeason: effectiveEndYear,
        targetSeasonLabel: effectiveSeasonLabel,
        targetStructure: effectiveUploadStruct,
        onProgress: (processed, total, percent) => {
          setProgressState({ processed, total, percent });
        }
      });

      if (res.records.length === 0) {
        setStatusBanner({
          type: 'error',
          message: "Aucune performance valide n'a pu être extraite. Vérifiez le format FFA Logica (délimiteur point-virgule ou tabulation, 27 colonnes).",
        });
        setIsProcessing(false);
        return;
      }

      const athleteCount = res.athleteCount ?? 0;
      const disciplineCount = res.disciplineCount ?? 0;
      const clubCount = res.clubCount ?? 0;

      // Stocker le résultat pour prévisualisation et options
      setParsedResult({
        records: res.records,
        errors: res.errors,
        totalRows: res.totalRows,
        sourceFileName: file.name,
        athleteCount,
        disciplineCount,
        clubCount,
      });

      // Si l'activation automatique est cochée, intégrer immédiatement dans l'application tout en conservant les autres saisons
      if (autoIntegrateOnUpload) {
        const hasSalle = res.records.some(r => r.structure === 'SALLE');
        const hasExt = res.records.some(r => r.structure === 'EXTERIEUR');
        const finalStruct = (hasSalle && hasExt) ? 'COMBINE' : effectiveUploadStruct;

        const seasonMeta = {
          seasonLabel: effectiveSeasonLabel,
          startYear: effectiveStartYear,
          endYear: effectiveEndYear,
          structure: finalStruct,
          totalLinesDetected: res.totalRows,
          athleteCount,
          replaceEntireDatabase: false, // Conserve précieusement les autres saisons déjà importées !
        };

        onUpdateRecords(res.records, res.records.length, file.name, seasonMeta);
        setOfficialFilesRefreshTrigger(prev => prev + 1);
        setLastActivatedFileName(file.name);

        setStatusBanner({
          type: 'success',
          message: `✓ Fichier "${file.name}" importé et validé pour la saison ${effectiveSeasonLabel} : ${res.records.length.toLocaleString('fr-FR')} performances (${athleteCount.toLocaleString('fr-FR')} athlètes distincts) enregistrées ! Vos autres bases officielles restent conservées.`,
          showNavigationButtons: true,
        });
      } else {
        const structureLabel = targetUploadStructure === 'COMBINE'
          ? 'Plein air + salle (Centralisé)'
          : (targetUploadStructure === 'SALLE' ? 'En Salle (Indoor)' : 'Plein Air (Extérieur)');

        setStatusBanner({
          type: 'info',
          message: `Analyse terminée : ${res.totalRows.toLocaleString('fr-FR')} lignes analysées, ${res.records.length.toLocaleString('fr-FR')} performances extraites réparties sur ${athleteCount.toLocaleString('fr-FR')} athlètes distincts pour la saison ${computedSeasonLabel} (${structureLabel}). Choisissez ci-dessous comment intégrer ce fichier.`,
        });
      }
    } catch (err: any) {
      console.error('File parsing error', err);
      setStatusBanner({
        type: 'error',
        message: 'Erreur lors de la lecture du fichier : ' + (err.message || 'Format non supporté'),
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Valider et intégrer directement dans la base officielle (remplacement complet ou fusion)
  const handleConfirmIntegration = (replaceEntireDatabase: boolean = false) => {
    if (!parsedResult || parsedResult.records.length === 0) return;

    const hasSalle = parsedResult.records.some(r => r.structure === 'SALLE');
    const hasExt = parsedResult.records.some(r => r.structure === 'EXTERIEUR');
    const finalStruct = (hasSalle && hasExt) ? 'COMBINE' : targetUploadStructure;

    const seasonMeta = {
      seasonLabel: computedSeasonLabel,
      startYear: computedStartYear,
      endYear: computedEndYear,
      structure: finalStruct,
      totalLinesDetected: parsedResult.totalRows,
      athleteCount: parsedResult.athleteCount,
      replaceEntireDatabase,
    };

    onUpdateRecords(parsedResult.records, parsedResult.records.length, parsedResult.sourceFileName, seasonMeta);
    setOfficialFilesRefreshTrigger(prev => prev + 1);
    setLastActivatedFileName(parsedResult.sourceFileName);

    const structureDisplay = finalStruct === 'COMBINE' 
      ? 'Plein air + salle (Centralisé)' 
      : (finalStruct === 'SALLE' ? 'En Salle' : 'Plein Air');

    setStatusBanner({
      type: 'success',
      message: replaceEntireDatabase
        ? `✓ Base de données remplacée : votre fichier "${parsedResult.sourceFileName}" est désormais l'unique référence active (${parsedResult.records.length.toLocaleString('fr-FR')} performances réelles de ${parsedResult.athleteCount.toLocaleString('fr-FR')} athlètes). Les anciennes données d'essai ont été purgées.`
        : `✓ Fichier "${parsedResult.sourceFileName}" fusionné avec succès pour la saison ${computedSeasonLabel} (${structureDisplay}) : ${parsedResult.totalRows.toLocaleString('fr-FR')} lignes détectées, ${parsedResult.records.length.toLocaleString('fr-FR')} performances intégrées pour ${parsedResult.athleteCount.toLocaleString('fr-FR')} athlètes distincts !`,
      showNavigationButtons: true,
    });
    setParsedResult(null);
  };

  // Confirmation et exécution de la suppression d'une base officielle
  const handleExecuteDeleteOfficialFile = () => {
    if (!fileToDelete) return;
    const target = fileToDelete;
    const { updatedRecords } = StorageService.deleteOfficialSeasonFileAndRecords(target.id, records);
    
    // Mettre à jour l'application globale (Bilan, Athlètes, Disciplines, etc.)
    onUpdateRecords(
      updatedRecords,
      updatedRecords.length,
      updatedRecords.length > 0 ? (updatedRecords[0].sourceFile || 'Base mise à jour') : 'Aucune base active'
    );
    
    const remainingFiles = StorageService.getOfficialSeasonFiles();
    if (remainingFiles.length === 0) {
      setLastActivatedFileName(null);
    } else {
      setLastActivatedFileName(remainingFiles[0].fileName);
    }
    
    setOfficialFilesRefreshTrigger(prev => prev + 1);
    setFileToDelete(null);
    
    const structLabel = target.structure === 'COMBINE' ? 'Plein air + salle' : (target.structure === 'SALLE' ? 'En Salle' : 'Plein Air');
    setStatusBanner({
      type: 'info',
      message: `✓ Base officielle "${target.fileName}" (${target.seasonLabel} - ${structLabel}) supprimée avec succès. Ses ${target.recordCount.toLocaleString('fr-FR')} performances ont été retirées du système.`,
    });
  };

  // Télécharger modèle CSV (avec en-têtes officiels)
  const handleDownloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_entete.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Télécharger modèle TXT (Tabulation sans en-tête)
  const handleDownloadSampleTXT = () => {
    const txtContent = generateSampleTXT();
    const blob = new Blob(['\ufeff' + txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_bilan_ffa_sans_entete.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Télécharger le Guide Complet de Stockage GitHub & Cloudflare R2 au format Markdown (.md)
  const handleDownloadGuideMD = () => {
    const blob = new Blob([CLOUD_STORAGE_GUIDE_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Guide_Stockage_Bilans_GitHub_Cloudflare_R2.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Télécharger le Guide au format Word / Document compatible (.doc)
  const handleDownloadGuideWord = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Guide Hébergement Bilans FFA - GitHub et Cloudflare R2</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 24px; }
          h1 { color: #0284c7; font-size: 24pt; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
          h2 { color: #0f172a; font-size: 16pt; margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          h3 { color: #334155; font-size: 13pt; }
          pre, code { font-family: Consolas, monospace; background: #f1f5f9; padding: 3px 6px; border-radius: 4px; }
          pre { padding: 12px; border: 1px solid #e2e8f0; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
          th { background: #f8fafc; font-weight: bold; }
        </style>
      </head>
      <body>
        ${CLOUD_STORAGE_GUIDE_MARKDOWN
          .replace(/# (.*?)\n/g, '<h1>$1</h1>')
          .replace(/## (.*?)\n/g, '<h2>$1</h2>')
          .replace(/### (.*?)\n/g, '<h3>$1</h3>')
          .replace(/```json([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
          .replace(/```bash([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
          .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
          .replace(/\n\n/g, '<p></p>')
        }
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Guide_Stockage_Bilans_GitHub_Cloudflare_R2.doc');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Télécharger et intégrer automatiquement un bilan depuis une URL distante (GitHub Releases/Raw, Cloudflare R2 ou URL publique)
  const handleFetchRemoteUrl = async (overrideUrl?: string, forceReload: boolean = false) => {
    let targetUrl = (overrideUrl || remoteUrlInput).trim();
    if (!targetUrl) return;

    // Convertir automatiquement les URL GitHub 'blob' en URL raw si l'utilisateur colle un lien de code GitHub
    if (targetUrl.includes('github.com') && targetUrl.includes('/blob/')) {
      targetUrl = targetUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }

    setIsFetchingRemote(true);
    setRemoteFetchStatus('Connexion à la source distante...');
    setStatusBanner(null);

    const urlParts = targetUrl.split('/');
    const rawName = decodeURIComponent(urlParts[urlParts.length - 1].split('?')[0]) || 'bilan_distant.csv';

    try {
      let res: Response | null = null;
      let effectiveFetchUrl = targetUrl;

      // Stratégie 0 : Vérification si le fichier est déjà pré-téléchargé en local (/nom_fichier.csv)
      if (!forceReload && (rawName === 'Rslts_25-26.csv' || targetUrl.includes('Rslts_25-26.csv') || targetUrl.startsWith('/'))) {
        try {
          setRemoteFetchStatus('Chargement du fichier officiel synchronisé en local (851 918 lignes)...');
          const cacheBustParam = `?t=${Date.now()}`;
          const localDirectRes = await fetch(`/${rawName}${cacheBustParam}`, { 
            credentials: 'include',
            cache: 'default',
          });
          if (localDirectRes.ok) {
            const clen = localDirectRes.headers.get('content-length');
            const numLen = clen ? parseInt(clen, 10) : 0;
            // Ne retenir le local que s'il est complet (>= 150 Mo pour 25-26)
            if (numLen === 0 || numLen >= 150000000 || !rawName.includes('25-26')) {
              res = localDirectRes;
              effectiveFetchUrl = `/${rawName}`;
            }
          }
        } catch (e) {
          console.warn('Fichier local non joignable directement:', e);
        }
      }

      // Stratégie 1 : Appel direct au serveur local /api/download-remote
      if (!res) {
        try {
          setRemoteFetchStatus('Téléchargement via le serveur applicatif...');
          const srvRes = await fetch('/api/download-remote', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl, force: forceReload }),
          });
          if (srvRes.ok) {
            const srvData = await srvRes.json();
            if (srvData.localUrl) {
              effectiveFetchUrl = srvData.localUrl;
              setRemoteFetchStatus('Fichier téléchargé sur le serveur. Chargement en mémoire...');
              const fetchedLocal = await fetch(effectiveFetchUrl, { 
                credentials: 'include',
                cache: 'no-cache',
              });
              if (fetchedLocal.ok) {
                res = fetchedLocal;
              }
            }
          }
        } catch (e) {
          console.warn('Serveur download-remote non joignable:', e);
        }
      }

      // Stratégie 2 : Chargement via le proxy streaming
      if (!res) {
        try {
          const fetchTarget = `/api/proxy-download?url=${encodeURIComponent(targetUrl)}`;
          const localOrProxyRes = await fetch(fetchTarget, { credentials: 'include' });
          if (localOrProxyRes.ok) {
            res = localOrProxyRes;
          }
        } catch (e) {
          console.warn('Proxy streaming local non joignable, tentative directe...', e);
        }
      }

      // Stratégie 3 : Si échec, tentative directe (si CORS autorisé, ex: Cloudflare R2 bien configuré)
      if (!res) {
        try {
          const directRes = await fetch(targetUrl);
          if (directRes.ok) {
            res = directRes;
          }
        } catch (e) {
          console.warn('Téléchargement direct bloqué (CORS), tentative via proxy de secours...', e);
        }
      }

      // Stratégie 4 : Secours via proxy public si besoin
      if (!res) {
        try {
          const fallbackRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
          if (fallbackRes.ok) {
            res = fallbackRes;
          }
        } catch (e) {
          console.warn('Proxy de secours non joignable:', e);
        }
      }

      if (!res || !res.ok) {
        throw new Error(
          (res ? `Erreur HTTP ${res.status} ${res.statusText}` : 'Erreur de connexion au serveur ou blocage réseau') +
          '. Vous pouvez également glisser-déposer directement votre fichier CSV téléchargé dans la zone ci-dessous.'
        );
      }

      // Streaming du fichier avec calcul de la progression en direct (Mo reçus et %)
      const contentLengthHeader = res.headers.get('content-length');
      const totalBytesExpected = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
      let receivedBytes = 0;
      let text = '';

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
        const textParts: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            receivedBytes += value.length;
            textParts.push(decoder.decode(value, { stream: true }));
            const mbReceived = (receivedBytes / (1024 * 1024)).toFixed(1);
            if (totalBytesExpected > 0) {
              const mbTotal = (totalBytesExpected / (1024 * 1024)).toFixed(1);
              const pct = Math.min(100, Math.round((receivedBytes / totalBytesExpected) * 100));
              setRemoteFetchStatus(`Téléchargement : ${mbReceived} Mo / ${mbTotal} Mo (${pct}%)...`);
            } else {
              setRemoteFetchStatus(`Téléchargement : ${mbReceived} Mo reçus...`);
            }
          }
        }
        textParts.push(decoder.decode()); // Flush final stream
        setRemoteFetchStatus(`Assemblage du fichier (${(receivedBytes / (1024 * 1024)).toFixed(1)} Mo)...`);
        text = textParts.join('');
      } else {
        text = await res.text();
        receivedBytes = text.length;
      }

      if (!text || text.trim().length < 50) {
        throw new Error('Le fichier téléchargé semble vide ou non conforme.');
      }

      // Si le fichier officiel Rslts_25-26.csv est incomplet (< 100 Mo), forcer la récupération du jeu complet
      if (rawName.includes('25-26') && text.length < 100000000) {
        setRemoteFetchStatus('Téléchargement du fichier officiel complet (851 918 lignes)...');
        try {
          const forceSrvRes = await fetch('/api/download-remote', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://github.com/DataJL/data_FFA/releases/download/S25-26/Rslts_25-26.csv', force: true }),
          });
          if (forceSrvRes.ok) {
            const srvData = await forceSrvRes.json();
            if (srvData.localUrl) {
              const reRes = await fetch(`${srvData.localUrl}&t=${Date.now()}`);
              if (reRes.ok) {
                const fullText = await reRes.text();
                if (fullText.length >= 100000000) {
                  text = fullText;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Erreur secours download-remote:', e);
        }
      }

      let effectiveUploadStruct = targetUploadStructure;
      const lower = (rawName + ' ' + targetUrl).toLowerCase();
      if (lower.includes('salle') || lower.includes('indoor')) {
        effectiveUploadStruct = 'SALLE';
      } else if (lower.includes('piste')) {
        effectiveUploadStruct = 'EXTERIEUR';
      } else {
        effectiveUploadStruct = 'COMBINE';
      }

      let effectiveStartYear = computedStartYear;
      let effectiveEndYear = computedEndYear;
      let effectiveSeasonLabel = computedSeasonLabel;
      const seasonMatch = lower.match(/(?:s|saison)?(\d{2,4})[-_](\d{2,4})/);
      if (seasonMatch) {
        let y1 = parseInt(seasonMatch[1], 10);
        let y2 = parseInt(seasonMatch[2], 10);
        if (y1 < 100) y1 += 2000;
        if (y2 < 100) y2 += 2000;
        if (y2 === y1 + 1) {
          effectiveStartYear = y1;
          effectiveEndYear = y2;
          effectiveSeasonLabel = `${y1}-${y2}`;
          setSeasonStartYear(String(y1));
          setSeasonEndYear(String(y2));
        }
      }

      setRemoteFetchStatus('Indexation et normalisation des performances...');
      const parseRes = await parseAthleticsFileAsync(text, {
        sourceFileName: rawName,
        targetSeason: effectiveEndYear,
        targetSeasonLabel: effectiveSeasonLabel,
        targetStructure: effectiveUploadStruct,
        onProgress: (processed, total, percent) => {
          setProgressState({ processed, total, percent });
        }
      });

      if (parseRes.records.length === 0) {
        throw new Error('Aucune performance valide extraite. Vérifiez que le fichier respecte le format fédéral Logica / SIFFA (27 colonnes).');
      }

      const athleteCount = parseRes.athleteCount ?? 0;
      const hasSalle = parseRes.records.some(r => r.structure === 'SALLE');
      const hasExt = parseRes.records.some(r => r.structure === 'EXTERIEUR');
      const finalStruct = (hasSalle && hasExt) ? 'COMBINE' : effectiveUploadStruct;

      const isCompleteSeasonFile = rawName.includes('25-26') || parseRes.records.length > 200000;
      const seasonMeta = {
        seasonLabel: effectiveSeasonLabel,
        startYear: effectiveStartYear,
        endYear: effectiveEndYear,
        structure: finalStruct,
        totalLinesDetected: parseRes.totalRows,
        athleteCount,
        replaceEntireDatabase: isCompleteSeasonFile,
      };

      onUpdateRecords(parseRes.records, parseRes.records.length, rawName, seasonMeta);
      setOfficialFilesRefreshTrigger(prev => prev + 1);
      setLastActivatedFileName(rawName);

      // Enregistrer dans l'encart des sources distantes téléchargées
      StorageService.addOrUpdateDownloadedRemoteSource({
        id: `remote-${Date.now()}`,
        url: targetUrl,
        fileName: rawName,
        seasonLabel: effectiveSeasonLabel,
        structure: finalStruct,
        recordCount: parseRes.records.length,
        athleteCount,
        totalLinesDetected: parseRes.totalRows,
        downloadedAt: new Date().toISOString(),
        fileSizeFormatted: `${(receivedBytes / (1024 * 1024)).toFixed(1)} Mo`,
      });
      setRemoteSourcesRefreshTrigger(prev => prev + 1);

      setStatusBanner({
        type: 'success',
        message: '✓ Fichier distant "' + rawName + '" téléchargé depuis GitHub et intégré avec succès pour la saison ' + effectiveSeasonLabel + ' : ' + parseRes.records.length.toLocaleString('fr-FR') + ' performances (' + athleteCount.toLocaleString('fr-FR') + ' athlètes distincts) enregistrées dans le cache de votre navigateur !',
        showNavigationButtons: true,
      });
    } catch (err: any) {
      console.error('Remote fetch error:', err);
      setStatusBanner({
        type: 'error',
        message: 'Erreur lors du téléchargement distant : ' + (err.message || 'Connexion impossible') + '. Le système a essayé le proxy local et les relais de sécurité.',
      });
    } finally {
      setIsFetchingRemote(false);
      setRemoteFetchStatus(null);
    }
  };

  // Filtrage et pagination de l'aperçu
  const filteredPreview = useMemo(() => {
    if (!parsedResult) return [];
    if (!previewSearch.trim()) return parsedResult.records;
    const q = previewSearch.toLowerCase().trim();
    const maxMatches = 500;
    const matches: PerformanceRecord[] = [];
    for (let i = 0; i < parsedResult.records.length; i++) {
      const r = parsedResult.records[i];
      if (
        r.athleteName.toLowerCase().includes(q) ||
        r.discipline.toLowerCase().includes(q) ||
        r.club.toLowerCase().includes(q) ||
        r.lieu.toLowerCase().includes(q)
      ) {
        matches.push(r);
        if (matches.length >= maxMatches) break;
      }
    }
    return matches;
  }, [parsedResult, previewSearch]);

  const totalPreviewPages = Math.ceil(filteredPreview.length / PREVIEW_PAGE_SIZE) || 1;
  const paginatedPreview = useMemo(() => {
    const start = (previewPage - 1) * PREVIEW_PAGE_SIZE;
    return filteredPreview.slice(start, start + PREVIEW_PAGE_SIZE);
  }, [filteredPreview, previewPage]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* EN-TÊTE DE LA PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600/20 text-sky-300 border border-blue-500/30">
              Module Centralisé d'Importation & Exportation
            </span>
            <span className="text-xs text-slate-500 font-mono">Administration FFA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Upload className="w-8 h-8 text-sky-400" />
            <span>Import & Export des Bilans Fédéraux</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Importez vos fichiers officiels FFA Logica et SIFFA (27 colonnes) par saison et par structure, ou centralisez toutes les épreuves dans un fichier unique (Plein air + salle). Les données sont immédiatement synchronisées sur l'ensemble des onglets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsStorageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            <HardDrive className="w-4 h-4 text-sky-400" />
            <span>Stockage IndexedDB</span>
          </button>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            title="Consulter le guide des épreuves officielles FFA par catégorie"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Guide officiel FFA</span>
          </button>

          <button
            onClick={() => setIsCloudStorageGuideOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600/30 to-blue-600/30 hover:from-sky-600/40 hover:to-blue-600/40 border border-sky-400/40 text-sky-200 text-xs font-bold cursor-pointer transition-colors shadow-sm"
            title="Consulter et télécharger le guide de mise en place de GitHub & Cloudflare R2 (100% gratuit et sans limite)"
          >
            <Github className="w-4 h-4 text-sky-300" />
            <span>Guide GitHub & R2</span>
          </button>
        </div>
      </div>

      {/* BANNIÈRE D'INFORMATION / STATUT */}
      {statusBanner && (
        <div className={`p-4 rounded-xl border flex flex-col gap-3 animate-fade-in text-xs ${
          statusBanner.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
            : statusBanner.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-sky-950/40 border-sky-500/40 text-sky-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {statusBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : statusBanner.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              )}
              <p className="font-medium leading-relaxed">{statusBanner.message}</p>
            </div>
            <button 
              onClick={() => setStatusBanner(null)} 
              className="text-slate-400 hover:text-white cursor-pointer font-bold px-1"
            >
              ✕
            </button>
          </div>

          {statusBanner.showNavigationButtons && (
            <div className="flex items-center gap-2.5 pt-2 border-t border-emerald-500/20 flex-wrap">
              <button
                type="button"
                onClick={() => onNavigate('bilan')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <span>Accéder au Bilan Général avec ce fichier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('discipline')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/40 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Accéder aux Fiches Disciplines</span>
                <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* GUIDE & HÉBERGEMENT GRATUIT DES BILANS (GITHUB RELEASES & CLOUDFLARE R2)    */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/40 rounded-2xl p-6 space-y-5 shadow-2xl animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-500/20 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Releases & Cloudflare R2</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Gratuit & Illimité
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
              <Cloud className="w-6 h-6 text-sky-400 shrink-0" />
              <span>Hébergement & Diffusion des Fichiers Bilans</span>
            </h2>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={handleDownloadGuideWord}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
              title="Télécharger le guide au format Document (.doc)"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Guide (.doc)</span>
            </button>
          </div>
        </div>

        {/* SOUS-MODULE D'IMPORTATION DIRECTE PAR URL DISTANTE */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-xs sm:text-sm">
                Importer directement depuis une URL distante (GitHub, Cloudflare R2 ou URL publique)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Saison ciblée : <strong>{computedSeasonLabel}</strong>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <input
                type="url"
                value={remoteUrlInput}
                onChange={(e) => setRemoteUrlInput(e.target.value)}
                placeholder="https://raw.githubusercontent.com/.../Rslts_salle_25-26.csv ou https://pub-xxxx.r2.dev/bilan.csv"
                className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-sky-500 transition-colors"
                disabled={isFetchingRemote}
              />
              {remoteUrlInput && (
                <button
                  onClick={() => setRemoteUrlInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => handleFetchRemoteUrl(undefined, true)}
              disabled={isFetchingRemote || !remoteUrlInput.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all shadow-md shrink-0"
            >
              {isFetchingRemote ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>{remoteFetchStatus || 'Téléchargement...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Télécharger & Intégrer</span>
                </>
              )}
            </button>
          </div>

          {/* RACCOURCIS DE TEST ET EXEMPLES D'URL */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
            <span className="text-slate-400 font-medium">Exemples rapides :</span>
            <button
              type="button"
              onClick={() => {
                setRemoteUrlInput('https://github.com/DataJL/data_FFA/releases/download/S25-26/Rslts_25-26.csv');
              }}
              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 cursor-pointer font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Votre fichier officiel Saison 2025-2026 sur GitHub Releases (DataJL/data_FFA)"
            >
              <Github className="w-3.5 h-3.5 text-sky-400" />
              <span>Votre Bilan GitHub 25-26 (DataJL/data_FFA)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const sampleUrl = `${window.location.origin}/Rslts%20salle%2025-26.csv`;
                setRemoteUrlInput(sampleUrl);
              }}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer font-mono"
            >
              Fichier local test (/Rslts salle 25-26.csv)
            </button>
            <button
              type="button"
              onClick={() => {
                setRemoteUrlInput('https://raw.githubusercontent.com/votre-compte/stats-france-athle-data/main/Rslts_salle_25-26.csv');
              }}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer font-mono"
            >
              Modèle GitHub Raw
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ENCART : LIENS TÉLÉCHARGÉS & SAISONS DISPONIBLES DANS L'APPLICATION      */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <span>Encart des Liens Téléchargés & Saisons Disponibles</span>
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    {availableSeasonsSummary.length} saison{availableSeasonsSummary.length > 1 ? 's' : ''} active{availableSeasonsSummary.length > 1 ? 's' : ''}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Récapitulatif des fichiers bilans téléchargés via GitHub / Cloudflare R2 et des saisons prêtes à l'analyse
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Total en mémoire :</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {records.length.toLocaleString('fr-FR')} perfs
              </span>
            </div>
          </div>

          {/* 1. SECTION : FICHIERS & LIENS TÉLÉCHARGÉS VIA GITHUB / CLOUDFLARE R2 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-sky-400">
                <Github className="w-4 h-4 text-sky-400" />
                <span>Liens des fichiers téléchargés ({downloadedRemoteSources.length})</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Stockés en cache local IndexedDB
              </span>
            </div>

            {downloadedRemoteSources.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  Aucun lien distant n'a encore été téléchargé dans cette session.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRemoteUrlInput('https://github.com/DataJL/data_FFA/releases/download/S25-26/Rslts_25-26.csv');
                      handleFetchRemoteUrl('https://github.com/DataJL/data_FFA/releases/download/S25-26/Rslts_25-26.csv', true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600/40 border border-sky-500/40 text-sky-200 text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger directement votre fichier GitHub (Rslts_25-26.csv)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {downloadedRemoteSources.map((source) => (
                  <div
                    key={source.id}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono">
                          {source.seasonLabel}
                        </span>
                        <span className="font-bold text-white text-xs truncate max-w-xs" title={source.fileName}>
                          {source.fileName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {source.structure === 'COMBINE' ? 'Plein air + salle' : source.structure === 'SALLE' ? 'Salle' : 'Plein Air'}
                        </span>
                        {source.fileSizeFormatted && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {source.fileSizeFormatted}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleFetchRemoteUrl(source.url, true)}
                          disabled={isFetchingRemote}
                          className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 font-semibold text-[11px] cursor-pointer flex items-center gap-1 transition-colors"
                          title="Re-télécharger et rafraîchir les données depuis cette URL"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Actualiser</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            StorageService.removeDownloadedRemoteSource(source.id);
                            setRemoteSourcesRefreshTrigger(prev => prev + 1);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                          title="Retirer de la liste des liens"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* URL avec bouton copier et lien externe */}
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-hidden">
                      <span className="truncate" title={source.url}>
                        {source.url}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(source.url);
                            setStatusBanner({
                              type: 'info',
                              message: `Lien copié dans le presse-papiers : ${source.url}`,
                            });
                          }}
                          className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] cursor-pointer"
                        >
                          Copier
                        </button>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-sky-300 p-0.5"
                          title="Ouvrir dans un nouvel onglet"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Indicateurs statistiques */}
                    <div className="grid grid-cols-3 gap-2 font-mono text-[10px] pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-slate-500 block uppercase">Lignes</span>
                        <span className="font-bold text-cyan-400">{source.totalLinesDetected ? source.totalLinesDetected.toLocaleString('fr-FR') : '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase">Performances</span>
                        <span className="font-bold text-emerald-400">{source.recordCount.toLocaleString('fr-FR')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase">Athlètes</span>
                        <span className="font-bold text-sky-400">{source.athleteCount ? source.athleteCount.toLocaleString('fr-FR') : '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. SECTION : SAISONS DISPONIBLES ET ACTIVES DANS L'APPLICATION */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-emerald-400">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Saisons disponibles dans l'application ({availableSeasonsSummary.length})</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Prêtes pour le Bilan Général et les Fiches Disciplines
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableSeasonsSummary.map((season) => (
                <div
                  key={season.seasonLabel}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-white font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>Saison {season.seasonLabel}</span>
                      </span>
                      <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {season.structures.join(' + ')}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Fichiers : <strong className="text-slate-300">{season.files.join(', ') || 'Base active'}</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[10px]">
                      <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-500 block uppercase">Performances</span>
                        <span className="font-bold text-emerald-400 text-xs">
                          {season.recordCount.toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-500 block uppercase">Athlètes</span>
                        <span className="font-bold text-sky-400 text-xs">
                          {season.athleteCount ? season.athleteCount.toLocaleString('fr-FR') : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('bilan')}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Consulter le Bilan {season.seasonLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>



      {/* ========================================================================= */}
      {/* 2. APERÇU ET CONFIRMATION DES DONNÉES EXTRAITES                             */}
      {/* ========================================================================= */}
      {parsedResult && parsedResult.records.length > 0 && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 space-y-5 animate-fade-in shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">
                  2. Aperçu des performances extraites du fichier "{parsedResult.sourceFileName}"
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vérifiez la conformité des données avant de les valider définitivement dans la base officielle.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setParsedResult(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => handleConfirmIntegration(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                title="Supprime l'ensemble des autres saisons enregistrées pour ne conserver que ce fichier"
              >
                <span>Remplacer toute la base (écraser autres saisons)</span>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmIntegration(false)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 cursor-pointer transition-all"
                title="Conserve l'ensemble de vos autres saisons et ajoute ou met à jour la saison sélectionnée"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Conserver les autres saisons et intégrer la saison {computedSeasonLabel} ({parsedResult.records.length.toLocaleString('fr-FR')} perfs)</span>
              </button>
            </div>
          </div>

          {/* Statistiques extraites avec les 3 indicateurs clés réclamés */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-center">
              <span className="text-[11px] text-cyan-300 block mb-0.5 font-medium">Lignes détectées</span>
              <span className="text-xl font-black text-cyan-400">
                {parsedResult.totalRows.toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-center">
              <span className="text-[11px] text-emerald-300 block mb-0.5 font-medium">Performances</span>
              <span className="text-xl font-black text-emerald-400">
                {parsedResult.records.length.toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-sky-500/30 text-center">
              <span className="text-[11px] text-sky-300 block mb-0.5 font-medium">Athlètes différents</span>
              <span className="text-xl font-black text-sky-400">
                {parsedResult.athleteCount.toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 text-center">
              <span className="text-[11px] text-amber-300 block mb-0.5 font-medium">Disciplines</span>
              <span className="text-xl font-black text-amber-400">
                {parsedResult.disciplineCount.toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/30 text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] text-purple-300 block mb-0.5 font-medium">Clubs représentés</span>
              <span className="text-xl font-black text-purple-400">
                {parsedResult.clubCount.toLocaleString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Erreurs non bloquantes */}
          {parsedResult.errors.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/90 space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {parsedResult.errors.length} lignes ignorées (performances non reconnues ou vides) :
              </p>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-300/70">
                {parsedResult.errors.slice(0, 3).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Filtre de recherche & Pagination pour l'aperçu */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={previewSearch}
                  onChange={e => {
                    setPreviewSearch(e.target.value);
                    setPreviewPage(1);
                  }}
                  placeholder="Filtrer l'aperçu par athlète, épreuve ou club..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Page {previewPage} sur {totalPreviewPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={previewPage <= 1}
                    onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-xs"
                  >
                    Précédent
                  </button>
                  <button
                    disabled={previewPage >= totalPreviewPages}
                    onClick={() => setPreviewPage(p => Math.min(totalPreviewPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-xs"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>

            {/* Tableau d'aperçu */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                    <th className="py-2.5 px-3">Athlète</th>
                    <th className="py-2.5 px-3">Discipline</th>
                    <th className="py-2.5 px-3">Structure</th>
                    <th className="py-2.5 px-3">Performance</th>
                    <th className="py-2.5 px-3">Vent</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Club</th>
                    <th className="py-2.5 px-3">Ligue / Région</th>
                    <th className="py-2.5 px-3">Cat.</th>
                    <th className="py-2.5 px-3">Niveau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {paginatedPreview.map(r => (
                    <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2 px-3 font-semibold text-white">{r.athleteName}</td>
                      <td className="py-2 px-3">{r.discipline}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          r.structure === 'SALLE' 
                            ? 'bg-blue-500/20 text-sky-300' 
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {r.structure === 'SALLE' ? 'Salle' : 'Plein Air'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-sky-300">{r.performanceDisplay}</td>
                      <td className="py-2 px-3 font-mono text-slate-400">
                        {r.vent !== null && r.vent !== undefined ? `${r.vent > 0 ? '+' : ''}${r.vent}` : '-'}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400">{r.date}</td>
                      <td className="py-2 px-3 truncate max-w-[150px]">{r.club}</td>
                      <td className="py-2 px-3 text-slate-400">{r.region}</td>
                      <td className="py-2 px-3 font-mono text-slate-400">{r.categorie}</td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-400">{r.niveau}</td>
                    </tr>
                  ))}
                  {paginatedPreview.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-500">
                        Aucun résultat ne correspond à votre filtre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CENTRE D'EXPORTATION MULTI-FORMATS (.XLSX, .DOC, .PDF)                 */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-sky-400" />
              <span>Centre d'Exportation Multi-Formats</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Téléchargez l'intégralité des données actives ({records.length.toLocaleString('fr-FR')} performances) au format souhaité :
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 w-fit">
            {records.length.toLocaleString('fr-FR')} performances exportables
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* Excel Card */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Classeur Excel (.xlsx)</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Comprend 3 feuilles : Performances détaillées, Bilans agrégés par épreuve, et Registre des Records Personnels.
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportToExcel(records, 'Stats_France_Athle_Export_Complet')}
              className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-emerald-900/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger Excel (.xlsx)</span>
            </button>
          </div>

          {/* Word Card */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-sky-400 flex items-center justify-center mb-3 border border-blue-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Document Word (.doc)</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Rapport officiel rédigé avec sommaire, tableaux de synthèse, analyses par entraîneur et bilans annuels prêts à imprimer.
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportToWord(
                'Bilan Annuel des Performances Fédérales',
                'Fédération Française d\'Athlétisme · Base Nationale',
                [
                  {
                    heading: '1. Présentation de la Synthèse',
                    text: `Ce document compile l'ensemble des ${records.length.toLocaleString('fr-FR')} performances validées pour la saison sportive.`,
                  },
                  {
                    heading: '2. Tableau des Performances Fédérales',
                    tableHeaders: ['Athlète', 'Discipline', 'Performance', 'Vent', 'Club', 'Entraîneur', 'Niveau', 'Date'],
                    tableRows: records.slice(0, 50).map(r => [
                      r.athleteName,
                      r.discipline,
                      r.performanceDisplay,
                      r.vent !== null && r.vent !== undefined ? `${r.vent > 0 ? '+' : ''}${r.vent}` : '-',
                      r.club,
                      r.entraineur,
                      r.niveau,
                      r.date,
                    ]),
                  }
                ],
                'Rapport_General_France_Athle'
              )}
              className="mt-4 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-sky-900/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger Word (.doc)</span>
            </button>
          </div>

          {/* PDF Card */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/20">
                <FileDown className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Document PDF (.pdf)</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Certificat de bilan officiel haute qualité avec en-tête de la Fédération, statistiques clés et signatures.
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportToPDF('Synthèse Nationale Athlétisme FFA', records, 'Bilan_Officiel_Athle')}
              className="mt-4 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-rose-900/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger PDF (.pdf)</span>
            </button>
          </div>

        </div>
      </div>

      {/* MODAL EXPLICATIF DU STOCKAGE DES FICHIERS */}
      <StorageInfoModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        totalRecordsCount={records.length}
      />

      {/* MODAL DE CONFIRMATION DE SUPPRESSION D'UNE BASE OFFICIELLE (100% compatible iFrame) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Supprimer cette base officielle ?</h3>
                <p className="text-xs text-slate-400">Purgera les données de tous les bilans</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Fichier :</span>
                <span className="font-mono text-slate-200 font-semibold truncate max-w-[220px]" title={fileToDelete.fileName}>
                  {fileToDelete.fileName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Saison fédérale :</span>
                <span className="font-mono text-sky-300 font-bold">{fileToDelete.seasonLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Structure / Environnement :</span>
                <span className="text-emerald-300 font-semibold">
                  {fileToDelete.structure === 'COMBINE' ? 'Plein air + salle (Centralisé)' : fileToDelete.structure === 'SALLE' ? 'En Salle' : 'Plein Air'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Lignes détectées :</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {fileToDelete.totalLinesDetected ? fileToDelete.totalLinesDetected.toLocaleString('fr-FR') : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Performances à purger :</span>
                <span className="font-mono text-rose-400 font-bold">
                  {fileToDelete.recordCount.toLocaleString('fr-FR')} perfs
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Athlètes concernés :</span>
                <span className="font-mono text-sky-400 font-bold">
                  {fileToDelete.athleteCount ? fileToDelete.athleteCount.toLocaleString('fr-FR') : '—'} athlètes
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir retirer <strong>{fileToDelete.fileName}</strong> ? Ce fichier sera supprimé du catalogue et ses <strong>{fileToDelete.recordCount.toLocaleString('fr-FR')}</strong> performances seront immédiatement retirées de la base (bilans annuels, classements, fiches athlètes et analyses).
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteOfficialFile}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-rose-900/40 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DU GUIDE DES ÉPREUVES OFFICIELLES FFA */}
      <OfficialDisciplinesGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* MODAL D'INFORMATION SUR LE STOCKAGE INDEXEDDB & FIRESTORE */}
      <StorageInfoModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        totalRecordsCount={records.length}
      />

      {/* MODAL DU GUIDE COMPLET DE STOCKAGE GITHUB & CLOUDFLARE R2 */}
      <CloudStorageGuideModal
        isOpen={isCloudStorageGuideOpen}
        onClose={() => setIsCloudStorageGuideOpen(false)}
        onSelectSampleUrl={(url) => {
          setRemoteUrlInput(url);
          setIsCloudStorageGuideOpen(false);
        }}
      />

    </div>
  );
};
