// ============================================================
// SERVICE DÉDIÉ CLASSES & NIVEAUX (CLASS SERVICE) — IVOIREÉCOLE+ SAAS
// CRUD Classes avec résultat structuré ServiceResult & Tenant Validation
// ============================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SchoolClass, Subject } from '../types/database';
import { getCurrentTenantContext, TenantContext } from './tenantService';
import { syncService, ServiceResult } from './syncService';
import { auditService } from './auditService';

export function sanitizeClassPayload(cls: Partial<SchoolClass>, tenant: TenantContext) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const validId = (cls.id && uuidRegex.test(cls.id)) ? cls.id : crypto.randomUUID();
  const validLevelId = (cls.level_id && uuidRegex.test(cls.level_id)) ? cls.level_id : crypto.randomUUID();
  const validAyId = (cls.academic_year_id && uuidRegex.test(cls.academic_year_id)) ? cls.academic_year_id : crypto.randomUUID();

  return {
    id: validId,
    school_id: cls.school_id || tenant.schoolId,
    academic_year_id: validAyId,
    level_id: validLevelId,
    name: cls.name || 'Classe',
    room_number: cls.room_number || null,
    capacity: Number(cls.capacity || 45)
  };
}

export const classService = {
  /**
   * Récupère la liste des classes du tenant courant
   */
  async fetchClasses(): Promise<SchoolClass[]> {
    const tenant = await getCurrentTenantContext();
    const cached = syncService.getCache<SchoolClass[]>('classes', [], tenant.organizationId, tenant.schoolId);

    if (!isSupabaseConfigured()) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', tenant.schoolId)
        .order('name');

      if (error || !data) {
        console.warn('[ClassService Fetch Error]:', error?.message);
        return cached;
      }

      const result = (data as SchoolClass[]) || [];
      if (result.length > 0 || cached.length === 0) {
        syncService.setCache('classes', result, tenant.organizationId, tenant.schoolId);
        return result;
      }
      return cached;
    } catch (e) {
      console.warn('[ClassService Fetch Exception]:', e);
      return cached;
    }
  },

  /**
   * Enregistre ou met à jour une classe avec un résultat structuré
   */
  async saveClass(clsData: Partial<SchoolClass>): Promise<ServiceResult<SchoolClass>> {
    const tenant = await getCurrentTenantContext();

    if (!tenant.schoolId) {
      return {
        success: false,
        status: 'ERROR',
        error: 'Établissement non identifié dans le contexte courant.'
      };
    }

    const payload = sanitizeClassPayload(clsData, tenant);
    const fullClass: SchoolClass = { ...clsData, ...payload } as SchoolClass;

    const currentLocal = syncService.getCache<SchoolClass[]>('classes', [], tenant.organizationId, tenant.schoolId);
    const existingIdx = currentLocal.findIndex(c => c.id === fullClass.id || c.name === fullClass.name);
    let updatedLocal: SchoolClass[];

    if (existingIdx >= 0) {
      updatedLocal = currentLocal.map(c => (c.id === fullClass.id || c.name === fullClass.name) ? fullClass : c);
    } else {
      updatedLocal = [...currentLocal, fullClass];
    }
    syncService.setCache('classes', updatedLocal, tenant.organizationId, tenant.schoolId);

    if (!isSupabaseConfigured()) {
      return { success: true, status: 'LOCAL_ONLY', data: fullClass };
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        console.error('[ClassService Supabase Error]:', error);
        return {
          success: false,
          status: 'SYNC_PENDING',
          data: fullClass,
          error: error.message
        };
      }

      await auditService.logEvent({
        organization_id: tenant.organizationId,
        school_id: tenant.schoolId,
        user_id: tenant.userId,
        action: existingIdx >= 0 ? 'UPDATE' : 'INSERT',
        entity_type: 'classes',
        entity_id: data?.id || fullClass.id,
        new_data: data || payload
      });

      return {
        success: true,
        status: 'SYNCED',
        data: (data as SchoolClass) || fullClass
      };
    } catch (e: any) {
      console.error('[ClassService Exception]:', e);
      return {
        success: false,
        status: 'SYNC_PENDING',
        data: fullClass,
        error: e?.message || 'Erreur lors de la synchronisation de la classe.'
      };
    }
  },

  /**
   * Supprime une classe
   */
  async deleteClass(id: string): Promise<ServiceResult<boolean>> {
    const tenant = await getCurrentTenantContext();
    const currentLocal = syncService.getCache<SchoolClass[]>('classes', [], tenant.organizationId, tenant.schoolId);
    const updatedLocal = currentLocal.filter(c => c.id !== id);
    syncService.setCache('classes', updatedLocal, tenant.organizationId, tenant.schoolId);

    if (!isSupabaseConfigured()) {
      return { success: true, status: 'LOCAL_ONLY', data: true };
    }

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id)
        .eq('school_id', tenant.schoolId);

      if (error) {
        return { success: false, status: 'ERROR', error: error.message };
      }

      await auditService.logEvent({
        organization_id: tenant.organizationId,
        school_id: tenant.schoolId,
        user_id: tenant.userId,
        action: 'DELETE',
        entity_type: 'classes',
        entity_id: id
      });

      return { success: true, status: 'SYNCED', data: true };
    } catch (e: any) {
      return { success: false, status: 'ERROR', error: e?.message };
    }
  }
};
