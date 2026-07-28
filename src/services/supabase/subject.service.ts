// ============================================================
// SERVICE GESTION DES MATIÈRES ET COEFFICIENTS
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid, isValidUuid } from './validators';
import { Subject, SubjectInsert } from '../../types/database';

export const subjectService = {
  async getAll(schoolId?: string): Promise<Subject[]> {
    let query = supabase.from('subjects').select('*').order('name');

    if (schoolId) {
      requireValidUuid(schoolId, 'School ID');
      query = query.eq('school_id', schoolId);
    }

    const { data, error } = await query;
    if (error) throw handleSupabaseError(error, 'Chargement des matières');
    return (data as Subject[]) || [];
  },

  async create(subjectData: SubjectInsert): Promise<Subject> {
    requireValidUuid(subjectData.school_id, 'School ID');

    const payload = {
      school_id: subjectData.school_id,
      name: subjectData.name.trim(),
      code: subjectData.code?.trim() || 'MAT',
      coefficient: Number(subjectData.coefficient) || 1
    };

    if (subjectData.id && isValidUuid(subjectData.id)) {
      (payload as any).id = subjectData.id;
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert(payload)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, 'Création de la matière');
    return data as Subject;
  },

  async update(id: string, updates: Partial<SubjectInsert>): Promise<Subject> {
    requireValidUuid(id, 'Subject ID');
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, `Mise à jour de la matière ${id}`);
    return data as Subject;
  },

  async delete(id: string): Promise<void> {
    requireValidUuid(id, 'Subject ID');
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error, `Suppression de la matière ${id}`);
  }
};
