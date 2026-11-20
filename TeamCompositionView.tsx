import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Trophy, 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  SlidersHorizontal, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  Activity,
  Flame,
  UserCheck,
  Zap,
  Info,
  Layers,
  Medal
} from 'lucide-react';
import { PerformanceRecord, CategoryCode } from '../../types/athletics';
import { CompetitionType, CompetitionGenderMode, CompetitionRules } from '../../types/teamComposition';
import { COMPETITION_PRESETS, optimizeTeamComposition } from '../../utils/teamOptimizer';
import { exportTeamCompositionToExcel, exportToWord } from '../../utils/exportUtils';
import { getAthleteYearInCategory, normalizeCategory } from '../../utils/performanceUtils';

interface TeamCompositionViewProps {
  records: PerformanceRecord[];
  userClub?: string;
  onSelectAthlete: (name: string) => void;
  onSelectDiscipline: (discipline: string) => void;
}

const TeamCompositionViewComponent: React.FC<TeamCompositionViewProps> = ({
  records,
  userClub,
  onSelectAthlete,
  onSelectDiscipline,
}) => {
  // Liste exhaustive des clubs présents dans la base avec le nombre d'athlètes
  const clubsSummary = useMemo(() => {
    const map = new Map<string, { club: string; athletes: Set<string>; count: number }>();
    records.forEach(r => {
      const c = (r.club || '').trim();
      if (!c || c === 'Club Indépendant' || c === 'Non affilié') return;
      const existing = map.get(c.toLowerCase());
      if (!existing) {
        map.set(c.toLowerCase(), {
          club: c,
          athletes: new Set([r.athleteName]),
          count: 1,
        });
      } else {
        existing.athletes.add(r.athleteName);
        existing.count++;
      }
    });

    return Array.from(map.values())
      .map(entry => ({
        club: entry.club,
        athletesCount: entry.athletes.size,
        recordsCount: entry.count,
      }))
      .sort((a, b) => b.athletesCount - a.athletesCount);
  }, [records]);

  // Club sélectionné : club de l'utilisateur en priorité, sinon le club ayant le plus d'athlètes
  const defaultClub = useMemo(() => {
    if (userClub && clubsSummary.some(c => c.club.toLowerCase() === userClub.toLowerCase())) {
      return userClub;
    }
    return clubsSummary[0]?.club || 'Clermont Auvergne Athletisme';
  }, [userClub, clubsSummary]);

  const [selectedClub, setSelectedClub] = useState<string>(defaultClub);
  const [clubSearchTerm, setClubSearchTerm] = useState<string>('');

  // Saisons disponibles
  const availableSeasons = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.saisonLabel) set.add(r.saisonLabel);
      else if (r.saison) set.add(r.saison === 2026 ? '2025-2026' : `${r.saison - 1}-${r.saison}`);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const [selectedSeason, setSelectedSeason] = useState<string>(availableSeasons[0] || '2025-2026');

  // Type de compétition
  const [competitionType, setCompetitionType] = useState<CompetitionType>('CHAMPIONNAT_FRANCE_CLUBS');
  const [genderMode, setGenderMode] = useState<CompetitionGenderMode>('MIXED');
  const [activeFamilyFilter, setActiveFamilyFilter] = useState<string>('ALL');

  // Paramètres personnalisés
  const [isRulesExpanded, setIsRulesExpanded] = useState<boolean>(false);
  const [customAthletesPerEvent, setCustomAthletesPerEvent] = useState<number | null>(null);
  const [customMaxEventsPerAthlete, setCustomMaxEventsPerAthlete] = useState<number | null>(null);
  const [customAllowDouble, setCustomAllowDouble] = useState<boolean | null>(null);
  const [customCategories, setCustomCategories] = useState<CategoryCode[] | null>(null);

  // Modal d'ajustement manuel d'un athlète
  const [manualSlotToEdit, setManualSlotToEdit] = useState<{
    eventId: string;
    discipline: string;
    sexe: 'M' | 'F';
    slotIndex: number;
    currentAthleteName?: string;
  } | null>(null);

  // Remplacements manuels effectués par l'utilisateur
  // Clé: `eventId-slotIndex` -> athleteName
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});

  // Réinitialiser les modifications manuelles quand on change de club ou de compétition
  const handleResetManualOverrides = () => {
    setManualOverrides({});
  };

  // Règles actives
  const activePreset = COMPETITION_PRESETS[competitionType] || COMPETITION_PRESETS.CHAMPIONNAT_FRANCE_CLUBS;

  const currentRules: Partial<CompetitionRules> = useMemo(() => {
    return {
      athletesPerEvent: customAthletesPerEvent !== null ? customAthletesPerEvent : activePreset.athletesPerEvent,
      maxEventsPerAthlete: customMaxEventsPerAthlete !== null ? customMaxEventsPerAthlete : activePreset.maxEventsPerAthlete,
      allowDouble: customAllowDouble !== null ? customAllowDouble : activePreset.allowDouble,
      eligibleCategories: customCategories !== null ? customCategories : activePreset.eligibleCategories,
    };
  }, [customAthletesPerEvent, customMaxEventsPerAthlete, customAllowDouble, customCategories, activePreset]);

  // Lancement du solveur d'optimisation
  const rawComposition = useMemo(() => {
    return optimizeTeamComposition(records, {
      club: selectedClub,
      season: selectedSeason,
      competitionType,
      customRules: currentRules,
      genderFilter: genderMode,
    });
  }, [records, selectedClub, selectedSeason, competitionType, currentRules, genderMode]);

  // Appliquer les remplacements manuels s'il y en a
  const teamComposition = useMemo(() => {
    if (Object.keys(manualOverrides).length === 0) {
      return rawComposition;
    }

    // Clone et réaffectation
    const updatedEvents = rawComposition.events.map(ev => {
      const updatedSlots = ev.assignedSlots.map(slot => {
        const overrideKey = `${ev.eventId}-${slot.slotIndex}`;
        const overrideName = manualOverrides[overrideKey];
        if (overrideName) {
          // Trouver le meilleur record de cet athlète sur cette épreuve
          const candRecord = records.find(r => 
            r.athleteName.toLowerCase() === overrideName.toLowerCase() &&
            r.discipline.toLowerCase().includes(ev.discipline.toLowerCase()) &&
            r.sexe === ev.sexe
          );
          if (candRecord) {
            return {
              ...slot,
              record: candRecord,
              points: candRecord.pointsFFA || 550,
              performanceDisplay: candRecord.performanceDisplay,
              isAlternative: true,
            };
          }
        }
        return slot;
      });

      return {
        ...ev,
        assignedSlots: updatedSlots,
      };
    });

    // Recalculer le total des points
    let newTotal = 0;
    const newPointsByFamily: Record<string, number> = {};
    const newPointsBySexe = { M: 0, F: 0 };
    const uniqueAthletes = new Set<string>();

    updatedEvents.forEach(ev => {
      ev.assignedSlots.forEach(s => {
        newTotal += s.points;
        if (s.record) uniqueAthletes.add(s.record.athleteName.toLowerCase());
        newPointsByFamily[ev.family] = (newPointsByFamily[ev.family] || 0) + s.points;
        if (ev.sexe === 'M') newPointsBySexe.M += s.points;
        if (ev.sexe === 'F') newPointsBySexe.F += s.points;
      });
    });

    return {
      ...rawComposition,
      totalPoints: newTotal,
      uniqueAthletesCount: uniqueAthletes.size,
      events: updatedEvents,
      pointsByFamily: newPointsByFamily,
      pointsBySexe: newPointsBySexe,
    };
  }, [rawComposition, manualOverrides, records]);

  // Filtrer les épreuves selon la famille
  const filteredEvents = useMemo(() => {
    if (activeFamilyFilter === 'ALL') return teamComposition.events;
    return teamComposition.events.filter(e => e.family === activeFamilyFilter);
  }, [teamComposition.events, activeFamilyFilter]);

  // Candidats potentiels pour le modal d'ajustement manuel
  const candidatesForModal = useMemo(() => {
    if (!manualSlotToEdit) return [];
    const clubAthletes = records.filter(r => {
      const c = (r.club || '').toLowerCase().trim();
      const target = selectedClub.toLowerCase().trim();
      return (c.includes(target) || target.includes(c)) && r.sexe === manualSlotToEdit.sexe;
    });

    // Trouver tous les athlètes ayant une perf sur cette épreuve
    const matchingAthletesMap = new Map<string, PerformanceRecord>();
    clubAthletes.forEach(r => {
      if (r.discipline.toLowerCase().includes(manualSlotToEdit.discipline.toLowerCase())) {
        const existing = matchingAthletesMap.get(r.athleteName);
        if (!existing || (r.pointsFFA || 0) > (existing.pointsFFA || 0)) {
          matchingAthletesMap.set(r.athleteName, r);
        }
      }
    });

    return Array.from(matchingAthletesMap.values()).sort((a, b) => (b.pointsFFA || 0) - (a.pointsFFA || 0));
  }, [manualSlotToEdit, records, selectedClub]);

  // Export Excel
  const handleExportExcel = () => {
    exportTeamCompositionToExcel(teamComposition, `Compo_${selectedClub.replace(/\s+/g, '_')}`);
  };

  // Export Word
  const handleExportWord = () => {
    const sections = [
      {
        heading: '1. Informations Générales & Règlement',
        text: `Club : ${teamComposition.club} | Saison : ${teamComposition.season} | Compétition : ${teamComposition.competitionName} | Total Points FFA Projetés : ${teamComposition.totalPoints} pts | Taux de couverture : ${teamComposition.filledSlots}/${teamComposition.totalSlots} slots (${teamComposition.uniqueAthletesCount} athlètes mobilisés).`,
      },
      {
        heading: '2. Composition Détaillée des Titulaires',
        tableHeaders: ['Épreuve', 'Sexe', 'Famille', 'Titulaire 1', 'Perf 1', 'Points 1', 'Titulaire 2', 'Perf 2', 'Points 2', 'Remplaçant'],
        tableRows: teamComposition.events.map(ev => {
          const t1 = ev.assignedSlots[0];
          const t2 = ev.assignedSlots[1];
          const sub = ev.substituteCandidate;
          return [
            ev.discipline,
            ev.sexe,
            ev.family,
            t1?.record?.athleteName || '—',
            t1?.performanceDisplay || '—',
            String(t1?.points || 0),
            t2?.record?.athleteName || (ev.requiredAthletes > 1 ? '—' : 'N/R'),
            t2?.performanceDisplay || '—',
            String(t2?.points || (ev.requiredAthletes > 1 ? 0 : '—')),
            sub ? `${sub.record.athleteName} (${sub.points} pts)` : '—',
          ];
        }),
      },
      ...(teamComposition.unassignedAthletes.length > 0 ? [{
        heading: '3. Réserve du Club (Athlètes Disponibles)',
        tableHeaders: ['Athlète', 'Sexe', 'Catégorie', 'Meilleure Épreuve', 'Points FFA Record'],
        tableRows: teamComposition.unassignedAthletes.map(a => [
          a.athleteName,
          a.sexe,
          a.categorie,
          a.bestEvent,
          String(a.bestPoints),
        ]),
      }] : []),
    ];

    exportToWord(
      `Composition d'Équipe Officielle : ${teamComposition.club}`,
      `${teamComposition.competitionName} · Total : ${teamComposition.totalPoints} Points FFA`,
      sections,
      `Compo_Equipe_${selectedClub.replace(/\s+/g, '_')}`
    );
  };

  const completionPercent = Math.round((teamComposition.filledSlots / (teamComposition.totalSlots || 1)) * 100);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-400 mb-1">
            <Users className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Stratégie & Compétitions par Équipes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Composition des Équipes</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-900/40 text-sky-300 border border-blue-700/50 font-mono font-bold">
              Optimiseur FFA
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1.5">
            <span>Génération automatique de la meilleure équipe possible</span>
            <span aria-hidden="true">·</span>
            <span>Maximisation des points FFA</span>
            <span aria-hidden="true">·</span>
            <span>Prise en compte des doublés & règlements officiels</span>
          </div>
        </div>

        {/* Boutons d'export */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            title="Exporter la feuille d'équipe complète sous Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-sky-300 border border-blue-700/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            title="Générer le dossier officiel Word de composition"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Rapport Word</span>
          </button>
        </div>
      </div>

      {/* 2. BARRE DE FILTRES : CLUB, SAISON, COMPÉTITION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Sélection du Club */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>1. Club à aligner</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {clubsSummary.find(c => c.club === selectedClub)?.athletesCount || 0} athlètes détectés
              </span>
            </label>
            <select
              value={selectedClub}
              onChange={(e) => {
                setSelectedClub(e.target.value);
                handleResetManualOverrides();
              }}
              className="w-full bg-slate-950 border border-slate-700 hover:border-sky-500 rounded-xl px-3 py-2 text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
            >
              {clubsSummary.map(c => (
                <option key={c.club} value={c.club}>
                  {c.club} ({c.athletesCount} athlètes · {c.recordsCount} perfs)
                </option>
              ))}
            </select>
          </div>

          {/* Sélection de la Saison */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Saison des performances</span>
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => {
                setSelectedSeason(e.target.value);
                handleResetManualOverrides();
              }}
              className="w-full bg-slate-950 border border-slate-700 hover:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Toutes saisons confondues</option>
              {availableSeasons.map(s => (
                <option key={s} value={s}>
                  Saison {s}
                </option>
              ))}
            </select>
          </div>

          {/* Genre / Sexe de l'équipe */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>3. Format de l'équipe</span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setGenderMode('MIXED')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  genderMode === 'MIXED'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mixte (H/F)
              </button>
              <button
                onClick={() => setGenderMode('M')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  genderMode === 'M'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hommes
              </button>
              <button
                onClick={() => setGenderMode('F')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  genderMode === 'F'
                    ? 'bg-pink-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Femmes
              </button>
            </div>
          </div>

        </div>

        {/* 3. SÉLECTEUR DE TYPE DE COMPÉTITION (Avec badges des règlements) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>4. Type de compétition officielle FFA</span>
            </span>
            <button
              onClick={() => setIsRulesExpanded(!isRulesExpanded)}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{isRulesExpanded ? 'Masquer les règles avancées' : 'Personnaliser les règles'}</span>
              {isRulesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
            {[
              { id: 'CHAMPIONNAT_FRANCE_CLUBS', label: 'Chpt de France Clubs', sub: 'Interclubs (CA à MA)', icon: Trophy },
              { id: 'INTERCLUBS_AVENIR_U23_N1', label: 'Interclubs U23 N1', sub: 'CA, JU, ES · 2/épr.', icon: Medal },
              { id: 'INTERCLUBS_AVENIR_U23_N2', label: 'Interclubs U23 N2', sub: 'CA, JU, ES · 1/épr.', icon: Medal },
              { id: 'INTERCLUBS_AVENIR_U20_N1', label: 'Interclubs U20 N1', sub: 'CA, JU · 2/épr.', icon: Medal },
              { id: 'INTERCLUBS_AVENIR_U20_N2', label: 'Interclubs U20 N2', sub: 'CA, JU · 1/épr.', icon: Medal },
              { id: 'EQUIP_ATHLE_BE', label: "Équip'Athlé BE", sub: 'Benjamins (Triathlon)', icon: Sparkles },
              { id: 'EQUIP_ATHLE_MI', label: "Équip'Athlé MI", sub: 'Minimes (Triathlon)', icon: Sparkles },
              { id: 'AUTRES', label: 'Autres / Sur-mesure', sub: 'Règles personnalisées', icon: SlidersHorizontal },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = competitionType === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCompetitionType(item.id as CompetitionType);
                    handleResetManualOverrides();
                    // Réinitialiser les surcharges personnalisées
                    setCustomAthletesPerEvent(null);
                    setCustomMaxEventsPerAthlete(null);
                    setCustomAllowDouble(null);
                    setCustomCategories(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-sky-500 shadow-md ring-1 ring-sky-500/30'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. TIROIR DES RÈGLES AVANCÉES (ACCORDÉON) */}
        {isRulesExpanded && (
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4 animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                <span>Paramètres des Règles Fédérales & Doublés</span>
              </span>
              <button
                onClick={() => {
                  setCustomAthletesPerEvent(null);
                  setCustomMaxEventsPerAthlete(null);
                  setCustomAllowDouble(null);
                  setCustomCategories(null);
                }}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Rétablir les valeurs par défaut
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Nombre d'athlètes par épreuve */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Nombre d'athlètes par épreuve :
                </label>
                <select
                  value={currentRules.athletesPerEvent}
                  onChange={(e) => setCustomAthletesPerEvent(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value={1}>1 athlète par épreuve (ex: N2, Promotion)</option>
                  <option value={2}>2 athlètes par épreuve (ex: Elite, N1)</option>
                  <option value={3}>3 athlètes par épreuve</option>
                </select>
              </div>

              {/* Nombre max d'épreuves par athlète */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Max épreuves par athlète (hors relais) :
                </label>
                <select
                  value={currentRules.maxEventsPerAthlete}
                  onChange={(e) => setCustomMaxEventsPerAthlete(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value={1}>1 épreuve individuelle max</option>
                  <option value={2}>2 épreuves max (avec doublé)</option>
                  <option value={3}>3 épreuves max (Triathlon Équip'Athlé)</option>
                </select>
              </div>

              {/* Autorisation de doublé */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Doublés autorisés :
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="allowDouble"
                      checked={currentRules.allowDouble === true}
                      onChange={() => setCustomAllowDouble(true)}
                    />
                    <span>Oui (autorisé)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="allowDouble"
                      checked={currentRules.allowDouble === false}
                      onChange={() => setCustomAllowDouble(false)}
                    />
                    <span>Non (1 athlète = 1 épreuve)</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Catégories d'âge éligibles */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <label className="text-slate-300 font-semibold block">
                Catégories d'âge autorisées pour cette compétition :
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {(['BE', 'MI', 'CA', 'JU', 'ES', 'SE', 'MA'] as CategoryCode[]).map(cat => {
                  const isChecked = (currentRules.eligibleCategories || []).includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        const current = currentRules.eligibleCategories || [];
                        const updated = isChecked ? current.filter(c => c !== cat) : [...current, cat];
                        setCustomCategories(updated);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                        isChecked
                          ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                          : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {cat} {isChecked ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              ℹ️ Règles appliquées : {activePreset.doubleRulesDescription}
            </p>
          </div>
        )}

      </div>

      {/* 5. TABLEAU DE BORD DES PERFORMANCES DU MATCH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Total Points FFA */}
        <div className="bg-gradient-to-br from-blue-900/60 via-slate-900 to-slate-900 border border-blue-700/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Équipe</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {teamComposition.totalPoints.toLocaleString('fr-FR')}{' '}
            <span className="text-xs font-normal text-sky-300">pts FFA</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Moyenne : <strong className="text-slate-200">{teamComposition.filledSlots > 0 ? Math.round(teamComposition.totalPoints / teamComposition.filledSlots) : 0} pts</strong> / perf
          </div>
        </div>

        {/* Couverture des épreuves */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Couverture</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {teamComposition.filledSlots} / {teamComposition.totalSlots}{' '}
            <span className="text-xs font-semibold text-emerald-400">({completionPercent}%)</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div 
              className={`h-full transition-all duration-500 ${
                completionPercent >= 90 ? 'bg-emerald-500' : (completionPercent >= 60 ? 'bg-amber-500' : 'bg-rose-500')
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Athlètes uniques mobilisés */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Athlètes engagés</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {teamComposition.uniqueAthletesCount}{' '}
            <span className="text-xs font-normal text-slate-400">titulaires</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Réserve du club : <strong className="text-slate-200">{teamComposition.unassignedAthletes.length}</strong> dispo
          </div>
        </div>

        {/* Équilibre Hommes / Femmes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Répartition H / F</span>
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xs space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-sky-300 font-bold">Hommes :</span>
              <span className="text-white font-bold">{teamComposition.pointsBySexe.M.toLocaleString('fr-FR')} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-pink-300 font-bold">Femmes :</span>
              <span className="text-white font-bold">{teamComposition.pointsBySexe.F.toLocaleString('fr-FR')} pts</span>
            </div>
          </div>
        </div>

        {/* Trous & Épreuves à combler */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Épreuves Vides</span>
            <AlertTriangle className={`w-4 h-4 ${teamComposition.totalSlots - teamComposition.filledSlots > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div className="text-2xl font-black text-white">
            {teamComposition.totalSlots - teamComposition.filledSlots}{' '}
            <span className="text-xs font-normal text-slate-400">slot(s) vide(s)</span>
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1">
            {teamComposition.totalSlots - teamComposition.filledSlots > 0 
              ? 'Athlètes à recruter ou doubler' 
              : 'Équipe complète à 100%'}
          </div>
        </div>

      </div>

      {/* 6. GRILLE DE COMPOSITION PAR ÉPREUVE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Barre d'onglets par famille */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'ALL', label: 'Toutes les épreuves' },
              { id: 'Sprint', label: 'Sprints' },
              { id: 'Haies', label: 'Haies' },
              { id: 'Demi-fond', label: 'Demi-fond' },
              { id: 'Sauts', label: 'Sauts' },
              { id: 'Lancers', label: 'Lancers' },
              { id: 'Marche', label: 'Marche' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFamilyFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFamilyFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>{filteredEvents.length} épreuves affichées</span>
            {Object.keys(manualOverrides).length > 0 && (
              <button
                onClick={handleResetManualOverrides}
                className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold ml-2"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Réinitialiser les ajustements manuels</span>
              </button>
            )}
          </div>
        </div>

        {/* Table de composition */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-3">Sexe</th>
                <th className="py-3 px-3">Épreuve</th>
                <th className="py-3 px-3">Famille</th>
                <th className="py-3 px-4">Titulaire 1</th>
                {currentRules.athletesPerEvent && currentRules.athletesPerEvent > 1 && (
                  <th className="py-3 px-4">Titulaire 2</th>
                )}
                <th className="py-3 px-4">Remplaçant Conseillé</th>
                <th className="py-3 px-3 text-right">Points Épreuve</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvents.map(ev => {
                const t1 = ev.assignedSlots[0];
                const t2 = ev.assignedSlots[1];
                const sub = ev.substituteCandidate;
                const eventPoints = (t1?.points || 0) + (t2?.points || 0);

                return (
                  <tr key={ev.eventId} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Sexe */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        ev.sexe === 'M' ? 'bg-blue-600/20 text-sky-300' : 'bg-pink-600/20 text-pink-300'
                      }`}>
                        {ev.sexe === 'M' ? 'HOMMES' : 'FEMMES'}
                      </span>
                    </td>

                    {/* Épreuve */}
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                      <button
                        onClick={() => onSelectDiscipline(ev.discipline)}
                        className="hover:text-sky-300 transition-colors underline cursor-pointer text-left"
                      >
                        {ev.discipline}
                      </button>
                    </td>

                    {/* Famille */}
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {ev.family}
                    </td>

                    {/* Titulaire 1 */}
                    <td className="py-3 px-4">
                      {t1?.record ? (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <button
                              onClick={() => onSelectAthlete(t1.record!.athleteName)}
                              className="font-bold text-white hover:text-sky-300 transition-colors text-left"
                            >
                              {t1.record.athleteName}
                            </button>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span className="text-purple-300 font-semibold">{t1.record.categorie}</span>
                              <span>·</span>
                              <span className="text-emerald-400 font-semibold">{t1.performanceDisplay}</span>
                              {t1.isAlternative && (
                                <span className="text-amber-400 font-bold ml-1">(Modifié)</span>
                              )}
                            </div>
                          </div>
                          <span className="font-extrabold text-sky-400 font-mono text-xs shrink-0">
                            {t1.points} pts
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs italic">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Slot non couvert</span>
                        </div>
                      )}
                    </td>

                    {/* Titulaire 2 */}
                    {currentRules.athletesPerEvent && currentRules.athletesPerEvent > 1 && (
                      <td className="py-3 px-4 border-l border-slate-800/40">
                        {t2?.record ? (
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <button
                                onClick={() => onSelectAthlete(t2.record!.athleteName)}
                                className="font-bold text-white hover:text-sky-300 transition-colors text-left"
                              >
                                {t2.record.athleteName}
                              </button>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span className="text-purple-300 font-semibold">{t2.record.categorie}</span>
                                <span>·</span>
                                <span className="text-emerald-400 font-semibold">{t2.performanceDisplay}</span>
                                {t2.isAlternative && (
                                  <span className="text-amber-400 font-bold ml-1">(Modifié)</span>
                                )}
                              </div>
                            </div>
                            <span className="font-extrabold text-sky-400 font-mono text-xs shrink-0">
                              {t2.points} pts
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs italic">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Slot non couvert</span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Remplaçant */}
                    <td className="py-3 px-4 border-l border-slate-800/40 text-slate-400">
                      {sub ? (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-medium text-slate-300">{sub.record.athleteName}</span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {sub.performanceDisplay} · {sub.record.categorie}
                            </div>
                          </div>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {sub.points} pts
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Aucun remplaçant</span>
                      )}
                    </td>

                    {/* Total points épreuve */}
                    <td className="py-3 px-3 text-right font-black font-mono text-sm text-white whitespace-nowrap">
                      {eventPoints > 0 ? (
                        <span className="text-emerald-400">{eventPoints} pts</span>
                      ) : (
                        <span className="text-slate-400">0 pt</span>
                      )}
                    </td>

                    {/* Bouton d'édition / remplacement manuel */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <button
                        onClick={() => setManualSlotToEdit({
                          eventId: ev.eventId,
                          discipline: ev.discipline,
                          sexe: ev.sexe,
                          slotIndex: 1,
                          currentAthleteName: t1?.record?.athleteName,
                        })}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white transition-colors cursor-pointer"
                        title="Changer manuellement l'athlète affecté"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* 7. RÉSERVE ET ATHLÈTES DISPONIBLES DU CLUB */}
      {teamComposition.unassignedAthletes.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-base text-white">
                Réserve du Club & Athlètes Non Retenus ({teamComposition.unassignedAthletes.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Athlètes licenciés disponibles pour suppléer ou remplacer un titulaire
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {teamComposition.unassignedAthletes.slice(0, 12).map(ath => (
              <div 
                key={ath.athleteName}
                onClick={() => onSelectAthlete(ath.athleteName)}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-slate-200 text-xs hover:text-sky-300 transition-colors">
                    {ath.athleteName}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {ath.sexe} · {ath.categorie} · {ath.bestEvent}
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-purple-300">
                  {ath.bestPoints} pts
                </span>
              </div>
            ))}
          </div>
          {teamComposition.unassignedAthletes.length > 12 && (
            <p className="text-[11px] text-slate-400 text-center pt-1 italic">
              ... et {teamComposition.unassignedAthletes.length - 12} autres athlètes disponibles dans le club.
            </p>
          )}
        </div>
      )}

      {/* MODAL DE REMPLACEMENT MANUEL */}
      {manualSlotToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Ajuster l'épreuve : {manualSlotToEdit.discipline} ({manualSlotToEdit.sexe === 'M' ? 'Hommes' : 'Femmes'})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Titulaire actuel : <strong>{manualSlotToEdit.currentAthleteName || 'Aucun'}</strong>
                </p>
              </div>
              <button
                onClick={() => setManualSlotToEdit(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Sélectionnez un athlète du club pour occuper ce slot :
            </p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 no-scrollbar pr-1">
              {candidatesForModal.length > 0 ? (
                candidatesForModal.map(cand => (
                  <button
                    key={cand.id}
                    onClick={() => {
                      const key = `${manualSlotToEdit.eventId}-${manualSlotToEdit.slotIndex}`;
                      setManualOverrides(prev => ({
                        ...prev,
                        [key]: cand.athleteName,
                      }));
                      setManualSlotToEdit(null);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-blue-600/20 border border-slate-800 hover:border-sky-500/50 flex items-center justify-between text-left transition-all cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{cand.athleteName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {cand.categorie} · Perf : {cand.performanceDisplay}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-sky-400 font-mono">
                      {cand.pointsFFA || 550} pts
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Aucun athlète du club n'a de performance enregistrée sur cette discipline.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setManualSlotToEdit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export const TeamCompositionView = React.memo(TeamCompositionViewComponent);
