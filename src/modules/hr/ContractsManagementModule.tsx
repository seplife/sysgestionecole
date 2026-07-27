import { useState, useEffect } from 'react';
import { FileText, Plus, AlertTriangle, CheckCircle, Clock, Calendar, Search } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { EmployeeContract } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

export const ContractsManagementModule: React.FC = () => {
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'actif' | 'expiring' | 'expired'>('all');

  useEffect(() => {
    hrService.fetchContracts().then(setContracts);
  }, []);

  const now = new Date();
  const expiringList = contracts.filter(c => {
    if (!c.end_date || c.status !== 'actif') return false;
    const diffDays = Math.ceil((new Date(c.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 60;
  });

  const expiredList = contracts.filter(c => {
    if (!c.end_date) return false;
    return new Date(c.end_date).getTime() < now.getTime();
  });

  const displayedContracts = contracts.filter(c => {
    if (activeTab === 'actif') return c.status === 'actif';
    if (activeTab === 'expiring') return expiringList.some(e => e.id === c.id);
    if (activeTab === 'expired') return expiredList.some(e => e.id === c.id);
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-500" />
            <span>Gestion des Contrats de Travail ({contracts.length})</span>
          </h1>
          <p className="text-xs text-slate-400">Suivi des CDI, CDD, vacataires, alertes de renouvellement et fin de contrat</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
          <button onClick={() => setActiveTab('all')} className={`px-3 py-1.5 rounded-lg ${activeTab === 'all' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-xs' : 'text-slate-500'}`}>Tous ({contracts.length})</button>
          <button onClick={() => setActiveTab('actif')} className={`px-3 py-1.5 rounded-lg ${activeTab === 'actif' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-xs' : 'text-slate-500'}`}>Actifs</button>
          <button onClick={() => setActiveTab('expiring')} className={`px-3 py-1.5 rounded-lg ${activeTab === 'expiring' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-600'}`}>À Renouveler ({expiringList.length})</button>
          <button onClick={() => setActiveTab('expired')} className={`px-3 py-1.5 rounded-lg ${activeTab === 'expired' ? 'bg-rose-500 text-white shadow-xs' : 'text-rose-600'}`}>Expirés ({expiredList.length})</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b">
            <tr>
              <th className="py-3.5 px-4">N° Contrat</th>
              <th className="py-3.5 px-4">Employé</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Date Début</th>
              <th className="py-3.5 px-4">Date Fin</th>
              <th className="py-3.5 px-4">Salaire Contractuel</th>
              <th className="py-3.5 px-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayedContracts.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-mono font-bold text-brand-600">{c.contract_number}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{c.employee_name}</td>
                <td className="py-3.5 px-4"><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-md">{c.contract_type}</span></td>
                <td className="py-3.5 px-4">{c.start_date}</td>
                <td className="py-3.5 px-4 font-mono">{c.end_date || 'Indéterminée (CDI)'}</td>
                <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">{formatFCFA(c.contractual_salary)}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === 'actif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {c.status}
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
