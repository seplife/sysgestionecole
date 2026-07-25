import React, { useState, useEffect } from 'react';
import { BookOpen, Phone, Mail, Award, Calendar, Plus, Edit2, Trash2, ShieldCheck, X, Save, UserCheck, Upload } from 'lucide-react';
import { UserProfile, UserRole, Subject } from '../../types/database';
import { supabaseService } from '../../services/supabaseService';

export const TeachersModule: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'teachers' | 'admin'>('teachers');
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);

  useEffect(() => {
    supabaseService.fetchStaff().then(data => setStaffList(data));
    supabaseService.fetchSubjects().then(sbjs => setSubjectList(sbjs));
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [newStaff, setNewStaff] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'enseignant' as UserRole,
    subject_name: 'Mathématiques',
    avatar_url: ''
  });

  const filteredStaff = staffList.filter(s => {
    if (activeCategory === 'teachers') return s.role === 'enseignant' || s.role === 'prof_principal';
    return s.role !== 'enseignant' && s.role !== 'prof_principal' && s.role !== 'parent' && s.role !== 'eleve';
  });

  const handlePhotoUploadNew = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStaff(prev => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUploadEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingStaff) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingStaff({ ...editingStaff, avatar_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const created: UserProfile = {
      id: `usr-${Date.now()}`,
      organization_id: 'org-saint-viateur-01',
      school_id: 'school-palmeraie-01',
      first_name: newStaff.first_name,
      last_name: newStaff.last_name,
      email: newStaff.email,
      phone: newStaff.phone,
      role: newStaff.role,
      subject_name: (newStaff.role === 'enseignant' || newStaff.role === 'prof_principal') ? newStaff.subject_name : undefined,
      is_active: true,
      avatar_url: newStaff.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
    };
    setStaffList([...staffList, created]);
    supabaseService.saveStaff(created);
    setShowAddModal(false);
    setNewStaff({ first_name: '', last_name: '', email: '', phone: '', role: 'enseignant', subject_name: 'Mathématiques', avatar_url: '' });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setStaffList(staffList.map(s => s.id === editingStaff.id ? editingStaff : s));
    supabaseService.saveStaff(editingStaff);
    setEditingStaff(null);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (window.confirm(`Voulez-vous supprimer le profil de ${name} ?`)) {
      setStaffList(staffList.filter(s => s.id !== id));
      supabaseService.deleteStaff(id);
    }
  };

  const getRoleBadgeLabel = (role: UserRole) => {
    switch (role) {
      case 'enseignant': return 'Professeur Titulaire';
      case 'prof_principal': return 'Professeur Principal';
      case 'educateur': return 'Éducateur Référent';
      case 'censeur': return 'Censeur / Directeur des Études';
      case 'comptable': return 'Chef Comptable';
      case 'secretaire': return 'Secrétaire Générale';
      case 'surveillant': return 'Surveillant Général';
      default: return role;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-brand-500" />
            <span>Enseignants & Personnel Administratif ({filteredStaff.length})</span>
          </h1>
          <p className="text-xs text-slate-400">Gestion des professeurs, éducateurs, censeurs et personnels de direction</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveCategory('teachers')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeCategory === 'teachers' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Enseignants
            </button>
            <button
              onClick={() => setActiveCategory('admin')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeCategory === 'admin' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Personnel Admin & Direction
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Membre du Personnel</span>
          </button>
        </div>
      </div>

      {/* Grid of Staff Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((tch) => (
          <div key={tch.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={tch.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'} 
                  alt={tch.last_name} 
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-brand-500/20"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{tch.last_name} {tch.first_name}</h3>
                  <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5">
                    {getRoleBadgeLabel(tch.role)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingStaff(tch)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-amber-500"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteStaff(tch.id, `${tch.first_name} ${tch.last_name}`)}
                  className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950 rounded-lg text-rose-500"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-xs space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
              {tch.subject_name && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 font-bold text-brand-600 dark:text-brand-400"><BookOpen className="w-3.5 h-3.5" /> Matière Enseignée:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800">{tch.subject_name}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> Tél:</span>
                <span className="font-mono font-bold">{tch.phone}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> Email:</span>
                <span className="truncate max-w-[150px] font-medium">{tch.email}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">Statut du Compte:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Compte Actif
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Staff */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                <span>Ajouter un Membre du Personnel</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center font-bold text-brand-700 dark:text-brand-300 overflow-hidden border">
                  {newStaff.avatar_url ? (
                    <img src={newStaff.avatar_url} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Photo du Membre</label>
                  <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1 mt-1 shadow-xs">
                    <Upload className="w-3 h-3" />
                    <span>Téléverser Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUploadNew} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom *</label>
                  <input type="text" required placeholder="ex: KOUASSI" value={newStaff.last_name} onChange={(e) => setNewStaff({...newStaff, last_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prénom(s) *</label>
                  <input type="text" required placeholder="ex: Paul" value={newStaff.first_name} onChange={(e) => setNewStaff({...newStaff, first_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rôle / Fonction *</label>
                <select 
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({...newStaff, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="enseignant">Professeur / Enseignant</option>
                  <option value="prof_principal">Professeur Principal</option>
                  <option value="educateur">Éducateur</option>
                  <option value="censeur">Censeur / Directeur des Études</option>
                  <option value="comptable">Comptable</option>
                  <option value="secretaire">Secrétaire</option>
                  <option value="surveillant">Surveillant Général</option>
                </select>
              </div>

              {(newStaff.role === 'enseignant' || newStaff.role === 'prof_principal') && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Matière / Discipline Enseignée *</label>
                  <select
                    value={newStaff.subject_name}
                    onChange={(e) => setNewStaff({ ...newStaff, subject_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    {subjectList.length > 0 ? (
                      subjectList.map(sbj => (
                        <option key={sbj.id} value={sbj.name}>{sbj.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Mathématiques">Mathématiques</option>
                        <option value="Français (Oral/Gram, Rédaction)">Français (Oral/Gram, Rédaction)</option>
                        <option value="Anglais">Anglais</option>
                        <option value="Physique-Chimie">Physique-Chimie</option>
                        <option value="Sciences de la Vie et de la Terre">Sciences de la Vie et de la Terre (SVT)</option>
                        <option value="Histoire-Géographie">Histoire-Géographie</option>
                        <option value="E.P.S.">E.P.S. (Éducation Physique)</option>
                        <option value="E.D.H.C.">E.D.H.C.</option>
                        <option value="Philosophie">Philosophie</option>
                        <option value="Arts Plastiques / Éd. Musicale">Arts Plastiques / Éd. Musicale</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Téléphone *</label>
                <input type="text" required placeholder="+225 0500000000" value={newStaff.phone} onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Professionnel</label>
                <input type="email" required placeholder="nom@saintviateur.ci" value={newStaff.email} onChange={(e) => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Staff */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>Modifier le Profil</span>
              </h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <img src={editingStaff.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'} alt="Avatar" className="w-12 h-12 rounded-xl object-cover border-2 border-brand-500" />
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Photo du Membre</label>
                  <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1 mt-1 shadow-xs">
                    <Upload className="w-3 h-3" />
                    <span>Changer la Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUploadEdit} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom</label>
                  <input type="text" required value={editingStaff.last_name} onChange={(e) => setEditingStaff({...editingStaff, last_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prénom(s)</label>
                  <input type="text" required value={editingStaff.first_name} onChange={(e) => setEditingStaff({...editingStaff, first_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rôle</label>
                <select value={editingStaff.role} onChange={(e) => setEditingStaff({...editingStaff, role: e.target.value as UserRole})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                  <option value="enseignant">Professeur / Enseignant</option>
                  <option value="prof_principal">Professeur Principal</option>
                  <option value="educateur">Éducateur</option>
                  <option value="censeur">Censeur / Directeur des Études</option>
                  <option value="comptable">Comptable</option>
                  <option value="secretaire">Secrétaire</option>
                  <option value="surveillant">Surveillant Général</option>
                </select>
              </div>

              {(editingStaff.role === 'enseignant' || editingStaff.role === 'prof_principal') && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Matière / Discipline Enseignée *</label>
                  <select
                    value={editingStaff.subject_name || 'Mathématiques'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, subject_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    {subjectList.length > 0 ? (
                      subjectList.map(sbj => (
                        <option key={sbj.id} value={sbj.name}>{sbj.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Mathématiques">Mathématiques</option>
                        <option value="Français (Oral/Gram, Rédaction)">Français (Oral/Gram, Rédaction)</option>
                        <option value="Anglais">Anglais</option>
                        <option value="Physique-Chimie">Physique-Chimie</option>
                        <option value="Sciences de la Vie et de la Terre">Sciences de la Vie et de la Terre (SVT)</option>
                        <option value="Histoire-Géographie">Histoire-Géographie</option>
                        <option value="E.P.S.">E.P.S. (Éducation Physique)</option>
                        <option value="E.D.H.C.">E.D.H.C.</option>
                        <option value="Philosophie">Philosophie</option>
                        <option value="Arts Plastiques / Éd. Musicale">Arts Plastiques / Éd. Musicale</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                <input type="text" required value={editingStaff.phone} onChange={(e) => setEditingStaff({...editingStaff, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono" />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingStaff(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
