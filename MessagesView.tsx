import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageSquare, 
  Send, 
  UserPlus, 
  Users, 
  Search, 
  ShieldCheck, 
  Check, 
  X, 
  Clock, 
  UserCheck, 
  Sparkles, 
  Lock, 
  Bell, 
  ArrowLeft,
  Mail,
  Shield,
  CheckCircle2,
  CheckCheck
} from 'lucide-react';
import { UserAccount, ChatMessage, FriendRequest } from '../../types/athletics';
import { StorageService } from '../../services/storageService';
import { UserAvatar } from '../UserAvatar';

interface MessagesViewProps {
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onNavigateHome: () => void;
  initialRecipientId?: string;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  currentUser,
  onOpenAuth,
  onNavigateHome,
  initialRecipientId,
}) => {
  const [activeTab, setActiveTab] = useState<'DISCUSSIONS' | 'SEARCH' | 'REQUESTS'>('DISCUSSIONS');
  const [selectedInterlocutorId, setSelectedInterlocutorId] = useState<string>('admin');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Amis et demandes
  const [friends, setFriends] = useState<UserAccount[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserAccount[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const adminUser = StorageService.getAdminUser();
  const isAdminLoggedIn = currentUser?.role === 'SUPER_ADMIN' || currentUser?.email.toLowerCase() === 'jerome.lucotte@yahoo.fr';

  // Charger les amis et demandes
  const refreshFriendsAndRequests = () => {
    if (!currentUser) return;
    const userFriends = StorageService.getFriendsOfUser(currentUser.id);
    setFriends(userFriends);
    const reqs = StorageService.getPendingRequestsForUser(currentUser.id);
    setPendingRequests(reqs);
  };

  useEffect(() => {
    refreshFriendsAndRequests();
  }, [currentUser?.id]);

  // Si un destinataire initial est spécifié ou sélection auto du contact avec message non lu
  useEffect(() => {
    if (!currentUser) return;
    if (initialRecipientId) {
      setSelectedInterlocutorId(initialRecipientId);
      return;
    }

    const allUsers = StorageService.getUsers().filter(u => u.id !== currentUser.id);

    // Vérifier en priorité si un contact a un message non lu pour l'ouvrir immédiatement
    let candidateWithUnread: string | null = null;
    if (!isAdminLoggedIn) {
      const adminUnread = StorageService.getUnreadCountForInterlocutor('admin', currentUser.id, currentUser.email, isAdminLoggedIn);
      if (adminUnread > 0) {
        candidateWithUnread = 'admin';
      }
    }
    if (!candidateWithUnread) {
      const contactsToCheck = isAdminLoggedIn ? allUsers : friends;
      for (const c of contactsToCheck) {
        const cUnread = StorageService.getUnreadCountForInterlocutor(c.id, currentUser.id, currentUser.email, isAdminLoggedIn);
        if (cUnread > 0) {
          candidateWithUnread = c.id;
          break;
        }
      }
    }

    if (candidateWithUnread) {
      setSelectedInterlocutorId(candidateWithUnread);
    } else if (isAdminLoggedIn && allUsers.length > 0) {
      setSelectedInterlocutorId(prev => (prev === 'admin' ? allUsers[0].id : prev));
    } else {
      setSelectedInterlocutorId('admin');
    }
  }, [initialRecipientId, currentUser?.id, currentUser?.email, isAdminLoggedIn, friends.length]);

  // Charger les messages du fil sélectionné et marquer immédiatement comme lu
  const loadActiveConversation = useCallback(() => {
    if (!currentUser) return;
    const conv = StorageService.getConversation(currentUser.id, selectedInterlocutorId, currentUser.email, isAdminLoggedIn);
    setMessages(conv);
    StorageService.markConversationAsRead(currentUser.id, selectedInterlocutorId, currentUser.email, isAdminLoggedIn);
  }, [currentUser?.id, currentUser?.email, selectedInterlocutorId, isAdminLoggedIn]);

  useEffect(() => {
    loadActiveConversation();
  }, [loadActiveConversation]);

  // Action pour marquer l'ensemble des messages non lus comme lus en 1 clic
  const handleMarkAllAsRead = () => {
    if (!currentUser) return;
    StorageService.markAllMessagesAsRead(currentUser.id, currentUser.email, isAdminLoggedIn);
    loadActiveConversation();
    setFeedbackMsg({ text: 'Tous les messages ont été marqués comme lus.', type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Écouter les nouveaux messages arrivés pour rafraîchir en temps réel
  useEffect(() => {
    const handleNewIncoming = () => {
      if (!currentUser) return;
      const conv = StorageService.getConversation(currentUser.id, selectedInterlocutorId, currentUser.email, isAdminLoggedIn);
      setMessages(conv);
    };
    window.addEventListener('dfa_messages_changed', handleNewIncoming);
    return () => {
      window.removeEventListener('dfa_messages_changed', handleNewIncoming);
    };
  }, [currentUser?.id, currentUser?.email, selectedInterlocutorId, isAdminLoggedIn]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Recherche de membres
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const results = StorageService.searchUsers(searchQuery, currentUser?.id);
    setSearchResults(results);
  }, [searchQuery, currentUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    let recipientUser: UserAccount | null = null;
    let isAdminChannel = false;

    if (selectedInterlocutorId === 'admin') {
      recipientUser = adminUser;
      isAdminChannel = true;
    } else {
      const users = StorageService.getUsers();
      recipientUser = users.find(u => u.id === selectedInterlocutorId) || null;
      if (recipientUser?.id === adminUser.id || recipientUser?.email.toLowerCase() === 'jerome.lucotte@yahoo.fr') {
        isAdminChannel = true;
      }
    }

    if (!recipientUser) return;

    StorageService.sendMessage({
      sender: currentUser,
      recipientId: recipientUser.id,
      recipientName: `${recipientUser.firstName} ${recipientUser.lastName}`,
      recipientEmail: recipientUser.email,
      content: inputText,
      isAdminChannel,
    });

    setInputText('');
    loadActiveConversation();
  };

  const handleSendFriendRequest = (targetUser: UserAccount) => {
    if (!currentUser) return;
    const res = StorageService.sendFriendRequest(currentUser, targetUser);
    if (res.success) {
      setFeedbackMsg({ text: `Demande d'ami envoyée à ${targetUser.firstName} ${targetUser.lastName} !`, type: 'success' });
      refreshFriendsAndRequests();
    } else {
      setFeedbackMsg({ text: res.error || 'Erreur lors de l\'envoi de la demande.', type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleRespondFriendRequest = (requestId: string, accept: boolean) => {
    if (!currentUser) return;
    const res = StorageService.respondToFriendRequest(requestId, currentUser.id, accept);
    if (res.success) {
      if (accept) {
        setFeedbackMsg({ text: '🎉 Vous êtes désormais amis ! Vous pouvez échanger des messages.', type: 'success' });
      } else {
        setFeedbackMsg({ text: 'Demande d\'ami déclinée.', type: 'error' });
      }
      refreshFriendsAndRequests();
      loadActiveConversation();
    }
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Obtenir l'interlocuteur sélectionné
  const getSelectedInterlocutor = () => {
    if (selectedInterlocutorId === 'admin') {
      return {
        id: 'admin',
        name: 'Jérôme Lucotte',
        email: 'jerome.lucotte@yahoo.fr',
        roleLabel: 'Super Administrateur Principal',
        club: 'Fédération Française d\'Athlétisme',
        color: '#2563EB',
        isAdmin: true,
        isFriend: true,
        statuses: ['Dirigeant', 'Entraîneur'],
      };
    }
    const user = StorageService.getUsers().find(u => u.id === selectedInterlocutorId);
    if (user) {
      const isFriend = currentUser ? StorageService.areFriends(currentUser.id, user.id) : false;
      const isAdmin = user.role === 'SUPER_ADMIN' || user.email.toLowerCase() === 'jerome.lucotte@yahoo.fr';
      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        roleLabel: isAdmin ? 'Super Admin' : (user.role === 'COACH' ? 'Entraîneur' : 'Athlète'),
        club: user.club || 'Club Athlé',
        color: user.avatarColor || '#0284C7',
        avatarUrl: user.avatarUrl,
        isAdmin,
        isFriend,
        statuses: user.statuses || [],
      };
    }
    return null;
  };

  const activeInterlocutor = getSelectedInterlocutor();

  // Si l'utilisateur n'est pas connecté
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-600/20 text-sky-400 border border-blue-500/30 flex items-center justify-center shadow-xl">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white">
            Messagerie Interne & Réseau Athlé
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Pour dialoguer avec l'administrateur (<span className="text-sky-300 font-mono">jerome.lucotte@yahoo.fr</span>) ou échanger avec vos amis et collègues entraîneurs, veuillez vous connecter à votre compte.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenAuth}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-blue-900/40 cursor-pointer transition-all"
          >
            Se connecter ou Créer un compte
          </button>
          <button
            onClick={onNavigateHome}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Liste de tous les contacts / conversations pour la sidebar
  const allRegisteredUsers = StorageService.getUsers().filter(u => u.id !== currentUser.id);
  const totalUnreadCount = StorageService.getUnreadMessagesCount(currentUser?.id, currentUser?.email, isAdminLoggedIn);

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-scale-up ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Messaging Layout */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* LEFT COLUMN: CONTACTS, AMIS, RECHERCHE (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/40">
          
          {/* Tabs header */}
          <div className="p-3 border-b border-slate-800 grid grid-cols-3 gap-1 bg-slate-900/60">
            <button
              onClick={() => setActiveTab('DISCUSSIONS')}
              className={`py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'DISCUSSIONS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Messages</span>
            </button>

            <button
              onClick={() => setActiveTab('SEARCH')}
              className={`py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'SEARCH'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Recherche</span>
            </button>

            <button
              onClick={() => setActiveTab('REQUESTS')}
              className={`relative py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'REQUESTS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Demandes</span>
              {pendingRequests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: DISCUSSIONS (Admin + Amis) */}
          {activeTab === 'DISCUSSIONS' && (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              
              {/* FIL OFFICIEL ADMINISTRATEUR (Toujours présent) */}
              {!isAdminLoggedIn && (() => {
                const adminUnread = StorageService.getUnreadCountForInterlocutor('admin', currentUser.id, currentUser.email, isAdminLoggedIn);
                return (
                  <div
                    onClick={() => setSelectedInterlocutorId('admin')}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      selectedInterlocutorId === 'admin'
                        ? 'bg-blue-600/15 border-l-4 border-blue-500'
                        : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white font-bold flex items-center justify-center shadow-md">
                        <Shield className="w-5 h-5 text-amber-300" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>Jérôme Lucotte</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                            Super Admin
                          </span>
                        </h4>
                        {adminUnread > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow animate-pulse shrink-0">
                            {adminUnread}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-sky-400 font-mono truncate">
                        jerome.lucotte@yahoo.fr
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        Canal officiel d'assistance et dialogue direct
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Si l'admin est connecté : liste de tous les membres pour dialogue */}
              {isAdminLoggedIn && (
                <div className="p-2 bg-slate-900/90 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
                  Tous les membres inscrits ({allRegisteredUsers.length})
                </div>
              )}

              {/* LISTE DES AMIS OU DES MEMBRES */}
              <div className="p-2 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 flex items-center justify-between">
                <span>{isAdminLoggedIn ? 'Discussions directes' : `Amis connectés (${friends.length})`}</span>
                <span className="text-[10px] text-emerald-400 font-normal">● Actifs</span>
              </div>

              {(isAdminLoggedIn ? allRegisteredUsers : friends).length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <Users className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs text-slate-400">
                    Vous n'avez pas encore d'amis ajoutés.
                  </p>
                  <button
                    onClick={() => setActiveTab('SEARCH')}
                    className="text-xs text-sky-400 hover:underline font-semibold"
                  >
                    Rechercher des membres par nom/prénom →
                  </button>
                </div>
              ) : (
                (isAdminLoggedIn ? allRegisteredUsers : friends).map(friend => {
                  const isSelected = selectedInterlocutorId === friend.id;
                  const unreadCount = StorageService.getUnreadCountForInterlocutor(friend.id, currentUser.id, currentUser.email, isAdminLoggedIn);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => setSelectedInterlocutorId(friend.id)}
                      className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/15 border-l-4 border-blue-500'
                          : 'hover:bg-slate-900/80'
                      }`}
                    >
                      <UserAvatar user={friend} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">
                            {friend.firstName} {friend.lastName}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            {unreadCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow animate-pulse shrink-0">
                                {unreadCount}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500">
                              {friend.role === 'COACH' ? 'Coach' : (friend.role === 'ATHLETE' ? 'Athlète' : 'Membre')}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {friend.club || friend.email}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: RECHERCHE DE MEMBRES */}
          {activeTab === 'SEARCH' && (
            <div className="flex-1 flex flex-col p-3 space-y-3 overflow-y-auto">
              {/* Objectif de la recherche */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-blue-600/10 to-slate-900 border border-sky-500/25 text-slate-200 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white mb-0.5 flex items-center gap-1.5">
                      <span>Objectif de la recherche</span>
                      <Sparkles className="w-3 h-3 text-sky-400" />
                    </h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Envie de retrouver un utilisateur ou une utilisatrice ? Lancez une recherche via son prénom et/ou son nom puis envoyez une demande d&apos;ami !
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Rechercher par nom ou prénom
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: Lucas, Sophie, Dupont..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {searchQuery.trim() === '' ? (
                  <div className="py-7 px-4 text-center space-y-2 text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-slate-200">
                      Envie de retrouver un utilisateur ou une utilisatrice ?
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Lancez une recherche via son prénom et/ou son nom puis envoyez une demande d&apos;ami !
                    </p>
                    <p className="text-[10px] text-slate-500">Exemples : Sophie Martin, Lucas Bernard, Antoine Dupont...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Aucun membre trouvé pour « {searchQuery} »
                  </div>
                ) : (
                  searchResults.map(user => {
                    const status = StorageService.getFriendshipStatus(currentUser.id, user.id);
                    const isAdmin = user.role === 'SUPER_ADMIN' || user.email.toLowerCase() === 'jerome.lucotte@yahoo.fr';
                    
                    return (
                      <div
                        key={user.id}
                        className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar user={user} size="sm" />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{user.firstName} {user.lastName}</span>
                              {isAdmin && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Admin
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate">
                              {user.club || user.email}
                            </p>
                          </div>
                        </div>

                        <div>
                          {status === 'FRIENDS' ? (
                            <button
                              onClick={() => {
                                setSelectedInterlocutorId(user.id);
                                setActiveTab('DISCUSSIONS');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-emerald-500/20"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Amis · Écrire</span>
                            </button>
                          ) : status === 'PENDING_SENT' ? (
                            <span className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-[11px] font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Envoyée</span>
                            </span>
                          ) : status === 'PENDING_RECEIVED' ? (
                            <button
                              onClick={() => setActiveTab('REQUESTS')}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold cursor-pointer"
                            >
                              Répondre
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(user)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-colors"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Demander</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DEMANDES EN ATTENTE */}
          {activeTab === 'REQUESTS' && (
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              <div className="text-[11px] font-semibold text-slate-300">
                Demandes d'amis reçues ({pendingRequests.length})
              </div>

              {pendingRequests.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <UserCheck className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs text-slate-400">
                    Aucune demande d'ami en attente.
                  </p>
                </div>
              ) : (
                pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: req.fromUserAvatarColor || '#0284C7' }}
                      >
                        {req.fromUserName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {req.fromUserName}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {req.fromUserClub || req.fromUserEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleRespondFriendRequest(req.id, true)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accepter</span>
                      </button>
                      <button
                        onClick={() => handleRespondFriendRequest(req.id, false)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: CHAT WINDOW (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-slate-900/90">
          
          {/* Chat Header */}
          {activeInterlocutor ? (
            <div className="p-4 px-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <UserAvatar 
                    user={{ 
                      firstName: activeInterlocutor.name, 
                      avatarColor: activeInterlocutor.color, 
                      avatarUrl: activeInterlocutor.avatarUrl 
                    }} 
                    size="lg" 
                  />
                  {activeInterlocutor.isAdmin && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black shadow">
                      ★
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {activeInterlocutor.name}
                    </h3>
                    {activeInterlocutor.isAdmin ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Administrateur Officiel
                      </span>
                    ) : activeInterlocutor.isFriend ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Ami vérifié
                      </span>
                    ) : null}
                    {activeInterlocutor.statuses && activeInterlocutor.statuses.map((st, i) => (
                      <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-sky-300 border border-blue-500/30">
                        {st}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    {activeInterlocutor.email} · <span className="text-slate-300 font-sans">{activeInterlocutor.club}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {totalUnreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-sky-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
                    title="Marquer tous les messages comme lus pour effacer la pastille"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden sm:inline">Tout marquer comme lu ({totalUnreadCount})</span>
                  </button>
                )}

                {activeInterlocutor.isAdmin && (
                  <a
                    href={`mailto:${activeInterlocutor.email}?subject=Contact%20Data%20France%20Athl%C3%A9`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Envoyer un e-mail direct"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-slate-800 text-sm text-slate-400">
              Sélectionnez une conversation
            </div>
          )}

          {/* Chat Messages List */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-sky-400 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Début de la conversation
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Envoyez un message pour démarrer le dialogue en toute confidentialité.
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === currentUser.id;
                const isSystem = msg.senderId === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center py-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-slate-800/80 text-[11px] font-medium text-slate-300 border border-slate-700">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-semibold text-slate-300">
                        {isMe ? 'Vous' : msg.senderName}
                      </span>
                      {msg.isAdminChannel && !isMe && (
                        <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Admin
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-md sm:max-w-lg p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-tr-none shadow-md shadow-blue-900/30'
                          : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/80 shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    <div className="text-[9px] text-slate-500 mt-1 px-1 flex items-center gap-1">
                      {isMe && (msg.read ? 'Vu' : 'Distribué')}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form 
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Écrire à ${activeInterlocutor?.name || 'votre contact'}...`}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 disabled:opacity-50 text-white shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Envoyer le message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
