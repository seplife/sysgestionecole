import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Award, FileText, AlertTriangle, Calendar, TrendingUp, DollarSign, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { payrollService } from '../../services/payrollService';
import { Employee, EmployeeContract, EmployeeAttendance } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

interface HRDashboardProps {
  onNavigateSubModule?: (subModule: string) => void;
}

export const HRDashboardModule: React.FC<HRDashboardProps> = ({ onNavigateSubModule }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [attendance, setAttendance] = useState<EmployeeAttendance[]>([]);

  useEffect(() => {
    hrService.fetchEmployees().then(setEmployees);
    hrService.fetchContracts().then(setContracts);
    const today = new Date().toISOString().substring(0, 10);
    hrService.fetchEmployeeAttendance(today).then(setAttendance);
  }, []);

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.employment_status === 'actif').length;
  const teachersCount = employees.filter(e => e.employee_type === 'enseignant' || e.employee_type === 'permanent').length;
  const adminCount = employees.filter(e => e.employee_type === 'admin').length;

  // Contracts expiring in 30 or 60 days
  const now = new Date();
  const expiringContracts = contracts.filter(c => {
    if (!c.end_date || c.status !== 'actif') return false;
    const end = new Date(c.end_date);
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 60;
  });

  const totalMonthlyPayroll = employees
    .filter(e => e.employment_status === 'actif')
    .reduce((sum, e) => sum + (e.base_salary || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-500" />
            <span>Tableau de Bord Ressources Humaines</span>
          </h1>
          <p className="text-xs text-slate-400">Gestion du personnel, contrats, effectifs et suivi de la masse salariale</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Multi-Tenant Isolé</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Effectif Total</span>
            <div className="p-2.5 bg-brand-50 dark:bg-brand-950 rounded-xl text-brand-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{totalEmployees}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> {activeEmployees} Employés Actifs
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enseignants & Pédagogie</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 rounded-xl text-blue-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{teachersCount}</div>
          <div className="text-xs text-slate-500 mt-1">{adminCount} Personnel Administratif</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contrats à Renouveler</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950 rounded-xl text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{expiringContracts.length}</div>
          <div className="text-xs text-amber-700 font-medium mt-1">Échéance &lt; 60 jours</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Masse Salariale Base</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 rounded-xl text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{formatFCFA(totalMonthlyPayroll)}</div>
          <div className="text-xs text-slate-500 mt-1">Mensuelle hors primes</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Contrats arrivant à expiration */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Alertes Échéances Contrats ({expiringContracts.length})</span>
            </h3>

            {expiringContracts.length > 0 ? (
              <div className="space-y-2">
                {expiringContracts.map(c => (
                  <div key={c.id} className="p-3 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>{c.employee_name}</span>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px]">{c.contract_type}</span>
                    </div>
                    <div className="text-slate-500 flex justify-between">
                      <span>Fin de contrat:</span>
                      <span className="font-mono font-bold text-amber-700">{c.end_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucun contrat n'arrive à expiration dans les 60 prochains jours.</p>
            )}
          </div>
        </div>

        {/* Right Column: Employees Quick List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Répertoire du Personnel</h3>
            {onNavigateSubModule && (
              <button
                onClick={() => onNavigateSubModule('employees')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>Voir tout</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Matricule</th>
                  <th className="py-3 px-4">Nom & Prénom</th>
                  <th className="py-3 px-4">Poste / Fonction</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Salaire de Base</th>
                  <th className="py-3 px-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.slice(0, 5).map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">{emp.employee_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{emp.last_name} {emp.first_name}</td>
                    <td className="py-3 px-4">{emp.position_name || emp.employee_type}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md font-semibold text-[10px]">{emp.contract_type}</span></td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{formatFCFA(emp.base_salary)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.employment_status === 'actif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {emp.employment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
