// ============================================================
// SERVICE GESTION DES ÉCOLES (Multi-Tenant)
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid, isValidUuid } from './validators';
import { School, SchoolInsert } from '../../types/database';

export const schoolService = {
  async getAll(): Promise<School[]> {
    // Utiliser l'utilisateur authentifié pour les politiques RLS
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw handleSupabaseError(error, 'Chargement des écoles');
    return (data as School[]) || [];
  },

  async getById(id: string): Promise<School> {
    requireValidUuid(id, 'School ID');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw handleSupabaseError(error, `Chargement de l'école ${id}`);
    return data as School;
  },

  async create(schoolData: SchoolInsert): Promise<School> {
    // Vérifier l'authentification avant la création
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const payload = {
      name: schoolData.name.trim(),
      slug: schoolData.slug?.trim() || `school-${Date.now()}`,
      registration_number: schoolData.registration_number?.trim() || null,
      motto: schoolData.motto?.trim() || 'Foi, Discipline, Excellence',
      address: schoolData.address?.trim() || null,
      city: schoolData.city?.trim() || 'Abidjan',
      country: schoolData.country?.trim() || "Côte d'Ivoire",
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

    // Créer l'école avec l'utilisateur authentifié
    const { data, error } = await supabase
      .from('schools')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[SchoolService] Create school error:', error);
      throw handleSupabaseError(error, 'Création de l\'école');
    }

    const createdSchool = data as School;

    try {
      // 1. Rattacher l'utilisateur connecté comme membre et administrateur
      const userId = user.id;

      // Vérifier si le membre existe déjà
      const { data: existingMember } = await supabase
        .from('school_members')
        .select('id')
        .eq('school_id', createdSchool.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingMember) {
        const { error: memberError } = await supabase
          .from('school_members')
          .insert({
            school_id: createdSchool.id,
            user_id: userId,
            role: 'directeur',
            is_active: true
          });

        if (memberError) {
          console.warn('[SchoolService] Member creation error:', memberError);
        }
      }

      // 2. Mettre à jour le profil utilisateur
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          school_id: createdSchool.id,
          role: 'directeur'
        })
        .eq('id', userId);

      if (profileError) {
        console.warn('[SchoolService] Profile update error:', profileError);
      }

      // 3. Créer l'abonnement SaaS
      const { data: plans } = await supabase
        .from('plans')
        .select('id')
        .limit(1);

      const defaultPlanId = plans && plans.length > 0 
        ? plans[0].id 
        : '00000000-0000-4000-a000-000000000003';

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          school_id: createdSchool.id,
          plan_id: defaultPlanId,
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (subError) {
        console.warn('[SchoolService] Subscription creation error:', subError);
      }

      // 4. Initialiser l'année scolaire
      const currentYear = new Date().getFullYear();
      const ayName = `${currentYear}-${currentYear + 1}`;
      
      const { data: ayData, error: ayError } = await supabase
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

      if (ayError) {
        console.warn('[SchoolService] Academic year creation error:', ayError);
      }

      // 5. Créer les trimestres
      if (ayData) {
        const terms = [
          { 
            school_id: createdSchool.id, 
            academic_year_id: ayData.id, 
            name: '1er Trimestre', 
            period_type: 'Trimestre', 
            start_date: `${currentYear}-09-15`, 
            end_date: `${currentYear}-12-20`, 
            is_current: false 
          },
          { 
            school_id: createdSchool.id, 
            academic_year_id: ayData.id, 
            name: '2ème Trimestre', 
            period_type: 'Trimestre', 
            start_date: `${currentYear + 1}-01-05`, 
            end_date: `${currentYear + 1}-03-28`, 
            is_current: false 
          },
          { 
            school_id: createdSchool.id, 
            academic_year_id: ayData.id, 
            name: '3ème Trimestre', 
            period_type: 'Trimestre', 
            start_date: `${currentYear + 1}-04-06`, 
            end_date: `${currentYear + 1}-07-10`, 
            is_current: true 
          }
        ];

        const { error: termsError } = await supabase
          .from('academic_terms')
          .insert(terms);

        if (termsError) {
          console.warn('[SchoolService] Terms creation error:', termsError);
        }
      }
    } catch (suppErr) {
      console.warn('[SchoolService] Initial setup warning (non-blocking):', suppErr);
    }

    return createdSchool;
  },

  async update(id: string, updates: Partial<SchoolInsert>): Promise<School> {
    requireValidUuid(id, 'School ID');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { id: _id, created_at: _ca, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase
      .from('schools')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, `Mise à jour de l'école ${id}`);
    return data as School;
  },

  async delete(id: string): Promise<void> {
    requireValidUuid(id, 'School ID');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error, `Suppression de l'école ${id}`);
  }
};