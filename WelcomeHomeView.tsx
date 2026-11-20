import React, { useState } from 'react';
import { 
  UserPlus, 
  LogIn, 
  Mail, 
  Shield, 
  ArrowRight, 
  Sparkles, 
  LayoutDashboard, 
  MessageSquare, 
  LogOut,
  UserCheck
} from 'lucide-react';
import { PerformanceRecord, UserAccount } from '../../types/athletics';
import { AppLogo } from '../AppLogo';
import { AuthModal } from '../AuthModal';
import { ContactAdminModal } from '../ContactAdminModal';
import { UserAvatar } from '../UserAvatar';

interface WelcomeHomeViewProps {
  currentUser: UserAccount | null;
  onLoginSuccess: (user: UserAccount) => void;
  onExploreAsGuest: () => void;
  onNavigateTab: (tab: string) => void;
  onLogout: () => void;
  records?: PerformanceRecord[];
}

const WelcomeHomeViewComponent: React.FC<WelcomeHomeViewProps> = ({
  currentUser,
  onLoginSuccess,
  onExploreAsGuest,
  onNavigateTab,
  onLogout,
}) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleOpenRegister = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  const handleOpenLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-8 px-4 animate-fade-in relative overflow-hidden">
      
      {/* Background ambient subtle glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Presentation Card */}
      <div className="relative z-10 max-w-3xl w-full text-center space-y-8">
        
        {/* 1. LOGO */}
        <div className="flex justify-center transform hover:scale-105 transition-transform duration-300">
          <div className="p-3 sm:p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-md">
            <AppLogo variant="hero" size="xl" showSubtitle={false} />
          </div>
        </div>

        {/* 2. LE NOM */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
            Data France Athlé
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Plateforme Officielle d'Analyse et de Reporting Fédéral</span>
          </div>
        </div>

        {/* 3. LE PARAGRAPHE REQUIS */}
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            L'excellence de l'athlétisme français au cœur de vos données : analysez vos performances à partir de fichiers CSV, suivez l'évolution des records personnels (RP), comparez les athlètes par discipline et entraîneur, et éditez des rapports officiels certifiés en <strong>Excel, Word et PDF</strong>.
          </p>
        </div>

        {/* 4. LES 3 BOUTONS D'ACTION (OU BANDEAU CONNECTÉ) */}
        {!currentUser ? (
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 max-w-xl mx-auto">
            
            {/* Bouton Créer un compte */}
            <button
              onClick={handleOpenRegister}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-sm shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-sky-200" />
              <span>Créer un compte</span>
            </button>

            {/* Bouton Se connecter */}
            <button
              onClick={handleOpenLogin}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 hover:border-slate-500 shadow-lg flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-sky-400" />
              <span>Se connecter</span>
            </button>

            {/* Bouton Contacter l'administrateur */}
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-sky-300 hover:text-white font-bold text-sm border border-blue-500/30 hover:border-blue-500/60 shadow-lg flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              title="Envoyer un message à jerome.lucotte@yahoo.fr ou via l'application"
            >
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Contacter l'administrateur</span>
            </button>

          </div>
        ) : (
          /* Utilisateur déjà connecté */
          <div className="pt-4 space-y-4 max-w-xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3">
                <UserAvatar user={currentUser} size="lg" />
                <div>
                  <p className="text-xs text-slate-400">Connecté en tant que</p>
                  <p className="text-sm font-bold text-white">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-[11px] text-sky-400">
                    {currentUser.role === 'SUPER_ADMIN' ? 'Super Administrateur' : (currentUser.role === 'ADMIN' ? 'Administrateur' : 'Entraîneur')} · {currentUser.club || 'FFA'}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="flex-1 w-full py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Accéder aux Analyses & Données</span>
              </button>

              <button
                onClick={() => onNavigateTab('messages')}
                className="flex-1 w-full py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>Messagerie & Amis</span>
              </button>

              <button
                onClick={() => setIsContactModalOpen(true)}
                className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>Contacter l'admin</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setIsAuthModalOpen(false);
          onLoginSuccess(user);
        }}
        initialMode={authModalMode}
      />

      <ContactAdminModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        currentUser={currentUser}
        onOpenInternalChat={() => onNavigateTab('messages')}
        onOpenAuth={() => {
          setIsContactModalOpen(false);
          handleOpenLogin();
        }}
      />

    </div>
  );
};

export const WelcomeHomeView = React.memo(WelcomeHomeViewComponent);
