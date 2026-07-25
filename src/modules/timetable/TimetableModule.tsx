import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertTriangle, Printer, CheckCircle2, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

import { SchoolClass } from '../../types/database';

interface CourseSlot {
  id: string;
  day: string;
  timeSlot: string;
  subject: string;
  teacher: string;
  room: string;
  conflict?: boolean;
}

export const TimetableModule: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('3ème 2');
  const [classList, setClassList] = useState<SchoolClass[]>([]);
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const timeSlots = ['07h30 - 09h30', '09h30 - 11h30', '11h30 - 13h30 (Pause)', '13h30 - 15h30', '15h30 - 17h30'];

  const [courses, setCourses] = useState<CourseSlot[]>([]);

  useEffect(() => {
    supabaseService.fetchClasses().then(classes => {
      if (classes && classes.length > 0) {
        setClassList(classes);
        if (!classes.some(c => c.name === selectedClass)) {
          setSelectedClass(classes[0].name);
        }
      }
    });

    supabaseService.fetchTimetableSlots().then(data => {
      if (data && data.length > 0) {
        setCourses(data);
      } else {
        const defaultSlots: CourseSlot[] = [
          { id: '1', day: 'Lundi', timeSlot: '07h30 - 09h30', subject: 'Mathématiques', teacher: 'Dr. Yao KOUADIO', room: 'Salle B-12' },
          { id: '2', day: 'Lundi', timeSlot: '09h30 - 11h30', subject: 'Français', teacher: 'Mme BINTA SY', room: 'Salle B-12' },
          { id: '3', day: 'Lundi', timeSlot: '13h30 - 15h30', subject: 'Physique-Chimie', teacher: 'M. KOUAMÉ Pierre', room: 'Labo 2' },
          { id: '4', day: 'Mardi', timeSlot: '07h30 - 09h30', subject: 'Histoire-Géo', teacher: 'Mme AMANI Rose', room: 'Salle B-12' },
          { id: '5', day: 'Mardi', timeSlot: '09h30 - 11h30', subject: 'Anglais', teacher: 'M. John SMITH', room: 'Salle B-12' },
          { id: '6', day: 'Mardi', timeSlot: '13h30 - 15h30', subject: 'SVT', teacher: 'Dr. Yao KOUADIO', room: 'Labo 1' },
          { id: '7', day: 'Mercredi', timeSlot: '07h30 - 09h30', subject: 'EPS (Sport)', teacher: 'Coach ZOHOU', room: 'Terrain Synthétique' },
          { id: '8', day: 'Mercredi', timeSlot: '09h30 - 11h30', subject: 'Mathématiques', teacher: 'Dr. Yao KOUADIO', room: 'Salle B-12' },
          { id: '9', day: 'Jeudi', timeSlot: '07h30 - 09h30', subject: 'Français', teacher: 'Mme BINTA SY', room: 'Salle B-12' },
          { id: '10', day: 'Jeudi', timeSlot: '09h30 - 11h30', subject: 'Physique-Chimie', teacher: 'M. KOUAMÉ Pierre', room: 'Labo 2' },
          { id: '11', day: 'Vendredi', timeSlot: '07h30 - 09h30', subject: 'SVT', teacher: 'Dr. Yao KOUADIO', room: 'Labo 1' },
        ];
        setCourses(defaultSlots);
      }
    });
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseSlot | null>(null);
  const [newCourse, setNewCourse] = useState({
    day: 'Lundi',
    timeSlot: '07h30 - 09h30',
    subject: 'Mathématiques',
    teacher: 'Dr. Yao KOUADIO',
    room: 'Salle B-12'
  });

  const getCourse = (day: string, slot: string) => {
    return courses.find(c => c.day === day && c.timeSlot === slot);
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CourseSlot = {
      id: `crs-${Date.now()}`,
      ...newCourse
    };
    const updated = [...courses.filter(c => !(c.day === newCourse.day && c.timeSlot === newCourse.timeSlot)), created];
    setCourses(updated);
    supabaseService.saveTimetableSlot(created);
    setShowAddModal(false);
  };

  const handleSaveEditCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    const updated = courses.map(c => c.id === editingCourse.id ? editingCourse : c);
    setCourses(updated);
    supabaseService.saveTimetableSlot(editingCourse);
    setEditingCourse(null);
  };

  const handleDeleteCourse = (id: string) => {
    if (window.confirm('Voulez-vous supprimer ce cours du planning ?')) {
      setCourses(courses.filter(c => c.id !== id));
      supabaseService.deleteTimetableSlot(id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-brand-500" />
            <span>Emploi du Temps Hebdomadaire</span>
          </h1>
          <p className="text-xs text-slate-400">Planning dynamique avec détection intelligente des conflits de salle et d'enseignant</p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-white"
          >
            {classList.length > 0 ? (
              classList.map(cls => (
                <option key={cls.id} value={cls.name}>Classe: {cls.name}</option>
              ))
            ) : (
              <>
                <option value="3ème 2">Classe: 3ème 2</option>
                <option value="6ème 1">Classe: 6ème 1</option>
                <option value="Tle A2">Classe: Tle A2</option>
              </>
            )}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Cours</span>
          </button>

          <button 
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Grid Timetable */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 font-bold border-b border-slate-800 w-32">Horaires</th>
                {days.map(d => (
                  <th key={d} className="p-3 font-bold border-b border-slate-800 text-center uppercase tracking-wider">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {timeSlots.map(slot => (
                <tr key={slot} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                    {slot}
                  </td>
                  {days.map(day => {
                    const item = getCourse(day, slot);
                    if (slot.includes('Pause')) {
                      return (
                        <td key={day} className="p-2 bg-slate-100/70 dark:bg-slate-800/20 text-center text-slate-400 font-bold italic">
                          PAUSE DÉJEUNER
                        </td>
                      );
                    }
                    return (
                      <td key={day} className="p-2 border-r border-slate-100 dark:border-slate-800/50">
                        {item ? (
                          <div className="p-2.5 rounded-xl border text-xs space-y-1 bg-brand-50/70 dark:bg-brand-950/40 border-brand-200 dark:border-brand-900/60 text-brand-900 dark:text-brand-200 relative group">
                            <div className="flex items-center justify-between">
                              <div className="font-extrabold text-xs">{item.subject}</div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button onClick={() => setEditingCourse(item)} className="p-0.5 text-amber-600 hover:text-amber-800"><Edit2 className="w-3 h-3" /></button>
                                <button onClick={() => handleDeleteCourse(item.id)} className="p-0.5 text-rose-600 hover:text-rose-800"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{item.teacher}</div>
                            <span className="inline-block bg-white dark:bg-slate-800 font-bold text-[9px] px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {item.room}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setNewCourse({ day, timeSlot: slot, subject: 'Mathématiques', teacher: 'Dr. Yao KOUADIO', room: 'Salle B-12' });
                              setShowAddModal(true);
                            }}
                            className="w-full h-16 flex items-center justify-center text-slate-300 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[10px] border border-dashed border-transparent hover:border-slate-300 transition-all"
                          >
                            + Ajouter
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Course */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                <span>Ajouter un Créneau Cours</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jour</label>
                  <select value={newCourse.day} onChange={(e) => setNewCourse({...newCourse, day: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Horaires</label>
                  <select value={newCourse.timeSlot} onChange={(e) => setNewCourse({...newCourse, timeSlot: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-[11px]">
                    {timeSlots.filter(s => !s.includes('Pause')).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Matière *</label>
                <input type="text" required value={newCourse.subject} onChange={(e) => setNewCourse({...newCourse, subject: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Enseignant *</label>
                <input type="text" required value={newCourse.teacher} onChange={(e) => setNewCourse({...newCourse, teacher: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Salle *</label>
                <input type="text" required value={newCourse.room} onChange={(e) => setNewCourse({...newCourse, room: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Course */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>Modifier le Cours</span>
              </h3>
              <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEditCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Matière</label>
                <input type="text" required value={editingCourse.subject} onChange={(e) => setEditingCourse({...editingCourse, subject: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Enseignant</label>
                <input type="text" required value={editingCourse.teacher} onChange={(e) => setEditingCourse({...editingCourse, teacher: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Salle</label>
                <input type="text" required value={editingCourse.room} onChange={(e) => setEditingCourse({...editingCourse, room: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingCourse(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
