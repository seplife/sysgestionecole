import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Calendar, CheckCircle2, AlertCircle, FileText, ArrowUpRight, ShieldCheck, Printer } from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { hrService } from '../../services/hrService';
import { pdfExportService } from '../../services/pdfExportService';
import { supabaseService } from '../../services/supabaseService';
import { PayrollPeriod, Payslip, Employee, School } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

interface PayrollDashboardProps {
  onNavigateSubModule?: (subModule: string) => void;
}

export const PayrollDashboardModule: React.FC<PayrollDashboardProps> = ({ onNavigateSubModule }) => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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
    payrollService.fetchPayrollPeriods().then(setPeriods);
    payrollService.fetchPayslips().then(setPayslips);
    hrService.fetchEmployees().then(setEmployees);
    supabaseService.fetchSchools().then(s => { if (s && s[0]) setCurrentSchool(s[0]); });
  }, []);

  const latestPeriod = periods[0] || {
    name: 'Mois En Cours',
    total_gross: 0,
    total_net: 0,
    total_deductions: 0,
    employee_count: employees.length,
    status: 'preparation'
  };

  const paidCount = payslips.filter(p => p.payment_status === 'paye').length;
  const pendingCount = payslips.filter(p => p.payment_status !== 'paye').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-brand-500" />
            <span>Tableau de Bord de la Paie</span>
          </h1>
          <p className="text-xs text-slate-400">Préparation des salaires, calculs automatiques des primes, cotisations et génération des bulletins</p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateSubModule && (
            <button
              onClick={() => onNavigateSubModule('preparation')}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Calculer la Paie du Mois</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Masse Salariale Brute</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{formatFCFA(latestPeriod.total_gross || 910000)}</div>
          <div className="text-xs text-slate-500 mt-1">Période: {latestPeriod.name}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Net à Payer</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{formatFCFA(latestPeriod.total_net || 815000)}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">Nets individuels prêts</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retenues (CNPS & Impôts)</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{formatFCFA(latestPeriod.total_deductions || 95000)}</div>
          <div className="text-xs text-rose-700 font-medium mt-1">Charges à reverser aux organismes</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bulletins Régalés / Total</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{paidCount} / {employees.length}</div>
          <div className="text-xs text-slate-500 mt-1">{pendingCount} en attente de paiement</div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Derniers Bulletins de Salaire Générés</h3>
          {onNavigateSubModule && (
            <button onClick={() => onNavigateSubModule('payslips')} className="text-xs font-bold text-brand-600 hover:text-brand-700">Tous les bulletins</button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b">
              <tr>
                <th className="py-3.5 px-4">N° Bulletin</th>
                <th className="py-3.5 px-4">Employé</th>
                <th className="py-3.5 px-4">Poste</th>
                <th className="py-3.5 px-4">Salaire Brut</th>
                <th className="py-3.5 px-4">Retenues</th>
                <th className="py-3.5 px-4">Net à Payer</th>
                <th className="py-3.5 px-4">Statut Règlement</th>
                <th className="py-3.5 px-4 text-right">Imprimer PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payslips.map(ps => (
                <tr key={ps.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-brand-600">{ps.payslip_number}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{ps.employee_name}</td>
                  <td className="py-3 px-4">{ps.position_title}</td>
                  <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{formatFCFA(ps.gross_salary)}</td>
                  <td className="py-3 px-4 font-mono text-rose-600 font-bold">-{formatFCFA(ps.total_deductions)}</td>
                  <td className="py-3 px-4 font-extrabold text-emerald-600 text-sm">{formatFCFA(ps.net_salary)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ps.payment_status === 'paye' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {ps.payment_status === 'paye' ? 'Payé' : 'En Attente'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => pdfExportService.printPayslip(ps, currentSchool)}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
