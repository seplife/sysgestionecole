import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Edit2, Trash2, ShieldCheck, Eye, Phone, Mail, CreditCard, Building2, UserCheck, X } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { Employee, ContractType, EmployeeType, PaymentMethod } from '../../types';
import { formatFCFA } from '../../utils/payrollCalculations';

interface EmployeesListModuleProps {
  onSelectEmployee?: (employee: Employee) => void;
}

export const EmployeesListModule: React.FC<EmployeesListModuleProps> = ({ onSelectEmployee }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    hrService.fetchEmployees().then(setEmployees);
  }, []);

  const [formData, setFormData] = useState<Partial<Employee>>({
    first_name: '',
    last_name: '',
    gender: 'M',
    phone: '',
    email: '',
    address: '',
    employee_type: 'permanent',
    department_name: 'Direction des Études & Pédagogie',
    position_name: 'Enseignant Titulaire',
    hire_date: new Date().toISOString().substring(0, 10),
    employment_status: 'actif',
    contract_type: 'CDI',
    base_salary: 250000,
    payment_method: 'virement',
    bank_name: 'NSIA Banque CI',
    iban: '',
    cnps_number: ''
  });

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || emp.employee_type === filterType;
    const matchesStatus = filterStatus === 'all' || emp.employment_status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      const updated = await hrService.saveEmployee({ ...editingEmployee, ...formData });
      setEmployees(updated);
      setEditingEmployee(null);
    } else {
      const newEmp: Partial<Employee> = {
        ...formData,
        id: `emp-${Date.now()}`,
        school_id: 'school-palmeraie-01',
        employee_number: `EMP-2026-${Math.floor(100 + Math.random() * 900)}`
      };
      const updated = await hrService.saveEmployee(newEmp);
      setEmployees(updated);
      setShowAddModal(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Voulez-vous supprimer définitivement la fiche de ${name} ?`)) {
      const updated = await hrService.deleteEmployee(id);
      setEmployees(updated);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-500" />
            <span>Gestion du Personnel ({filteredEmployees.length})</span>
          </h1>
          <p className="text-xs text-slate-400">Répertoire complet des enseignants, personnels administratifs et techniques</p>
        </div>

        <button
          onClick={() => {
            setFormData({
              first_name: '', last_name: '', gender: 'M', phone: '', email: '', address: '',
              employee_type: 'permanent', department_name: 'Direction des Études & Pédagogie',
              position_name: 'Enseignant Titulaire', hire_date: new Date().toISOString().substring(0, 10),
              employment_status: 'actif', contract_type: 'CDI', base_salary: 250000,
              payment_method: 'virement', bank_name: 'NSIA Banque CI'
            });
            setShowAddModal(true);
          }}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Fiche Employé</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher nom, matricule, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              <option value="all">Tous les types</option>
              <option value="enseignant">Enseignants</option>
              <option value="permanent">Permanents</option>
              <option value="admin">Administratifs</option>
              <option value="technique">Technique / Services</option>
              <option value="prestataire">Prestataires</option>
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="en_conge">En Congé</option>
            <option value="suspendu">Suspendu</option>
            <option value="demissionnaire">Démissionnaire</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Matricule</th>
                <th className="py-3.5 px-4">Employé</th>
                <th className="py-3.5 px-4">Poste & Département</th>
                <th className="py-3.5 px-4">Contrat</th>
                <th className="py-3.5 px-4">Salaire de Base</th>
                <th className="py-3.5 px-4">Paiement</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-600">{emp.employee_number}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                        alt={emp.last_name}
                        className="w-9 h-9 rounded-xl object-cover ring-2 ring-brand-500/20"
                      />
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white">{emp.last_name} {emp.first_name}</div>
                        <div className="text-[10px] text-slate-400">{emp.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{emp.position_name || 'Non défini'}</div>
                    <div className="text-[10px] text-slate-400">{emp.department_name}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-md text-[10px]">
                      {emp.contract_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                    {formatFCFA(emp.base_salary)}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] font-semibold text-slate-600 dark:text-slate-400 capitalize">
                    {emp.payment_method}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      emp.employment_status === 'actif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      emp.employment_status === 'en_conge' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {emp.employment_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingEmployee(emp);
                          setFormData(emp);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-amber-500"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id, `${emp.first_name} ${emp.last_name}`)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950 rounded-lg text-rose-500"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Creation / Modification Employé */}
      {(showAddModal || editingEmployee) && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" />
                <span>{editingEmployee ? 'Modifier Fiche Employé' : 'Nouvelle Fiche Employé'}</span>
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditingEmployee(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
              {/* Infos Personnelles */}
              <div className="space-y-2">
                <h4 className="font-bold text-brand-600 uppercase text-[11px] border-b pb-1">1. Informations Personnelles</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Nom *</label>
                    <input type="text" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Prénom(s) *</label>
                    <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Genre</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as 'M' | 'F'})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                      <option value="M">Masculin (M)</option>
                      <option value="F">Féminin (F)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Téléphone *</label>
                    <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Infos Professionnelles */}
              <div className="space-y-2">
                <h4 className="font-bold text-brand-600 uppercase text-[11px] border-b pb-1">2. Informations Professionnelles & Contrat</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Type de Personnel</label>
                    <select value={formData.employee_type} onChange={e => setFormData({...formData, employee_type: e.target.value as EmployeeType})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                      <option value="enseignant">Enseignant / Professeur</option>
                      <option value="permanent">Permanent / Titulaire</option>
                      <option value="admin">Administration / Secrétariat</option>
                      <option value="technique">Services Techniques / Maintenance</option>
                      <option value="prestataire">Prestataire Externe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Type de Contrat</label>
                    <select value={formData.contract_type} onChange={e => setFormData({...formData, contract_type: e.target.value as ContractType})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="vacataire">Vacataire</option>
                      <option value="stage">Stage</option>
                      <option value="prestataire">Prestataire</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Intitulé du Poste</label>
                    <input type="text" value={formData.position_name} onChange={e => setFormData({...formData, position_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Département</label>
                    <input type="text" value={formData.department_name} onChange={e => setFormData({...formData, department_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Remunération & Paie */}
              <div className="space-y-2">
                <h4 className="font-bold text-brand-600 uppercase text-[11px] border-b pb-1">3. Salaire & Règlement (FCFA)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Salaire de Base Mensuel (FCFA) *</label>
                    <input type="number" required value={formData.base_salary} onChange={e => setFormData({...formData, base_salary: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-emerald-600" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Mode de Paiement</label>
                    <select value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value as PaymentMethod})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                      <option value="virement">Virement Bancaire</option>
                      <option value="mobile_money">Mobile Money (Wave / Orange / MTN)</option>
                      <option value="cheque">Chèque</option>
                      <option value="especes">Espèces</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Banque / Opérateur</label>
                    <input type="text" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">N° CNPS (Sécurité Sociale)</label>
                    <input type="text" value={formData.cnps_number} onChange={e => setFormData({...formData, cnps_number: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingEmployee(null); }} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md">Sauvegarder l'Employé</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
