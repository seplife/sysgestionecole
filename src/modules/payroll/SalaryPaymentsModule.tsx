import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, CheckCircle2, DollarSign, Search, Plus, Filter, MessageSquare, Printer } from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { pdfExportService } from '../../services/pdfExportService';
import { supabaseService } from '../../services/supabaseService';
import { Payslip, SalaryPayment, School, PaymentMethod } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

export const SalaryPaymentsModule: React.FC = () => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'virement' as PaymentMethod,
    bank_name: 'NSIA Banque CI',
    mobile_money_provider: 'Wave',
    mobile_money_phone: '',
    transaction_number: '',
    payment_date: new Date().toISOString().substring(0, 10),
    notes: ''
  });

  const [currentSchool, setCurrentSchool] = useState<School>({
    id: 'school-palmeraie-01',
    name: 'COLLÈGE CATHOLIQUE SAINT-VIATEUR',
    address: 'Riviera Palmeraie, Rue de la Paix',
    phone: '+225 27 22 49 88 00',
    email: 'contact@saintviateur-palmeraie.ci',
    registration_number: '000730/MENA',
    school_type: 'Prive'
  });

  useEffect(() => {
    payrollService.fetchPayslips().then(setPayslips);
    payrollService.fetchSalaryPayments().then(setPayments);
    supabaseService.fetchSchools().then(s => { if (s && s[0]) setCurrentSchool(s[0]); });
  }, []);

  const handleOpenPaymentModal = (ps: Payslip) => {
    setSelectedPayslip(ps);
    setPaymentForm({
      amount: ps.net_salary - ps.paid_amount,
      payment_method: ps.payment_method || 'virement',
      bank_name: 'NSIA Banque CI',
      mobile_money_provider: 'Wave',
      mobile_money_phone: '',
      transaction_number: `VIR-CI-${Math.floor(100000 + Math.random() * 900000)}`,
      payment_date: new Date().toISOString().substring(0, 10),
      notes: 'Règlement de salaire mensuel'
    });
    setShowPaymentModal(true);
  };

  const handleExecuteSalaryPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayslip) return;

    const payment: Partial<SalaryPayment> = {
      id: `pay-${Date.now()}`,
      school_id: 'school-palmeraie-01',
      payslip_id: selectedPayslip.id,
      employee_id: selectedPayslip.employee_id,
      employee_name: selectedPayslip.employee_name,
      payroll_period_id: selectedPayslip.payroll_period_id,
      payment_reference: `PAY-SAL-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: paymentForm.amount,
      payment_method: paymentForm.payment_method,
      bank_name: paymentForm.bank_name,
      transaction_number: paymentForm.transaction_number,
      mobile_money_provider: paymentForm.mobile_money_provider,
      mobile_money_phone: paymentForm.mobile_money_phone,
      payment_date: paymentForm.payment_date,
      status: 'succes',
      notes: paymentForm.notes
    };

    const updatedPayments = await payrollService.recordSalaryPayment(payment);
    setPayments(updatedPayments);

    // Refresh payslips
    const updatedPayslips = await payrollService.fetchPayslips();
    setPayslips(updatedPayslips);
    setShowPaymentModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-brand-500" />
            <span>Paiement des Salaires & Virement Bancaire / Mobile Money</span>
          </h1>
          <p className="text-xs text-slate-400">Règlement des bulletins de salaire, suivi des versements et reçus de paiement</p>
        </div>
      </div>

      {/* Payslips awaiting payment */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Bulletins de Salaire à Régler</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b">
              <tr>
                <th className="py-3.5 px-4">Bulletin N°</th>
                <th className="py-3.5 px-4">Employé</th>
                <th className="py-3.5 px-4">Mode Préférentiel</th>
                <th className="py-3.5 px-4">Net à Payer</th>
                <th className="py-3.5 px-4">Déjà Payé</th>
                <th className="py-3.5 px-4">Reste à Régler</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payslips.map(ps => {
                const remaining = ps.net_salary - (ps.paid_amount || 0);
                return (
                  <tr key={ps.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">{ps.payslip_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{ps.employee_name}</td>
                    <td className="py-3 px-4 capitalize font-semibold">{ps.payment_method}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{formatFCFA(ps.net_salary)}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600 font-bold">{formatFCFA(ps.paid_amount || 0)}</td>
                    <td className="py-3 px-4 font-extrabold text-amber-600">{formatFCFA(remaining)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ps.payment_status === 'paye' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {ps.payment_status === 'paye' ? 'Payé (Soldé)' : 'En Attente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {remaining > 0 ? (
                        <button
                          onClick={() => handleOpenPaymentModal(ps)}
                          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-xs flex items-center gap-1 ml-auto"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Payer le Salaire</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => pdfExportService.printPayslip(ps, currentSchool)}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reçu PDF</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Payment Executer */}
      {showPaymentModal && selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span>Exécuter le Règlement du Salaire</span>
            </h3>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-xs space-y-1 border">
              <div>Employé: <span className="font-bold text-slate-900 dark:text-white">{selectedPayslip.employee_name}</span></div>
              <div>Bulletin N°: <span className="font-mono font-bold text-brand-600">{selectedPayslip.payslip_number}</span></div>
              <div>Net à Payer: <span className="font-extrabold text-emerald-600">{formatFCFA(selectedPayslip.net_salary)}</span></div>
            </div>

            <form onSubmit={handleExecuteSalaryPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Montant Versé (FCFA) *</label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Moyen de Paiement *</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value as PaymentMethod})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="virement">Virement Bancaire (NSIA / Ecobank / SGBCI)</option>
                  <option value="mobile_money">Mobile Money (Wave / Orange / MTN)</option>
                  <option value="cheque">Chèque Bancaire</option>
                  <option value="especes">Espèces</option>
                </select>
              </div>

              {paymentForm.payment_method === 'virement' && (
                <div>
                  <label className="block font-bold mb-1">Référence Transaction / Virement</label>
                  <input
                    type="text"
                    value={paymentForm.transaction_number}
                    onChange={e => setPaymentForm({...paymentForm, transaction_number: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
              )}

              {paymentForm.payment_method === 'mobile_money' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1">Opérateur</label>
                    <select
                      value={paymentForm.mobile_money_provider}
                      onChange={e => setPaymentForm({...paymentForm, mobile_money_provider: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                    >
                      <option value="Wave">Wave</option>
                      <option value="Orange Money">Orange Money</option>
                      <option value="MTN MoMo">MTN MoMo</option>
                      <option value="Moov Money">Moov Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Téléphone</label>
                    <input
                      type="text"
                      placeholder="+225 0700000000"
                      value={paymentForm.mobile_money_phone}
                      onChange={e => setPaymentForm({...paymentForm, mobile_money_phone: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold mb-1">Date de Règlement *</label>
                <input
                  type="date"
                  required
                  value={paymentForm.payment_date}
                  onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md">Valider le Règlement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
