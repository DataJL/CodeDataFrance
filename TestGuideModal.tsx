import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ShieldCheck, 
  FileSpreadsheet, 
  Users, 
  Bell, 
  Smartphone, 
  Download, 
  ExternalLink, 
  Database, 
  RotateCcw, 
  Zap, 
  Check,
  ChevronRight,
  FileText,
  FileDown,
  MessageSquare
} from 'lucide-react';
import { UserAccount, PerformanceRecord } from '../types/athletics';
import { StorageService } from '../services/storageService';
import { generateAthleticsSampleCSV } from '../utils/csvParser';

interface TestGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLoginAsAdmin: () => void;
  onTriggerNotification: () => void;
  onResetData: () => void;
  onNavigate: (tab: string) => void;
}

interface ChecklistItem {
  id: string;
  category: 'auth' | 'csv' | 'analysis' | 'reports' | 'exports' | 'mobile';
  title: string;
  description: string;
  actionLabel?: string;
  actionTab?: string;
}

export const TestGuideModal: React.FC<TestGuideModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginAsAdmin,
  onTriggerNotification,
  onResetData,
  onNavigate,
}) => {
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('sfa_qa_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'auth' | 'csv' | 'analysis' | 'reports' | 'exports' | 'mobile'>('all');

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    const updated = { ...completedItems, [id]: !completedItems[id] };
    setCompletedItems(updated);
    try {
      localStorage.setItem('sfa_qa_checklist', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const checklist: ChecklistItem[] = [
    {
      id: 'test_auth_register',
      category: 'auth',
      title: '1. Création de compte & 2FA Email (sans numéro requis)',
      description: 'Créez un nouveau compte avec prénom, nom, email et mot de passe. Vérifiez que la demande de numéro de téléphone a bien été supprimée et que le code 2FA s\'affiche directement avec possibilité de le valider en 1 clic.',
      actionLabel: 'Tester l\'accueil',
      actionTab: 'home',
    },
    {
      id: 'test_super_admin_rule',
      category: 'auth',
      title: '2. Règle du 1er utilisateur = Super Administrateur',
      description: 'Le tout premier compte enregistré sur la plateforme se voit accorder automatiquement le rôle "SUPER_ADMIN" avec tous les droits de délégation et d\'administration.',
      actionLabel: 'Vérifier dans Admin',
      actionTab: 'admin',
    },
    {
      id: 'test_csv_download_template',
      category: 'csv',
      title: '3. Téléchargement du modèle de fichier CSV',
      description: 'Accédez à l\'onglet Données & Imports et téléchargez le modèle officiel CSV d\'athlétisme. Ouvrez-le pour vérifier le format des colonnes (date, épreuve, performance, athlète, club, entraîneur...).',
      actionLabel: 'Aller à Imports',
      actionTab: 'import',
    },
    {
      id: 'test_csv_import_data',
      category: 'csv',
      title: '4. Importation & Détection automatique de CSV',
      description: 'Glissez-déposez ou sélectionnez un fichier CSV (ou le modèle téléchargé). Testez l\'importation en mode "Fusionner" ou "Remplacement complet". Vérifiez le compteur de performances.',
      actionLabel: 'Tester l\'import',
      actionTab: 'import',
    },
    {
      id: 'test_analytics_filters',
      category: 'analysis',
      title: '5. Moteur d\'analyse & Filtres multi-critères',
      description: 'Testez les filtres dans l\'onglet "Analyses & Filtres" : par saison, région, département, club, entraîneur et niveau FFA. Vérifiez le recalcul instantané des moyennes et l\'histogramme.',
      actionLabel: 'Voir les filtres',
      actionTab: 'analytics',
    },
    {
      id: 'test_athlete_report_pb',
      category: 'reports',
      title: '6. Rapport individuel & Évolution des Records (RP)',
      description: 'Sélectionnez un athlète (ex: Gabriel Tual ou Cyréna Samba-Mayela). Observez le graphique d\'évolution de ses records personnels, sa moyenne par épreuve et son bilan de carrière.',
      actionLabel: 'Rapport Athlète',
      actionTab: 'athlete',
    },
    {
      id: 'test_discipline_report',
      category: 'reports',
      title: '7. Rapport par Discipline & Comparateur dynamique',
      description: 'Explorez le bilan d\'une discipline (ex: 800m ou 100m) avec le podium, les moyennes et l\'histogramme. Puis testez l\'onglet "Comparateur" pour comparer 2 athlètes en duel.',
      actionLabel: 'Voir Comparateur',
      actionTab: 'comparison',
    },
    {
      id: 'test_multi_format_exports',
      category: 'exports',
      title: '8. Exportations multi-formats (Excel, Word, PDF)',
      description: 'Cliquez sur les boutons d\'exportation disponibles sur le Dashboard ou dans les rapports. Vérifiez la génération du fichier Excel (.xlsx multi-onglets), Word (.doc structuré) et PDF (.pdf imprimable).',
      actionLabel: 'Tester sur le Dashboard',
      actionTab: 'dashboard',
    },
    {
      id: 'test_user_admin_delegation',
      category: 'auth',
      title: '9. Gestion des utilisateurs & Journal d\'audit',
      description: 'Dans le module Administrateur, changez le rôle d\'un utilisateur (Administrateur, Entraîneur, Analyste), modifiez ses permissions spécifiques et consultez le journal d\'activité détaillé.',
      actionLabel: 'Ouvrir Admin',
      actionTab: 'admin',
    },
    {
      id: 'test_badge_notifications',
      category: 'mobile',
      title: '10. Pastille de notification & Alertes mises à jour',
      description: 'Cliquez sur l\'icône de cloche en haut à droite. Vérifiez la pastille rouge de compteur (App Badge). Cliquez sur "Simuler une alerte" pour voir le badge s\'incrémenter en temps réel.',
      actionLabel: 'Simuler alerte',
    },
    {
      id: 'test_mobile_responsive_pwa',
      category: 'mobile',
      title: '11. Test sur Mobile (iOS & Android) & PWA',
      description: 'Pressez F12 sur votre clavier, activez le mode "Device Toolbar" (icône smartphone/tablette) et sélectionnez iPhone 14 ou Samsung Galaxy. Vérifiez la barre de navigation basse tactile.',
    },
    {
      id: 'test_clean_homepage_contact',
      category: 'auth',
      title: '12. Accueil épuré & Contact Administrateur',
      description: 'Sur la 1ère page d\'accueil, vérifiez la mise en page épurée (Logo, Nom "Data France Athlé", paragraphe officiel) avec les 3 boutons : Créer un compte, Se connecter, et Contacter l\'administrateur (email direct à jerome.lucotte@yahoo.fr ou message in-app).',
      actionLabel: 'Voir Accueil',
      actionTab: 'home',
    },
    {
      id: 'test_messaging_and_friends',
      category: 'reports',
      title: '13. Messagerie interne & Système d\'amis',
      description: 'Dans "Messagerie & Amis", testez le dialogue officiel avec l\'administrateur, recherchez un membre (ex: Sophie, Lucas), envoyez une demande d\'ami, acceptez la demande et vérifiez la notification "amis" ainsi que l\'échange de messages instantanés.',
      actionLabel: 'Ouvrir Messagerie',
      actionTab: 'messages',
    },
  ];

  const totalCount = checklist.length;
  const doneCount = checklist.filter(c => completedItems[c.id]).length;
  const progressPercent = Math.round((doneCount / totalCount) * 100);

  const filteredItems = checklist.filter(item => {
    if (activeTabFilter === 'all') return true;
    return item.category === activeTabFilter;
  });

  const handleDownloadSample = () => {
    const csvContent = generateAthleticsSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_performances_athle_test.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-md shadow-blue-900/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Guide de Validation & Recette Pré-Publication
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold">
                  Protocole QA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Vérifiez pas à pas toutes les exigences de l'application Data France Athlé
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Quick Actions Bar */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Progression des tests :</span>
              <span className="font-mono font-bold text-sky-400">{doneCount} / {totalCount} validés</span>
              <span className="text-slate-400">({progressPercent}%)</span>
            </div>
            <div className="flex items-center gap-2">
              {progressPercent === 100 ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-700/50">
                  <CheckCircle2 className="w-4 h-4" />
                  Prêt pour la publication !
                </span>
              ) : (
                <span className="text-slate-400 text-[11px]">
                  Cochez chaque scénario après vérification
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-400 h-2 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Sandbox Fast Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Actions rapides :
            </span>

            <button
              onClick={() => {
                onLoginAsAdmin();
                onClose();
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-900/50 hover:bg-blue-800 border border-blue-700/50 text-blue-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Se connecter immédiatement comme Super Administrateur"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Session Super Admin</span>
            </button>

            <button
              onClick={handleDownloadSample}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Télécharger le fichier CSV exemple pour le tester"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Télécharger CSV Test</span>
            </button>

            <button
              onClick={onTriggerNotification}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Ajouter une notification et incrémenter la pastille de badge"
            >
              <Bell className="w-3.5 h-3.5 text-rose-400" />
              <span>Tester Pastille (+1)</span>
            </button>

            <button
              onClick={() => {
                const targetId = currentUser?.id || 'guest';
                const targetName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Visiteur Invité';
                const targetEmail = currentUser?.email || 'visiteur@athle.fr';
                StorageService.simulateIncomingMessage(targetId, targetName, targetEmail);
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900 border border-blue-700/50 text-blue-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Simuler un nouveau message reçu (active la pastille de badge dans l'appli et sur l'icône)"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>Simuler Message Reçu (+1)</span>
            </button>

            <button
              onClick={() => {
                onResetData();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-800 text-slate-300 hover:text-rose-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ml-auto"
              title="Réinitialiser les données au jeu officiel"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Remise à zéro</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-6 py-2.5 border-b border-slate-800 overflow-x-auto text-xs scrollbar-none bg-slate-900/40">
          {[
            { id: 'all', label: 'Tout voir' },
            { id: 'auth', label: '1. Auth & 2FA' },
            { id: 'csv', label: '2. Import CSV' },
            { id: 'analysis', label: '3. Filtres & Calculs' },
            { id: 'reports', label: '4. Rapports & RP' },
            { id: 'exports', label: '5. Exports Excel/Word/PDF' },
            { id: 'mobile', label: '6. Mobile & Badge' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTabFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Checklist Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredItems.map(item => {
            const isDone = !!completedItems[item.id];
            return (
              <div 
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isDone 
                    ? 'bg-emerald-950/15 border-emerald-800/40 text-slate-300' 
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="mt-0.5 text-slate-400 hover:text-white cursor-pointer transition-transform hover:scale-110"
                    title={isDone ? 'Marquer comme à revoir' : 'Marquer comme validé'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className={`text-sm font-bold ${isDone ? 'text-emerald-300 line-through' : 'text-white'}`}>
                        {item.title}
                      </h4>
                      {item.actionLabel && (
                        <button
                          onClick={() => {
                            if (item.actionTab) {
                              onNavigate(item.actionTab);
                              onClose();
                            } else if (item.id === 'test_badge_notifications') {
                              onTriggerNotification();
                            }
                          }}
                          className="px-2.5 py-0.5 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-700/50 text-sky-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>{item.actionLabel}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with browser / mobile instructions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              <strong>Astuce mobile :</strong> Sur PC, appuyez sur <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">F12</kbd> puis <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">Ctrl+Shift+M</kbd> pour émuler un iPhone ou Android.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer transition-colors"
          >
            Fermer le guide
          </button>
        </div>

      </div>
    </div>
  );
};
