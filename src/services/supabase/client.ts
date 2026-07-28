// ============================================================
// CLIENT SUPABASE & DIAGNOSTIC DE CONNEXION
// ============================================================

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { handleSupabaseError } from './errors';

export { supabase, isSupabaseConfigured };

export interface SupabaseHealthCheckResult {
  connected: boolean;
  configured: boolean;
  message: string;
  error?: any;
}

/**
 * Diagnostic de santé complet du client et du backend Supabase Cloud
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthCheckResult> {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return {
      connected: false,
      configured: false,
      message: 'Supabase n\'est pas encore configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (Anon JWT) dans votre fichier .env.'
    };
  }

  try {
    const { error } = await supabase.from('schools').select('id').limit(1);
    if (error) {
      const parsed = handleSupabaseError(error, 'Test de Connexion Supabase');
      return {
        connected: false,
        configured: true,
        message: parsed.message,
        error: parsed
      };
    }
    return {
      connected: true,
      configured: true,
      message: 'Connecté et synchronisé en temps réel avec Supabase PostgreSQL.'
    };
  } catch (e: any) {
    return {
      connected: false,
      configured: true,
      message: `Réseau : impossible de joindre le serveur Supabase (${e?.message || 'Offline'})`,
      error: e
    };
  }
}
