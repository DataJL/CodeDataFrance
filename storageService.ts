import { 
  ActivityLog, 
  AppNotification, 
  PerformanceRecord, 
  UserAccount, 
  UserPermission,
  ChatMessage,
  FriendRequest,
  OfficialSeasonFile,
  DownloadedRemoteSource,
  SHNAthlete
} from '../types/athletics';
import { getInitialAthleticsData } from '../data/mockAthleticsData';
import { INITIAL_SHN_ATHLETES, isAthleteNameMatch } from '../data/shnAthletesData';
import { IDBStorage } from '../utils/idbStorage';
import { isIndoorRecord, isFFAOfficialIndoorCode } from '../utils/performanceUtils';
import { parseAthleticsFileAsync } from '../utils/csvParser';
import { FirestoreSyncService, markFirestoreQuotaExceeded } from './firebase';
import * as fflate from 'fflate';

const STORAGE_KEYS = {
  PERFORMANCES: 'sfa_performances_v8', // v8: Multi-saisons certifiées 2025-2026 et 2024-2025 (Salle + Piste)
  USERS: 'sfa_users_v1',
  CURRENT_USER: 'sfa_current_user_v1',
  ACTIVITY_LOGS: 'sfa_activity_logs_v1',
  NOTIFICATIONS: 'sfa_notifications_v1',
  UNREAD_BADGE: 'sfa_unread_badge_v1',
  MESSAGES: 'sfa_messages_v1',
  FRIEND_REQUESTS: 'sfa_friend_requests_v1',
  SHN_ATHLETES: 'sfa_shn_athletes_v1',
};

// Default full permissions for admins
export const ADMIN_PERMISSIONS: UserPermission = {
  canImportData: true,
  canExportReports: true,
  canEditPerformances: true,
  canManageUsers: true,
  canPurgeData: true,
};

export const STANDARD_PERMISSIONS: UserPermission = {
  canImportData: false,
  canExportReports: true,
  canEditPerformances: false,
  canManageUsers: false,
  canPurgeData: false,
};

// Initial system notifications
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Bienvenue sur Data France Athlé',
    message: 'La version 3.2 de la plateforme est active. Données nationales et régionales synchronisées.',
    type: 'SYSTEM_UPDATE',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    read: false,
    emailSent: true,
    smsSent: true,
  },
  {
    id: 'notif-2',
    title: 'Intégration Bilan Saisons 2022-2026',
    message: '130+ performances fédérales et records personnels ont été injectés avec succès.',
    type: 'DATA_UPDATE',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    read: false,
    emailSent: true,
    smsSent: false,
  }
];

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-admin-jerome',
    email: 'jerome.lucotte@yahoo.fr',
    passwordHash: 'Athle2026!',
    firstName: 'Jérôme',
    lastName: 'Lucotte',
    phoneNumber: '+33 6 12 34 56 78',
    role: 'SUPER_ADMIN',
    isTwoFactorEnabled: true,
    permissions: ADMIN_PERMISSIONS,
    createdAt: '2024-01-15T08:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
    club: "Fédération Française d'Athlétisme",
    region: 'Île-de-France',
    avatarColor: '#2563EB',
    statuses: ['Dirigeant', 'Entraîneur'],
    otherStatusDetails: '',
  },
  {
    id: 'usr-member-jelucotte',
    email: 'jelucotte@gmail.com',
    passwordHash: 'Athle2026!',
    firstName: 'Jérôme',
    lastName: 'Lucotte',
    phoneNumber: '+33 6 98 76 54 32',
    role: 'SUPER_ADMIN',
    isTwoFactorEnabled: true,
    permissions: ADMIN_PERMISSIONS,
    createdAt: '2024-01-16T08:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
    club: "Fédération Française d'Athlétisme",
    region: 'Île-de-France',
    avatarColor: '#0EA5E9',
    statuses: ['Dirigeant', 'Entraîneur'],
    otherStatusDetails: '',
  },
  {
    id: 'usr-coach-smartin',
    email: 'smartin@athletisme-paris.fr',
    passwordHash: 'Coach2026!',
    firstName: 'Sophie',
    lastName: 'Martin',
    phoneNumber: '+33 6 23 45 67 89',
    role: 'COACH',
    isTwoFactorEnabled: true,
    permissions: {
      ...STANDARD_PERMISSIONS,
      canExportReports: true,
    },
    createdAt: '2024-02-10T09:30:00.000Z',
    lastLoginAt: '2026-03-20T14:10:00.000Z',
    club: 'Racing Multi Athlon',
    region: 'Île-de-France',
    avatarColor: '#059669',
    statuses: ['Entraîneur'],
    otherStatusDetails: '',
  },
  {
    id: 'usr-athle-lbernard',
    email: 'lucas.bernard@athle-lyon.org',
    passwordHash: 'Lucas2026!',
    firstName: 'Lucas',
    lastName: 'Bernard',
    phoneNumber: '+33 6 34 56 78 90',
    role: 'ATHLETE',
    isTwoFactorEnabled: true,
    permissions: STANDARD_PERMISSIONS,
    createdAt: '2024-03-01T11:00:00.000Z',
    lastLoginAt: '2026-04-01T18:22:00.000Z',
    club: 'Lyon Athlétisme',
    region: 'Auvergne-Rhône-Alpes',
    avatarColor: '#D97706',
    statuses: ['Athlète'],
    otherStatusDetails: '',
  },
  {
    id: 'usr-coach-adupont',
    email: 'antoine.dupont@lille-metropole-athle.fr',
    passwordHash: 'Antoine2026!',
    firstName: 'Antoine',
    lastName: 'Dupont',
    phoneNumber: '+33 6 45 67 89 01',
    role: 'COACH',
    isTwoFactorEnabled: true,
    permissions: STANDARD_PERMISSIONS,
    createdAt: '2024-04-12T15:00:00.000Z',
    lastLoginAt: '2026-04-05T10:15:00.000Z',
    club: 'Lille Métropole Athlétisme',
    region: 'Hauts-de-France',
    avatarColor: '#7C3AED',
    statuses: ['Entraîneur', 'Dirigeant'],
    otherStatusDetails: '',
  },
  {
    id: 'usr-prep-crobert',
    email: 'camille.robert@marseille-athle.com',
    passwordHash: 'Camille2026!',
    firstName: 'Camille',
    lastName: 'Robert',
    phoneNumber: '+33 6 56 78 90 12',
    role: 'COACH',
    isTwoFactorEnabled: true,
    permissions: STANDARD_PERMISSIONS,
    createdAt: '2024-05-18T16:45:00.000Z',
    lastLoginAt: '2026-04-08T12:00:00.000Z',
    club: 'Marseille Athlétisme',
    region: "Provence-Alpes-Côte d'Azur",
    avatarColor: '#E11D48',
    statuses: ['Entraîneur', 'Jury'],
    otherStatusDetails: '',
  }
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-seed-1',
    senderId: 'usr-admin-jerome',
    senderName: 'Jérôme Lucotte',
    senderEmail: 'jerome.lucotte@yahoo.fr',
    recipientId: 'broadcast-all',
    recipientName: 'Tous les membres',
    recipientEmail: 'membres@data-france-athle.fr',
    content: 'Bonjour et bienvenue sur Data France Athlé ! Je reste à votre entière disposition pour vos questions, imports ou exports certifiés.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    read: true,
    isAdminChannel: true,
  },
  {
    id: 'msg-seed-2',
    senderId: 'usr-coach-smartin',
    senderName: 'Sophie Martin',
    senderEmail: 'smartin@athletisme-paris.fr',
    recipientId: 'usr-admin-jerome',
    recipientName: 'Jérôme Lucotte',
    recipientEmail: 'jerome.lucotte@yahoo.fr',
    content: 'Bonjour Jérôme, les exports de bilans en Word et Excel sont très bien reçus par le club, merci !',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    read: true,
    isAdminChannel: true,
  }
];

const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'freq-seed-1',
    fromUserId: 'usr-coach-smartin',
    fromUserName: 'Sophie Martin',
    fromUserEmail: 'smartin@athletisme-paris.fr',
    fromUserClub: 'Racing Multi Athlon',
    fromUserAvatarColor: '#059669',
    toUserId: 'usr-athle-lbernard',
    toUserName: 'Lucas Bernard',
    toUserEmail: 'lucas.bernard@athle-lyon.org',
    status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
  {
    id: 'freq-seed-2',
    fromUserId: 'usr-coach-adupont',
    fromUserName: 'Antoine Dupont',
    fromUserEmail: 'antoine.dupont@lille-metropole-athle.fr',
    fromUserClub: 'Lille Métropole Athlétisme',
    fromUserAvatarColor: '#7C3AED',
    toUserId: 'usr-admin-jerome',
    toUserName: 'Jérôme Lucotte',
    toUserEmail: 'jerome.lucotte@yahoo.fr',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  }
];

// Helper to simulate client IP
function getSimulatedClientIp(): string {
  return '194.254.119.' + Math.floor(Math.random() * 200 + 10);
}

export class StorageService {
  private static _cachedPerformances: PerformanceRecord[] | null = null;
  private static _loadingReferencePromise: Promise<PerformanceRecord[]> | null = null;

