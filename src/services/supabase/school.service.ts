// ============================================================
// SERVICE GESTION DES ÉCOLES (Multi-Tenant)
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid, isValidUuid } from './validators';
import { School, SchoolInsert } from '../../types/database';

export const schoolService = {
  async getAll(): Promise<School[]> {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw handleSupabaseError(error, 'Chargement des écoles');
    return (data as School[]) || [];
  },

  async getById(id: string): Promise<School> {
    requireValidUuid(id, 'School ID');
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw handleSupabaseError(error, `Chargement de l'école ${id}`);
    return data as School;
  },

  async create(schoolData: SchoolInsert): Promise<School> {
    const payload = {
      name: schoolData.name.trim(),
      slug: schoolData.slug?.trim() || `school-${Date.now()}`,
      registration_number: schoolData.registration_number?.trim() || null,
      motto: schoolData.motto?.trim() || 'Foi, Discipline, Excellence',
      address: schoolData.address?.trim() || null,
      city: schoolData.city?.trim() || 'Abidjan',
      country: schoolData.country?.trim() || 'Côte d\'Ivoire',
      phone: schoolData.phone?.trim() || null,
      whatsapp: schoolData.whatsapp?.trim() || null,
      email: schoolData.email?.trim() || null,
      website: schoolData.website?.trim() || null,
      director_name: schoolData.director_name?.trim() || null,
      logo_url: schoolData.logo_url || null,
      school_type: schoolData.school_type || 'Prive',
      status: schoolData.status || 'active'
    };

    if (schoolData.id && isValidUuid(schoolData.id)) {
      (payload as any).id = schoolData.id;
    }

    const { data, error } = await supabase
      .from('schools')
      .insert(payload)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, 'Création de l\'école');
    return data as School;
  },

  async update(id: string, updates: Partial<SchoolInsert>): Promise<School> {
    requireValidUuid(id, 'School ID');
    const { data, error } = await supabase
      .from('schools')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, `Mise à jour de l'école ${id}`);
    return data as School;
  },

  async delete(id: string): Promise<void> {
    requireValidUuid(id, 'School ID');
    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error, `Suppression de l'école ${id}`);
  }
};
