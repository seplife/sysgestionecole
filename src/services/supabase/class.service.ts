// ============================================================
// SERVICE GESTION DES CLASSES
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid, isValidUuid } from './validators';
import { SchoolClass, ClassInsert } from '../../types/database';

export const classService = {
  async getAll(schoolId?: string): Promise<SchoolClass[]> {
    let query = supabase.from('classes').select('*').order('name');

    if (schoolId) {
      requireValidUuid(schoolId, 'School ID');
      query = query.eq('school_id', schoolId);
    }

    const { data, error } = await query;
    if (error) throw handleSupabaseError(error, 'Chargement des classes');
    return (data as SchoolClass[]) || [];
  },

  async getById(id: string): Promise<SchoolClass> {
    requireValidUuid(id, 'Class ID');
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw handleSupabaseError(error, `Chargement de la classe ${id}`);
    return data as SchoolClass;
  },

  async create(classData: ClassInsert): Promise<SchoolClass> {
    requireValidUuid(classData.school_id, 'School ID');

    const payload = {
      school_id: classData.school_id,
      academic_year_id: classData.academic_year_id && isValidUuid(classData.academic_year_id) ? classData.academic_year_id : null,
      name: classData.name.trim(),
      level: classData.level?.trim() || 'Collège',
      capacity: Number(classData.capacity) || 50
    };

    if (classData.id && isValidUuid(classData.id)) {
      (payload as any).id = classData.id;
    }

    const { data, error } = await supabase
      .from('classes')
      .insert(payload)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, 'Création de la classe');
    return data as SchoolClass;
  },

  async update(id: string, updates: Partial<ClassInsert>): Promise<SchoolClass> {
    requireValidUuid(id, 'Class ID');
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, `Mise à jour de la classe ${id}`);
    return data as SchoolClass;
  },

  async delete(id: string): Promise<void> {
    requireValidUuid(id, 'Class ID');
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error, `Suppression de la classe ${id}`);
  }
};
