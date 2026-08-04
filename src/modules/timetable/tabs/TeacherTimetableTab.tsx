import React, { useState } from 'react';
import { UserCheck, Clock, DoorOpen, Layers, Printer } from 'lucide-react';
import { TimetableEntry, TimetablePeriod } from '../../../types/timetable';

interface Props {
  entries: TimetableEntry[];
  periods: TimetablePeriod[];
}

export const TeacherTimetableTab: React.FC<Props> = ({ entries, periods }) => {
  const [selectedTeacher, setSelectedTeacher] = useState('Dr. Yao KOUADIO');
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  // Unique list of teachers from entries
  const teacherList = Array.from(new Set(entries.map(e => e.teacher_name))).filter(Boolean);

  const teacherEntries = entries.filter(e => e.teacher_name === selectedTeacher);

  const getEntryForSlot = (day: string, periodCode: string) => {
    return teacherEntries.find(e => e.day_of_week === day && e.period_code === periodCode);
  };

  const totalWeeklyHours = teacherEntries.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enseignant sélectionné :</label>
          <select
            value={selectedTeacher}
            onChange={e => setSelectedTeacher(e.target.value)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-800 dark:text-white shadow-xs"
          >
            {teacherList.map(tch => (
              <option key={tch} value={tch}>
                {tch}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400 rounded-xl text-xs font-extrabold">
            Total : {totalWeeklyHours} séances / semaine
          </div>
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      {/* Teacher Grid */}
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
                <tr key={period.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                    <div className="text-brand-600 dark:text-brand-400 font-black">{period.code}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{period.name}</div>
                  </td>

                  {days.map(day => {
                    const entry = getEntryForSlot(day, period.code);

                    if (period.period_type === 'RECESS') {
                      return (
                        <td key={day} className="p-2 text-center border-r border-slate-200 dark:border-slate-800 last:border-0 text-amber-700 dark:text-amber-400 font-extrabold text-[11px] italic bg-amber-50/40 dark:bg-amber-950/20">
                          Récréation
                        </td>
                      );
                    }

                    return (
                      <td key={day} className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-0 align-top h-24">
                        {entry ? (
                          <div className="h-full p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl flex flex-col justify-between">
                            <div>
                              <div className="font-black text-xs text-blue-900 dark:text-blue-200">
                                {entry.class_name}
                              </div>
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                {entry.subject_name}
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-2">
                              <DoorOpen className="w-3 h-3 text-slate-400" />
                              <span>{entry.room_name}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full bg-slate-50/30 dark:bg-slate-900/30 rounded-xl border border-transparent flex items-center justify-center text-[10px] font-bold text-slate-300 dark:text-slate-700">
                            Libre
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
