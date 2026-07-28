// ============================================================
// SERVICE GESTION DES FINANCES & TRANSACTIONS
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid, isValidUuid } from './validators';
import { PaymentTransaction, PaymentInsert } from '../../types/database';

export const paymentService = {
  async getAll(schoolId?: string): Promise<PaymentTransaction[]> {
    let query = supabase.from('payment_transactions').select('*').order('created_at', { ascending: false });

    if (schoolId) {
      requireValidUuid(schoolId, 'School ID');
      query = query.eq('school_id', schoolId);
    }

    const { data, error } = await query;
    if (error) throw handleSupabaseError(error, 'Chargement des paiements');
    return (data as PaymentTransaction[]) || [];
  },

  async create(paymentData: PaymentInsert): Promise<PaymentTransaction> {
    requireValidUuid(paymentData.school_id, 'School ID');
    requireValidUuid(paymentData.student_id, 'Student ID');

    const payload = {
      school_id: paymentData.school_id,
      student_id: paymentData.student_id,
      fee_type_id: paymentData.fee_type_id && isValidUuid(paymentData.fee_type_id) ? paymentData.fee_type_id : null,
      amount: Number(paymentData.amount) || 0,
      currency: paymentData.currency || 'XOF',
      payment_method: paymentData.payment_method || 'mobile_money',
      reference: paymentData.reference?.trim() || `REF-${Date.now()}`,
      status: paymentData.status || 'completed',
      payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
      description: paymentData.description?.trim() || null,
      created_by: paymentData.created_by && isValidUuid(paymentData.created_by) ? paymentData.created_by : null
    };

    if (paymentData.id && isValidUuid(paymentData.id)) {
      (payload as any).id = paymentData.id;
    }

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert(payload)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, 'Enregistrement du paiement');
    return data as PaymentTransaction;
  },

  async delete(id: string): Promise<void> {
    requireValidUuid(id, 'Transaction ID');
    const { error } = await supabase
      .from('payment_transactions')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error, `Suppression de la transaction ${id}`);
  }
};
