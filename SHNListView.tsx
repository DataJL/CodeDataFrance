import React, { useState, useMemo, useRef } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  ExternalLink, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  RotateCcw, 
  UserCheck, 
  CheckCircle2, 
  Medal, 
  Sparkles, 
  Info,
  X,
  FileText,
  ChevronRight
} from 'lucide-react';
import { PerformanceRecord, SHNAthlete, SHNCategory, SHNDisciplineFamily } from '../../types/athletics';
import { 
  SHN_CATEGORIES_INFO, 
  SHN_YEARS, 
  SHN_DISCIPLINE_FAMILIES, 
  exportSHNToCSV, 
  parseSHNFromCSV,
  isAthleteNameMatch 
} from '../../data/shnAthletesData';
import { StorageService } from '../../services/storageService';

interface SHNListViewProps {
  records: PerformanceRecord[];
  onSelectAthlete: (athleteName: string) => void;
  isAdmin?: boolean;
}

export const SHNListView: React.FC<SHNListViewProps> = ({
  records,
  onSelectAthlete,
  isAdmin = false,
}) => {
  // Liste des athlètes SHN stockée localement
  const [shnAthletes, setShnAthletes] = useState<SHNAthlete[]>(() => StorageService.getSHNAthletes());
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<SHNCategory | 'ALL'>('ALL');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'M' | 'F'>('ALL');
  const [selectedFamily, setSelectedFamily] = useState<SHNDisciplineFamily | 'ALL'>('ALL');
  const [onlyInLocalDatabase, setOnlyInLocalDatabase] = useState(false);

  // Modal d'import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvInputText, setCsvInputText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensemble des noms uniques d'athlètes présents dans la base de performances locale
  const localAthleteNames = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.athleteName) set.add(r.athleteName.trim().toLowerCase());
    });
    return set;
  }, [records]);

  // Vérifier si un athlète SHN est présent dans les résultats locaux
  const checkIsLocalAthlete = useMemo(() => {
    return (shnName: string): boolean => {
      const lower = shnName.toLowerCase();
      if (localAthleteNames.has(lower)) return true;
      for (const loc of localAthleteNames) {
        if (isAthleteNameMatch(shnName, loc)) return true;
      }
      return false;
    };
  }, [localAthleteNames]);

  // Nombre d'athlètes SHN également présents dans la base locale
  const matchingLocalCount = useMemo(() => {
    const matched = new Set<string>();
    shnAthletes.forEach(a => {
      if (checkIsLocalAthlete(a.nomComplet)) {
        matched.add(a.nomComplet.toLowerCase());
      }
    });
    return matched.size;
  }, [shnAthletes, checkIsLocalAthlete]);

  // Athlètes filtrés
  const filteredAthletes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return shnAthletes.filter(athlete => {
      // Filtre année
      if (selectedYear !== 'ALL' && athlete.anneeReference !== selectedYear) {
        return false;
      }

      // Filtre catégorie
      if (selectedCategory !== 'ALL' && athlete.categorie !== selectedCategory) {
        return false;
      }

      // Filtre sexe
      if (selectedGender !== 'ALL' && athlete.sexe !== selectedGender) {
        return false;
      }

      // Filtre famille
      if (selectedFamily !== 'ALL' && athlete.famille !== selectedFamily) {
        return false;
      }

      // Filtre athlètes présents dans les bilans locaux
      if (onlyInLocalDatabase && !checkIsLocalAthlete(athlete.nomComplet)) {
        return false;
      }

      // Filtre recherche textuelle
      if (q) {
        const full = `${athlete.nomComplet} ${athlete.discipline} ${athlete.club} ${athlete.ligue} ${athlete.statut || ''}`.toLowerCase();
        if (!full.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => {
      // Trier par année décroissante puis catégorie de prestige puis nom
      if (b.anneeReference !== a.anneeReference) return b.anneeReference - a.anneeReference;
      const catOrder: Record<SHNCategory, number> = {
        'Élite': 1,
        'Sénior': 2,
        'Relève': 3,
        'Espoir': 4,
        'Collectifs Nationaux': 5,
        'Reconversion': 6,
      };
      if (catOrder[a.categorie] !== catOrder[b.categorie]) {
        return catOrder[a.categorie] - catOrder[b.categorie];
      }
      return a.nomComplet.localeCompare(b.nomComplet);
    });
  }, [shnAthletes, selectedYear, selectedCategory, selectedGender, selectedFamily, onlyInLocalDatabase, searchQuery, checkIsLocalAthlete]);

  // Statistiques globales
  const stats = useMemo(() => {
    const total = shnAthletes.length;
    const uniqueAthletes = new Set(shnAthletes.map(a => a.nomComplet.toLowerCase())).size;
    const countElite = shnAthletes.filter(a => a.categorie === 'Élite').length;
    const countSenior = shnAthletes.filter(a => a.categorie === 'Sénior').length;
    const countReleve = shnAthletes.filter(a => a.categorie === 'Relève').length;
    const countEspoir = shnAthletes.filter(a => a.categorie === 'Espoir').length;
    const countCollectifs = shnAthletes.filter(a => a.categorie === 'Collectifs Nationaux').length;
    const countReconversion = shnAthletes.filter(a => a.categorie === 'Reconversion').length;

    return {
      total,
      uniqueAthletes,
      countElite,
      countSenior,
      countReleve,
      countEspoir,
      countCollectifs,
      countReconversion,
    };
  }, [shnAthletes]);

  // Export CSV
  const handleExportCSV = () => {
    const csv = exportSHNToCSV(filteredAthletes);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Listes_SHN_Athletisme_${selectedYear === 'ALL' ? 'Tous' : selectedYear}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Excel basique HTML
  const handleExportExcel = () => {
    let tableHtml = `
      <table border="1">
        <thead>
          <tr style="background-color: #0284c7; color: white;">
            <th>Nom</th>
            <th>Prénom</th>
            <th>Nom Complet</th>
            <th>Sexe</th>
            <th>Année Référence</th>
            <th>Catégorie</th>
            <th>Discipline</th>
            <th>Famille</th>
            <th>Club</th>
            <th>Ligue</th>
            <th>Statut / Distinctions</th>
            <th>Source officielle</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredAthletes.forEach(a => {
      tableHtml += `
        <tr>
          <td>${a.nom}</td>
          <td>${a.prenom}</td>
          <td><b>${a.nomComplet}</b></td>
          <td>${a.sexe}</td>
          <td>${a.anneeReference}</td>
          <td>${a.categorie}</td>
          <td>${a.discipline}</td>
          <td>${a.famille}</td>
          <td>${a.club}</td>
          <td>${a.ligue}</td>
          <td>${a.statut || ''}</td>
          <td>${a.source || 'Ministère des Sports / FFA'}</td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;
    const blob = new Blob(['\uFEFF' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Listes_SHN_Athletisme_${Date.now()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Réinitialisation de la base
  const handleResetToBaseline = () => {
    if (window.confirm('Voulez-vous restaurer la liste ministérielle de référence officielle (2020-2025) ?')) {
      const resetList = StorageService.resetSHNAthletes();
      setShnAthletes(resetList);
      alert('Liste ministérielle réinitialisée avec succès !');
    }
  };

  // Import de fichier CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvInputText(content);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Validation de l'import CSV
  const handleProcessImport = () => {
    if (!csvInputText.trim()) {
      setImportFeedback({ message: 'Veuillez coller du contenu CSV ou sélectionner un fichier.', type: 'error' });
      return;
    }

    try {
      const parsed = parseSHNFromCSV(csvInputText);
      if (parsed.length === 0) {
        setImportFeedback({ message: 'Aucun enregistrement valide détecté. Vérifiez le format (point-virgule ou virgule).', type: 'error' });
        return;
      }

      const updated = StorageService.addSHNAthletes(parsed);
      setShnAthletes(updated);
      setImportFeedback({ message: `${parsed.length} athlètes SHN importés et fusionnés avec succès !`, type: 'success' });
      setTimeout(() => {
        setIsImportModalOpen(false);
        setCsvInputText('');
        setImportFeedback(null);
      }, 1500);
    } catch (e) {
      setImportFeedback({ message: 'Erreur lors du traitement du fichier.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ------------------------------------------------------------- */}
      {/* 1. EN-TÊTE OFFICIEL DE LA PAGE                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Ministère des Sports & de la Jeunesse · FFA</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-600/20 text-sky-300 border border-blue-500/30 font-mono">
                Code du Sport · Art. L. 221-2
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Listes des Sportifs de Haut Niveau (SHN)</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consultez les athlètes français reconnus au titre des <strong>arrêtés ministériels</strong> officiels (catégories <strong className="text-amber-300">Élite</strong>, <strong className="text-purple-300">Sénior</strong>, <strong className="text-sky-300">Relève</strong>, <strong className="text-emerald-300">Espoir</strong>, <strong className="text-blue-300">Collectifs Nationaux</strong> et <strong className="text-slate-300">Reconversion</strong>). 
              Croisez en un clic les sportifs de haut niveau avec les résultats de votre base locale.
            </p>
          </div>

          {/* ACTIONS D'EXPORT ET LIENS OFFICIELS */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="https://sports.gouv.fr/liste-des-sportifs-francais-de-haut-niveau"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-sm"
              title="Ouvrir le portail officiel de recherche du Ministère des Sports"
            >
              <span>Portail sports.gouv.fr</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            </a>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Exporter la sélection en fichier Excel (.xls)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Excel</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-sky-300 border border-blue-700/50 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Exporter la sélection en fichier CSV (.csv)"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-700/50 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Importer un fichier ministériel supplémentaire ou arrêté ministériel"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Importer</span>
            </button>

            <button
              onClick={handleResetToBaseline}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all cursor-pointer"
              title="Réinitialiser la liste ministérielle de référence"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. STATISTIQUES RÉCAPITULATIVES                                */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* ÉLITE */}
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-xs font-bold">Élite</span>
            <Medal className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-300">{stats.countElite}</div>
          <p className="text-[10px] text-slate-400 mt-1">Excellence mondiale</p>
        </div>

        {/* SÉNIOR */}
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <span className="text-xs font-bold">Sénior</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-300">{stats.countSenior}</div>
          <p className="text-[10px] text-slate-400 mt-1">Équipe de France A</p>
        </div>

        {/* RELÈVE */}
        <div className="bg-slate-900/80 border border-sky-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-sky-400 mb-1">
            <span className="text-xs font-bold">Relève</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-sky-300">{stats.countReleve}</div>
          <p className="text-[10px] text-slate-400 mt-1">Mondiaux / Euro U20-U23</p>
        </div>

        {/* ESPOIR */}
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-bold">Espoir</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-300">{stats.countEspoir}</div>
          <p className="text-[10px] text-slate-400 mt-1">Filière PPF Jeunes</p>
        </div>

        {/* COLLECTIFS & RECONVERSION */}
        <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-xs font-bold">Collectifs / Rec.</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-blue-300">{stats.countCollectifs + stats.countReconversion}</div>
          <p className="text-[10px] text-slate-400 mt-1">Relais & Reconversion</p>
        </div>

        {/* LIEN BASE LOCALE */}
        <div className="bg-slate-900/80 border border-indigo-500/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-400 mb-1">
            <span className="text-xs font-bold">Dans ma base</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{matchingLocalCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Athlètes avec résultats</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BARRE DE FILTRES ET RECHERCHE                               */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        {/* LIGNE 1 : Recherche + Années */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Champ recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, discipline, club, ligue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtre Année */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedYear('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedYear === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Toutes années
            </button>
            {SHN_YEARS.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedYear === year
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* LIGNE 2 : Catégories SHN */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-sky-400" />
            Catégorie :
          </span>

          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-slate-200 text-slate-900 font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Toutes ({shnAthletes.length})
          </button>

          {(Object.keys(SHN_CATEGORIES_INFO) as SHNCategory[]).map(catKey => {
            const isSel = selectedCategory === catKey;
            const meta = SHN_CATEGORIES_INFO[catKey];
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer border transition-all ${
                  isSel
                    ? meta.badgeClass + ' font-bold shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* LIGNE 3 : Sexe, Familles et Toggle "Base Locale" */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Sexe */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setSelectedGender('ALL')}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold cursor-pointer ${
                  selectedGender === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setSelectedGender('M')}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold cursor-pointer ${
                  selectedGender === 'M' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                M
              </button>
              <button
                onClick={() => setSelectedGender('F')}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold cursor-pointer ${
                  selectedGender === 'F' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                F
              </button>
            </div>

            {/* Famille d'épreuve */}
            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value as SHNDisciplineFamily | 'ALL')}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="ALL">Toutes les familles</option>
              {SHN_DISCIPLINE_FAMILIES.map(fam => (
                <option key={fam} value={fam}>{fam}</option>
              ))}
            </select>
          </div>

          {/* Toggle : Présents dans les résultats locaux */}
          <button
            onClick={() => setOnlyInLocalDatabase(!onlyInLocalDatabase)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
              onlyInLocalDatabase
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/60 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${onlyInLocalDatabase ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Athlètes avec fiches / résultats locaux ({matchingLocalCount})</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. TABLEAU ET LISTE DES ATHLÈTES SHN                           */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* En-tête de la table */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Athlètes Répertoriés ({filteredAthletes.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Mise à jour officielle Ministère / FFA
          </span>
        </div>

        {filteredAthletes.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Info className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-300">Aucun athlète ne correspond aux filtres actuels</p>
            <p className="text-xs text-slate-500">Essayez de modifier votre recherche ou de réinitialiser les filtres.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedYear('ALL');
                setSelectedCategory('ALL');
                setSelectedGender('ALL');
                setSelectedFamily('ALL');
                setOnlyInLocalDatabase(false);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Athlète</th>
                  <th className="py-3 px-3">Année & Catégorie</th>
                  <th className="py-3 px-3">Épreuve / Spécialité</th>
                  <th className="py-3 px-3">Club & Ligue</th>
                  <th className="py-3 px-3">Statut & Palmarès</th>
                  <th className="py-3 px-4 text-right">Fiche Athlète</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredAthletes.map((athlete) => {
                  const isLocal = checkIsLocalAthlete(athlete.nomComplet);
                  const meta = SHN_CATEGORIES_INFO[athlete.categorie] || SHN_CATEGORIES_INFO['Espoir'];

                  return (
                    <tr 
                      key={athlete.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. Athlète */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            athlete.sexe === 'F' 
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50' 
                              : 'bg-blue-950/60 text-sky-300 border border-blue-800/50'
                          }`}>
                            {athlete.prenom ? athlete.prenom[0] : ''}{athlete.nom ? athlete.nom[0] : ''}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-sm">
                                {athlete.nomComplet}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                athlete.sexe === 'F' ? 'bg-rose-950 text-rose-300' : 'bg-blue-950 text-sky-300'
                              }`}>
                                {athlete.sexe}
                              </span>
                            </div>

                            {isLocal && (
                              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-0.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>Présent{athlete.sexe === 'F' ? 'e' : ''} dans vos bilans locaux</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Année & Catégorie */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                              {athlete.anneeReference}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${meta.badgeClass}`}>
                              {athlete.categorie}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Épreuve & Famille */}
                      <td className="py-3.5 px-3">
                        <div>
                          <div className="font-bold text-white text-xs">{athlete.discipline}</div>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 inline-block mt-0.5">
                            {athlete.famille}
                          </span>
                        </div>
                      </td>

                      {/* 4. Club & Ligue */}
                      <td className="py-3.5 px-3">
                        <div>
                          <div className="text-slate-200 font-semibold text-xs truncate max-w-[200px]" title={athlete.club}>
                            {athlete.club}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {athlete.ligue}
                          </div>
                        </div>
                      </td>

                      {/* 5. Statut & Palmarès */}
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] text-slate-300 line-clamp-2 max-w-[220px]" title={athlete.statut}>
                          {athlete.statut || (athlete.sexe === 'F' ? 'Inscrite sur arrêté ministériel' : 'Inscrit sur arrêté ministériel')}
                        </span>
                      </td>

                      {/* 6. Action : Consulter la fiche athlète */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectAthlete(athlete.nomComplet)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                            isLocal
                              ? 'bg-blue-600 hover:bg-blue-500 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                          }`}
                          title={`Ouvrir la fiche athlète de ${athlete.nomComplet}`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Fiche</span>
                          <ChevronRight className="w-3 h-3 opacity-70" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. NOTICE EXPLICATIVE MINISTÉRIELLE                           */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400" />
          <span>Comprendre les catégories de la liste ministérielle de haut niveau</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <strong className="text-amber-300 block mb-1">1. Liste Élite</strong>
            <p>Réservée aux athlètes ayant réalisé un podium ou une finale aux Jeux Olympiques ou Championnats du Monde seniors.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <strong className="text-purple-300 block mb-1">2. Liste Sénior</strong>
            <p>Athlètes sélectionnés en Équipe de France A, finalistes des Championnats d'Europe ou ayant réalisé les minima mondiaux.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <strong className="text-sky-300 block mb-1">3. Liste Relève</strong>
            <p>Sportifs à très fort potentiel d'accès au haut niveau mondial (médaillés ou finalistes mondiaux/européens U20 et U23).</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <strong className="text-emerald-300 block mb-1">4. Liste Espoir</strong>
            <p>Jeunes talents identifiés dans le Plan de Performance Fédéral (PPF) de la FFA démontrant un potentiel d'accès au niveau international.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <strong className="text-blue-300 block mb-1">5. Collectifs Nationaux</strong>
            <p>Athlètes intégrés aux collectifs des relais nationaux (4x100m, 4x400m) et partenaires réguliers d'entraînement de l'équipe de France.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <strong className="text-slate-300 block mb-1">6. Liste Reconversion</strong>
            <p>Accompagnement socioprofessionnel des sportifs ayant honoré de nombreuses sélections internationales après la fin de leur carrière sportive.</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. MODAL D'IMPORT CSV MINISTÉRIEL                             */}
      {/* ------------------------------------------------------------- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base">Importer un arrêté ministériel ou fichier CSV</h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFeedback(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Vous pouvez importer des listes ministérielles supplémentaires (format CSV avec séparateur point-virgule ou virgule).
              Les colonnes reconnues sont : <code>Nom</code>, <code>Prénom</code>, <code>Sexe</code>, <code>Année</code>, <code>Catégorie</code>, <code>Discipline</code>, <code>Club</code>, <code>Ligue</code>.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                  <span>Choisir un fichier CSV local</span>
                </button>
                <span className="text-xs text-slate-500">ou collez le texte ci-dessous</span>
              </div>

              <textarea
                value={csvInputText}
                onChange={(e) => setCsvInputText(e.target.value)}
                placeholder="Nom;Prénom;Sexe;Année;Catégorie;Discipline;Club;Ligue;Statut&#10;MAYER;Kevin;M;2025;Élite;Décathlon;Montpellier Athlé;Occitanie;Champion du Monde..."
                rows={7}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {importFeedback && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                importFeedback.type === 'success' 
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50' 
                  : 'bg-rose-950/80 text-rose-300 border border-rose-700/50'
              }`}>
                {importFeedback.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFeedback(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleProcessImport}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
              >
                Intégrer les données ministérielles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
