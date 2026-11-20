import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  UserCheck, 
  Trophy, 
  GitCompare, 
  FileSpreadsheet, 
  ShieldAlert, 
  Medal,
  Users,
  Award,
  Flag,
  Activity
} from 'lucide-react';
import { UserAccount } from '../types/athletics';

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserAccount | null;
  unreadMessagesCount?: number;
}

const NavigationComponent: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  unreadMessagesCount = 0,
}) => {
  // Tant que l'utilisateur n'est pas connecté, aucun onglet ne doit s'afficher
  if (!currentUser) {
    return null;
  }

  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'bilan', label: 'Bilans', icon: Trophy },
    { id: 'compet-nat', label: 'Compet Nat.', icon: Flag },
    { id: 'team-composition', label: 'Compo des équipes', icon: Users },
    { id: 'athlete', label: 'Fiches Athlètes', icon: UserCheck },
    { id: 'discipline', label: 'Fiches Disciplines', icon: Medal },
    { id: 'shn', label: 'Listes SHN', icon: Award },
    { id: 'stats-shn', label: 'Stats SHN', icon: Activity },
    { id: 'comparison', label: 'Comparateur', icon: GitCompare },
    ...(isAdmin ? [
      { id: 'import', label: 'Import & CSV', icon: FileSpreadsheet },
      { id: 'admin', label: 'Administration & 2FA', icon: ShieldAlert }
    ] : []),
  ];

  return (
    <>
      {/* DESKTOP NAV BAR : MASQUÉE SUR LE TABLEAU DE BORD
          (Sur le tableau de bord, la navigation se fait exclusivement via les boutons cliquables
          directement positionnés sous la bannière avec la photo, bonjour, mon profil et messagerie) */}
      {activeTab !== 'dashboard' && (
        <nav className="hidden md:block bg-slate-900/70 border-b border-slate-800/80 sticky top-16 z-30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1.5 py-2 overflow-x-auto no-scrollbar">
              {/* Bouton retour vers le Tableau de bord */}
              <button
                onClick={() => onSelectTab('dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-400 hover:text-sky-300 hover:bg-blue-600/10 border border-blue-500/20 transition-all cursor-pointer mr-2 shadow-sm"
                title="Revenir à la page principale du Tableau de bord"
              >
                <span>← Tableau de bord</span>
              </button>

              {navItems.filter(i => i.id !== 'dashboard').map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/20 text-sky-400 border border-blue-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.id === 'admin' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* MOBILE BOTTOM APP BAR (iOS / Android Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800 backdrop-blur-lg safe-bottom">
        <div className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} px-1 py-1.5`}>
          {navItems.filter(i => ['dashboard', 'bilan', 'athlete', ...(isAdmin ? ['admin'] : [])].includes(i.id)).map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors cursor-pointer relative ${
                  isActive ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                </div>
                <span className="text-[10px] truncate max-w-full leading-none">
                  {item.id === 'dashboard' ? 'Tableau' : item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export const Navigation = React.memo(NavigationComponent);
