import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, RefreshCw, Printer, DollarSign, Calculator } from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { pdfExportService } from '../../services/pdfExportService';
import { supabaseService } from '../../services/supabaseService';
import { PayrollPeriod, Payslip, School } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

export const PayrollPreparationModule: React.FC = () => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('per-2026-08');
  const [calculatedPayslips, setCalculatedPayslips] = useState<Payslip[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [currentSchool, setCurrentSchool] = useState<School>({
    id: 'school-palmeraie-01',
    name: 'COLLÈGE CATHOLIQUE SAINT-VIATEUR',
    address: 'Riviera Palmeraie, Rue de la Paix',
    phone: '+225 27 22 49 88 00',
    email: 'contact@saintviateur-palmeraie.ci',
    registration_number: '000730/MENA',
    school_type: 'Prive',
    slug: 'saint-viateur-palmeraie',
    status: 'active',
    created_at: new Date().toISOString()
  });

  useEffect(() => {
    payrollService.fetchPayrollPeriods().then(p => {
      setPeriods(p);
      if (p.length > 0) setSelectedPeriodId(p[0].id);
    });
    supabaseService.fetchSchools().then(s => { if (s && s[0]) setCurrentSchool(s[0]); });
  }, []);

  const handleRunPayrollCalculation = async () => {
    setIsCalculating(true);
    setTimeout(async () => {
      const result = await payrollService.generatePayrollForPeriod(selectedPeriodId);
      setCalculatedPayslips(result.payslips);
      setIsCalculating(false);
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-7 h-7 text-brand-500" />
            <span>Moteur de Calcul de Paie & Bulletins</span>
          </h1>
          <p className="text-xs text-slate-400">Calcul automatique du salaire brut, ancienneté, retenues CNPS/Impôts et net à payer</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold font-mono"
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.period_code})</option>
            ))}
          </select>

          <button
            onClick={handleRunPayrollCalculation}
            disabled={isCalculating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2"
          >
            {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Lancer le Calcul Automatique de la Paie</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>Calcul de la paie exécuté avec succès ! Tous les bulletins de salaire ont été générés et figés pour la période sélectionnée.</span>
        </div>
      )}

      {calculatedPayslips.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Résultats du Calcul ({calculatedPayslips.length} Employés)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b">
                <tr>
                  <th className="py-3.5 px-4">N° Bulletin</th>
                  <th className="py-3.5 px-4">Employé</th>
                  <th className="py-3.5 px-4">Salaire de Base</th>
                  <th className="py-3.5 px-4">Gains & Primes</th>
                  <th className="py-3.5 px-4">Retenues</th>
                  <th className="py-3.5 px-4">Net à Payer</th>
                  <th className="py-3.5 px-4 text-right">Imprimer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {calculatedPayslips.map(ps => (
                  <tr key={ps.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600">{ps.payslip_number}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{ps.employee_name}</td>
                    <td className="py-3.5 px-4 font-mono">{formatFCFA(ps.base_salary)}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">+{formatFCFA(ps.total_earnings - ps.base_salary)}</td>
                    <td className="py-3.5 px-4 font-mono text-rose-600 font-bold">-{formatFCFA(ps.total_deductions)}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-600 text-sm">{formatFCFA(ps.net_salary)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => pdfExportService.printPayslip(ps, currentSchool)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimer</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
