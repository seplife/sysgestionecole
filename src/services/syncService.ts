// ============================================================
// SERVICE DE CACHE & SYNCHRONISATION LOCALSTORAGE PAR TENANT
// Isoles le cache local par organisation et par école
// ============================================================

export type SyncStatus = 'SYNCED' | 'LOCAL_ONLY' | 'SYNC_PENDING' | 'ERROR';

export interface ServiceResult<T> {
  success: boolean;
  status: SyncStatus;
  data?: T;
  error?: string;
}

export interface CachedItem<T> {
  data: T;
  syncStatus: SyncStatus;
  updatedAt: string;
  lastSyncedAt?: string;
  syncError?: string;
}

/**
 * Génère une clé LocalStorage isolée par tenant (organization_id / school_id)
 */
export function getTenantCacheKey(keyName: string, organizationId?: string, schoolId?: string): string {
  const org = organizationId || 'default-org';
  const sch = schoolId || 'default-school';
  return `sysgestionecole_${keyName}_${org}_${sch}`;
}

export const syncService = {
  /**
   * Lit le cache local pour une clé donnée isolée par tenant
   */
  getCache<T>(keyName: string, fallback: T, organizationId?: string, schoolId?: string): T {
    try {
      const fullKey = getTenantCacheKey(keyName, organizationId, schoolId);
      const item = localStorage.getItem(fullKey);
      if (!item) {
        // Tenter de lire la clé legacy globale si présente pour rétro-compatibilité
        const legacyItem = localStorage.getItem(`sysgestionecole_${keyName}`);
        if (legacyItem) {
          const parsedLegacy = JSON.parse(legacyItem);
          this.setCache(keyName, parsedLegacy, organizationId, schoolId);
          return parsedLegacy;
        }
        return fallback;
      }
      return JSON.parse(item);
    } catch {
      return fallback;
    }
  },

  /**
   * Écrit dans le cache local pour le tenant courant
   */
  setCache<T>(keyName: string, data: T, organizationId?: string, schoolId?: string): void {
    try {
      const fullKey = getTenantCacheKey(keyName, organizationId, schoolId);
      localStorage.setItem(fullKey, JSON.stringify(data));
    } catch (e) {
      console.warn('[SyncService SetCache Error]:', e);
    }
  },

  /**
   * Efface une entrée du cache local
   */
  clearCache(keyName: string, organizationId?: string, schoolId?: string): void {
    try {
      const fullKey = getTenantCacheKey(keyName, organizationId, schoolId);
      localStorage.removeItem(fullKey);
    } catch (e) {
      console.warn('[SyncService ClearCache Error]:', e);
    }
  }
};
