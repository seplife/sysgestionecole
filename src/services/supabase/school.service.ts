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
    const createdSchool = data as School;

    try {
      // 1. Rattacher l'utilisateur connecté comme membre et administrateur de la nouvelle école
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const userId = authData.user.id;

        await supabase
          .from('school_members')
          .upsert({
            school_id: createdSchool.id,
            user_id: userId,
            role: 'directeur',
            is_active: true
          }, { onConflict: 'school_id,user_id' });

        await supabase
          .from('user_profiles')
          .update({
            school_id: createdSchool.id,
            role: 'directeur'
          })
          .eq('id', userId);
      }

      // 2. Créer l'abonnement SaaS actif par défaut
      const { data: plans } = await supabase.from('plans').select('id').limit(1);
      const defaultPlanId = plans && plans.length > 0 ? plans[0].id : '00000000-0000-4000-a000-000000000003';

      await supabase
        .from('subscriptions')
        .insert({
          school_id: createdSchool.id,
          plan_id: defaultPlanId,
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      // 3. Initialiser l'année scolaire et les trimestres par défaut
      const currentYear = new Date().getFullYear();
      const ayName = `${currentYear}-${currentYear + 1}`;
      const { data: ayData } = await supabase
        .from('academic_years')
        .insert({
          school_id: createdSchool.id,
          name: ayName,
          start_date: `${currentYear}-09-15`,
          end_date: `${currentYear + 1}-07-15`,
          is_current: true
        })
        .select()
        .maybeSingle();

      if (ayData) {
        await supabase.from('academic_terms').insert([
          { school_id: createdSchool.id, academic_year_id: ayData.id, name: '1er Trimestre', period_type: 'Trimestre', start_date: `${currentYear}-09-15`, end_date: `${currentYear}-12-20`, is_current: false },
          { school_id: createdSchool.id, academic_year_id: ayData.id, name: '2ème Trimestre', period_type: 'Trimestre', start_date: `${currentYear + 1}-01-05`, end_date: `${currentYear + 1}-03-28`, is_current: false },
          { school_id: createdSchool.id, academic_year_id: ayData.id, name: '3ème Trimestre', period_type: 'Trimestre', start_date: `${currentYear + 1}-04-06`, end_date: `${currentYear + 1}-07-10`, is_current: true }
        ]);
      }
    } catch (suppErr) {
      console.warn('[SchoolService] Initial setup warning (non-blocking):', suppErr);
    }

    return createdSchool;
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
