import React from 'react';
import { Sparkles, Plus, BookOpen, Clock, User, DoorOpen } from 'lucide-react';
import { TimetableSpecialActivity } from '../../../types/timetable';

export const SpecialActivitiesTab: React.FC = () => {
  const mockActivities: TimetableSpecialActivity[] = [
    { id: 'sa-1', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', class_id: 'cls-3e1', class_name: '3ème 1', subject_name: 'Préparation BEPC — Mathématiques', teacher_name: 'Dr. Yao KOUADIO', room_name: 'Salle 12', activity_type: 'EXAM_PREPARATION', day_of_week: 'Mardi', start_time: '14:00', end_time: '16:00', description: 'Résolution des annales BEPC des 5 dernières années.' },
    { id: 'sa-2', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', class_id: 'cls-tled', class_name: 'Terminale D', subject_name: 'Mise à Niveau — SVT & Génétique', teacher_name: 'Mme KOFFI Christine', room_name: 'Labo SVT', activity_type: 'REMEDIATION', day_of_week: 'Mercredi', start_time: '14:00', end_time: '16:00', description: 'Séance de soutien ciblée sur le chapitre d\'Hérédité.' },
    { id: 'sa-3', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', class_id: 'cls-tlea', class_name: 'Terminale A', subject_name: 'Renforcement Philosophie', teacher_name: 'M. KONAN Jean', room_name: 'Salle Tle A', activity_type: 'REINFORCEMENT', day_of_week: 'Vendredi', start_time: '14:00', end_time: '16:00', description: 'Atelier méthodologique de la dissertation.' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span>Renforcement, Remédiation & Soutien Spécialisé</span>
          </h2>
          <p className="text-xs text-slate-400">
            Affectation des après-midi des classes d'examen aux séances d'accompagnement et de préparation intensive BEPC/BAC.
          </p>
        </div>

        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md">
          <Plus className="w-4 h-4" />
          <span>Ajouter une Séance de Soutien</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockActivities.map(act => (
          <div key={act.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-extrabold text-[10px] rounded-full uppercase">
                {act.activity_type}
              </span>
              <span className="text-xs font-black text-brand-600 dark:text-brand-400">{act.class_name}</span>
            </div>

            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              {act.subject_name}
            </h3>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{act.day_of_week} ({act.start_time} - {act.end_time})</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{act.teacher_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>{act.room_name}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-2">
              {act.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
