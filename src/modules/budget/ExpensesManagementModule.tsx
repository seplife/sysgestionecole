import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Filter, CheckCircle2, FileText, X } from 'lucide-react';
import { budgetService } from '../../services/budgetService';
import { Expense, CostCenter, PaymentMethod } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

export const ExpensesManagementModule: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    supplier_name: '',
    description: '',
    amount: 0,
    cost_center_name: 'Infrastructure & Logistique',
    expense_date: new Date().toISOString().substring(0, 10),
    payment_method: 'virement' as PaymentMethod,
    receipt_ref: ''
  });

  useEffect(() => {
    budgetService.fetchExpenses().then(setExpenses);
    budgetService.fetchCostCenters().then(setCostCenters);
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const created: Expense = {
      id: `exp-${Date.now()}`,
      school_id: 'school-palmeraie-01',
      expense_number: `DEP-2026-00${Math.floor(50 + Math.random() * 50)}`,
      supplier_name: formData.supplier_name,
      description: formData.description,
      amount: formData.amount,
      cost_center_name: formData.cost_center_name,
      expense_date: formData.expense_date,
      payment_method: formData.payment_method,
      receipt_ref: formData.receipt_ref,
      status: 'paye',
      created_at: new Date().toISOString()
    };

    const updated = await budgetService.saveExpense(created);
    setExpenses(updated);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-rose-500" />
            <span>Gestion des Dépenses Réelles</span>
          </h1>
          <p className="text-xs text-slate-400">Enregistrement des factures fournisseurs, achats de matériel et charges d'exploitation</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer une Dépense</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b">
            <tr>
              <th className="py-3.5 px-4">N° Dépense</th>
              <th className="py-3.5 px-4">Fournisseur / Bénéficiaire</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Centre de Coûts</th>
              <th className="py-3.5 px-4">Montant (FCFA)</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-mono font-bold text-brand-600">{e.expense_number}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{e.supplier_name || 'Autre'}</td>
                <td className="py-3.5 px-4">{e.description}</td>
                <td className="py-3.5 px-4 font-semibold">{e.cost_center_name || 'Général'}</td>
                <td className="py-3.5 px-4 font-extrabold text-rose-600">{formatFCFA(e.amount)}</td>
                <td className="py-3.5 px-4 font-mono">{e.expense_date}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    e.status === 'paye' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add Expense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Enregistrer une Dépense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Fournisseur / Beneficiaire *</label>
                <input type="text" required placeholder="ex: CIE, SODECI, Librairie de France..." value={formData.supplier_name} onChange={e => setFormData({...formData, supplier_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div>
                <label className="block font-bold mb-1">Description / Objet *</label>
                <input type="text" required placeholder="ex: Achat rame de papier, Facture eau..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Montant (FCFA) *</label>
                  <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-rose-600" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Centre de Coûts</label>
                  <select value={formData.cost_center_name} onChange={e => setFormData({...formData, cost_center_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                    {costCenters.map(cc => <option key={cc.id} value={cc.name}>{cc.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Mode de Règlement</label>
                <select value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value as PaymentMethod})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                  <option value="virement">Virement Bancaire</option>
                  <option value="mobile_money">Mobile Money (Wave / Orange)</option>
                  <option value="cheque">Chèque</option>
                  <option value="especes">Espèces</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-xl font-bold">Valider la Dépense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
