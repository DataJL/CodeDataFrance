import React from 'react';
import { 
  Bell, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Smartphone, 
  Download, 
  PlusCircle,
  Database,
  FlaskConical,
  MessageSquare,
  Mail
} from 'lucide-react';
import { AppNotification, UserAccount } from '../types/athletics';
import { AppLogo } from './AppLogo';
import { UserAvatar } from './UserAvatar';

interface HeaderProps {
  currentUser: UserAccount | null;
  unreadCount: number;
  unreadMessagesCount?: number;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  totalRecordsCount: number;
  onOpenTestGuide: () => void;
  onOpenContact: () => void;
  onOpenProfile?: () => void;
  activeTab?: string;
}

const HeaderComponent: React.FC<HeaderProps> = ({
  currentUser,
  unreadCount,
  unreadMessagesCount = 0,
  onOpenNotifications,
  onLogout,
  onNavigate,
  totalRecordsCount,
  onOpenTestGuide,
  onOpenProfile,
  activeTab,
}) => {
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => onNavigate(currentUser ? 'dashboard' : 'home')}
              className="cursor-pointer group select-none"
              title="Data France Athlé - Accueil"
            >
              <AppLogo variant="header" size="md" />
            </div>

            {/* Bouton direct de retour au Tableau de bord si on est sur une autre sous-page */}
            {currentUser && activeTab && activeTab !== 'dashboard' && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-sky-300 border border-blue-500/30 text-xs font-semibold cursor-pointer transition-all shadow-sm"
                title="Revenir à la page principale du Tableau de bord"
              >
                <span>← Tableau de bord</span>
              </button>
            )}
          </div>

          {/* Quick Metrics & Actions - UNIQUEMENT SI CONNECTÉ */}
          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Base counter (cliquable vers import uniquement si administrateur) */}
              <div 
                onClick={() => {
                  if (isAdmin) onNavigate('import');
                }}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 transition-colors ${
                  isAdmin ? 'hover:border-slate-700 cursor-pointer' : 'cursor-default'
                }`}
                title={isAdmin ? "Gérer les données et importer CSV (Admin)" : "Base de données fédérale officielle"}
              >
                <Database className="w-3.5 h-3.5 text-sky-400" />
                <span>{totalRecordsCount.toLocaleString()} perfs</span>
              </div>

              {/* Bouton Guide de Test & Recette QA */}
              <button
                onClick={onOpenTestGuide}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-all shadow-sm"
                title="Cahier de test et validation avant publication"
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Guide de Test</span>
              </button>

              {/* Bouton Messagerie & Amis avec Pastille de Badge */}
              <button
                onClick={() => onNavigate('messages')}
                className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Messagerie interne & Amis"
                aria-label="Messagerie"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center px-1 rounded-full bg-blue-600 text-[10px] font-bold text-white border-2 border-slate-950 shadow-sm animate-pulse">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </span>
                )}
              </button>

              {/* Pastille de notifications (App Icon Badge) */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Centre de notifications & Mises à jour"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white border-2 border-slate-950 shadow-sm animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User Session Profile (Ouvre le modal de profil ou admin) */}
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all text-left"
                  title="Accéder à mon profil et modifier mes informations / photo"
                >
                  <UserAvatar user={currentUser} size="sm" />
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-semibold text-slate-200 leading-tight">
                      {currentUser.firstName} {currentUser.lastName}
                    </p>
                    <p className="text-[10px] text-sky-400 flex items-center gap-1">
                      {currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : (currentUser.role === 'ADMIN' ? 'Admin' : 'Entraîneur')}
                      {currentUser.isTwoFactorEnabled && (
                        <span title="2FA Sécurisé">
                          <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                        </span>
                      )}
                    </p>
                  </div>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/40 transition-colors cursor-pointer"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export const Header = React.memo(HeaderComponent);
