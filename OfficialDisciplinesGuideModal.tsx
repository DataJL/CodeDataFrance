import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Sun, 
  Snowflake, 
  CheckCircle2, 
  Trophy, 
  Medal, 
  Layers, 
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { CategoryCode } from '../types/athletics';

interface OfficialDisciplinesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter?: (params: {
    category: CategoryCode;
    structure: 'EXTERIEUR' | 'SALLE';
    discipline?: string;
  }) => void;
}

export const OfficialDisciplinesGuideModal: React.FC<OfficialDisciplinesGuideModalProps> = ({
  isOpen,
  onClose,
  onApplyFilter,
}) => {
  const [activeTab, setActiveTab] = useState<'jeunes' | 'adultes'>('jeunes');

  if (!isOpen) return null;

  const handleApply = (category: CategoryCode, structure: 'EXTERIEUR' | 'SALLE', discipline?: string) => {
    if (onApplyFilter) {
      onApplyFilter({ category, structure, discipline });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/15 border border-blue-500/30 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Guide des Épreuves Officielles de l'Athlétisme</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-sky-300 border border-blue-500/30">
                  Réglementation FFA
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Récapitulatif officiel des disciplines de la catégorie U14 aux Masters (Plein air et Salle)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ONGLETS DU GUIDE */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('jeunes')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'jeunes'
                ? 'border-blue-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Medal className="w-4 h-4" />
            <span>1. Catégories Jeunes : Benjamins (U14) & Minimes (U16)</span>
          </button>

          <button
            onClick={() => setActiveTab('adultes')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'adultes'
                ? 'border-blue-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>2. Catégories Cadets à Masters (U18, U20, U23, Seniors, Masters)</span>
          </button>
        </div>

        {/* CONTENU DU GUIDE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          
          {/* SECTION 1 : JEUNES (U14 & U16) */}
          {activeTab === 'jeunes' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 text-slate-300 leading-relaxed">
                <span className="font-bold text-white block mb-1">Orientation de la pratique fédérale :</span>
                Pour les catégories jeunes (U14 & U16), la réglementation fédérale oriente la pratique vers la 
                <strong className="text-sky-300 font-semibold"> polyvalence (épreuves multiples)</strong> avec des distances et des engins rigoureusement adaptés au développement physiologique.
              </div>

              {/* MINIMES (U16) */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <h3 className="text-sm font-bold text-white">Minimes (Catégorie U16)</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApply('MI', 'EXTERIEUR', '80m')}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-sky-300 text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <span>Filtrer Bilan U16 Plein air</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleApply('MI', 'SALLE', '50m')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <span>Filtrer Bilan U16 Salle</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Plein air Minimes */}
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Plein air (Estivales)</span>
                  </h4>
                  <ul className="space-y-1.5 pl-4 list-disc text-slate-300">
                    <li>
                      <strong className="text-white">Courses :</strong> 80m, 120m, 1 000m, 2 000m, 80m Haies (Filles - 0,76m), 100m Haies (Garçons - 0,84m), 200m Haies (0,76m).
                    </li>
                    <li>
                      <strong className="text-white">Marche :</strong> 3 000m Marche.
                    </li>
                    <li>
                      <strong className="text-white">Sauts :</strong> Hauteur, Perche, Longueur, Triple Saut.
                    </li>
                    <li>
                      <strong className="text-white">Lancers :</strong> Poids (3kg F et 4kg H), Javelot (500g F et 600g H), Disque (800g F et 1.250kg H), Marteau (3kg F et 4kg H).
                    </li>
                    <li>
                      <strong className="text-white">Épreuves combinées :</strong> Octathlon (Garçons) / Heptathlon (Filles).
                    </li>
                  </ul>
                </div>

                {/* En salle Minimes */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <h4 className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                    <Snowflake className="w-3.5 h-3.5" />
                    <span>En salle (Hivernales)</span>
                  </h4>
                  <ul className="space-y-1.5 pl-4 list-disc text-slate-300">
                    <li>
                      <strong className="text-white">Courses & Marche :</strong> 50m, 50m Haies, 1 000m, 3 000m marche.
                    </li>
                    <li>
                      <strong className="text-white">Sauts & Lancers :</strong> Hauteur, Perche, Longueur, Triple saut, Lancer du poids (3kg F et 4kg H).
                    </li>
                    <li>
                      <strong className="text-white">Épreuves combinées :</strong> Pentathlon.
                    </li>
                  </ul>
                </div>
              </div>

              {/* BENJAMINS (U14) */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <h3 className="text-sm font-bold text-white">Benjamins (Catégorie U14)</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApply('BE', 'EXTERIEUR', '50m')}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-sky-300 text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <span>Filtrer Bilan U14 Plein air</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleApply('BE', 'SALLE', '50m')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <span>Filtrer Bilan U14 Salle</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Plein air Benjamins */}
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Plein air (Estivales)</span>
                  </h4>
                  <ul className="space-y-1.5 pl-4 list-disc text-slate-300">
                    <li>
                      <strong className="text-white">Courses & Marche :</strong> 50m, 1 000m, 50m Haies (0,65m), 2 000m Marche.
                    </li>
                    <li>
                      <strong className="text-white">Sauts :</strong> Hauteur, Perche, Longueur, Triple Saut.
                    </li>
                    <li>
                      <strong className="text-white">Lancers :</strong> Poids (2kg F et 3kg H), Javelot (400g F et 500g H), Disque (600g F et 1kg H), Marteau (2kg F et 3kg H).
                    </li>
                    <li>
                      <strong className="text-white">Épreuves combinées :</strong> Tétrathlon.
                    </li>
                  </ul>
                </div>

                {/* En salle Benjamins */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <h4 className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                    <Snowflake className="w-3.5 h-3.5" />
                    <span>En salle (Hivernales)</span>
                  </h4>
                  <ul className="space-y-1.5 pl-4 list-disc text-slate-300">
                    <li>
                      <strong className="text-white">Courses & Marche :</strong> 50m, 50m Haies, 1 000m, 2 000m marche.
                    </li>
                    <li>
                      <strong className="text-white">Sauts & Lancers :</strong> Hauteur, Perche, Longueur, Triple saut, Lancer du poids (2kg F et 3kg H).
                    </li>
                    <li>
                      <strong className="text-white">Épreuves combinées :</strong> Tétrathlon.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2 : CADETS À SENIORS & MASTERS */}
          {activeTab === 'adultes' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* ÉPREUVES ESTIVALES PLEIN AIR */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Épreuves Estivales (Plein Air)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* U18 Cadets */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">U18 Masculins (Cadets)</span>
                      <button
                        onClick={() => handleApply('CA', 'EXTERIEUR', '100m')}
                        className="text-[10px] text-sky-400 hover:underline"
                      >
                        Filtrer
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      100m, 200m, 400m, 800m, 1500m, 3000m, 110m haies (0,91m), 400m haies (0,84m), 2000m steeple (0,84m), 5000m Marche, Hauteur, Perche, Longueur, Triple saut, Poids (5kg), Disque (1,5kg), Marteau (5kg), Javelot (700g), Relais 4x100m, Décathlon.
                    </p>
                  </div>

                  {/* U18 Cadettes */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">U18 Féminines (Cadettes)</span>
                      <button
                        onClick={() => handleApply('CA', 'EXTERIEUR', '100m')}
                        className="text-[10px] text-sky-400 hover:underline"
                      >
                        Filtrer
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      100m, 200m, 400m, 800m, 1500m, 3000m, 100m haies (0,76m), 400m haies (0,76m), 2000m steeple (0,76m), 5000m Marche, Hauteur, Perche, Longueur, Triple saut, Poids (3kg), Disque (1kg), Marteau (3kg), Javelot (500g), Relais 4x100m, Heptathlon.
                    </p>
                  </div>

                  {/* U20 Juniors Masculins */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">U20 Masculins (Juniors)</span>
                      <button
                        onClick={() => handleApply('JU', 'EXTERIEUR', '100m')}
                        className="text-[10px] text-sky-400 hover:underline"
                      >
                        Filtrer
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      100m, 200m, 400m, 800m, 1500m, 5000m, 110m haies (0,99m), 400m haies (0,91m), 3000m steeple (0,91m), 10000m Marche, Hauteur, Perche, Longueur, Triple saut, Poids (6kg), Disque (1,750kg), Marteau (6kg), Javelot (800g), Décathlon.
                    </p>
                  </div>

                  {/* U20 Juniors Féminines */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">U20 Féminines (Juniors)</span>
                      <button
                        onClick={() => handleApply('JU', 'EXTERIEUR', '100m')}
                        className="text-[10px] text-sky-400 hover:underline"
                      >
                        Filtrer
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      100m, 200m, 400m, 800m, 1500m, 3000m, 100m haies (0,84m), 400m haies (0,76m), 2000m steeple (0,76m), 10000m Marche, Hauteur, Perche, Longueur, Triple saut, Poids (4kg), Disque (1kg), Marteau (4kg), Javelot (600g), Heptathlon.
                    </p>
                  </div>

                  {/* U23 & Seniors Masculins */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Seniors & U23 Masculins</span>
                      <button
                        onClick={() => handleApply('SE', 'EXTERIEUR', '100m')}
                        className="text-[10px] text-sky-400 hover:underline"
                      >
                        Filtrer
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      100m, 200m, 400m, 800m, 1500m, 5000m, 10000m, 110m Haies (1,06m), 400m Haies (0,91m), 3000m Steeple (0,91m), 10 000m Marche, Hauteur, Perche, Longueur, Triple Saut, Poids (7,26kg), Disque (2kg), Marteau (7,26kg), Javelot (800g), Décathlon.
                    </p>
                  </div>

                  {/* U23 & Seniors Féminines */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Seniors & U23 Féminines</span>
                      <button
                        onClick={() => handleApply('SE', 'EXTERIEUR', '100m')}
                        className="text-[10px] text-sky-400 hover:underline"
                      >
                        Filtrer
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      100m, 200m, 400m, 800m, 1500m, 5000m, 10000m, 100m Haies (0,84m), 400m Haies (0,76m), 3000m Steeple (0,76m), 10 000m Marche, Hauteur, Perche, Longueur, Triple Saut, Poids (4kg), Disque (1kg), Marteau (4kg), Javelot (600g), Heptathlon.
                    </p>
                  </div>
                </div>
              </div>

              {/* ÉPREUVES EN SALLE HIVERNALES */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <Snowflake className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Épreuves En Salle (Hivernales)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hommes Salle */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Masculins (U18, U20, U23, Seniors, Masters)</span>
                      <button
                        onClick={() => handleApply('SE', 'SALLE', '60m')}
                        className="text-[10px] text-sky-400 hover:underline"
                      >
                        Filtrer
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      60m, 200m, 400m, 800m, 1500m, 3000m, 60m Haies, Hauteur, Perche, Longueur, Triple Saut, Poids, Heptathlon, 5000m marche.
                    </p>
                  </div>

                  {/* Femmes Salle */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Féminines (U18, U20, U23, Seniors, Masters)</span>
                      <button
                        onClick={() => handleApply('SE', 'SALLE', '60m')}
                        className="text-[10px] text-sky-400 hover:underline"
                      >
                        Filtrer
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      60m, 200m, 400m, 800m, 1500m, 3000m, 60m Haies, Hauteur, Perche, Longueur, Triple Saut, Poids, Pentathlon, 3000m marche.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400">
          <span>Document généré selon la réglementation officielle de la Fédération Française d'Athlétisme (FFA).</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
