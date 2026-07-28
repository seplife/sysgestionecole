// ============================================================
// VALIDATION ET CONTRÔLE DE CONFORMITÉ DES UUID & DONNÉES
// ============================================================

import { SupabaseServiceError } from './errors';

/**
 * Valide si une valeur donnée est un vrai UUID RFC-4122 v4
 */
export function isValidUuid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

/**
 * Exige qu'une valeur soit un UUID valide, sinon lève une exception explicite.
 */
export function requireValidUuid(value: unknown, fieldName: string = 'ID'): string {
  if (!isValidUuid(value)) {
    throw new SupabaseServiceError(
      `L'identifiant (${fieldName}) fourni "${value}" n'est pas un UUID PostgreSQL valide.`,
      'INVALID_UUID_ERROR'
    );
  }
  return value.trim();
}

/**
 * Nettoie les chaînes vides et les espaces inutiles pour les entrées SQL.
 */
export function sanitizeString(val?: string | null): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed === '' ? null : trimmed;
}
