import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Users, Plus, Edit2, Trash2, Shield, Settings, X, Save } from 'lucide-react';
import { SchoolClass, Subject, Student } from '../../types/database';
import { supabaseService } from '../../services/supabaseService';
import { useTenant } from '../../context/TenantContext';
import { DEFAULT_SCHOOL_ID, generateUUID } from '../../services/tenantService';
import { toValidUuid } from '../../services/supabaseService';

export const ClassesModule: React.FC = () => {
  const { currentSchool } = useTenant();
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');

  useEffect(() => {
    supabaseService.fetchClasses().then(data => setClassesList(data));
    supabaseService.fetchSubjects().then(data => setSubjectsList(data));
    supabaseService.fetchStudents().then(stds => setStudentsList(stds));
  }, []);

  // Modal states for Classes
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [newClass, setNewClass] = useState({
    name: '',
    level_name: '3ème',
    room_number: 'B-01',
    capacity: 45,
    main_teacher_name: 'Dr. Yao KOUADIO'
  });

  // Modal states for Subjects
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectLevelFilter, setSubjectLevelFilter] = useState<string>('Tous');
  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    category: 'Scientifique',
    coefficient: 3.0,
    level_name: 'Tous les niveaux'
  });

  // Class CRUD handlers
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const created: SchoolClass = {
      id: generateUUID(),
      school_id: currentSchool.id || DEFAULT_SCHOOL_ID,
      academic_year_id: toValidUuid('ay-2025-2026'),
      level_id: toValidUuid('lvl-gen'),
      level_name: newClass.level_name,
      name: newClass.name,
      room_number: newClass.room_number,
      capacity: newClass.capacity,
      student_count: 0,
      main_teacher_name: newClass.main_teacher_name
    };
    setClassesList([...classesList, created]);
    supabaseService.saveClass(created);
    setShowAddClassModal(false);
    setNewClass({ name: '', level_name: '3ème', room_number: 'B-01', capacity: 45, main_teacher_name: 'Dr. Yao KOUADIO' });
  };

  const handleSaveEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    setClassesList(classesList.map(c => c.id === editingClass.id ? editingClass : c));
    supabaseService.saveClass(editingClass);
    setEditingClass(null);
  };

  const handleDeleteClass = (id: string, name: string) => {
    if (window.confirm(`Supprimer la classe ${name} ?`)) {
      setClassesList(classesList.filter(c => c.id !== id));
      supabaseService.deleteClass(id);
    }
  };

  // Subject CRUD handlers
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Subject = {
      id: `sbj-${Date.now()}`,
      school_id: currentSchool.id || DEFAULT_SCHOOL_ID,
      code: newSubject.code.toUpperCase(),
      name: newSubject.name,
      category: newSubject.category,
      coefficient: newSubject.coefficient,
      level_name: newSubject.level_name
    };
    setSubjectsList([...subjectsList, created]);
    supabaseService.saveSubject(created);
    setShowAddSubjectModal(false);
    setNewSubject({ code: '', name: '', category: 'Scientifique', coefficient: 3.0, level_name: 'Tous les niveaux' });
  };

  const handleSaveEditSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    setSubjectsList(subjectsList.map(s => s.id === editingSubject.id ? editingSubject : s));
    supabaseService.saveSubject(editingSubject);
    setEditingSubject(null);
  };

  const handleDeleteSubject = (id: string, name: string) => {
    if (window.confirm(`Supprimer la matière ${name} ?`)) {
      setSubjectsList(subjectsList.filter(s => s.id !== id));
      supabaseService.deleteSubject(id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-brand-500" />
            <span>Structure Pédagogique & Matières</span>
          </h1>
          <p className="text-xs text-slate-400">Configuration des niveaux (CP1 à Terminale), salles et coefficients MENA</p>
        </div>

        {/* Tab Toggle & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'classes' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Classes & Niveaux ({classesList.length})
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'subjects' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Matières & Coefficients ({subjectsList.length})
            </button>
          </div>

          {activeTab === 'classes' ? (
            <button 
              onClick={() => setShowAddClassModal(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une Classe</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowAddSubjectModal(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une Matière</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'classes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classesList.map((cls) => {
            const actualCount = studentsList.filter(s => s.current_class_name === cls.name).length;
            const displayCount = actualCount;

            return (
              <div key={cls.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {cls.level_name}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{cls.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setEditingClass(cls)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-amber-500"
                      title="Modifier la classe"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls.id, cls.name)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 rounded-lg text-rose-500"
                      title="Supprimer la classe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Salle de classe:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{cls.room_number || 'Non attribuée'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Effectif Inscrit:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{displayCount} / {cls.capacity} élèves</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((displayCount / (cls.capacity || 45)) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-slate-500 pt-1">
                    <span>Professeur Principal:</span>
                    <span className="font-bold text-brand-600">{cls.main_teacher_name || 'Non attribué'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Level Filter Bar & Coefficients Counter */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Filtrer par Niveau / Série:</span>
              <select
                value={subjectLevelFilter}
                onChange={(e) => setSubjectLevelFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-brand-600 outline-none"
              >
                <option value="Tous">Toutes les matières & tous les niveaux</option>
                <option value="6ème / 5ème">6ème & 5ème (1er Cycle - Total 17 Coef)</option>
                <option value="4ème / 3ème">4ème & 3ème (1er Cycle - Total 19 Coef)</option>
                <option value="Tle D">Terminale D (2nd Cycle - Total 23 Coef)</option>
                <option value="Tle A">Terminale A (2nd Cycle - Total 27/25 Coef)</option>
              </select>
            </div>

            <div className="bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-extrabold text-xs px-3.5 py-2 rounded-xl border border-brand-200 dark:border-brand-800">
              Total Coefficients {subjectLevelFilter !== 'Tous' ? `(${subjectLevelFilter})` : ''}: {
                subjectsList
                  .filter(s => subjectLevelFilter === 'Tous' || !s.level_name || s.level_name === subjectLevelFilter)
                  .reduce((sum, s) => sum + (s.coefficient || 1), 0)
              }
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Nom de la Matière</th>
                  <th className="py-3.5 px-4">Niveau / Série Concerné</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Coefficient Officiel</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjectsList
                  .filter(s => subjectLevelFilter === 'Tous' || !s.level_name || s.level_name === subjectLevelFilter)
                  .map((sbj) => (
                    <tr key={sbj.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-brand-600">{sbj.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{sbj.name}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-indigo-600">
                        {sbj.level_name || 'Tous les niveaux'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{sbj.category}</span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-base text-slate-900 dark:text-white">
                        Coef. {sbj.coefficient}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingSubject(sbj)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-amber-500"
                            title="Modifier le coefficient / la matière"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(sbj.id, sbj.name)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950 rounded-lg text-rose-500"
                            title="Supprimer la matière"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Class */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                <span>Créer une Nouvelle Classe</span>
              </h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de la Classe *</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: 3ème 3, 6ème 2..."
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Niveau & Série *</label>
                  <select 
                    value={newClass.level_name}
                    onChange={(e) => setNewClass({...newClass, level_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-brand-600"
                  >
                    <optgroup label="Premier Cycle (Collège)">
                      <option value="6ème">6ème (Premier Cycle)</option>
                      <option value="5ème">5ème (Premier Cycle)</option>
                      <option value="4ème">4ème (Premier Cycle)</option>
                      <option value="3ème">3ème (Classe Examen BEPC)</option>
                    </optgroup>
                    <optgroup label="Second Cycle - Seconde (Lycée)">
                      <option value="2nde A">2nde A (Littéraire)</option>
                      <option value="2nde C">2nde C (Scientifique)</option>
                    </optgroup>
                    <optgroup label="Second Cycle - Première (Lycée)">
                      <option value="1ère A1">1ère A1 (Littéraire Math)</option>
                      <option value="1ère A2">1ère A2 (Littéraire)</option>
                      <option value="1ère C">1ère C (Maths-Physique)</option>
                      <option value="1ère D">1ère D (Sciences Nat.)</option>
                    </optgroup>
                    <optgroup label="Second Cycle - Terminale (Examen BAC)">
                      <option value="Tle A1">Tle A1 (BAC Littéraire Math)</option>
                      <option value="Tle A2">Tle A2 (BAC Littéraire)</option>
                      <option value="Tle C">Tle C (BAC Maths-Physique)</option>
                      <option value="Tle D">Tle D (BAC Sciences Nat.)</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Salle</label>
                  <input 
                    type="text" 
                    value={newClass.room_number}
                    onChange={(e) => setNewClass({...newClass, room_number: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Capacité Max (Élèves)</label>
                <input 
                  type="number" 
                  value={newClass.capacity}
                  onChange={(e) => setNewClass({...newClass, capacity: parseInt(e.target.value) || 40})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Professeur Principal</label>
                <input 
                  type="text" 
                  value={newClass.main_teacher_name}
                  onChange={(e) => setNewClass({...newClass, main_teacher_name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddClassModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Class */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>Modifier la Classe</span>
              </h3>
              <button onClick={() => setEditingClass(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEditClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de la Classe</label>
                <input 
                  type="text" 
                  required
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({...editingClass, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Salle</label>
                  <input 
                    type="text" 
                    value={editingClass.room_number || ''}
                    onChange={(e) => setEditingClass({...editingClass, room_number: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Capacité</label>
                  <input 
                    type="number" 
                    value={editingClass.capacity ?? ''}
                    onChange={(e) => setEditingClass({...editingClass, capacity: parseInt(e.target.value) || 40})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Professeur Principal</label>
                <input 
                  type="text" 
                  value={editingClass.main_teacher_name || ''}
                  onChange={(e) => setEditingClass({...editingClass, main_teacher_name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingClass(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Subject */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                <span>Nouvelle Matière & Coefficient</span>
              </h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Code Matière *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ex: MATH, FRAN..."
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Coefficient *</label>
                  <input 
                    type="number" 
                    step="0.5"
                    required
                    value={newSubject.coefficient}
                    onChange={(e) => setNewSubject({...newSubject, coefficient: parseFloat(e.target.value) || 1})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom Complet Matière *</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: Mathématiques, Français & Expression..."
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Niveau / Série Concerné</label>
                <select 
                  value={newSubject.level_name}
                  onChange={(e) => setNewSubject({...newSubject, level_name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-brand-600"
                >
                  <option value="Tous les niveaux">Tous les niveaux (Général)</option>
                  <option value="6ème / 5ème">6ème & 5ème (1er Cycle)</option>
                  <option value="4ème / 3ème">4ème & 3ème (1er Cycle BEPC)</option>
                  <option value="Seconde A">Seconde A (2nde A)</option>
                  <option value="Seconde C">Seconde C (2nde C)</option>
                  <option value="1ère A">1ère A (A1 / A2)</option>
                  <option value="1ère C">1ère C</option>
                  <option value="1ère D">1ère D</option>
                  <option value="Tle A">Terminale A (A1 / A2)</option>
                  <option value="Tle C">Terminale C</option>
                  <option value="Tle D">Terminale D</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Catégorie</label>
                <select 
                  value={newSubject.category}
                  onChange={(e) => setNewSubject({...newSubject, category: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  <option value="Littéraire">Littéraire</option>
                  <option value="Scientifique">Scientifique</option>
                  <option value="Langue">Langue</option>
                  <option value="Sport">Sport</option>
                  <option value="Civique">Civique</option>
                  <option value="Divers / Artistique">Divers / Artistique</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddSubjectModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md">Créer Matière</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Subject */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>Modifier Matière & Coefficient</span>
              </h3>
              <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEditSubject} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Code</label>
                  <input 
                    type="text" 
                    required
                    value={editingSubject.code ?? ''}
                    onChange={(e) => setEditingSubject({...editingSubject, code: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Coefficient Officiel</label>
                  <input 
                    type="number" 
                    step="0.5"
                    required
                    value={editingSubject.coefficient}
                    onChange={(e) => setEditingSubject({...editingSubject, coefficient: parseFloat(e.target.value) || 1})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-brand-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom Matière</label>
                <input 
                  type="text" 
                  required
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Niveau / Série Concerné</label>
                <select 
                  value={editingSubject.level_name || 'Tous les niveaux'}
                  onChange={(e) => setEditingSubject({...editingSubject, level_name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-brand-600"
                >
                  <option value="Tous les niveaux">Tous les niveaux (Général)</option>
                  <option value="6ème / 5ème">6ème & 5ème (1er Cycle)</option>
                  <option value="4ème / 3ème">4ème & 3ème (1er Cycle BEPC)</option>
                  <option value="Seconde A">Seconde A (2nde A)</option>
                  <option value="Seconde C">Seconde C (2nde C)</option>
                  <option value="1ère A">1ère A (A1 / A2)</option>
                  <option value="1ère C">1ère C</option>
                  <option value="1ère D">1ère D</option>
                  <option value="Tle A">Terminale A (A1 / A2)</option>
                  <option value="Tle C">Terminale C</option>
                  <option value="Tle D">Terminale D</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingSubject(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
