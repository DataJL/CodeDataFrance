import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Activity, 
  Download, 
  FileText, 
  TrendingUp, 
  Zap, 
  ChevronRight, 
  Info, 
  Sliders, 
  Award, 
  CheckCircle2, 
  BarChart3, 
  Sparkles, 
  Upload, 
  Layers, 
  Filter,
  ArrowRight,
  BookOpen,
  Compass,
  Gauge,
  Timer,
  FileCheck,
  Search,
  X,
  FileUp,
  ExternalLink,
  Layers2,
  PieChart,
  Trash2
} from 'lucide-react';
import { HIGH_JUMP_ATHLETES_DATA, SHN_STUDIES, HIGH_JUMP_COACH_BENCHMARKS } from '../../data/shnBiomechanicsData';
import { HighJumpAthleteBioData, DisciplineBiomechanicStudy } from '../../types/shnBiomechanics';

interface DisciplineGroup {
  code: string;
  name: string;
  category: 'SAUTS' | 'SPRINT' | 'HAIES' | 'LANCERS' | 'DEMI_FOND';
  studies: DisciplineBiomechanicStudy[];
}

export const DISCIPLINE_CATALOG: Record<string, { name: string; category: 'SAUTS' | 'SPRINT' | 'HAIES' | 'LANCERS' | 'DEMI_FOND' }> = {
  'HAUTEUR': { name: 'Saut en Hauteur', category: 'SAUTS' },
  'PERCHE': { name: 'Saut à la Perche', category: 'SAUTS' },
  'LONGUEUR': { name: 'Saut en Longueur', category: 'SAUTS' },
  'TRIPLE_SAUT': { name: 'Triple Saut', category: 'SAUTS' },
  '100M': { name: '100m Sprint', category: 'SPRINT' },
  '200M': { name: '200m Sprint', category: 'SPRINT' },
  '400M': { name: '400m Sprint', category: 'SPRINT' },
  '110M_HAIES': { name: '110m Haies', category: 'HAIES' },
  '100M_HAIES': { name: '100m Haies', category: 'HAIES' },
  '400M_HAIES': { name: '400m Haies', category: 'HAIES' },
  '800M': { name: '800m', category: 'DEMI_FOND' },
  '1500M': { name: '1500m', category: 'DEMI_FOND' },
  'JAVELOT': { name: 'Lancer du Javelot', category: 'LANCERS' },
  'POIDS': { name: 'Lancer du Poids', category: 'LANCERS' },
  'DISQUE': { name: 'Lancer du Disque', category: 'LANCERS' },
  'MARTEAU': { name: 'Lancer du Marteau', category: 'LANCERS' }
};

