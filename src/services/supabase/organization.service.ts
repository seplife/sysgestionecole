// ============================================================
// SERVICE ORGANISATIONS SAAS MULTI-TENANT
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid } from './validators';
import { Organization } from '../../types/database';

export const organizationService = {
  async getAll(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name');

    if (error) throw handleSupabaseError(error, 'Chargement des organisations');
    return (data as Organization[]) || [];
  },

  async getById(id: string): Promise<Organization> {
    requireValidUuid(id, 'Organization ID');
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw handleSupabaseError(error, `Chargement de l'organisation ${id}`);
    return data as Organization;
  }
};
