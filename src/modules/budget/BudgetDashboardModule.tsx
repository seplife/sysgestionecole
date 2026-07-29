import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, DollarSign, AlertCircle, Layers, ArrowRight } from 'lucide-react';
import { budgetService } from '../../services/budgetService';
import { Budget, Expense, Revenue, CostCenter } from '../../types';
import { calculateBudgetExecution, calculateFinancialBalance } from '../../utils/budgetCalculations';
import { formatFCFA } from '../../utils/payrollCalculations';

interface BudgetDashboardProps {
  onNavigateSubModule?: (subModule: string) => void;
}

export const BudgetDashboardModule: React.FC<BudgetDashboardProps> = ({ onNavigateSubModule }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [b, e, r, cc] = await Promise.all([
          budgetService.fetchBudgets(),
          budgetService.fetchExpenses(),
          budgetService.fetchRevenues(),
          budgetService.fetchCostCenters(),
        ]);
        setBudgets(b);
        setExpenses(e);
        setRevenues(r);
        setCostCenters(cc);
      } catch (err) {
        console.error('[BudgetDashboard] fetch error:', err);
      }
    };
    fetchData();
  }, []);

  // ── KPI calculations ──
  const totalPlanned = budgets.reduce((sum, b) => sum + b.total_planned, 0);
  const totalConsumed = budgets.reduce((sum, b) => sum + b.total_consumed, 0);
  const executionSummary = calculateBudgetExecution(totalPlanned, totalConsumed);
  const balanceSummary = calculateFinancialBalance(expenses, revenues);

  // ── Top 5 dépenses récentes ──
  const topExpenses = [...expenses]
    .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
    .slice(0, 5);

  // ── Budgets en alerte (>= 90%) ──
  const budgetsWithAlert = budgets
    .map(b => {
      const exec = calculateBudgetExecution(b.total_planned, b.total_consumed, b.total_committed);
      return { ...b, rate: exec.executionRate };
    })
    .filter(b => b.rate >= 90);

  // ── Donut chart data ──
  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const costCenterTotals = costCenters.map(cc => {
    const ccBudgets = budgets.filter(b => b.cost_center_id === cc.id);
    const total = ccBudgets.reduce((sum, b) => sum + b.total_planned, 0);
    return { name: cc.name, total };
  }).filter(cc => cc.total > 0);

  const totalBudget = costCenterTotals.reduce((sum, cc) => sum + cc.total, 0);
  let currentAngle = 0;
  const donutGradients = costCenterTotals.map((cc, i) => {
    const percentage = totalBudget > 0 ? (cc.total / totalBudget) * 100 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + percentage;
    currentAngle = endAngle;
    return `${colors[i % colors.length]} ${startAngle}% ${endAngle}%`;
  }).join(', ');
  const conicGradient = donutGradients ? `conic-gradient(${donutGradients})` : 'conic-gradient(#e2e8f0 0% 100%)';

  // ── Status badge helper ──
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      brouillon: 'bg-slate-100 text-slate-600 border-slate-200',
      soumis: 'bg-blue-50 text-blue-700 border-blue-200',
      approuve: 'bg-amber-50 text-amber-700 border-amber-200',
      paye: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejete: 'bg-rose-50 text-rose-700 border-rose-200',
      annule: 'bg-slate-100 text-slate-500 border-slate-200',
    };
    const labels: Record<string, string> = {
      brouillon: 'Brouillon', soumis: 'Soumis', approuve: 'Approuvé',
      paye: 'Payé', rejete: 'Rejeté', annule: 'Annulé',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-7 h-7 text-brand-500" />
            <span>Tableau de Bord Financier & Budget</span>
          </h1>
          <p className="text-xs text-slate-400">Suivi des budgets, taux d'exécution, recettes et dépenses</p>
        </div>
      </div>

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget prévu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Budget Annuel Prévu</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{formatFCFA(totalPlanned)}</div>
          <div className="text-xs text-slate-500 mt-1">Tous centres de coûts confondus</div>
        </div>

        {/* Dépenses */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => onNavigateSubModule?.('expenses')}
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dépenses Consommées</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{formatFCFA(totalConsumed)}</div>
          <div className="text-xs text-rose-700 font-semibold mt-1 flex items-center gap-1">
            Reste: {formatFCFA(executionSummary.remainingBudget)}
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Taux d'exécution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taux d'Exécution</span>
          <div className={`text-2xl font-extrabold mt-1 ${
            executionSummary.alertLevel === 'exceeded_100' ? 'text-rose-600' :
            executionSummary.alertLevel === 'danger_90' ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {executionSummary.executionRate} %
          </div>
          <div className="text-xs font-bold mt-1 text-slate-500">{executionSummary.statusLabel}</div>
        </div>

        {/* Solde trésorerie */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => onNavigateSubModule?.('revenues')}
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Solde Trésorerie</span>
          <div className={`text-2xl font-extrabold mt-1 ${balanceSummary.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatFCFA(balanceSummary.balance)}
          </div>
          <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${balanceSummary.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
            {balanceSummary.isPositive ? '✓ Solde Positif' : '⚠ Solde Négatif'}
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══ Top 5 dépenses récentes ═══ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-rose-500" />
              Top 5 Dépenses Récentes
            </h3>
            <button
              onClick={() => onNavigateSubModule?.('expenses')}
              className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {topExpenses.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Fournisseur</th>
                  <th className="py-2 px-2">Montant</th>
                  <th className="py-2 px-2">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-2 font-mono">{e.expense_date}</td>
                    <td className="py-2.5 px-2 font-semibold text-slate-900 dark:text-white">{e.supplier_name || 'N/A'}</td>
                    <td className="py-2.5 px-2 font-extrabold text-rose-600">{formatFCFA(e.amount)}</td>
                    <td className="py-2.5 px-2">{getStatusBadge(e.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Aucune dépense enregistrée.</p>
          )}
        </div>

        {/* ═══ Alertes Budgétaires ═══ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            Alertes Budgétaires (≥ 90%)
          </h3>
          {budgetsWithAlert.length > 0 ? (
            <div className="space-y-3">
              {budgetsWithAlert.map(b => (
                <div key={b.id} className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-rose-800 dark:text-rose-200 text-sm">{b.title}</span>
                    <span className="text-rose-600 font-extrabold text-sm">{b.rate}%</span>
                  </div>
                  <div className="w-full bg-rose-200 dark:bg-rose-800 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(b.rate, 100)}%` }} />
                  </div>
                  <div className="text-xs text-rose-600 mt-1">
                    {formatFCFA(b.total_consumed)} / {formatFCFA(b.total_planned)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">✓ Aucune alerte budgétaire. Tous les budgets sont conformes.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══ Donut Chart — Répartition par centre de coûts ═══ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-brand-500" />
            Répartition par Centre de Coûts
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-40 h-40 rounded-full flex items-center justify-center" style={{ background: conicGradient }}>
              <div className="absolute inset-0 m-8 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{formatFCFA(totalBudget)}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {costCenterTotals.map((cc, i) => (
                <div key={cc.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span className="flex-1 text-slate-700 dark:text-slate-300">{cc.name}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{totalBudget > 0 ? ((cc.total / totalBudget) * 100).toFixed(1) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ Progression par Centre de Coûts ═══ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-brand-500" />
            Exécution par Centre de Coûts
          </h3>
          <div className="space-y-4">
            {budgets.map(b => {
              const exec = calculateBudgetExecution(b.total_planned, b.total_consumed, b.total_committed);
              return (
                <div key={b.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{b.title}</span>
                      <div className="text-xs text-slate-400 font-medium">{b.cost_center_name}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">{formatFCFA(b.total_consumed)}</span>
                      <span className="text-xs text-slate-400 font-semibold block"> / {formatFCFA(b.total_planned)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        exec.executionRate >= 100 ? 'bg-rose-600' :
                        exec.executionRate >= 90 ? 'bg-amber-500' :
                        exec.executionRate >= 50 ? 'bg-brand-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, exec.executionRate)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500">
                      Reste: <strong className="text-slate-800 dark:text-slate-200">{formatFCFA(exec.remainingBudget)}</strong>
                      {b.total_committed > 0 && <span className="ml-2 text-amber-600">Engagé: {formatFCFA(b.total_committed)}</span>}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      exec.alertLevel === 'exceeded_100' ? 'bg-rose-100 text-rose-700' :
                      exec.alertLevel === 'danger_90' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {exec.executionRate}% ({exec.statusLabel})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
