import React, { useMemo } from 'react';
import { 
  Trophy, 
  BarChart3, 
  UserCheck, 
  Medal, 
  GitCompare, 
  FileSpreadsheet, 
  ShieldAlert, 
  Camera, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles,
  Users,
  Award,
  Flag,
  Activity
} from 'lucide-react';
import { PerformanceRecord, UserAccount } from '../../types/athletics';
import { UserAvatar } from '../UserAvatar';

interface DashboardViewProps {
  records: PerformanceRecord[];
  currentUser: UserAccount | null;
  onSelectAthlete?: (athleteName: string) => void;
  onSelectDiscipline?: (discipline: string) => void;
  onNavigate: (tab: string) => void;
  onOpenProfile: () => void;
  unreadMessagesCount?: number;
}

const DashboardViewComponent: React.FC<DashboardViewProps> = ({
  records,
  currentUser,
  onNavigate,
  onOpenProfile,
  unreadMessagesCount = 0,
}) => {
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  // Statistiques synthétiques discrètes pour les badges des boutons (mémoïsé sans allocation d'array)
  const uniqueAthletesCount = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < records.length; i++) {
      const name = records[i].athleteName;
      if (name) s.add(name);
    }
    return s.size;
  }, [records]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. BANDEAU PERSONNEL DE L'UTILISATEUR CONNECTÉ                */}
      {/*    (Photo, Bonjour..., Mon Profil, Messagerie)                */}
      {/* ------------------------------------------------------------- */}
      {currentUser && (
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div 
              className="relative cursor-pointer group" 
              onClick={onOpenProfile} 
              title="Modifier ma photo de profil"
            >
              <UserAvatar 
                user={currentUser} 
                size="xl" 
                className="ring-2 ring-blue-500/50 group-hover:ring-blue-400 transition-all" 
              />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-blue-600 text-white text-[10px] shadow group-hover:scale-110 transition-transform">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Bonjour, {currentUser.firstName} {currentUser.lastName} !
                </h2>
                {currentUser.isTwoFactorEnabled && (
                  <span title="Compte sécurisé par 2FA">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 inline" />
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {currentUser.role === 'SUPER_ADMIN' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Super Administrateur
                  </span>
                )}
                {currentUser.role === 'ADMIN' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Administrateur
                  </span>
                )}
                {currentUser.statuses && currentUser.statuses.length > 0 ? (
                  currentUser.statuses.map((st, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/30"
                    >
                      {st}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/30">
                    {currentUser.role === 'ATHLETE' ? 'Athlète' : 'Entraîneur'}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  · {currentUser.club 
                      ? (currentUser.region ? `${currentUser.club} (${currentUser.region})` : currentUser.club) 
                      : (currentUser.region ? `Ligue ${currentUser.region}` : "Fédération Française d'Athlétisme")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenProfile}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              title="Modifier mes informations personnelles, nom, prénom, mail et photo"
            >
              <Camera className="w-4 h-4 text-sky-400" />
              <span>Mon Profil</span>
            </button>
            <button
              onClick={() => onNavigate('messages')}
              className="py-2.5 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-sky-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm relative"
            >
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Messagerie</span>
              {unreadMessagesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm ml-1">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. BOUTONS CLIQUABLES DU TABLEAU DE BORD :                    */}
      {/*    - Bilan                                                    */}
      {/*    - Analyses & filtres                                       */}
      {/*    - Fiches athlètes                                          */}
      {/*    - Fiches disciplines                                       */}
      {/*    - Comparateur                                              */}
      {/*    - Import & CSV (uniquement pour administrateurs)           */}
      {/*    - Administration (uniquement pour administrateurs)         */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Modules & Outils du Tableau de Bord</span>
          </h3>
          <span className="text-[11px] text-slate-400">Accès direct en 1 clic</span>
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-3 ${isAdmin ? 'lg:grid-cols-4 xl:grid-cols-9' : 'lg:grid-cols-3 xl:grid-cols-7'} gap-3`}>
          {/* 1. Bilans */}
          <button
            onClick={() => onNavigate('bilan')}
            className="p-4 rounded-2xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 hover:border-blue-500/60 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-sky-400 mb-1.5">
                <Trophy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                  Bilans
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Bilans fédéraux</p>
            </div>
          </button>

          {/* 2. Compet Nat. */}
          <button
            onClick={() => onNavigate('compet-nat')}
            className="p-4 rounded-2xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/40 hover:border-rose-500/60 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-rose-400 mb-1.5">
                <Flag className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                  Compet Nat.
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Résultats & Placing Table</p>
            </div>
          </button>

          {/* 2. Compo des équipes */}
          <button
            onClick={() => onNavigate('team-composition')}
            className="p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Compo équipes
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Interclubs & Équip'Athlé</p>
            </div>
          </button>

          {/* 3. Fiches athlètes */}
          <button
            onClick={() => onNavigate('athlete')}
            className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                <UserCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Fiches athlètes
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{uniqueAthletesCount} référencés</p>
            </div>
          </button>

          {/* 4. Fiches disciplines */}
          <button
            onClick={() => onNavigate('discipline')}
            className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/40 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-purple-400 mb-1.5">
                <Medal className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Fiches disciplines
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Statistiques par épreuve</p>
            </div>
          </button>

          {/* 5. Listes SHN (Sportifs de Haut Niveau) */}
          <button
            onClick={() => onNavigate('shn')}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/20 to-slate-900/90 hover:from-amber-950/35 hover:to-slate-850 border border-slate-800 hover:border-amber-500/50 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                <Award className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Listes SHN
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Élite, Sénior, Relève, Espoir</p>
            </div>
          </button>

          {/* 6. Stats SHN (Biomécanique & Rapports Scientifiques) */}
          <button
            onClick={() => onNavigate('stats-shn')}
            className="p-4 rounded-2xl bg-indigo-950/20 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-indigo-400 mb-1.5">
                <Activity className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Stats SHN
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Biomécanique & Rapports IAAF</p>
            </div>
          </button>

          {/* 6. Comparateur */}
          <button
            onClick={() => onNavigate('comparison')}
            className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/40 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-indigo-400 mb-1.5">
                <GitCompare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Comparateur
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Face-à-face d'athlètes</p>
            </div>
          </button>

          {/* 6. Import & CSV (SEULEMENT POUR LES ADMINISTRATEURS) */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('import')}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/40 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-teal-400 mb-1.5">
                  <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                    Import & CSV
                  </span>
                </div>
                <p className="text-[11px] text-teal-400/80 font-mono">Admin uniquement</p>
              </div>
            </button>
          )}

          {/* 7. Administration (SEULEMENT POUR LES ADMINISTRATEURS) */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/40 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-rose-400 mb-1.5">
                  <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                    Administration
                  </span>
                </div>
                <p className="text-[11px] text-rose-400/80 font-mono">Gestion & 2FA</p>
              </div>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export const DashboardView = React.memo(DashboardViewComponent);
