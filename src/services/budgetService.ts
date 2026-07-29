// ============================================================
// SERVICE BUDGET CENTRALISÉ — IVOIREÉCOLE+
// Source de vérité : Supabase (tables budget_periods, cost_centers,
// budget_categories, budgets, budget_lines, expenses, revenues)
// Fallback : Cache localStorage avec données initiales
// ============================================================

import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { getLocalCache, setLocalCache } from './supabaseService';
import {
  BudgetPeriod,
  CostCenter,
  BudgetCategory,
  Budget,
  BudgetLine,
  Expense,
  Revenue,
  ExpenseStatus,
  RevenueStatus,
} from '../types/budget';

// ─────────────────────────────────────────────────────────────
// DONNÉES INITIALES (SEED) — Utilisées en fallback si Supabase
// ne retourne rien ou n'est pas configuré
// ─────────────────────────────────────────────────────────────

const SCHOOL_ID = '00000000-0000-4000-8000-000000000001';

const initialBudgetPeriods: BudgetPeriod[] = [
  {
    id: 'bp-2025-2026',
    school_id: SCHOOL_ID,
    name: 'Budget Exercice 2025-2026',
    start_date: '2025-09-01',
    end_date: '2026-08-31',
    status: 'valide',
  },
];

const initialCostCenters: CostCenter[] = [
  { id: 'cc-01', school_id: SCHOOL_ID, code: 'PERS', name: 'Masse Salariale & RH', description: 'Salaires, primes, charges sociales et formations du personnel', manager_name: 'Directeur RH', is_active: true },
  { id: 'cc-02', school_id: SCHOOL_ID, code: 'PEDAG', name: 'Pédagogie & Examens', description: 'Matériel didactique, impressions examens blanc BEPC/BAC', manager_name: 'Censeur Général', is_active: true },
  { id: 'cc-03', school_id: SCHOOL_ID, code: 'INFRA', name: 'Infrastructure & Logistique', description: 'Eau, électricité, internet, entretien et travaux', manager_name: 'Intendant', is_active: true },
  { id: 'cc-04', school_id: SCHOOL_ID, code: 'ADMIN', name: 'Administration Générale', description: 'Fournitures de bureau, télécom, frais juridiques', manager_name: 'Secrétaire Général', is_active: true },
];

const initialBudgetCategories: BudgetCategory[] = [
  { id: 'cat-dep-01', school_id: SCHOOL_ID, type: 'depense', code: 'SALAIRES', name: 'Salaires & Émoluments' },
  { id: 'cat-dep-02', school_id: SCHOOL_ID, type: 'depense', code: 'FOURNITURES', name: 'Fournitures & consommables' },
  { id: 'cat-dep-03', school_id: SCHOOL_ID, type: 'depense', code: 'ENERGIE', name: 'Eau & Électricité (CIE / SODECI)' },
  { id: 'cat-dep-04', school_id: SCHOOL_ID, type: 'depense', code: 'ENTRETIEN', name: 'Entretien & Maintenance' },
  { id: 'cat-rec-01', school_id: SCHOOL_ID, type: 'recette', code: 'SCOLARITE', name: 'Frais de Scolarité' },
  { id: 'cat-rec-02', school_id: SCHOOL_ID, type: 'recette', code: 'CANTINE', name: 'Recettes Cantine & Transport' },
  { id: 'cat-rec-03', school_id: SCHOOL_ID, type: 'recette', code: 'SUBVENTION', name: 'Subventions & Dons' },
];