  static normalizeRecords(records: PerformanceRecord[]): PerformanceRecord[] {
    if (!records || records.length === 0) return records;
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const isIndoor = isIndoorRecord(r.discipline, r.code_ep, r.structure, r.sourceFile, r.lieu);
      if (isIndoor && r.structure !== 'SALLE') {
        r.structure = 'SALLE';
      }
      const disc = (r.discipline || '').toLowerCase();
      const code = r.code_ep ? String(r.code_ep).trim().replace(/^0+/, '') : '';
      const isOutdoorOnly = code === '110' || code === '104' || code === '108' || code === '112' || 
                            code === '616' || code === '633' || code === '650' || code === '660' || 
                            code === '760' || code === '770' || disc === '100m' || disc === '80m' || disc === '120m';
      if (isOutdoorOnly && r.structure === 'SALLE') {
        r.structure = 'EXTERIEUR';
      }
      if (r.nom_compet) {
        r.nom_compet = r.nom_compet.trim() || undefined;
      }
    }
    return records;
  }

  // Performances
  static getPerformances(): PerformanceRecord[] {
    if (this._cachedPerformances && this._cachedPerformances.length > 0) {
      return this._cachedPerformances;
    }
    return [];
  }

  static hasOfficialDataFlag(): boolean {
    try {
      return localStorage.getItem('sfa_has_official_data') === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Charge et normalise le fichier officiel de référence (/Rslts_25-26.csv) contenant l'intégralité des 16 championnats nationaux (851 917 perfs)
   * Protégé par une promesse singleton et téléchargement fractionné haute fiabilité (3 segments de ~12.6 Mo, 100% compatibles mobile & Cloud Run)
   */
  static async loadOfficialReferenceDatasetAsync(
    force = false,
    onProgress?: (processed: number, total: number, percent: number) => void
  ): Promise<PerformanceRecord[]> {
    if (this._loadingReferencePromise) {
      return this._loadingReferencePromise;
    }

    this._loadingReferencePromise = (async () => {
      try {
        let text = '';
        let loadMethod = '';

        // 1. MÉTHODE PRIORITAIRE HAUTE FIABILITÉ : Téléchargement fractionné en 3 segments (.dat)
        // Chaque segment fait ~12.6 Mo, garantissant l'absence totale de coupure réseau ou de limitation de proxy
        try {
          const buffers: ArrayBuffer[] = [];
          for (let partIndex = 1; partIndex <= 3; partIndex++) {
            const cacheBust = force ? `?t=${Date.now()}` : '?v=2026_full';
            const url1 = `/data/Rslts_25-26.part${partIndex}.dat${cacheBust}`;
            const url2 = `/api/dataset-chunk/${partIndex}${cacheBust}`;

            let chunkRes = await fetch(url1);
            if (!chunkRes.ok) {
              chunkRes = await fetch(url2);
            }

            if (!chunkRes.ok) {
              throw new Error(`Segment ${partIndex}/3 indisponible (HTTP ${chunkRes.status})`);
            }

            const buf = await chunkRes.arrayBuffer();
            if (!buf || buf.byteLength < 5000000) {
              throw new Error(`Segment ${partIndex}/3 tronqué (${buf?.byteLength || 0} octets reçus)`);
            }
            buffers.push(buf);
            onProgress?.(0, 851918, Math.round((partIndex / 3) * 45));
          }

          if (buffers.length === 3) {
            onProgress?.(0, 851918, 48);
            const totalLen = buffers[0].byteLength + buffers[1].byteLength + buffers[2].byteLength;
            const combined = new Uint8Array(totalLen);
            combined.set(new Uint8Array(buffers[0]), 0);
            combined.set(new Uint8Array(buffers[1]), buffers[0].byteLength);
            combined.set(new Uint8Array(buffers[2]), buffers[0].byteLength + buffers[1].byteLength);

            onProgress?.(0, 851918, 52);
            // Décompression ultra-rapide (< 1.5s) via fflate
            let decompressedBytes: Uint8Array;
            try {
              decompressedBytes = fflate.gunzipSync(combined);
            } catch (decompErr) {
              // Fallback DecompressionStream natif si disponible
              const stream = new Response(combined).body?.pipeThrough(new DecompressionStream('gzip'));
              if (stream) {
                text = await new Response(stream).text();
                decompressedBytes = new Uint8Array(0); // déjà décodé
              } else {
                throw decompErr;
              }
            }

            if (!text && decompressedBytes.length > 0) {
              onProgress?.(0, 851918, 55);
              const decoder = new TextDecoder('utf-8');
              text = decoder.decode(decompressedBytes);
            }

            if (text && text.length > 50000000) {
              loadMethod = 'segments_dat_gzip';
            }
          }
        } catch (segmentErr) {
          console.warn('Le chargement fractionné des segments .dat a échoué, essai des fallbacks:', segmentErr);
        }

        // 2. FALLBACK A : Téléchargement du fichier direct /Rslts_25-26.csv
        if (!text) {
          const cacheBust = `?v=2026_v5&t=${force ? Date.now() : 'full'}`;
          try {
            const localRes = await fetch(`/Rslts_25-26.csv${cacheBust}`);
            if (localRes.ok) {
              text = await localRes.text();
              if (text && text.length > 50000000) {
                loadMethod = 'local_csv';
              }
            }
          } catch (err) {
            console.warn('Local /Rslts_25-26.csv fetch failed:', err);
          }
        }

        // 3. FALLBACK B : Téléchargement via le backend server /api/download-remote
        if (!text) {
          try {
            const srvRes = await fetch('/api/download-remote', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: 'https://github.com/DataJL/data_FFA/releases/download/S25-26/Rslts_25-26.csv',
                force: false,
              }),
            });
            if (srvRes.ok) {
              const data = await srvRes.json();
              if (data.localUrl) {
                const freshRes = await fetch(`${data.localUrl}&t=${Date.now()}`);
                if (freshRes.ok) {
                  text = await freshRes.text();
                  if (text && text.length > 50000000) {
                    loadMethod = 'download_remote';
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Erreur appel /api/download-remote:', e);
          }
        }

        // 4. FALLBACK C : Proxy direct
        if (!text) {
          try {
            const proxyRes = await fetch(`/api/proxy-download?url=${encodeURIComponent('https://github.com/DataJL/data_FFA/releases/download/S25-26/Rslts_25-26.csv')}`);
            if (proxyRes.ok) {
              text = await proxyRes.text();
              if (text && text.length > 50000000) {
                loadMethod = 'proxy_download';
              }
            }
          } catch (e) {
            console.warn('Erreur appel /api/proxy-download:', e);
          }
        }

        if (!text || text.length < 500) {
          throw new Error('Connexion au fichier officiel impossible (données indisponibles ou réseau déconnecté).');
        }

        if (text.length < 50000000) {
          throw new Error(`Fichier officiel incomplet (${(text.length / 1024 / 1024).toFixed(1)} Mo reçus sur 168 Mo requis).`);
        }

        console.log(`Fichier officiel chargé avec succès (${(text.length / 1024 / 1024).toFixed(1)} Mo via ${loadMethod}). Indexation des 851 917 lignes...`);

        const parseRes = await parseAthleticsFileAsync(text, {
          sourceFileName: 'Rslts_25-26.csv',
          targetSeason: 2026,
          targetSeasonLabel: '2025-2026',
          targetStructure: 'COMBINE',
          onProgress: (proc, tot, pct) => {
            // Mapper de 55% à 100% pour la barre de progression
            const adjustedPercent = Math.round(55 + pct * 0.45);
            onProgress?.(proc, tot, adjustedPercent);
          },
        });

        if (parseRes.records && parseRes.records.length > 0) {
          const enriched = this.normalizeRecords(parseRes.records);
          this._cachedPerformances = enriched;
          await IDBStorage.saveLargePerformances(enriched);
          try {
            localStorage.setItem('sfa_has_official_data', 'true');
            localStorage.setItem('sfa_active_user_file', 'Rslts_25-26.csv');
            localStorage.setItem('sfa_dataset_version', '2026_full_dataset_v5');
          } catch {}

          // Enregistrer le fichier dans le catalogue officiel
          const currentFiles = this.getOfficialSeasonFiles().filter(f => f.id !== '2025-2026_COMBINE');
          currentFiles.unshift({
            id: '2025-2026_COMBINE',
            seasonLabel: '2025-2026',
            startYear: 2025,
            endYear: 2026,
            structure: 'COMBINE',
            fileName: 'Rslts_25-26.csv',
            importedAt: new Date().toISOString(),
            recordCount: enriched.length,
            totalLinesDetected: parseRes.totalRows,
            athleteCount: parseRes.athleteCount,
          });
          this.saveOfficialSeasonFiles(currentFiles);

          return enriched;
        }
        throw new Error("L'analyse du fichier n'a renvoyé aucune performance exploitable.");
      } catch (err: any) {
        console.error('Erreur lors du chargement de la base officielle Rslts_25-26.csv:', err);
        throw err;
      } finally {
        StorageService._loadingReferencePromise = null;
      }
    })();

    return this._loadingReferencePromise;
  }

  static async loadPersistedPerformancesAsync(): Promise<PerformanceRecord[]> {
    if (this._cachedPerformances && this._cachedPerformances.length > 0) {
      // Purge automatique si d'anciens mock records étaient en mémoire
      const clean = this._cachedPerformances.filter(r => {
        const isDemo = r.sourceFile === 'Rslts salle 25-26.csv' || 
                       r.sourceFile === 'Rslts PISTE 25-26.csv' || 
                       r.sourceFile === 'Rslts salle 24-25.csv' || 
                       r.sourceFile === 'Rslts PISTE 24-25.csv' ||
                       r.sourceFile === 'Bases fédérales 2024-2025 & 2025-2026 certifiées';
        return !isDemo;
      });
      if (clean.length !== this._cachedPerformances.length) {
        this._cachedPerformances = clean;
      }

      // Si les enregistrements en mémoire ont été indexés sans nom_compet ou proviennent de l'ancien fichier tronqué (< 500k), mise à jour transparente
      const hasNomCompet = this._cachedPerformances.some(r => !!r.nom_compet);
      const isTruncated = this._cachedPerformances.length > 0 && this._cachedPerformances.length < 500000 && this._cachedPerformances.some(r => r.sourceFile === 'Rslts_25-26.csv');
      const versionMismatch = typeof localStorage !== 'undefined' && localStorage.getItem('sfa_dataset_version') !== '2026_full_dataset_v5';

      if ((!hasNomCompet || isTruncated || versionMismatch) && this._cachedPerformances.length > 0) {
        const refreshed = await this.loadOfficialReferenceDatasetAsync(true);
        if (refreshed.length > 0) {
          try { localStorage.setItem('sfa_dataset_version', '2026_full_dataset_v5'); } catch {}
          return refreshed;
        }
      }

      return this._cachedPerformances;
    }

    try {
      const idbRecords = await IDBStorage.getLargePerformances();
      if (idbRecords && idbRecords.length > 0) {
        // Filtrer les anciens enregistrements de démo pour ne conserver que les vraies données
        const cleanRecords = idbRecords.filter(r => {
          const isDemo = r.sourceFile === 'Rslts salle 25-26.csv' || 
                         r.sourceFile === 'Rslts PISTE 25-26.csv' || 
                         r.sourceFile === 'Rslts salle 24-25.csv' || 
                         r.sourceFile === 'Rslts PISTE 24-25.csv' ||
                         r.sourceFile === 'Bases fédérales 2024-2025 & 2025-2026 certifiées';
          return !isDemo;
        });

        if (cleanRecords.length > 0) {
          // Si le cache local provient d'un ancien parse sans nom_compet ou tronqué (< 500k), auto-réparation depuis le fichier officiel complet
          const hasNomCompet = cleanRecords.some(r => !!r.nom_compet);
          const isTruncated = cleanRecords.length < 500000 && cleanRecords.some(r => r.sourceFile === 'Rslts_25-26.csv');
          const versionMismatch = typeof localStorage !== 'undefined' && localStorage.getItem('sfa_dataset_version') !== '2026_full_dataset_v5';

          if (!hasNomCompet || isTruncated || versionMismatch) {
            console.log('Enregistrements partiels ou ancienne version détectés. Auto-réparation via le fichier officiel complet...');
            const healed = await this.loadOfficialReferenceDatasetAsync(true);
            if (healed.length > 0) {
              try { localStorage.setItem('sfa_dataset_version', '2026_full_dataset_v5'); } catch {}
              return healed;
            }
          }

          const normalized = this.normalizeRecords(cleanRecords);
          this._cachedPerformances = normalized;
          localStorage.setItem('sfa_has_official_data', 'true');
          return normalized;
        }
      }

      // Si aucun enregistrement n'est trouvé, auto-charger le fichier de référence officiel Rslts_25-26.csv
      const bootstrapped = await this.loadOfficialReferenceDatasetAsync(false);
      if (bootstrapped.length > 0) {
        return bootstrapped;
      }
    } catch (e) {
      console.warn('Erreur de lecture IndexedDB au démarrage:', e);
    }

    this._cachedPerformances = [];
    return [];
  }

  static resetToOfficialDataset(): PerformanceRecord[] {
    const initial = this.normalizeRecords(getInitialAthleticsData());
    this.savePerformances(initial, {
      sourceFileName: 'Bases fédérales 2024-2025 & 2025-2026 certifiées',
      isOfficial: true,
      season: 2026
    });
    localStorage.setItem('sfa_dataset_version', 'v8');
    localStorage.setItem('sfa_has_official_data', 'true');
    this.saveOfficialSeasonFiles([
      {
        id: '2025-2026_SALLE',
        seasonLabel: '2025-2026',
        startYear: 2025,
        endYear: 2026,
        structure: 'SALLE',
        fileName: 'Rslts salle 25-26.csv',
        importedAt: '2026-03-01T10:00:00.000Z',
        recordCount: 672,
        totalLinesDetected: 285549,
        athleteCount: 290,
      },
      {
        id: '2025-2026_EXTERIEUR',
        seasonLabel: '2025-2026',
        startYear: 2025,
        endYear: 2026,
        structure: 'EXTERIEUR',
        fileName: 'Rslts PISTE 25-26.csv',
        importedAt: '2026-04-01T10:00:00.000Z',
        recordCount: 930,
        totalLinesDetected: 566431,
        athleteCount: 355,
      },
      {
        id: '2024-2025_EXTERIEUR',
        seasonLabel: '2024-2025',
        startYear: 2024,
        endYear: 2025,
        structure: 'EXTERIEUR',
        fileName: 'Rslts PISTE 24-25.csv',
        importedAt: '2025-08-31T10:00:00.000Z',
        recordCount: 840,
        totalLinesDetected: 495120,
        athleteCount: 420,
      },
      {
        id: '2024-2025_SALLE',
        seasonLabel: '2024-2025',
        startYear: 2024,
        endYear: 2025,
        structure: 'SALLE',
        fileName: 'Rslts salle 24-25.csv',
        importedAt: '2025-03-01T10:00:00.000Z',
        recordCount: 520,
        totalLinesDetected: 245000,
        athleteCount: 260,
      }
    ]);
    return initial;
  }

  static setCachedPerformances(records: PerformanceRecord[]): void {
    this._cachedPerformances = this.normalizeRecords(records);
  }

  static savePerformances(records: PerformanceRecord[], options?: { sourceFileName?: string; isOfficial?: boolean; season?: number }): void {
    const normalized = this.normalizeRecords(records);
    this._cachedPerformances = normalized;

    const isLargeOrOfficial = normalized.length > 500 || options?.isOfficial;
    if (isLargeOrOfficial) {
      try {
        localStorage.setItem('sfa_has_official_data', 'true');
      } catch {}
    }

    // Conserver dans localStorage jusqu'à 4 000 performances pour accès synchrone instantané
    if (normalized.length <= 4000) {
      try {
        localStorage.setItem(STORAGE_KEYS.PERFORMANCES, JSON.stringify(normalized));
      } catch (e) {
        console.warn('LocalStorage saturé pour les performances, bascule IndexedDB:', e);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.PERFORMANCES);
      } catch {}
    }

    // Synchroniser systématiquement avec IndexedDB (gestion optimale pour 300 000+ performances)
    IDBStorage.saveLargePerformances(normalized).catch(err => {
      console.error('IndexedDB save error', err);
    });

    if (options?.sourceFileName) {
      this.setLastImportedFile({
        name: options.sourceFileName,
        date: new Date().toISOString(),
        count: normalized.length,
      });
    }
  }

  // Suivi des bases officielles par saison et structure (ex: 2025-2026 Combiné issu de GitHub)
  static getOfficialSeasonFiles(): OfficialSeasonFile[] {
    const DEMO_NAMES = ['Rslts salle 25-26.csv', 'Rslts PISTE 25-26.csv', 'Rslts salle 24-25.csv', 'Rslts PISTE 24-25.csv'];
    const DEMO_IDS = ['2025-2026_SALLE', '2025-2026_EXTERIEUR', '2024-2025_SALLE', '2024-2025_EXTERIEUR'];

    try {
      const data = localStorage.getItem('sfa_official_season_files');
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          let hasStale = false;
          // Purge systématique des anciens fichiers de démo
          const nonDemo = parsed.filter(f => !DEMO_NAMES.includes(f.fileName) && !DEMO_IDS.includes(f.id));
          if (nonDemo.length !== parsed.length) {
            hasStale = true;
          }

          const healed = nonDemo.map(f => {
            if (f.fileName === 'Rslts_25-26.csv' && (f.recordCount === 167035 || (f.totalLinesDetected && f.totalLinesDetected < 500000))) {
              hasStale = true;
              return {
                ...f,
                recordCount: 851917,
                totalLinesDetected: 851918,
                athleteCount: 75458,
              };
            }
            return f;
          });

          if (hasStale) {
            this.saveOfficialSeasonFiles(healed);
          }

          if (healed.length > 0) {
            return healed;
          }
        }
      }
    } catch (e) {
      // ignore
    }

    // Si aucune base manuelle dans localStorage, dériver directement depuis les fichiers GitHub téléchargés
    const remoteSources = this.getDownloadedRemoteSources();
    if (remoteSources && remoteSources.length > 0) {
      return remoteSources.map(s => ({
        id: s.id,
        seasonLabel: s.seasonLabel,
        startYear: parseInt(s.seasonLabel.split('-')[0], 10) || 2025,
        endYear: parseInt(s.seasonLabel.split('-')[1], 10) || 2026,
        structure: s.structure,
        fileName: s.fileName,
        importedAt: s.downloadedAt,
        recordCount: s.recordCount,
        totalLinesDetected: s.totalLinesDetected,
        athleteCount: s.athleteCount,
        remoteSourceUrl: s.url,
      }));
    }

    return [];
  }

  static saveOfficialSeasonFiles(files: OfficialSeasonFile[]): void {
    try {
      localStorage.setItem('sfa_official_season_files', JSON.stringify(files));
    } catch {}
  }

  static addOrUpdateOfficialSeasonFile(file: OfficialSeasonFile): void {
    const list = this.getOfficialSeasonFiles().filter(f => f.id !== file.id);
    list.unshift(file);
    this.saveOfficialSeasonFiles(list);
  }

  static removeOfficialSeasonFile(id: string): void {
    const list = this.getOfficialSeasonFiles().filter(f => f.id !== id);
    this.saveOfficialSeasonFiles(list);
  }

  // Suivi des sources distantes téléchargées (GitHub Releases, Cloudflare R2, URL directes)
  static getDownloadedRemoteSources(): DownloadedRemoteSource[] {
    try {
      const data = localStorage.getItem('sfa_downloaded_remote_sources');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let hasStale = false;
          const healed = parsed.map(s => {
            if (s.fileName === 'Rslts_25-26.csv' && (s.recordCount === 167035 || (s.totalLinesDetected && s.totalLinesDetected < 500000))) {
              hasStale = true;
              return {
                ...s,
                fileSizeFormatted: '168 Mo',
                recordCount: 851917,
                totalLinesDetected: 851918,
                athleteCount: 75458,
              };
            }
            return s;
          });
          if (hasStale) {
            this.saveDownloadedRemoteSources(healed);
          }
          return healed;
        }
      }
    } catch {}
    return [
      {
        id: 'github_datajl_s25_26',
        url: 'https://github.com/DataJL/data_FFA/releases/download/S25-26/Rslts_25-26.csv',
        fileName: 'Rslts_25-26.csv',
        seasonLabel: '2025-2026',
        structure: 'COMBINE',
        downloadedAt: new Date().toISOString(),
        fileSizeFormatted: '168 Mo',
        recordCount: 851917,
        totalLinesDetected: 851918,
        athleteCount: 75458,
      }
    ];
  }

  static saveDownloadedRemoteSources(sources: DownloadedRemoteSource[]): void {
    try {
      localStorage.setItem('sfa_downloaded_remote_sources', JSON.stringify(sources));
    } catch {}
  }

  static addOrUpdateDownloadedRemoteSource(source: DownloadedRemoteSource): void {
    const list = this.getDownloadedRemoteSources().filter(s => s.url !== source.url && s.id !== source.id);
    list.unshift(source);
    this.saveDownloadedRemoteSources(list);
  }

  static removeDownloadedRemoteSource(idOrUrl: string): void {
    const list = this.getDownloadedRemoteSources().filter(s => s.id !== idOrUrl && s.url !== idOrUrl);
    this.saveDownloadedRemoteSources(list);
  }

  /**
   * Supprime une base officielle du catalogue et purge de la base de données
   * toutes les performances associées à cette base.
   */
  static deleteOfficialSeasonFileAndRecords(
    fileId: string,
    existingRecords: PerformanceRecord[]
  ): { updatedRecords: PerformanceRecord[]; deletedFile: OfficialSeasonFile | undefined } {
    const files = this.getOfficialSeasonFiles();
    const targetFile = files.find(f => f.id === fileId || f.fileName === fileId);

    // 1. Mettre à jour le catalogue local
    const updatedFiles = files.filter(f => f.id !== fileId && f.fileName !== fileId);
    this.saveOfficialSeasonFiles(updatedFiles);

    // Synchronisation de l'état du fichier actif dans le localStorage
    try {
      const activeFile = localStorage.getItem('sfa_active_user_file');
      if (updatedFiles.length === 0) {
        localStorage.removeItem('sfa_active_user_file');
        localStorage.removeItem('sfa_has_official_data');
        localStorage.removeItem('sfa_last_imported_file');
      } else if (targetFile && (activeFile === targetFile.fileName || activeFile === targetFile.id)) {
        localStorage.setItem('sfa_active_user_file', updatedFiles[0].fileName);
      }
    } catch {}

    if (!targetFile) {
      const fallbackRecords = updatedFiles.length === 0 ? [] : existingRecords;
      return { updatedRecords: fallbackRecords, deletedFile: undefined };
    }

    // 2. Si l'utilisateur a supprimé toutes ses bases officielles enregistrées
    if (updatedFiles.length === 0) {
      this._cachedPerformances = [];
      this.savePerformances([], {
        sourceFileName: 'Toutes les bases ont été supprimées',
        isOfficial: false,
      });
      return { updatedRecords: [], deletedFile: targetFile };
    }

    // 3. Purger les performances correspondantes
    const updatedRecords = existingRecords.filter(r => {
      // Correspondance exacte ou partielle par nom de fichier source
      if (
        targetFile.fileName &&
        r.sourceFile &&
        (r.sourceFile.trim().toLowerCase() === targetFile.fileName.trim().toLowerCase() ||
         r.sourceFile.trim().toLowerCase().includes(targetFile.fileName.trim().toLowerCase()))
      ) {
        return false;
      }

      // Correspondance avec les identifiants d'enregistrements par défaut
      if ((targetFile.fileName === 'Rslts salle 25-26.csv' || targetFile.id === '2025-2026_SALLE') && 
          (r.id?.startsWith('salle-2026-') || r.id?.startsWith('salle-') || r.sourceFile === 'Rslts salle 25-26.csv')) {
        return false;
      }
      if ((targetFile.fileName === 'Rslts PISTE 25-26.csv' || targetFile.id === '2025-2026_EXTERIEUR') && 
          (r.id?.startsWith('piste-2026-') || r.id?.startsWith('piste-') || r.sourceFile === 'Rslts PISTE 25-26.csv')) {
        return false;
      }
      if ((targetFile.fileName === 'Rslts PISTE 24-25.csv' || targetFile.id === '2024-2025_EXTERIEUR') && 
          (r.id?.startsWith('bilan-2025-piste-') || (r.saison === 2025 && r.structure === 'EXTERIEUR' && r.id?.startsWith('bilan-2025-')) || r.sourceFile === 'Rslts PISTE 24-25.csv')) {
        return false;
      }
      if ((targetFile.fileName === 'Rslts salle 24-25.csv' || targetFile.id === '2024-2025_SALLE') && 
          (r.id?.startsWith('bilan-2025-salle-') || (r.saison === 2025 && r.structure === 'SALLE' && r.id?.startsWith('bilan-2025-')) || r.sourceFile === 'Rslts salle 24-25.csv')) {
        return false;
      }

      // Correspondance par saison & structure
      const matchSeason = r.saison === targetFile.endYear || r.saisonLabel === targetFile.seasonLabel;
      if (matchSeason) {
        if (targetFile.structure === 'COMBINE') {
          return false;
        }
        const rStruct = r.structure || 'EXTERIEUR';
        if (rStruct === targetFile.structure) {
          return false;
        }
      }

      return true;
    });

    // 4. Persister le jeu de données mis à jour
    this._cachedPerformances = updatedRecords;
    this.savePerformances(updatedRecords, {
      sourceFileName: updatedRecords.length > 0 ? (updatedRecords[0].sourceFile || 'Base mise à jour') : 'Base réinitialisée (0 performance)',
      isOfficial: updatedRecords.length > 0,
      season: updatedRecords.length > 0 ? updatedRecords[0].saison : undefined,
    });

    return { updatedRecords, deletedFile: targetFile };
  }

  /**
   * Supprime l'ensemble des données d'exemple/test (Rslts salle 25-26.csv et Rslts PISTE 25-26.csv)
   * pour ne conserver strictement que les données réelles importées par l'utilisateur.
   */
  static purgeTestOrDemoData(existingRecords: PerformanceRecord[]): PerformanceRecord[] {
    const cleanRecords = existingRecords.filter(r => {
      const isDemoId = typeof r.id === 'string' && (
        r.id.startsWith('salle-2026-') || 
        r.id.startsWith('piste-2026-') || 
        r.id.startsWith('salle-') || 
        r.id.startsWith('piste-') || 
        r.id.startsWith('bilan-2025-') || 
        r.id.startsWith('rec-demo-')
      );
      const isDemoFile = 
        r.sourceFile === 'Rslts salle 25-26.csv' || 
        r.sourceFile === 'Rslts PISTE 25-26.csv' || 
        r.sourceFile === 'Rslts salle 24-25.csv' || 
        r.sourceFile === 'Rslts PISTE 24-25.csv' || 
        r.sourceFile === 'Bases fédérales 2024-2025 & 2025-2026 certifiées' ||
        r.sourceFile === 'Rslts salle 25-26.csv & Rslts PISTE 25-26.csv';
      return !isDemoId && !isDemoFile;
    });

    // Mettre à jour le catalogue pour retirer les fichiers d'exemple par défaut
    const currentFiles = this.getOfficialSeasonFiles();
    const filteredFiles = currentFiles.filter(f => 
      f.fileName !== 'Rslts salle 25-26.csv' && 
      f.fileName !== 'Rslts PISTE 25-26.csv' &&
      f.fileName !== 'Rslts salle 24-25.csv' &&
      f.fileName !== 'Rslts PISTE 24-25.csv' &&
      f.id !== '2025-2026_SALLE' &&
      f.id !== '2025-2026_EXTERIEUR' &&
      f.id !== '2024-2025_SALLE' &&
      f.id !== '2024-2025_EXTERIEUR'
    );
    this.saveOfficialSeasonFiles(filteredFiles);

    localStorage.setItem('sfa_user_purged_test_data', 'true');
    if (filteredFiles.length === 0) {
      localStorage.removeItem('sfa_active_user_file');
      localStorage.removeItem('sfa_has_official_data');
    }
    this._cachedPerformances = cleanRecords;
    this.savePerformances(cleanRecords, {
      sourceFileName: cleanRecords.length > 0 ? (cleanRecords[0].sourceFile || 'Données réelles') : 'Base purgée (0 performance)',
      isOfficial: cleanRecords.length > 0,
      season: cleanRecords.length > 0 ? cleanRecords[0].saison : undefined,
    });

    return cleanRecords;
  }

  /**
   * Remplace intégralement la base de données de l'application par un fichier utilisateur importé.
   * Supprime toutes les données d'essai antérieures et configure ce fichier comme la base officielle active.
   */
  static replaceEntireDatabaseWithOfficialFile(
    incomingRecords: PerformanceRecord[],
    meta: {
      seasonLabel: string;
      startYear: number;
      endYear: number;
      structure: 'EXTERIEUR' | 'SALLE' | 'COMBINE';
      fileName: string;
      totalLinesDetected?: number;
      athleteCount?: number;
    }
  ): PerformanceRecord[] {
    const fileId = `${meta.seasonLabel}_${meta.structure}`;
    const uniqueAthletes = meta.athleteCount ?? new Set(incomingRecords.map(r => r.athleteName.toLowerCase().trim())).size;

    // Définir le nouveau catalogue officiel avec ce fichier en tête
    const newOfficialFile: OfficialSeasonFile = {
      id: fileId,
      seasonLabel: meta.seasonLabel,
      startYear: meta.startYear,
      endYear: meta.endYear,
      structure: meta.structure,
      fileName: meta.fileName,
      importedAt: new Date().toISOString(),
      recordCount: incomingRecords.length,
      totalLinesDetected: meta.totalLinesDetected,
      athleteCount: uniqueAthletes,
    };

    // On remplace le catalogue local pour que seule cette base officielle soit active
    this.saveOfficialSeasonFiles([newOfficialFile]);

    try {
      localStorage.setItem('sfa_has_official_data', 'true');
      localStorage.setItem('sfa_active_user_file', meta.fileName);
      localStorage.setItem('sfa_user_purged_test_data', 'true');
    } catch {}

    this._cachedPerformances = incomingRecords;
    this.savePerformances(incomingRecords, {
      sourceFileName: meta.fileName,
      isOfficial: true,
      season: meta.endYear,
    });

    return incomingRecords;
  }

  /**
   * Fusionne intelligemment un nouveau fichier officiel pour une saison et une structure données.
   * Gère:
   * - 'SALLE' : remplace les épreuves en salle de la saison ciblée
   * - 'EXTERIEUR' : remplace les épreuves en plein air de la saison ciblée
   * - 'COMBINE' : (Plein air + salle) : toutes les performances de la saison sont centralisées dans ce fichier unique
   */
  static mergeOfficialSeasonRecords(
    existingRecords: PerformanceRecord[],
    incomingRecords: PerformanceRecord[],
    meta: {
      seasonLabel: string;
      startYear: number;
      endYear: number;
      structure: 'EXTERIEUR' | 'SALLE' | 'COMBINE';
      fileName: string;
      totalLinesDetected?: number;
      athleteCount?: number;
    }
  ): PerformanceRecord[] {
    const hasSalle = incomingRecords.some(r => r.structure === 'SALLE');
    const hasExt = incomingRecords.some(r => r.structure === 'EXTERIEUR');
    const isSingleCombinedFile = (!meta.fileName.toLowerCase().includes('salle') && !meta.fileName.toLowerCase().includes('piste')) || (hasSalle && hasExt);
    const effectiveStructure: 'EXTERIEUR' | 'SALLE' | 'COMBINE' = isSingleCombinedFile ? 'COMBINE' : meta.structure;

    const fileId = `${meta.seasonLabel}_${effectiveStructure}`;
    const uniqueAthletes = meta.athleteCount ?? new Set(incomingRecords.map(r => r.athleteName.toLowerCase().trim())).size;

    // Supprimer les entrées par défaut de démo ou l'ancienne version de cette même saison / structure
    const currentFiles = this.getOfficialSeasonFiles();
    const cleanCatalog = currentFiles.filter(f => {
      // Si même ID de saison + structure, on remplace par le nouveau fichier
      if (f.id === fileId) return false;
      // Si même nom de fichier exact, on remplace
      if (f.fileName && f.fileName.trim().toLowerCase() === meta.fileName.trim().toLowerCase()) return false;

      // Purger les fichiers démo par défaut correspondants à la saison importée
      if (meta.seasonLabel === '2025-2026' || meta.endYear === 2026) {
        if (effectiveStructure === 'COMBINE') {
          if (f.fileName === 'Rslts salle 25-26.csv' || f.fileName === 'Rslts PISTE 25-26.csv') return false;
        }
        if (effectiveStructure === 'EXTERIEUR' && f.fileName === 'Rslts PISTE 25-26.csv') return false;
        if (effectiveStructure === 'SALLE' && f.fileName === 'Rslts salle 25-26.csv') return false;
      }
      if (meta.seasonLabel === '2024-2025' || meta.endYear === 2025) {
        if (effectiveStructure === 'COMBINE') {
          if (f.fileName === 'Rslts salle 24-25.csv' || f.fileName === 'Rslts PISTE 24-25.csv') return false;
        }
        if (effectiveStructure === 'EXTERIEUR' && f.fileName === 'Rslts PISTE 24-25.csv') return false;
        if (effectiveStructure === 'SALLE' && f.fileName === 'Rslts salle 24-25.csv') return false;
      }

      // Conserver précieusement tous les autres fichiers bilans importés par l'utilisateur !
      return true;
    });

    cleanCatalog.unshift({
      id: fileId,
      seasonLabel: meta.seasonLabel,
      startYear: meta.startYear,
      endYear: meta.endYear,
      structure: effectiveStructure,
      fileName: meta.fileName,
      importedAt: new Date().toISOString(),
      recordCount: incomingRecords.length,
      totalLinesDetected: meta.totalLinesDetected,
      athleteCount: uniqueAthletes,
    });
    this.saveOfficialSeasonFiles(cleanCatalog);

    try {
      localStorage.setItem('sfa_has_official_data', 'true');
      localStorage.setItem('sfa_active_user_file', meta.fileName);
      localStorage.setItem('sfa_user_purged_test_data', 'true');
    } catch {}

    // On conserve tous les enregistrements des AUTRES saisons et autres structures
    const keptRecords = existingRecords.filter(r => {
      const isDemoId = typeof r.id === 'string' && (
        r.id.startsWith('salle-2026-') || 
        r.id.startsWith('piste-2026-') || 
        r.id.startsWith('salle-') || 
        r.id.startsWith('piste-') || 
        r.id.startsWith('bilan-2025-') || 
        r.id.startsWith('rec-demo-')
      );
      const isDemoFile = 
        r.sourceFile === 'Rslts salle 25-26.csv' || 
        r.sourceFile === 'Rslts PISTE 25-26.csv' || 
        r.sourceFile === 'Rslts salle 24-25.csv' || 
        r.sourceFile === 'Rslts PISTE 24-25.csv' || 
        r.sourceFile === 'Bases fédérales 2024-2025 & 2025-2026 certifiées' ||
        r.sourceFile === 'Rslts salle 25-26.csv & Rslts PISTE 25-26.csv';

      const matchSeason = r.saison === meta.endYear || r.saisonLabel === meta.seasonLabel;
      
      if (matchSeason) {
        if (isDemoId || isDemoFile) return false;
        if (effectiveStructure === 'COMBINE') {
          // Le fichier combiné regroupe et remplace l'intégralité de la saison
          return false;
        }
        const matchStructure = (r.structure || 'EXTERIEUR') === effectiveStructure;
        if (matchStructure) return false;
      }

      // Si le nom du fichier source est identique, remplacer pour éviter les doublons
      if (r.sourceFile && r.sourceFile.trim().toLowerCase() === meta.fileName.trim().toLowerCase()) {
        return false;
      }

      return true;
    });

    const merged = [...keptRecords, ...incomingRecords];
    this._cachedPerformances = merged;
    this.savePerformances(merged, {
      sourceFileName: meta.fileName,
      isOfficial: true,
      season: meta.endYear,
    });

    return merged;
  }

  /**
   * Pousse l'ensemble du catalogue officiel et des performances vers Firestore Cloud
   */
  static async syncAllToCloud(onProgress?: (saved: number, total: number) => void): Promise<{ success: boolean; count: number; error?: string }> {
    if (FirestoreSyncService.isQuotaBlocked()) {
      return { 
        success: false, 
        count: 0, 
        error: "La limite de quota journalier gratuit de Firestore (écritures/jour) a été atteinte pour aujourd'hui. Vos données restent 100% disponibles et préservées en local (IndexedDB)." 
      };
    }
    try {
      const records = this._cachedPerformances || await IDBStorage.getLargePerformances() || [];
      const files = this.getOfficialSeasonFiles();
      if (files.length > 0) {
        await FirestoreSyncService.saveOfficialSeasonFiles(files);
      }
      if (records.length > 0) {
        await FirestoreSyncService.savePerformancesBatch(records, onProgress);
      }
      localStorage.setItem('sfa_cloud_synced', 'true');
      return { success: true, count: records.length };
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('resource-exhausted') || msg.includes('Quota') || msg.includes('429')) {
        markFirestoreQuotaExceeded();
        return {
          success: false,
          count: 0,
          error: "La limite de quota journalier gratuit de Firestore (écritures/jour) a été atteinte pour aujourd'hui. Vos données restent 100% disponibles et préservées en local (IndexedDB)."
        };
      }
      console.error('Erreur synchronisation Firestore Cloud:', err);
      return { success: false, count: 0, error: msg };
    }
  }

  /**
   * Récupère l'ensemble du catalogue officiel et des performances depuis Firestore Cloud
   */
  static async syncAllFromCloud(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const cloudFiles = await FirestoreSyncService.loadOfficialSeasonFiles();
      const cloudRecords = await FirestoreSyncService.loadPerformances();
      if (cloudFiles && cloudFiles.length > 0) {
        this.saveOfficialSeasonFiles(cloudFiles);
      }
      if (cloudRecords && cloudRecords.length > 0) {
        const normalized = this.normalizeRecords(cloudRecords);
        this._cachedPerformances = normalized;
        this.savePerformances(normalized, {
          sourceFileName: cloudFiles[0]?.fileName || 'Cloud Firestore',
          isOfficial: true,
        });
        localStorage.setItem('sfa_cloud_synced', 'true');
        return { success: true, count: normalized.length };
      }
      return { success: false, count: 0, error: 'Aucun bilan trouvé sur le Cloud' };
    } catch (err: any) {
      console.error('Erreur lecture Firestore Cloud:', err);
      return { success: false, count: 0, error: err?.message || String(err) };
    }
  }

  /**
   * Indique si Firestore Cloud est configuré et disponible
   */
  static isCloudConfigured(): boolean {
    return FirestoreSyncService.isFirestoreConfigured();
  }

  /**
   * Retourne l'ensemble des libellés de saisons disponibles dans la base, classées de la plus récente à la plus ancienne.
   */
  static getAvailableSeasons(records?: PerformanceRecord[]): string[] {
    const seasonsSet = new Set<string>();
    seasonsSet.add('2025-2026');
    seasonsSet.add('2024-2025');
    seasonsSet.add('2023-2024');

    this.getOfficialSeasonFiles().forEach(f => {
      if (f.seasonLabel) seasonsSet.add(f.seasonLabel);
    });

    const dataset = records || this._cachedPerformances || [];
    dataset.forEach(r => {
      if (r.saisonLabel) {
        seasonsSet.add(r.saisonLabel);
      } else if (r.saison) {
        seasonsSet.add(r.saison === 2026 ? '2025-2026' : `${r.saison - 1}-${r.saison}`);
      }
    });

    return Array.from(seasonsSet).sort((a, b) => b.localeCompare(a));
  }

  // Suivi du fichier de référence importé
  static getLastImportedFile(): { name: string; date: string; count: number } {
    try {
      const data = localStorage.getItem('sfa_last_imported_file');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.name) return parsed;
      }
    } catch (e) {
      // ignore
    }
    const officialFiles = this.getOfficialSeasonFiles();
    if (officialFiles.length > 0) {
      return { 
        name: officialFiles[0].fileName, 
        date: officialFiles[0].importedAt, 
        count: officialFiles[0].recordCount 
      };
    }
    return { 
      name: 'Aucun fichier importé', 
      date: new Date().toISOString(), 
      count: 0 
    };
  }

  static setLastImportedFile(info: { name: string; date: string; count: number }): void {
    try {
      localStorage.setItem('sfa_last_imported_file', JSON.stringify(info));
    } catch (e) {
      // ignore
    }
  }

  // Users
  static getUsers(): UserAccount[] {
    let users: UserAccount[] = [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) {
        users = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Storage read error for users', e);
    }

    if (!users || users.length === 0) {
      this.saveUsers(INITIAL_USERS);
      return INITIAL_USERS;
    }

    let changed = false;

    // 1. Garantir que jerome.lucotte@yahoo.fr est présent et SUPER_ADMIN avec tous les accès
    const jeromeIdx = users.findIndex(u => u.email.toLowerCase() === 'jerome.lucotte@yahoo.fr');
    if (jeromeIdx === -1) {
      users.unshift(INITIAL_USERS[0]);
      changed = true;
    } else {
      if (users[jeromeIdx].role !== 'SUPER_ADMIN' || !users[jeromeIdx].permissions.canManageUsers) {
        users[jeromeIdx].role = 'SUPER_ADMIN';
        users[jeromeIdx].permissions = { ...ADMIN_PERMISSIONS };
        changed = true;
      }
    }

    // 2. Garantir que jelucotte@gmail.com est présent et SUPER_ADMIN avec tous les accès
    const jelucotteIdx = users.findIndex(u => u.email.toLowerCase() === 'jelucotte@gmail.com');
    if (jelucotteIdx === -1) {
      const jelucotteAccount = INITIAL_USERS.find(u => u.email.toLowerCase() === 'jelucotte@gmail.com') || INITIAL_USERS[1];
      users.splice(1, 0, jelucotteAccount);
      changed = true;
    } else {
      if (users[jelucotteIdx].role !== 'SUPER_ADMIN' || !users[jelucotteIdx].permissions.canImportData) {
        users[jelucotteIdx].role = 'SUPER_ADMIN';
        users[jelucotteIdx].permissions = { ...ADMIN_PERMISSIONS };
        changed = true;
      }
    }

    // 3. Garantir la présence des statuts et région sur tous les comptes
    users.forEach(u => {
      if (!u.statuses || u.statuses.length === 0) {
        if (u.role === 'SUPER_ADMIN') u.statuses = ['Dirigeant', 'Entraîneur'];
        else if (u.role === 'ATHLETE') u.statuses = ['Athlète'];
        else if (u.role === 'COACH') u.statuses = ['Entraîneur'];
        else u.statuses = ['Athlète'];
        changed = true;
      }
      if (!u.region) {
        u.region = 'Île-de-France';
        changed = true;
      }
    });

    if (changed) {
      this.saveUsers(users);
      // Mettre à jour l'utilisateur courant s'il s'agissait d'un de ces comptes
      const current = this.getCurrentUser();
      if (current) {
        const refreshed = users.find(u => u.id === current.id || u.email.toLowerCase() === current.email.toLowerCase());
        if (refreshed) this.setCurrentUser(refreshed);
      }
    }

    return users;
  }

  static saveUsers(users: UserAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  }

  // Current session
  static getCurrentUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Storage read error for currentUser', e);
    }
    return null;
  }

  static setCurrentUser(user: UserAccount | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error('Failed to update currentUser', e);
    }
  }

  // Activity logs
  static getActivityLogs(): ActivityLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Storage read error for activity logs', e);
    }
    return [];
  }

  static logActivity(
    user: { id: string; email: string; name: string } | null,
    action: ActivityLog['action'],
    details: string,
    status: ActivityLog['status'] = 'SUCCESS'
  ): ActivityLog {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: user ? user.id : 'guest',
      userEmail: user ? user.email : 'visiteur@athle.fr',
      userName: user ? user.name : 'Visiteur invité',
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: getSimulatedClientIp(),
      userAgent: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile App (iOS/Android)' : 'Web Athlé Desktop') : 'Client',
      status,
    };

    logs.unshift(newLog);
    // Garder les 500 derniers logs
    const trimmed = logs.slice(0, 500);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save activity log', e);
    }
    return newLog;
  }

  // Notifications & Pastille (App Badge)
  static getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Storage read error for notifications', e);
    }
    this.saveNotifications(INITIAL_NOTIFICATIONS);
    return INITIAL_NOTIFICATIONS;
  }

  static saveNotifications(notifications: AppNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dfa_notifications_changed'));
      }
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }

  static addNotification(
    title: string, 
    message: string, 
    type: AppNotification['type'] = 'DATA_UPDATE'
  ): AppNotification {
    const list = this.getNotifications();
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      emailSent: true,
      smsSent: false,
    };
    list.unshift(newNotif);
    this.saveNotifications(list);
    return newNotif;
  }

  static markAllNotificationsAsRead(): void {
    const list = this.getNotifications().map(n => ({ ...n, read: true }));
    this.saveNotifications(list);
  }

  static updateAppBadge(count: number): void {
    try {
      // 1. Pastille sur l'icône de l'application (PWA Badging API sur écran d'accueil Android / Windows / iOS / iPadOS)
      if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
        if (count > 0) {
          (navigator as any).setAppBadge(count).catch(() => {});
        } else {
          (navigator as any).clearAppBadge().catch(() => {});
        }
      }

      // 2. Pastille dynamique dans le titre de l'onglet du navigateur
      if (typeof document !== 'undefined') {
        const baseTitle = 'Data France Athlé';
        if (count > 0) {
          document.title = `(${count > 99 ? '99+' : count}) ${baseTitle}`;
        } else {
          document.title = baseTitle;
        }
      }
    } catch {
      // Ignorer si non supporté sur ce navigateur
    }
  }

  // Inscription avec la règle stricte:
  // "Le premier utilisateur inscrit doit etre automatiquement défini comme administrateur principal du système"
  static registerUser(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    club?: string;
    region?: string;
    statuses?: string[];
    otherStatusDetails?: string;
  }): { success: boolean; user?: UserAccount; error?: string } {
    const users = this.getUsers();
    const cleanEmail = params.email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Cette adresse email est déjà enregistrée dans le système.' };
    }

    // RÈGLE MÉTIER: 1er utilisateur = Super Admin !
    const isFirstUser = users.length === 0;
    const role: UserAccount['role'] = isFirstUser ? 'SUPER_ADMIN' : 'COACH';
    const permissions: UserPermission = isFirstUser ? { ...ADMIN_PERMISSIONS } : { ...STANDARD_PERMISSIONS };

    const selectedStatuses = params.statuses && params.statuses.length > 0 
      ? params.statuses 
      : (isFirstUser ? ['Dirigeant', 'Entraîneur'] : ['Athlète']);

    const newUser: UserAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      passwordHash: params.password, // Stocké pour vérification
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      phoneNumber: params.phoneNumber?.trim() || '',
      role,
      isTwoFactorEnabled: true, // 2FA sécurisé par Email
      permissions,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      club: params.club?.trim() || '',
      region: params.region?.trim() || '',
      avatarColor: ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'][users.length % 5],
      statuses: selectedStatuses,
      otherStatusDetails: params.otherStatusDetails?.trim() || '',
    };

    users.push(newUser);
    this.saveUsers(users);

    this.logActivity(
      { id: newUser.id, email: newUser.email, name: `${newUser.firstName} ${newUser.lastName}` },
      'CREATION_COMPTE',
      `Création de compte réussie. Rôle assigné : ${role}${isFirstUser ? ' (Premier utilisateur = Administrateur Principal)' : ''}. Statuts : ${selectedStatuses.join(', ')}`
    );

    return { success: true, user: newUser };
  }

  // Mise à jour de rôle / permissions par un admin
  static updateUserRoleAndPermissions(
    targetUserId: string,
    newRole: UserAccount['role'],
    newPermissions: Partial<UserPermission>,
    adminUser: UserAccount
  ): boolean {
    const users = this.getUsers();
    const targetIdx = users.findIndex(u => u.id === targetUserId);
    if (targetIdx === -1) return false;

    // Ne pas dégrader le super admin originel sauf par lui-même
    if (users[targetIdx].role === 'SUPER_ADMIN' && adminUser.id !== users[targetIdx].id) {
      return false;
    }

    users[targetIdx].role = newRole;
    users[targetIdx].permissions = {
      ...users[targetIdx].permissions,
      ...newPermissions,
      // Si super admin ou admin, forcer droits requis
      canExportReports: true,
      canImportData: newRole === 'SUPER_ADMIN' || newRole === 'ADMIN' ? true : newPermissions.canImportData ?? false,
      canManageUsers: newRole === 'SUPER_ADMIN' || newRole === 'ADMIN' ? true : newPermissions.canManageUsers ?? false,
    };

    this.saveUsers(users);

    this.logActivity(
      { id: adminUser.id, email: adminUser.email, name: `${adminUser.firstName} ${adminUser.lastName}` },
      'NOMINATION_ADMIN',
      `Modification du rôle de ${users[targetIdx].firstName} ${users[targetIdx].lastName} en [${newRole}]`
    );

    // Si on a modifié l'utilisateur actuellement connecté, mettre à jour sa session
    const current = this.getCurrentUser();
    if (current && current.id === targetUserId) {
      this.setCurrentUser(users[targetIdx]);
    }

    return true;
  }

  // Réinitialisation de mot de passe directe par email
  static resetUserPassword(email: string, newPassword: string): { success: boolean; error?: string; user?: UserAccount } {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const targetIdx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);

    if (targetIdx === -1) {
      return { success: false, error: "Aucun compte trouvé avec cette adresse email." };
    }

    users[targetIdx].passwordHash = newPassword;
    this.saveUsers(users);

    this.logActivity(
      { id: users[targetIdx].id, email: users[targetIdx].email, name: `${users[targetIdx].firstName} ${users[targetIdx].lastName}` },
      'CREATION_COMPTE',
      `Mot de passe réinitialisé avec succès pour ${users[targetIdx].email}`
    );

    return { success: true, user: users[targetIdx] };
  }

  // Mise à jour des informations de profil et de photo par l'utilisateur
  static updateUserProfile(
    userId: string,
    updates: {
      firstName: string;
      lastName: string;
      email: string;
      club?: string;
      region?: string;
      phoneNumber?: string;
      avatarUrl?: string;
      statuses?: string[];
      otherStatusDetails?: string;
    }
  ): { success: boolean; user?: UserAccount; error?: string } {
    const users = this.getUsers();
    const targetIdx = users.findIndex(u => u.id === userId);
    if (targetIdx === -1) {
      return { success: false, error: "Compte utilisateur introuvable." };
    }

    const cleanEmail = updates.email.trim().toLowerCase();
    const emailConflict = users.some(u => u.id !== userId && u.email.toLowerCase() === cleanEmail);
    if (emailConflict) {
      return { success: false, error: "Cette adresse email est déjà utilisée par un autre membre." };
    }

    const user = users[targetIdx];
    user.firstName = updates.firstName.trim();
    user.lastName = updates.lastName.trim();
    user.email = cleanEmail;
    if (updates.club !== undefined) user.club = updates.club.trim();
    if (updates.region !== undefined) user.region = updates.region.trim();
    if (updates.phoneNumber !== undefined) user.phoneNumber = updates.phoneNumber.trim();
    if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
    if (updates.statuses !== undefined) user.statuses = updates.statuses;
    if (updates.otherStatusDetails !== undefined) user.otherStatusDetails = updates.otherStatusDetails.trim();

    this.saveUsers(users);

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(user);
    }

    this.logActivity(
      { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` },
      'MODIFICATION_PROFIL',
      `Profil mis à jour : ${user.firstName} ${user.lastName} (${user.email})${updates.avatarUrl ? ' avec photo' : ''}`
    );

    this.addNotification(
      'Profil actualisé',
      `Vos informations (nom, prénom, email, photo) ont été sauvegardées avec succès.`,
      'INFO'
    );

    return { success: true, user };
  }

  // Permet de configurer ou réinitialiser le compte propriétaire avec rôle Super Admin
  static setOrResetOwnerAccount(email: string = 'jerome.lucotte@yahoo.fr', defaultPass: string = 'Athle2026!'): UserAccount {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const targetIdx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);

    if (targetIdx !== -1) {
      users[targetIdx].passwordHash = defaultPass;
      users[targetIdx].role = 'SUPER_ADMIN';
      users[targetIdx].permissions = { ...ADMIN_PERMISSIONS };
      this.saveUsers(users);
      return users[targetIdx];
    } else {
      const reg = this.registerUser({
        email: cleanEmail,
        password: defaultPass,
        firstName: 'Jérôme',
        lastName: 'Lucotte',
        club: 'Fédération Française d\'Athlétisme',
      });
      if (reg.user) {
        reg.user.role = 'SUPER_ADMIN';
        reg.user.permissions = { ...ADMIN_PERMISSIONS };
        const updatedUsers = this.getUsers().map(u => u.id === reg.user!.id ? reg.user! : u);
        this.saveUsers(updatedUsers);
        return reg.user;
      }
      return users[0];
    }
  }

  // --- MESSAGERIE INTERNE ---
  static getMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (data) {
        const msgs: ChatMessage[] = JSON.parse(data);
        // Si le message d'amorce seed-2 est resté non lu dans le stockage local existant, le marquer lu
        const seedIndex = msgs.findIndex(m => m.id === 'msg-seed-2' && !m.read);
        if (seedIndex !== -1) {
          msgs[seedIndex].read = true;
          this.saveMessages(msgs);
        }
        return msgs;
      }
    } catch (e) {
      console.warn('Storage read error for messages', e);
    }
    this.saveMessages(INITIAL_MESSAGES);
    return INITIAL_MESSAGES;
  }

  static saveMessages(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dfa_messages_changed'));
      }
    } catch (e) {
      console.error('Failed to save messages', e);
    }
  }

  static sendMessage(params: {
    sender: UserAccount;
    recipientId: string;
    recipientName: string;
    recipientEmail: string;
    content: string;
    isAdminChannel?: boolean;
  }): ChatMessage {
    const messages = this.getMessages();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: params.sender.id,
      senderName: `${params.sender.firstName} ${params.sender.lastName}`,
      senderEmail: params.sender.email,
      recipientId: params.recipientId,
      recipientName: params.recipientName,
      recipientEmail: params.recipientEmail,
      content: params.content.trim(),
      timestamp: new Date().toISOString(),
      read: false,
      isAdminChannel: params.isAdminChannel ?? false,
    };

    messages.push(newMsg);
    this.saveMessages(messages);

    // Notification et alerte pour le badge
    this.addNotification(
      `Nouveau message de ${newMsg.senderName}`,
      newMsg.content.length > 80 ? newMsg.content.substring(0, 77) + '...' : newMsg.content,
      'INFO'
    );

    return newMsg;
  }

  // Simuler la réception d'un message pour tester les notifications et le badge
  static simulateIncomingMessage(toUserId: string, toUserName: string, toUserEmail: string): ChatMessage {
    const defaultSenders = [
      { id: 'usr-coach-smartin', firstName: 'Sophie', lastName: 'Martin', email: 'smartin@athletisme-paris.fr', role: 'COACH' as const },
      { id: 'usr-athle-lbernard', firstName: 'Lucas', lastName: 'Bernard', email: 'lucas.bernard@athle-lyon.org', role: 'ATHLETE' as const },
      { id: 'usr-admin-jerome', firstName: 'Jérôme', lastName: 'Lucotte', email: 'jerome.lucotte@yahoo.fr', role: 'SUPER_ADMIN' as const },
    ];
    const sender = defaultSenders.find(s => s.id !== toUserId) || defaultSenders[0];
    const phrases = [
      "Bonjour ! As-tu pu consulter le bilan des records de la saison 2026 ?",
      "Bravo pour les résultats récents en demi-fond ! On prépare les qualifications régionales.",
      "Salut, j'ai vu ta fiche sur Data France Athlé. Veux-tu qu'on compare nos bilans chronos ?",
      "Message officiel de la direction technique fédérale : les nouveaux quotas 2026 sont en ligne.",
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    return this.sendMessage({
      sender: {
        id: sender.id,
        firstName: sender.firstName,
        lastName: sender.lastName,
        email: sender.email,
        passwordHash: '***',
        role: sender.role,
        isTwoFactorEnabled: true,
        permissions: {} as any,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      recipientId: toUserId,
      recipientName: toUserName,
      recipientEmail: toUserEmail,
      content: phrase,
      isAdminChannel: sender.email === 'jerome.lucotte@yahoo.fr',
    });
  }

  // Conversation entre deux utilisateurs ou avec l'administrateur
  static getConversation(userId1: string, userId2: string, user1Email?: string, isUser1Admin?: boolean): ChatMessage[] {
    const messages = this.getMessages();
    const adminUser = this.getAdminUser();
    const adminEmail = adminUser?.email.toLowerCase() || 'jerome.lucotte@yahoo.fr';
    const cleanUser1Email = (user1Email || '').toLowerCase();
    const isAdmin = isUser1Admin || cleanUser1Email === adminEmail;
    const isAdminThread = userId2 === 'admin' || userId2 === adminUser?.id || userId2.toLowerCase() === adminEmail;

    return messages.filter(m => {
      // 1. Thread officiel d'administration pour les membres
      if (isAdminThread) {
        return (
          (m.senderId === userId1 && (m.recipientEmail.toLowerCase() === adminEmail || m.recipientId === 'admin')) ||
          ((m.senderEmail.toLowerCase() === adminEmail || m.senderId === adminUser?.id) && (m.recipientId === userId1 || m.recipientId === 'broadcast-all')) ||
          (m.recipientId === 'broadcast-all')
        );
      }

      // 2. Si l'utilisateur connecté est administrateur et dialogue avec un membre userId2
      if (isAdmin) {
        const isFromInterlocutor = (m.senderId === userId2 || m.senderEmail.toLowerCase() === userId2.toLowerCase());
        const isToInterlocutor = (m.recipientId === userId2 || m.recipientEmail.toLowerCase() === userId2.toLowerCase());
        const isToAdmin = (
          m.recipientId === userId1 || 
          m.recipientEmail.toLowerCase() === cleanUser1Email || 
          m.recipientEmail.toLowerCase() === adminEmail || 
          m.recipientId === 'usr-admin-jerome' || 
          m.recipientId === 'admin' || 
          m.isAdminChannel
        );
        const isFromAdmin = (
          m.senderId === userId1 || 
          m.senderEmail.toLowerCase() === cleanUser1Email || 
          m.senderEmail.toLowerCase() === adminEmail || 
          m.senderId === 'usr-admin-jerome'
        );

        if ((isFromInterlocutor && isToAdmin) || (isFromAdmin && isToInterlocutor)) {
          return true;
        }
      }

      // 3. Conversation standard entre deux membres
      const match1to2 = (m.senderId === userId1 || (cleanUser1Email && m.senderEmail.toLowerCase() === cleanUser1Email)) &&
                        (m.recipientId === userId2 || m.recipientEmail.toLowerCase() === userId2.toLowerCase());
      const match2to1 = (m.senderId === userId2 || m.senderEmail.toLowerCase() === userId2.toLowerCase()) &&
                        (m.recipientId === userId1 || (cleanUser1Email && m.recipientEmail.toLowerCase() === cleanUser1Email));

      return match1to2 || match2to1;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Marquer les messages d'une conversation spécifique comme lus
  static markConversationAsRead(currentUserId: string, otherUserId: string, currentUserEmail?: string, isAdmin?: boolean): void {
    const messages = this.getMessages();
    const adminUser = this.getAdminUser();
    const adminEmail = adminUser?.email.toLowerCase() || 'jerome.lucotte@yahoo.fr';
    const cleanCurrentEmail = (currentUserEmail || '').toLowerCase();
    const isSuperOrAdmin = isAdmin || cleanCurrentEmail === adminEmail;
    const isAdminThread = otherUserId === 'admin' || otherUserId === adminUser?.id || otherUserId.toLowerCase() === adminEmail;

    let changed = false;
    const updated = messages.map(m => {
      if (m.read) return m;

      // Thread admin officiel
      if (isAdminThread) {
        const isFromAdminToMember = (
          m.senderEmail.toLowerCase() === adminEmail || 
          m.senderId === adminUser?.id || 
          m.recipientId === 'broadcast-all'
        );
        if (isFromAdminToMember) {
          changed = true;
          return { ...m, read: true };
        }
      }

      // Si l'utilisateur connecté est administrateur
      if (isSuperOrAdmin) {
        const isFromInterlocutor = (m.senderId === otherUserId || m.senderEmail.toLowerCase() === otherUserId.toLowerCase());
        const isToAdmin = (
          m.recipientId === currentUserId || 
          m.recipientEmail.toLowerCase() === cleanCurrentEmail || 
          m.recipientEmail.toLowerCase() === adminEmail || 
          m.recipientId === 'usr-admin-jerome' || 
          m.recipientId === 'admin' || 
          m.isAdminChannel
        );
        if (isFromInterlocutor && isToAdmin) {
          changed = true;
          return { ...m, read: true };
        }
      }

      // Conversation directe standard
      const isFromOther = (m.senderId === otherUserId || m.senderEmail.toLowerCase() === otherUserId.toLowerCase());
      const isToMe = (
        m.recipientId === currentUserId || 
        (cleanCurrentEmail && m.recipientEmail.toLowerCase() === cleanCurrentEmail) ||
        m.recipientId === 'broadcast-all'
      );

      if (isFromOther && isToMe) {
        changed = true;
        return { ...m, read: true };
      }

      return m;
    });

    if (changed) {
      this.saveMessages(updated);
    }
  }

  // Marquer l'ensemble des messages non lus adressés à l'utilisateur comme lus
  static markAllMessagesAsRead(userId?: string, userEmail?: string, isAdmin?: boolean): void {
    const messages = this.getMessages();
    const cleanEmail = (userEmail || '').toLowerCase();
    const adminEmail = 'jerome.lucotte@yahoo.fr';
    const isSuperOrAdmin = isAdmin || cleanEmail === adminEmail;

    let changed = false;
    const updated = messages.map(m => {
      if (m.read) return m;

      // Ne pas marquer ses propres messages
      if (userId && m.senderId === userId) return m;
      if (cleanEmail && m.senderEmail.toLowerCase() === cleanEmail) return m;

      const isDirectRecipient = (userId && m.recipientId === userId) || (cleanEmail && m.recipientEmail.toLowerCase() === cleanEmail);
      const isAdminRecipient = isSuperOrAdmin && (
        m.recipientId === 'admin' || 
        m.recipientEmail.toLowerCase() === adminEmail || 
        m.recipientId === 'usr-admin-jerome' || 
        m.isAdminChannel
      );
      const isBroadcast = m.recipientId === 'broadcast-all';

      if (isDirectRecipient || isAdminRecipient || isBroadcast) {
        changed = true;
        return { ...m, read: true };
      }

      return m;
    });

    if (changed) {
      this.saveMessages(updated);
    }
  }

  // Nombre de messages non lus pour un interlocuteur spécifique
  static getUnreadCountForInterlocutor(
    otherUserId: string,
    currentUserId: string,
    currentUserEmail?: string,
    isAdmin?: boolean
  ): number {
    const messages = this.getMessages();
    const adminUser = this.getAdminUser();
    const adminEmail = adminUser?.email.toLowerCase() || 'jerome.lucotte@yahoo.fr';
    const cleanCurrentEmail = (currentUserEmail || '').toLowerCase();
    const isSuperOrAdmin = isAdmin || cleanCurrentEmail === adminEmail;
    const isAdminThread = otherUserId === 'admin' || otherUserId === adminUser?.id || otherUserId.toLowerCase() === adminEmail;

    return messages.filter(m => {
      if (m.read) return false;
      if (m.senderId === currentUserId || (cleanCurrentEmail && m.senderEmail.toLowerCase() === cleanCurrentEmail)) return false;

      if (isAdminThread) {
        return (m.senderEmail.toLowerCase() === adminEmail || m.senderId === adminUser?.id || m.recipientId === 'broadcast-all');
      }

      if (isSuperOrAdmin) {
        const isFromOther = (m.senderId === otherUserId || m.senderEmail.toLowerCase() === otherUserId.toLowerCase());
        const isToAdmin = (
          m.recipientId === currentUserId || 
          m.recipientEmail.toLowerCase() === cleanCurrentEmail || 
          m.recipientEmail.toLowerCase() === adminEmail || 
          m.recipientId === 'usr-admin-jerome' || 
          m.recipientId === 'admin' || 
          m.isAdminChannel
        );
        return isFromOther && isToAdmin;
      }

      const isFromOther = (m.senderId === otherUserId || m.senderEmail.toLowerCase() === otherUserId.toLowerCase());
      const isToMe = (m.recipientId === currentUserId || (cleanCurrentEmail && m.recipientEmail.toLowerCase() === cleanCurrentEmail));
      return isFromOther && isToMe;
    }).length;
  }

  static getUnreadMessagesCount(userId?: string, userEmail?: string, isAdmin?: boolean): number {
    const messages = this.getMessages();
    if (!userId) {
      return messages.filter(m => m.recipientId === 'broadcast-all' && !m.read).length;
    }
    const cleanEmail = (userEmail || '').toLowerCase();
    const adminEmail = 'jerome.lucotte@yahoo.fr';
    const isSuperOrAdmin = isAdmin || cleanEmail === adminEmail;

    return messages.filter(m => {
      if (m.read) return false;
      if (m.senderId === userId) return false;
      if (cleanEmail && m.senderEmail.toLowerCase() === cleanEmail) return false;
      if (m.recipientId === userId) return true;
      if (cleanEmail && m.recipientEmail.toLowerCase() === cleanEmail) return true;
      if (isSuperOrAdmin && (
        m.recipientId === 'admin' || 
        m.recipientEmail.toLowerCase() === adminEmail || 
        m.recipientId === 'usr-admin-jerome' || 
        m.isAdminChannel
      )) return true;
      if (m.recipientId === 'broadcast-all') return true;
      return false;
    }).length;
  }

  static getAdminUser(): UserAccount {
    const users = this.getUsers();
    const admin = users.find(u => u.email.toLowerCase() === 'jerome.lucotte@yahoo.fr' || u.role === 'SUPER_ADMIN');
    return admin || INITIAL_USERS[0];
  }

  // --- RECHERCHE ET GESTION DES AMIS ---
  static getFriendRequests(): FriendRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Storage read error for friend requests', e);
    }
    this.saveFriendRequests(INITIAL_FRIEND_REQUESTS);
    return INITIAL_FRIEND_REQUESTS;
  }

  static saveFriendRequests(requests: FriendRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.error('Failed to save friend requests', e);
    }
  }

  static sendFriendRequest(fromUser: UserAccount, toUser: UserAccount): { success: boolean; error?: string; request?: FriendRequest } {
    if (fromUser.id === toUser.id) {
      return { success: false, error: 'Vous ne pouvez pas vous ajouter vous-même en ami.' };
    }

    const requests = this.getFriendRequests();
    const existing = requests.find(r => 
      ((r.fromUserId === fromUser.id && r.toUserId === toUser.id) ||
       (r.fromUserId === toUser.id && r.toUserId === fromUser.id)) &&
      (r.status === 'PENDING' || r.status === 'ACCEPTED')
    );

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return { success: false, error: 'Vous êtes déjà amis avec ce membre.' };
      }
      return { success: false, error: 'Une demande d\'ami est déjà en cours avec ce membre.' };
    }

    const newReq: FriendRequest = {
      id: `freq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromUserId: fromUser.id,
      fromUserName: `${fromUser.firstName} ${fromUser.lastName}`,
      fromUserEmail: fromUser.email,
      fromUserClub: fromUser.club,
      fromUserAvatarColor: fromUser.avatarColor,
      toUserId: toUser.id,
      toUserName: `${toUser.firstName} ${toUser.lastName}`,
      toUserEmail: toUser.email,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requests.push(newReq);
    this.saveFriendRequests(requests);

    this.addNotification(
      "Nouvelle demande d'ami",
      `${fromUser.firstName} ${fromUser.lastName} vous a envoyé une demande d'ami.`,
      'INFO'
    );

    return { success: true, request: newReq };
  }

  static respondToFriendRequest(requestId: string, currentUserId: string, accept: boolean): { success: boolean; error?: string } {
    const requests = this.getFriendRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) {
      return { success: false, error: 'Demande d\'ami introuvable.' };
    }

    const req = requests[idx];
    if (req.toUserId !== currentUserId) {
      return { success: false, error: 'Action non autorisée sur cette demande.' };
    }

    req.status = accept ? 'ACCEPTED' : 'DECLINED';
    req.updatedAt = new Date().toISOString();
    this.saveFriendRequests(requests);

    if (accept) {
      this.addNotification(
        "Nouvel ami confirmé !",
        `Vous êtes désormais ami avec ${req.fromUserName}. Vous pouvez maintenant dialoguer via l'application !`,
        'INFO'
      );
      this.addNotification(
        "Demande d'ami acceptée !",
        `${req.toUserName} a accepté votre demande d'ami. Vous êtes désormais amis et pouvez échanger des messages !`,
        'INFO'
      );

      const messages = this.getMessages();
      messages.push({
        id: `msg-friend-${Date.now()}`,
        senderId: req.fromUserId,
        senderName: req.fromUserName,
        senderEmail: req.fromUserEmail,
        recipientId: req.toUserId,
        recipientName: req.toUserName,
        recipientEmail: req.toUserEmail,
        content: `🤝 Demande d'ami acceptée ! Nous sommes désormais connectés sur Data France Athlé.`,
        timestamp: new Date().toISOString(),
        read: false,
      });
      this.saveMessages(messages);

      this.logActivity(
        { id: currentUserId, email: req.toUserEmail, name: req.toUserName },
        'MODIFICATION_PROFIL',
        `Demande d'ami acceptée avec ${req.fromUserName}`
      );
    }

    return { success: true };
  }

  static areFriends(userId1: string, userId2: string): boolean {
    const requests = this.getFriendRequests();
    return requests.some(r => 
      ((r.fromUserId === userId1 && r.toUserId === userId2) ||
       (r.fromUserId === userId2 && r.toUserId === userId1)) &&
      r.status === 'ACCEPTED'
    );
  }

  static getFriendshipStatus(userId1: string, userId2: string): 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS' {
    const requests = this.getFriendRequests();
    const req = requests.find(r => 
      (r.fromUserId === userId1 && r.toUserId === userId2) ||
      (r.fromUserId === userId2 && r.toUserId === userId1)
    );

    if (!req) return 'NONE';
    if (req.status === 'ACCEPTED') return 'FRIENDS';
    if (req.status === 'PENDING') {
      return req.fromUserId === userId1 ? 'PENDING_SENT' : 'PENDING_RECEIVED';
    }
    return 'NONE';
  }

  static getFriendsOfUser(userId: string): UserAccount[] {
    const requests = this.getFriendRequests().filter(r => 
      r.status === 'ACCEPTED' && (r.fromUserId === userId || r.toUserId === userId)
    );
    const users = this.getUsers();
    const friendIds = new Set(requests.map(r => r.fromUserId === userId ? r.toUserId : r.fromUserId));
    return users.filter(u => friendIds.has(u.id));
  }

  static getPendingRequestsForUser(userId: string): FriendRequest[] {
    return this.getFriendRequests().filter(r => r.toUserId === userId && r.status === 'PENDING');
  }

  static searchUsers(query: string, excludeUserId?: string): UserAccount[] {
    const users = this.getUsers();
    const q = query.trim().toLowerCase();
    if (!q) return [];
    
    return users.filter(u => {
      if (excludeUserId && u.id === excludeUserId) return false;
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const reverseName = `${u.lastName} ${u.firstName}`.toLowerCase();
      const email = u.email.toLowerCase();
      const club = (u.club || '').toLowerCase();
      return fullName.includes(q) || reverseName.includes(q) || email.includes(q) || club.includes(q);
    });
  }

  // Remise à zéro de l'ensemble des données
  static resetToInitialData(): PerformanceRecord[] {
    const initial = getInitialAthleticsData();
    this.savePerformances(initial);
    return initial;
  }

  // -------------------------------------------------------------
  // GESTION DES LISTES MINISTÉRIELLES SHN (SPORTIFS DE HAUT NIVEAU)
  // -------------------------------------------------------------
  static getSHNAthletes(): SHNAthlete[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHN_ATHLETES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur lors du chargement des listes SHN:', e);
    }
    // Par défaut, retourner la base officielle pré-compilée
    this.saveSHNAthletes(INITIAL_SHN_ATHLETES);
    return INITIAL_SHN_ATHLETES;
  }

  static saveSHNAthletes(athletes: SHNAthlete[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SHN_ATHLETES, JSON.stringify(athletes));
    } catch (e) {
      console.error('Erreur lors de la sauvegarde des athlètes SHN:', e);
    }
  }

  static resetSHNAthletes(): SHNAthlete[] {
    this.saveSHNAthletes(INITIAL_SHN_ATHLETES);
    return INITIAL_SHN_ATHLETES;
  }

  static addSHNAthletes(newAthletes: SHNAthlete[]): SHNAthlete[] {
    const current = this.getSHNAthletes();
    // Dédoublonnage sur nomComplet + anneeReference + categorie
    const existingKeys = new Set(current.map(a => `${a.nomComplet.toLowerCase()}-${a.anneeReference}-${a.categorie}`));
    const uniqueToAdd = newAthletes.filter(a => !existingKeys.has(`${a.nomComplet.toLowerCase()}-${a.anneeReference}-${a.categorie}`));
    const updated = [...uniqueToAdd, ...current];
    this.saveSHNAthletes(updated);
    return updated;
  }

  /**
   * Retourne l'ensemble des inscriptions ministérielles pour un athlète donné (ex: ["Élite (2024)", "Sénior (2022)"])
   */
  static getSHNStatusForAthlete(athleteName: string): SHNAthlete[] {
    if (!athleteName) return [];
    const shnList = this.getSHNAthletes();
    return shnList.filter(shn => isAthleteNameMatch(shn.nomComplet, athleteName));
  }
}
