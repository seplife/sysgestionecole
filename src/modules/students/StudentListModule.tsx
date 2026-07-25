import React, { useState, useEffect } from 'react';
import { 
  Users, Search, UserPlus, Filter, QrCode, Eye, 
  MoreVertical, CheckCircle2, ShieldAlert, Download, RefreshCw, Edit2, Trash2, X, Save, Upload
} from 'lucide-react';
import { Student, SchoolClass } from '../../types/database';
import { supabaseService } from '../../services/supabaseService';
import { accessControlService } from '../../services/accessControlService';
import { useSubscription } from '../../context/SubscriptionContext';
import { StudentCardModal } from './StudentCardModal';
import { RegistrationWizardModule } from './RegistrationWizardModule';

export const StudentListModule: React.FC = () => {
  const { currentPlan } = useSubscription();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('Tous');
  const [activeCardStudent, setActiveCardStudent] = useState<Student | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [limitAlert, setLimitAlert] = useState<string | null>(null);

  const [classesList, setClassesList] = useState<SchoolClass[]>([]);

  useEffect(() => {
    supabaseService.fetchStudents().then(data => {
      setStudents(data);
      setLoading(false);
    });
    supabaseService.fetchClasses().then(data => setClassesList(data));
  }, []);

  const filteredStudents = students.filter(s => {
    const matchesSearch = `${s.first_name} ${s.last_name} ${s.registration_number}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'Tous' || s.current_class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleStudentAdded = (newStudent: Student) => {
    setStudents([newStudent, ...students]);
    supabaseService.saveStudent(newStudent);
    setShowWizard(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
    supabaseService.saveStudent(editingStudent);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer l'élève ${name} ?`)) {
      setStudents(students.filter(s => s.id !== id));
      supabaseService.deleteStudent(id);
    }
  };

  if (showWizard) {
    return (
      <RegistrationWizardModule 
        classesList={classesList}
        onComplete={handleStudentAdded}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-500" />
            <span>Gestion des Élèves ({students.length})</span>
          </h1>
          <p className="text-xs text-slate-400">Repertoire complet des matricules MENA et dossiers scolaires</p>
        </div>

        <button
          onClick={() => {
            const check = accessControlService.checkPlanLimit(students.length, currentPlan?.max_students ?? 500);
            if (check.reached) {
              setLimitAlert(check.message || 'Limite du forfait atteinte.');
            } else {
              setLimitAlert(null);
              setShowWizard(true);
            }
          }}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouvelle Inscription / Réinscription</span>
        </button>
      </div>

      {limitAlert && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-4 rounded-2xl text-xs text-red-700 dark:text-red-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-500" />
            <span className="font-bold">{limitAlert}</span>
          </div>
          <button onClick={() => setLimitAlert(null)} className="text-slate-400 hover:text-slate-600 font-bold px-2">X</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par Matricule (ex: 24180492A), Nom ou Prénom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-4 h-4" />
            <span>Classe :</span>
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="Tous">Toutes les classes</option>
            {classesList.map(cls => (
              <option key={cls.id} value={cls.name}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Cards Grid / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Élève & Photo</th>
                <th className="py-3.5 px-4">Matricule MENA</th>
                <th className="py-3.5 px-4">Classe</th>
                <th className="py-3.5 px-4">Sexe / Sang</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 flex items-center space-x-3">
                    <img 
                      src={std.photo_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100'} 
                      alt={std.first_name} 
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{std.last_name} {std.first_name}</div>
                      <div className="text-xs text-slate-400">{std.place_of_birth} ({std.date_of_birth})</div>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                    {std.registration_number}
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-bold">
                      {std.current_class_name || 'Non affecté'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-xs">
                    <div>Sexe: <span className="font-bold">{std.gender}</span></div>
                    <div className="text-slate-400">Sang: {std.blood_group || 'O+'}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      std.status === 'Inscrit' || std.status === 'Reinscrit'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {std.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActiveCardStudent(std)}
                        className="bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:hover:bg-brand-900 dark:text-brand-300 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1"
                        title="Carte d'élève QR"
                      >
                        <QrCode className="w-3.5 h-3.5 text-brand-500" />
                        <span className="hidden sm:inline">QR</span>
                      </button>

                      <button
                        onClick={() => setEditingStudent(std)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 p-1.5 rounded-lg transition-colors"
                        title="Modifier l'élève"
                      >
                        <Edit2 className="w-4 h-4 text-amber-500" />
                      </button>

                      <button
                        onClick={() => handleDeleteStudent(std.id, `${std.first_name} ${std.last_name}`)}
                        className="bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-200 p-1.5 rounded-lg transition-colors"
                        title="Supprimer l'élève"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Student */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>Modifier le Dossier Élève</span>
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <img 
                  src={editingStudent.photo_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100'} 
                  alt="Élève" 
                  className="w-14 h-14 rounded-xl object-cover border-2 border-brand-500" 
                />
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Photo d'Identité de l'Élève</label>
                  <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1 mt-1 shadow-xs">
                    <Upload className="w-3 h-3" />
                    <span>Téléverser Nouvelle Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditingStudent({ ...editingStudent, photo_url: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Matricule MENA (Saisi)</label>
                <input 
                  type="text" 
                  required
                  value={editingStudent.registration_number}
                  onChange={(e) => setEditingStudent({...editingStudent, registration_number: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold text-brand-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom</label>
                  <input 
                    type="text" 
                    required
                    value={editingStudent.last_name}
                    onChange={(e) => setEditingStudent({...editingStudent, last_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prénom(s)</label>
                  <input 
                    type="text" 
                    required
                    value={editingStudent.first_name}
                    onChange={(e) => setEditingStudent({...editingStudent, first_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Classe</label>
                  <select 
                    value={editingStudent.current_class_name || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, current_class_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                  >
                    {classesList.length > 0 ? (
                      classesList.map(cls => (
                        <option key={cls.id} value={cls.name}>{cls.name}</option>
                      ))
                    ) : (
                      <option value="">Aucune classe disponible</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Statut</label>
                  <select 
                    value={editingStudent.status}
                    onChange={(e) => setEditingStudent({...editingStudent, status: e.target.value as any})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                  >
                    <option value="Inscrit">Inscrit</option>
                    <option value="Reinscrit">Réinscrit</option>
                    <option value="Transfere">Transféré</option>
                    <option value="Radie">Radié</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date de Naissance</label>
                  <input 
                    type="date" 
                    value={editingStudent.date_of_birth}
                    onChange={(e) => setEditingStudent({...editingStudent, date_of_birth: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lieu de Naissance</label>
                  <input 
                    type="text" 
                    value={editingStudent.place_of_birth}
                    onChange={(e) => setEditingStudent({...editingStudent, place_of_birth: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer les Modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Badge Viewer */}
      {activeCardStudent && (
        <StudentCardModal 
          student={activeCardStudent}
          onClose={() => setActiveCardStudent(null)}
        />
      )}
    </div>
  );
};
