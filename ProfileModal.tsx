import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Camera, 
  Upload, 
  Trash2, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Building2, 
  Phone,
  RefreshCw,
  Video,
  Crop,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { UserAccount, FRENCH_REGIONS } from '../types/athletics';
import { StorageService } from '../services/storageService';
import { UserAvatar } from './UserAvatar';
import { ImageCropModal } from './ImageCropModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onProfileUpdated: (updatedUser: UserAccount) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  if (!isOpen || !currentUser) return null;

  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [lastName, setLastName] = useState(currentUser.lastName || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [club, setClub] = useState(currentUser.club || '');
  const [region, setRegion] = useState(currentUser.region || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser.avatarUrl);

  // Statuts dans l'athlétisme (multi-sélection + Autres)
  const initialStatuses = currentUser.statuses || ['Athlète'];
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    initialStatuses.filter(s => !s.startsWith('Autre'))
  );
  const [isOtherStatusChecked, setIsOtherStatusChecked] = useState<boolean>(
    Boolean(currentUser.otherStatusDetails || initialStatuses.some(s => s.startsWith('Autre')))
  );
  const [otherStatusText, setOtherStatusText] = useState<string>(
    currentUser.otherStatusDetails ||
    (initialStatuses.find(s => s.startsWith('Autre: '))?.replace('Autre: ', '') || '')
  );

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // État du modal de recadrage d'image
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // Mode caméra en direct
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Synchroniser quand currentUser change
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setEmail(currentUser.email || '');
      setClub(currentUser.club || '');
      setRegion(currentUser.region || '');
      setPhoneNumber(currentUser.phoneNumber || '');
      setAvatarUrl(currentUser.avatarUrl);
      const st = currentUser.statuses || ['Athlète'];
      setSelectedStatuses(st.filter(s => !s.startsWith('Autre')));
      setIsOtherStatusChecked(Boolean(currentUser.otherStatusDetails || st.some(s => s.startsWith('Autre'))));
      setOtherStatusText(
        currentUser.otherStatusDetails ||
        (st.find(s => s.startsWith('Autre: '))?.replace('Autre: ', '') || '')
      );
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [currentUser, isOpen]);

  // Nettoyage caméra à la fermeture
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError('');
  };

  const startCamera = async () => {
    try {
      setCameraError('');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback: déclencher l'input natif avec capture="user"
        cameraInputRef.current?.click();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });

      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn('Video play error', e));
        }
      }, 100);
    } catch (err: any) {
      console.warn('getUserMedia error, falling back to file input capture', err);
      cameraInputRef.current?.click();
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        // Ouvre directement l'outil interactif de recadrage
        setImageToCrop(dataUrl);
        setIsCropModalOpen(true);
      }
    } catch (e) {
      console.error('Snapshot capture error', e);
      setErrorMsg('Erreur lors de la capture de la photo.');
    } finally {
      stopCamera();
    }
  };

  // Traiter une image importée ou capturée par input : ouvre le recadrage interactif
  const processImageFile = (file: File) => {
    setErrorMsg('');
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (rawDataUrl) {
        // Déclencher le modal interactif de recadrage
        setImageToCrop(rawDataUrl);
        setIsCropModalOpen(true);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Erreur lors de la lecture du fichier image.');
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setAvatarUrl(croppedDataUrl);
    setIsCropModalOpen(false);
    setImageToCrop(null);
    setSuccessMsg('Photo recadrée avec succès ! N\'oubliez pas d\'enregistrer les modifications.');
  };

  const handleOpenRecrop = () => {
    if (avatarUrl) {
      setImageToCrop(avatarUrl);
      setIsCropModalOpen(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Réinitialiser l'input pour permettre de resélectionner la même photo
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
    setSuccessMsg('Photo retirée. Vos initiales et couleur seront affichées.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Le nom et le prénom sont obligatoires.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Veuillez renseigner une adresse email valide.');
      return;
    }

    // Validation des statuts
    const finalStatuses = [...selectedStatuses];
    if (isOtherStatusChecked) {
      const trimmed = otherStatusText.trim();
      if (trimmed) {
        finalStatuses.push(`Autre: ${trimmed}`);
      } else if (finalStatuses.length === 0) {
        setErrorMsg("Veuillez préciser votre statut dans le champ 'Autres' ou cocher au moins un statut.");
        return;
      }
    }

    if (finalStatuses.length === 0) {
      setErrorMsg('Veuillez cocher au moins un statut (Entraîneur, Athlète, Dirigeant, Jury ou Autres).');
      return;
    }

    setIsSaving(true);

    try {
      const res = StorageService.updateUserProfile(currentUser.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        club: club.trim(),
        region: region.trim(),
        phoneNumber: phoneNumber.trim(),
        avatarUrl: avatarUrl || '',
        statuses: finalStatuses,
        otherStatusDetails: isOtherStatusChecked ? otherStatusText.trim() : '',
      });

      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Erreur lors de la mise à jour du profil.');
        setIsSaving(false);
        return;
      }

      onProfileUpdated(res.user);
      setSuccessMsg('Profil mis à jour avec succès !');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview object for avatar
  const previewUser = {
    ...currentUser,
    firstName,
    lastName,
    avatarUrl,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-sky-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Mon Profil Membre
            </h2>
            <p className="text-xs text-slate-400">
              Gérez vos coordonnées officielles et votre photo de profil
            </p>
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Live Camera Modal Overlay */}
        {isCameraActive && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-blue-500/40 shadow-inner text-center space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                <Video className="w-4 h-4 animate-pulse" />
                <span>Caméra en direct</span>
              </span>
              <button
                type="button"
                onClick={stopCamera}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Annuler
              </button>
            </div>

            <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-sky-400/60 bg-black shadow-lg">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={takeSnapshot}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Prendre le cliché</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Fermer la caméra
              </button>
            </div>
          </div>
        )}

        {/* SECTION PHOTO DE PROFIL */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Photo de Profil
          </label>
          
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Visualisation de l'avatar */}
            <div className="relative group shrink-0">
              <UserAvatar user={previewUser} size="2xl" className="ring-4 ring-slate-800" />
              {avatarUrl && (
                <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleOpenRecrop}
                    className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer transition-transform hover:scale-110"
                    title="Recadrer / Ajuster le cadrage de la photo"
                  >
                    <Crop className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer transition-transform hover:scale-110"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Options d'ajout et de recadrage de photo */}
            <div className="flex-1 space-y-2.5 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Bouton Prendre une photo depuis son téléphone / appareil */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 hover:border-blue-500/60 text-sky-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                  title="Ouvrir l'appareil photo du smartphone, de la tablette ou la webcam"
                >
                  <Camera className="w-4 h-4 text-sky-400" />
                  <span>Prendre une photo</span>
                </button>

                {/* 2. Bouton Télécharger depuis ordinateur / téléphone / tablette */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                  title="Choisir une image depuis l'ordinateur, la galerie du téléphone ou tablette"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Importer un fichier</span>
                </button>
              </div>

              {/* Bouton direct pour réajuster le cadrage si une photo est déjà présente */}
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleOpenRecrop}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-sky-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                  title="Ouvrir l'outil de recadrage pour ajuster le zoom et le centrage"
                >
                  <Crop className="w-3.5 h-3.5 text-sky-400" />
                  <span>Recadrer / Ajuster le cadrage</span>
                </button>
              )}

              <p className="text-[11px] text-slate-400 leading-normal">
                Formats acceptés : JPG, PNG, WebP. Recadrez, déplacez et zoomez votre photo avec précision.
              </p>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>

        {/* FORMULAIRE DES COORDONNÉES */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Prénom */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Prénom <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-3.5 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Ex : Gabriel"
                />
              </div>
            </div>

            {/* Nom */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nom <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-3.5 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Ex : Tual"
                />
              </div>
            </div>

          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Adresse Email de connexion <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="nom.prenom@athle.fr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Région */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Région
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Sélectionnez votre région</option>
                  {FRENCH_REGIONS.map(r => (
                    <option key={r} value={r} className="bg-slate-900 text-white">
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Club */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Club d'athlétisme
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Ex : US Talence Athlétisme"
                />
              </div>
            </div>

          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Numéro de téléphone
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          {/* Sélection des Statuts dans l'athlétisme */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Vos statuts dans l'athlétisme <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-sky-400 font-medium">Plusieurs choix possibles</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left cursor-pointer ${
                      isChecked
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      isChecked 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'border-slate-700 bg-slate-950'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}

              {/* Autres */}
              <button
                type="button"
                onClick={() => setIsOtherStatusChecked(!isOtherStatusChecked)}
                className={`col-span-2 sm:col-span-4 flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all text-left cursor-pointer ${
                  isOtherStatusChecked
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                    isOtherStatusChecked 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'border-slate-700 bg-slate-950'
                  }`}>
                    {isOtherStatusChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>Autres</span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">
                  {isOtherStatusChecked ? 'Indiquez votre statut ci-dessous' : 'Précisez votre statut'}
                </span>
              </button>
            </div>

            {/* Champ de saisie personnalisé si Autres */}
            {isOtherStatusChecked && (
              <div className="pt-1 animate-fade-in">
                <label className="block text-[11px] font-semibold text-sky-300 mb-1">
                  Précisez votre statut personnalisé : <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required={isOtherStatusChecked && selectedStatuses.length === 0}
                  value={otherStatusText}
                  onChange={e => setOtherStatusText(e.target.value)}
                  placeholder="Ex : Kinésithérapeute, Officiel, Préparateur physique, Parent..."
                  className="w-full bg-slate-900 border border-sky-500/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 shadow-inner"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Rôle & Statut de sécurité */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">
                Statut : <strong className="text-white">
                  {currentUser.role === 'SUPER_ADMIN' ? 'Super Administrateur' : (currentUser.role === 'ADMIN' ? 'Administrateur' : 'Entraîneur Fédéral')}
                </strong>
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
              2FA Actif
            </span>
          </div>

          {/* Actions boutons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Enregistrer les modifications</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* Modal interactif de recadrage d'image de profil */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={imageToCrop}
        onClose={() => {
          setIsCropModalOpen(false);
          setImageToCrop(null);
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
