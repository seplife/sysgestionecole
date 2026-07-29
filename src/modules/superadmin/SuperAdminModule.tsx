import React, { useState } from 'react';
import { ShieldCheck, Building2, Users, DollarSign, TrendingUp, Plus, CheckCircle2, ArrowRight, X, Save, School as SchoolIcon, Edit, Trash2, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { School, SchoolStatus } from '../../types/database';

export const SuperAdminModule: React.FC = () => {
  const { schools, currentSchool, setCurrentSchool, addNewSchool, updateSchool, deleteSchool } = useTenant();
  const { updateSchoolStatus, updateSubscriptionStatus } = useSubscription();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);

  const [newSchoolData, setNewSchoolData] = useState({
    name: '',
    registration_number: '',
    city: 'Abidjan',
    address: '',
    phone: '',
    email: '',
    director_name: '',
    school_type: 'Prive' as School['school_type'],
    education_levels: ['Secondaire']
  });

  const [editSchoolData, setEditSchoolData] = useState({
    name: '',
    registration_number: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    director_name: '',
    school_type: 'Prive' as School['school_type'],
    motto: ''
  });

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolData.name || !newSchoolData.registration_number) return;

    try {
      const createdSchool: Partial<School> = {
        name: newSchoolData.name,
        slug: newSchoolData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4),
        status: 'active',
        registration_number: newSchoolData.registration_number,
        motto: 'Foi, Discipline, Excellence',
        address: newSchoolData.address || 'Abidjan',
        city: newSchoolData.city,
        phone: newSchoolData.phone || '+225 27 22 00 00 00',
        whatsapp: newSchoolData.phone || '+225 07 00 00 00 00',
        email: newSchoolData.email || 'contact@ecole.ci',
        director_name: newSchoolData.director_name || 'Directeur Général',
        school_type: newSchoolData.school_type,
        logo_url: '/images/logoecole.png',
        education_levels: newSchoolData.education_levels,
        created_at: new Date().toISOString()
      };

      await addNewSchool(createdSchool as School);
      setShowAddModal(false);
      setNewSchoolData({
        name: '',
        registration_number: '',
        city: 'Abidjan',
        address: '',
        phone: '',
        email: '',
        director_name: '',
        school_type: 'Prive',
        education_levels: ['Secondaire']
      });
    } catch (err: any) {
      console.error('Error creating school in SuperAdminModule:', err);
    }
  };

  const handleOpenEditModal = (sch: School) => {
    setEditingSchool(sch);
    setEditSchoolData({
      name: sch.name,
      registration_number: sch.registration_number || '',
      city: sch.city || 'Abidjan',
      address: sch.address || '',
      phone: sch.phone || '',
      email: sch.email || '',
      director_name: sch.director_name || '',
      school_type: sch.school_type || 'Prive',
      motto: sch.motto || ''
    });
  };

  const handleSaveEditSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool || !editSchoolData.name || !editSchoolData.registration_number) return;

    updateSchool(editingSchool.id, editSchoolData);
    setEditingSchool(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingSchool) return;
    deleteSchool(deletingSchool.id);
    setDeletingSchool(null);
  };

  const calculateMrr = (schoolCount: number) => schoolCount * 350000;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Super Admin Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-purple-400/20 text-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-400/30">
            Plateforme SaaS IvoireÉcole+ Multi-Établissements
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Super Administrateur SaaS Dashboard
          </h1>
          <p className="text-purple-200 text-sm">Gestion centralisée des établissements abonnés et espaces clients isolés</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-white text-purple-900 hover:bg-purple-50 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Nouvel Établissement</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">MRR Récurrent Total</span>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {(calculateMrr(schools.length) / 1000).toFixed(0)}k <span className="text-xs font-normal text-slate-500">FCFA/mois</span>
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +22.4% la croissance SaaS
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Établissements Actifs</span>
            <Building2 className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {schools.length} <span className="text-xs font-normal text-slate-500">Espaces SaaS</span>
          </div>
          <div className="text-xs text-slate-500 font-semibold mt-1">100% Espaces Isolés & Sécurisés</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Espace Actif Sélectionné</span>
            <SchoolIcon className="w-5 h-5 text-brand-500" />
          </div>
          <div className="text-sm font-extrabold text-brand-600 truncate mt-1">
            {currentSchool.name}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">Matricule MENA: {currentSchool.registration_number}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Sécurité Multi-Tenants</span>
            <ShieldCheck className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
            Isolation Supabase & Cache
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Données Garanties & Permanentes</div>
        </div>
      </div>

      {/* Subscriptions / Schools Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Portefeuille des Établissements sous Abonnement SaaS</h3>
          <span className="text-xs text-slate-400 font-medium">{schools.length} établissement(s) configuré(s)</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <th className="p-3">Établissement</th>
                <th className="p-3">Code / Agrément MENA</th>
                <th className="p-3">Ville</th>
                <th className="p-3">Directeur</th>
                <th className="p-3">Statut Espace</th>
                <th className="p-3 text-right">Actions Client SaaS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {schools.map((sch: School) => {
                const isActiveWorkspace = sch.id === currentSchool.id;
                return (
                  <tr key={sch.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isActiveWorkspace ? 'bg-brand-50/40 dark:bg-brand-900/10' : ''}`}>
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <SchoolIcon className="w-4 h-4 text-brand-500 shrink-0" />
                      <span>{sch.name}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-600">{sch.registration_number}</td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{sch.city}</td>
                    <td className="p-3 font-medium">{sch.director_name}</td>
                    <td className="p-3">
                      {sch.status === 'suspended' ? (
                        <span className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                          <Lock className="w-3 h-3 text-red-500" /> Suspendu
                        </span>
                      ) : isActiveWorkspace ? (
                        <span className="bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Espace En Cours
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Espace Actif
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setCurrentSchool(sch)}
                          disabled={isActiveWorkspace}
                          title={isActiveWorkspace ? 'Espace actuellement actif' : 'Accéder à cet espace client'}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1 transition-all ${
                            isActiveWorkspace
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 cursor-default'
                              : 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs'
                          }`}
                        >
                          <span>{isActiveWorkspace ? 'Espace Sélectionné' : 'Administrer'}</span>
                          {!isActiveWorkspace && <ArrowRight className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => {
                            const newStatus: SchoolStatus = sch.status === 'suspended' ? 'active' : 'suspended';
                            updateSchoolStatus(sch.id, newStatus);
                          }}
                          title={sch.status === 'suspended' ? 'Réactiver l\'accès à cet établissement' : 'Suspendre l\'accès à cet établissement'}
                          className={`p-1.5 rounded-xl transition-all border ${
                            sch.status === 'suspended'
                              ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40'
                              : 'text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {sch.status === 'suspended' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(sch)}
                          title="Modifier cet établissement client"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-all border border-slate-200 dark:border-slate-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingSchool(sch)}
                          title="Supprimer cet établissement client"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all border border-slate-200 dark:border-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Adding New Client School */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span>Créer un Nouvel Établissement Client (Tenant Multi-Écoles)</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de l'Établissement *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: COLLÈGE NOTRE DAME D'AFRIQUE"
                  value={newSchoolData.name}
                  onChange={(e) => setNewSchoolData({ ...newSchoolData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Code / Agrément MENA *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 008920/MENA"
                    value={newSchoolData.registration_number}
                    onChange={(e) => setNewSchoolData({ ...newSchoolData, registration_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ville / Commune</label>
                  <input
                    type="text"
                    placeholder="ex: Abidjan (Cocody)"
                    value={newSchoolData.city}
                    onChange={(e) => setNewSchoolData({ ...newSchoolData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du Directeur / Responsable</label>
                  <input
                    type="text"
                    placeholder="ex: Mme Marie-Chantal KOFFI"
                    value={newSchoolData.director_name}
                    onChange={(e) => setNewSchoolData({ ...newSchoolData, director_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Téléphone Établissement</label>
                  <input
                    type="text"
                    placeholder="ex: +225 07 00 11 22 33"
                    value={newSchoolData.phone}
                    onChange={(e) => setNewSchoolData({ ...newSchoolData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Créer l'Établissement Client SaaS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Editing Client School */}
      {editingSchool && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-500" />
                <span>Modifier l'Établissement Client</span>
              </h3>
              <button onClick={() => setEditingSchool(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSchool} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de l'Établissement *</label>
                <input
                  type="text"
                  required
                  value={editSchoolData.name}
                  onChange={(e) => setEditSchoolData({ ...editSchoolData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Code / Agrément MENA *</label>
                  <input
                    type="text"
                    required
                    value={editSchoolData.registration_number}
                    onChange={(e) => setEditSchoolData({ ...editSchoolData, registration_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ville / Commune</label>
                  <input
                    type="text"
                    value={editSchoolData.city}
                    onChange={(e) => setEditSchoolData({ ...editSchoolData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du Directeur / Responsable</label>
                  <input
                    type="text"
                    value={editSchoolData.director_name}
                    onChange={(e) => setEditSchoolData({ ...editSchoolData, director_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Téléphone Établissement</label>
                  <input
                    type="text"
                    value={editSchoolData.phone}
                    onChange={(e) => setEditSchoolData({ ...editSchoolData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email de Contact</label>
                  <input
                    type="email"
                    value={editSchoolData.email}
                    onChange={(e) => setEditSchoolData({ ...editSchoolData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Devise de l'École</label>
                  <input
                    type="text"
                    value={editSchoolData.motto}
                    onChange={(e) => setEditSchoolData({ ...editSchoolData, motto: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl italic"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSchool(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer les Modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Deleting Client School */}
      {deletingSchool && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Supprimer le Client SaaS</h3>
                <p className="text-xs text-slate-500">Action de suppression définitive</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{deletingSchool.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">Matricule: {deletingSchool.registration_number}</p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Êtes-vous sûr de vouloir supprimer cet établissement du portefeuille SaaS ? Les données associées et l'accès client seront révoqués.
            </p>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingSchool(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la Suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
