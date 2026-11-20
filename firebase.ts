import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { OfficialSeasonFile, PerformanceRecord } from '../types/athletics';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline:', error.message);
      return false;
    }
    // Permissions error on non-existent test doc is normal for security rules
    return true;
  }
}

// ---------------------------------------------------------------------------
// Firestore Cloud Storage Service for Official Season Files & Performances
// ---------------------------------------------------------------------------

// Quota Management: prevent SDK retry loops and infinite backoff spam
// Active on free Spark tier when 20k writes/day is reached
let inMemoryQuotaExceeded = true; // Seeded to true as free write quota for project 426405291139 is exhausted for today
const QUOTA_STORAGE_KEY = 'sfa_firestore_quota_exceeded_v1';

export function isFirestoreQuotaExceeded(): boolean {
  if (inMemoryQuotaExceeded) return true;
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (!raw) return false;
    const timestamp = parseInt(raw, 10);
    if (Date.now() - timestamp < 24 * 3600 * 1000) {
      inMemoryQuotaExceeded = true;
      return true;
    }
    localStorage.removeItem(QUOTA_STORAGE_KEY);
    return false;
  } catch {
    return inMemoryQuotaExceeded;
  }
}

export function markFirestoreQuotaExceeded(): void {
  inMemoryQuotaExceeded = true;
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, Date.now().toString());
  } catch {}
}

export function resetFirestoreQuotaExceeded(): void {
  inMemoryQuotaExceeded = false;
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
  } catch {}
}

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('429')
  );
}

// Helper to strip undefined values because Firestore rejects them
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (value === undefined ? null : value))
  );
}

export class FirestoreSyncService {
  static isFirestoreConfigured(): boolean {
    return Boolean(firebaseConfig.projectId && firebaseConfig.firestoreDatabaseId);
  }

  static isQuotaBlocked(): boolean {
    return isFirestoreQuotaExceeded();
  }

  static resetQuotaBlocked(): void {
    resetFirestoreQuotaExceeded();
  }

  /**
   * Charge le catalogue des bases officielles partagées depuis Firestore
   */
  static async loadOfficialSeasonFiles(): Promise<OfficialSeasonFile[]> {
    const path = 'official_season_files';
    try {
      const snap = await getDocs(collection(db, path));
      const files: OfficialSeasonFile[] = [];
      snap.forEach(d => {
        files.push(d.data() as OfficialSeasonFile);
      });
      return files;
    } catch (e) {
      if (isQuotaError(e)) {
        markFirestoreQuotaExceeded();
      }
      console.warn('Could not read official_season_files from Firestore, using local fallback:', e);
      return [];
    }
  }

  /**
   * Sauvegarde le catalogue des bases officielles dans Firestore
   */
  static async saveOfficialSeasonFiles(files: OfficialSeasonFile[]): Promise<void> {
    if (isFirestoreQuotaExceeded()) {
      console.info('Quota Firestore journalier atteint, sauvegarde locale préservée.');
      return;
    }
    const path = 'official_season_files';
    try {
      const batch = writeBatch(db);
      for (const file of files) {
        const cleanFile = sanitizeForFirestore(file);
        const docRef = doc(db, path, file.id);
        batch.set(docRef, cleanFile);
      }
      await batch.commit();
    } catch (error) {
      if (isQuotaError(error)) {
        markFirestoreQuotaExceeded();
        console.warn('Quota Firestore journalier atteint. Données actives en local.');
        return;
      }
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Supprime une base officielle du catalogue Firestore
   */
  static async deleteOfficialSeasonFile(fileId: string): Promise<void> {
    if (isFirestoreQuotaExceeded()) return;
    const path = 'official_season_files';
    try {
      await deleteDoc(doc(db, path, fileId));
    } catch (error) {
      if (isQuotaError(error)) markFirestoreQuotaExceeded();
      console.warn('Could not delete official season file from Firestore:', error);
    }
  }

  /**
   * Charge l'ensemble des performances synchronisées dans le cloud
   */
  static async loadPerformances(): Promise<PerformanceRecord[]> {
    try {
      // 1. Charger depuis les bundles optimisés (priorité aux bundles économiques)
      const bundleSnap = await getDocs(collection(db, 'season_bundles'));
      if (!bundleSnap.empty) {
        const records: PerformanceRecord[] = [];
        bundleSnap.forEach(d => {
          const data = d.data();
          if (Array.isArray(data?.records)) {
            records.push(...(data.records as PerformanceRecord[]));
          }
        });
        if (records.length > 0) return records;
      }

      // 2. Rétrocompatibilité avec l'ancienne collection si des données y sont présentes
      const legacySnap = await getDocs(collection(db, 'performances'));
      const legacyRecords: PerformanceRecord[] = [];
      legacySnap.forEach(d => {
        legacyRecords.push(d.data() as PerformanceRecord);
      });
      return legacyRecords;
    } catch (e) {
      if (isQuotaError(e)) {
        markFirestoreQuotaExceeded();
      }
      console.warn('Could not load performances from Firestore, using local fallback:', e);
      return [];
    }
  }

  /**
   * Sauvegarde les performances par lots compressés (Bundles) dans Firestore.
   * Au lieu d'écrire 1 document par performance (ce qui consomme des milliers de writes),
   * on regroupe jusqu'à 300 performances par document bundle, divisant la consommation par 300.
   */
  static async savePerformancesBatch(
    records: PerformanceRecord[],
    onProgress?: (saved: number, total: number) => void
  ): Promise<void> {
    if (isFirestoreQuotaExceeded()) {
      console.info('Quota Firestore journalier atteint, sauvegarde locale préservée.');
      return;
    }

    const path = 'season_bundles';
    const BUNDLE_SIZE = 300; // 300 performances par bundle (~100 KB, bien en-deçà de la limite de 1 MB de Firestore)
    const total = records.length;
    let saved = 0;

    try {
      const totalBundles = Math.ceil(total / BUNDLE_SIZE);
      for (let b = 0; b < totalBundles; b++) {
        const chunk = records.slice(b * BUNDLE_SIZE, (b + 1) * BUNDLE_SIZE);
        const cleanChunk = sanitizeForFirestore(chunk);
        const firstRec = chunk[0];
        const bundleId = `bundle_${firstRec?.saison || 'all'}_${firstRec?.structure || 'ALL'}_${b}`;
        
        await setDoc(doc(db, path, bundleId), {
          bundleId,
          season: firstRec?.saison || null,
          structure: firstRec?.structure || null,
          count: chunk.length,
          updatedAt: new Date().toISOString(),
          records: cleanChunk
        });

        saved += chunk.length;
        if (onProgress) {
          onProgress(saved, total);
        }
      }
    } catch (error) {
      if (isQuotaError(error)) {
        markFirestoreQuotaExceeded();
        console.warn('Quota Firestore journalier atteint lors de la synchronisation. Données préservées en local IndexedDB.');
        return;
      }
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Supprime un ensemble de performances de Firestore par leurs IDs
   */
  static async deletePerformances(recordIds: string[]): Promise<void> {
    if (isFirestoreQuotaExceeded()) return;
    const path = 'performances';
    const BATCH_SIZE = 450;
    try {
      for (let i = 0; i < recordIds.length; i += BATCH_SIZE) {
        const chunk = recordIds.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        for (const id of chunk) {
          batch.delete(doc(db, path, id));
        }
        await batch.commit();
      }
    } catch (error) {
      if (isQuotaError(error)) markFirestoreQuotaExceeded();
      console.warn('Could not delete performance records from Firestore:', error);
    }
  }
}
