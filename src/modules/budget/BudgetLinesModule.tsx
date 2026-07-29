import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronRight, Plus, X, Trash2, Edit2 } from 'lucide-react';
import { budgetService } from '../../services/budgetService';
import { Budget, BudgetLine, BudgetPeriod, CostCenter, BudgetCategory } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';
import { calculateBudgetExecution } from '../../utils/budgetCalculations';

export const BudgetLinesModule: React.FC = () => {
  const [periods, setPeriods] = useState<BudgetPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);

  const [expandedBudgets, setExpandedBudgets] = useState<Record<string, boolean>>({});
  const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false);
  const [selectedBudgetIdForLine, setSelectedBudgetIdForLine] = useState<string>('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [fetchedPeriods, fetchedCostCenters, fetchedCategories] = await Promise.all([
          budgetService.fetchBudgetPeriods(),
          budgetService.fetchCostCenters(),
          budgetService.fetchBudgetCategories(),
        ]);
        setPeriods(fetchedPeriods);
        setCostCenters(fetchedCostCenters);
        setCategories(fetchedCategories);
        if (fetchedPeriods.length > 0) {
          setSelectedPeriodId(fetchedPeriods[0].id);
        }
      } catch (error) {
        console.error('[BudgetLines] fetchInitialData error:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadBudgetsAndLines();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriodId]);

  const loadBudgetsAndLines = async () => {
    try {
      const [allBudgets, allLines] = await Promise.all([
        budgetService.fetchBudgets(),
        budgetService.fetchBudgetLines(),
      ]);
      const filtered = allBudgets.filter((b: Budget) => b.budget_period_id === selectedPeriodId);
      setBudgets(filtered);
      setBudgetLines(allLines);
    } catch (error) {
      console.error('[BudgetLines] loadBudgets error:', error);
    }
  };

  const toggleBudget = (budgetId: string) => {
    setExpandedBudgets(prev => ({ ...prev, [budgetId]: !prev[budgetId] }));
  };

  const handleDeleteBudget = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Voulez-vous vraiment supprimer ce budget et toutes ses lignes ?')) {
      await budgetService.deleteBudget(id);
      loadBudgetsAndLines();
    }
  };

  const handleDeleteLine = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette ligne budgétaire ?')) {
      await budgetService.deleteBudgetLine(id);
      loadBudgetsAndLines();
    }
  };

  const handleAddBudgetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const costCenterId = formData.get('cost_center_id') as string;
    const ccName = costCenters.find(cc => cc.id === costCenterId)?.name || '';
    const newBudget: Partial<Budget> = {
      id: `bdg-${Date.now()}`,
      school_id: '00000000-0000-4000-8000-000000000001',
      title: formData.get('title') as string,
      cost_center_id: costCenterId,
      cost_center_name: ccName,
      budget_period_id: selectedPeriodId,
      total_planned: Number(formData.get('total_planned')),
      total_consumed: 0,
      total_committed: 0,
    };
    await budgetService.saveBudget(newBudget);
    setIsAddBudgetModalOpen(false);
    loadBudgetsAndLines();
  };

  const handleAddLineSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoryId = formData.get('category_id') as string;
    const catName = categories.find(c => c.id === categoryId)?.name || '';
    const newLine: Partial<BudgetLine> = {
      id: `bl-${Date.now()}`,
      school_id: '00000000-0000-4000-8000-000000000001',
      budget_id: selectedBudgetIdForLine,
      code: formData.get('code') as string,
      label: formData.get('label') as string,
      category_id: categoryId,
      category_name: catName,
      planned_amount: Number(formData.get('planned_amount')),
      committed_amount: 0,
      consumed_amount: 0,
    };
    await budgetService.saveBudgetLine(newLine);
    setIsAddLineModalOpen(false);
    loadBudgetsAndLines();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-500" />
            <span>Budgets Prévisionnels & Lignes Budgétaires</span>
          </h1>
          <p className="text-xs text-slate-400">Gérez vos budgets par période et détaillez les lignes budgétaires</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 transition-colors"
            onClick={() => setIsAddBudgetModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> Nouveau Budget
          </button>
        </div>
      </div>

      {/* Budget Cards (Accordion) */}
      <div className="space-y-4">
        {budgets.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">Aucun budget pour cette période.</p>
            <p className="text-xs text-slate-400 mt-1">Créez un nouveau budget pour commencer.</p>
          </div>
        ) : (
          budgets.map(budget => {
            const isExpanded = expandedBudgets[budget.id];
            const ccName = budget.cost_center_name || costCenters.find(cc => cc.id === budget.cost_center_id)?.name || 'N/A';
            const exec = calculateBudgetExecution(budget.total_planned, budget.total_consumed, budget.total_committed);
            const lines = budgetLines.filter(l => l.budget_id === budget.id);

            return (
              <div key={budget.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                {/* Budget Header */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  onClick={() => toggleBudget(budget.id)}
                >
                  <div className="flex items-center gap-4">
                    {isExpanded
                      ? <ChevronDown className="w-5 h-5 text-slate-400 transition-transform" />
                      : <ChevronRight className="w-5 h-5 text-slate-400 transition-transform" />
                    }
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{budget.title}</h3>
                      <p className="text-xs text-slate-400 font-medium">{ccName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <div className="text-right">
                      <p className="text-slate-400 font-semibold">Prévu</p>
                      <p className="font-extrabold text-slate-900 dark:text-white">{formatFCFA(budget.total_planned)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 font-semibold">Engagé</p>
                      <p className="font-extrabold text-amber-600">{formatFCFA(budget.total_committed)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 font-semibold">Consommé</p>
                      <p className="font-extrabold text-emerald-600">{formatFCFA(budget.total_consumed)}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      exec.alertLevel === 'exceeded_100' ? 'bg-rose-100 text-rose-700' :
                      exec.alertLevel === 'danger_90' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {exec.executionRate}%
                    </span>
                    <button
                      onClick={(e) => handleDeleteBudget(budget.id, e)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Supprimer le budget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded: Budget Lines Table */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
                    <div className="flex justify-end mb-4">
                      <button
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-md flex items-center gap-1 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBudgetIdForLine(budget.id);
                          setIsAddLineModalOpen(true);
                        }}
                      >
                        <Plus className="w-3 h-3" /> Ajouter Ligne
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase text-slate-400 font-bold">
                          <tr>
                            <th className="py-3 px-4">Code</th>
                            <th className="py-3 px-4">Libellé</th>
                            <th className="py-3 px-4">Catégorie</th>
                            <th className="py-3 px-4">Prévu</th>
                            <th className="py-3 px-4">Engagé</th>
                            <th className="py-3 px-4">Consommé</th>
                            <th className="py-3 px-4">Exécution</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {lines.map(line => {
                            const lineRate = line.planned_amount > 0
                              ? (line.consumed_amount / line.planned_amount) * 100
                              : 0;
                            return (
                              <tr key={line.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                <td className="py-3 px-4 font-mono font-bold text-brand-600">{line.code}</td>
                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{line.label}</td>
                                <td className="py-3 px-4 text-slate-500">{line.category_name || '—'}</td>
                                <td className="py-3 px-4 font-bold">{formatFCFA(line.planned_amount)}</td>
                                <td className="py-3 px-4 text-amber-600 font-bold">{formatFCFA(line.committed_amount)}</td>
                                <td className="py-3 px-4 text-emerald-600 font-bold">{formatFCFA(line.consumed_amount)}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${lineRate >= 100 ? 'bg-rose-500' : lineRate >= 90 ? 'bg-amber-500' : 'bg-brand-500'}`}
                                        style={{ width: `${Math.min(lineRate, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold">{lineRate.toFixed(0)}%</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleDeleteLine(line.id)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Supprimer la ligne"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {lines.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                                Aucune ligne budgétaire. Cliquez sur "Ajouter Ligne" pour commencer.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ═══ Modal: Nouveau Budget ═══ */}
      {isAddBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fadeIn relative">
            <button onClick={() => setIsAddBudgetModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">Nouveau Budget</h3>
            <form onSubmit={handleAddBudgetSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Titre du Budget *</label>
                <input required name="title" type="text" placeholder="ex: Budget Fonctionnement Pédagogique" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold mb-1">Centre de Coûts *</label>
                <select required name="cost_center_id" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                  <option value="">Sélectionner...</option>
                  {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Montant Prévu (FCFA) *</label>
                <input required name="total_planned" type="number" min="0" placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-brand-600" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsAddBudgetModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-xl font-bold">Créer le Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Modal: Nouvelle Ligne Budgétaire ═══ */}
      {isAddLineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fadeIn relative">
            <button onClick={() => setIsAddLineModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">Nouvelle Ligne Budgétaire</h3>
            <form onSubmit={handleAddLineSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Code *</label>
                <input required name="code" type="text" placeholder="ex: PEDAG-FOUR-01" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono" />
              </div>
              <div>
                <label className="block font-bold mb-1">Libellé *</label>
                <input required name="label" type="text" placeholder="ex: Matériel didactique" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold mb-1">Catégorie</label>
                <select name="category_id" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                  <option value="">Sélectionner...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Montant Prévu (FCFA) *</label>
                <input required name="planned_amount" type="number" min="0" placeholder="0" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-brand-600" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsAddLineModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-xl font-bold">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
