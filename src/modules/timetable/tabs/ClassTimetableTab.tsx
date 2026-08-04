import React, { useState } from 'react';
import { Calendar, Plus, Printer, Edit2, Trash2, ShieldAlert, Sparkles, User, DoorOpen } from 'lucide-react';
import { TimetableEntry, TimetablePeriod } from '../../../types/timetable';
import { getClassCategory } from '../../../services/timetable/timetableService';

interface Props {
  entries: TimetableEntry[];
  periods: TimetablePeriod[];
  selectedClass: string;
  onSelectClass: (className: string) => void;
  onAddCourse: (entry: Partial<TimetableEntry>) => void;
  onDeleteCourse: (id: string) => void;
}

export const ClassTimetableTab: React.FC<Props> = ({
  entries,
  periods,
  selectedClass,
  onSelectClass,
  onAddCourse,
  onDeleteCourse
}) => {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const category = getClassCategory(selectedClass);

  const classEntries = entries.filter(
    e => e.class_name.trim().toLowerCase() === selectedClass.trim().toLowerCase()
  );

  const getEntryForSlot = (day: string, periodCode: string) => {
    return classEntries.find(e => e.day_of_week === day && e.period_code === periodCode);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Classe sélectionnée :</label>
          <select
            value={selectedClass}
            onChange={e => onSelectClass(e.target.value)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-800 dark:text-white shadow-xs"
          >
            <option value="3ème 1">3ème 1 (Classe d'examen)</option>
            <option value="3ème 2">3ème 2 (Classe d'examen)</option>
            <option value="6ème 1">6ème 1 (Intermédiaire)</option>
            <option value="5ème 1">5ème 1 (Intermédiaire)</option>
            <option value="4ème 1">4ème 1 (Intermédiaire)</option>
            <option value="2nde A">2nde A (Intermédiaire)</option>
            <option value="2nde C">2nde C (Intermédiaire)</option>
            <option value="1ère A">1ère A (Intermédiaire)</option>
            <option value="1ère D">1ère D (Intermédiaire)</option>
            <option value="Terminale A">Terminale A (Classe d'examen)</option>
            <option value="Terminale D">Terminale D (Classe d'examen)</option>
          </select>

          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold ${
              category === 'EXAM'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300'
            }`}
          >
            {category === 'EXAM' ? 'CLASSE D\'EXAMEN (FIN DES COURS 12H10)' : 'CLASSE INTERMÉDIAIRE'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      {category === 'EXAM' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200 font-medium">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Règle Absolue : Pour la classe d'examen <strong>{selectedClass}</strong>, les cours ordinaires s'arrêtent impérativement à 12h10 (S5). Le Lundi 14h-18h est réservé aux Devoirs de Niveau et les autres après-midi au Renforcement et Soutien BEPC/BAC.
          </span>
        </div>
      )}

      {/* Main Weekly Timetable Grid (S1 to S9) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 w-32 border-r border-slate-200 dark:border-slate-800">Créneau</th>
                {days.map(day => (
                  <th key={day} className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800 last:border-0">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {periods.map(period => (
                <tr
                  key={period.id}
                  className={period.period_type === 'RECESS' ? 'bg-amber-50/60 dark:bg-amber-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}
                >
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                    <div className="text-brand-600 dark:text-brand-400 font-black">{period.code}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{period.name}</div>
                  </td>

                  {days.map(day => {
                    const entry = getEntryForSlot(day, period.code);

                    if (period.period_type === 'RECESS') {
                      return (
                        <td key={day} className="p-2 text-center border-r border-slate-200 dark:border-slate-800 last:border-0 text-amber-700 dark:text-amber-400 font-extrabold text-[11px] italic bg-amber-50/40 dark:bg-amber-950/20">
                          Récréation (20 min)
                        </td>
                      );
                    }

                    return (
                      <td key={day} className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-0 align-top h-24">
                        {entry ? (
                          <div
                            className={`h-full p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                              entry.activity_type === 'LEVEL_ASSESSMENT'
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-200'
                                : entry.activity_type === 'REINFORCEMENT'
                                ? 'bg-purple-500/10 border-purple-500/40 text-purple-950 dark:text-purple-200'
                                : 'bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800/50 text-slate-900 dark:text-white'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs text-brand-700 dark:text-brand-300">
                                  {entry.subject_name}
                                </span>
                                <button
                                  onClick={() => onDeleteCourse(entry.id)}
                                  className="text-rose-400 hover:text-rose-600 p-0.5"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>{entry.teacher_name}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[10px]">
                              <span className="font-bold flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                <DoorOpen className="w-3 h-3" />
                                <span>{entry.room_name}</span>
                              </span>

                              <span className="px-1.5 py-0.5 rounded font-extrabold uppercase bg-white/60 dark:bg-slate-800/60">
                                {entry.activity_type === 'LEVEL_ASSESSMENT'
                                  ? 'DEVOIR NIVEAU'
                                  : entry.activity_type === 'REINFORCEMENT'
                                  ? 'SOUTIEN'
                                  : 'COURS'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-700 hover:border-brand-400 hover:text-brand-500 cursor-pointer transition-all">
                            <Plus className="w-4 h-4" />
                          </div>
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
    </div>
  );
};
