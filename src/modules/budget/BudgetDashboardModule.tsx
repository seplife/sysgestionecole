import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  PiggyBank, 
  Receipt, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { formatFCFA } from '../../utils/payrollCalculations';
import { calculateBudgetExecution, calculateFinancialBalance } from '../../utils/budgetCalculations';
import budgetService from '../../services/budgetService';
import { Budget, Expense, Revenue, CostCenter } from '../../types';

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
        const [fetchedBudgets, fetchedExpenses, fetchedRevenues, fetchedCostCenters] = await Promise.all([
          budgetService.fetchBudgets('current-school'),
          budgetService.fetchExpenses('current-school'),
          budgetService.fetchRevenues('current-school'),
          budgetService.fetchCostCenters('current-school')
        ]);
        setBudgets(fetchedBudgets);
        setExpenses(fetchedExpenses);
        setRevenues(fetchedRevenues);
        setCostCenters(fetchedCostCenters);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenues = revenues.reduce((sum, r) => sum + r.amount, 0);
  
  const balanceSummary = calculateFinancialBalance(totalRevenues, totalExpenses) || {
    balance: totalRevenues - totalExpenses,
    isPositive: (totalRevenues - totalExpenses) >= 0
  };

  const topExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const budgetsWithAlert = budgets.map(b => {
    const execution = calculateBudgetExecution(b);
    return { ...b, rate: execution?.rate || (b.consumed_amount / (b.total_planned || 1)) * 100 };
  }).filter(b => b.rate >= 90);

  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const costCenterTotals = costCenters.map(cc => {
    const ccBudgets = budgets.filter(b => b.cost_center_id === cc.id);
    const total = ccBudgets.reduce((sum, b) => sum + b.total_planned, 0);
    return { name: cc.name, total };
  }).filter(cc => cc.total > 0);
  
  const totalBudget = costCenterTotals.reduce((sum, cc) => sum + cc.total, 0);
  let currentAngle = 0;
  const donutGradients = costCenterTotals.map((cc, i) => {
    const percentage = (cc.total / totalBudget) * 100;
    const startAngle = currentAngle;
    const endAngle = currentAngle + percentage;
    currentAngle = endAngle;
    return `${colors[i % colors.length]} ${startAngle}% ${endAngle}%`;
  }).join(', ');
  
  const conicGradient = donutGradients ? `conic-gradient(${donutGradients})` : 'conic-gradient(#e2e8f0 0% 100%)';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateSubModule && onNavigateSubModule('revenues')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Revenus</h3>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatFCFA(totalRevenues)}</p>
        </div>

        <div 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateSubModule && onNavigateSubModule('expenses')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Dépenses</h3>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatFCFA(totalExpenses)}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Solde</h3>
            <div className={`p-2 rounded-xl ${balanceSummary.isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{formatFCFA(balanceSummary.balance)}</p>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${balanceSummary.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {balanceSummary.isPositive ? 'Solde Positif' : 'Solde Négatif'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">Top 5 Dépenses Récentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Fournisseur</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Statut</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {topExpenses.map(expense => (
                  <tr key={expense.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-3">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="p-3">{expense.supplier_name || 'N/A'}</td>
                    <td className="p-3 font-semibold">{formatFCFA(expense.amount)}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${expense.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {expense.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            Alertes Budgétaires (&ge; 90%)
          </h3>
          <div className="space-y-4">
            {budgetsWithAlert.length > 0 ? budgetsWithAlert.map(b => (
              <div key={b.id} className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-rose-800 dark:text-rose-200">{b.title}</span>
                  <span className="text-rose-600 font-bold text-sm">{b.rate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-rose-200 dark:bg-rose-800 rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${Math.min(b.rate, 100)}%` }}></div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500">Aucune alerte budgétaire pour le moment.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSS Donut Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-6">Répartition par Centre de Coût</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-40 h-40 rounded-full flex items-center justify-center" style={{ background: conicGradient }}>
              <div className="absolute inset-0 m-4 bg-white dark:bg-slate-900 rounded-full"></div>
            </div>
            <div className="flex-1 space-y-2">
              {costCenterTotals.map((cc, i) => (
                <div key={cc.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></span>
                  <span className="flex-1 text-slate-700 dark:text-slate-300">{cc.name}</span>
                  <span className="font-bold">{((cc.total / totalBudget) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cost Centers Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">Progression des Centres de Coût</h3>
          <div className="space-y-6">
            {costCenters.map(cc => {
              const ccBudgets = budgets.filter(b => b.cost_center_id === cc.id);
              const planned = ccBudgets.reduce((sum, b) => sum + b.total_planned, 0);
              const consumed = ccBudgets.reduce((sum, b) => sum + b.consumed_amount, 0);
              const committed = ccBudgets.reduce((sum, b) => sum + (b.committed_amount || 0), 0);
              const rate = planned > 0 ? ((consumed + committed) / planned) * 100 : 0;

              return (
                <div key={cc.id} className="space-y-2 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700 dark:text-slate-200">{cc.name}</span>
                    <span className="text-slate-500">{formatFCFA(consumed + committed)} / {formatFCFA(planned)}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${Math.min(rate, 100)}%` }}></div>
                  </div>
                  <div className="text-[10px] text-slate-400 flex gap-2">
                    <span>Engagé: {formatFCFA(committed)}</span>
                    <span>Consommé: {formatFCFA(consumed)}</span>
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
