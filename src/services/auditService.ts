// ============================================================
// SERVICE D'AUDIT CENTRALISÉ — IVOIREÉCOLE+ SAAS
// Écrit et consulte les événements d'audit dans Supabase
// ============================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCurrentTenantContext } from './tenantService';

export interface AuditLogEntry {
  id?: string;
  school_id?: string;
  user_id?: string;
  table_name: string;
  record_id?: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | string;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
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
        school_id: entry.school_id || tenant.schoolId,
        user_id: entry.user_id || tenant.userId || null,
        table_name: entry.table_name || 'unknown',
        record_id: entry.record_id || null,
        action: entry.action || 'UPDATE',
        old_data: entry.old_data || null,
        new_data: entry.new_data || null,
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || null,
        created_at: entry.created_at || new Date().toISOString(),
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(payload);

      if (error) {
        console.warn(
          '[AuditService Log Error]:',
          error.code,
          error.message,
          error.details,
          error.hint
        );
        return false;
      }

      return true;
    } catch (e) {
      console.warn('[AuditService Log Exception]:', e);
      return false;
    }
  },

  /**
   * Récupère les récents logs d'audit pour l'établissement courant
   */
  async fetchRecentLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const tenant = await getCurrentTenantContext();

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('school_id', tenant.schoolId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn(
          '[AuditService Fetch Error]:',
          error.code,
          error.message
        );
        return [];
      }

      return (data as AuditLogEntry[]) || [];
    } catch (e) {
      console.warn('[AuditService Fetch Exception]:', e);
      return [];
    }
  },
};