const initialBudgets: Budget[] = [
  {
    id: 'bdg-001',
    school_id: SCHOOL_ID,
    budget_period_id: 'bp-2025-2026',
    cost_center_id: 'cc-01',
    cost_center_name: 'Masse Salariale & RH',
    title: 'Budget Masse Salariale Annuelle',
    total_planned: 45000000,
    total_committed: 0,
    total_consumed: 32500000,
  },
  {
    id: 'bdg-002',
    school_id: SCHOOL_ID,
    budget_period_id: 'bp-2025-2026',
    cost_center_id: 'cc-02',
    cost_center_name: 'Pédagogie & Examens',
    title: 'Budget Fonctionnement Pédagogique',
    total_planned: 8000000,
    total_committed: 500000,
    total_consumed: 5400000,
  },
  {
    id: 'bdg-003',
    school_id: SCHOOL_ID,
    budget_period_id: 'bp-2025-2026',
    cost_center_id: 'cc-03',
    cost_center_name: 'Infrastructure & Logistique',
    title: 'Budget Entretien & Fluides',
    total_planned: 12000000,
    total_committed: 1000000,
    total_consumed: 11200000,
  },
  {
    id: 'bdg-004',
    school_id: SCHOOL_ID,
    budget_period_id: 'bp-2025-2026',
    cost_center_id: 'cc-04',
    cost_center_name: 'Administration Générale',
    title: 'Budget Administration & Fonctionnement',
    total_planned: 5000000,
    total_committed: 200000,
    total_consumed: 2800000,
  },
];

const initialBudgetLines: BudgetLine[] = [
  { id: 'bl-001', school_id: SCHOOL_ID, budget_id: 'bdg-001', category_id: 'cat-dep-01', category_name: 'Salaires & Émoluments', code: 'PERS-SAL-01', label: 'Salaires enseignants permanents', planned_amount: 30000000, committed_amount: 0, consumed_amount: 22000000 },
  { id: 'bl-002', school_id: SCHOOL_ID, budget_id: 'bdg-001', category_id: 'cat-dep-01', category_name: 'Salaires & Émoluments', code: 'PERS-SAL-02', label: 'Salaires personnel administratif', planned_amount: 15000000, committed_amount: 0, consumed_amount: 10500000 },
  { id: 'bl-003', school_id: SCHOOL_ID, budget_id: 'bdg-002', category_id: 'cat-dep-02', category_name: 'Fournitures & consommables', code: 'PEDAG-FOUR-01', label: 'Matériel didactique & pédagogique', planned_amount: 3000000, committed_amount: 200000, consumed_amount: 2100000 },
  { id: 'bl-004', school_id: SCHOOL_ID, budget_id: 'bdg-002', category_id: 'cat-dep-02', category_name: 'Fournitures & consommables', code: 'PEDAG-EXA-01', label: 'Impressions & examens', planned_amount: 5000000, committed_amount: 300000, consumed_amount: 3300000 },
  { id: 'bl-005', school_id: SCHOOL_ID, budget_id: 'bdg-003', category_id: 'cat-dep-03', category_name: 'Eau & Électricité (CIE / SODECI)', code: 'INFRA-NRJ-01', label: 'Factures électricité CIE', planned_amount: 6000000, committed_amount: 500000, consumed_amount: 5200000 },
  { id: 'bl-006', school_id: SCHOOL_ID, budget_id: 'bdg-003', category_id: 'cat-dep-04', category_name: 'Entretien & Maintenance', code: 'INFRA-ENT-01', label: 'Travaux d\'entretien bâtiments', planned_amount: 6000000, committed_amount: 500000, consumed_amount: 6000000 },
];

