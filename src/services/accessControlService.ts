import { UserProfile, School, SaasSubscriptionRecord, SaasPlan, AccessCheckResult } from '../types/database';

export const accessControlService = {
  /**
   * Evaluates access to the school dashboard in strict alignment with PostgreSQL function `can_access_school_dashboard`
   */
  canAccessSchoolDashboard(
    user: UserProfile | null,
    school: School | null,
    subscription: SaasSubscriptionRecord | null,
    plan?: SaasPlan | null
  ): AccessCheckResult {
    // 1. Authentification
    if (!user) {
      return {
        allowed: false,
        reason: 'AUTH_REQUIRED',
        message: 'Vous devez être connecté.'
      };
    }

    // 2. Profil utilisateur actif
    if (!user.is_active) {
      return {
        allowed: false,
        reason: 'PROFILE_INACTIVE',
        message: 'Votre compte est inactif. Contactez l\'administrateur.'
      };
    }

    // Super Admin Bypass (Direct Global Access)
    if (user.role === 'super_admin') {
      return {
        allowed: true,
        school_id: user.school_id || school?.id,
        role: 'super_admin',
        subscription_status: 'active',
        plan: 'SuperAdmin SaaS',
        reason: 'ACCESS_GRANTED',
        message: 'Accès super administrateur.'
      };
    }

    // 3. Adhésion à une école
    if (!user.school_id && !school) {
      return {
        allowed: false,
        reason: 'NO_SCHOOL_MEMBERSHIP',
        message: 'Vous n\'êtes pas membre de cette école.'
      };
    }

    const currentSchool = school;
    if (!currentSchool) {
      return {
        allowed: false,
        reason: 'NO_SCHOOL_MEMBERSHIP',
        message: 'Établissement non trouvé.'
      };
    }

    // 4. Statut de l'école
    const schoolStatus = currentSchool.status || 'active';
    if (schoolStatus === 'pending') {
      return {
        allowed: false,
        school_id: currentSchool.id,
        reason: 'SCHOOL_PENDING',
        message: 'Cette école est en attente de validation.'
      };
    }

    if (schoolStatus === 'suspended') {
      return {
        allowed: false,
        school_id: currentSchool.id,
        reason: 'SCHOOL_SUSPENDED',
        message: 'Cette école est suspendue. Contactez le support.'
      };
    }

    if (schoolStatus === 'blocked') {
      return {
        allowed: false,
        school_id: currentSchool.id,
        reason: 'SCHOOL_BLOCKED',
        message: 'Cette école est bloquée. Contactez le support.'
      };
    }

    if (schoolStatus === 'cancelled') {
      return {
        allowed: false,
        school_id: currentSchool.id,
        reason: 'SCHOOL_CANCELLED',
        message: 'Cette école a été annulée.'
      };
    }

    // 5. Statut de l'abonnement
    if (!subscription) {
      return {
        allowed: false,
        school_id: currentSchool.id,
        reason: 'SUBSCRIPTION_REQUIRED',
        message: 'Aucun abonnement trouvé. Veuillez souscrire un forfait.'
      };
    }

    // Statut 1: En attente de paiement (Initiated but not confirmed by webhook/backend)
    if (subscription.status === 'pending_payment') {
      return {
        allowed: false,
        school_id: currentSchool.id,
        subscription_status: 'pending_payment',
        reason: 'PENDING_PAYMENT',
        message: 'Votre paiement est en cours de confirmation. Accès au dashboard temporairement restreint.'
      };
    }

    // Exigence explicite: Statut DOIT ÊTRE 'active' OU 'trialing'
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return {
        allowed: false,
        school_id: currentSchool.id,
        subscription_status: subscription.status,
        reason: 'SUBSCRIPTION_NOT_ACTIVE',
        message: `Votre abonnement n'est pas actif (Statut: ${subscription.status}).`
      };
    }

    // Vérification de la date d'expiration
    const isExpired = subscription.expires_at && 
      new Date(subscription.expires_at) <= new Date() && 
      subscription.status !== 'trialing';

    if (isExpired) {
      return {
        allowed: false,
        school_id: currentSchool.id,
        subscription_status: 'expired',
        reason: 'SUBSCRIPTION_EXPIRED',
        message: 'Votre abonnement a expiré. Veuillez le renouveler pour accéder au dashboard.'
      };
    }

    // ACCÈS AUTORISÉ AU DASHBOARD !
    return {
      allowed: true,
      school_id: currentSchool.id,
      role: user.role,
      school_status: schoolStatus,
      subscription_status: subscription.status,
      plan: plan?.name || (subscription as any)?.plan_name || 'Abonnement Actif',
      max_students: plan?.max_students ?? 200,
      reason: 'ACCESS_GRANTED',
      message: 'Accès au dashboard autorisé.'
    };
  },

  /**
   * Vérification des limites d'élèves selon le plan souscrit
   */
  checkPlanLimit(currentCount: number, maxAllowed?: number | null): { reached: boolean; message?: string } {
    if (maxAllowed !== null && maxAllowed !== undefined && maxAllowed > 0 && currentCount >= maxAllowed) {
      return {
        reached: true,
        message: `Vous avez atteint la limite de votre forfait (${currentCount}/${maxAllowed} élèves). Veuillez passer à un forfait supérieur pour continuer.`
      };
    }
    return { reached: false };
  }
};
