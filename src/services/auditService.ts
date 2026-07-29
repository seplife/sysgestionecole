// ============================================================
// SERVICE D'AUDIT CENTRALISÉ — IVOIREÉCOLE+ SAAS
// Écrit et consulte les événements d'audit en base de données Supabase
// ============================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCurrentTenantContext } from './tenantService';

export interface AuditLogEntry {
  id?: string;
  organization_id?: string;
  school_id?: string;
  user_id?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'STUDENT_REGISTERED' | 'STUDENT_TRANSFERRED' | 'PAYMENT' | string;
  entity_type: string;
  entity_id?: string;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export const auditService = {
  /**
   * Journalise un événement d'audit dans public.audit_logs
   */
  async logEvent(entry: Partial<AuditLogEntry>): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.log('[AuditService Local Log]:', entry);
      return true;
    }

    try {
      const tenant = await getCurrentTenantContext();

      const payload = {
        organization_id: entry.organization_id || tenant.organizationId,
        school_id: entry.school_id || tenant.schoolId,
        user_id: entry.user_id || tenant.userId,
        action: entry.action || 'UPDATE',
        entity_type: entry.entity_type || 'GENERIC',
        entity_id: entry.entity_id || null,
        table_name: entry.entity_type || 'GENERIC',
        record_id: entry.entity_id || null,
        old_data: entry.old_data ? entry.old_data : null,
        new_data: entry.new_data ? entry.new_data : null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('audit_logs').insert(payload);

      if (error) {
        console.warn('[AuditService Log Error]:', error.code, error.message);
        return false;
      }

      return true;
    } catch (e) {
      console.warn('[AuditService Log Exception]:', e);
      return false;
    }
  },

  /**
   * Récupère les récents logs d'audit pour le tenant courant
   */
  async fetchRecentLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const tenant = await getCurrentTenantContext();
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('school_id', tenant.schoolId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data as AuditLogEntry[];
    } catch (e) {
      console.warn('[AuditService Fetch Exception]:', e);
      return [];
    }
  }
};
