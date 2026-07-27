import { supabase } from '../lib/supabase';
import { getLocalCache, setLocalCache } from './supabaseService';
import { BudgetPeriod, CostCenter, BudgetCategory, Budget, BudgetLine, Expense, Revenue } from '../types';

const initialBudgetPeriods: BudgetPeriod[] = [
  { id: 'bp-2025-2026', school_id: 'school-palmeraie-01', name: 'Budget Exercice 2025-2026', start_date: '2025-09-01', end_date: '2026-08-31', status: 'valide' }
];

const initialCostCenters: CostCenter[] = [
  { id: 'cc-01', school_id: 'school-palmeraie-01', code: 'PERS', name: 'Masse Salariale & RH', description: 'Salaires, primes, charges sociales et formations du personnel', manager_name: 'Directeur RH', is_active: true },
  { id: 'cc-02', school_id: 'school-palmeraie-01', code: 'PEDAG', name: 'Pédagogie & Examens', description: 'Matériel didactique, impressions examens blanc BEPC/BAC', manager_name: 'Censeur Général', is_active: true },
  { id: 'cc-03', school_id: 'school-palmeraie-01', code: 'INFRA', name: 'Infrastructure & Logistique', description: 'Eau, électricité, internet, entretien et travaux', manager_name: 'Intendant', is_active: true },
  { id: 'cc-04', school_id: 'school-palmeraie-01', code: 'ADMIN', name: 'Administration Général', description: 'Fournitures de bureau, télécom, frais juridiques', manager_name: 'Secrétaire Général', is_active: true }
];

const initialBudgetCategories: BudgetCategory[] = [
  { id: 'cat-dep-01', school_id: 'school-palmeraie-01', type: 'depense', code: 'SALAIRES', name: 'Salaires & Emoluments' },
  { id: 'cat-dep-02', school_id: 'school-palmeraie-01', type: 'depense', code: 'FOURNITURES', name: 'Fournitures & consommables' },
  { id: 'cat-dep-03', school_id: 'school-palmeraie-01', type: 'depense', code: 'ENERGIE', name: 'Eau & Électricité (CIE / SODECI)' },
  { id: 'cat-rec-01', school_id: 'school-palmeraie-01', type: 'recette', code: 'SCOLARITE', name: 'Frais de Scolarité Écoles' },
  { id: 'cat-rec-02', school_id: 'school-palmeraie-01', type: 'recette', code: 'CANTINE', name: 'Recettes Cantine & Transport' }
];

const initialBudgets: Budget[] = [
  {
    id: 'bdg-001',
    school_id: 'school-palmeraie-01',
    budget_period_id: 'bp-2025-2026',
    cost_center_id: 'cc-01',
    cost_center_name: 'Masse Salariale & RH',
    title: 'Budget Masse Salariale Annuelle',
    total_planned: 45000000,
    total_committed: 0,
    total_consumed: 32500000
  },
  {
    id: 'bdg-002',
    school_id: 'school-palmeraie-01',
    budget_period_id: 'bp-2025-2026',
    cost_center_id: 'cc-02',
    cost_center_name: 'Pédagogie & Examens',
    title: 'Budget Fonctionnement Pédagogique',
    total_planned: 8000000,
    total_committed: 500000,
    total_consumed: 5400000
  },
  {
    id: 'bdg-003',
    school_id: 'school-palmeraie-01',
    budget_period_id: 'bp-2025-2026',
    cost_center_id: 'cc-03',
    cost_center_name: 'Infrastructure & Logistique',
    title: 'Budget Entretien & Fluides',
    total_planned: 12000000,
    total_committed: 1000000,
    total_consumed: 11200000
  }
];

const initialExpenses: Expense[] = [
  {
    id: 'exp-101',
    school_id: 'school-palmeraie-01',
    expense_number: 'DEP-2026-0042',
    cost_center_name: 'Infrastructure & Logistique',
    supplier_name: 'CIE (Compagnie Ivoirienne d\'Électricité)',
    description: 'Facture d\'électricité Période Juin-Juillet 2026',
    amount: 680000,
    expense_date: '2026-07-15',
    payment_method: 'virement',
    status: 'paye'
  },
  {
    id: 'exp-102',
    school_id: 'school-palmeraie-01',
    expense_number: 'DEP-2026-0043',
    cost_center_name: 'Pédagogie & Examens',
    supplier_name: 'Imprimerie Moderne Abidjan',
    description: 'Impression des sujets d\'examen blanc BAC/BEPC',
    amount: 450000,
    expense_date: '2026-07-20',
    payment_method: 'cheque',
    status: 'paye'
  }
];

const initialRevenues: Revenue[] = [
  {
    id: 'rev-201',
    school_id: 'school-palmeraie-01',
    revenue_number: 'REC-2026-0012',
    source_name: 'Encaissement Scolarités Vague 1',
    description: 'Paiements Mobile Money de scolarité élèves',
    amount: 42800000,
    revenue_date: '2026-07-25',
    payment_method: 'mobile_money',
    status: 'encaisse'
  }
];

export const budgetService = {
  // 1. Budget Periods
  async fetchBudgetPeriods(): Promise<BudgetPeriod[]> {
    return getLocalCache('budget_periods', initialBudgetPeriods);
  },

  // 2. Cost Centers
  async fetchCostCenters(): Promise<CostCenter[]> {
    return getLocalCache('budget_cost_centers', initialCostCenters);
  },

  async saveCostCenter(cc: Partial<CostCenter>): Promise<CostCenter[]> {
    const current = await this.fetchCostCenters();
    const updated = [cc as CostCenter, ...current.filter(c => c.id !== cc.id)];
    setLocalCache('budget_cost_centers', updated);
    try { await supabase.from('cost_centers').upsert(cc); } catch (e) {}
    return updated;
  },

  // 3. Budgets
  async fetchBudgets(): Promise<Budget[]> {
    return getLocalCache('budget_budgets', initialBudgets);
  },

  async saveBudget(budget: Partial<Budget>): Promise<Budget[]> {
    const current = await this.fetchBudgets();
    const updated = [budget as Budget, ...current.filter(b => b.id !== budget.id)];
    setLocalCache('budget_budgets', updated);
    try { await supabase.from('budgets').upsert(budget); } catch (e) {}
    return updated;
  },

  // 4. Expenses
  async fetchExpenses(): Promise<Expense[]> {
    return getLocalCache('budget_expenses', initialExpenses);
  },

  async saveExpense(expense: Partial<Expense>): Promise<Expense[]> {
    const current = await this.fetchExpenses();
    const updated = [expense as Expense, ...current.filter(e => e.id !== expense.id)];
    setLocalCache('budget_expenses', updated);
    try { await supabase.from('expenses').upsert(expense); } catch (e) {}
    return updated;
  },

  // 5. Revenues
  async fetchRevenues(): Promise<Revenue[]> {
    return getLocalCache('budget_revenues', initialRevenues);
  },

  async saveRevenue(revenue: Partial<Revenue>): Promise<Revenue[]> {
    const current = await this.fetchRevenues();
    const updated = [revenue as Revenue, ...current.filter(r => r.id !== revenue.id)];
    setLocalCache('budget_revenues', updated);
    try { await supabase.from('revenues').upsert(revenue); } catch (e) {}
    return updated;
  }
};
