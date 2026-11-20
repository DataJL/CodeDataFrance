import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Mail, 
  Smartphone, 
  CheckCheck, 
  Sparkles, 
  Database, 
  Info,
  Send
} from 'lucide-react';
import { AppNotification, UserAccount } from '../types/athletics';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onTriggerSimulatedNotification: (title: string, message: string, type: AppNotification['type']) => void;
  currentUser: UserAccount | null;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onTriggerSimulatedNotification,
  currentUser,
}) => {
  const [customMsg, setCustomMsg] = useState('');
  const [testType, setTestType] = useState<AppNotification['type']>('DATA_UPDATE');

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSimulate = () => {
    if (customMsg.trim()) {
      onTriggerSimulatedNotification(
        testType === 'DATA_UPDATE' ? 'Nouvelles Données Athlé' : 'Mise à Jour Système',
        customMsg.trim(),
        testType
      );
      setCustomMsg('');
    } else {
      onTriggerSimulatedNotification(
        'Nouvelles Performances 2026 Validées',
        'Le comité technique fédéral a validé 14 nouveaux records de ligue et 3 minima européens.',
        'DATA_UPDATE'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Centre de Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-rose-600 text-white font-mono">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Alertes de mise à jour & nouvelles données athlétisme
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner on Push & Mail dispatch */}
        <div className="px-6 py-3 bg-blue-950/40 border-b border-blue-900/40 flex items-start gap-3">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-200 leading-relaxed">
            <p className="font-semibold text-sky-100">Synchronisation Pastille & Dispatch par Email</p>
            <p className="text-sky-300/80 text-[11px] mt-0.5">
              À chaque nouvelle performance intégrée ou mise à jour, la pastille sur l'icône s'incrémente et un avis est expédié {currentUser?.email ? `à ${currentUser.email}` : 'à votre boîte mail'}.
            </p>
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Aucune notification pour le moment.
            </div>
          ) : (
            notifications.map(notif => {
              const isData = notif.type === 'DATA_UPDATE';
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${
                    notif.read
                      ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                      : 'bg-slate-850 border-sky-500/40 shadow-sm text-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isData 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                      }`}>
                        {isData ? <Database className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm leading-tight text-white">
                            {notif.title}
                          </h4>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        
                        {/* Dispatch badges */}
                        <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-400">
                          <span className="font-mono text-slate-500">
                            {new Date(notif.timestamp).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Mail className="w-3 h-3" /> Email expédié
                          </span>
                          <span className="flex items-center gap-1 text-sky-400">
                            <Bell className="w-3 h-3" /> Pastille icône active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Test / Simulation block */}
          <div className="mt-6 pt-4 border-t border-slate-800 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <h5 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              Simuler l'envoi d'une notification et l'affichage de la pastille
            </h5>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Mise à jour du classement national FFA 2026..."
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleSimulate}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 disabled:text-slate-600 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Tout marquer comme lu (effacer la pastille)</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
