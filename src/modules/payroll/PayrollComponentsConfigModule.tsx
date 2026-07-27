import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { PayrollComponent } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

export const PayrollComponentsConfigModule: React.FC = () => {
  const [components, setComponents] = useState<PayrollComponent[]>([]);

  useEffect(() => {
    payrollService.fetchPayrollComponents().then(setComponents);
  }, []);

  const gains = components.filter(c => c.category === 'gain');
  const retenues = components.filter(c => c.category === 'retenue');

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-brand-500" />
          <span>Configuration des Composants de Paie</span>
        </h1>
        <p className="text-xs text-slate-400">Paramétrage des primes, indemnités, heures supplémentaires et cotisations légales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gains */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base text-emerald-600 border-b pb-2">Gains & Primes ({gains.length})</h3>
          <div className="space-y-2">
            {gains.map(g => (
              <div key={g.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{g.name} <span className="font-mono text-brand-600 text-[10px]">({g.code})</span></div>
                  <div className="text-slate-400 text-[10px] capitalize">Méthode: {g.calculation_method}</div>
                </div>
                <div className="font-mono font-extrabold text-emerald-600">
                  {g.default_amount > 0 ? formatFCFA(g.default_amount) : g.default_rate ? `${(g.default_rate * 100).toFixed(1)}%` : 'Variable'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retenues */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base text-rose-600 border-b pb-2">Retenues & Cotisations Sociales ({retenues.length})</h3>
          <div className="space-y-2">
            {retenues.map(r => (
              <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{r.name} <span className="font-mono text-brand-600 text-[10px]">({r.code})</span></div>
                  <div className="text-slate-400 text-[10px] capitalize">Méthode: {r.calculation_method}</div>
                </div>
                <div className="font-mono font-extrabold text-rose-600">
                  {r.default_rate ? `${(r.default_rate * 100).toFixed(1)}%` : r.default_amount > 0 ? formatFCFA(r.default_amount) : 'Variable'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
