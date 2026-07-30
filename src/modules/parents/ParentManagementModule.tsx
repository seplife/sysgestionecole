import React, { useState, useEffect } from 'react';
import { UserCheck, Phone, MessageSquare, Search, Plus, ShieldCheck, Edit2, Trash2, X, Save, Upload } from 'lucide-react';
import { Parent } from '../../types/database';
import { supabaseService } from '../../services/supabaseService';

export const ParentManagementModule: React.FC = () => {
  const [search, setSearch] = useState('');
  const [parents, setParents] = useState<Parent[]>([]);

  useEffect(() => {
    supabaseService.fetchParents().then(data => setParents(data));
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [newParent, setNewParent] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    profession: '',
    address: '',
    photo_url: ''
  });

  const filteredParents = parents.filter(p => 
    `${p.first_name} ${p.last_name} ${p.phone} ${p.profession}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handlePhotoUploadNew = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewParent(prev => ({ ...prev, photo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddParent = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Parent = {
      id: `prt-${Date.now()}`,
      organization_id: 'org-saint-viateur-01',
      school_id: 'school-palmeraie-01',
      first_name: newParent.first_name,
      last_name: newParent.last_name,
      phone: newParent.phone,
      whatsapp: newParent.whatsapp || newParent.phone,
      email: newParent.email,
      profession: newParent.profession,
      address: newParent.address,
      children: []
    };
    setParents([created, ...parents]);
    supabaseService.saveParent(created);
    setShowAddModal(false);
    setNewParent({ first_name: '', last_name: '', phone: '', whatsapp: '', email: '', profession: '', address: '', photo_url: '' });
  };

  const handlePhotoUploadEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingParent) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingParent({
          ...editingParent,
          children: editingParent.children?.length ? [
            { ...editingParent.children[0], photo_url: reader.result as string },
            ...editingParent.children.slice(1)
          ] : [
            {
              id: `std-${Date.now()}`,
              organization_id: 'org-saint-viateur-01',
              school_id: 'school-palmeraie-01',
              registration_number: '24180492A',
              first_name: editingParent.first_name,
              last_name: editingParent.last_name,
              date_of_birth: '2011-04-12',
              place_of_birth: 'Abidjan',
              gender: 'F',
              nationality: 'Ivoirienne',
              status: 'Inscrit',
              photo_url: reader.result as string
            }
          ]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;
    setParents(parents.map(p => p.id === editingParent.id ? editingParent : p));
    supabaseService.saveParent(editingParent);
    setEditingParent(null);
  };

  const handleDeleteParent = (id: string, name: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer le parent ${name} ?`)) {
      setParents(parents.filter(p => p.id !== id));
      supabaseService.deleteParent(id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-brand-500" />
            <span>Parents & Tuteurs Rattachés ({parents.length})</span>
          </h1>
          <p className="text-xs text-slate-400">Gestion des représentants légaux et canaux de notification WhatsApp</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Parent / Tuteur</span>
        </button>
      </div>

      {/* Parent Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom de parent, numéro WhatsApp, profession..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Parents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredParents.map((parent) => (
          <div key={parent.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {parent.children?.[0]?.photo_url ? (
                  <img src={parent.children[0].photo_url} alt={parent.last_name} className="w-12 h-12 rounded-xl object-cover border-2 border-brand-500" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 font-extrabold flex items-center justify-center text-lg border border-brand-200">
                    {parent.first_name[0]}{parent.last_name[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{parent.last_name} {parent.first_name}</h3>
                  <div className="text-xs text-slate-400">{parent.profession || 'Parent d\'élève'}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingParent(parent)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-amber-500"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteParent(parent.id, `${parent.first_name} ${parent.last_name}`)}
                  className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950 rounded-lg text-rose-500"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-xs space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> Téléphone:</span>
                <span className="font-mono font-bold">{parent.phone}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp:</span>
                <a 
                  href={`https://wa.me/${(parent.whatsapp || '').replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-mono font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <span>{parent.whatsapp || parent.phone}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">Chat</span>
                </a>
              </div>
              {parent.email && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{parent.email}</span>
                </div>
              )}
            </div>

            {/* Children Linked */}
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">Enfants Scolarisés</div>
              <div className="space-y-2">
                {parent.children && parent.children.length > 0 ? (
                  parent.children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/50 p-2.5 rounded-xl text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{child.last_name} {child.first_name}</div>
                        <div className="text-[10px] text-slate-400">Matricule: {child.registration_number}</div>
                      </div>
                      <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {child.current_class_name}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic">Aucun enfant directement rattaché</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Parent */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                <span>Nouveau Parent / Tuteur</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddParent} className="space-y-3 text-xs">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center font-bold text-brand-700 dark:text-brand-300 overflow-hidden border">
                  {newParent.photo_url ? (
                    <img src={newParent.photo_url} alt="Parent" className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Photo d'Identité du Parent / Tuteur</label>
                  <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1 mt-1 shadow-xs">
                    <Upload className="w-3 h-3" />
                    <span>Téléverser Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUploadNew} 
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ex: KOUASSI"
                    value={newParent.last_name}
                    onChange={(e) => setNewParent({...newParent, last_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prénom(s) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ex: Jean"
                    value={newParent.first_name}
                    onChange={(e) => setNewParent({...newParent, first_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Téléphone *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+225 0700000000"
                    value={newParent.phone}
                    onChange={(e) => setNewParent({...newParent, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Numéro WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="+225 0700000000"
                    value={newParent.whatsapp}
                    onChange={(e) => setNewParent({...newParent, whatsapp: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Profession</label>
                <input 
                  type="text" 
                  placeholder="ex: Enseignant, Commerçant..."
                  value={newParent.profession}
                  onChange={(e) => setNewParent({...newParent, profession: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Adresse de résidence</label>
                <input 
                  type="text" 
                  placeholder="ex: Abidjan Cocody Riviera 3"
                  value={newParent.address}
                  onChange={(e) => setNewParent({...newParent, address: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md"
                >
                  Créer le Parent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Parent */}
      {editingParent && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>Modifier le Parent</span>
              </h3>
              <button onClick={() => setEditingParent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center font-bold text-brand-700 dark:text-brand-300 overflow-hidden border">
                  {editingParent.children?.[0]?.photo_url ? (
                    <img src={editingParent.children[0].photo_url} alt="Parent" className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Photo d'Identité du Parent / Tuteur</label>
                  <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1 mt-1 shadow-xs">
                    <Upload className="w-3 h-3" />
                    <span>Changer la Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUploadEdit} 
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom</label>
                  <input 
                    type="text" 
                    required
                    value={editingParent.last_name}
                    onChange={(e) => setEditingParent({...editingParent, last_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prénom(s)</label>
                  <input 
                    type="text" 
                    required
                    value={editingParent.first_name}
                    onChange={(e) => setEditingParent({...editingParent, first_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                  <input 
                    type="text" 
                    required
                    value={editingParent.phone || ''}
                    onChange={(e) => setEditingParent({...editingParent, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
                  <input 
                    type="text" 
                    value={editingParent.whatsapp || ''}
                    onChange={(e) => setEditingParent({...editingParent, whatsapp: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Profession</label>
                <input 
                  type="text" 
                  value={editingParent.profession || ''}
                  onChange={(e) => setEditingParent({...editingParent, profession: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingParent(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Sauvegarder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
