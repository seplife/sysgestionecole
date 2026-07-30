import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Printer, Users, Wallet, FileSpreadsheet } from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { hrService } from '../../services/hrService';
import { budgetService } from '../../services/budgetService';
import { pdfExportService } from '../../services/pdfExportService';
import { supabaseService } from '../../services/supabaseService';
import { PayrollPeriod, Payslip, Employee, School, Budget } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

interface PayrollDashboardProps {
  onNavigateSubModule?: (subModule: string) => void;
}

export const PayrollDashboardModule: React.FC<PayrollDashboardProps> = ({ onNavigateSubModule }) => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentSchool, setCurrentSchool] = useState<School>({
    id: 'school-palmeraie-01',
    name: 'COLLÈGE CATHOLIQUE SAINT-VIATEUR',
    slug: 'saint-viateur-palmeraie',
    address: 'Riviera Palmeraie, Rue de la Paix',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    phone: '+225 27 22 49 88 00',
    email: 'contact@saintviateur-palmeraie.ci',
    registration_number: '000730/MENA',
    motto: 'Foi, Discipline, Excellence',
    school_type: 'Prive',
    status: 'active',
    created_at: new Date().toISOString()
  });

  useEffect(() => {
    payrollService.fetchPayrollPeriods().then(setPeriods);
    payrollService.fetchPayslips().then(setPayslips);
    hrService.fetchEmployees().then(setEmployees);
    budgetService.fetchBudgets().then(setBudgets);
    supabaseService.fetchSchools().then(s => { if (s && s[0]) setCurrentSchool(s[0]); });
  }, []);

  const latestPeriod = periods[0] || {
    name: 'Juillet 2026',
    total_gross: 910000,
    total_net: 815000,
    total_deductions: 95000,
    employee_count: employees.length || 3,
    status: 'preparation'
  };

  // Dynamic calculations from payslips / employees if available
  const grossFromPayslips = payslips.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
  const netFromPayslips = payslips.reduce((sum, p) => sum + (p.net_salary || 0), 0);
  const deductionsFromPayslips = payslips.reduce((sum, p) => sum + (p.total_deductions || 0), 0);

  const massSalarialeBrute = grossFromPayslips > 0 ? grossFromPayslips : (latestPeriod.total_gross || 910000);
  const totalNetAPayer = netFromPayslips > 0 ? netFromPayslips : (latestPeriod.total_net || 815000);
  const totalRetenues = deductionsFromPayslips > 0 ? deductionsFromPayslips : (latestPeriod.total_deductions || 95000);
  const effectifTotal = employees.length > 0 ? employees.length : (latestPeriod.employee_count || 3);

  // Budget Annuel Prévu (Masse Salariale)
  const salaryBudget = budgets.find(b => b.cost_center_id === 'cc-01' || b.cost_center_name?.toLowerCase().includes('salariale'));
  const budgetAnnuelPrevu = salaryBudget ? salaryBudget.total_planned : (budgets.reduce((sum, b) => sum + b.total_planned, 0) || 45000000);

  const paidCount = payslips.filter(p => p.payment_status === 'paye').length;
  const pendingCount = payslips.filter(p => p.payment_status !== 'paye').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-brand-500" />
            <span>Tableau de Bord de la Paie & RH</span>
          </h1>
          <p className="text-xs text-slate-400">Suivi de la masse salariale, cotisations sociales (CNPS), impôts et budget annuel prévisionnel</p>
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

      {/* KPI Cards Grid — 5 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Masse Salariale Brute */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Masse Salariale Brute</span>
            <Wallet className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatFCFA(massSalarialeBrute)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Période: {latestPeriod.name}</div>
        </div>

        {/* 2. Total Net à Payer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Net à Payer</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatFCFA(totalNetAPayer)}</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-500 font-semibold mt-1">Virements & Mobile Money</div>
        </div>

        {/* 3. Retenues (CNPS & Impôts) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Retenues (CNPS & Impôts)</span>
            <span className="text-xs font-bold text-rose-500">Cotisations</span>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{formatFCFA(totalRetenues)}</div>
          <div className="text-[11px] text-rose-700 dark:text-rose-500 font-medium mt-1">CNPS, IGR & Impôts sur salaires</div>
        </div>

        {/* 4. Effectif Total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Effectif Total</span>
            <Users className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{effectifTotal} Employés</div>
          <div className="text-[11px] text-slate-500 mt-1">{paidCount} payés / {pendingCount} en attente</div>
        </div>

        {/* 5. Budget Annuel Prévu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Budget Annuel Prévu</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{formatFCFA(budgetAnnuelPrevu)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Axe Masse Salariale & RH</div>
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
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
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
                <tr key={ps.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
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
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 shadow-xs transition-colors"
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
