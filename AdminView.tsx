import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Smartphone, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  FileSpreadsheet, 
  FileText, 
  Search, 
  Sliders, 
  Key, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { ActivityLog, UserAccount, UserPermission, UserRole } from '../../types/athletics';
import { StorageService } from '../../services/storageService';
import * as XLSX from 'xlsx';
import { exportToExcel, exportToWord } from '../../utils/exportUtils';
import { UserAvatar } from '../UserAvatar';

interface AdminViewProps {
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onUserUpdated: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  onOpenAuth,
  onUserUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'activity_logs'>('users');
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<UserAccount | null>(null);

  // Filters for activity logs
  const [logSearch, setLogSearch] = useState('');
  const [logUserFilter, setLogUserFilter] = useState('all');
  const [logActionFilter, setLogActionFilter] = useState('all');

  const users = useMemo(() => StorageService.getUsers(), [currentUser]);
  const activityLogs = useMemo(() => StorageService.getActivityLogs(), [currentUser]);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || currentUser?.role === 'ADMIN';

  // Handling role change
  const handleChangeRole = (userId: string, newRole: UserRole) => {
    if (!currentUser || !isAdmin) return;
    const target = users.find(u => u.id === userId);
    if (!target) return;

    StorageService.updateUserRoleAndPermissions(
      userId,
      newRole,
      target.permissions,
      currentUser
    );
    onUserUpdated();
  };

