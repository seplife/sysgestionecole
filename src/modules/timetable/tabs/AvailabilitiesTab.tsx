import React, { useState } from 'react';
import { UserCheck, DoorOpen, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { TimetableTeacherAvailability, TimetableRoomAvailability } from '../../../types/timetable';

export const AvailabilitiesTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'rooms'>('teachers');

  const mockTeacherAvailabilities: TimetableTeacherAvailability[] = [
    { id: 'ta-1', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', teacher_id: 'tch-01', teacher_name: 'Dr. Yao KOUADIO', day_of_week: 'Mercredi', period_code: 'S4', is_available: false, reason: 'Réunion Conseil Scientifique' },
    { id: 'ta-2', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', teacher_id: 'tch-02', teacher_name: 'Mme BINTA SY', day_of_week: 'Vendredi', period_code: 'S5', is_available: false, reason: 'Dispense de cours vendredi fin de matinée' }
  ];

  const mockRoomAvailabilities: TimetableRoomAvailability[] = [
    { id: 'ra-1', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', room_name: 'Labo Physique 1', room_type: 'LABO_PC', capacity: 35, is_available: true, notes: 'Réservé prioritairement aux 3e et Terminales' },
    { id: 'ra-2', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', room_name: 'Salle Informatique', room_type: 'INFORMATIQUE', capacity: 40, is_available: true, notes: 'Accès Internet & Projecteur' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-500" />
            <span>Disponibilités des Enseignants & Salles</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configurer les indisponibilités récurrentes des enseignants et les contraintes matérielles des salles spécialisées.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('teachers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'teachers' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            Enseignants
          </button>
          <button
            onClick={() => setActiveSubTab('rooms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'rooms' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            Salles & Labos
          </button>
        </div>
      </div>

      {activeSubTab === 'teachers' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Liste des Indisponibilités Déclarées (Enseignants)
            </h3>
            <button className="bg-brand-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="w-4 h-4" />
              <span>Déclarer une Indisponibilité</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Enseignant</th>
                  <th className="p-3">Jour</th>
                  <th className="p-3">Créneau</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockTeacherAvailabilities.map(ta => (
                  <tr key={ta.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{ta.teacher_name}</td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{ta.day_of_week}</td>
                    <td className="p-3 font-bold text-brand-600 dark:text-brand-400">{ta.period_code}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 rounded-full text-[10px] font-extrabold">
                        Indisponible
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 italic">{ta.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Registre des Salles et Spécialisations
            </h3>
            <button className="bg-brand-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="w-4 h-4" />
              <span>Ajouter une Salle</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Nom Salle</th>
                  <th className="p-3">Spécialisation / Type</th>
                  <th className="p-3">Capacité (Élèves)</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Notes & Directives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockRoomAvailabilities.map(ra => (
                  <tr key={ra.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{ra.room_name}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full text-[10px] font-extrabold">
                        {ra.room_type}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{ra.capacity} places</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full text-[10px] font-extrabold">
                        Disponible
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 italic">{ra.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
