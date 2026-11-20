import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Copy, 
  ExternalLink,
  Shield, 
  User, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserAccount } from '../types/athletics';
import { StorageService } from '../services/storageService';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onOpenInternalChat: () => void;
  onOpenAuth: () => void;
}

export const ContactAdminModal: React.FC<ContactAdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenInternalChat,
  onOpenAuth,
}) => {
  const [activeMode, setActiveMode] = useState<'CHOICE' | 'EMAIL' | 'IN_APP'>('CHOICE');
  const [senderName, setSenderName] = useState(currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '');
  const [senderEmail, setSenderEmail] = useState(currentUser ? currentUser.email : '');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const adminEmail = 'jerome.lucotte@yahoo.fr';
  const mailtoUrl = `mailto:${adminEmail}?subject=${encodeURIComponent(messageSubject || 'Contact Data France Athlé')}&body=${encodeURIComponent(messageBody ? `${messageBody}\n\n---\nEnvoyé par : ${senderName} (${senderEmail})` : '')}`;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(adminEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSendInApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim()) return;

    const admin = StorageService.getAdminUser();

    if (currentUser) {
      StorageService.sendMessage({
        sender: currentUser,
        recipientId: admin.id,
        recipientName: `${admin.firstName} ${admin.lastName}`,
        recipientEmail: admin.email,
        content: messageSubject ? `[${messageSubject}] ${messageBody}` : messageBody,
        isAdminChannel: true,
      });
    } else {
      // Message d'un utilisateur non encore connecté
      const guestUser: UserAccount = {
        id: `guest-${Date.now()}`,
        email: senderEmail.trim() || 'visiteur@athle.fr',
        passwordHash: '',
        firstName: senderName.trim().split(' ')[0] || 'Visiteur',
        lastName: senderName.trim().split(' ').slice(1).join(' ') || 'Athlé',
        role: 'VIEWER',
        isTwoFactorEnabled: false,
        permissions: {
          canImportData: false,
          canExportReports: false,
          canEditPerformances: false,
          canManageUsers: false,
          canPurgeData: false,
        },
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        club: 'Visiteur Web',
        avatarColor: '#0284C7',
      };

      StorageService.sendMessage({
        sender: guestUser,
        recipientId: admin.id,
        recipientName: `${admin.firstName} ${admin.lastName}`,
        recipientEmail: admin.email,
        content: `[Message de ${senderName || 'Visiteur'} (${senderEmail || 'Non spécifié'})] : ${messageSubject ? `\nSujet: ${messageSubject}\n` : ''}${messageBody}`,
        isAdminChannel: true,
      });

      // Notification pour l'administrateur
      StorageService.addNotification(
        `Nouveau message reçu de ${senderName || 'un visiteur'}`,
        messageBody.length > 70 ? messageBody.substring(0, 67) + '...' : messageBody,
        'INFO'
      );
    }

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setMessageBody('');
      setMessageSubject('');
      onClose();
      if (currentUser) {
        onOpenInternalChat();
      }
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30 flex items-center justify-center shadow-inner">
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Contacter l'administrateur</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-900/60 text-sky-300 border border-blue-600/30">
                  Data France Athlé
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Jérôme Lucotte · <span className="text-sky-400 font-mono font-medium">jerome.lucotte@yahoo.fr</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {sentSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Message transmis avec succès !</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Votre message a été déposé dans la boîte de messagerie de l'administrateur. Une notification lui a été transmise immédiatement.
              </p>
            </div>
          ) : activeMode === 'CHOICE' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Choisissez le moyen par lequel vous souhaitez dialoguer avec l'administrateur de l'application :
              </p>

              {/* Option 1: Direct Email */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 transition-all space-y-3 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-sky-400 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                        Envoyer un e-mail direct
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        jerome.lucotte@yahoo.fr
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Copier l'adresse email"
                  >
                    {copiedEmail ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ouvrez directement votre boîte de messagerie habituelle pour envoyer un courriel à Jérôme Lucotte.
                </p>
                <div className="pt-1 flex gap-2">
                  <a
                    href={mailtoUrl}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ouvrir mon client e-mail</span>
                  </a>
                  <button
                    onClick={() => setActiveMode('EMAIL')}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Rédiger ici
                  </button>
                </div>
              </div>

              {/* Option 2: In-app Direct Messaging */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Messagerie interne de l'application
                    </h4>
                    <p className="text-xs text-slate-400">
                      Fil de dialogue instantané et interactif avec l'admin
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Échangez directement dans l'application avec l'administrateur. Les messages sont historisés et synchronisés en direct.
                </p>
                <div>
                  {currentUser ? (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenInternalChat();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Accéder au chat direct avec l'administrateur</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveMode('IN_APP')}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer un message direct maintenant</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Form for direct message */
            <form onSubmit={handleSendInApp} className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveMode('CHOICE')}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Retour aux options de contact
                </button>
                <span className="text-[10px] text-slate-400">
                  Destinataire : <strong>jerome.lucotte@yahoo.fr</strong>
                </span>
              </div>

              {!currentUser && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Votre nom et prénom
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Jean Dupont"
                      value={senderName}
                      onChange={e => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Votre adresse email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="nom@exemple.fr"
                      value={senderEmail}
                      onChange={e => setSenderEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Objet du message
                </label>
                <input
                  type="text"
                  placeholder="Ex: Question sur l'importation de bilans / Demande d'accès"
                  value={messageSubject}
                  onChange={e => setMessageSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Votre message à l'administrateur
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Écrivez votre message ici..."
                  value={messageBody}
                  onChange={e => setMessageBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {activeMode === 'EMAIL' ? (
                  <a
                    href={mailtoUrl}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer via mon application d'e-mail</span>
                  </a>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Déposer dans la messagerie interne de l'administrateur</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
