import { useState, useEffect } from 'react';
import { Layers, Plus, Edit2 } from 'lucide-react';
import { budgetService } from '../../services/budgetService';
import { CostCenter } from '../../types';

export const CostCentersModule: React.FC = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

  useEffect(() => {
    budgetService.fetchCostCenters().then(setCostCenters);
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-7 h-7 text-brand-500" />
          <span>Centres de Coûts & Découpage Financier</span>
        </h1>
        <p className="text-xs text-slate-400">Axes analytiques de gestion du budget (Masse Salariale, Pédagogie, Infrastructure, Administration)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {costCenters.map(cc => (
          <div key={cc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{cc.name}</h3>
                <span className="font-mono text-xs font-bold text-brand-600">Code: {cc.code}</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full">Actif</span>
            </div>
            <p className="text-xs text-slate-500">{cc.description}</p>
            <div className="pt-2 border-t text-xs font-semibold text-slate-400">Responsable: <span className="text-slate-800 dark:text-slate-200">{cc.manager_name}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};
