import React from 'react';
import { 
  X, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  FileSpreadsheet, 
  CheckCircle2, 
  ServerOff, 
  RefreshCw,
  Download,
  Info,
  Clock,
  Layers
} from 'lucide-react';
import { StorageService } from '../services/storageService';

interface StorageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalRecordsCount?: number;
}

export const StorageInfoModal: React.FC<StorageInfoModalProps> = ({
  isOpen,
  onClose,
  totalRecordsCount,
}) => {
  if (!isOpen) return null;

  const lastImported = StorageService.getLastImportedFile();
  const recordsCount = totalRecordsCount ?? StorageService.getPerformances().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* EN-TÊTE DU MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Stockage & Gestion des Fichiers Importés</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Local & Sécurisé
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Où sont conservées vos données et comment fonctionne le fichier de référence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENU */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          
          {/* BANDEAU PRINCIPAL DE SYNTHÈSE */}
          <div className="bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-sm">
                Architecture Optimale : Stockage Local IndexedDB & GitHub Releases
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Les bilans officiels et performances sont téléchargés depuis <strong>GitHub Releases</strong> en 1 requête rapide et conservés dans le stockage local persistant de votre navigateur (<strong>IndexedDB</strong>). 
                Ce système garantit une consultation ultra-fluide, instantanée et sans limitation de quota.
              </p>
            </div>
          </div>

          {/* FICHIER OFFICIEL DE RÉFÉRENCE GITHUB (SAISON 2025-2026) */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 text-slate-200">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Fichier Officiel de Référence Fédérale (GitHub Releases)</span>
            </h4>

            <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">Rslts_25-26.csv</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                      Saison 2025-2026 (Plein air + Salle)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Base fédérale exhaustive hébergée sur GitHub Releases : <strong>851 918 lignes</strong>, <strong>851 917 performances</strong> et <strong>75 458 athlètes distincts</strong>.
                  </p>
                </div>
                <a
                  href="https://github.com/DataJL/data_FFA/releases/download/S25-26/Rslts_25-26.csv"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 text-xs font-semibold transition-all cursor-pointer shrink-0 w-fit"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Lien GitHub Releases</span>
                </a>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-500 block uppercase text-[9px]">Lignes</span>
                  <span className="font-bold text-cyan-400">851 918</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[9px]">Performances</span>
                  <span className="font-bold text-emerald-400">851 917</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[9px]">Athlètes uniques</span>
                  <span className="font-bold text-sky-400">75 458</span>
                </div>
              </div>
            </div>
          </div>

          {/* OÙ SONT STOCKÉS LES FICHIERS ET COMMENT ÇA MARCHE */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 text-slate-200">
              <HardDrive className="w-4 h-4 text-sky-400" />
              <span>Détails Techniques du Stockage des Fichiers</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* IndexedDB */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <h5 className="font-bold text-white text-xs">1. Base IndexedDB (<code className="text-emerald-400">sfa_large_performances</code>)</h5>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dédiée aux <strong>gros volumes de données</strong> (fichiers .txt tabulés de plusieurs mégaoctets et dizaines de milliers de lignes). 
                  IndexedDB offre une capacité de plusieurs gigaoctets directement dans le disque dur alloué à votre navigateur.
                </p>
              </div>

              {/* LocalStorage */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-400" />
                  <h5 className="font-bold text-white text-xs">2. Cache LocalStorage (<code className="text-sky-400">sfa_performances_v3</code>)</h5>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Permet un chargement instantané de l'interface, des préférences de filtres, des bilans favoris et de votre compte utilisateur.
                </p>
              </div>

              {/* Confidentialité */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <ServerOff className="w-4 h-4 text-amber-400" />
                  <h5 className="font-bold text-white text-xs">3. Confidentialité Fédérale</h5>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conformité RGPD totale. Les noms d'athlètes, clubs et performances importés ne quittent jamais votre équipement informatique.
                </p>
              </div>

              {/* Persistance */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <h5 className="font-bold text-white text-xs">4. Persistance Permanente</h5>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vos fichiers importés restent conservés entre les sessions. Vous pouvez fermer votre onglet ou redémarrer votre navigateur sans perdre vos bilans.
                </p>
              </div>

            </div>
          </div>

          {/* CONSEIL POUR LES FICHIERS VOLUMINEUX */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-white block">
                Astuce pour vos imports de fichiers .txt volumineux (tabulations sans en-tête) :
              </span>
              <p className="text-slate-400 leading-relaxed">
                Dans l'onglet <strong>« Import / Export »</strong>, vous pouvez glisser-déposer vos fichiers <strong>.txt</strong> volumineux. 
                Le système détecte automatiquement le séparateur tabulation (<code className="text-sky-400">\t</code>) 
                et applique le gabarit standard FFA (27 colonnes) même si votre fichier ne contient pas de ligne d'en-tête.
              </p>
            </div>
          </div>

        </div>

        {/* PIED DE MODAL */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer transition-colors shadow-sm"
          >
            Compris, fermer
          </button>
        </div>

      </div>
    </div>
  );
};
