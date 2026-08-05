// services/supabase/school.service.ts

import { supabase, getValidSession } from '../../lib/supabase';
import { handleSupabaseError } from './errors';
import { requireValidUuid, isValidUuid } from './validators';
import { School, SchoolInsert } from '../../types/database';

export const schoolService = {
  async getAll(): Promise<School[]> {
    const session = await getValidSession();
    if (!session) {
      console.warn('[SchoolService] No valid session for getAll');
      return [];
    }

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SchoolService] getAll error:', error);
      throw handleSupabaseError(error, 'Chargement des écoles');
    }
    return (data as School[]) || [];
  },

  async getById(id: string): Promise<School> {
    requireValidUuid(id, 'School ID');
    
    const session = await getValidSession();
    if (!session) throw new Error('Session invalide');

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw handleSupabaseError(error, `Chargement de l'école ${id}`);
    return data as School;
  },

  async create(schoolData: SchoolInsert): Promise<School> {
    // Récupérer la session avec retry
    const session = await getValidSession();
    if (!session || !session.user) {
      console.error('[SchoolService] No valid session for create');
      throw new Error('Vous devez être connecté pour créer une école');
    }

    const user = session.user;
    console.log('[SchoolService] Creating school for user:', user.id);

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

    // Timeout pour éviter les blocages
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // ---------------------------------------------------------------
      // STRATÉGIE PRINCIPALE : Fonction RPC SECURITY DEFINER
      // Contourne le problème RLS chicken-and-egg (pas encore membre)
      // et crée atomiquement : école + school_member + user_profile
      // ---------------------------------------------------------------
      console.log('[SchoolService] Trying RPC create_school_with_member...');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('create_school_with_member', { p_school_data: payload });

      if (!rpcError && rpcData) {
        clearTimeout(timeoutId);
        console.log('[SchoolService] School created via RPC:', rpcData);
        return rpcData as School;
      }

      // Si la RPC échoue (fonction pas encore déployée), fallback sur l'insert direct
      if (rpcError) {
        console.warn('[SchoolService] RPC failed, falling back to direct insert:', rpcError);
      }

      // ---------------------------------------------------------------
      // STRATÉGIE DE REPLI : Insert direct (nécessite migration 013)
      // ---------------------------------------------------------------
      const { data, error } = await supabase
        .from('schools')
        .insert(payload)
        .select()
        .single();

      clearTimeout(timeoutId);

      if (error) {
        console.error('[SchoolService] Create school error:', error);
        throw handleSupabaseError(error, 'Création de l\'école');
      }

      const createdSchool = data as School;

      // 2. Ajouter le membre
      const { error: memberError } = await supabase
        .from('school_members')
        .insert({
          school_id: createdSchool.id,
          user_id: user.id,
          role: 'directeur',
          is_active: true
        });

      if (memberError) {
        console.warn('[SchoolService] Member creation error:', memberError);
      }

      // 3. Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          school_id: createdSchool.id,
          role: 'directeur'
        })
        .eq('id', user.id);

      if (profileError) {
        console.warn('[SchoolService] Profile update error:', profileError);
      }

      return createdSchool;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },

  async update(id: string, updates: Partial<SchoolInsert>): Promise<School> {
    requireValidUuid(id, 'School ID');
    
    const session = await getValidSession();
    if (!session) throw new Error('Session invalide');

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
    
    const session = await getValidSession();
    if (!session) throw new Error('Session invalide');

    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error, `Suppression de l'école ${id}`);
  }
};