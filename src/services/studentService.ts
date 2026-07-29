// ============================================================
// SERVICE DÉDIÉ ÉLÈVES (STUDENT SERVICE) — IVOIREÉCOLE+ SAAS
// CRUD Élèves avec résultat structuré ServiceResult, Audit & Tenant Validation
// ============================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Student } from '../types/database';
import { getCurrentTenantContext, TenantContext, generateUUID } from './tenantService';
import { syncService, ServiceResult } from './syncService';
import { auditService } from './auditService';

/**
 * Nettoie et prépare le payload élève pour Supabase PostgreSQL avec UUIDs stricts
 */
export function sanitizeStudentPayload(student: Partial<Student>, tenant: TenantContext) {
  // Générer un UUID d'identifiant valide si l'id n'est pas déjà un UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const validId = (student.id && uuidRegex.test(student.id))
    ? student.id
    : generateUUID();

  return {
    id: validId,
    organization_id: student.organization_id || tenant.organizationId,
    school_id: student.school_id || tenant.schoolId,
    user_id: student.user_id && uuidRegex.test(student.user_id) ? student.user_id : null,
    registration_number: student.registration_number || `REG-${Date.now()}`,
    first_name: student.first_name || '',
    last_name: student.last_name || '',
    date_of_birth: student.date_of_birth && String(student.date_of_birth).trim() !== '' ? student.date_of_birth : null,
    place_of_birth: student.place_of_birth || null,
    gender: ['M', 'F'].includes(student.gender || '') ? student.gender : 'M',
    nationality: student.nationality || 'Ivoirienne',
    photo_url: student.photo_url || null,
    blood_group: student.blood_group || null,
    address: student.address || null,
    status: ['Inscrit', 'Reinscrit', 'Transfere', 'Radie'].includes(student.status as string) ? student.status : 'Inscrit'
  };
}

export const studentService = {
  /**
   * Récupère la liste des élèves pour le tenant actif
   */
  async fetchStudents(): Promise<Student[]> {
    const tenant = await getCurrentTenantContext();
    const localCached = syncService.getCache<Student[]>('students', [], tenant.organizationId, tenant.schoolId);

    if (!isSupabaseConfigured()) {
      return localCached;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', tenant.schoolId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[StudentService Fetch Error]:', error.message);
        return localCached;
      }

      const result = (data as Student[]) || [];
      // Ne pas écraser si Supabase est vide mais le cache contient des données locales non synchro
      if (result.length > 0 || localCached.length === 0) {
        syncService.setCache('students', result, tenant.organizationId, tenant.schoolId);
        return result;
      }

      return localCached;
    } catch (e) {
      console.warn('[StudentService Fetch Exception]:', e);
      return localCached;
    }
  },

  /**
   * Enregistre ou met à jour un élève avec un résultat structuré ServiceResult
   */
  async saveStudent(studentData: Partial<Student>): Promise<ServiceResult<Student>> {
    const tenant = await getCurrentTenantContext();

    if (!tenant.organizationId || !tenant.schoolId) {
      return {
        success: false,
        status: 'ERROR',
        error: 'Impossible d\'enregistrer l\'élève : organisation ou établissement non identifié.'
      };
    }

    const payload = sanitizeStudentPayload(studentData, tenant);
    const fullStudent: Student = { ...studentData, ...payload } as Student;

    // 1. Mettre à jour immédiatement le cache local du tenant
    const currentLocal = syncService.getCache<Student[]>('students', [], tenant.organizationId, tenant.schoolId);
    const existingIdx = currentLocal.findIndex(s => s.id === fullStudent.id || s.registration_number === fullStudent.registration_number);
    let updatedLocal: Student[];

    if (existingIdx >= 0) {
      updatedLocal = currentLocal.map(s => (s.id === fullStudent.id || s.registration_number === fullStudent.registration_number) ? fullStudent : s);
    } else {
      updatedLocal = [fullStudent, ...currentLocal];
    }
    syncService.setCache('students', updatedLocal, tenant.organizationId, tenant.schoolId);

    // Si Supabase n'est pas configuré, marquer l'enregistrement localement uniquement
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        status: 'LOCAL_ONLY',
        data: fullStudent
      };
    }

    // 2. Synchroniser vers la base de données distante Supabase
    // NOTE : la garantie d'existence de l'école/organisation/année/niveau (FK)
    // est faite en amont par supabaseService.saveStudent() via ensureSchoolExists()
    // avant d'appeler cette fonction, pour éviter tout import circulaire entre
    // studentService.ts et supabaseService.ts.
    try {
      const { data, error } = await supabase
        .from('students')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        // ✅ Log détaillé pour diagnostiquer RLS / FK / type de colonne
        console.error('[StudentService Supabase Sync Error]:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return {
          success: false,
          status: 'SYNC_PENDING',
          data: fullStudent,
          error: `Données sauvegardées en local uniquement (${error.message})`
        };
      }

      // 3. Journaliser l'événement d'audit
      await auditService.logEvent({
        organization_id: tenant.organizationId,
        school_id: tenant.schoolId,
        user_id: tenant.userId,
        action: existingIdx >= 0 ? 'UPDATE' : 'STUDENT_REGISTERED',
        entity_type: 'students',
        entity_id: data?.id || fullStudent.id,
        new_data: data || payload
      });

      return {
        success: true,
        status: 'SYNCED',
        data: (data as Student) || fullStudent
      };
    } catch (e: any) {
      console.error('[StudentService Exception]:', e);
      return {
        success: false,
        status: 'SYNC_PENDING',
        data: fullStudent,
        error: e?.message || 'Erreur lors de la synchronisation Supabase.'
      };
    }
  },

  /**
   * Supprime un élève du tenant courant
   */
  async deleteStudent(id: string): Promise<ServiceResult<boolean>> {
    const tenant = await getCurrentTenantContext();
    const currentLocal = syncService.getCache<Student[]>('students', [], tenant.organizationId, tenant.schoolId);
    const updatedLocal = currentLocal.filter(s => s.id !== id);
    syncService.setCache('students', updatedLocal, tenant.organizationId, tenant.schoolId);

    if (!isSupabaseConfigured()) {
      return { success: true, status: 'LOCAL_ONLY', data: true };
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)
        .eq('school_id', tenant.schoolId);

      if (error) {
        console.error('[StudentService Delete Error]:', error);
        return { success: false, status: 'ERROR', error: error.message };
      }

      await auditService.logEvent({
        organization_id: tenant.organizationId,
        school_id: tenant.schoolId,
        user_id: tenant.userId,
        action: 'DELETE',
        entity_type: 'students',
        entity_id: id
      });

      return { success: true, status: 'SYNCED', data: true };
    } catch (e: any) {
      console.error('[StudentService Delete Exception]:', e);
      return { success: false, status: 'ERROR', error: e?.message };
    }
  }
};