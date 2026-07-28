// ============================================================
// GESTION CENTRALISÉE ET PROFESSIONNELLE DES ERREURS SUPABASE
// ============================================================

export class SupabaseServiceError extends Error {
  code: string;
  details?: string;
  hint?: string;
  status?: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: string, hint?: string, status?: number) {
    super(message);
    this.name = 'SupabaseServiceError';
    this.code = code;
    this.details = details;
    this.hint = hint;
    this.status = status;
  }
}

/**
  * Traduit et qualifie les erreurs Supabase/PostgreSQL en exceptions structurées.
  */
export function handleSupabaseError(error: any, customContext: string = 'Opération'): SupabaseServiceError {
  if (!error) {
    return new SupabaseServiceError(`${customContext} échouée sans message d'erreur.`, 'UNKNOWN_ERROR');
  }

  if (error instanceof SupabaseServiceError) {
    return error;
  }

  const code = error.code || 'POSTGRES_ERROR';
  const rawMessage = error.message || 'Une erreur de base de données est survenue.';
  let translatedMessage = `${customContext} a échoué : ${rawMessage}`;

  switch (code) {
    case '23505':
      translatedMessage = `${customContext} impossible : cet enregistrement (ou cette clé unique) existe déjà dans le système.`;
      break;
    case '23503':
      translatedMessage = `${customContext} impossible : référence vers un élément lié introuvable (violation de clé étrangère).`;
      break;
    case '23502':
      translatedMessage = `${customContext} impossible : un champ obligatoire est manquant ou nul.`;
      break;
    case '22P02':
      translatedMessage = `${customContext} impossible : le format d'identifiant (UUID) ou de donnée est invalide.`;
      break;
    case '42501':
      translatedMessage = `Accès refusé (${customContext}) : vos autorisations ou les règles de sécurité RLS empêchent cette opération.`;
      break;
    case 'PGRST116':
      translatedMessage = `Ressource introuvable pour ${customContext.toLowerCase()}.`;
      break;
    case 'PGRST301':
      translatedMessage = `Session expirée ou non autorisée pour ${customContext.toLowerCase()}. Veuillez vous reconnecter.`;
      break;
    default:
      if (rawMessage.includes('JWT') || rawMessage.includes('apikey')) {
        translatedMessage = `Clé API Supabase ou Token d'authentification invalide.`;
      }
      break;
  }

  console.error(`[SupabaseServiceError] (${code}) ${customContext}:`, {
    message: rawMessage,
    details: error.details,
    hint: error.hint,
    originalError: error
  });

  return new SupabaseServiceError(
    translatedMessage,
    code,
    error.details,
    error.hint,
    error.status
  );
}