const initialExpenses: Expense[] = [
  {
    id: 'exp-101',
    school_id: SCHOOL_ID,
    expense_number: 'DEP-2026-0042',
    cost_center_id: 'cc-03',
    cost_center_name: 'Infrastructure & Logistique',
    supplier_name: 'CIE (Compagnie Ivoirienne d\'Électricité)',
    description: 'Facture d\'électricité Période Juin-Juillet 2026',
    amount: 680000,
    expense_date: '2026-07-15',
    payment_method: 'virement',
    receipt_ref: 'CIE-FAC-2026-07',
    status: 'paye',
    created_at: '2026-07-15T08:00:00Z',
  },
  {
    id: 'exp-102',
    school_id: SCHOOL_ID,
    expense_number: 'DEP-2026-0043',
    cost_center_id: 'cc-02',
    cost_center_name: 'Pédagogie & Examens',
    supplier_name: 'Imprimerie Moderne Abidjan',
    description: 'Impression des sujets d\'examen blanc BAC/BEPC',
    amount: 450000,
    expense_date: '2026-07-20',
    payment_method: 'cheque',
    receipt_ref: 'IMA-2026-0089',
    status: 'paye',
    created_at: '2026-07-20T10:30:00Z',
  },
  {
    id: 'exp-103',
    school_id: SCHOOL_ID,
    expense_number: 'DEP-2026-0044',
    cost_center_id: 'cc-04',
    cost_center_name: 'Administration Générale',
    supplier_name: 'Librairie de France Abidjan',
    description: 'Fournitures de bureau (rames papier, cartouches, stylos)',
    amount: 185000,
    expense_date: '2026-07-22',
    payment_method: 'especes',
    receipt_ref: 'LDF-2026-0456',
    status: 'approuve',
    created_at: '2026-07-22T14:00:00Z',
  },
  {
    id: 'exp-104',
    school_id: SCHOOL_ID,
    expense_number: 'DEP-2026-0045',
    cost_center_id: 'cc-03',
    cost_center_name: 'Infrastructure & Logistique',
    supplier_name: 'SODECI',
    description: 'Facture d\'eau trimestre 2 - 2026',
    amount: 320000,
    expense_date: '2026-07-25',
    payment_method: 'virement',
    status: 'soumis',
    created_at: '2026-07-25T09:15:00Z',
  },
  {
    id: 'exp-105',
    school_id: SCHOOL_ID,
    expense_number: 'DEP-2026-0046',
    cost_center_id: 'cc-01',
    cost_center_name: 'Masse Salariale & RH',
    supplier_name: 'Formateur Expert CI',
    description: 'Formation continue enseignants - module pédagogie numérique',
    amount: 750000,
    expense_date: '2026-07-28',
    payment_method: 'virement',
    status: 'brouillon',
    created_at: '2026-07-28T11:00:00Z',
  },
];

const initialRevenues: Revenue[] = [
  {
    id: 'rev-201',
    school_id: SCHOOL_ID,
    revenue_number: 'REC-2026-0012',
    category_id: 'cat-rec-01',
    category_name: 'Frais de Scolarité',
    source_name: 'Encaissement Scolarités — Vague Juillet',
    description: 'Paiements Mobile Money et virement des frais de scolarité élèves',
    amount: 42800000,
    revenue_date: '2026-07-25',
    payment_method: 'mobile_money',
    status: 'encaisse',
    created_at: '2026-07-25T08:00:00Z',
  },
  {
    id: 'rev-202',
    school_id: SCHOOL_ID,
    revenue_number: 'REC-2026-0013',
    category_id: 'cat-rec-02',
    category_name: 'Recettes Cantine & Transport',
    source_name: 'Cantine scolaire — Mois de Juillet',
    description: 'Paiements cantine élèves demi-pensionnaires',
    amount: 3200000,
    revenue_date: '2026-07-20',
    payment_method: 'especes',
    status: 'encaisse',
    created_at: '2026-07-20T12:00:00Z',
  },
  {
    id: 'rev-203',
    school_id: SCHOOL_ID,
    revenue_number: 'REC-2026-0014',
    category_id: 'cat-rec-03',
    category_name: 'Subventions & Dons',
    source_name: 'Don Fondation Didier Drogba',
    description: 'Subvention pour équipements sportifs et terrain',
    amount: 5000000,
    revenue_date: '2026-07-28',
    payment_method: 'virement',
    status: 'en_attente',
    created_at: '2026-07-28T15:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Tente une requête Supabase. Retourne les données si OK,
 * sinon log l'erreur et retourne null → le caller utilise le fallback cache.
 */
async function trySupabase<T>(
  tableName: string,
  query: () => Promise<{ data: T | null; error: any }>
): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await query();
    if (error) {
      console.warn(`[BudgetService] Supabase ${tableName} error:`, error.message);
      return null;
    }
    return data;
  } catch (e: any) {
    console.warn(`[BudgetService] Supabase ${tableName} exception:`, e.message);
    return null;
  }
}