export const StatsSHNView: React.FC = () => {
  // Récupération des études personnalisées téléversées par l'utilisateur
  const [uploadedStudies, setUploadedStudies] = useState<DisciplineBiomechanicStudy[]>(() => {
    try {
      const saved = localStorage.getItem('dfa_shn_custom_studies');
      if (saved) {
        const parsed: DisciplineBiomechanicStudy[] = JSON.parse(saved);
        // Auto-correction des études dont la discipline était erronée (ex: Triple Saut assigné à Hauteur)
        return parsed.map(study => {
          const isTripleSaut = 
            study.disciplineCode === 'TRIPLE_SAUT' || 
            (study.title && /triple/i.test(study.title)) ||
            (study.pdfFileName && /triple/i.test(study.pdfFileName));
          if (isTripleSaut) {
            return {
              ...study,
              disciplineCode: 'TRIPLE_SAUT',
              disciplineName: 'Triple Saut',
              category: 'SAUTS' as const
            };
          }
          return study;
        });
      }
    } catch (e) {
      console.warn('Erreur lors du chargement des études locales', e);
    }
    return [];
  });

  // Récupération des études supprimées / masquées par l'utilisateur
  const [hiddenStudyIds, setHiddenStudyIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dfa_shn_hidden_study_ids');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erreur lors du chargement des études masquées', e);
    }
    return [];
  });

  // Sauvegarde des études masquées
  useEffect(() => {
    try {
      localStorage.setItem('dfa_shn_hidden_study_ids', JSON.stringify(hiddenStudyIds));
    } catch (e) {
      console.warn('Erreur quota localStorage', e);
    }
  }, [hiddenStudyIds]);

  // Sauvegarde des études personnalisées dans le stockage local
  useEffect(() => {
    try {
      // Pour éviter les dépassements de quota localStorage, on n'y sérialise pas les data URLs trop lourdes
      const serializable = uploadedStudies.map(s => {
        if (s.sourcePdfUrl && s.sourcePdfUrl.startsWith('data:') && s.sourcePdfUrl.length > 2000000) {
          return { ...s, sourcePdfUrl: '' };
        }
        return s;
      });
      localStorage.setItem('dfa_shn_custom_studies', JSON.stringify(serializable));
    } catch (e) {
      console.warn('Erreur quota localStorage', e);
    }
  }, [uploadedStudies]);

  // Toutes les études actives combinées (rapports pré-intégrés + téléversements, sans les supprimées)
  const allStudies = useMemo(() => {
    return [...SHN_STUDIES, ...uploadedStudies].filter(s => !hiddenStudyIds.includes(s.id));
  }, [uploadedStudies, hiddenStudyIds]);

  // Regroupement des études par discipline
  const allDisciplineGroups = useMemo<DisciplineGroup[]>(() => {
    const map = new Map<string, DisciplineGroup>();

    allStudies.forEach(study => {
      let normalizedCode = study.disciplineCode;
      let normalizedName = study.disciplineName;

      // Résolution et normalisation prioritaires
      if (study.disciplineCode === 'TRIPLE_SAUT' || /triple/i.test(study.disciplineName) || (study.title && /triple/i.test(study.title))) {
        normalizedCode = 'TRIPLE_SAUT';
        normalizedName = 'Triple Saut';
      } else if (study.disciplineCode === 'HAUTEUR' || (/hauteur/i.test(study.disciplineName) && !/triple/i.test(study.disciplineName))) {
        normalizedCode = 'HAUTEUR';
        normalizedName = 'Saut en Hauteur';
      } else if (DISCIPLINE_CATALOG[study.disciplineCode]) {
        normalizedCode = study.disciplineCode;
        normalizedName = DISCIPLINE_CATALOG[study.disciplineCode].name;
      }

      if (!map.has(normalizedCode)) {
        map.set(normalizedCode, {
          code: normalizedCode,
          name: normalizedName,
          category: study.category || DISCIPLINE_CATALOG[normalizedCode]?.category || 'SAUTS',
          studies: []
        });
      }
      map.get(normalizedCode)!.studies.push(study);
    });

    return Array.from(map.values());
  }, [allStudies]);

  // FILTRE IMPORTANT : Ne proposer QUE les disciplines pour lesquelles AU MOINS UNE étude est disponible
  const availableDisciplineGroups = useMemo(() => {
    return allDisciplineGroups.filter(group => group.studies.some(s => s.available));
  }, [allDisciplineGroups]);

  // Discipline active sélectionnée (par défaut Saut en Hauteur dont l'étude est disponible)
  const [selectedDisciplineCode, setSelectedDisciplineCode] = useState<string>('HAUTEUR');

  // Filtre par sexe sur la sous-page de la discipline ('ALL' | 'H' | 'F' | 'MIXTE')
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'H' | 'F' | 'MIXTE'>('ALL');

  // État de suppression pour la modale in-app
  const [studyToDelete, setStudyToDelete] = useState<DisciplineBiomechanicStudy | null>(null);

  // Groupe de discipline actif
  const currentDisciplineGroup = useMemo(() => {
    return availableDisciplineGroups.find(g => g.code === selectedDisciplineCode) 
      || availableDisciplineGroups[0] 
      || allDisciplineGroups[0];
  }, [availableDisciplineGroups, allDisciplineGroups, selectedDisciplineCode]);

  // Toutes les études disponibles pour la discipline actuelle (sans filtre de sexe, pour compter)
  const allStudiesInCurrentDiscipline = useMemo(() => {
    if (!currentDisciplineGroup) return [];
    return currentDisciplineGroup.studies.filter(s => s.available);
  }, [currentDisciplineGroup]);

  // Décomptes dynamiques par sexe pour la sous-page de la discipline
  const genderCounts = useMemo(() => {
    const list = allStudiesInCurrentDiscipline;
    return {
      all: list.length,
      h: list.filter(s => s.gender === 'H' || (!s.gender && s.id.includes('men'))).length,
      f: list.filter(s => s.gender === 'F' || (!s.gender && s.id.includes('women'))).length,
      mixte: list.filter(s => s.gender === 'MIXTE').length,
    };
  }, [allStudiesInCurrentDiscipline]);

  // Études disponibles après application du filtre de sexe
  const currentDisciplineStudies = useMemo(() => {
    if (genderFilter === 'ALL') return allStudiesInCurrentDiscipline;
    return allStudiesInCurrentDiscipline.filter(s => {
      if (genderFilter === 'H') return s.gender === 'H' || (!s.gender && s.id.includes('men'));
      if (genderFilter === 'F') return s.gender === 'F' || (!s.gender && s.id.includes('women'));
      if (genderFilter === 'MIXTE') return s.gender === 'MIXTE';
      return true;
    });
  }, [allStudiesInCurrentDiscipline, genderFilter]);

  // Si le filtre de sexe actif n'a aucune étude dans la nouvelle discipline, basculer sur 'ALL'
  useEffect(() => {
    if (genderFilter === 'H' && genderCounts.h === 0 && genderCounts.all > 0) {
      setGenderFilter('ALL');
    } else if (genderFilter === 'F' && genderCounts.f === 0 && genderCounts.all > 0) {
      setGenderFilter('ALL');
    } else if (genderFilter === 'MIXTE' && genderCounts.mixte === 0 && genderCounts.all > 0) {
      setGenderFilter('ALL');
    }
  }, [selectedDisciplineCode, genderCounts, genderFilter]);

  // État de sélection d'étude : soit 'SYNTHESIS' (synthèse de toutes les études), soit l'ID d'une étude spécifique
  const [selectedStudyId, setSelectedStudyId] = useState<string>('high-jump-men-london-2017');

  // Mise à jour de l'étude active quand on change de discipline ou de filtre de sexe
  useEffect(() => {
    if (currentDisciplineStudies.length > 0) {
      // Si l'étude actuellement sélectionnée n'appartient pas à la sélection filtrée, on sélectionne la 1ère étude disponible
      const exists = currentDisciplineStudies.some(s => s.id === selectedStudyId);
      if (!exists && selectedStudyId !== 'SYNTHESIS') {
        setSelectedStudyId(currentDisciplineStudies[0].id);
      }
    } else {
      setSelectedStudyId('SYNTHESIS');
    }
  }, [selectedDisciplineCode, currentDisciplineStudies, selectedStudyId]);

  // Étude individuelle active (si selectedStudyId !== 'SYNTHESIS')
  const currentStudy = useMemo(() => {
    if (selectedStudyId === 'SYNTHESIS') {
      return currentDisciplineStudies[0] || null;
    }
    return currentDisciplineStudies.find(s => s.id === selectedStudyId) || currentDisciplineStudies[0] || null;
  }, [selectedStudyId, currentDisciplineStudies]);

  // Plages normatives & repères directeurs dynamiques pour la discipline active
  const activeDisciplineBenchmarks = useMemo(() => {
    const study = currentDisciplineStudies[0];
    if (study?.benchmarksList && study.benchmarksList.length > 0) {
      return study.benchmarksList;
    }
    return [
      { label: "Vitesse d'arrivée (Vh)", range: "7.05 - 7.97 m/s", avg: "7.48 m/s", unit: "m/s" },
      { label: "Distance d'appel", range: "0.78 - 1.70 m", avg: "1.20 m", unit: "m" },
      { label: "Contact au sol", range: "140 - 190 ms", avg: "165 ms", unit: "ms" },
      { label: "Angle d'envol", range: "44° - 53°", avg: "48.6°", unit: "°" },
      { label: "Dernière foulée (appel)", range: "1.90 - 2.22 m", avg: "2.06 m", unit: "m" },
      { label: "Transfert cinématique", range: "64.2 - 77.5 %", avg: "70.9 %", unit: "%" },
    ];
  }, [currentDisciplineStudies]);

  // Modal de sélection/tri de la discipline
  const [isDisciplineFilterModalOpen, setIsDisciplineFilterModalOpen] = useState(false);
  const [disciplineSearchTerm, setDisciplineSearchTerm] = useState('');

  // Disciplines filtrées dans la fenêtre de tri
  const filteredDisciplineGroupsInModal = useMemo(() => {
    if (!disciplineSearchTerm.trim()) return availableDisciplineGroups;
    const term = disciplineSearchTerm.toLowerCase();
    return availableDisciplineGroups.filter(g => 
      g.name.toLowerCase().includes(term) || g.category.toLowerCase().includes(term)
    );
  }, [availableDisciplineGroups, disciplineSearchTerm]);

  // Athlète sélectionné dans le simulateur (par défaut Barshim 2.35m)
  const [selectedAthleteRank, setSelectedAthleteRank] = useState<number>(1);
  const [selectedAthleteName, setSelectedAthleteName] = useState<string>('Mutaz Essa Barshim');
  const [modelFilter, setModelFilter] = useState<'ALL' | 'VITESSE_ELASTICITE' | 'FORCE_PUISSANCE' | 'MIXTE'>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'diagrams' | 'table' | 'coach_guide'>('simulator');
  // Côté de course d'élan pour le schéma technique ('RIGHT' = depuis la droite / appel pied gauche, 'LEFT' = depuis la gauche / appel pied droit)
  const [approachSide, setApproachSide] = useState<'RIGHT' | 'LEFT'>('RIGHT');

  // Athlètes filtrés pour l'étude active
  const athletes = useMemo(() => {
    if (!currentStudy || !currentStudy.athletesData) return [];
    if (modelFilter === 'ALL') return currentStudy.athletesData;
    return currentStudy.athletesData.filter(a => a.modelStyle === modelFilter);
  }, [currentStudy, modelFilter]);

  const currentAthlete = useMemo(() => {
    const list = currentStudy?.athletesData || HIGH_JUMP_ATHLETES_DATA;
    return list.find(a => a.athlete === selectedAthleteName) 
      || list.find(a => a.rank === selectedAthleteRank) 
      || list[0];
  }, [currentStudy, selectedAthleteName, selectedAthleteRank]);

  // -------------------------------------------------------------
  // GESTION DU TÉLÉVERSEMENT DE FICHIER (UPLOAD RÉEL)
  // -------------------------------------------------------------
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    disciplineChoice: 'HAUTEUR', // ou 'NEW'
    customDisciplineName: '',
    category: 'SAUTS' as 'SAUTS' | 'SPRINT' | 'HAIES' | 'LANCERS' | 'DEMI_FOND',
    gender: 'H' as 'H' | 'F' | 'MIXTE',
    competition: '',
    year: 2024,
    authors: '',
    institution: '',
    summary: '',
    keyTakeaway: ''
  });

  const handleFileSelect = (file: File) => {
    setUploadError('');
    // Validation du type de fichier
    const validExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const fileNameLower = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!isValid) {
      setUploadError('Format de fichier non supporté. Veuillez sélectionner un document PDF, Word ou Excel.');
      return;
    }

    setUploadedFile(file);
    setUploadProgress(20);

    // Titre par défaut basé sur le nom du fichier (sans extension) si non renseigné
    if (!uploadForm.title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setUploadForm(prev => ({ ...prev, title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1) }));
    }

    // Lecture du fichier en DataURL
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const percent = Math.round((ev.loaded / ev.total) * 90);
        setUploadProgress(percent);
      }
    };
    reader.onload = () => {
      setUploadedFileBase64(reader.result as string);
      setUploadProgress(100);
    };
    reader.onerror = () => {
      setUploadError('Erreur lors de la lecture du fichier.');
      setUploadProgress(0);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAddCustomStudySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      setUploadError('Veuillez sélectionner un fichier à téléverser (PDF, Word, Excel).');
      return;
    }

    let finalDisciplineCode = uploadForm.disciplineChoice;
    let finalDisciplineName = DISCIPLINE_CATALOG[uploadForm.disciplineChoice]?.name || uploadForm.disciplineChoice;
    let finalCategory = DISCIPLINE_CATALOG[uploadForm.disciplineChoice]?.category || uploadForm.category;

    if (uploadForm.disciplineChoice === 'NEW') {
      if (!uploadForm.customDisciplineName.trim()) {
        setUploadError('Veuillez indiquer le nom de la nouvelle discipline.');
        return;
      }
      finalDisciplineName = uploadForm.customDisciplineName.trim();
      finalDisciplineCode = finalDisciplineName.toUpperCase().replace(/\s+/g, '_');
      finalCategory = uploadForm.category;
    } else if (DISCIPLINE_CATALOG[uploadForm.disciplineChoice]) {
      finalDisciplineName = DISCIPLINE_CATALOG[uploadForm.disciplineChoice].name;
      finalCategory = DISCIPLINE_CATALOG[uploadForm.disciplineChoice].category;
    } else {
      const foundGroup = allDisciplineGroups.find(g => g.code === uploadForm.disciplineChoice);
      if (foundGroup) {
        finalDisciplineName = foundGroup.name;
        finalCategory = foundGroup.category;
      }
    }

    const fileSizeFormatted = uploadedFile.size > 1024 * 1024 
      ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} Mo`
      : `${(uploadedFile.size / 1024).toFixed(0)} Ko`;

    // Si on a un objet File, on crée également une URL blob locale
    const blobUrl = URL.createObjectURL(uploadedFile);

    const newStudy: DisciplineBiomechanicStudy = {
      id: `study-${Date.now()}`,
      disciplineName: finalDisciplineName,
      disciplineCode: finalDisciplineCode,
      category: finalCategory,
      gender: uploadForm.gender,
      competition: uploadForm.competition || 'Compétition Internationale / Nationale',
      year: uploadForm.year || 2024,
      title: uploadForm.title || uploadedFile.name,
      subtitle: uploadForm.institution ? `Étude menée par ${uploadForm.institution}` : 'Rapport scientifique déposé',
      authors: uploadForm.authors ? uploadForm.authors.split(',').map(a => a.trim()) : ['Cellule Scientifique Athlétisme'],
      institution: uploadForm.institution || 'Fédération Française d\'Athlétisme',
      sourcePdfUrl: uploadedFileBase64 || blobUrl,
      pdfFileName: uploadedFile.name,
      pdfFileSize: fileSizeFormatted,
      available: true,
      summary: uploadForm.summary || 'Étude cinématique et biomécanique ajoutée par l\'entraîneur.',
      keyTakeaways: uploadForm.keyTakeaway ? [uploadForm.keyTakeaway] : ['Document officiel téléversé et consultable.']
    };

    setUploadedStudies(prev => [newStudy, ...prev]);
    setSelectedDisciplineCode(finalDisciplineCode);
    setSelectedStudyId(newStudy.id);
    setIsUploadModalOpen(false);

    // Réinitialisation du formulaire
    setUploadedFile(null);
    setUploadedFileBase64('');
    setUploadProgress(0);
    setUploadError('');
    setUploadForm({
      title: '',
      disciplineChoice: 'HAUTEUR',
      customDisciplineName: '',
      category: 'SAUTS',
      gender: 'H',
      competition: '',
      year: 2024,
      authors: '',
      institution: '',
      summary: '',
      keyTakeaway: ''
    });
  };

  // Suppression confirmée depuis la modale in-app
  const handleConfirmDelete = () => {
    if (!studyToDelete) return;
    const id = studyToDelete.id;
    // Supprimer des études personnalisées téléversées
    setUploadedStudies(prev => prev.filter(s => s.id !== id));
    // Masquer l'étude pour les études officielles intégrées
    setHiddenStudyIds(prev => prev.includes(id) ? prev : [...prev, id]);

    if (selectedStudyId === id) {
      setSelectedStudyId('SYNTHESIS');
    }
    setStudyToDelete(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. EN-TÊTE PRINCIPAL DE LA PAGE STATS SHN                    */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Haut Niveau & Sciences du Sport
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Rapports Officiels IAAF / World Athletics
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Activity className="w-7 h-7 text-indigo-400" />
              <span>Statistiques Biomécaniques SHN</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Exploitation des rapports scientifiques officiels de World Athletics (IAAF) et des cellules de recherche en biomécanique. 
              Vitesses d'élan, distances d'impulsion, rythme de foulées, angles d'envol et repères directeurs de haut niveau.
            </p>
          </div>

          {/* Boutons d'action rapides */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 cursor-pointer"
              title="Téléverser une étude biomécanique avec son fichier (PDF, Word, Excel)"
            >
              <FileUp className="w-4 h-4" />
              <span>Ajouter une étude (Upload)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. BARRE DE TRI : FENÊTRE DE TRI DES DISCIPLINES DISPONIBLES   */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Discipline active</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentDisciplineGroup.category}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>{currentDisciplineGroup.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {currentDisciplineStudies.length} {currentDisciplineStudies.length > 1 ? 'études disponibles' : 'étude disponible'}
              </span>
            </h2>
          </div>
        </div>

        {/* Bouton qui ouvre la fenêtre de tri des disciplines disponibles */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setDisciplineSearchTerm('');
              setIsDisciplineFilterModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-white font-bold text-xs sm:text-sm border border-slate-700 hover:border-indigo-500/50 flex items-center gap-2 transition-all cursor-pointer shadow-sm group"
            title="Ouvrir la fenêtre de tri pour changer de discipline"
          >
            <Filter className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Changer de discipline (Fenêtre de tri)</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SÉLECTION DU SEXE ET DES ÉTUDES SUR LA SOUS-PAGE           */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        {/* Barre de filtre par sexe avec décomptes dynamiques */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Sexe :</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setGenderFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  genderFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous ({genderCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('H')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  genderFilter === 'H'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Hommes (H)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  genderFilter === 'H' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {genderCounts.h}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('F')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  genderFilter === 'F'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Femmes (F)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  genderFilter === 'F' ? 'bg-pink-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {genderCounts.f}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('MIXTE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  genderFilter === 'MIXTE'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Mixte</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  genderFilter === 'MIXTE' ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {genderCounts.mixte}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">
              {currentDisciplineStudies.length} {currentDisciplineStudies.length > 1 ? 'rapports affichés' : 'rapport affiché'}
            </span>
            {hiddenStudyIds.length > 0 && (
              <button
                type="button"
                onClick={() => setHiddenStudyIds([])}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                title="Restaurer toutes les études supprimées ou masquées"
              >
                Restaurer les études masquées ({hiddenStudyIds.length})
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Études & Rapports pour {currentDisciplineGroup.name}</span>
          </span>
          <span className="text-[11px] text-slate-400">Sélectionnez une étude ou la synthèse de la discipline</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* OPTION 1 : SYNTHÈSE GLOBALE DE TOUTES LES ÉTUDES DE LA DISCIPLINE */}
          <button
            onClick={() => setSelectedStudyId('SYNTHESIS')}
            className={`px-4 py-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              selectedStudyId === 'SYNTHESIS'
                ? 'bg-gradient-to-r from-indigo-900/60 to-purple-900/50 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-500/30'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${selectedStudyId === 'SYNTHESIS' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400'}`}>
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black">Synthèse globale de la discipline</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Toutes les études ({currentDisciplineStudies.length})
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Vision transversale, repères directeurs, modèles biomécaniques et plages normatives
              </p>
            </div>
          </button>

          {/* OPTION 2..N : ÉTUDES INDIVIDUELLES DISPONIBLES */}
          {currentDisciplineStudies.map((study) => {
            const isSelected = selectedStudyId === study.id;
            const isCustom = study.id.startsWith('study-') || study.id.startsWith('custom-');
            return (
              <div
                key={study.id}
                onClick={() => setSelectedStudyId(study.id)}
                className={`px-4 py-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 flex-1 min-w-[280px] max-w-xl ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs sm:text-sm font-bold truncate">{study.title}</span>
                      {study.gender === 'H' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                          ♂ H
                        </span>
                      )}
                      {study.gender === 'F' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 shrink-0">
                          ♀ F
                        </span>
                      )}
                      {study.gender === 'MIXTE' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          ⚧ Mixte
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {study.competition} ({study.year}) · {study.pdfFileSize}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {study.sourcePdfUrl && (
                    <a
                      href={study.sourcePdfUrl}
                      download={study.pdfFileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                      title={`Télécharger ${study.pdfFileName}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStudyToDelete(study);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={isCustom ? "Supprimer cette étude personnalisée" : "Retirer / masquer cette étude"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {currentDisciplineStudies.length === 0 && (
            <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-center text-slate-400">
              <p className="text-xs font-semibold">Aucune étude disponible pour ce filtre de sexe ({genderFilter === 'H' ? 'Hommes' : genderFilter === 'F' ? 'Femmes' : 'Mixte'}).</p>
              <button
                type="button"
                onClick={() => setGenderFilter('ALL')}
                className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                Afficher toutes les études
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* VUE 1 : SYNTHÈSE GLOBALE DE LA DISCIPLINE                     */}
      {/* ============================================================= */}
      {selectedStudyId === 'SYNTHESIS' && (
        <div className="space-y-6">
          
          {/* Panneau En-tête Synthèse de la discipline */}
          <div className="bg-slate-900/90 rounded-2xl border border-indigo-500/30 p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Synthèse Transversale · {currentDisciplineGroup.name}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                  Repères Directeurs Biomécaniques & Modélisation de Haut Niveau
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  Cette synthèse compile et agrège l'ensemble des études disponibles pour {currentDisciplineGroup.name}. 
                  Elle fournit aux entraîneurs et athlètes les plages normatives de vitesse, de distance d'impulsion, de cadence et d'angulations observées chez les meilleurs mondiaux.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Études compilées</span>
                  <span className="text-2xl font-black text-indigo-400">{currentDisciplineStudies.length}</span>
                </div>
                <div className="w-px h-10 bg-slate-800" />
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Niveau de référence</span>
                  <span className="text-base font-black text-emerald-400">Finales Mondiales</span>
                </div>
              </div>
            </div>

            {/* Grille des Plages Normatives (Benchmarks pour les entraîneurs) */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                <Gauge className="w-4 h-4 text-indigo-400" />
                <span>Plages Normatives & Valeurs Moyennes Internationales ({currentDisciplineGroup.name})</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {activeDisciplineBenchmarks.map((b, idx) => (
                  <div key={idx} className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">{b.label}</span>
                    <span className="text-base sm:text-lg font-black text-amber-300 mt-0.5 block">{b.avg}</span>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span className="truncate">Plage : {b.range}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparatif des 2 Grands Modèles Techniques de la discipline */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Les Deux Grands Modèles Techniques de Haut Niveau ({currentDisciplineGroup.name})</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Modèle A : Vitesse / Élasticité */}
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Modèle 1 · Vitesse & Élasticité</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Ex: Barshim, Bondarenko</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Caractérisé par une vitesse d'approche très rapide (&gt; 7.45 m/s), un contact au sol ultra-bref (&le; 140-160 ms), une quasi-rigidité du genou d'appel (&gt; 136°) et une impulsion lointaine de la barre (1.50m à 1.70m).
                  </p>
                  <div className="pt-2 border-t border-cyan-500/20 flex flex-wrap gap-2 text-[11px] text-cyan-300 font-mono">
                    <span>• Vh: 7.45 - 7.97 m/s</span>
                    <span>• Contact: 140 - 160 ms</span>
                    <span>• TOD: 1.45 - 1.70 m</span>
                  </div>
                </div>

                {/* Modèle B : Force / Puissance */}
                <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">Modèle 2 · Force & Puissance</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">Ex: Lysenko, Ghazal, Rivera</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Caractérisé par une conversion explosive de la vitesse en vitesse verticale pure (taux de transfert &gt; 76%), une flexion articulaire plus marquée au genou (124° à 132°), un angle d'envol plus vertical (&gt; 49-53°) et une impulsion proche de la barre (0.80m à 1.10m).
                  </p>
                  <div className="pt-2 border-t border-orange-500/20 flex flex-wrap gap-2 text-[11px] text-orange-300 font-mono">
                    <span>• Vh: 7.05 - 7.30 m/s</span>
                    <span>• Contact: 170 - 190 ms</span>
                    <span>• TOD: 0.78 - 1.10 m</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Liste des études incluses dans cette synthèse */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Études et Rapports constitutifs de la Synthèse ({currentDisciplineStudies.length})</span>
                </h4>
                <span className="text-[11px] text-slate-400">Cliquez pour consulter une étude complète</span>
              </div>

              <div className="space-y-2.5">
                {currentDisciplineStudies.map((study) => (
                  <div
                    key={study.id}
                    onClick={() => setSelectedStudyId(study.id)}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {study.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {study.year}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {study.institution} · {study.competition}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Consulter l'étude
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================= */}
      {/* VUE 2 : ÉTUDE SPÉCIFIQUE SÉLECTIONNÉE                         */}
      {/* ============================================================= */}
      {selectedStudyId !== 'SYNTHESIS' && currentStudy && (
        <div className="space-y-6">
          
          {/* Fiche d'identité de l'étude active */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {currentStudy.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    {currentStudy.institution} ({currentStudy.year})
                  </span>
                  <span className="text-xs text-slate-400">· {currentStudy.competition}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">{currentStudy.title}</h2>
                <p className="text-xs text-indigo-300 font-medium mt-0.5">{currentStudy.subtitle}</p>
              </div>

              {/* Bouton de téléchargement du fichier réel */}
              <div className="flex items-center gap-2 shrink-0">
                {currentStudy.sourcePdfUrl && (
                  <a
                    href={currentStudy.sourcePdfUrl}
                    download={currentStudy.pdfFileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow cursor-pointer"
                    title={`Télécharger le document d'origine (${currentStudy.pdfFileName})`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger ({currentStudy.pdfFileSize})</span>
                  </a>
                )}
                <button
                  onClick={() => setSelectedStudyId('SYNTHESIS')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  ← Retour à la Synthèse
                </button>
              </div>
            </div>

            {/* Synthèse du document */}
            <div className="mt-4 bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
              <p><strong className="text-indigo-300">Synthèse du document : </strong>{currentStudy.summary}</p>
            </div>

            {/* Enseignements clés de l'étude */}
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enseignements clés de cette étude</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {currentStudy.keyTakeaways.map((takeaway, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{takeaway}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Si l'étude possède des données cinématiques détaillées par athlète (ex: Rapport IAAF Londres 2017) */}
          {currentStudy.athletesData && currentStudy.athletesData.length > 0 ? (
            <div className="space-y-6">
              
              {/* Sous-navigation intérieure à l'étude */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveSubTab('simulator')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeSubTab === 'simulator'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Gauge className="w-4 h-4" />
                    <span>Simulateur par Hauteur & Athlète</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('diagrams')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeSubTab === 'diagrams'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Schémas & Graphiques Techniques (IAAF)</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('table')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeSubTab === 'table'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Tableau Complet des 10 Finalistes</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('coach_guide')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeSubTab === 'coach_guide'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Guide Méthodologique Entraîneur</span>
                  </button>
                </div>

                {/* Filtre de modèle technique */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Modèle :
                  </span>
                  <button
                    onClick={() => setModelFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      modelFilter === 'ALL'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tous (10)
                  </button>
                  <button
                    onClick={() => setModelFilter('VITESSE_ELASTICITE')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      modelFilter === 'VITESSE_ELASTICITE'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-cyan-300'
                    }`}
                  >
                    Vitesse
                  </button>
                  <button
                    onClick={() => setModelFilter('FORCE_PUISSANCE')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      modelFilter === 'FORCE_PUISSANCE'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                        : 'text-slate-400 hover:text-orange-300'
                    }`}
                  >
                    Force
                  </button>
                </div>
              </div>

              {/* --------------------------------------------------- */}
              {/* SOUS-ONGLET 1 : SIMULATEUR PAR HAUTEUR & ATHLÈTE    */}
              {/* --------------------------------------------------- */}
              {activeSubTab === 'simulator' && (
                <div className="space-y-6">
                  
                  {/* Sélecteur d'athlète et de hauteur */}
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-indigo-400" />
                          <span>Sélectionnez un sauteur ou une hauteur de référence</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Vitesse d'approche, distance d'impulsion, rythme de foulées et temps d'appui au sol.
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Modèle technique :</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          currentAthlete.modelStyle === 'VITESSE_ELASTICITE' 
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' 
                            : currentAthlete.modelStyle === 'FORCE_PUISSANCE'
                            ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                        }`}>
                          {currentAthlete.modelStyle === 'VITESSE_ELASTICITE' ? 'Vitesse & Élasticité' : currentAthlete.modelStyle === 'FORCE_PUISSANCE' ? 'Force & Puissance' : 'Mixte'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      {athletes.map((ath, idx) => {
                        const isSelected = ath.athlete === currentAthlete.athlete;
                        return (
                          <button
                            key={`${ath.athlete}-${ath.rank}-${idx}`}
                            onClick={() => {
                              setSelectedAthleteName(ath.athlete);
                              setSelectedAthleteRank(ath.rank);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-gradient-to-br from-indigo-950/70 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 text-white shadow-md'
                                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-xs font-bold truncate">{ath.athlete}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{ath.country}</span>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-lg font-black text-white">{ath.mark.toFixed(2)} m</span>
                              <span className="text-[10px] text-slate-400">Taille: {ath.stature}m</span>
                            </div>
                            <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                              <span>Rang #{ath.rank}</span>
                              <span className="font-semibold text-indigo-300">{ath.vhTakeOffTD} m/s</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CARTE DÉTAILLÉE : LES 4 GRANDS REPÈRES POUR LE SAUTEUR */}
                  <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 p-5 sm:p-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          Fiche Cinématique Personnalisée · {currentAthlete.mark.toFixed(2)} m
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                          {currentAthlete.athlete} ({currentAthlete.country})
                        </h3>
                        <p className="text-xs text-slate-300 mt-1">
                          Pied d'appel : <strong>{currentAthlete.takeOffFoot === 'LEFT' ? 'Pied Gauche' : 'Pied Droit'}</strong> · 
                          Taille : <strong>{currentAthlete.stature.toFixed(2)} m</strong> · 
                          Record personnel : <strong>{currentAthlete.personalBest.toFixed(2)} m</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase block">Hauteur franchie</span>
                          <span className="text-2xl font-black text-indigo-400">{currentAthlete.mark.toFixed(2)} m</span>
                        </div>
                        <div className="w-px h-10 bg-slate-800" />
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase">Pic Max du CM (H3)</span>
                          <span className="text-2xl font-black text-emerald-400">{currentAthlete.h3.toFixed(2)} m</span>
                        </div>
                      </div>
                    </div>

                    {/* Grille des 4 indicateurs majeurs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                      
                      {/* 1. Vitesse d'arrivée à l'impulsion (Vh) */}
                      <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>Vitesse d'arrivée</span>
                          </span>
                          <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {(currentAthlete.vhTakeOffTD * 3.6).toFixed(1)} km/h
                          </span>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-white">{currentAthlete.vhTakeOffTD.toFixed(2)}</span>
                          <span className="text-xs text-slate-400 font-bold">m/s</span>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>7.05 m/s (min)</span>
                            <span className="font-semibold text-slate-300">Moy. 7.48 m/s</span>
                            <span>7.97 m/s (max)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, ((currentAthlete.vhTakeOffTD - 7.0) / (8.0 - 7.0)) * 100))}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                          Vitesse horizontale résiduelle à l'envol : <strong>{currentAthlete.vhTakeOffTO.toFixed(2)} m/s</strong> (perte de {Math.abs(currentAthlete.deltaVhPercent).toFixed(1)}%).
                        </p>
                      </div>

                      {/* 2. Distance d'impulsion à la barre (TOD) */}
                      <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-cyan-400" />
                            <span>Distance d'appel</span>
                          </span>
                          <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/20">
                            Pied ➔ Barre
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-white">{currentAthlete.takeOffDistance.toFixed(2)}</span>
                          <span className="text-xs text-slate-400 font-bold">mètres</span>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>0.78 m (Lysenko)</span>
                            <span className="font-semibold text-slate-300">Moy. 1.20 m</span>
                            <span>1.70 m (Bondarenko)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, ((currentAthlete.takeOffDistance - 0.70) / (1.75 - 0.70)) * 100))}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                          {currentAthlete.takeOffDistance > 1.40 
                            ? 'Appel lointain : adapté aux grandes vitesses d’élan pour laisser au corps le temps de monter.'
                            : 'Appel rapproché : exige une conversion verticale ultra-puissante et un angle de décollage élevé.'}
                        </p>
                      </div>

                      {/* 3. Taille des 3 dernières foulées */}
                      <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span>3 Dernières Foulées</span>
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {currentAthlete.stepPattern === 'LONG_COURT' ? 'Long ➔ Court' : 'Court ➔ Long'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">1. Antépénultième :</span>
                            <span className="font-mono font-bold text-white">{currentAthlete.step1Length.toFixed(2)} m <span className="text-[10px] text-slate-400">({currentAthlete.step1LengthPercent.toFixed(0)}%)</span></span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">2. Pénultième :</span>
                            <span className="font-mono font-bold text-indigo-300">{currentAthlete.step2Length.toFixed(2)} m <span className="text-[10px] text-slate-400">({currentAthlete.step2LengthPercent.toFixed(0)}%)</span></span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">3. Dernière foulée (appel) :</span>
                            <span className="font-mono font-bold text-emerald-300">{currentAthlete.step3Length.toFixed(2)} m <span className="text-[10px] text-slate-400">({currentAthlete.step3LengthPercent.toFixed(0)}%)</span></span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 leading-relaxed">
                          {currentAthlete.stepPattern === 'LONG_COURT' 
                            ? 'Schéma Long/Court : accélération de cadence sur la dernière foulée.' 
                            : 'Schéma Court/Long : allongement pour préparer l’abaissement du centre de masse.'}
                        </p>
                      </div>

                      {/* 4. Temps d'impulsion au sol & Marge */}
                      <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Timer className="w-4 h-4 text-purple-400" />
                            <span>Temps d'impulsion</span>
                          </span>
                          <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
                            Contact Sol
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-white">{(currentAthlete.takeOffContactTime * 1000).toFixed(0)}</span>
                          <span className="text-xs text-slate-400 font-bold">ms</span>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>140 ms (Barshim)</span>
                            <span className="font-semibold text-slate-300">Moy. 165 ms</span>
                            <span>190 ms (Ghazal)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, ((currentAthlete.takeOffContactTime - 0.13) / (0.20 - 0.13)) * 100))}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                          Angle d'envol : <strong>{currentAthlete.takeOffAngle}°</strong> · 
                          Marge au-dessus de la barre : <strong className="text-emerald-400">+{(currentAthlete.h3Diff * 100).toFixed(0)} cm</strong>.
                        </p>
                      </div>

                    </div>

                    {/* Métriques secondaires */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
                      <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Flexion min. Genou d'appel</span>
                        <span className="text-base font-bold text-white">{currentAthlete.kneeFlexionLowest}°</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Ampli: {currentAthlete.kneeRangeOfMotion}°</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Angle trajectoire / barre</span>
                        <span className="text-base font-bold text-indigo-300">{currentAthlete.stepToBarAngleFinal.toFixed(1)}°</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Moyenne élite: 31.7°</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Inclinaison arrière (TD)</span>
                        <span className="text-base font-bold text-cyan-300">{currentAthlete.wholeBodyLeanTD}°</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Tronc: {currentAthlete.trunkLeanTD}°</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Transfert cinématique</span>
                        <span className="text-base font-bold text-emerald-300">{currentAthlete.velocityTransferPercent.toFixed(1)}%</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Vv: {currentAthlete.vvTO.toFixed(2)} m/s</span>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* --------------------------------------------------- */}
              {/* SOUS-ONGLET 2 : SCHÉMAS ET GRAPHIQUES TECHNIQUES   */}
              {/* --------------------------------------------------- */}
              {activeSubTab === 'diagrams' && (
                <div className="space-y-6">
                  
                  {/* SCHÉMA 1 : VUE DE DESSUS DE LA COURSE D'ÉLAN */}
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                            Figure Cinématique 1 · Modèle Biomécanique Officiel (IAAF / FFA)
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            Modèle Cercle & Tangente (Course en « J »)
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-white">
                          Géométrie de la Course d'Élan en Courbe (Fosbury Flop)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Conforme aux schémas de référence : course rectiligne d'accélération (L), rayon de courbure (R) depuis le centre du cercle, transition au début de la phase curviligne, et impulsion au poteau.
                        </p>
                      </div>

                      {/* Sélecteur de côté de course d'élan (Droite / Gauche) */}
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start lg:self-center">
                        <span className="text-[11px] font-semibold text-slate-400 px-2">Côté d'élan :</span>
                        <button
                          type="button"
                          onClick={() => setApproachSide('RIGHT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            approachSide === 'RIGHT'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Élan à droite (ex: Barshim)
                        </button>
                        <button
                          type="button"
                          onClick={() => setApproachSide('LEFT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            approachSide === 'LEFT'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Élan à gauche
                        </button>
                      </div>
                    </div>

                    {/* SVG Haute Fidélité : Reproduction fidèle des schémas de référence (Courbe & courbe2) */}
                    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col items-center overflow-x-auto">
                      {(() => {
                        const isRight = approachSide === 'RIGHT';
                        const canvasWidth = 940;
                        const canvasHeight = 670;
                        const barY = 135;

                        // Centre géométrique de symétrie du sautoir
                        const midX = 470;

                        // DIMENSIONS RÉDUITES DU TAPIS ET DE LA BARRE (Proportionnels et conformes aux schémas)
                        // Poteau côté élan positionné à proximité immédiate du 1er appui (Impulsion)
                        const postLeftX = 350;
                        const postRightX = 590;
                        const matWidth = 280;
                        const matHeight = 105;
                        const matX = midX - matWidth / 2; // 330
                        const matY = 25;

                        // GÉOMÉTRIE DU MODÈLE CERCLE & TANGENTE (Courbe_2d747bc1.png) :
                        // Rayon R du cercle (en px)
                        const R = 370;
                        
                        // Pour élan à droite :
                        // Ligne droite rectiligne à x = 740
                        // Centre du cercle à (xCenter = 740 - R = 370, yCenter = 490)
                        const baseStraightX = 740;
                        const baseCenterY = 490;
                        const baseCenterX = baseStraightX - R; // 370

                        const straightX = isRight ? baseStraightX : (2 * midX - baseStraightX);
                        const centerX = isRight ? baseCenterX : (2 * midX - baseCenterX);
                        const centerY = baseCenterY;

                        // Angle de l'arc circulaire (de 0° à thetaImpulsion = 57°)
                        const totalArcDeg = 57;
                        const angles = [0, totalArcDeg * 0.25, totalArcDeg * 0.5, totalArcDeg * 0.75, totalArcDeg]; // 5, 4, 3, 2, 1

                        const getPoint = (deg: number) => {
                          const rad = (deg * Math.PI) / 180;
                          const rawX = baseCenterX + R * Math.cos(rad);
                          const x = isRight ? rawX : (2 * midX - rawX);
                          const y = baseCenterY - R * Math.sin(rad);
                          return { x, y, deg };
                        };

                        const pt5 = getPoint(angles[0]); // Début de la phase curviligne (Appui 5, theta = 0°)
                        const pt4 = getPoint(angles[1]); // Appui 4
                        const pt3 = getPoint(angles[2]); // Appui 3 (Antépénultième)
                        const pt2 = getPoint(angles[3]); // Appui 2 (Pénultième)
                        const pt1 = getPoint(angles[4]); // Impulsion (Appui 1, theta = 57°)

                        // Trajectoire en arc de cercle pur
                        const arcSweepFlag = isRight ? 0 : 1;
                        const arcPath = `M ${pt5.x.toFixed(1)} ${pt5.y.toFixed(1)} A ${R} ${R} 0 0 ${arcSweepFlag} ${pt1.x.toFixed(1)} ${pt1.y.toFixed(1)}`;

                        // Ligne droite initiale (Longueur L)
                        const straightStartY = 640;

                        // Trajectoire aérienne du Centre de Masse (CM)
                        const peakCmX = isRight ? 490 : 450;
                        const landX = isRight ? 440 : 500;
                        const landY = 70;

                        // Orientation du pied d'impulsion
                        const impulsionFootAngle = isRight ? -totalArcDeg : totalArcDeg;

                        return (
                          <div className="w-full flex flex-col items-center">
                            <svg viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} className="w-full max-w-4xl h-auto select-none">
                              <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                                </pattern>
                                <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                                  <path d="M 0 0 L 8 4 L 0 8 Z" fill="#94a3b8" />
                                </marker>
                                <marker id="arrowHeadBlue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                                  <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                                </marker>
                                <marker id="arrowHeadRose" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                                  <path d="M 0 0 L 8 4 L 0 8 Z" fill="#f43f5e" />
                                </marker>
                                <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur stdDeviation="4" result="blur" />
                                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>

                                {/* Empreinte de pied d'athlétisme avec pointes */}
                                <g id="footprintLeft">
                                  <path 
                                    d="M -4 -11 C -1 -12, 3 -12, 5 -10 C 6 -7, 5 -2, 3 4 C 2 7, 1 11, -1 11 C -4 11, -5 8, -5 4 C -6 -1, -6 -9, -4 -11 Z" 
                                    fill="#38bdf8" 
                                    stroke="#ffffff" 
                                    strokeWidth="1.2" 
                                  />
                                  <circle cx="-1" cy="-7" r="1.2" fill="#fff" />
                                  <circle cx="2" cy="-7" r="1.2" fill="#fff" />
                                  <circle cx="0" cy="-3" r="1.2" fill="#fff" />
                                </g>
                                <g id="footprintRight">
                                  <path 
                                    d="M 4 -11 C 1 -12, -3 -12, -5 -10 C -6 -7, -5 -2, -3 4 C -2 7, -1 11, 1 11 C 4 11, 5 8, 5 4 C 6 -1, 6 -9, 4 -11 Z" 
                                    fill="#818cf8" 
                                    stroke="#ffffff" 
                                    strokeWidth="1.2" 
                                  />
                                  <circle cx="1" cy="-7" r="1.2" fill="#fff" />
                                  <circle cx="-2" cy="-7" r="1.2" fill="#fff" />
                                  <circle cx="0" cy="-3" r="1.2" fill="#fff" />
                                </g>
                              </defs>
                              
                              <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />

                              {/* ZONE DU SAUTOIR : TAPIS DE RÉCEPTION RÉDUIT (Proportions exactes) */}
                              <rect x={matX} y={matY} width={matWidth} height={matHeight} rx="8" fill="#1e1b4b" stroke="#4338ca" strokeWidth="2" />
                              <text x={midX} y={55} textAnchor="middle" fill="#a5b4fc" fontSize="12" fontWeight="bold">
                                Tapis de réception (6 m × 4 m)
                              </text>
                              <text x={midX} y={75} textAnchor="middle" fill="#6366f1" fontSize="10">
                                Zone d'atterrissage dorsale au centre du tapis
                              </text>

                              {/* BARRE DU SAUT EN HAUTEUR ET POTEAUX */}
                              <line x1={postLeftX} y1={barY} x2={postRightX} y2={barY} stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                              
                              {/* Poteau Gauche */}
                              <circle cx={postLeftX} cy={barY} r="8" fill={!isRight ? "#f43f5e" : "#dc2626"} stroke="#fff" strokeWidth="2.5" />
                              <text x={postLeftX} y={barY - 14} textAnchor="middle" fill={!isRight ? "#fb7185" : "#94a3b8"} fontSize="10" fontWeight="bold">
                                {!isRight ? "Montant gauche (Côté élan)" : "Montant gauche"}
                              </text>

                              {/* Poteau Droit */}
                              <circle cx={postRightX} cy={barY} r="8" fill={isRight ? "#f43f5e" : "#dc2626"} stroke="#fff" strokeWidth="2.5" />
                              <text x={postRightX} y={barY - 14} textAnchor="middle" fill={isRight ? "#fb7185" : "#94a3b8"} fontSize="10" fontWeight="bold">
                                {isRight ? "Montant droit (Côté élan)" : "Montant droit"}
                              </text>

                              {/* Flèche vers le montant côté élan (comme dans courbe2_2c2cb22f.jpg) */}
                              <line 
                                x1={isRight ? postRightX + 45 : postLeftX - 45} 
                                y1={barY} 
                                x2={isRight ? postRightX + 14 : postLeftX - 14} 
                                y2={barY} 
                                stroke={isRight ? "#fb7185" : "#38bdf8"} 
                                strokeWidth="2" 
                                markerEnd={isRight ? "url(#arrowHeadRose)" : "url(#arrowHeadBlue)"} 
                              />
                              <text 
                                x={isRight ? postRightX + 52 : postLeftX - 52} 
                                y={barY + 4} 
                                textAnchor={isRight ? "start" : "end"} 
                                fill={isRight ? "#fb7185" : "#38bdf8"} 
                                fontSize="11" 
                                fontWeight="bold"
                              >
                                {isRight ? "Montant droit" : "Montant gauche"}
                              </text>

                              {/* Libellé Barre */}
                              <text x={isRight ? postLeftX + 55 : postRightX - 55} y={barY - 8} textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="bold">
                                BARRE : {currentAthlete.mark.toFixed(2)} m
                              </text>

                              {/* ========================================================= */}
                              {/* GÉOMÉTRIE DU CERCLE : CENTRE ET RAYONS (Courbe_2d747bc1) */}
                              {/* ========================================================= */}
                              
                              {/* Centre du cercle */}
                              <circle cx={centerX} cy={centerY} r="6" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
                              <line 
                                x1={centerX} 
                                y1={centerY + 30} 
                                x2={centerX} 
                                y2={centerY + 10} 
                                stroke="#f59e0b" 
                                strokeWidth="1.5" 
                                markerEnd="url(#arrowHead)" 
                              />
                              <text 
                                x={centerX} 
                                y={centerY + 45} 
                                textAnchor="middle" 
                                fill="#fbbf24" 
                                fontSize="11" 
                                fontWeight="bold"
                              >
                                Centre du cercle
                              </text>

                              {/* Rayon horizontal vers le début de la phase curviligne */}
                              <line 
                                x1={centerX} 
                                y1={centerY} 
                                x2={pt5.x} 
                                y2={pt5.y} 
                                stroke="#f59e0b" 
                                strokeWidth="2" 
                                strokeDasharray="5 4" 
                              />
                              <text 
                                x={(centerX + pt5.x) / 2} 
                                y={centerY - 10} 
                                textAnchor="middle" 
                                fill="#fbbf24" 
                                fontSize="11" 
                                fontWeight="bold"
                              >
                                Rayon (R) du cercle (~8 m)
                              </text>

                              {/* Rayon oblique vers l'Impulsion */}
                              <line 
                                x1={centerX} 
                                y1={centerY} 
                                x2={pt1.x} 
                                y2={pt1.y} 
                                stroke="#f59e0b" 
                                strokeWidth="2" 
                                strokeDasharray="5 4" 
                              />
                              <text 
                                x={(centerX + pt1.x) / 2 - (isRight ? 25 : -25)} 
                                y={(centerY + pt1.y) / 2 - 10} 
                                textAnchor={isRight ? "end" : "start"} 
                                fill="#fbbf24" 
                                fontSize="11" 
                                fontWeight="bold"
                              >
                                Rayon (R) du cercle
                              </text>

                              {/* ========================================================= */}
                              {/* 1. COURSE RECTILIGNE INITIALE (Ligne droite L)            */}
                              {/* ========================================================= */}
                              <line 
                                x1={straightX} 
                                y1={straightStartY} 
                                x2={pt5.x} 
                                y2={pt5.y} 
                                stroke="#64748b" 
                                strokeWidth="3" 
                              />
                              
                              {/* Empreintes droites le long de la ligne droite */}
                              <use href="#footprintRight" x={straightX} y={620} />
                              <use href="#footprintLeft" x={straightX} y={575} />
                              <use href="#footprintRight" x={straightX} y={530} />

                              {/* Flèche de cote L pour la course rectiligne */}
                              <line 
                                x1={isRight ? straightX + 35 : straightX - 35} 
                                y1={straightStartY} 
                                x2={isRight ? straightX + 35 : straightX - 35} 
                                y2={pt5.y} 
                                stroke="#94a3b8" 
                                strokeWidth="1.5" 
                                markerStart="url(#arrowHead)" 
                                markerEnd="url(#arrowHead)" 
                              />
                              <text 
                                x={isRight ? straightX + 50 : straightX - 50} 
                                y={(straightStartY + pt5.y) / 2} 
                                textAnchor={isRight ? "start" : "end"} 
                                fill="#94a3b8" 
                                fontSize="11" 
                                fontWeight="bold"
                              >
                                L (Course rectiligne : 6 à 9 m)
                              </text>

                              {/* Début de la course d'élan */}
                              <text 
                                x={isRight ? straightX + 15 : straightX - 15} 
                                y={straightStartY + 15} 
                                textAnchor={isRight ? "start" : "end"} 
                                fill="#cbd5e1" 
                                fontSize="11" 
                                fontWeight="bold"
                              >
                                Début de la course d'élan
                              </text>

                              {/* Repère d'axes comme dans Courbe_2d747bc1.png */}
                              <g transform={`translate(${isRight ? straightX - 35 : straightX + 35}, ${straightStartY - 10})`}>
                                <line x1="0" y1="0" x2="0" y2="-28" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrowHead)" />
                                <line x1="0" y1="0" x2={isRight ? "-25" : "25"} y2="0" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrowHead)" />
                                <text x="0" y="-33" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="bold">x</text>
                                <text x={isRight ? "-30" : "30"} y="3" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="bold">y</text>
                              </g>

                              {/* ========================================================= */}
                              {/* 2. DÉBUT DE LA PHASE CURVILIGNE (Appui 5)                 */}
                              {/* ========================================================= */}
                              <line 
                                x1={isRight ? pt5.x + 85 : pt5.x - 85} 
                                y1={pt5.y} 
                                x2={isRight ? pt5.x + 15 : pt5.x - 15} 
                                y2={pt5.y} 
                                stroke="#38bdf8" 
                                strokeWidth="2" 
                                markerEnd="url(#arrowHeadBlue)" 
                              />
                              <text 
                                x={isRight ? pt5.x + 95 : pt5.x - 95} 
                                y={pt5.y + 4} 
                                textAnchor={isRight ? "start" : "end"} 
                                fill="#38bdf8" 
                                fontSize="11" 
                                fontWeight="bold"
                              >
                                Début de la phase curviligne
                              </text>

                              {/* ========================================================= */}
                              {/* 3. L'ARC CIRCULAIRE PUR (Phase curviligne - Courbe en J)  */}
                              {/* ========================================================= */}
                              <path 
                                d={arcPath} 
                                fill="none" 
                                stroke="#38bdf8" 
                                strokeWidth="4.5" 
                                strokeDasharray="6 4" 
                              />

                              {/* Libellé "3 ou 5 dernières foulées en courbe" (comme dans courbe2) */}
                              <text 
                                x={isRight ? pt3.x - 30 : pt3.x + 30} 
                                y={pt3.y - 30} 
                                textAnchor={isRight ? "end" : "start"} 
                                fill="#818cf8" 
                                fontSize="11" 
                                fontWeight="bold"
                              >
                                3 ou 5 dernières foulées en courbe
                              </text>

                              {/* ========================================================= */}
                              {/* LES 5 APPUIS ORIENTÉS SELON LA TANGENTE DU CERCLE         */}
                              {/* ========================================================= */}
                              
                              {/* Appui 5 (Début phase curviligne) */}
                              <g transform={`translate(${pt5.x}, ${pt5.y})`}>
                                <use href="#footprintLeft" />
                                <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                                <text x="0" y="3.5" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">5</text>
                              </g>

                              {/* Appui 4 */}
                              <g transform={`translate(${pt4.x}, ${pt4.y}) rotate(${isRight ? -14.5 : 14.5})`}>
                                <use href="#footprintRight" />
                                <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
                                <text x="0" y="3.5" textAnchor="middle" fill="#a5b4fc" fontSize="10" fontWeight="bold">4</text>
                              </g>
                              <text 
                                x={isRight ? pt4.x + 18 : pt4.x - 18} 
                                y={pt4.y + 4} 
                                textAnchor={isRight ? "start" : "end"} 
                                fill="#a5b4fc" 
                                fontSize="10" 
                                fontWeight="bold"
                              >
                                4e appui
                              </text>

                              {/* Appui 3 (Antépénultième) */}
                              <g transform={`translate(${pt3.x}, ${pt3.y}) rotate(${isRight ? -29 : 29})`}>
                                <use href="#footprintLeft" />
                                <circle cx="0" cy="0" r="11" fill="#0f172a" stroke="#818cf8" strokeWidth="2.5" />
                                <text x="0" y="3.5" textAnchor="middle" fill="#818cf8" fontSize="10" fontWeight="black">3</text>
                              </g>
                              <text 
                                x={isRight ? pt3.x + 20 : pt3.x - 20} 
                                y={pt3.y + 4} 
                                textAnchor={isRight ? "start" : "end"} 
                                fill="#c7d2fe" 
                                fontSize="10" 
                                fontWeight="bold"
                              >
                                3e appui
                              </text>

                              {/* Appui 2 (Pénultième) */}
                              <g transform={`translate(${pt2.x}, ${pt2.y}) rotate(${isRight ? -43.5 : 43.5})`}>
                                <use href="#footprintRight" />
                                <circle cx="0" cy="0" r="11" fill="#0f172a" stroke="#a855f7" strokeWidth="2.5" />
                                <text x="0" y="3.5" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="black">2</text>
                              </g>
                              <text 
                                x={isRight ? pt2.x + 20 : pt2.x - 20} 
                                y={pt2.y - 8} 
                                textAnchor={isRight ? "start" : "end"} 
                                fill="#e9d5ff" 
                                fontSize="10" 
                                fontWeight="bold"
                              >
                                2e appui (Pénultième)
                              </text>

                              {/* ========================================================= */}
                              {/* 4. IMPULSION (Appui 1 · Appel au montant)                 */}
                              {/* ========================================================= */}
                              <g transform={`translate(${pt1.x}, ${pt1.y}) rotate(${impulsionFootAngle})`}>
                                <use href="#footprintLeft" />
                                <circle cx="0" cy="0" r="12" fill="#0f172a" stroke="#f43f5e" strokeWidth="2.5" />
                                <text x="0" y="3.5" textAnchor="middle" fill="#fb7185" fontSize="11" fontWeight="black">1</text>
                              </g>

                              {/* Flèche pointant l'Impulsion (comme dans Courbe_2d747bc1.png) */}
                              <line 
                                x1={isRight ? pt1.x + 70 : pt1.x - 70} 
                                y1={pt1.y} 
                                x2={isRight ? pt1.x + 18 : pt1.x - 18} 
                                y2={pt1.y} 
                                stroke="#f43f5e" 
                                strokeWidth="2" 
                                markerEnd="url(#arrowHeadRose)" 
                              />
                              <text 
                                x={isRight ? pt1.x + 80 : pt1.x - 80} 
                                y={pt1.y + 4} 
                                textAnchor={isRight ? "start" : "end"} 
                                fill="#fb7185" 
                                fontSize="12" 
                                fontWeight="black"
                              >
                                Impulsion
                              </text>
                              <text 
                                x={pt1.x} 
                                y={pt1.y + 35} 
                                textAnchor="middle" 
                                fill="#94a3b8" 
                                fontSize="9" 
                                fontWeight="semibold"
                              >
                                TOD = {currentAthlete.takeOffDistance.toFixed(2)} m · Angle = {currentAthlete.stepToBarAngleFinal.toFixed(1)}°
                              </text>

                              {/* ========================================================= */}
                              {/* 5. TRAJECTOIRE AÉRIENNE DU CENTRE DE MASSE (CM)           */}
                              {/* ========================================================= */}
                              <path 
                                d={isRight
                                  ? `M ${pt1.x} ${pt1.y} Q ${pt1.x - 30} ${barY + 15} ${peakCmX} ${barY} Q ${peakCmX - 25} ${barY - 30} ${landX} ${landY}`
                                  : `M ${pt1.x} ${pt1.y} Q ${pt1.x + 30} ${barY + 15} ${peakCmX} ${barY} Q ${peakCmX + 25} ${barY - 30} ${landX} ${landY}`
                                } 
                                fill="none" 
                                stroke="#f59e0b" 
                                strokeWidth="3" 
                                strokeDasharray="5 4" 
                              />
                              
                              {/* POINT CULMINANT : APOGÉE DU CM EXACTEMENT AU-DESSUS DE LA BARRE */}
                              <circle cx={peakCmX} cy={barY} r="12" fill="#f59e0b" fillOpacity="0.3" filter="url(#glowGold)" />
                              <circle cx={peakCmX} cy={barY} r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                              
                              {/* Étiquette Apogée au-dessus de la barre */}
                              <g transform={`translate(${peakCmX}, ${barY - 26})`}>
                                <rect x="-95" y="-12" width="190" height="24" rx="5" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="1.5" />
                                <text x="0" y="3" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">
                                  Apogée CM au-dessus de la barre
                                </text>
                              </g>
                              <text x={peakCmX} y={barY - 44} textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">
                                H3 = {currentAthlete.h3.toFixed(2)} m (+{(currentAthlete.h3Diff * 100).toFixed(0)} cm de marge)
                              </text>

                              {/* Point de réception */}
                              <circle cx={landX} cy={landY} r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                              <text x={landX} y={landY - 12} textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="bold">
                                Réception dos
                              </text>
                            </svg>

                            {/* BARRE SYNTHÉTIQUE DES FOULÉES ET MESURES */}
                            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800 text-xs">
                              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block truncate">Foulée n-2 (Appui 4 ➔ 3)</span>
                                <span className="text-sm font-black text-indigo-300">{currentAthlete.step1Length.toFixed(2)} m</span>
                                <span className="text-[10px] text-slate-400 block">{currentAthlete.step1LengthPercent.toFixed(0)}% taille</span>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block truncate">Foulée pénultième (3 ➔ 2)</span>
                                <span className="text-sm font-black text-purple-300">{currentAthlete.step2Length.toFixed(2)} m</span>
                                <span className="text-[10px] text-slate-400 block">{currentAthlete.step2LengthPercent.toFixed(0)}% taille</span>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block truncate">Dernière foulée (2 ➔ Appel)</span>
                                <span className="text-sm font-black text-rose-300">{currentAthlete.step3Length.toFixed(2)} m</span>
                                <span className="text-[10px] text-slate-400 block">{currentAthlete.step3LengthPercent.toFixed(0)}% taille</span>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                                <span className="text-[10px] text-slate-400 block truncate">Distance d'appel TOD</span>
                                <span className="text-sm font-black text-cyan-300">{currentAthlete.takeOffDistance.toFixed(2)} m</span>
                                <span className="text-[10px] text-slate-400 block">Angle : {currentAthlete.stepToBarAngleFinal.toFixed(1)}°</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* RAPPEL PÉDAGOGIQUE ET TERMINOLOGIQUE POUR LES ENTRAÎNEURS */}
                    <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2.5">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>Rappel Terminologique & Principes Biomécaniques (Normes FFA / IAAF) :</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-slate-300 text-[11px] leading-relaxed">
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                          <span className="font-bold text-white block mb-0.5">1. Course Rectiligne au Départ</span>
                          L'élan débute par une <strong>ligne droite d'accélération</strong> (redressement du buste, montée progressive en vitesse horizontale).
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                          <span className="font-bold text-white block mb-0.5">2. Partie Curviligne (5 derniers appuis)</span>
                          La transition en virage s'effectue sur les <strong>5 derniers appuis</strong> (création de l'inclinaison centripète et préparation de l'impulsion).
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                          <span className="font-bold text-white block mb-0.5">3. Appel au Poteau (1er appui)</span>
                          L'impulsion a lieu <strong>à proximité immédiate du poteau côté élan</strong> (~1m à 1.5m), orientant la trajectoire en diagonale vers le tapis.
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                          <span className="font-bold text-white block mb-0.5">4. Apogée CM au-dessus de la Barre</span>
                          Le sommet de la trajectoire balistique ($H_3$) est atteint <strong>exactement au-dessus de la barre</strong> lors de l'esquive dorsale.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SCHÉMA 2 : DÉCOMPOSITION DES 3 HAUTEURS PARTIELLES (H1, H2, H3) */}
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
                    <div className="mb-4">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Modélisation Scientifique · Formule de Hay
                      </span>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        Décomposition de la Hauteur Franchie ($H = H_1 + H_2 + H_3$)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Chaque centimètre d'un saut de haut niveau se décompose en 3 hauteurs partielles du centre de masse (CM).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-sky-400 uppercase">H1 · Touchdown (Poser)</span>
                          <span className="text-xs font-mono font-bold text-white">{currentAthlete.h1.toFixed(2)} m</span>
                        </div>
                        <div className="text-2xl font-black text-white">{currentAthlete.h1Percent.toFixed(1)}% <span className="text-xs font-normal text-slate-400">de sa taille</span></div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          Hauteur du centre de gravité au moment où le pied d'appel touche la piste.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-indigo-400 uppercase">H2 · Toe-off (Envol)</span>
                          <span className="text-xs font-mono font-bold text-white">{currentAthlete.h2.toFixed(2)} m</span>
                        </div>
                        <div className="text-2xl font-black text-white">{currentAthlete.h2Percent.toFixed(1)}% <span className="text-xs font-normal text-slate-400">de sa taille</span></div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          Hauteur du CM quand le pied quitte le sol. Le gain ($H_2 - H_1$) mesure l'extension corporelle active.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-400 uppercase">H3 · Sommet balistique</span>
                          <span className="text-xs font-mono font-bold text-white">{currentAthlete.h3.toFixed(2)} m</span>
                        </div>
                        <div className="text-2xl font-black text-white">{currentAthlete.h3Percent.toFixed(1)}% <span className="text-xs font-normal text-slate-400">de sa taille</span></div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          Point culminant atteint par le CM en l'air (marge de <strong>+{(currentAthlete.h3Diff * 100).toFixed(0)} cm</strong>).
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* --------------------------------------------------- */}
              {/* SOUS-ONGLET 3 : TABLEAU COMPLET DES FINALISTES      */}
              {/* --------------------------------------------------- */}
              {activeSubTab === 'table' && (
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                        <span>Tableau Cinématique Exhaustif · Finale Mondiale</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Regroupement des mesures 3D à 120 Hz (SIMI Motion).
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">{athletes.length} athlètes affichés</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <th className="py-2.5 px-3 font-bold">Rang</th>
                          <th className="py-2.5 px-3 font-bold">Athlète</th>
                          <th className="py-2.5 px-3 font-bold">Pays</th>
                          <th className="py-2.5 px-3 font-bold text-right">Marque</th>
                          <th className="py-2.5 px-3 font-bold text-right">Taille</th>
                          <th className="py-2.5 px-3 font-bold text-right">Vh Appel</th>
                          <th className="py-2.5 px-3 font-bold text-right">Vv Envol</th>
                          <th className="py-2.5 px-3 font-bold text-right">Dist. Appel</th>
                          <th className="py-2.5 px-3 font-bold text-right">Contact Sol</th>
                          <th className="py-2.5 px-3 font-bold text-right" title="Longueur de la dernière foulée (m)">Dernière Foulée</th>
                          <th className="py-2.5 px-3 font-bold text-right">Pic CM (H3)</th>
                          <th className="py-2.5 px-3 font-bold text-center">Modèle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {athletes.map((ath, idx) => {
                          const isSelected = ath.athlete === currentAthlete.athlete;
                          return (
                            <tr 
                              key={`${ath.athlete}-${ath.rank}-${idx}`}
                              onClick={() => {
                                setSelectedAthleteName(ath.athlete);
                                setSelectedAthleteRank(ath.rank);
                              }}
                              className={`cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-indigo-950/40 text-white' 
                                  : 'hover:bg-slate-800/40 text-slate-300'
                              }`}
                            >
                              <td className="py-2.5 px-3 font-bold text-indigo-400">#{ath.rank}</td>
                              <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">{ath.athlete}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-400">{ath.country}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-300 text-right">{ath.mark.toFixed(2)} m</td>
                              <td className="py-2.5 px-3 font-mono text-slate-400 text-right">{ath.stature.toFixed(2)} m</td>
                              <td className="py-2.5 px-3 font-mono text-amber-300 text-right font-semibold">{ath.vhTakeOffTD.toFixed(2)} m/s</td>
                              <td className="py-2.5 px-3 font-mono text-emerald-300 text-right font-semibold">{ath.vvTO.toFixed(2)} m/s</td>
                              <td className="py-2.5 px-3 font-mono text-cyan-300 text-right font-semibold">{ath.takeOffDistance.toFixed(2)} m</td>
                              <td className="py-2.5 px-3 font-mono text-purple-300 text-right font-semibold">{(ath.takeOffContactTime * 1000).toFixed(0)} ms</td>
                              <td className="py-2.5 px-3 font-mono text-slate-300 text-right">{ath.step3Length.toFixed(2)} m</td>
                              <td className="py-2.5 px-3 font-mono text-emerald-400 text-right font-bold">{ath.h3.toFixed(2)} m</td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  ath.modelStyle === 'VITESSE_ELASTICITE'
                                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                    : ath.modelStyle === 'FORCE_PUISSANCE'
                                    ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                                    : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                }`}>
                                  {ath.modelStyle === 'VITESSE_ELASTICITE' ? 'Vitesse' : ath.modelStyle === 'FORCE_PUISSANCE' ? 'Force' : 'Mixte'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --------------------------------------------------- */}
              {/* SOUS-ONGLET 4 : GUIDE ENTRAÎNEUR                    */}
              {/* --------------------------------------------------- */}
              {activeSubTab === 'coach_guide' && (
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-6">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Recommandations Pratiques de Terrain
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      Repères Directeurs d'Entraînement dérivés des Rapports IAAF
                    </h3>
                    <p className="text-xs text-slate-400">
                      Comment transposer ces mesures biomécaniques de laboratoire dans l'entraînement quotidien des athlètes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">1</span>
                        <span>Corrélation Vitesse d'élan et Distance d'appel</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Plus l'athlète accélère dans la courbe (&gt; 7.5 m/s comme Barshim ou Bondarenko), 
                        plus son impulsion doit être éloignée (1.50m à 1.70m) pour donner au centre de masse le temps d'atteindre son apogée pile au milieu du sautoir.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">2</span>
                        <span>Rythme des deux dernières foulées (Pénultième & Appel)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Le schéma <strong>Long / Court (Barshim, Lysenko)</strong> permet une vitesse d'exécution maximale au sol (140 ms), 
                        alors que le schéma <strong>Court / Long (Ghazal, Rivera)</strong> abaisse le CM pour maximiser la poussée verticale.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : currentStudy.genericAthletes && currentStudy.genericAthletes.length > 0 ? (
            /* Étude officielle avec tableau cinématique des finalistes (Perche, Longueur, 100m, 110m Haies, Javelot) */
            <div className="space-y-6">
              
              {/* Plages normatives et repères directeurs de l'épreuve */}
              {currentStudy.benchmarksList && currentStudy.benchmarksList.length > 0 && (
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-indigo-400" />
                      <span>Plages Normatives & Repères Directeurs ({currentStudy.disciplineName})</span>
                    </h3>
                    <span className="text-xs text-slate-400">Valeurs de référence IAAF</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {currentStudy.benchmarksList.map((b, idx) => (
                      <div key={idx} className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block truncate">{b.label}</span>
                        <span className="text-base font-black text-amber-300 mt-0.5 block">{b.avg}</span>
                        <span className="text-[10px] text-slate-400 block mt-1 truncate">Plage : {b.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tableau cinématique exhaustif des finalistes */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      <span>Tableau Cinématique des Finalistes Mondiaux ({currentStudy.competition})</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Mesures officielles tridimensionnelles de l'équipe scientifique World Athletics & Leeds Beckett University.
                    </p>
                  </div>

                  {currentStudy.sourcePdfUrl && (
                    <a
                      href={currentStudy.sourcePdfUrl}
                      download={currentStudy.pdfFileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger le Rapport PDF ({currentStudy.pdfFileSize})</span>
                    </a>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="py-2.5 px-3 font-bold">Rang</th>
                        <th className="py-2.5 px-3 font-bold">Athlète</th>
                        <th className="py-2.5 px-3 font-bold">Pays</th>
                        <th className="py-2.5 px-3 font-bold text-right">Performance</th>
                        <th className="py-2.5 px-3 font-bold text-right">Vitesse Déterminante</th>
                        <th className="py-2.5 px-3 font-bold text-right">Temps d'appui</th>
                        {currentStudy.genericAthletes.some(item => item.takeOffAngle) && (
                          <th className="py-2.5 px-3 font-bold text-right">Angle Envol / Éjection</th>
                        )}
                        <th className="py-2.5 px-3 font-bold text-right">Métrique Clé</th>
                        <th className="py-2.5 px-3 font-bold text-center">Modèle Technique</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {currentStudy.genericAthletes.map((ath, idx) => (
                        <tr key={`${ath.athlete}-${ath.rank}-${idx}`} className="hover:bg-slate-800/40 text-slate-300">
                          <td className="py-2.5 px-3 font-bold text-indigo-400">#{ath.rank}</td>
                          <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">{ath.athlete}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{ath.country}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-300 text-right">{ath.mark}</td>
                          <td className="py-2.5 px-3 font-mono text-amber-300 text-right font-semibold">{ath.velocity}</td>
                          <td className="py-2.5 px-3 font-mono text-purple-300 text-right">{ath.contactTime || '-'}</td>
                          {currentStudy.genericAthletes!.some(item => item.takeOffAngle) && (
                            <td className="py-2.5 px-3 font-mono text-emerald-300 text-right">{ath.takeOffAngle || '-'}</td>
                          )}
                          <td className="py-2.5 px-3 font-mono text-cyan-300 text-right">
                            <span className="text-[10px] text-slate-400 block">{ath.keyMetricLabel}</span>
                            <span className="font-bold">{ath.keyMetricValue}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              {ath.modelStyle || 'Élite'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Données issues des caméras haute vitesse 120-250 Hz (IAAF Research Team)</span>
                  </span>
                  {currentStudy.sourcePdfUrl && (
                    <a
                      href={currentStudy.sourcePdfUrl}
                      download={currentStudy.pdfFileName}
                      className="text-indigo-400 hover:text-indigo-300 underline font-semibold"
                    >
                      Consulter le rapport officiel complet ({currentStudy.pdfFileName})
                    </a>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Document téléversé sans tableau 3D prédéfini */
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Document d'étude disponible</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Ce rapport scientifique a été intégré à la discipline {currentDisciplineGroup.name}. Vous pouvez télécharger le document complet pour étudier l'intégralité de ses analyses et graphiques.
              </p>
              {currentStudy.sourcePdfUrl && (
                <a
                  href={currentStudy.sourcePdfUrl}
                  download={currentStudy.pdfFileName}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le document ({currentStudy.pdfFileName})</span>
                </a>
              )}
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL : FENÊTRE DE TRI DES DISCIPLINES DISPONIBLES         */}
      {/* ------------------------------------------------------------- */}
      {isDisciplineFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-scale-in">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Fenêtre de Tri : Disciplines Disponibles
                  </h3>
                  <p className="text-xs text-slate-400">
                    Seules les disciplines possédant des études disponibles sont proposées ci-dessous.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDisciplineFilterModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barre de recherche dans la fenêtre de tri */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Rechercher une discipline..."
                value={disciplineSearchTerm}
                onChange={(e) => setDisciplineSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Liste des disciplines proposées (Strictement celles avec études disponibles) */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredDisciplineGroupsInModal.length > 0 ? (
                filteredDisciplineGroupsInModal.map((group) => {
                  const isSelected = group.code === selectedDisciplineCode;
                  const availableCount = group.studies.filter(s => s.available).length;
                  return (
                    <div
                      key={group.code}
                      onClick={() => {
                        setSelectedDisciplineCode(group.code);
                        setIsDisciplineFilterModalOpen(false);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {group.category.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{group.name}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              {group.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {availableCount} {availableCount > 1 ? 'études et rapports disponibles' : 'étude officielle disponible'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Sélectionnée
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Aucune discipline correspondante trouvée.
                </div>
              )}
            </div>

            {/* Note d'information et bouton pour ajouter une étude */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <span>Vous possédez un document pour une autre discipline ?</span>
              <button
                onClick={() => {
                  setIsDisciplineFilterModalOpen(false);
                  setIsUploadModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Téléverser une étude</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL : AJOUT D'UNE ÉTUDE AVEC UPLOAD DE FICHIER           */}
      {/* ------------------------------------------------------------- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Téléverser une Étude Biomécanique
                  </h3>
                  <p className="text-xs text-slate-400">
                    Déposez votre rapport (PDF, Word, Excel). Il sera accessible et téléchargeable immédiatement.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomStudySubmit} className="space-y-4 text-xs">
              
              {/* ZONE DE GLISSER-DÉPOSER / UPLOAD DE FICHIER RÉEL */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Document de l'étude (Fichier obligatoire) *
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-indigo-400 bg-indigo-500/10'
                      : uploadedFile
                      ? 'border-emerald-500/60 bg-emerald-500/5'
                      : 'border-slate-700 hover:border-indigo-500/50 bg-slate-950/60'
                  }`}
                >
                  {uploadedFile ? (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-xs">{uploadedFile.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {(uploadedFile.size / (1024 * 1024)).toFixed(2)} Mo · Fichier prêt
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          setUploadedFileBase64('');
                          setUploadProgress(0);
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-slate-800"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-7 h-7 text-indigo-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-white">
                        Glissez-déposez votre document ici, ou <span className="text-indigo-400 underline">parcourez vos fichiers</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Formats acceptés : PDF, Word (.doc, .docx), Excel (.xls, .xlsx)
                      </p>
                    </div>
                  )}
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}

                {uploadError && (
                  <p className="text-rose-400 text-xs mt-1.5">{uploadError}</p>
                )}
              </div>

              {/* Titre de l'étude */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Titre de l'étude / rapport *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Analyse cinématique 3D de la finale du Saut en Hauteur"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Choix de la discipline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Discipline associée *</label>
                  <select
                    value={uploadForm.disciplineChoice}
                    onChange={(e) => {
                      const chosen = e.target.value;
                      const cat = DISCIPLINE_CATALOG[chosen]?.category || uploadForm.category;
                      setUploadForm(prev => ({
                        ...prev,
                        disciplineChoice: chosen,
                        category: cat
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="HAUTEUR">Saut en Hauteur</option>
                    <option value="PERCHE">Saut à la Perche</option>
                    <option value="LONGUEUR">Saut en Longueur</option>
                    <option value="TRIPLE_SAUT">Triple Saut</option>
                    <option value="100M">100m Sprint</option>
                    <option value="110M_HAIES">110m Haies</option>
                    <option value="JAVELOT">Lancer du Javelot</option>
                    <option value="POIDS">Lancer du Poids</option>
                    <option value="NEW">+ Autre discipline (saisir manuellement)...</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Catégorie d'épreuve</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="SAUTS">Sauts</option>
                    <option value="SPRINT">Sprint</option>
                    <option value="HAIES">Haies</option>
                    <option value="LANCERS">Lancers</option>
                    <option value="DEMI_FOND">Demi-fond & Fond</option>
                  </select>
                </div>
              </div>

              {/* Choix du sexe (H, F ou Mixte) */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Sexe concerné par l'étude *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadForm({ ...uploadForm, gender: 'H' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      uploadForm.gender === 'H'
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>♂ Hommes (H)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadForm({ ...uploadForm, gender: 'F' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      uploadForm.gender === 'F'
                        ? 'bg-pink-600 border-pink-400 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>♀ Femmes (F)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadForm({ ...uploadForm, gender: 'MIXTE' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      uploadForm.gender === 'MIXTE'
                        ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>⚧ Mixte</span>
                  </button>
                </div>
              </div>

              {/* Si nouvelle discipline manuelle */}
              {uploadForm.disciplineChoice === 'NEW' && (
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nom de la nouvelle discipline *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lancer du Marteau, 400m..."
                    value={uploadForm.customDisciplineName}
                    onChange={(e) => setUploadForm({ ...uploadForm, customDisciplineName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              )}

              {/* Métadonnées : Compétition & Année */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Compétition de référence</label>
                  <input
                    type="text"
                    placeholder="Ex: Ch. du Monde Budapest 2023"
                    value={uploadForm.competition}
                    onChange={(e) => setUploadForm({ ...uploadForm, competition: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Année</label>
                  <input
                    type="number"
                    value={uploadForm.year}
                    onChange={(e) => setUploadForm({ ...uploadForm, year: parseInt(e.target.value) || 2024 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Auteurs et Institution */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Auteurs scientifiques</label>
                  <input
                    type="text"
                    placeholder="Ex: Dr Nicholson, Dr Bissas..."
                    value={uploadForm.authors}
                    onChange={(e) => setUploadForm({ ...uploadForm, authors: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Institution de recherche</label>
                  <input
                    type="text"
                    placeholder="Ex: World Athletics, INSEP, FFA..."
                    value={uploadForm.institution}
                    onChange={(e) => setUploadForm({ ...uploadForm, institution: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Résumé en français */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Résumé & Synthèse en français</label>
                <textarea
                  rows={2}
                  placeholder="Résumé des mesures cinématiques, méthodologie et résultats..."
                  value={uploadForm.summary}
                  onChange={(e) => setUploadForm({ ...uploadForm, summary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Enseignement clé */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Enseignement d'entraînement majeur</label>
                <input
                  type="text"
                  placeholder="Ex: Vitesse terminale corrélée à r=0.85 avec la hauteur franchie"
                  value={uploadForm.keyTakeaway}
                  onChange={(e) => setUploadForm({ ...uploadForm, keyTakeaway: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer shadow"
                >
                  Téléverser et intégrer l'étude
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. MODALE IN-APP DE CONFIRMATION DE SUPPRESSION D'ÉTUDE       */}
      {/* ------------------------------------------------------------- */}
      {studyToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {studyToDelete.id.startsWith('study-') || studyToDelete.id.startsWith('custom-')
                    ? "Supprimer cette étude personnalisée ?"
                    : "Retirer cette étude ?"}
                </h3>
                <p className="text-xs text-slate-400">
                  {studyToDelete.id.startsWith('study-') || studyToDelete.id.startsWith('custom-')
                    ? "Le document sera définitivement retiré de votre espace local."
                    : "Cette étude sera masquée. Vous pourrez la restaurer à tout moment."}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800/80 my-4 text-xs space-y-1">
              <p className="font-bold text-white text-sm">{studyToDelete.title}</p>
              <p className="text-slate-400">
                {studyToDelete.disciplineName} · {studyToDelete.competition} ({studyToDelete.year})
              </p>
              <p className="text-slate-500 text-[11px] truncate">
                Fichier : {studyToDelete.pdfFileName} ({studyToDelete.pdfFileSize})
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStudyToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {studyToDelete.id.startsWith('study-') || studyToDelete.id.startsWith('custom-')
                    ? "Supprimer définitivement"
                    : "Masquer l'étude"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
