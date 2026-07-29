import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Edit2, X, Power, Trash2 } from 'lucide-react';
import { budgetService } from '../../services/budgetService';
import { CostCenter, Budget } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

export const CostCentersModule: React.FC = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Partial<CostCenter> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [ccData, budgetData] = await Promise.all([
        budgetService.fetchCostCenters(),
        budgetService.fetchBudgets()
      ]);
      setCostCenters(ccData);
      setBudgets(budgetData);
    } catch (error) {
      console.error("Failed to fetch cost centers or budgets", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce centre de coûts ?')) {
      try {
        await budgetService.deleteCostCenter(id);
        await fetchData();
      } catch (error) {
        console.error("Failed to delete cost center", error);
      }
    }
  };

  const handleOpenModal = (cc?: CostCenter) => {
    if (cc) {
      setEditingCenter(cc);
    } else {
      setEditingCenter({
        code: '',
        name: '',
        description: '',
        manager_name: '',
        is_active: true,
        school_id: '00000000-0000-4000-8000-000000000001'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCenter(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCenter) return;
    try {
      await budgetService.saveCostCenter(editingCenter as CostCenter);
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save cost center", error);
    }
  };

  const handleToggleActive = async (cc: CostCenter) => {
    try {
      const updated = { ...cc, is_active: !cc.is_active };
      await budgetService.saveCostCenter(updated);
      await fetchData();
    } catch (error) {
      console.error("Failed to toggle cost center", error);
    }
  };

  const getBudgetAllocation = (costCenterId: string) => {
    const centerBudgets = budgets.filter(b => b.cost_center_id === costCenterId);
    return centerBudgets.reduce((acc, curr) => acc + curr.total_planned, 0);
  };

  const activeCentersCount = costCenters.filter(c => c.is_active).length;
  const totalAllocated = costCenters.reduce((acc, cc) => acc + getBudgetAllocation(cc.id), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-brand-500" />
            <span>Centres de Coûts & Découpage Financier</span>
          </h1>
          <p className="text-xs text-slate-400">Axes analytiques de gestion du budget (Masse Salariale, Pédagogie, Infrastructure, Administration)</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un Centre de Coûts
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-center items-start shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Centres Actifs</span>
          <span className="text-xl font-black text-brand-600">{activeCentersCount} / {costCenters.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-center items-start shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Budget Total Alloué</span>
          <span className="text-xl font-black text-slate-900 dark:text-white">{formatFCFA(totalAllocated)}</span>
        </div>
      </div>

      {costCenters.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Aucun centre de coûts configuré.</p>
          <p className="text-xs text-slate-400 mt-1">Commencez par ajouter un centre de coûts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {costCenters.map(cc => {
            const allocation = getBudgetAllocation(cc.id);
            return (
              <div key={cc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base pr-4">{cc.name}</h3>
                    <span className="font-mono text-xs font-bold text-brand-600">Code: {cc.code}</span>
                  </div>
                  {cc.is_active ? (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full">Actif</span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 font-bold text-[10px] rounded-full">Inactif</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">{cc.description}</p>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Budget Alloué</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{formatFCFA(allocation)}</div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 flex justify-between items-center">
                  <span>Resp: <span className="text-slate-800 dark:text-slate-200">{cc.manager_name}</span></span>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleActive(cc)} title={cc.is_active ? "Désactiver" : "Activer"} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors">
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleOpenModal(cc)} title="Modifier" className="p-1.5 bg-slate-100 dark:bg-slate-800 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(cc.id)} title="Supprimer" className="p-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center animate-fadeIn p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              {editingCenter?.id ? <Edit2 className="w-6 h-6 text-brand-500" /> : <Plus className="w-6 h-6 text-brand-500" />}
              {editingCenter?.id ? 'Modifier Centre de Coûts' : 'Nouveau Centre de Coûts'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={editingCenter?.code || ''}
                  onChange={(e) => setEditingCenter({ ...editingCenter, code: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex: CC-PEDAG"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={editingCenter?.name || ''}
                  onChange={(e) => setEditingCenter({ ...editingCenter, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex: Pédagogie"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Responsable *</label>
                <input
                  type="text"
                  required
                  value={editingCenter?.manager_name || ''}
                  onChange={(e) => setEditingCenter({ ...editingCenter, manager_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Nom du responsable"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={editingCenter?.description || ''}
                  onChange={(e) => setEditingCenter({ ...editingCenter, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px]"
                  placeholder="Description détaillée du centre de coûts..."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700">
                  Annuler
                </button>
                <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
