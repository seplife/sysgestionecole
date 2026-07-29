import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nubnovhdpwblhwsamxtb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_U_6LDBlYgvHjymtgnfEl0Q_9aHCd3eG";

/**
 * Vérifie que Supabase est correctement configuré avec une URL valide
 * et une clé JWT réelle (commence par "eyJ" = base64 de {"alg":...}).
 * Les clés de type "sb_publishable_" sont des clés de démo invalides.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_URL.includes('.supabase.co') &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY.startsWith('eyJ') // JWT Supabase réel
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
