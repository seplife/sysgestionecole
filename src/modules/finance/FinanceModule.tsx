import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Smartphone, CheckCircle2, Printer, Filter, Search, ShieldCheck, ArrowDownRight, Sparkles, MessageSquare } from 'lucide-react';
import { PaymentTransaction, StudentFee } from '../../types/database';
import { supabaseService } from '../../services/supabaseService';

export const FinanceModule: React.FC = () => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);

  useEffect(() => {
    supabaseService.fetchPayments().then(data => setPayments(data));
  }, []);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form state for Mobile Money Payment Simulator
  const [payStudentName, setPayStudentName] = useState('Awa Fatima DIABATÉ');
  const [payAmount, setPayAmount] = useState('150000');
  const [totalFeeAmount, setTotalFeeAmount] = useState('300000');
  const [relanceDate, setRelanceDate] = useState('2026-08-15');
  const [payMethod, setPayMethod] = useState<'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money'>('Wave');
  const [payPhone, setPayPhone] = useState('+225 07 09 88 77 66');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{ tx: PaymentTransaction; remaining: number; relance: string } | null>(null);

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const randTx = `${payMethod.toUpperCase()}-CI-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const amountPaid = parseInt(payAmount) || 150000;
      const totalFee = parseInt(totalFeeAmount) || 300000;
      const remaining = Math.max(0, totalFee - amountPaid);

      const newTx: PaymentTransaction = {
        id: `pay-${Date.now()}`,
        school_id: 'school-palmeraie-01',
        student_name: payStudentName,
        receipt_number: `REC-2026-00${Math.floor(484 + Math.random() * 500)}`,
        amount: amountPaid,
        payment_method: payMethod,
        transaction_id: randTx,
        payer_phone: payPhone,
        payer_name: 'Parent d\'élève',
        status: 'Succès',
        created_at: new Date().toISOString()
      };

      setPayments([newTx, ...payments]);
      supabaseService.savePayment(newTx);
      setIsProcessing(false);
      setSuccessReceipt({
        tx: newTx,
        remaining,
        relance: relanceDate
      });
    }, 1500);
  };

  const getWhatsAppReceiptMessage = (studentName: string, amount: number, remaining: number, relance: string, paymentDate?: string) => {
    const pDate = paymentDate || new Date().toLocaleDateString();
    if (remaining <= 0) {
      return `Bonjour Chers Parents,\n\nNous vous accusons réception de votre paiement effectué le ${pDate} pour l'élève ${studentName} :\n• Montant payé : ${amount.toLocaleString()} FCFA\n• Statut : Scolarité Intégralement SOLDÉE (0 FCFA restant)\n\nMerci pour votre confiance.`;
    }
    return `Bonjour Chers Parents,\n\nNous vous accusons réception de votre règlement effectué le ${pDate} pour l'élève ${studentName} :\n• Montant payé : ${amount.toLocaleString()} FCFA\n• Montant restant à payer : ${remaining.toLocaleString()} FCFA\n• Date d'échéance du solde : ${relance}\n\nMerci de solder le montant restant avant cette date.`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-brand-500" />
            <span>Finances & Recouvrement Mobile Money</span>
          </h1>
          <p className="text-xs text-slate-400">Paiement Wave, Orange Money, MTN MoMo & Notification WhatsApp automatique des parents</p>
        </div>

        <button
          onClick={() => { setSuccessReceipt(null); setShowPaymentModal(true); }}
          className="bg-gradient-to-r from-brand-600 to-ivory-orange hover:from-brand-700 hover:to-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          <span>Enregistrer un Paiement Mobile Money</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Encaissé Ce Mois</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">42.8 M <span className="text-xs font-normal text-slate-500">FCFA</span></div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Wave (45%), Orange (30%)</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Reste à Recouvrer</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">18.2 M <span className="text-xs font-normal text-slate-500">FCFA</span></div>
          <div className="text-xs text-amber-600 font-semibold mt-1">Relances WhatsApp configurées</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Taux de Recouvrement</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">78.4 %</div>
          <div className="text-xs text-slate-500 mt-1">Alertes SMS & WhatsApp Actives</div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Historique des Transactions & Reçus WhatsApp</h3>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2.5 py-1 rounded-lg">Temps Réel</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">N° Reçu Officiel</th>
                <th className="py-3.5 px-4">Élève</th>
                <th className="py-3.5 px-4">Montant (FCFA)</th>
                <th className="py-3.5 px-4">Moyen de Paiement</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Notifier Parent WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((tx) => {
                const msg = getWhatsAppReceiptMessage(tx.student_name || '', tx.amount, 0, '2026-08-15');
                const waUrl = `https://wa.me/${(tx.payer_phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">{tx.receipt_number || tx.reference}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{tx.student_name}</td>
                    <td className="py-3 px-4 font-extrabold text-base text-slate-900 dark:text-white">
                      {tx.amount.toLocaleString()} FCFA
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        tx.payment_method === 'Wave' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                        tx.payment_method === 'Orange Money' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        tx.payment_method === 'MTN MoMo' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{new Date(tx.created_at || Date.now()).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <a 
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Envoyer WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE MONEY PAYMENT MODAL SIMULATOR */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative animate-fadeIn">
            {!successReceipt ? (
              <form onSubmit={handleExecutePayment} className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 text-brand-600 font-bold text-sm">
                    <Smartphone className="w-5 h-5" />
                    <span>Paiement Mobile Money & Relance Parent</span>
                  </div>
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Sélectionner l'Élève</label>
                  <select 
                    value={payStudentName} 
                    onChange={(e) => setPayStudentName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold"
                  >
                    <option value="Awa Fatima DIABATÉ">Awa Fatima DIABATÉ (3ème 2)</option>
                    <option value="Marc-Aurèle KOFFI">Marc-Aurèle KOFFI (3ème 2)</option>
                    <option value="Grace Emmanuelle TANO">Grace Emmanuelle TANO (Tle A2)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Choix de l'Opérateur Mobile Money</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money'] as const).map(op => (
                      <button
                        type="button"
                        key={op}
                        onClick={() => setPayMethod(op)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          payMethod === op ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-xs' : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Frais Total Scolarité</label>
                    <input 
                      type="number" 
                      value={totalFeeAmount}
                      onChange={(e) => setTotalFeeAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Montant versé aujourd'hui</label>
                    <input 
                      type="number" 
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Date de Relance (si solde restant non nul)</label>
                  <input 
                    type="date" 
                    value={relanceDate}
                    onChange={(e) => setRelanceDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Téléphone du Parent ({payMethod})</label>
                  <input 
                    type="text" 
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-brand-600 to-ivory-orange hover:from-brand-700 hover:to-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Validation avec l\'opérateur en cours...' : `Initier le Paiement via ${payMethod}`}
                </button>
              </form>
            ) : (
              /* RECEIPT SUCCESS VIEW */
              <div className="space-y-4 text-center animate-fadeIn">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Paiement Enregistré !</h3>
                
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-xs space-y-2 text-left border">
                  <div className="flex justify-between"><span>N° Reçu:</span> <span className="font-mono font-bold text-brand-600">{successReceipt.tx.receipt_number}</span></div>
                  <div className="flex justify-between"><span>Élève:</span> <span className="font-bold">{successReceipt.tx.student_name}</span></div>
                  <div className="flex justify-between"><span>Montant Payé:</span> <span className="font-extrabold text-emerald-600">{successReceipt.tx.amount.toLocaleString()} FCFA</span></div>
                  <div className="flex justify-between">
                    <span>Statut Scolarité:</span> 
                    <span className={`font-bold ${successReceipt.remaining === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {successReceipt.remaining === 0 ? 'SOLDÉE (0 FCFA)' : `Reste ${successReceipt.remaining.toLocaleString()} FCFA`}
                    </span>
                  </div>
                  {successReceipt.remaining > 0 && (
                    <div className="flex justify-between text-amber-700"><span>Date de Relance:</span> <span className="font-mono font-bold">{successReceipt.relance}</span></div>
                  )}
                </div>

                <div className="space-y-2">
                  <a
                    href={`https://wa.me/${(successReceipt.tx.payer_phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getWhatsAppReceiptMessage(successReceipt.tx.student_name || '', successReceipt.tx.amount, successReceipt.remaining, successReceipt.relance))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Envoyer le Message de Confirmation WhatsApp au Parent</span>
                  </a>

                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl text-xs"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
