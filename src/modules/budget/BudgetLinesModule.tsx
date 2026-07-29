import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import budgetService from '../../services/budgetService';
import { Budget, BudgetLine, BudgetPeriod, CostCenter, BudgetCategory } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';
import { calculateBudgetExecution } from '../../utils/budgetCalculations';

export const BudgetLinesModule: React.FC = () => {
  const [periods, setPeriods] = useState<BudgetPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  
  const [expandedBudgets, setExpandedBudgets] = useState<Record<string, boolean>>({});
  
  const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false);
  const [selectedBudgetIdForLine, setSelectedBudgetIdForLine] = useState<string>('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [fetchedPeriods, fetchedCostCenters, fetchedCategories] = await Promise.all([
          budgetService.fetchBudgetPeriods('current-school'),
          budgetService.fetchCostCenters('current-school'),
          budgetService.fetchBudgetCategories('current-school')
        ]);
        setPeriods(fetchedPeriods);
        setCostCenters(fetchedCostCenters);
        setCategories(fetchedCategories);
        if (fetchedPeriods.length > 0) {
          setSelectedPeriodId(fetchedPeriods[0].id);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadBudgets();
    }
  }, [selectedPeriodId]);

  const loadBudgets = async () => {
    try {
      const fetchedBudgets = await budgetService.fetchBudgets('current-school');
      const filtered = fetchedBudgets.filter(b => b.period_id === selectedPeriodId);
      setBudgets(filtered);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const toggleBudget = (budgetId: string) => {
    setExpandedBudgets(prev => ({ ...prev, [budgetId]: !prev[budgetId] }));
  };

  const handleAddBudgetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newBudget: Partial<Budget> = {
      title: formData.get('title') as string,
      cost_center_id: formData.get('cost_center_id') as string,
      period_id: selectedPeriodId,
      total_planned: Number(formData.get('total_planned')),
      consumed_amount: 0,
      committed_amount: 0,
      status: 'draft',
      school_id: 'current-school',
      lines: []
    };
    await budgetService.saveBudget(newBudget as Budget);
    setIsAddBudgetModalOpen(false);
    loadBudgets();
  };

  const handleAddLineSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newLine: Partial<BudgetLine> = {
      budget_id: selectedBudgetIdForLine,
      code: formData.get('code') as string,
      label: formData.get('label') as string,
      category_id: formData.get('category_id') as string,
      planned_amount: Number(formData.get('planned_amount')),
      committed_amount: 0,
      consumed_amount: 0,
      status: 'active'
    };
    await budgetService.saveBudgetLine(newLine as BudgetLine);
    setIsAddLineModalOpen(false);
    loadBudgets();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-7 h-7 text-brand-600" />
          Budgets Prévisionnels & Lignes Budgétaires
        </h2>
        
        <div className="flex items-center gap-3">
          <select 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm shadow-xs"
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

      <div className="space-y-4">
        {budgets.map(budget => {
          const isExpanded = expandedBudgets[budget.id];
          const ccName = costCenters.find(cc => cc.id === budget.cost_center_id)?.name || 'N/A';
          const rate = calculateBudgetExecution(budget)?.rate || (budget.consumed_amount / (budget.total_planned || 1)) * 100;
          
          return (
            <div key={budget.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => toggleBudget(budget.id)}
              >
                <div className="flex items-center gap-4">
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{budget.title}</h3>
                    <p className="text-xs text-slate-500">{ccName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-xs">
                  <div className="text-right">
                    <p className="text-slate-500">Prévu</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{formatFCFA(budget.total_planned)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500">Engagé</p>
                    <p className="font-bold text-amber-600">{formatFCFA(budget.committed_amount || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500">Consommé</p>
                    <p className="font-bold text-emerald-600">{formatFCFA(budget.consumed_amount)}</p>
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
                  <div className="flex justify-end mb-4">
                    <button 
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-md flex items-center gap-1 transition-colors"
                      onClick={() => {
                        setSelectedBudgetIdForLine(budget.id);
                        setIsAddLineModalOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3" /> Ajouter Ligne
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase text-slate-500 rounded-t-lg">
                        <tr>
                          <th className="p-3 rounded-tl-lg">Code</th>
                          <th className="p-3">Libellé</th>
                          <th className="p-3">Prévu</th>
                          <th className="p-3">Engagé</th>
                          <th className="p-3">Consommé</th>
                          <th className="p-3">Exécution</th>
                          <th className="p-3 rounded-tr-lg">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {budget.lines?.map(line => {
                          const lineRate = (line.consumed_amount / (line.planned_amount || 1)) * 100;
                          return (
                            <tr key={line.id} className="border-b border-slate-200 dark:border-slate-700/50">
                              <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{line.code}</td>
                              <td className="p-3">{line.label}</td>
                              <td className="p-3">{formatFCFA(line.planned_amount)}</td>
                              <td className="p-3 text-amber-600">{formatFCFA(line.committed_amount || 0)}</td>
                              <td className="p-3 text-emerald-600">{formatFCFA(line.consumed_amount)}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${Math.min(lineRate, 100)}%` }}></div>
                                  </div>
                                  <span className="text-[10px]">{lineRate.toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${line.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                  {line.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {(!budget.lines || budget.lines.length === 0) && (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-slate-500 text-xs">Aucune ligne budgétaire.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAddBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsAddBudgetModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Nouveau Budget</h3>
            <form onSubmit={handleAddBudgetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Titre</label>
                <input required name="title" type="text" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Centre de Coût</label>
                <select required name="cost_center_id" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-transparent">
                  <option value="">Sélectionner...</option>
                  {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Montant Prévu</label>
                <input required name="total_planned" type="number" min="0" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-transparent" />
              </div>
              <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors mt-2">
                Créer
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddLineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsAddLineModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Nouvelle Ligne Budgétaire</h3>
            <form onSubmit={handleAddLineSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Code</label>
                <input required name="code" type="text" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Libellé</label>
                <input required name="label" type="text" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Catégorie</label>
                <select required name="category_id" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-transparent">
                  <option value="">Sélectionner...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Montant Prévu</label>
                <input required name="planned_amount" type="number" min="0" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-transparent" />
              </div>
              <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors mt-2">
                Ajouter
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