/**
 * Pattern Supabase-first : tente Supabase, sinon fallback sur cache localStorage.
 */
async function fetchFromSupabaseOrCache<T>(
  tableName: string,
  cacheKey: string,
  fallbackData: T[],
  selectQuery: string = '*'
): Promise<T[]> {
  const supabaseData = await trySupabase<T[]>(tableName, () =>
    supabase.from(tableName).select(selectQuery)
  );
  if (supabaseData && supabaseData.length > 0) {
    setLocalCache(cacheKey, supabaseData);
    return supabaseData;
  }
  return getLocalCache(cacheKey, fallbackData);
}

// ─────────────────────────────────────────────────────────────
// SERVICE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export const budgetService = {

  // ═══════════════════════════════════════════════════════════
  // 1. PÉRIODES BUDGÉTAIRES
  // ═══════════════════════════════════════════════════════════

  async fetchBudgetPeriods(): Promise<BudgetPeriod[]> {
    return fetchFromSupabaseOrCache<BudgetPeriod>('budget_periods', 'budget_periods', initialBudgetPeriods);
  },

  async saveBudgetPeriod(bp: Partial<BudgetPeriod>): Promise<BudgetPeriod[]> {
    const current = await this.fetchBudgetPeriods();
    const isNew = !current.find(p => p.id === bp.id);
    const updated = isNew
      ? [bp as BudgetPeriod, ...current]
      : current.map(p => p.id === bp.id ? { ...p, ...bp } : p);
    setLocalCache('budget_periods', updated);
    await trySupabase('budget_periods', () => supabase.from('budget_periods').upsert(bp));
    return updated;
  },

  // ═══════════════════════════════════════════════════════════
  // 2. CENTRES DE COÛTS
  // ═══════════════════════════════════════════════════════════

  async fetchCostCenters(): Promise<CostCenter[]> {
    return fetchFromSupabaseOrCache<CostCenter>('cost_centers', 'budget_cost_centers', initialCostCenters);
  },

  async saveCostCenter(cc: Partial<CostCenter>): Promise<CostCenter[]> {
    const current = await this.fetchCostCenters();
    const isNew = !current.find(c => c.id === cc.id);
    const updated = isNew
      ? [cc as CostCenter, ...current]
      : current.map(c => c.id === cc.id ? { ...c, ...cc } : c);
    setLocalCache('budget_cost_centers', updated);
    await trySupabase('cost_centers', () => supabase.from('cost_centers').upsert(cc));
    return updated;
  },

  async deleteCostCenter(id: string): Promise<CostCenter[]> {
    const current = await this.fetchCostCenters();
    const updated = current.filter(c => c.id !== id);
    setLocalCache('budget_cost_centers', updated);
    await trySupabase('cost_centers', () => supabase.from('cost_centers').delete().eq('id', id));
    return updated;
  },

  // ═══════════════════════════════════════════════════════════
  // 3. CATÉGORIES BUDGÉTAIRES
  // ═══════════════════════════════════════════════════════════

  async fetchBudgetCategories(): Promise<BudgetCategory[]> {
    return fetchFromSupabaseOrCache<BudgetCategory>('budget_categories', 'budget_categories', initialBudgetCategories);
  },

  async saveBudgetCategory(cat: Partial<BudgetCategory>): Promise<BudgetCategory[]> {
    const current = await this.fetchBudgetCategories();
    const isNew = !current.find(c => c.id === cat.id);
    const updated = isNew
      ? [cat as BudgetCategory, ...current]
      : current.map(c => c.id === cat.id ? { ...c, ...cat } : c);
    setLocalCache('budget_categories', updated);
    await trySupabase('budget_categories', () => supabase.from('budget_categories').upsert(cat));
    return updated;
  },

  // ═══════════════════════════════════════════════════════════
  // 4. BUDGETS
  // ═══════════════════════════════════════════════════════════

  async fetchBudgets(): Promise<Budget[]> {
    return fetchFromSupabaseOrCache<Budget>('budgets', 'budget_budgets', initialBudgets);
  },

  async saveBudget(budget: Partial<Budget>): Promise<Budget[]> {
    const current = await this.fetchBudgets();
    const isNew = !current.find(b => b.id === budget.id);
    const updated = isNew
      ? [budget as Budget, ...current]
      : current.map(b => b.id === budget.id ? { ...b, ...budget } : b);
    setLocalCache('budget_budgets', updated);
    // Pour Supabase, exclure cost_center_name (pas une colonne DB) et lines
    const { cost_center_name, lines, ...dbBudget } = budget as Budget;
    await trySupabase('budgets', () => supabase.from('budgets').upsert(dbBudget));
    return updated;
  },

  // ═══════════════════════════════════════════════════════════
  // 5. LIGNES BUDGÉTAIRES
  // ═══════════════════════════════════════════════════════════

  async fetchBudgetLines(): Promise<BudgetLine[]> {
    return fetchFromSupabaseOrCache<BudgetLine>('budget_lines', 'budget_lines', initialBudgetLines);
  },

  async saveBudgetLine(line: Partial<BudgetLine>): Promise<BudgetLine[]> {
    const current = await this.fetchBudgetLines();
    const isNew = !current.find(l => l.id === line.id);
    const updated = isNew
      ? [line as BudgetLine, ...current]
      : current.map(l => l.id === line.id ? { ...l, ...line } : l);
    setLocalCache('budget_lines', updated);
    const { category_name, ...dbLine } = line as BudgetLine;
    await trySupabase('budget_lines', () => supabase.from('budget_lines').upsert(dbLine));
    return updated;
  },

  async deleteBudgetLine(id: string): Promise<BudgetLine[]> {
    const current = await this.fetchBudgetLines();
    const updated = current.filter(l => l.id !== id);
    setLocalCache('budget_lines', updated);
    await trySupabase('budget_lines', () => supabase.from('budget_lines').delete().eq('id', id));
    return updated;
  },

  // ═══════════════════════════════════════════════════════════
  // 6. DÉPENSES
  // ═══════════════════════════════════════════════════════════

  async fetchExpenses(): Promise<Expense[]> {
    return fetchFromSupabaseOrCache<Expense>('expenses', 'budget_expenses', initialExpenses);
  },

  async saveExpense(expense: Partial<Expense>): Promise<Expense[]> {
    const current = await this.fetchExpenses();
    const isNew = !current.find(e => e.id === expense.id);
    const updated = isNew
      ? [expense as Expense, ...current]
      : current.map(e => e.id === expense.id ? { ...e, ...expense } : e);
    setLocalCache('budget_expenses', updated);

    // Mise à jour automatique de total_consumed sur le budget associé
    if (expense.cost_center_id && (expense.status === 'paye' || expense.status === 'approuve')) {
      await this._recalculateBudgetConsumption(expense.cost_center_id);
    }

    const { cost_center_name, budget_line_label, ...dbExpense } = expense as Expense;
    await trySupabase('expenses', () => supabase.from('expenses').upsert(dbExpense));
    return updated;
  },

  async deleteExpense(id: string): Promise<Expense[]> {
    const current = await this.fetchExpenses();
    const deleted = current.find(e => e.id === id);
    const updated = current.filter(e => e.id !== id);
    setLocalCache('budget_expenses', updated);
    await trySupabase('expenses', () => supabase.from('expenses').delete().eq('id', id));

    // Recalculer le budget après suppression
    if (deleted?.cost_center_id) {
      await this._recalculateBudgetConsumption(deleted.cost_center_id);
    }
    return updated;
  },

  async updateExpenseStatus(id: string, newStatus: ExpenseStatus): Promise<Expense[]> {
    const current = await this.fetchExpenses();
    const updated = current.map(e =>
      e.id === id ? { ...e, status: newStatus, updated_at: new Date().toISOString() } : e
    );
    setLocalCache('budget_expenses', updated);
    await trySupabase('expenses', () =>
      supabase.from('expenses').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    );

    // Recalculer le budget si la dépense passe à payé/approuvé
    const expense = updated.find(e => e.id === id);
    if (expense?.cost_center_id) {
      await this._recalculateBudgetConsumption(expense.cost_center_id);
    }
    return updated;
  },

  // ═══════════════════════════════════════════════════════════
  // 7. RECETTES
  // ═══════════════════════════════════════════════════════════

  async fetchRevenues(): Promise<Revenue[]> {
    return fetchFromSupabaseOrCache<Revenue>('revenues', 'budget_revenues', initialRevenues);
  },

  async saveRevenue(revenue: Partial<Revenue>): Promise<Revenue[]> {
    const current = await this.fetchRevenues();
    const isNew = !current.find(r => r.id === revenue.id);
    const updated = isNew
      ? [revenue as Revenue, ...current]
      : current.map(r => r.id === revenue.id ? { ...r, ...revenue } : r);
    setLocalCache('budget_revenues', updated);
    const { category_name, cost_center_name, ...dbRevenue } = revenue as Revenue;
    await trySupabase('revenues', () => supabase.from('revenues').upsert(dbRevenue));
    return updated;
  },

  async deleteRevenue(id: string): Promise<Revenue[]> {
    const current = await this.fetchRevenues();
    const updated = current.filter(r => r.id !== id);
    setLocalCache('budget_revenues', updated);
    await trySupabase('revenues', () => supabase.from('revenues').delete().eq('id', id));
    return updated;
  },

  async updateRevenueStatus(id: string, newStatus: RevenueStatus): Promise<Revenue[]> {
    const current = await this.fetchRevenues();
    const updated = current.map(r =>
      r.id === id ? { ...r, status: newStatus } : r
    );
    setLocalCache('budget_revenues', updated);
    await trySupabase('revenues', () =>
      supabase.from('revenues').update({ status: newStatus }).eq('id', id)
    );
    return updated;
  },

  // ═══════════════════════════════════════════════════════════
  // MÉTHODES INTERNES
  // ═══════════════════════════════════════════════════════════

  /**
   * Recalcule total_consumed et total_committed d'un budget
   * en sommant les dépenses associées au même cost_center_id.
   */
  async _recalculateBudgetConsumption(costCenterId: string): Promise<void> {
    const [expenses, budgets] = await Promise.all([
      this.fetchExpenses(),
      this.fetchBudgets(),
    ]);

    const ccExpenses = expenses.filter(e => e.cost_center_id === costCenterId);
    const totalConsumed = ccExpenses
      .filter(e => e.status === 'paye')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalCommitted = ccExpenses
      .filter(e => e.status === 'approuve' || e.status === 'soumis')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const updatedBudgets = budgets.map(b => {
      if (b.cost_center_id === costCenterId) {
        return { ...b, total_consumed: totalConsumed, total_committed: totalCommitted, updated_at: new Date().toISOString() };
      }
      return b;
    });

    setLocalCache('budget_budgets', updatedBudgets);

    // Sync vers Supabase (best-effort)
    for (const b of updatedBudgets.filter(b => b.cost_center_id === costCenterId)) {
      await trySupabase('budgets', () =>
        supabase.from('budgets').update({
          total_consumed: totalConsumed,
          total_committed: totalCommitted,
          updated_at: new Date().toISOString(),
        }).eq('id', b.id)
      );
    }
  },
};
