import React, { createContext, useContext, useState, useCallback } from 'react';
import { SaasPlan, SaasSubscriptionRecord, SaasPaymentRecord, AccessCheckResult } from '../types/database';
import { getLocalCache, setLocalCache } from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import { accessControlService } from '../services/accessControlService';

const defaultPlans: SaasPlan[] = [
  // ... plans existants inchangés ...
  {
    id: 'plan-essentiel',
    name: 'Essentiel',
    slug: 'essentiel',
    description: 'Formule idéale pour petits établissements jusqu\'à 200 élèves',
    price: 150000,
    currency: 'XOF',
    billing_interval: 'yearly',
    max_students: 200,
    max_teachers: 30,
    max_users: 50,
    features: {
      bulletins: true,
      pv_trimestriels: true,
      frais_recus: true,
      support_telephonique: true,
      whatsapp: false,
      ai_assistant: false
    },
    is_active: true
  },
  {
    id: 'plan-professionnel',
    name: 'Professionnel',
    slug: 'professionnel',
    description: 'Formule recommandée MENA jusqu\'à 500 élèves avec relances WhatsApp',
    price: 350000,
    currency: 'XOF',
    billing_interval: 'yearly',
    max_students: 500,
    max_teachers: 80,
    max_users: 150,
    features: {
      bulletins: true,
      pv_trimestriels: true,
      frais_recus: true,
      whatsapp: true,
      sms: true,
      multi_users: true,
      educateurs: true,
      emplois_du_temps_auto: true,
      support_7j7: true,
      ai_assistant: false
    },
    is_active: true
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    slug: 'premium',
    description: 'Formule tout inclus pour grandes structures (élèves illimités & IA)',
    price: 650000,
    currency: 'XOF',
    billing_interval: 'yearly',
    max_students: null,
    max_teachers: null,
    max_users: null,
    features: {
      bulletins: true,
      pv_trimestriels: true,
      frais_recus: true,
      whatsapp: true,
      sms: true,
      parent_portal: true,
      eleve_portal: true,
      mobile_money_direct: true,
      ai_assistant: true,
      chef_projet_dedie: true
    },
    is_active: true
  }
];

// ✅ DÉPLACÉ : Subscription par défaut uniquement si nécessaire
const createDefaultSubscription = (schoolId: string): SaasSubscriptionRecord => ({
  id: `sub-${schoolId}`,
  school_id: schoolId,
  plan_id: 'plan-professionnel',
  plan_name: 'Professionnel',
  status: 'active',
  starts_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString()
});

interface SubscriptionContextType {
  plans: SaasPlan[];
  subscriptions: SaasSubscriptionRecord[];
  currentSubscription: SaasSubscriptionRecord | null;
  currentPlan: SaasPlan | null;
  accessCheck: AccessCheckResult;
  payments: SaasPaymentRecord[];
  renewSubscription: (planId: string, paymentMethod: SaasPaymentRecord['payment_method'], txRef?: string) => Promise<{ success: boolean; message: string }>;
  updateSubscriptionStatus: (schoolId: string, status: SaasSubscriptionRecord['status']) => void;
  updateSchoolStatus: (schoolId: string, status: 'pending' | 'active' | 'suspended' | 'blocked' | 'cancelled') => void;
  createTrialSubscription: (schoolId: string) => SaasSubscriptionRecord; // ✅ Nouvelle méthode
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentSchool, updateSchool } = useTenant();

  const [plans] = useState<SaasPlan[]>(() => getLocalCache('saas_plans', defaultPlans));
  const [subscriptions, setSubscriptions] = useState<SaasSubscriptionRecord[]>(() => 
    getLocalCache('saas_subscriptions', [])
  );
  const [payments, setPayments] = useState<SaasPaymentRecord[]>(() => getLocalCache('saas_payments', []));

  // ✅ Trouver l'abonnement courant, avec fallback
  const currentSubscription = currentSchool?.id 
    ? subscriptions.find(s => s.school_id === currentSchool.id) || null
    : null;

  const currentPlan = currentSubscription 
    ? plans.find(p => p.id === currentSubscription.plan_id) || null
    : null;

  const accessCheck = accessControlService.canAccessSchoolDashboard(
    user,
    currentSchool,
    currentSubscription,
    currentPlan
  );

  // ✅ Nouvelle méthode pour créer un abonnement d'essai
  const createTrialSubscription = useCallback((schoolId: string): SaasSubscriptionRecord => {
    const trialSub: SaasSubscriptionRecord = {
      id: `sub-${schoolId}-${Date.now()}`,
      school_id: schoolId,
      plan_id: 'plan-professionnel',
      plan_name: 'Professionnel',
      status: 'trialing',
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 jours
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    setSubscriptions(prev => {
      const filtered = prev.filter(s => s.school_id !== schoolId);
      const updated = [...filtered, trialSub];
      setLocalCache('saas_subscriptions', updated);
      return updated;
    });

    return trialSub;
  }, []);

  const renewSubscription = async (
    planId: string,
    paymentMethod: SaasPaymentRecord['payment_method'],
    txRef?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentSchool?.id) {
      return { success: false, message: 'Aucune école sélectionnée.' };
    }

    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) {
      return { success: false, message: 'Forfait sélectionné invalide.' };
    }

    const schoolId = currentSchool.id;
    const ref = txRef || `TX-SAAS-${Date.now().toString().slice(-6)}`;

    // ✅ Vérifier l'existence d'un abonnement existant
    const existingSub = subscriptions.find(s => s.school_id === schoolId);
    const subId = existingSub?.id || `sub-${schoolId}-${Date.now()}`;

    const newPayment: SaasPaymentRecord = {
      id: `pay-${Date.now()}`,
      school_id: schoolId,
      subscription_id: subId,
      amount: selectedPlan.price,
      currency: 'XOF',
      payment_method: paymentMethod,
      transaction_reference: ref,
      status: 'completed',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    setLocalCache('saas_payments', updatedPayments);

    const updatedSub: SaasSubscriptionRecord = {
      id: subId,
      school_id: schoolId,
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      status: 'active',
      starts_at: existingSub?.starts_at || new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      trial_ends_at: existingSub?.trial_ends_at,
      created_at: existingSub?.created_at || new Date().toISOString()
    };

    const updatedSubs = subscriptions.map(s => s.school_id === schoolId ? updatedSub : s);
    if (!updatedSubs.some(s => s.school_id === schoolId)) {
      updatedSubs.push(updatedSub);
    }
    setSubscriptions(updatedSubs);
    setLocalCache('saas_subscriptions', updatedSubs);

    updateSchoolStatus(schoolId, 'active');

    return {
      success: true,
      message: `Abonnement ${selectedPlan.name} activé avec succès (${selectedPlan.price.toLocaleString('fr-FR')} FCFA / an) !`
    };
  };

  const updateSubscriptionStatus = (schoolId: string, status: SaasSubscriptionRecord['status']) => {
    const updatedSubs = subscriptions.map(s => 
      s.school_id === schoolId ? { ...s, status } : s
    );
    setSubscriptions(updatedSubs);
    setLocalCache('saas_subscriptions', updatedSubs);
  };

  const updateSchoolStatus = (schoolId: string, status: 'pending' | 'active' | 'suspended' | 'blocked' | 'cancelled') => {
    updateSchool(schoolId, { status });
  };

  return (
    <SubscriptionContext.Provider value={{
      plans,
      subscriptions,
      currentSubscription,
      currentPlan,
      accessCheck,
      payments,
      renewSubscription,
      updateSubscriptionStatus,
      updateSchoolStatus,
      createTrialSubscription, // ✅ Exposer la nouvelle méthode
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};