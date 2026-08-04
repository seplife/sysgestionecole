import React, { useState } from 'react';
import { Calendar, ShieldAlert, Plus, CheckCircle2, Clock } from 'lucide-react';
import { TimetableAssessment } from '../../../types/timetable';

export const AssessmentsTab: React.FC = () => {
  const initialAssessments: TimetableAssessment[] = [
    { id: 'ass-1', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '3e', subject_id: 'sbj-math', subject_name: 'Mathématiques', supervisor_teacher_name: 'Dr. Yao KOUADIO', room_name: 'Salle 12 & 13', assessment_date: '2026-09-14', day_of_week: 'Lundi', start_time: '14:00', end_time: '16:00', assessment_type: 'DEVOIR_DE_NIVEAU', status: 'SCHEDULED', instructions: 'Calculatrice scientifique autorisée.' },
    { id: 'ass-2', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: 'Terminale D', subject_id: 'sbj-pc', subject_name: 'Physique-Chimie', supervisor_teacher_name: 'M. KOUAMÉ Pierre', room_name: 'Labo Physique 1', assessment_date: '2026-09-14', day_of_week: 'Lundi', start_time: '14:00', end_time: '17:00', assessment_type: 'DEVOIR_DE_NIVEAU', status: 'SCHEDULED', instructions: 'Épreuve écrite de 3 heures.' },
    { id: 'ass-3', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', level_name: '6e', subject_id: 'sbj-fr', subject_name: 'Français (Dictée & Questions)', supervisor_teacher_name: 'Mme BINTA SY', room_name: 'Salle 01 à 04', assessment_date: '2026-09-17', day_of_week: 'Jeudi', start_time: '14:00', end_time: '16:00', assessment_type: 'DEVOIR_DE_NIVEAU', status: 'SCHEDULED', instructions: 'Évaluation commune niveau 6e.' }
  ];

  const [assessments, setAssessments] = useState<TimetableAssessment[]>(initialAssessments);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-500" />
            <span>Gestion des Devoirs de Niveau Institutionnels</span>
          </h2>
          <p className="text-xs text-slate-400">
            Planification des devoirs de niveau du Lundi après-midi (Classes d'examen) et du Jeudi après-midi (Classes intermédiaires).
          </p>
        </div>

        <button className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md">
          <Plus className="w-4 h-4" />
          <span>Programmer un Devoir de Niveau</span>
        </button>
      </div>

      {/* Rules Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 p-4 rounded-2xl space-y-1">
          <div className="font-extrabold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Créneaux Examen (Lundi 14h00 – 18h00)</span>
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
            Classes de 3e, Terminale A et Terminale D. Les devoirs sont organisés simultanément par niveau.
          </p>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700/50 p-4 rounded-2xl space-y-1">
          <div className="font-extrabold text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <span>Créneaux Intermédiaires (Jeudi 14h00 – 18h00)</span>
          </div>
          <p className="text-[11px] text-indigo-800/80 dark:text-indigo-200/80 leading-relaxed">
            Classes de 6e, 5e, 4e, 2nde A/C, 1ère A/D. Interdiction de placer des cours ordinaires.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Niveau</th>
                <th className="p-3">Jour & Horaire</th>
                <th className="p-3">Matière / Évaluation</th>
                <th className="p-3">Enseignant Surveillant</th>
                <th className="p-3">Salle(s)</th>
                <th className="p-3">Consignes</th>
                <th className="p-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {assessments.map(ass => (
                <tr key={ass.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-extrabold text-brand-600 dark:text-brand-400">{ass.level_name}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    <div>{ass.day_of_week} ({ass.assessment_date})</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{ass.start_time} - {ass.end_time}</div>
                  </td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{ass.subject_name}</td>
                  <td className="p-3 font-medium text-slate-600 dark:text-slate-400">{ass.supervisor_teacher_name}</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{ass.room_name}</td>
                  <td className="p-3 text-slate-500 italic text-[11px]">{ass.instructions}</td>
                  <td className="p-3 text-right">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full text-[10px] font-extrabold">
                      Programmé
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