  // Handling custom permissions
  const handleSavePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isAdmin || !selectedUserForPerms) return;

    StorageService.updateUserRoleAndPermissions(
      selectedUserForPerms.id,
      selectedUserForPerms.role,
      selectedUserForPerms.permissions,
      currentUser
    );
    setSelectedUserForPerms(null);
    onUserUpdated();
  };

  // Filtered activity logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      if (logSearch) {
        const q = logSearch.toLowerCase();
        const match = 
          log.userName.toLowerCase().includes(q) ||
          log.userEmail.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.ipAddress.includes(q);
        if (!match) return false;
      }
      if (logUserFilter !== 'all' && log.userId !== logUserFilter) return false;
      if (logActionFilter !== 'all' && log.action !== logActionFilter) return false;
      return true;
    });
  }, [activityLogs, logSearch, logUserFilter, logActionFilter]);

  // Export logs in Excel
  const handleExportLogsExcel = () => {
    const data = filteredLogs.map(l => ({
      'ID Log': l.id,
      'Horodatage': l.timestamp,
      'Utilisateur': l.userName,
      'Email': l.userEmail,
      'Action': l.action,
      'Détails': l.details,
      'Adresse IP': l.ipAddress,
      'Plateforme': l.userAgent,
      'Statut': l.status,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Journal_Activite');
    XLSX.writeFile(wb, `Rapport_Activite_Comptes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export logs in Word
  const handleExportLogsWord = () => {
    exportToWord(
      'Rapport d\'Audit et d\'Activité des Comptes',
      `Data France Athlé · Sécurité et Traçabilité Fédérale (${filteredLogs.length} événements)`,
      [
        {
          heading: '1. Présentation du Journal d\'Audit',
          text: `Ce rapport consigne les événements d'authentification 2FA, les créations de comptes, les imports de fichiers CSV et les nominations administratives conformément aux exigences fédérales.`,
        },
        {
          heading: '2. Historique Détaillé des Actions',
          tableHeaders: ['Date/Heure', 'Utilisateur', 'Action', 'Détails', 'IP / Appareil', 'Statut'],
          tableRows: filteredLogs.slice(0, 50).map(l => [
            new Date(l.timestamp).toLocaleString('fr-FR'),
            l.userName,
            l.action,
            l.details,
            l.ipAddress,
            l.status,
          ]),
        }
      ],
      'Audit_Activite_Stats_France_Athle'
    );
  };

  // If not connected
  if (!currentUser) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-sky-400 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">
          Espace d'Administration & Gestion des Comptes
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Cet espace est strictement réservé aux administrateurs de la plateforme. Veuillez vous connecter avec un compte administrateur.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs flex items-center gap-2 mx-auto cursor-pointer transition-all shadow-lg shadow-blue-900/30"
        >
          <Key className="w-4 h-4" />
          <span>Se Connecter (Compte Administrateur)</span>
        </button>
      </div>
    );
  }

  // If connected but not admin (COACH, ANALYST, ATHLETE, etc.)
  if (!isAdmin) {
    return (
      <div className="bg-slate-900/90 border border-rose-900/40 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-xl animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">
          Accès Réservé aux Administrateurs
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          La gestion des utilisateurs, les privilèges de sécurité et les rapports d'activité d'audit sont strictement réservés aux <strong>Administrateurs</strong> et au <strong>Super Administrateur</strong>.
        </p>
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
          Votre compte est actuellement connecté en tant que : <span className="font-semibold text-sky-400">{currentUser.firstName} {currentUser.lastName}</span> (<span className="text-amber-400 font-mono font-bold">{currentUser.role}</span>).
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-400/20 text-sky-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gouvernance & Sécurité 2FA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Gestion des Utilisateurs & Rapports d'Activité
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Nommez des administrateurs, ajustez les permissions spécifiques et suivez l'audit détaillé de chaque compte.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 block">Votre session :</span>
              <span className="text-xs font-bold text-sky-300">
                {currentUser.firstName} {currentUser.lastName}
              </span>
              <span className="text-[10px] font-mono text-amber-400 ml-1.5 font-bold">
                [{currentUser.role}]
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'users' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestion des Comptes ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('activity_logs')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'activity_logs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Rapports d'Activité Détaillés ({activityLogs.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: GESTION DES UTILISATEURS */}
      {activeSubTab === 'users' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-white">
                Liste des Utilisateurs Inscrits & Rôles
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Déléguez les droits d'administration et configurez les autorisations d'accès
              </p>
            </div>
            
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-sky-400" />
              <span>Créer un autre compte</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Utilisateur</th>
                  <th className="pb-3 font-semibold">Inscrit le</th>
                  <th className="pb-3 font-semibold">Club / Rôle</th>
                  <th className="pb-3 font-semibold">Sécurité 2FA</th>
                  <th className="pb-3 font-semibold">Permissions</th>
                  <th className="pb-3 font-semibold text-right">Actions Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u, idx) => {
                  const isFirstUser = idx === 0;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-medium">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={u} size="sm" />
                          <div>
                            <span className="font-bold text-white">
                              {u.firstName} {u.lastName}
                            </span>
                            {isFirstUser && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                                Admin Principal
                              </span>
                            )}
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 font-mono text-slate-300">
                        <span className="text-slate-400 text-xs">
                          {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </td>

                      <td className="py-3">
                        <div className="text-slate-300 font-medium">
                          {u.club ? (u.region ? `${u.club} (${u.region})` : u.club) : (u.region ? `Région ${u.region}` : 'Fédération')}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            u.role === 'SUPER_ADMIN' 
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800' 
                              : (u.role === 'ADMIN' 
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800' 
                                : 'bg-blue-950/80 text-sky-300 border border-blue-800')
                          }`}>
                            {u.role}
                          </span>
                          {u.statuses && u.statuses.map((st, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {st}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-mono text-[10px]">
                          <ShieldCheck className="w-3 h-3" />
                          2FA ACTIF
                        </span>
                      </td>

                      <td className="py-3 text-[11px] text-slate-400 space-x-1">
                        {u.permissions.canImportData && <span className="text-sky-400">Import</span>}
                        {u.permissions.canExportReports && <span>· Export</span>}
                        {u.permissions.canManageUsers && <span className="text-amber-400">· Admin</span>}
                      </td>

                      <td className="py-3 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nommer Administrateur */}
                            {u.role !== 'SUPER_ADMIN' && (
                              <button
                                onClick={() => handleChangeRole(u.id, u.role === 'ADMIN' ? 'COACH' : 'ADMIN')}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-medium cursor-pointer transition-colors"
                              >
                                {u.role === 'ADMIN' ? 'Rétrograder Coach' : 'Nommer Admin'}
                              </button>
                            )}

                            {/* Permissions Modal button */}
                            <button
                              onClick={() => setSelectedUserForPerms(u)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                              title="Ajuster les permissions spécifiques"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RAPPORTS D'ACTIVITÉ DÉTAILLÉS */}
      {activeSubTab === 'activity_logs' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-white">
                Journal d'Audit & Rapports d'Activité
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Traçabilité des connexions, validations 2FA, imports et exports par compte
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportLogsExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/40 text-xs font-medium cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={handleExportLogsWord}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-sky-300 border border-blue-700/40 text-xs font-medium cursor-pointer transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Word</span>
              </button>
            </div>
          </div>

          {/* Filters for Activity Logs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                placeholder="Rechercher dans les événements..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <select
                value={logUserFilter}
                onChange={e => setLogUserFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="all">Tous les utilisateurs</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={logActionFilter}
                onChange={e => setLogActionFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="all">Toutes les actions</option>
                <option value="VALIDATION_2FA">Validation 2FA</option>
                <option value="CONNEXION_REUSSIE">Connexion réussie</option>
                <option value="IMPORT_CSV">Import CSV</option>
                <option value="EXPORT_EXCEL">Export Excel</option>
                <option value="EXPORT_WORD">Export Word</option>
                <option value="EXPORT_PDF">Export PDF</option>
                <option value="NOMINATION_ADMIN">Nomination Administrateur</option>
                <option value="CREATION_COMPTE">Création de compte</option>
              </select>
            </div>
          </div>

          {/* Activity Logs Timeline / Table */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Aucun événement d'activité correspondant.
              </div>
            ) : (
              filteredLogs.map(log => {
                const is2FA = log.action === 'VALIDATION_2FA';
                const isImport = log.action === 'IMPORT_CSV';
                const isNomination = log.action === 'NOMINATION_ADMIN';

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        is2FA 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : (isImport 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : (isNomination 
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                              : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'))
                      }`}>
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{log.userName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs mt-0.5">{log.details}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 font-mono">
                          <span>IP: {log.ipAddress}</span>
                          <span>·</span>
                          <span>{log.userAgent}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-slate-400 text-[11px] block">
                        {new Date(log.timestamp).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {log.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* PERMISSIONS CONFIG MODAL */}
      {selectedUserForPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-400" />
              Permissions : {selectedUserForPerms.firstName} {selectedUserForPerms.lastName}
            </h3>
            <p className="text-xs text-slate-400">
              Rôle actuel : <strong className="text-amber-400">{selectedUserForPerms.role}</strong>
            </p>

            <form onSubmit={handleSavePermissions} className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-200">Autoriser l'importation de fichiers CSV</span>
                <input
                  type="checkbox"
                  checked={selectedUserForPerms.permissions.canImportData}
                  onChange={e => setSelectedUserForPerms({
                    ...selectedUserForPerms,
                    permissions: { ...selectedUserForPerms.permissions, canImportData: e.target.checked }
                  })}
                  className="rounded bg-slate-900 border-slate-700 text-sky-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-200">Autoriser l'exportation des données et rapports</span>
                <input
                  type="checkbox"
                  checked={selectedUserForPerms.permissions.canExportReports}
                  onChange={e => setSelectedUserForPerms({
                    ...selectedUserForPerms,
                    permissions: { ...selectedUserForPerms.permissions, canExportReports: e.target.checked }
                  })}
                  className="rounded bg-slate-900 border-slate-700 text-sky-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-200">Autoriser l'édition des performances</span>
                <input
                  type="checkbox"
                  checked={selectedUserForPerms.permissions.canEditPerformances}
                  onChange={e => setSelectedUserForPerms({
                    ...selectedUserForPerms,
                    permissions: { ...selectedUserForPerms.permissions, canEditPerformances: e.target.checked }
                  })}
                  className="rounded bg-slate-900 border-slate-700 text-sky-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-200">Autoriser la gestion des autres utilisateurs</span>
                <input
                  type="checkbox"
                  checked={selectedUserForPerms.permissions.canManageUsers}
                  onChange={e => setSelectedUserForPerms({
                    ...selectedUserForPerms,
                    permissions: { ...selectedUserForPerms.permissions, canManageUsers: e.target.checked }
                  })}
                  className="rounded bg-slate-900 border-slate-700 text-sky-500"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPerms(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  Enregistrer les droits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
