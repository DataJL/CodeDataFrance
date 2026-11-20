import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Cloud, 
  Github, 
  HardDrive, 
  FileCode, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Zap,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { CLOUD_STORAGE_GUIDE_MARKDOWN, CLOUD_STORAGE_CORS_JSON } from '../data/cloudStorageGuideContent';

interface CloudStorageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSampleUrl?: (url: string, seasonStart?: number, seasonEnd?: number, structure?: 'EXTERIEUR' | 'SALLE' | 'COMBINE') => void;
}

export const CloudStorageGuideModal: React.FC<CloudStorageGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectSampleUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'github' | 'cloudflare' | 'cors' | 'gzip' | 'compare'>('github');
  const [copiedCors, setCopiedCors] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  // Téléchargement du document au format Markdown (.md)
  const handleDownloadMarkdown = () => {
    const blob = new Blob([CLOUD_STORAGE_GUIDE_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Guide_Stockage_Bilans_GitHub_Cloudflare_R2.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Téléchargement du document au format Word / HTML lisible (.doc)
  const handleDownloadWord = () => {
    // Création d'un document Word compatible HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Guide Hébergement Bilans FFA - GitHub et Cloudflare R2</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 20px; }
          h1 { color: #0284c7; font-size: 24pt; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
          h2 { color: #0f172a; font-size: 16pt; margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          h3 { color: #334155; font-size: 13pt; }
          code, pre { font-family: Consolas, monospace; background: #f1f5f9; padding: 3px 6px; border-radius: 4px; font-size: 10pt; }
          pre { padding: 12px; display: block; border: 1px solid #e2e8f0; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          th { background: #f8fafc; font-weight: bold; }
          blockquote { border-left: 4px solid #38bdf8; margin: 12px 0; padding-left: 12px; color: #475569; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>Guide Complet : Hébergement & Diffusion Gratuite des Bilans FFA</h1>
        <p><strong>Application :</strong> Stats France Athlé</p>
        <p><strong>Auteur :</strong> Guide Technique Administrateur</p>
        <hr/>
        ${CLOUD_STORAGE_GUIDE_MARKDOWN
          .replace(/# (.*?)\n/g, '<h1>$1</h1>')
          .replace(/## (.*?)\n/g, '<h2>$1</h2>')
          .replace(/### (.*?)\n/g, '<h3>$1</h3>')
          .replace(/```json([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
          .replace(/```bash([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
          .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
          .replace(/\n\n/g, '<p></p>')
        }
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Guide_Stockage_Bilans_GitHub_Cloudflare_R2.doc');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* EN-TÊTE DU MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Guide Hébergement & Diffusion Gratuite des Bilans
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% Gratuit & Illimité
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Solutions pérennes pour diffuser vos fichiers CSV officiels (GitHub Releases / Raw & Cloudflare R2)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm"
              title="Télécharger le guide complet en Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger (.md)</span>
            </button>
            <button
              onClick={handleDownloadWord}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              title="Télécharger le guide au format Word / Document (.doc)"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Document (.doc)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION PAR ONGLETS */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>1. Pourquoi cette solution ?</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'github'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Github className="w-3.5 h-3.5 text-slate-200" />
            <span>2. Tutoriel GitHub (Releases & Raw)</span>
          </button>

          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'cloudflare'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Tutoriel Cloudflare R2</span>
          </button>

          <button
            onClick={() => setActiveTab('cors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'cors'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-rose-400" />
            <span>4. Configuration CORS (R2)</span>
          </button>

          <button
            onClick={() => setActiveTab('gzip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'gzip'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>5. Astuce Compression Gzip</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'compare'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>6. Comparatif & Bilan</span>
          </button>
        </div>

        {/* CONTENU PRINCIPAL DÉROULANT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          
          {/* ONGLET 1 : POURQUOI CETTE ARCHITECTURE ? */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-white text-base">
                      Le Problème du Quota Firestore vs les Gros Fichiers Bilans
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                      Firebase Firestore est une excellente base de données pour les profils utilisateurs et les favoris. Cependant, pour les bilans d'athlétisme contenant <strong>40 000 à 100 000 lignes par saison</strong>, écrire chaque performance dans Firestore consomme immédiatement le quota gratuit (limité à <strong>20 000 écritures par jour</strong>), ce qui bloque l'application avec l'erreur :
                    </p>
                    <div className="bg-slate-950 px-3 py-2 rounded-lg border border-rose-500/40 text-rose-300 font-mono text-xs mt-2">
                      FirebaseError: [code=resource-exhausted]: Quota limit exceeded...
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                    <HardDrive className="w-4 h-4" />
                    <span>Stockage Fichier Brut</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Les fichiers CSV complets restent stockés sur GitHub ou Cloudflare R2 en 1 seul bloc. Téléchargement instantané en 1 seule requête HTTP.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Zap className="w-4 h-4" />
                    <span>0 € de Coût Garanti</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    GitHub offre une bande passante 100% gratuite. Cloudflare R2 garantit zéro frais de sortie (Zero Egress) et 10 Go gratuits à vie.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <Layers className="w-4 h-4" />
                    <span>Cache IndexedDB Local</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Une fois téléchargé, le fichier est injecté dans le navigateur de l'utilisateur. Les requêtes, filtres et tops sont ultra-rapides et fonctionnent hors-ligne !
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Prêt à héberger vos fichiers ?</h4>
                  <p className="text-xs text-slate-400">Consultez le tutoriel GitHub (le plus simple, 5 minutes) ou Cloudflare R2.</p>
                </div>
                <button
                  onClick={() => setActiveTab('github')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs cursor-pointer transition-all"
                >
                  <span>Voir le tutoriel GitHub</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ONGLET 2 : TUTORIEL GITHUB (RELEASES & RAW) */}
          {activeTab === 'github' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5 text-white font-bold text-base">
                  <Github className="w-5 h-5 text-sky-400" />
                  <span>Méthode A : GitHub Releases (Recommandée — Fichiers jusqu'à 2 Go)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Idéale & la plus simple
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Cette méthode est la plus performante : elle ne pollue pas l'historique Git et permet d'associer des fichiers volumineux téléchargeables directement par URL sans limite de débit.
                </p>
              </div>

              {/* ÉTAPES PAS À PAS GITHUB */}
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">1</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Créer un dépôt public sur GitHub</h4>
                    <p className="text-xs text-slate-400">
                      Sur <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">github.com</a>, cliquez sur <strong>New repository</strong>. Nommez-le par exemple <code className="text-sky-300 bg-slate-900 px-1 py-0.5 rounded">stats-france-athle-data</code> et cochez impérativement <strong>Public</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">2</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Créer une Release (Version) pour la saison</h4>
                    <p className="text-xs text-slate-400">
                      Dans votre dépôt, cliquez sur <strong>Releases</strong> (à droite) puis <strong>Draft a new release</strong>.
                    </p>
                    <ul className="text-xs text-slate-400 list-disc list-inside space-y-0.5 pl-1">
                      <li>Tag version : <code className="text-sky-300 bg-slate-900 px-1 rounded">v2025-2026</code></li>
                      <li>Titre de la release : <code className="text-sky-300 bg-slate-900 px-1 rounded">Bilans Officiels FFA 2025-2026</code></li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">3</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Déposer les fichiers CSV officiels</h4>
                    <p className="text-xs text-slate-400">
                      Glissez vos fichiers dans la zone <span className="italic">"Attach binaries by dropping them here"</span> :
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-[11px] font-mono bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-700">Rslts_salle_25-26.csv</span>
                      <span className="text-[11px] font-mono bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-700">Rslts_PISTE_25-26.csv</span>
                    </div>
                    <p className="text-[11px] text-amber-300/80 pt-1">
                      💡 <em>Conseil : Évitez les espaces dans les noms de fichiers pour éviter les erreurs d'URL encodée (%20). Préférez les tirets <code className="text-white">_</code> ou <code className="text-white">-</code>.</em>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">4</div>
                  <div className="space-y-2 w-full">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Récupérer l'URL publique directe</h4>
                    <p className="text-xs text-slate-400">
                      Cliquez sur <strong>Publish release</strong>. Faites un clic droit sur votre fichier dans la liste des assets et sélectionnez <strong>"Copier l'adresse du lien"</strong>.
                    </p>
                    
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                      <span className="text-[11px] text-slate-500 font-medium">Format d'URL généré :</span>
                      <div className="flex items-center justify-between gap-2 font-mono text-xs text-sky-300 bg-slate-900/80 p-2 rounded border border-slate-800 overflow-x-auto">
                        <span>https://github.com/[UTILISATEUR]/[DEPOT]/releases/download/[TAG]/[FICHIER].csv</span>
                        <button
                          onClick={() => copyToClipboard('https://github.com/moncompte/stats-france-athle-data/releases/download/v2025-2026/Rslts_salle_25-26.csv', 'gh_url_sample')}
                          className="text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px]"
                        >
                          {copiedText === 'gh_url_sample' ? 'Copié !' : 'Copier'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MÉTHODE B : GITHUB RAW */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-200 uppercase tracking-wider">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>Méthode B Alternative : GitHub Raw (Fichiers &lt; 25 Mo)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Si vous préférez téléverser vos fichiers directement dans les dossiers de votre dépôt :
                </p>
                <ol className="text-xs text-slate-400 list-decimal list-inside space-y-1 pl-1">
                  <li>Cliquez sur <strong>Add file &gt; Upload files</strong> et déposez votre CSV.</li>
                  <li>Cliquez sur <strong>Commit changes</strong>.</li>
                  <li>Ouvrez le fichier sur GitHub, puis cliquez sur le bouton <strong>Raw</strong> en haut à droite.</li>
                  <li>L'URL directe dans la barre d'adresse ressemble à : <code className="text-indigo-300">https://raw.githubusercontent.com/.../main/Rslts_salle_25-26.csv</code></li>
                </ol>
              </div>
            </div>
          )}

          {/* ONGLET 3 : TUTORIEL CLOUDFLARE R2 */}
          {activeTab === 'cloudflare' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2.5 text-white font-bold text-base">
                  <Cloud className="w-5 h-5 text-amber-400" />
                  <span>Cloudflare R2 : Stockage S3 Haute Vitesse à Zéro Frais de Sortie</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    10 Go Gratuits à vie
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Cloudflare R2 est le stockage idéal pour les structures ou utilisateurs voulant un hébergement indépendant avec CDN mondial, sans jamais payer de bande passante (Zero Egress Fee).
                </p>
              </div>

              {/* ÉTAPES PAS À PAS CLOUDFLARE */}
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">1</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Créer un compte Cloudflare et activer R2</h4>
                    <p className="text-xs text-slate-400">
                      Rendez-vous sur <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">dash.cloudflare.com</a>. Dans le menu de gauche, cliquez sur <strong>R2 Object Storage</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">2</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Créer un Bucket (ex: athle-bilans-public)</h4>
                    <p className="text-xs text-slate-400">
                      Cliquez sur <strong>Create bucket</strong>. Donnez-lui un nom en minuscules (ex: <code className="text-amber-300 bg-slate-900 px-1 rounded">athle-bilans-public</code>). Choisissez la localisation <strong>Western Europe (WEUR)</strong> pour une latence minimale en France.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">3</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Téléverser les fichiers CSV officiels</h4>
                    <p className="text-xs text-slate-400">
                      Dans l'onglet <strong>Objects</strong> de votre bucket, cliquez sur <strong>Upload &gt; Upload files</strong> et glissez vos fichiers CSV.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">4</div>
                  <div className="space-y-2 w-full">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Activer le Domaine Public (R2.dev subdomain)</h4>
                    <p className="text-xs text-slate-400">
                      Allez dans l'onglet <strong>Settings</strong> du bucket. Descendez à la section <strong>Public access</strong>, et activez <strong>R2.dev subdomain</strong> (cliquez sur "Allow Access" et validez).
                    </p>
                    <p className="text-xs text-slate-300">
                      Cloudflare vous donne votre URL publique (ex: <code className="text-amber-300">https://pub-xxxxxx.r2.dev</code>). L'URL de votre fichier devient directement :
                    </p>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-amber-300">
                      https://pub-xxxxxx.r2.dev/Rslts_salle_25-26.csv
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-white text-xs">Étape Cruciale : Règle CORS Cloudflare</h5>
                    <p className="text-xs text-rose-200/90 mt-0.5">
                      Pour permettre à Stats France Athlé de lire le fichier depuis le navigateur sans être bloqué par la sécurité web, vous <strong>devez impérativement copier la règle CORS</strong> (onglet 4).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 4 : CONFIGURATION CORS (INDISPENSABLE POUR CLOUDFLARE R2) */}
          {activeTab === 'cors' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <FileCode className="w-5 h-5" />
                    <span>Règle CORS pour Cloudflare R2 (Obligatoire)</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(CLOUD_STORAGE_CORS_JSON);
                      setCopiedCors(true);
                      setTimeout(() => setCopiedCors(false), 2500);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs cursor-pointer transition-all shadow-sm"
                  >
                    {copiedCors ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCors ? 'JSON Copié !' : 'Copier le JSON CORS'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300">
                  Par mesure de sécurité, les navigateurs bloquent les requêtes de fichiers entre deux domaines différents (Cross-Origin). En collant ce JSON dans Cloudflare R2, vous autorisez votre application à télécharger vos bilans.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Comment l'installer en 30 secondes :</h4>
                <ol className="text-xs text-slate-300 list-decimal list-inside space-y-1.5 pl-1">
                  <li>Dans Cloudflare, ouvrez votre Bucket R2 (ex: <code className="text-sky-300">athle-bilans-public</code>).</li>
                  <li>Cliquez sur l'onglet <strong>Settings</strong> (Paramètres).</li>
                  <li>Descendez jusqu'à la section <strong>CORS Policy</strong> (Règles CORS).</li>
                  <li>Cliquez sur <strong>Add CORS policy</strong> (ou Edit).</li>
                  <li>Collez exactement le JSON ci-dessous et cliquez sur <strong>Save</strong>.</li>
                </ol>

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto">
                    {CLOUD_STORAGE_CORS_JSON}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(CLOUD_STORAGE_CORS_JSON);
                      setCopiedCors(true);
                      setTimeout(() => setCopiedCors(false), 2500);
                    }}
                    className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
                  >
                    {copiedCors ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 5 : ASTUCE COMPRESSION GZIP */}
          {activeTab === 'gzip' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Zap className="w-5 h-5" />
                  <span>Gain Spectaculaire : Compresser vos CSV en .gz (Gzip)</span>
                </div>
                <p className="text-xs text-slate-300">
                  Les bilans d'athlétisme contiennent énormément de texte répétitif (nom des clubs, épreuves, villes). La compression Gzip réduit la taille du fichier d'environ <strong>85% à 90%</strong> sans aucune perte de données !
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-center">
                  <span className="text-xs text-slate-400 font-medium">Fichier brut CSV</span>
                  <div className="text-2xl font-black text-rose-400">~18 à 22 Mo</div>
                  <span className="text-[11px] text-slate-500 block">Temps de téléchargement : ~3 à 5 sec</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-2 text-center">
                  <span className="text-xs text-slate-400 font-medium">Fichier compressé .csv.gz</span>
                  <div className="text-2xl font-black text-emerald-400">~2,2 à 2,8 Mo</div>
                  <span className="text-[11px] text-emerald-400 block">Temps de téléchargement : &lt; 0,5 sec (Ultra fluide !)</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Comment compresser facilement votre fichier :</h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <strong className="text-white">Sous Windows :</strong>
                    <p className="text-slate-400 mt-0.5">
                      Installez 7-Zip (gratuit). Clic droit sur votre fichier CSV &gt; <em>7-Zip</em> &gt; <em>Ajouter à l'archive...</em> &gt; Format de l'archive : <strong>gzip</strong>.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <strong className="text-white">Sous Mac ou Linux (Terminal) :</strong>
                    <div className="mt-1 font-mono text-purple-300 bg-slate-900 p-2 rounded">
                      gzip -k "Rslts salle 25-26.csv"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 6 : TABLEAU COMPARATIF & SYNTHÈSE */}
          {activeTab === 'compare' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950">
                      <th className="p-3 font-bold text-slate-300">Critère</th>
                      <th className="p-3 font-bold text-sky-400">GitHub (Releases / Raw)</th>
                      <th className="p-3 font-bold text-amber-400">Cloudflare R2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-3 font-semibold text-white">Coût mensuel</td>
                      <td className="p-3 text-emerald-400 font-bold">100% Gratuit</td>
                      <td className="p-3 text-emerald-400 font-bold">100% Gratuit (&lt; 10 Go)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-3 font-semibold text-white">Carte bancaire requise</td>
                      <td className="p-3 text-emerald-400 font-bold">Non (Aucune)</td>
                      <td className="p-3 text-amber-300">Oui (vérification compte)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-3 font-semibold text-white">Taille maximale par fichier</td>
                      <td className="p-3 text-slate-300"><strong>2 Go</strong> (Releases) / 25 Mo (Git)</td>
                      <td className="p-3 text-slate-300"><strong>5 To</strong></td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-3 font-semibold text-white">Bande passante (Egress)</td>
                      <td className="p-3 text-emerald-400 font-bold">Illimitée</td>
                      <td className="p-3 text-emerald-400 font-bold">Zéro frais garanti (0 €)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-3 font-semibold text-white">Temps de configuration</td>
                      <td className="p-3 text-sky-300">~ 5 minutes</td>
                      <td className="p-3 text-amber-300">~ 10 minutes</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-3 font-semibold text-white">Configuration CORS requise</td>
                      <td className="p-3 text-emerald-400">Automatique (GitHub Raw)</td>
                      <td className="p-3 text-rose-300">Oui (Coller le JSON CORS)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-3 font-semibold text-white">Verdict & Recommandation</td>
                      <td className="p-3 text-sky-300 font-semibold">
                        🏆 Recommandé pour 95% des utilisateurs : zéro CB, simple, pérenne.
                      </td>
                      <td className="p-3 text-amber-300 font-semibold">
                        Excellent si vous avez déjà un compte Cloudflare ou un nom de domaine dédié.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Conclusion</h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    Les deux solutions résolvent définitivement la contrainte des quotas NoSQL (Firestore). En publiant vos fichiers CSV officiels sur GitHub ou R2, vous offrez à tous les utilisateurs de l'application publiée un accès instantané et gratuit aux bilans de toutes les saisons d'athlétisme.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* PIED DE MODAL AVEC ACTIONS RAPIDES */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/90">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Guide officiel d'architecture de stockage — Stats France Athlé</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadMarkdown}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs cursor-pointer transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le Guide (.md)</span>
            </button>
            <button
              onClick={handleDownloadWord}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Télécharger (.doc)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs cursor-pointer transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
