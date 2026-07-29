import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Eye, CheckCircle2, Check, XCircle, FileText, Trash2, Edit2 } from 'lucide-react';
import { formatFCFA } from '../../utils/payrollCalculations';
import { Expense, CostCenter, ExpenseStatus } from '../../types';
import { PaymentMethod } from '../../types/hr';
import { budgetService } from '../../services/budgetService';

const SCHOOL_ID = '00000000-0000-4000-8000-000000000001';

export const ExpensesManagementModule: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');
  const [costCenterFilter, setCostCenterFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    supplier_name: '',
    receipt_ref: '',
    cost_center_id: '',
    payment_method: 'virement' as PaymentMethod,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedExpenses, fetchedCostCenters] = await Promise.all([
        budgetService.fetchExpenses(),
        budgetService.fetchCostCenters()
      ]);
      setExpenses(fetchedExpenses);
      setCostCenters(fetchedCostCenters);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette dépense ?')) {
      try {
        await budgetService.deleteExpense(id);
        await fetchData();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setFormData(expense);
    } else {
      setFormData({
        description: '',
        amount: 0,
        expense_date: new Date().toISOString().split('T')[0],
        supplier_name: '',
        receipt_ref: '',
        cost_center_id: '',
        payment_method: 'virement' as PaymentMethod,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  const handleOpenDetailModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedExpense(null);
    setIsDetailModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCenter = costCenters.find(c => c.id === formData.cost_center_id);
      
      const newExpense: Partial<Expense> = {
        ...formData,
        school_id: SCHOOL_ID,
        expense_number: formData.expense_number || `DEP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        status: formData.status || 'brouillon',
        cost_center_name: selectedCenter ? selectedCenter.name : undefined,
      };

      await budgetService.saveExpense(newExpense as Expense);
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ExpenseStatus) => {
    try {
      await budgetService.updateExpenseStatus(id, newStatus);
      await fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Filtered and searched data
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = 
        (expense.supplier_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (expense.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (expense.expense_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
      const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
      const matchesCostCenter = costCenterFilter === 'all' || expense.cost_center_id === costCenterFilter;
      
      return matchesSearch && matchesStatus && matchesCostCenter;
    });
  }, [expenses, searchTerm, statusFilter, costCenterFilter]);

  // KPIs
  const totalAmount = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
  const totalPaid = expenses.filter(e => e.status === 'paye').reduce((acc, exp) => acc + (exp.amount || 0), 0);
  const pendingApprovalCount = expenses.filter(e => e.status === 'soumis').length;
  const filteredTotalAmount = filteredExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case 'brouillon': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Brouillon</span>;
      case 'soumis': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Soumis</span>;
      case 'approuve': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">Approuvé</span>;
      case 'paye': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">Payé</span>;
      case 'rejete': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300">Rejeté</span>;
      case 'annule': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-400">Annulé</span>;
      default: return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Chargement des dépenses...</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gestion des Dépenses</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Suivi et validation des dépenses de l'établissement</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Enregistrer une dépense
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 flex flex-col justify-center">
          <span className="text-xs font-medium text-slate-500 mb-1">Total des dépenses</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatFCFA(totalAmount)}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 flex flex-col justify-center">
          <span className="text-xs font-medium text-slate-500 mb-1">Total payé</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{formatFCFA(totalPaid)}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 flex flex-col justify-center">
          <span className="text-xs font-medium text-slate-500 mb-1">En attente d'approbation</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">{pendingApprovalCount} dépense(s)</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher (fournisseur, description, N°)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExpenseStatus | 'all')}
              className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="soumis">Soumis</option>
              <option value="approuve">Approuvé</option>
              <option value="paye">Payé</option>
              <option value="rejete">Rejeté</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
          <div className="relative">
            <select
              value={costCenterFilter}
              onChange={(e) => setCostCenterFilter(e.target.value)}
              className="px-4 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none"
            >
              <option value="all">Tous les centres de coûts</option>
              {costCenters.map(center => (
                <option key={center.id} value={center.id}>{center.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2">
        Total filtré : <span className="text-slate-900 dark:text-white font-bold">{formatFCFA(filteredTotalAmount)}</span> ({filteredExpenses.length} dépense{filteredExpenses.length > 1 ? 's' : ''})
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">N° Dépense</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Fournisseur</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Centre de coût</th>
                <th className="px-4 py-3 font-semibold text-right">Montant</th>
                <th className="px-4 py-3 font-semibold text-center">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{expense.expense_number}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                      {expense.supplier_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={expense.description}>
                      {expense.description}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {expense.cost_center_name || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-right">
                      {formatFCFA(expense.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(expense.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenDetailModal(expense)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleOpenModal(expense)}
                          className="p-1.5 text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        {expense.status === 'brouillon' && (
                          <button 
                            onClick={() => handleStatusChange(expense.id, 'soumis')}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Soumettre pour approbation"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        
                        {expense.status === 'soumis' && (
                          <button 
                            onClick={() => handleStatusChange(expense.id, 'approuve')}
                            className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Approuver"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        {expense.status === 'approuve' && (
                          <button 
                            onClick={() => handleStatusChange(expense.id, 'paye')}
                            className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Marquer comme payé"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {expense.status !== 'paye' && expense.status !== 'annule' && (
                          <button 
                            onClick={() => handleStatusChange(expense.id, 'annule')}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Annuler"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <FileText className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm font-medium">Aucune dépense trouvée</p>
                      <p className="text-xs mt-1">Ajustez vos filtres ou enregistrez une nouvelle dépense.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {formData.id ? 'Modifier la dépense' : 'Enregistrer une dépense'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Fournisseur / Bénéficiaire *</label>
                <input
                  type="text"
                  required
                  value={formData.supplier_name || ''}
                  onChange={e => setFormData({...formData, supplier_name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="Nom du fournisseur"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="Motif de la dépense"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Montant (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date || ''}
                    onChange={e => setFormData({...formData, expense_date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Référence facture</label>
                  <input
                    type="text"
                    value={formData.receipt_ref || ''}
                    onChange={e => setFormData({...formData, receipt_ref: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    placeholder="FAC-XXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Moyen de paiement</label>
                  <select
                    value={formData.payment_method || 'virement'}
                    onChange={e => setFormData({...formData, payment_method: e.target.value as PaymentMethod})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="virement">Virement</option>
                    <option value="cheque">Chèque</option>
                    <option value="especes">Espèces</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Centre de coût *</label>
                <select
                  required
                  value={formData.cost_center_id || ''}
                  onChange={e => setFormData({...formData, cost_center_id: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="" disabled>Sélectionner un centre</option>
                  {costCenters.map(center => (
                    <option key={center.id} value={center.id}>{center.name} ({center.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={handleCloseDetailModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Détails de la dépense
            </h3>
            <p className="text-sm text-slate-500 mb-6">{selectedExpense.expense_number}</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-xs text-slate-500">Statut</span>
                {getStatusBadge(selectedExpense.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="block text-xs text-slate-500 mb-1">Date</span>
                  <span className="font-medium text-slate-900 dark:text-white">{new Date(selectedExpense.expense_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 mb-1">Montant</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatFCFA(selectedExpense.amount)}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 mb-1">Fournisseur</span>
                  <span className="font-medium text-slate-900 dark:text-white">{selectedExpense.supplier_name || '-'}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 mb-1">Moyen de paiement</span>
                  <span className="font-medium text-slate-900 dark:text-white capitalize">{selectedExpense.payment_method?.replace('_', ' ') || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs text-slate-500 mb-1">Description</span>
                  <span className="text-slate-900 dark:text-white">{selectedExpense.description}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 mb-1">Centre de coût</span>
                  <span className="font-medium text-slate-900 dark:text-white">{selectedExpense.cost_center_name || '-'}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 mb-1">Référence facture</span>
                  <span className="font-medium text-slate-900 dark:text-white">{selectedExpense.receipt_ref || '-'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={handleCloseDetailModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManagementModule;
