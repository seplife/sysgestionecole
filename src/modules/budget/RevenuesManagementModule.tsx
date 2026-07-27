import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, CheckCircle2, DollarSign } from 'lucide-react';
import { budgetService } from '../../services/budgetService';
import { Revenue } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

export const RevenuesManagementModule: React.FC = () => {
  const [revenues, setRevenues] = useState<Revenue[]>([]);

  useEffect(() => {
    budgetService.fetchRevenues().then(setRevenues);
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-emerald-500" />
          <span>Gestion des Recettes & Rentrées d'Argent</span>
        </h1>
        <p className="text-xs text-slate-400">Encaissement des scolarités, vente de tenues scolaires, cantine, transport et subventions</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b">
            <tr>
              <th className="py-3.5 px-4">N° Recette</th>
              <th className="py-3.5 px-4">Source / Origami</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Montant (FCFA)</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Moyen de Paiement</th>
              <th className="py-3.5 px-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {revenues.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-mono font-bold text-brand-600">{r.revenue_number}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{r.source_name}</td>
                <td className="py-3.5 px-4">{r.description}</td>
                <td className="py-3.5 px-4 font-extrabold text-emerald-600 text-sm">{formatFCFA(r.amount)}</td>
                <td className="py-3.5 px-4 font-mono">{r.revenue_date}</td>
                <td className="py-3.5 px-4 capitalize font-semibold">{r.payment_method}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Encaissé
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
