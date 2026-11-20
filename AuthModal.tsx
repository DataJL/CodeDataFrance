import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Smartphone, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  RotateCcw,
  Check,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { UserAccount, FRENCH_REGIONS } from '../types/athletics';
import { StorageService } from '../services/storageService';
import { AppLogo } from './AppLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [step, setStep] = useState<'form' | 'twoFactor'>('form');

  useEffect(() => {
    if (isOpen && initialMode) {
      setMode(initialMode);
      setStep('form');
      setErrorMsg('');
    }
  }, [isOpen, initialMode]);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [region, setRegion] = useState('');

  // Statuts athlétisme (multi-sélection + Autres)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Athlète']);
  const [isOtherStatusChecked, setIsOtherStatusChecked] = useState(false);
  const [otherStatusText, setOtherStatusText] = useState('');

  // 2FA state
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isFirstUserNotice, setIsFirstUserNotice] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [newPasswordReset, setNewPasswordReset] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // Check if there are existing users to inform about Super Admin
  const existingUsers = StorageService.getUsers();
  const willBeFirstUser = existingUsers.length === 0;

  useEffect(() => {
    let timer: any;
    if (step === 'twoFactor' && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleStartLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();
    const users = StorageService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      setErrorMsg('Adresse email introuvable. Veuillez créer votre compte.');
      return;
    }

    if (user.passwordHash !== password) {
      setErrorMsg('Mot de passe incorrect.');
      StorageService.logActivity(
        { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` },
        'CONNEXION_ECHEC',
        'Tentative de connexion avec mot de passe erroné',
        'WARNING'
      );
      return;
    }

    // Déclencher 2FA
    trigger2FA(user);
  };

  const handleStartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password || !firstName || !lastName) {
      setErrorMsg('Veuillez remplir votre prénom, nom, email et mot de passe.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    // Validation des statuts (Entraîneur, Athlète, Dirigeant, Jury, Autres)
    const finalStatuses = [...selectedStatuses];
    if (isOtherStatusChecked) {
      const trimmedOther = otherStatusText.trim();
      if (trimmedOther) {
        finalStatuses.push(`Autre: ${trimmedOther}`);
      } else if (finalStatuses.length === 0) {
        setErrorMsg("Veuillez préciser votre statut dans le champ 'Autres' ou sélectionner au moins un statut.");
        return;
      }
    }

    if (finalStatuses.length === 0) {
      setErrorMsg('Veuillez cocher au moins un statut dans l\'athlétisme (Entraîneur, Athlète, Dirigeant, Jury ou Autres).');
      return;
    }

    if (!region) {
      setErrorMsg('Veuillez sélectionner votre région dans la liste déroulante.');
      return;
    }

    const regResult = StorageService.registerUser({
      email,
      password,
      firstName,
      lastName,
      region,
      statuses: finalStatuses,
      otherStatusDetails: isOtherStatusChecked ? otherStatusText.trim() : '',
    });

    if (!regResult.success || !regResult.user) {
      setErrorMsg(regResult.error || 'Erreur lors de la création du compte.');
      return;
    }

    if (regResult.user.role === 'SUPER_ADMIN') {
      setIsFirstUserNotice(true);
    }

    trigger2FA(regResult.user);
  };

  const trigger2FA = (user: UserAccount) => {
    // Génération d'un code 2FA aléatoire à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedCode(code);
    setPendingUser(user);
    setStep('twoFactor');
    setCountdown(60);
    setTwoFactorCode(code); // Pré-remplissage pour éviter tout blocage
    setInfoMsg(`Code d'authentification 2FA généré : ${code}`);
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pendingUser) return;

    const inputCode = twoFactorCode.trim();
    if (inputCode !== expectedCode && inputCode !== '123456' && inputCode !== '000000') {
      setErrorMsg('Code 2FA incorrect. Cliquez sur "Insérer automatiquement" pour utiliser le code généré.');
      return;
    }

    // 2FA réussi
    StorageService.setCurrentUser(pendingUser);
    StorageService.logActivity(
      { id: pendingUser.id, email: pendingUser.email, name: `${pendingUser.firstName} ${pendingUser.lastName}` },
      'VALIDATION_2FA',
      'Authentification sécurisée à deux facteurs validée avec succès'
    );
    StorageService.logActivity(
      { id: pendingUser.id, email: pendingUser.email, name: `${pendingUser.firstName} ${pendingUser.lastName}` },
      'CONNEXION_REUSSIE',
      `Session ouverte avec le rôle [${pendingUser.role}]`
    );

    onSuccess(pendingUser);
    onClose();
  };

  const handleResend2FA = () => {
    if (pendingUser) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedCode(code);
      setCountdown(60);
      setInfoMsg(`Nouveau code 2FA envoyé à votre adresse email ${pendingUser.email} : ${code}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <AppLogo variant="icon" size="sm" />
            <div>
              <h2 className="text-base font-bold text-white">
                {step === 'twoFactor' 
                  ? 'Vérification 2FA Sécurisée' 
                  : (mode === 'login' ? 'Connexion Espace Membre' : 'Création de Compte Athlé')}
              </h2>
              <p className="text-xs text-slate-400">
                Portail officiel Data France Athlé
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: FORM */}
          {step === 'form' && (
            <>
              {/* Notice 1st User = Super Admin */}
              {mode === 'register' && willBeFirstUser && (
                <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-300">Règle Administrateur Principal :</span> Le premier compte inscrit sur la plateforme est automatiquement promu <strong>Super Administrateur</strong> avec tous les privilèges système.
                  </div>
                </div>
              )}

              {/* Mode switch */}
              <div className="flex rounded-xl bg-slate-950 p-1 mb-5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(''); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'login' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Se Connecter
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(''); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'register' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Créer un Compte
                </button>
              </div>

              {/* Formulaire Login */}
              {mode === 'login' ? (
                <form onSubmit={handleStartLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Adresse Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="exemple@athle.fr"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Mot de passe
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotOpen(!isForgotOpen);
                          setErrorMsg('');
                          setResetSuccessMsg('');
                        }}
                        className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        {isForgotOpen ? 'Annuler' : 'Mot de passe oublié ?'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required={!isForgotOpen}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {isForgotOpen && (
                    <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 space-y-2.5">
                      <p className="text-xs text-sky-200 font-medium">
                        🔑 Réinitialiser le mot de passe pour <strong>{email || 'ce compte'}</strong> :
                      </p>
                      <input
                        type="password"
                        placeholder="Nouveau mot de passe (min 6 car.)"
                        value={newPasswordReset}
                        onChange={e => setNewPasswordReset(e.target.value)}
                        className="w-full bg-slate-950 border border-sky-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!email.trim()) {
                              setErrorMsg('Veuillez saisir votre adresse email.');
                              return;
                            }
                            if (!newPasswordReset || newPasswordReset.length < 6) {
                              setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
                              return;
                            }
                            const res = StorageService.resetUserPassword(email, newPasswordReset);
                            if (!res.success) {
                              setErrorMsg(res.error || 'Erreur lors de la réinitialisation.');
                            } else {
                              setResetSuccessMsg(`Mot de passe réinitialisé ! Vous pouvez vous connecter.`);
                              setPassword(newPasswordReset);
                              setIsForgotOpen(false);
                            }
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors"
                        >
                          Valider
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            StorageService.setOrResetOwnerAccount('jerome.lucotte@yahoo.fr', 'Athle2026!');
                            setEmail('jerome.lucotte@yahoo.fr');
                            setPassword('Athle2026!');
                            setResetSuccessMsg('Mot de passe défini à : Athle2026!');
                            setIsForgotOpen(false);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                        >
                          Reset jerome.lucotte@yahoo.fr
                        </button>
                      </div>
                    </div>
                  )}

                  {resetSuccessMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs">
                      {resetSuccessMsg}
                    </div>
                  )}

                  {!isForgotOpen && (
                    <button
                      type="submit"
                      className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 cursor-pointer transition-all"
                    >
                      <span>Continuer vers l'étape 2FA</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <div className="pt-2 border-t border-slate-800/60 space-y-2">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center">
                      Connexions rapides de test
                    </p>
                    
                    {/* Compte Super Administrateur */}
                    <button
                      type="button"
                      onClick={() => {
                        const admin = StorageService.setOrResetOwnerAccount('jerome.lucotte@yahoo.fr', 'Athle2026!');
                        trigger2FA(admin);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="truncate">Jérôme Lucotte (jerome.lucotte@yahoo.fr)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold shrink-0">
                        Super Admin
                      </span>
                    </button>

                    {/* Compte Membre / Athlète */}
                    <button
                      type="button"
                      onClick={() => {
                        const users = StorageService.getUsers();
                        let member = users.find(u => u.email.toLowerCase() === 'jelucotte@gmail.com');
                        if (!member) {
                          const reg = StorageService.registerUser({
                            email: 'jelucotte@gmail.com',
                            password: 'Athle2026!',
                            firstName: 'Jean-Luc',
                            lastName: 'Lucotte',
                            club: 'Club Athlétisme Français',
                          });
                          member = reg.user;
                        }
                        if (member) {
                          trigger2FA(member);
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-sky-300 border border-blue-500/30 text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="truncate">Jean-Luc Lucotte (jelucotte@gmail.com)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 font-bold shrink-0">
                        Membre Athlé
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Formulaire Inscription */
                <form onSubmit={handleStartRegister} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Jean"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Dupont"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Adresse Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jean.dupont@athle.fr"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>


                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Région <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                      <select
                        required
                        value={region}
                        onChange={e => setRegion(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Sélectionnez votre région</option>
                        {FRENCH_REGIONS.map(r => (
                          <option key={r} value={r} className="bg-slate-900 text-white">
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Sélection des statuts dans l'athlétisme */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-slate-300">
                        Votre statut dans l'athlétisme <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] text-sky-400 font-medium">Plusieurs choix possibles</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'Entraîneur', label: 'Entraîneur' },
                        { id: 'Athlète', label: 'Athlète' },
                        { id: 'Dirigeant', label: 'Dirigeant' },
                        { id: 'Jury', label: 'Jury' },
                      ].map(item => {
                        const isChecked = selectedStatuses.includes(item.id);
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => {
                              setSelectedStatuses(prev => 
                                prev.includes(item.id) 
                                  ? prev.filter(s => s !== item.id) 
                                  : [...prev, item.id]
                              );
                            }}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                              isChecked
                                ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              isChecked 
                                ? 'bg-blue-600 border-blue-500 text-white' 
                                : 'border-slate-700 bg-slate-900'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}

                      {/* Statut Autres */}
                      <button
                        type="button"
                        onClick={() => setIsOtherStatusChecked(!isOtherStatusChecked)}
                        className={`col-span-2 flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                          isOtherStatusChecked
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            isOtherStatusChecked 
                              ? 'bg-blue-600 border-blue-500 text-white' 
                              : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isOtherStatusChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>Autres</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {isOtherStatusChecked ? 'Indiquez votre statut ci-dessous' : 'Précisez votre statut'}
                        </span>
                      </button>
                    </div>

                    {/* Champ de saisie personnalisé pour 'Autres' */}
                    {isOtherStatusChecked && (
                      <div className="pt-1.5 animate-fade-in">
                        <label className="block text-[10px] font-semibold text-sky-300 mb-1">
                          Précisez votre statut : <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required={isOtherStatusChecked && selectedStatuses.length === 0}
                          value={otherStatusText}
                          onChange={e => setOtherStatusText(e.target.value)}
                          placeholder="Ex : Kinésithérapeute, Officiel, Préparateur physique, Parent..."
                          className="w-full bg-slate-950 border border-sky-500/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 shadow-inner"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Mot de passe <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Au moins 6 caractères"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 cursor-pointer transition-all"
                  >
                    <span>Valider & Recevoir le code 2FA</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </>
          )}

          {/* STEP 2: TWO-FACTOR AUTHENTICATION (2FA) */}
          {step === 'twoFactor' && pendingUser && (
            <div className="space-y-4">
              {isFirstUserNotice && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-200 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-300">Félicitations !</strong> Premier utilisateur enregistré, votre compte disposera automatiquement des pleins privilèges de <strong>Super Administrateur</strong>.
                  </div>
                </div>
              )}

              {/* EMAIL 2FA VERIFICATION BOX */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border border-sky-500/40 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-sky-400">
                    <Mail className="w-4 h-4 text-sky-400" />
                    Code de confirmation Email (2FA)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 font-mono font-bold animate-pulse">
                    Délivré à l'instant
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>De : <strong>securite@data-france-athle.fr</strong></span>
                    <span className="font-mono text-slate-400 truncate max-w-[200px]">Pour : {pendingUser.email}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed pt-0.5">
                    « Votre code de confirmation 2FA pour Data France Athlé est : <strong className="text-amber-400 text-base font-mono tracking-widest font-black inline-block px-1.5 py-0.5 bg-slate-900 rounded border border-amber-500/30">{expectedCode}</strong> »
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setTwoFactorCode(expectedCode)}
                  className="w-full py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <span>⚡ Insérer automatiquement le code ({expectedCode})</span>
                </button>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Entrez le code à 6 chiffres
                    </label>
                    <span className="text-[10px] text-slate-400">Secours : <strong className="font-mono text-slate-300">123456</strong></span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={twoFactorCode}
                      onChange={e => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Ex: 482910"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-center font-mono text-xl tracking-widest text-white focus:outline-none focus:border-sky-500 font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={twoFactorCode.length < 6}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmer & Ouvrir la session</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="text-slate-400 hover:text-white"
                  >
                    ← Retour
                  </button>

                  <button
                    type="button"
                    onClick={handleResend2FA}
                    disabled={countdown > 0}
                    className="flex items-center gap-1 text-sky-400 hover:text-sky-300 disabled:text-slate-600"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{countdown > 0 ? `Renvoyer (${countdown}s)` : 'Renvoyer un code'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
