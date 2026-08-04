import React, { useState } from 'react';
import { Layers, Search, Filter, Printer, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { TimetableEntry, TimetablePeriod } from '../../../types/timetable';
import { timetableExportService } from '../../../services/timetable/timetableExportService';

interface Props {
  entries: TimetableEntry[];
  periods: TimetablePeriod[];
}

export const GlobalTimetableTab: React.FC<Props> = ({ entries, periods }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('Lundi');
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'compact' | 'large'>('normal');

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  const uniqueClasses = Array.from(new Set(entries.map(e => e.class_name))).sort();

  const filteredEntries = entries.filter(e => {
    const q = searchQuery.toLowerCase();
    return (
      e.class_name.toLowerCase().includes(q) ||
      e.subject_name.toLowerCase().includes(q) ||
      e.teacher_name.toLowerCase().includes(q) ||
      e.room_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Master Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher classe, prof, salle..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {days.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDay === day
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => timetableExportService.exportToExcel(filteredEntries, 'Emploi_du_Temps_Global_IvoireEcole')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* Global Matrix View for Selected Day across all Classes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
            Vue Globale Master — Journée du {selectedDay} (Toutes les Classes)
          </h3>
          <span className="text-xs text-slate-400 font-semibold">{uniqueClasses.length} classes affichées</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 w-28 border-r border-slate-200 dark:border-slate-800">Classe</th>
                {periods.map(p => (
                  <th key={p.id} className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800 last:border-0 min-w-[100px]">
                    <div className="font-black text-brand-600 dark:text-brand-400">{p.code}</div>
                    <div className="text-[9px] text-slate-400 font-medium">{p.start_time}-{p.end_time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {uniqueClasses.map(clsName => {
                return (
                  <tr key={clsName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                      {clsName}
                    </td>

                    {periods.map(period => {
                      if (period.period_type === 'RECESS') {
                        return (
                          <td key={period.id} className="p-1.5 text-center border-r border-slate-200 dark:border-slate-800 last:border-0 text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50/30 dark:bg-amber-950/10">
                            Récréation
                          </td>
                        );
                      }

                      const slotEntry = filteredEntries.find(
                        e => e.class_name === clsName && e.day_of_week === selectedDay && e.period_code === period.code
                      );

                      return (
                        <td key={period.id} className="p-1.5 border-r border-slate-200 dark:border-slate-800 last:border-0 align-top h-16">
                          {slotEntry ? (
                            <div className="p-1.5 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/50 rounded-lg text-[10px]">
                              <div className="font-extrabold text-brand-700 dark:text-brand-300 truncate">
                                {slotEntry.subject_name}
                              </div>
                              <div className="text-slate-600 dark:text-slate-400 truncate">{slotEntry.teacher_name}</div>
                              <div className="text-slate-400 font-bold truncate">{slotEntry.room_name}</div>
                            </div>
                          ) : (
                            <div className="h-full bg-slate-50/20 dark:bg-slate-900/20 rounded-lg" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
