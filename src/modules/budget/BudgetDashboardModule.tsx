import React, { useState, useEffect } from 'react';
import { DollarSign, PieChart, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
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
    budgetService.fetchBudgets().then(setBudgets);
    budgetService.fetchExpenses().then(setExpenses);
    budgetService.fetchRevenues().then(setRevenues);
    budgetService.fetchCostCenters().then(setCostCenters);
  }, []);

  const totalPlanned = budgets.reduce((sum, b) => sum + b.total_planned, 0);
  const totalConsumed = budgets.reduce((sum, b) => sum + b.total_consumed, 0);
  const executionSummary = calculateBudgetExecution(totalPlanned, totalConsumed);
  const balanceSummary = calculateFinancialBalance(expenses, revenues);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-7 h-7 text-brand-500" />
            <span>Tableau de Bord Financier & Budget</span>
          </h1>
          <p className="text-xs text-slate-400">Suivi des budgets prévisionnels, taux d'exécution par centre de coûts, recettes et dépenses</p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Budget Annuel Prévu</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{formatFCFA(totalPlanned)}</div>
          <div className="text-xs text-slate-500 mt-1">Tous centres de coûts confondus</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dépenses Consommées</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{formatFCFA(totalConsumed)}</div>
          <div className="text-xs text-rose-700 font-semibold mt-1">Reste: {formatFCFA(executionSummary.remainingBudget)}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taux d'Exécution Global</span>
          <div className={`text-2xl font-extrabold mt-1 ${
            executionSummary.alertLevel === 'exceeded_100' ? 'text-rose-600' :
            executionSummary.alertLevel === 'danger_90' ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {executionSummary.executionRate} %
          </div>
          <div className="text-xs font-bold mt-1 text-slate-500">{executionSummary.statusLabel}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Solde Trésorerie (Recettes - Dépenses)</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{formatFCFA(balanceSummary.balance)}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">Solde Positif</div>
        </div>
      </div>

      {/* Budget per Cost Center Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-500" />
          <span>Exécution du Budget par Centre de Coûts</span>
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

                {/* Progress Bar */}
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
                  <span className="text-slate-500">Reste disponible: <strong className="text-slate-800 dark:text-slate-200">{formatFCFA(exec.remainingBudget)}</strong></span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    exec.alertLevel === 'exceeded_100' ? 'bg-rose-100 text-rose-700' :
                    exec.alertLevel === 'danger_90' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {exec.executionRate}% Exécuté ({exec.statusLabel})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
