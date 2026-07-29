import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Plus, Search, Edit2, Trash2, X, Users, AlertTriangle } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { EmployeeContract, Employee, ContractType } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

export const ContractsManagementModule: React.FC = () => {
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'actif' | 'expiring' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<EmployeeContract>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedContracts, fetchedEmployees] = await Promise.all([
        hrService.fetchContracts(),
        hrService.fetchEmployees(),
      ]);
      setContracts(fetchedContracts);
      setEmployees(fetchedEmployees);
    } catch (error) {
      console.error('Error fetching contracts data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const now = new Date();
  const expiringList = useMemo(() => {
    return contracts.filter(c => {
      if (!c.end_date || c.status !== 'actif') return false;
      const diffDays = Math.ceil((new Date(c.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 60;
    });
  }, [contracts]);

  const expiredList = useMemo(() => {
    return contracts.filter(c => {
      if (!c.end_date) return false;
      return new Date(c.end_date).getTime() < now.getTime();
    });
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesSearch =
        (c.employee_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.contract_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'actif') return c.status === 'actif';
      if (activeTab === 'expiring') return expiringList.some(e => e.id === c.id);
      if (activeTab === 'expired') return expiredList.some(e => e.id === c.id);
      return true;
    });
  }, [contracts, searchTerm, activeTab, expiringList, expiredList]);

  const handleOpenModal = (contract?: EmployeeContract) => {
    if (contract) {
      setFormData(contract);
    } else {
      setFormData({
        contract_number: `CTR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        employee_id: '',
        employee_name: '',
        contract_type: 'CDI' as ContractType,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        contractual_salary: 250000,
        weekly_hours: 40,
        status: 'actif',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedEmp = employees.find(emp => emp.id === formData.employee_id);
      const payload: Partial<EmployeeContract> = {
        ...formData,
        id: formData.id || `ctr-${Date.now()}`,
        school_id: '00000000-0000-4000-8000-000000000001',
        employee_name: selectedEmp ? `${selectedEmp.first_name} ${selectedEmp.last_name}` : (formData.employee_name || 'Employé'),
        contractual_salary: Number(formData.contractual_salary) || 0,
      };

      await hrService.saveContract(payload);
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce contrat de travail ?')) {
      try {
        await hrService.deleteContract(id);
        await fetchData();
      } catch (error) {
        console.error('Error deleting contract:', error);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-500" />
            <span>Gestion des Contrats de Travail ({contracts.length})</span>
          </h1>
          <p className="text-xs text-slate-400">Suivi des CDI, CDD, vacataires, alertes de renouvellement et suppression</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Contrat</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par n° contrat ou nom d'employé..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto">
          <button onClick={() => setActiveTab('all')} className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'all' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-xs' : 'text-slate-500'}`}>Tous ({contracts.length})</button>
          <button onClick={() => setActiveTab('actif')} className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'actif' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-xs' : 'text-slate-500'}`}>Actifs</button>
          <button onClick={() => setActiveTab('expiring')} className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'expiring' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-600'}`}>À Renouveler ({expiringList.length})</button>
          <button onClick={() => setActiveTab('expired')} className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'expired' ? 'bg-rose-500 text-white shadow-xs' : 'text-rose-600'}`}>Expirés ({expiredList.length})</button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">N° Contrat</th>
                <th className="py-3.5 px-4">Employé</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Date Début</th>
                <th className="py-3.5 px-4">Date Fin</th>
                <th className="py-3.5 px-4">Salaire Contractuel</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredContracts.length > 0 ? (
                filteredContracts.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600">{c.contract_number}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{c.employee_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-md">{c.contract_type}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{c.start_date}</td>
                    <td className="py-3.5 px-4 font-mono">{c.end_date || 'Indéterminée (CDI)'}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">{formatFCFA(c.contractual_salary)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'actif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(c)}
                          className="p-1.5 text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="font-semibold text-sm">Aucun contrat trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
              {formData.id ? 'Modifier le Contrat' : 'Nouveau Contrat de Travail'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">N° Contrat *</label>
                <input
                  type="text"
                  required
                  value={formData.contract_number || ''}
                  onChange={e => setFormData({ ...formData, contract_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Employé *</label>
                {employees.length > 0 ? (
                  <select
                    required
                    value={formData.employee_id || ''}
                    onChange={e => {
                      const emp = employees.find(x => x.id === e.target.value);
                      setFormData({
                        ...formData,
                        employee_id: e.target.value,
                        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="">Sélectionner un employé...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_number})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Nom de l'employé"
                    value={formData.employee_name || ''}
                    onChange={e => setFormData({ ...formData, employee_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Type de Contrat</label>
                  <select
                    value={formData.contract_type || 'CDI'}
                    onChange={e => setFormData({ ...formData, contract_type: e.target.value as ContractType })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="temporaire">Temporaire</option>
                    <option value="vacataire">Vacataire</option>
                    <option value="prestataire">Prestataire</option>
                    <option value="stage">Stage</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Salaire Contractuel *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.contractual_salary || ''}
                    onChange={e => setFormData({ ...formData, contractual_salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-brand-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Date Début *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date || ''}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Date Fin (si CDD)</label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Statut</label>
                <select
                  value={formData.status || 'actif'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="actif">Actif</option>
                  <option value="suspendu">Suspendu</option>
                  <option value="termine">Terminé</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Notes / Remarques</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  placeholder="Notes sur le contrat..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-xl font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
