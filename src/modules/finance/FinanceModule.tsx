import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, DollarSign, Smartphone, CheckCircle2, Filter, Search, 
  ShieldCheck, ArrowDownRight, Sparkles, MessageSquare, Users, RefreshCw, UserCheck, AlertCircle 
} from 'lucide-react';
import { PaymentTransaction, Student } from '../../types/database';
import { paymentService } from '../../services/supabase/payment.service';
import { supabaseService } from '../../services/supabaseService';
import { calculateStudentTuition } from '../../services/studentTuitionService';
import { useTenant } from '../../context/TenantContext';
import { formatFCFA } from '../../utils/payrollCalculations';

export const FinanceModule: React.FC = () => {
  const { currentSchool } = useTenant();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recouvrement' | 'transactions'>('recouvrement');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('Tous');

  // Form state for Mobile Money Payment Simulator
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [payStudentName, setPayStudentName] = useState('');
  const [payAmount, setPayAmount] = useState('150000');
  const [totalFeeAmount, setTotalFeeAmount] = useState('300000');
  const [relanceDate, setRelanceDate] = useState('2026-08-15');
  const [payMethod, setPayMethod] = useState<'wave' | 'orange_money' | 'mtn_momo' | 'moov_money'>('wave');
  const [payPhone, setPayPhone] = useState('+225 07 09 88 77 66');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{ tx: PaymentTransaction; remaining: number; relance: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const stds = await supabaseService.fetchStudents();
      setStudents(stds || []);

      let pData: PaymentTransaction[] = [];
      if (currentSchool?.id) {
        try {
          pData = await paymentService.getAll(currentSchool.id);
        } catch (e) {
          pData = await supabaseService.fetchPayments();
        }
      } else {
        pData = await supabaseService.fetchPayments();
      }
      setPayments(pData || []);
    } catch (err) {
      console.warn('[FinanceModule Load Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentSchool?.id]);

  // Compute tuition status for all enrolled students
  const studentTuitionList = useMemo(() => {
    return students.map(student => {
      const info = calculateStudentTuition(student, payments);
      return {
        student,
        info
      };
    });
  }, [students, payments]);

  const totalExpectedTuition = useMemo(() => {
    return studentTuitionList.reduce((acc, curr) => acc + curr.info.totalTuition, 0);
  }, [studentTuitionList]);

  const totalCollectedTuition = useMemo(() => {
    return studentTuitionList.reduce((acc, curr) => acc + curr.info.totalPaid, 0);
  }, [studentTuitionList]);

  const totalRemainingTuition = useMemo(() => {
    return Math.max(0, totalExpectedTuition - totalCollectedTuition);
  }, [totalExpectedTuition, totalCollectedTuition]);

  const globalRecoveryRate = useMemo(() => {
    if (totalExpectedTuition === 0) return 0;
    return Number(((totalCollectedTuition / totalExpectedTuition) * 100).toFixed(1));
  }, [totalExpectedTuition, totalCollectedTuition]);

  // Available classes list
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.current_class_name) set.add(s.current_class_name);
    });
    return ['Tous', ...Array.from(set)];
  }, [students]);

  // Filtered student tuition list
  const filteredStudentTuitionList = useMemo(() => {
    return studentTuitionList.filter(({ student }) => {
      const fullName = `${student.first_name} ${student.last_name} ${student.registration_number}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase());
      const matchesClass = selectedClassFilter === 'Tous' || student.current_class_name === selectedClassFilter;
      return matchesSearch && matchesClass;
    });
  }, [studentTuitionList, searchQuery, selectedClassFilter]);

  const openPaymentModalForStudent = (student: Student) => {
    const info = calculateStudentTuition(student, payments);
    setSelectedStudentId(student.id);
    setPayStudentName(`${student.last_name} ${student.first_name}`);
    setTotalFeeAmount(info.totalTuition.toString());
    setPayAmount(info.remainingBalance > 0 ? info.remainingBalance.toString() : '50000');
    const phone = (student as any).parent_phone || (student as any).guardian_phone || '+225 07 09 88 77 66';
    setPayPhone(phone);
    setSuccessReceipt(null);
    setShowPaymentModal(true);
  };

  const openGenericPaymentModal = () => {
    if (students.length > 0) {
      openPaymentModalForStudent(students[0]);
    } else {
      setSelectedStudentId('');
      setPayStudentName('Élève non sélectionné');
      setTotalFeeAmount('300000');
      setPayAmount('150000');
      setSuccessReceipt(null);
      setShowPaymentModal(true);
    }
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const randTx = `${payMethod.toUpperCase()}-CI-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const amountPaid = parseInt(payAmount) || 0;
      const totalFee = parseInt(totalFeeAmount) || 300000;
      const remaining = Math.max(0, totalFee - amountPaid);

      const targetStudentId = selectedStudentId && selectedStudentId.length > 10
        ? selectedStudentId
        : '20000000-0000-4000-8000-000000000001';

      let createdTx: PaymentTransaction;
      try {
        createdTx = await paymentService.create({
          school_id: currentSchool?.id || '11111111-1111-4111-8111-111111111111',
          student_id: targetStudentId,
          amount: amountPaid,
          payment_method: payMethod,
          reference: randTx,
          status: 'completed',
          payment_date: new Date().toISOString().split('T')[0],
          description: `Paiement Mobile Money pour ${payStudentName}`
        });
      } catch (saveErr) {
        console.warn('[Supabase Direct Create Fallback]:', saveErr);
        const txFallback: Partial<PaymentTransaction> = {
          id: `tx-${Date.now()}`,
          school_id: currentSchool?.id || '11111111-1111-4111-8111-111111111111',
          student_id: targetStudentId,
          amount: amountPaid,
          payment_method: payMethod,
          reference: randTx,
          status: 'completed',
          payment_date: new Date().toISOString().split('T')[0],
          description: `Paiement Mobile Money pour ${payStudentName}`,
          created_at: new Date().toISOString()
        };
        await supabaseService.savePayment(txFallback);
        createdTx = txFallback as PaymentTransaction;
      }

      const fullTx: PaymentTransaction = {
        ...createdTx,
        student_name: payStudentName,
        receipt_number: `REC-2026-00${Math.floor(484 + Math.random() * 500)}`,
        payer_phone: payPhone
      };

      setPayments([fullTx, ...payments]);
      setIsProcessing(false);
      setSuccessReceipt({
        tx: fullTx,
        remaining,
        relance: relanceDate
      });
    } catch (err: any) {
      console.error('[Finance Save Error]:', err);
      setIsProcessing(false);
      alert(`Erreur d'enregistrement du paiement: ${err.message || err}`);
    }
  };

  const getWhatsAppReceiptMessage = (studentName: string, amount: number, remaining: number, relance: string, paymentDate?: string) => {
    const pDate = paymentDate || new Date().toLocaleDateString();
    if (remaining <= 0) {
      return `Bonjour Chers Parents,\n\nNous vous accusons réception de votre paiement effectué le ${pDate} pour l'élève ${studentName} :\n• Montant payé : ${formatFCFA(amount)}\n• Statut : Scolarité Intégralement SOLDÉE (0 FCFA restant)\n\nMerci pour votre confiance.`;
    }
    return `Bonjour Chers Parents,\n\nNous vous accusons réception de votre règlement effectué le ${pDate} pour l'élève ${studentName} :\n• Montant payé : ${formatFCFA(amount)}\n• Montant restant à payer : ${formatFCFA(remaining)}\n• Date d'échéance du solde : ${relance}\n\nMerci de solder le montant restant avant cette date.`;
  };

  const getWhatsAppRelanceMessage = (studentName: string, remaining: number, className?: string) => {
    return `Bonjour Chers Parents de l'élève ${studentName} (${className || 'IvoireÉcole+'}),\n\nSauf erreur de notre part, le solde des frais de scolarité s'élève à ${formatFCFA(remaining)}.\n\nNous vous prions de bien vouloir effectuer votre règlement par Mobile Money (Wave, Orange, MTN, MoMo).\n\nMerci pour votre collaboration.`;
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
          <p className="text-xs text-slate-400">Paiement Wave, Orange Money, MTN MoMo & Suivi en temps réel des {students.length} élèves inscrits</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Actualiser les élèves et paiements"
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openGenericPaymentModal}
            className="bg-gradient-to-r from-brand-600 to-ivory-orange hover:from-brand-700 hover:to-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>Enregistrer un Paiement Mobile Money</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Élèves Enregistrés</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center justify-between">
            <span>{students.length} <span className="text-xs font-normal text-slate-500">élèves</span></span>
            <Users className="w-6 h-6 text-brand-500/40" />
          </div>
          <div className="text-xs text-brand-600 font-semibold mt-1">Dossiers scolaires synchronisés</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Encaissé Totaux</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatFCFA(totalCollectedTuition)}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Paiements Mobile Money validés</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Reste à Recouvrer</span>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {formatFCFA(totalRemainingTuition)}
          </div>
          <div className="text-xs text-amber-600 font-semibold mt-1">Relances WhatsApp actives</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Taux de Recouvrement</span>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {globalRecoveryRate} %
          </div>
          <div className="text-xs text-slate-500 mt-1">Scolarité globale écolages</div>
        </div>
      </div>

      {/* Tabs Selection */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('recouvrement')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'recouvrement'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Suivi du Recouvrement des Élèves ({filteredStudentTuitionList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Historique des Transactions ({payments.length})</span>
        </button>
      </div>

      {/* TAB 1: RECOUVREMENT PAR ÉLÈVE INSRIT */}
      {activeTab === 'recouvrement' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filtrer par Classe :</span>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                {availableClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Students Recovery Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">Élève Inscrit</th>
                    <th className="py-3.5 px-4">Matricule</th>
                    <th className="py-3.5 px-4">Classe</th>
                    <th className="py-3.5 px-4">Scolarité Totale</th>
                    <th className="py-3.5 px-4">Montant Payé</th>
                    <th className="py-3.5 px-4">Reste à Payer</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right">Actions Mobile Money</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                        Chargement des élèves et statuts de recouvrement en cours...
                      </td>
                    </tr>
                  ) : filteredStudentTuitionList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                        Aucun élève trouvé pour ces critères de recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentTuitionList.map(({ student, info }) => {
                      const relanceWaUrl = `https://wa.me/${((student as any).parent_phone || '+2250700000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getWhatsAppRelanceMessage(`${student.last_name} ${student.first_name}`, info.remainingBalance, student.current_class_name))}`;
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                              {student.first_name[0]}{student.last_name[0]}
                            </div>
                            <div>
                              <span>{student.last_name} {student.first_name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">{student.registration_number}</td>
                          <td className="py-3.5 px-4 text-xs font-bold text-brand-600">{student.current_class_name || 'Non assigné'}</td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">{formatFCFA(info.totalTuition)}</td>
                          <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">{formatFCFA(info.totalPaid)}</td>
                          <td className="py-3.5 px-4 font-extrabold text-rose-600 dark:text-rose-400">
                            {formatFCFA(info.remainingBalance)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full ${info.statusBadgeColor}`}>
                              {info.statusLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => openPaymentModalForStudent(student)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>Payer</span>
                            </button>

                            {info.remainingBalance > 0 && (
                              <a
                                href={relanceWaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Relance WhatsApp</span>
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIQUE DES TRANSACTIONS */}
      {activeTab === 'transactions' && (
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
                  <th className="py-3.5 px-4">Montant</th>
                  <th className="py-3.5 px-4">Moyen de Paiement</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Notifier Parent WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Aucune transaction Mobile Money enregistrée.
                    </td>
                  </tr>
                ) : (
                  payments.map((tx) => {
                    const msg = getWhatsAppReceiptMessage(tx.student_name || 'Élève', tx.amount, 0, '2026-08-15');
                    const waUrl = `https://wa.me/${(tx.payer_phone || '+2250700000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">{tx.receipt_number || tx.reference}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{tx.student_name || 'N/A'}</td>
                        <td className="py-3 px-4 font-extrabold text-base text-slate-900 dark:text-white">
                          {formatFCFA(tx.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            tx.payment_method === 'wave' || tx.payment_method === 'Wave' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                            tx.payment_method === 'orange_money' || tx.payment_method === 'Orange Money' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                            tx.payment_method === 'mtn_momo' || tx.payment_method === 'MTN MoMo' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700'
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Sélectionner l'Élève Inscrit</label>
                  <select 
                    value={selectedStudentId} 
                    onChange={(e) => {
                      const sId = e.target.value;
                      setSelectedStudentId(sId);
                      const found = students.find(s => s.id === sId);
                      if (found) {
                        const info = calculateStudentTuition(found, payments);
                        setPayStudentName(`${found.last_name} ${found.first_name}`);
                        setTotalFeeAmount(info.totalTuition.toString());
                        setPayAmount(info.remainingBalance > 0 ? info.remainingBalance.toString() : '50000');
                        const phone = (found as any).parent_phone || (found as any).guardian_phone || payPhone;
                        setPayPhone(phone);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="">-- Sélectionner un élève dans la liste --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.last_name} {s.first_name} ({s.current_class_name || 'Sans classe'}) — Mat: {s.registration_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Choix de l'Opérateur Mobile Money</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { code: 'wave', label: 'Wave' },
                      { code: 'orange_money', label: 'Orange Money' },
                      { code: 'mtn_momo', label: 'MTN MoMo' },
                      { code: 'moov_money', label: 'Moov Money' }
                    ].map(op => (
                      <button
                        type="button"
                        key={op.code}
                        onClick={() => setPayMethod(op.code as any)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          payMethod === op.code ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-xs' : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        {op.label}
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Montant versé aujourd'hui</label>
                    <input 
                      type="number" 
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Date de Relance (si solde restant non nul)</label>
                  <input 
                    type="date" 
                    value={relanceDate}
                    onChange={(e) => setRelanceDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Téléphone du Parent ({payMethod})</label>
                  <input 
                    type="text" 
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
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
                
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-xs space-y-2 text-left border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between"><span>N° Reçu:</span> <span className="font-mono font-bold text-brand-600">{successReceipt.tx.receipt_number}</span></div>
                  <div className="flex justify-between"><span>Élève:</span> <span className="font-bold">{successReceipt.tx.student_name}</span></div>
                  <div className="flex justify-between"><span>Montant Payé:</span> <span className="font-extrabold text-emerald-600">{formatFCFA(successReceipt.tx.amount)}</span></div>
                  <div className="flex justify-between">
                    <span>Statut Scolarité:</span> 
                    <span className={`font-bold ${successReceipt.remaining === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {successReceipt.remaining === 0 ? 'SOLDÉE (0 FCFA)' : `Reste ${formatFCFA(successReceipt.remaining)}`}
                    </span>
                  </div>
                  {successReceipt.remaining > 0 && (
                    <div className="flex justify-between text-amber-700"><span>Date de Relance:</span> <span className="font-mono font-bold">{successReceipt.relance}</span></div>
                  )}
                </div>

                <div className="space-y-2">
                  <a
                    href={`https://wa.me/${(successReceipt.tx.payer_phone || '+2250700000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getWhatsAppReceiptMessage(successReceipt.tx.student_name || '', successReceipt.tx.amount, successReceipt.remaining, successReceipt.relance))}`}
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

