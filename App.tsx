import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { WelcomeHomeView } from './components/views/WelcomeHomeView';
import { DashboardView } from './components/views/DashboardView';
import { BilanGeneralView } from './components/views/BilanGeneralView';
import { NationalCompetitionsView } from './components/views/NationalCompetitionsView';
import { AthleteReportView } from './components/views/AthleteReportView';
import { DisciplineReportView } from './components/views/DisciplineReportView';
import { ComparisonView } from './components/views/ComparisonView';
import { SHNListView } from './components/views/SHNListView';
import { StatsSHNView } from './components/views/StatsSHNView';
import { TeamCompositionView } from './components/views/TeamCompositionView';
import { ImportExportView } from './components/views/ImportExportView';
import { AdminView } from './components/views/AdminView';
import { MessagesView } from './components/views/MessagesView';
import { AuthModal } from './components/AuthModal';
import { NotificationModal } from './components/NotificationModal';
import { TestGuideModal } from './components/TestGuideModal';
import { ContactAdminModal } from './components/ContactAdminModal';
import { ProfileModal } from './components/ProfileModal';
import { StorageService } from './services/storageService';
import { IDBStorage } from './utils/idbStorage';
import { AppNotification, PerformanceRecord, UserAccount } from './types/athletics';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [performances, setPerformances] = useState<PerformanceRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(['home', 'dashboard']));

  const handleSelectTab = useCallback((tab: string) => {
    setVisitedTabs(prev => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
    setActiveTab(tab);
  }, []);

  // Modals state & memoized modal handlers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isTestGuideOpen, setIsTestGuideOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenAuth = useCallback(() => setIsAuthModalOpen(true), []);
  const handleCloseAuth = useCallback(() => setIsAuthModalOpen(false), []);
  const handleOpenNotif = useCallback(() => setIsNotifModalOpen(true), []);
  const handleCloseNotif = useCallback(() => setIsNotifModalOpen(false), []);
  const handleOpenTestGuide = useCallback(() => setIsTestGuideOpen(true), []);
  const handleCloseTestGuide = useCallback(() => setIsTestGuideOpen(false), []);
  const handleOpenContact = useCallback(() => setIsContactModalOpen(true), []);
  const handleCloseContact = useCallback(() => setIsContactModalOpen(false), []);
  const handleOpenProfile = useCallback(() => setIsProfileModalOpen(true), []);
  const handleCloseProfile = useCallback(() => setIsProfileModalOpen(false), []);

  // Selected item states for cross-view navigation (aucun athlète sélectionné par défaut)
  const [selectedAthlete, setSelectedAthlete] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('100m-110');

  // Synchronisation dynamique lors du changement du jeu de données performances
  useEffect(() => {
    if (performances.length > 0 && selectedAthlete) {
      const exists = performances.some(p => p.athleteName.toLowerCase() === selectedAthlete.toLowerCase());
      if (!exists) {
        setSelectedAthlete('');
      }
    }
  }, [performances, selectedAthlete]);

  // Synchronisation globale des pastilles et notifications (In-app, Titre navigateur, PWA Icon)
  const refreshAllBadgesAndNotifs = useCallback(() => {
    const notifs = StorageService.getNotifications();
    setNotifications(notifs);
    const unreadNotifs = notifs.filter(n => !n.read).length;

    const user = StorageService.getCurrentUser();
    const unreadMsgs = StorageService.getUnreadMessagesCount(
      user?.id,
      user?.email,
      user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
    );
    setUnreadMessagesCount(unreadMsgs);

    const totalBadge = unreadNotifs + unreadMsgs;
    StorageService.updateAppBadge(totalBadge);
  }, []);

  // 1. Initial load (performances préservées en IndexedDB et session existante)
  useEffect(() => {
    StorageService.loadPersistedPerformancesAsync().then(perfs => {
      setPerformances(perfs);
    }).catch(e => {
      console.warn('IDB startup read error', e);
      setPerformances(StorageService.getPerformances());
    });

    const sessionUser = StorageService.getCurrentUser();
    if (sessionUser) {
      setCurrentUser(sessionUser);
    }
  }, []);

  // 2. Écouteurs d'événements de données et synchronisation des pastilles
  useEffect(() => {
    refreshAllBadgesAndNotifs();

    const handleMessagesChange = () => refreshAllBadgesAndNotifs();
    const handleNotifsChange = () => refreshAllBadgesAndNotifs();

    window.addEventListener('dfa_messages_changed', handleMessagesChange);
    window.addEventListener('dfa_notifications_changed', handleNotifsChange);

    return () => {
      window.removeEventListener('dfa_messages_changed', handleMessagesChange);
      window.removeEventListener('dfa_notifications_changed', handleNotifsChange);
    };
  }, [refreshAllBadgesAndNotifs]);

  // 3. Rafraîchir les badges lors d'une connexion / déconnexion
  useEffect(() => {
    refreshAllBadgesAndNotifs();
  }, [currentUser?.id, refreshAllBadgesAndNotifs]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Mise à jour des performances (Import CSV, Suppression ou Réinitialisation) - mémoïsé
  const handleUpdateRecords = useCallback((
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
  ) => {
    let finalDataset = newRecords;
    if (seasonMeta) {
      if (seasonMeta.replaceEntireDatabase) {
        finalDataset = StorageService.replaceEntireDatabaseWithOfficialFile(newRecords, {
          seasonLabel: seasonMeta.seasonLabel,
          startYear: seasonMeta.startYear,
          endYear: seasonMeta.endYear,
          structure: seasonMeta.structure,
          fileName: sourceFileName || 'Fichier officiel',
          totalLinesDetected: seasonMeta.totalLinesDetected,
          athleteCount: seasonMeta.athleteCount,
        });
      } else {
        finalDataset = StorageService.mergeOfficialSeasonRecords(performances, newRecords, {
          seasonLabel: seasonMeta.seasonLabel,
          startYear: seasonMeta.startYear,
          endYear: seasonMeta.endYear,
          structure: seasonMeta.structure,
          fileName: sourceFileName || 'Fichier officiel',
          totalLinesDetected: seasonMeta.totalLinesDetected,
          athleteCount: seasonMeta.athleteCount,
        });
      }
    }

    setPerformances(finalDataset);
    StorageService.savePerformances(finalDataset, {
      sourceFileName,
      isOfficial: true,
      season: seasonMeta?.endYear,
    });

    const isDeletion = sourceFileName?.startsWith('Suppression');

    if (sourceFileName && !isDeletion) {
      StorageService.setLastImportedFile({
        name: sourceFileName,
        date: new Date().toISOString(),
        count: importCount,
      });
    }

    // Notification et incrément de la pastille
    if (isDeletion) {
      StorageService.addNotification(
        'Suppression de Base Officielle',
        `${sourceFileName}. Le jeu de données actif compte désormais ${finalDataset.length.toLocaleString('fr-FR')} performances.`,
        'DATA_UPDATE'
      );
    } else {
      StorageService.addNotification(
        'Intégration de Nouvelles Données Athlé',
        `${importCount} nouvelles performances ont été intégrées avec succès à la base fédérale${seasonMeta ? ` pour la saison ${seasonMeta.seasonLabel} (${seasonMeta.structure === 'SALLE' ? 'Salle' : seasonMeta.structure === 'COMBINE' ? 'Plein air + salle' : 'Plein air'})` : ''}${sourceFileName ? ` depuis "${sourceFileName}"` : ''}.`,
        'DATA_UPDATE'
      );
    }
    const updatedNotifs = StorageService.getNotifications();
    setNotifications(updatedNotifs);

    // Journal d'activité
    StorageService.logActivity(
      currentUser ? { id: currentUser.id, email: currentUser.email, name: `${currentUser.firstName} ${currentUser.lastName}` } : null,
      isDeletion ? 'MODIFICATION_DONNEES' : 'IMPORT_CSV',
      isDeletion 
        ? `${sourceFileName} (${finalDataset.length.toLocaleString('fr-FR')} performances restantes)`
        : `Importation réussie de ${importCount} performances via fichier ${sourceFileName || 'CSV/TXT'}`
    );
  }, [performances, currentUser]);

  // Gestion des notifications
  const handleMarkAllAsRead = useCallback(() => {
    StorageService.markAllNotificationsAsRead();
    const updated = StorageService.getNotifications();
    setNotifications(updated);
  }, []);

  const handleTriggerSimulatedNotification = useCallback((title: string, message: string, type: AppNotification['type']) => {
    StorageService.addNotification(title, message, type);
    const updated = StorageService.getNotifications();
    setNotifications(updated);
  }, []);

  // Navigation vers un athlète spécifique
  const handleNavigateToAthlete = useCallback((athleteName: string) => {
    setSelectedAthlete(athleteName);
    handleSelectTab('athlete');
  }, [handleSelectTab]);

  // Navigation vers une discipline spécifique
  const handleNavigateToDiscipline = useCallback((discipline: string) => {
    setSelectedDiscipline(discipline);
    handleSelectTab('discipline');
  }, [handleSelectTab]);

  const handleLogout = useCallback(() => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    handleSelectTab('home');
  }, [handleSelectTab]);

  const handleLoginSuccess = useCallback((user: UserAccount) => {
    setCurrentUser(user);
    handleSelectTab('dashboard');
  }, [handleSelectTab]);

  const handleExploreAsGuest = useCallback(() => {
    handleSelectTab('dashboard');
  }, [handleSelectTab]);

  const handleLoginAsSuperAdmin = useCallback(() => {
    const admin = StorageService.setOrResetOwnerAccount('jerome.lucotte@yahoo.fr', 'Athle2026!');
    StorageService.setCurrentUser(admin);
    setCurrentUser(admin);
    setActiveTab('admin');
  }, []);

  const handleResetDataToFactory = useCallback(() => {
    const initial = StorageService.resetToInitialData();
    setPerformances(initial);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* HEADER : UNIQUEMENT SI UTILISATEUR CONNECTÉ (Tant que non connecté, la page d'accueil est épurée sans barre supérieure ni icônes) */}
      {currentUser && (
        <Header
          currentUser={currentUser}
          unreadCount={unreadCount}
          unreadMessagesCount={unreadMessagesCount}
          onOpenNotifications={handleOpenNotif}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
          onNavigate={handleSelectTab}
          totalRecordsCount={performances.length}
          onOpenTestGuide={handleOpenTestGuide}
          onOpenContact={handleOpenContact}
          onOpenProfile={handleOpenProfile}
          activeTab={activeTab}
        />
      )}

      {/* NAVIGATION TABS (DESKTOP & MOBILE BOTTOM BAR) : UNIQUEMENT SI CONNECTÉ */}
      {currentUser && (
        <Navigation
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          currentUser={currentUser}
          unreadMessagesCount={unreadMessagesCount}
        />
      )}

      {/* MAIN CONTENT AREA : Gestion Keep-Alive ultra-rapide (les onglets déjà ouverts restent en mémoire avec 0ms de latence) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {/* 1ère Page d'accueil : Inscription & Connexion & Présentation épurée */}
        <div className={activeTab === 'home' ? 'block' : 'hidden'}>
          <WelcomeHomeView
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onExploreAsGuest={handleExploreAsGuest}
            onNavigateTab={handleSelectTab}
            onLogout={handleLogout}
            records={performances}
          />
        </div>

        {/* Tableau de bord */}
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <DashboardView
            records={performances}
            currentUser={currentUser}
            onSelectAthlete={handleNavigateToAthlete}
            onSelectDiscipline={handleNavigateToDiscipline}
            onNavigate={handleSelectTab}
            onOpenProfile={handleOpenProfile}
            unreadMessagesCount={unreadMessagesCount}
          />
        </div>

        {/* Bilans Fédéraux */}
        {visitedTabs.has('bilan') && (
          <div className={activeTab === 'bilan' ? 'block' : 'hidden'}>
            <BilanGeneralView
              records={performances}
              onSelectAthlete={handleNavigateToAthlete}
              onSelectDiscipline={handleNavigateToDiscipline}
              onNavigate={handleSelectTab}
              onUpdateRecords={handleUpdateRecords}
              currentUser={currentUser}
            />
          </div>
        )}

        {/* Compétitions Nationales (Compet Nat.) */}
        {(visitedTabs.has('compet-nat') || visitedTabs.has('national-competitions')) && (
          <div className={(activeTab === 'compet-nat' || activeTab === 'national-competitions') ? 'block' : 'hidden'}>
            <NationalCompetitionsView
              records={performances}
              onSelectAthlete={handleNavigateToAthlete}
              onSelectDiscipline={handleNavigateToDiscipline}
              onUpdateRecords={handleUpdateRecords}
              onNavigate={handleSelectTab}
            />
          </div>
        )}

        {/* Fiches Athlètes */}
        {visitedTabs.has('athlete') && (
          <div className={activeTab === 'athlete' ? 'block' : 'hidden'}>
            <AthleteReportView
              records={performances}
              selectedAthleteName={selectedAthlete}
              onSelectAthlete={setSelectedAthlete}
              onSelectDiscipline={handleNavigateToDiscipline}
            />
          </div>
        )}

        {/* Fiches Disciplines */}
        {visitedTabs.has('discipline') && (
          <div className={activeTab === 'discipline' ? 'block' : 'hidden'}>
            <DisciplineReportView
              records={performances}
              selectedDiscipline={selectedDiscipline}
              onSelectDiscipline={setSelectedDiscipline}
              onSelectAthlete={handleNavigateToAthlete}
            />
          </div>
        )}

        {/* Comparateur */}
        {visitedTabs.has('comparison') && (
          <div className={activeTab === 'comparison' ? 'block' : 'hidden'}>
            <ComparisonView
              records={performances}
              onSelectAthlete={handleNavigateToAthlete}
            />
          </div>
        )}

        {/* Listes SHN (Sportifs de Haut Niveau) */}
        {visitedTabs.has('shn') && (
          <div className={activeTab === 'shn' ? 'block' : 'hidden'}>
            <SHNListView
              records={performances}
              onSelectAthlete={handleNavigateToAthlete}
              isAdmin={currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'}
            />
          </div>
        )}

        {/* Stats SHN (Biomécanique & Rapports Scientifiques Haut Niveau) */}
        {visitedTabs.has('stats-shn') && (
          <div className={activeTab === 'stats-shn' ? 'block' : 'hidden'}>
            <StatsSHNView />
          </div>
        )}

        {/* Compo des équipes */}
        {(visitedTabs.has('team-composition') || visitedTabs.has('compo-equipes') || visitedTabs.has('compo')) && (
          <div className={(activeTab === 'team-composition' || activeTab === 'compo-equipes' || activeTab === 'compo') ? 'block' : 'hidden'}>
            <TeamCompositionView
              records={performances}
              userClub={currentUser?.club}
              onSelectAthlete={handleNavigateToAthlete}
              onSelectDiscipline={handleNavigateToDiscipline}
            />
          </div>
        )}

        {/* Import & CSV (Admin / Super Admin) */}
        {visitedTabs.has('import') && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
          <div className={activeTab === 'import' ? 'block' : 'hidden'}>
            <ImportExportView
              records={performances}
              onUpdateRecords={handleUpdateRecords}
              currentUser={currentUser}
              onNavigate={handleSelectTab}
            />
          </div>
        )}

        {/* Administration & 2FA */}
        {visitedTabs.has('admin') && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
          <div className={activeTab === 'admin' ? 'block' : 'hidden'}>
            <AdminView
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
              onUserUpdated={() => {
                setCurrentUser(StorageService.getCurrentUser());
              }}
            />
          </div>
        )}

        {/* Messagerie */}
        {visitedTabs.has('messages') && (
          <div className={activeTab === 'messages' ? 'block' : 'hidden'}>
            <MessagesView
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
              onNavigateHome={() => handleSelectTab('home')}
            />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Data France Athlé · Fédération Française d'Athlétisme & Ligues Régionales.</p>
          <p className="font-mono text-slate-600">Application PWA certifiée · Compatible iOS & Android · Authentification 2FA</p>
        </div>
      </footer>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuth}
        onSuccess={(user) => {
          handleLoginSuccess(user);
          handleCloseAuth();
        }}
      />

      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={handleCloseNotif}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onTriggerSimulatedNotification={handleTriggerSimulatedNotification}
        currentUser={currentUser}
      />

      <TestGuideModal
        isOpen={isTestGuideOpen}
        onClose={handleCloseTestGuide}
        currentUser={currentUser}
        onLoginAsAdmin={handleLoginAsSuperAdmin}
        onTriggerNotification={() => handleTriggerSimulatedNotification(
          'Alerte Test Pré-Publication',
          'Vérification de la pastille sur l\'icône et du centre de notifications.',
          'SYSTEM_UPDATE'
        )}
        onResetData={handleResetDataToFactory}
        onNavigate={handleSelectTab}
      />

      <ContactAdminModal
        isOpen={isContactModalOpen}
        onClose={handleCloseContact}
        currentUser={currentUser}
        onOpenInternalChat={() => handleSelectTab('messages')}
        onOpenAuth={handleOpenAuth}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfile}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          refreshAllBadgesAndNotifs();
        }}
      />

    </div>
  );
}
