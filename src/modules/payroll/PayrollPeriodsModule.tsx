import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, Lock, Play } from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { PayrollPeriod } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

interface PayrollPeriodsProps {
  onSelectPeriod?: (period: PayrollPeriod) => void;
}

export const PayrollPeriodsModule: React.FC<PayrollPeriodsProps> = ({ onSelectPeriod }) => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newPeriod, setNewPeriod] = useState({
    name: 'Septembre 2026',
    period_code: '2026-09',
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    payment_due_date: '2026-09-30'
  });

  useEffect(() => {
    payrollService.fetchPayrollPeriods().then(setPeriods);
  }, []);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    const created: PayrollPeriod = {
      id: `per-${newPeriod.period_code}`,
      school_id: 'school-palmeraie-01',
      name: newPeriod.name,
      period_code: newPeriod.period_code,
      start_date: newPeriod.start_date,
      end_date: newPeriod.end_date,
      payment_due_date: newPeriod.payment_due_date,
      status: 'brouillon',
      total_gross: 0,
      total_deductions: 0,
      total_net: 0,
      employee_count: 0,
      created_at: new Date().toISOString()
    };

    const updated = await payrollService.savePayrollPeriod(created);
    setPeriods(updated);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-brand-500" />
            <span>Périodes de Paie Mensuelles</span>
          </h1>
          <p className="text-xs text-slate-400">Ouverture des mois de paie, suivi des statuts (brouillon, calculé, clôturé)</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ouvrir une Nouvelle Période de Paie</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {periods.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{p.name}</h3>
                <span className="font-mono text-xs text-slate-400 font-bold">{p.period_code}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                p.status === 'payee' || p.status === 'cloturee' ? 'bg-slate-100 text-slate-700' :
                p.status === 'calculee' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {p.status}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Masse Salariale Brute:</span> <span className="font-extrabold">{formatFCFA(p.total_gross)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Masse Salariale Nette:</span> <span className="font-extrabold text-emerald-600">{formatFCFA(p.total_net)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Nombre d'Employés:</span> <span className="font-bold">{p.employee_count}</span></div>
            </div>

            {onSelectPeriod && (
              <button
                onClick={() => onSelectPeriod(p)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs shadow-xs flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 text-brand-400" />
                <span>Préparer & Calculer la Paie</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
