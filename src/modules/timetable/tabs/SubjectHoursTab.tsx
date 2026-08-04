import React, { useState } from 'react';
import { BookOpen, Plus, Save, Edit2, Trash2 } from 'lucide-react';
import { TimetableSubjectHours } from '../../../types/timetable';

export const SubjectHoursTab: React.FC = () => {
  const [levelFilter, setLevelFilter] = useState('6e');

  // Realistic IvoireEcole+ Subject Hour Allocation Initial Data
  const initialSubjectHours: TimetableSubjectHours[] = [
    // 6e
    { id: 'sh-6e-fr', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '6e', subject_id: 'sbj-fr', subject_name: 'Français', weekly_sessions: 4, session_duration_minutes: 55, min_weekly_sessions: 4, max_weekly_sessions: 5, allow_consecutive: true, max_consecutive_sessions: 2, requires_special_room: false, priority: 9 },
    { id: 'sh-6e-math', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '6e', subject_id: 'sbj-math', subject_name: 'Mathématiques', weekly_sessions: 4, session_duration_minutes: 55, min_weekly_sessions: 4, max_weekly_sessions: 5, allow_consecutive: false, max_consecutive_sessions: 1, requires_special_room: false, priority: 9 },
    { id: 'sh-6e-ang', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '6e', subject_id: 'sbj-ang', subject_name: 'Anglais', weekly_sessions: 3, session_duration_minutes: 55, min_weekly_sessions: 3, max_weekly_sessions: 4, allow_consecutive: false, max_consecutive_sessions: 1, requires_special_room: false, priority: 8 },
    { id: 'sh-6e-hg', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '6e', subject_id: 'sbj-hg', subject_name: 'Histoire-Géo', weekly_sessions: 3, session_duration_minutes: 55, min_weekly_sessions: 2, max_weekly_sessions: 3, allow_consecutive: false, max_consecutive_sessions: 1, requires_special_room: false, priority: 7 },
    { id: 'sh-6e-pc', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '6e', subject_id: 'sbj-pc', subject_name: 'Physique-Chimie', weekly_sessions: 2, session_duration_minutes: 55, min_weekly_sessions: 2, max_weekly_sessions: 3, allow_consecutive: true, max_consecutive_sessions: 2, requires_special_room: true, special_room_type: 'Labo Physique', priority: 8 },
    { id: 'sh-6e-svt', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '6e', subject_id: 'sbj-svt', subject_name: 'SVT', weekly_sessions: 2, session_duration_minutes: 55, min_weekly_sessions: 2, max_weekly_sessions: 3, allow_consecutive: true, max_consecutive_sessions: 2, requires_special_room: true, special_room_type: 'Labo SVT', priority: 8 },
    { id: 'sh-6e-eps', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '6e', subject_id: 'sbj-eps', subject_name: 'EPS', weekly_sessions: 2, session_duration_minutes: 55, min_weekly_sessions: 2, max_weekly_sessions: 2, allow_consecutive: true, max_consecutive_sessions: 2, requires_special_room: true, special_room_type: 'Terrain EPS', priority: 6 },

    // 3e (Exam Class)
    { id: 'sh-3e-fr', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '3e', subject_id: 'sbj-fr', subject_name: 'Français', weekly_sessions: 5, session_duration_minutes: 55, min_weekly_sessions: 4, max_weekly_sessions: 5, allow_consecutive: true, max_consecutive_sessions: 2, requires_special_room: false, priority: 10 },
    { id: 'sh-3e-math', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '3e', subject_id: 'sbj-math', subject_name: 'Mathématiques', weekly_sessions: 4, session_duration_minutes: 55, min_weekly_sessions: 4, max_weekly_sessions: 5, allow_consecutive: true, max_consecutive_sessions: 2, requires_special_room: false, priority: 10 },
    { id: 'sh-3e-pc', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '3e', subject_id: 'sbj-pc', subject_name: 'Physique-Chimie', weekly_sessions: 3, session_duration_minutes: 55, min_weekly_sessions: 3, max_weekly_sessions: 4, allow_consecutive: true, max_consecutive_sessions: 2, requires_special_room: true, special_room_type: 'Labo Physique', priority: 9 }
  ];

  const [hoursList, setHoursList] = useState<TimetableSubjectHours[]>(initialSubjectHours);

  const filteredHours = hoursList.filter(h => h.level_name === levelFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-500" />
            <span>Matrice des Volumes Horaires Hebdomadaires</span>
          </h2>
          <p className="text-xs text-slate-400">
            Définir les quotas de séances par matière, la durée des cours, la consécutivité autorisée et la salle spécialisée requise.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
          >
            <option value="6e">Niveau : 6ème</option>
            <option value="5e">Niveau : 5ème</option>
            <option value="4e">Niveau : 4ème</option>
            <option value="3e">Niveau : 3ème (Classe d'examen)</option>
            <option value="2nde A">Niveau : 2nde A</option>
            <option value="2nde C">Niveau : 2nde C</option>
            <option value="1ère A">Niveau : 1ère A</option>
            <option value="1ère D">Niveau : 1ère D</option>
            <option value="Terminale A">Niveau : Terminale A (Classe d'examen)</option>
            <option value="Terminale D">Niveau : Terminale D (Classe d'examen)</option>
          </select>

          <button
            onClick={() => alert("Formulaire d'ajout de quota par matière disponible.")}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Matière</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Matière</th>
                <th className="p-3 text-center">Séances / Semaine</th>
                <th className="p-3 text-center">Durée Séance</th>
                <th className="p-3 text-center">Séances Consécutives</th>
                <th className="p-3 text-center">Salle Spécialisée</th>
                <th className="p-3 text-center">Priorité</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHours.length > 0 ? (
                filteredHours.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{h.subject_name}</td>
                    <td className="p-3 text-center font-black text-brand-600 dark:text-brand-400">
                      {h.weekly_sessions} séances
                    </td>
                    <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                      {h.session_duration_minutes} min
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        h.allow_consecutive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {h.allow_consecutive ? `Autorisé (max ${h.max_consecutive_sessions})` : 'Interdit'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {h.requires_special_room ? (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-md text-[10px] font-bold">
                          {h.special_room_type}
                        </span>
                      ) : (
                        <span className="text-slate-400">Salle Standard</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400">
                      {h.priority} / 10
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-rose-400 hover:text-rose-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Aucune configuration spécifique enregistrée pour le niveau {levelFilter}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
