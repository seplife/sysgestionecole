import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { Department, Position } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

export const OrganizationSetupModule: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    hrService.fetchDepartments().then(setDepartments);
    hrService.fetchPositions().then(setPositions);
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-7 h-7 text-brand-500" />
          <span>Structure Organisationnelle</span>
        </h1>
        <p className="text-xs text-slate-400">Configuration des départements, services et fiches de postes de l'établissement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Départements */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Départements ({departments.length})</h3>
          </div>
          <div className="space-y-2">
            {departments.map(d => (
              <div key={d.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{d.name} <span className="font-mono text-brand-600 text-[10px]">({d.code})</span></div>
                  <div className="text-slate-500 text-[11px]">{d.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Postes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Postes & Grilles Indicatives ({positions.length})</h3>
          </div>
          <div className="space-y-2">
            {positions.map(p => (
              <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{p.title}</div>
                  <div className="text-slate-400 text-[10px]">{p.category}</div>
                </div>
                <div className="text-right font-mono font-bold text-brand-600">
                  {formatFCFA(p.base_salary_min || 0)} - {formatFCFA(p.base_salary_max || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
