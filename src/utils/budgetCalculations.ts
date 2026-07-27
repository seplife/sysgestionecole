import { Budget, BudgetLine, Expense, Revenue } from '../types';

export interface BudgetExecutionSummary {
  totalPlanned: number;
  totalCommitted: number;
  totalConsumed: number;
  remainingBudget: number;
  executionRate: number; // Taux en %
  alertLevel: 'normal' | 'warning_50' | 'warning_75' | 'danger_90' | 'exceeded_100';
  statusLabel: string;
}

/**
 * Calcule l'exécution d'un budget ou d'une ligne budgétaire
 */
export const calculateBudgetExecution = (planned: number, consumed: number, committed: number = 0): BudgetExecutionSummary => {
  const safePlanned = Math.max(0, planned || 0);
  const safeConsumed = Math.max(0, consumed || 0);
  const safeCommitted = Math.max(0, committed || 0);
  
  const totalEngaged = safeConsumed + safeCommitted;
  const remaining = safePlanned - safeConsumed;
  const rate = safePlanned > 0 ? (safeConsumed / safePlanned) * 100 : 0;

  let alertLevel: BudgetExecutionSummary['alertLevel'] = 'normal';
  let statusLabel = 'Conforme';

  if (rate >= 100) {
    alertLevel = 'exceeded_100';
    statusLabel = 'Budget Dépassé (100%+)';
  } else if (rate >= 90) {
    alertLevel = 'danger_90';
    statusLabel = 'Alerte Critique (≥90%)';
  } else if (rate >= 75) {
    alertLevel = 'warning_75';
    statusLabel = 'Attention (≥75%)';
  } else if (rate >= 50) {
    alertLevel = 'warning_50';
    statusLabel = 'Modéré (≥50%)';
  }

  return {
    totalPlanned: safePlanned,
    totalCommitted: safeCommitted,
    totalConsumed: safeConsumed,
    remainingBudget: remaining,
    executionRate: Math.round(rate * 10) / 10,
    alertLevel,
    statusLabel
  };
};

/**
 * Calcule la balance globale (RecettesTotales - DépensesTotales)
 */
export const calculateFinancialBalance = (expenses: Expense[], revenues: Revenue[]) => {
  const totalRevenues = revenues
    .filter(r => r.status === 'encaisse')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const totalExpenses = expenses
    .filter(e => e.status === 'paye' || e.status === 'approuve')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const balance = totalRevenues - totalExpenses;

  return {
    totalRevenues,
    totalExpenses,
    balance,
    isPositive: balance >= 0
  };
};
