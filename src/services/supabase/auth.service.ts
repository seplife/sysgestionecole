// ============================================================
// SERVICE AUTHENTIFICATION & USER PROFILES
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid } from './validators';
import { UserProfile } from '../../types/database';

export const authService = {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw handleSupabaseError(error, 'Récupération de l\'utilisateur authentifié');
    return user;
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    requireValidUuid(userId, 'User ID');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw handleSupabaseError(error, `Chargement du profil utilisateur ${userId}`);
    return data as UserProfile | null;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    requireValidUuid(userId, 'User ID');
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, `Mise à jour du profil ${userId}`);
    return data as UserProfile;
  }
};
