import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, CheckCircle2, XCircle, FileText, ArrowDownToLine, Trash2, Edit2 } from 'lucide-react';
import { formatFCFA } from '../../utils/payrollCalculations';
import { Revenue, RevenueStatus } from '../../types';
import { PaymentMethod } from '../../types/hr';
import { budgetService } from '../../services/budgetService';

const SCHOOL_ID = '00000000-0000-4000-8000-000000000001';

export const RevenuesManagementModule: React.FC = () => {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Revenue>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchedRevenues = await budgetService.fetchRevenues();
      setRevenues(fetchedRevenues);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (revenue?: Revenue) => {
    if (revenue) {
      setFormData(revenue);
    } else {
      setFormData({
        source_name: '',
        description: '',
        amount: 0,
        revenue_date: new Date().toISOString().split('T')[0],
        payment_method: 'virement' as PaymentMethod,
      });
    }
    setIsModalOpen(true);
  };

  const handleDeleteRevenue = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette recette ?')) {
      try {
        await budgetService.deleteRevenue(id);
        await fetchData();
      } catch (error) {
        console.error('Error deleting revenue:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newRevenue: Partial<Revenue> = {
        ...formData,
        school_id: SCHOOL_ID,
        revenue_number: formData.revenue_number || `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        status: formData.status || 'en_attente',
      };

      await budgetService.saveRevenue(newRevenue as Revenue);
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving revenue:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: RevenueStatus) => {
    try {
      await budgetService.updateRevenueStatus(id, newStatus);
      await fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Filtered and searched data
  const filteredRevenues = useMemo(() => {
    return revenues.filter(revenue => {
      const matchesSearch = 
        (revenue.source_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (revenue.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (revenue.revenue_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
      const matchesStatus = statusFilter === 'all' || revenue.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [revenues, searchTerm, statusFilter]);

  // KPIs
  const totalEncaisse = revenues.filter(r => r.status === 'encaisse').reduce((acc, rev) => acc + (rev.amount || 0), 0);
  const totalEnAttente = revenues.filter(r => r.status === 'en_attente').reduce((acc, rev) => acc + (rev.amount || 0), 0);
  const totalRevenuesCount = revenues.length;
  const filteredTotalAmount = filteredRevenues.reduce((acc, rev) => acc + (rev.amount || 0), 0);

  const getStatusBadge = (status: RevenueStatus) => {
    switch (status) {
      case 'en_attente': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">En attente</span>;
      case 'encaisse': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">Encaissé</span>;
      case 'annule': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-400">Annulé</span>;
      default: return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Chargement des recettes...</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gestion des Recettes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Suivi des entrées de fonds de l'établissement</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Enregistrer une Recette
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 flex flex-col justify-center">
          <span className="text-xs font-medium text-slate-500 mb-1">Total encaissé</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{formatFCFA(totalEncaisse)}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 flex flex-col justify-center">
          <span className="text-xs font-medium text-slate-500 mb-1">En attente</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">{formatFCFA(totalEnAttente)}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 flex flex-col justify-center">
          <span className="text-xs font-medium text-slate-500 mb-1">Nombre de recettes</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalRevenuesCount}</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher (source, description, N°)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RevenueStatus | 'all')}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="encaisse">Encaissé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2">
        Total filtré : <span className="text-slate-900 dark:text-white font-bold">{formatFCFA(filteredTotalAmount)}</span> ({filteredRevenues.length} recette{filteredRevenues.length > 1 ? 's' : ''})
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">N° Recette</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Source / Origine</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold text-right">Montant</th>
                <th className="px-4 py-3 font-semibold text-center">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {filteredRevenues.length > 0 ? (
                filteredRevenues.map((revenue) => (
                  <tr key={revenue.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{revenue.revenue_number}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(revenue.revenue_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                      {revenue.source_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={revenue.description}>
                      {revenue.description || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-right">
                      {formatFCFA(revenue.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(revenue.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenModal(revenue)}
                          className="p-1.5 text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteRevenue(revenue.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {revenue.status === 'en_attente' && (
                          <button 
                            onClick={() => handleStatusChange(revenue.id, 'encaisse')}
                            className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Encaisser"
                          >
                            <ArrowDownToLine className="w-4 h-4" />
                          </button>
                        )}
                        
                        {revenue.status !== 'encaisse' && revenue.status !== 'annule' && (
                          <button 
                            onClick={() => handleStatusChange(revenue.id, 'annule')}
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
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <FileText className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm font-medium">Aucune recette trouvée</p>
                      <p className="text-xs mt-1">Ajustez vos filtres ou enregistrez une nouvelle recette.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Enregistrer une Recette
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Source / Origine *</label>
                <input
                  type="text"
                  required
                  value={formData.source_name || ''}
                  onChange={e => setFormData({...formData, source_name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="Nom du payeur ou source"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="Motif de la recette"
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
                    value={formData.revenue_date || ''}
                    onChange={e => setFormData({...formData, revenue_date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
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
    </div>
  );
};

export default RevenuesManagementModule;
