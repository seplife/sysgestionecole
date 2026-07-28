// ============================================================
// SERVICE GESTION DES ÉLÈVES (Multi-Tenant)
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid, isValidUuid } from './validators';
import { Student, StudentInsert } from '../../types/database';

export const studentService = {
  async getAll(schoolId?: string): Promise<Student[]> {
    let query = supabase.from('students').select('*').order('created_at', { ascending: false });

    if (schoolId) {
      requireValidUuid(schoolId, 'School ID');
      query = query.eq('school_id', schoolId);
    }

    const { data, error } = await query;
    if (error) throw handleSupabaseError(error, 'Chargement des élèves');
    return (data as Student[]) || [];
  },

  async getById(id: string): Promise<Student> {
    requireValidUuid(id, 'Student ID');
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw handleSupabaseError(error, `Chargement de l'élève ${id}`);
    return data as Student;
  },

  async create(studentData: StudentInsert): Promise<Student> {
    requireValidUuid(studentData.school_id, 'School ID');

    const payload = {
      school_id: studentData.school_id,
      user_id: studentData.user_id && isValidUuid(studentData.user_id) ? studentData.user_id : null,
      registration_number: studentData.registration_number.trim(),
      first_name: studentData.first_name.trim(),
      last_name: studentData.last_name.trim(),
      date_of_birth: studentData.date_of_birth && String(studentData.date_of_birth).trim() !== '' ? studentData.date_of_birth : null,
      place_of_birth: studentData.place_of_birth?.trim() || null,
      gender: studentData.gender || 'M',
      nationality: studentData.nationality?.trim() || 'Ivoirienne',
      photo_url: studentData.photo_url || null,
      status: studentData.status || 'Inscrit'
    };

    if (studentData.id && isValidUuid(studentData.id)) {
      (payload as any).id = studentData.id;
    }

    const { data, error } = await supabase
      .from('students')
      .insert(payload)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, 'Inscription de l\'élève');
    return data as Student;
  },

  async update(id: string, updates: Partial<StudentInsert>): Promise<Student> {
    requireValidUuid(id, 'Student ID');
    
    // Protection contre les modifications invalides d'UUIDs
    const cleanUpdates = { ...updates };
    if (cleanUpdates.school_id) requireValidUuid(cleanUpdates.school_id, 'School ID');
    if (cleanUpdates.user_id && !isValidUuid(cleanUpdates.user_id)) {
      delete cleanUpdates.user_id;
    }

    const { data, error } = await supabase
      .from('students')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, `Mise à jour de l'élève ${id}`);
    return data as Student;
  },

  async delete(id: string): Promise<void> {
    requireValidUuid(id, 'Student ID');
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error, `Suppression de l'élève ${id}`);
  }
};
