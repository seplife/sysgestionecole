// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nubnovhdpwblhwsamxtb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Ym5vdmhkcHdibGh3c2FteHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNDMwOTYsImV4cCI6MjEwMDkxOTA5Nn0.D5ZBkq7dk7tusBDd1ZnL9dCmXFS0JElLQNRR42SSCJk";

// Configuration spécifique pour le développement local
const isLocalDev = window.location.protocol === 'http:' && 
                   (window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.'));

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    // Désactiver le PKCE en développement local pour éviter les problèmes CORS
    flowType: isLocalDev ? 'implicit' : 'pkce',
  },
  // Ajouter les headers CORS appropriés
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
});

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_URL.includes('.supabase.co') &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY.startsWith('eyJ')
  );
};

// Fonction pour vérifier la session avec retry
export async function getValidSession() {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session) return session;
      
      // Si pas de session, essayer de rafraîchir
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
      if (refreshedSession) return refreshedSession;
      
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    } catch (e) {
      console.warn(`[Supabase] Session attempt ${attempts + 1} failed:`, e);
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  }
  
  return null;
}