import React, { createContext, useContext, useState } from 'react';
import { SaasPlan, SaasSubscriptionRecord, SaasPaymentRecord, AccessCheckResult } from '../types/database';
import { getLocalCache, setLocalCache } from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import { accessControlService } from '../services/accessControlService';

const defaultPlans: SaasPlan[] = [
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
    max_students: null, // Illimité
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

const defaultSubscription: SaasSubscriptionRecord = {
  id: 'sub-palmeraie-01',
  school_id: 'school-palmeraie-01',
  plan_id: 'plan-professionnel',
  plan_name: 'Professionnel',
  status: 'active',
  starts_at: '2025-09-01T00:00:00.000Z',
  expires_at: '2027-09-01T00:00:00.000Z',
  trial_ends_at: '2025-09-15T00:00:00.000Z',
  created_at: new Date().toISOString()
};

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
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentSchool, updateSchool } = useTenant();

  const [plans] = useState<SaasPlan[]>(() => getLocalCache('saas_plans', defaultPlans));
  const [subscriptions, setSubscriptions] = useState<SaasSubscriptionRecord[]>(() => 
    getLocalCache('saas_subscriptions', [defaultSubscription])
  );
  const [payments, setPayments] = useState<SaasPaymentRecord[]>(() => getLocalCache('saas_payments', []));

  const currentSubscription = subscriptions.find(s => s.school_id === currentSchool?.id) || {
    id: `sub-${currentSchool?.id || 'default'}`,
    school_id: currentSchool?.id || 'school-palmeraie-01',
    plan_id: 'plan-professionnel',
    plan_name: 'Professionnel',
    status: 'active',
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  };

  const currentPlan = plans.find(p => p.id === currentSubscription?.plan_id) || plans[1];

  const accessCheck = accessControlService.canAccessSchoolDashboard(
    user,
    currentSchool,
    currentSubscription,
    currentPlan
  );

  const renewSubscription = async (
    planId: string,
    paymentMethod: SaasPaymentRecord['payment_method'],
    txRef?: string
  ): Promise<{ success: boolean; message: string }> => {
    const selectedPlan = plans.find(p => p.id === planId) || plans[1];
    const schoolId = currentSchool.id;
    const ref = txRef || `TX-SAAS-${Date.now().toString().slice(-6)}`;

    const newPayment: SaasPaymentRecord = {
      id: `pay-${Date.now()}`,
      school_id: schoolId,
      subscription_id: currentSubscription.id,
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
      ...currentSubscription,
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      status: 'active',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
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
    const updatedSubs = subscriptions.map(s => {
      if (s.school_id === schoolId) {
        return { ...s, status };
      }
      return s;
    });
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
      updateSchoolStatus
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
