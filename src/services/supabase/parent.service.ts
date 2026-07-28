// ============================================================
// SERVICE GESTION DES PARENTS ET TUTEURS
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid, isValidUuid } from './validators';
import { Parent, ParentInsert } from '../../types/database';

export const parentService = {
  async getAll(schoolId?: string): Promise<Parent[]> {
    let query = supabase.from('parents').select('*').order('created_at', { ascending: false });

    if (schoolId) {
      requireValidUuid(schoolId, 'School ID');
      query = query.eq('school_id', schoolId);
    }

    const { data, error } = await query;
    if (error) throw handleSupabaseError(error, 'Chargement des parents');
    return (data as Parent[]) || [];
  },

  async create(parentData: ParentInsert): Promise<Parent> {
    requireValidUuid(parentData.school_id, 'School ID');

    const payload = {
      school_id: parentData.school_id,
      user_id: parentData.user_id && isValidUuid(parentData.user_id) ? parentData.user_id : null,
      first_name: parentData.first_name.trim(),
      last_name: parentData.last_name.trim(),
      phone: parentData.phone?.trim() || null,
      whatsapp: parentData.whatsapp?.trim() || null,
      email: parentData.email?.trim() || null,
      address: parentData.address?.trim() || null
    };

    if (parentData.id && isValidUuid(parentData.id)) {
      (payload as any).id = parentData.id;
    }

    const { data, error } = await supabase
      .from('parents')
      .insert(payload)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, 'Ajout du parent');
    return data as Parent;
  },

  async update(id: string, updates: Partial<ParentInsert>): Promise<Parent> {
    requireValidUuid(id, 'Parent ID');
    const { data, error } = await supabase
      .from('parents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, `Mise à jour du parent ${id}`);
    return data as Parent;
  },

  async delete(id: string): Promise<void> {
    requireValidUuid(id, 'Parent ID');
    const { error } = await supabase
      .from('parents')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error, `Suppression du parent ${id}`);
  }
};
