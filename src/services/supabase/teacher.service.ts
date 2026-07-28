// ============================================================
// SERVICE GESTION DES ENSEIGNANTS ET CORPS PÉDAGOGIQUE
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid, isValidUuid } from './validators';
import { Teacher, TeacherInsert } from '../../types/database';

export const teacherService = {
  async getAll(schoolId?: string): Promise<Teacher[]> {
    let query = supabase.from('teachers').select('*').order('created_at', { ascending: false });

    if (schoolId) {
      requireValidUuid(schoolId, 'School ID');
      query = query.eq('school_id', schoolId);
    }

    const { data, error } = await query;
    if (error) throw handleSupabaseError(error, 'Chargement des enseignants');
    return (data as Teacher[]) || [];
  },

  async create(teacherData: TeacherInsert): Promise<Teacher> {
    requireValidUuid(teacherData.school_id, 'School ID');

    const payload = {
      school_id: teacherData.school_id,
      user_id: teacherData.user_id && isValidUuid(teacherData.user_id) ? teacherData.user_id : null,
      first_name: teacherData.first_name.trim(),
      last_name: teacherData.last_name.trim(),
      email: teacherData.email?.trim() || null,
      phone: teacherData.phone?.trim() || null,
      specialization: teacherData.specialization?.trim() || null,
      hire_date: teacherData.hire_date || null,
      status: teacherData.status || 'active'
    };

    if (teacherData.id && isValidUuid(teacherData.id)) {
      (payload as any).id = teacherData.id;
    }

    const { data, error } = await supabase
      .from('teachers')
      .insert(payload)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, 'Ajout de l\'enseignant');
    return data as Teacher;
  },

  async update(id: string, updates: Partial<TeacherInsert>): Promise<Teacher> {
    requireValidUuid(id, 'Teacher ID');
    const { data, error } = await supabase
      .from('teachers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, `Mise à jour de l'enseignant ${id}`);
    return data as Teacher;
  },

  async delete(id: string): Promise<void> {
    requireValidUuid(id, 'Teacher ID');
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error, `Suppression de l'enseignant ${id}`);
  }
};
