import React, { useState, useEffect } from 'react';
import { CalendarCheck, Clock, CheckCircle2, XCircle, AlertCircle, Save } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { Employee, EmployeeAttendance, HrAttendanceStatus } from '../../types';

export const StaffAttendanceModule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: HrAttendanceStatus; checkIn: string; lateMinutes: number; reason: string }>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      const emps = await hrService.fetchEmployees();
      setEmployees(emps);
      const records = await hrService.fetchEmployeeAttendance(selectedDate);
      
      const map: Record<string, { status: HrAttendanceStatus; checkIn: string; lateMinutes: number; reason: string }> = {};
      emps.forEach(emp => {
        const found = records.find(r => r.employee_id === emp.id);
        if (found) {
          map[emp.id] = {
            status: found.status,
            checkIn: found.check_in || '07:30',
            lateMinutes: found.late_minutes || 0,
            reason: found.justification_reason || ''
          };
        } else {
          map[emp.id] = {
            status: 'present',
            checkIn: '07:30',
            lateMinutes: 0,
            reason: ''
          };
        }
      });
      setAttendanceMap(map);
    }
    loadData();
  }, [selectedDate]);

  const handleStatusChange = (empId: string, status: HrAttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [empId]: { ...prev[empId], status }
    }));
  };

  const handleSaveAttendance = async () => {
    const records: EmployeeAttendance[] = employees.map(emp => {
      const info = attendanceMap[emp.id] || { status: 'present', checkIn: '07:30', lateMinutes: 0, reason: '' };
      return {
        id: `att-${emp.id}-${selectedDate}`,
        school_id: 'school-palmeraie-01',
        employee_id: emp.id,
        employee_name: `${emp.last_name} ${emp.first_name}`,
        date: selectedDate,
        check_in: info.checkIn,
        status: info.status,
        late_minutes: info.lateMinutes,
        justification_reason: info.reason,
        created_at: new Date().toISOString()
      };
    });

    await hrService.saveAttendanceBatch(records);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-brand-500" />
            <span>Présences, Retards et Absences du Personnel</span>
          </h1>
          <p className="text-xs text-slate-400">Pointage quotidien, retards et motifs d'absences utilisables pour la paie</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold font-mono"
          />

          <button
            onClick={handleSaveAttendance}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer le Pointage</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Pointage des présences du personnel enregistré avec succès !</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b">
            <tr>
              <th className="py-3.5 px-4">Employé</th>
              <th className="py-3.5 px-4">Poste</th>
              <th className="py-3.5 px-4">Statut Pointage</th>
              <th className="py-3.5 px-4">Heure d'arrivée</th>
              <th className="py-3.5 px-4">Minutes Retard</th>
              <th className="py-3.5 px-4">Motif / Remarques</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {employees.map(emp => {
              const info = attendanceMap[emp.id] || { status: 'present', checkIn: '07:30', lateMinutes: 0, reason: '' };
              return (
                <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {emp.last_name} {emp.first_name}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{emp.position_name || emp.employee_type}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {(['present', 'retard', 'absent', 'conge'] as HrAttendanceStatus[]).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusChange(emp.id, st)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                            info.status === st 
                              ? st === 'present' ? 'bg-emerald-600 text-white shadow-xs' :
                                st === 'retard' ? 'bg-amber-500 text-white shadow-xs' :
                                st === 'absent' ? 'bg-rose-600 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="time"
                      value={info.checkIn}
                      onChange={(e) => setAttendanceMap(prev => ({
                        ...prev,
                        [emp.id]: { ...prev[emp.id], checkIn: e.target.value }
                      }))}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                    />
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {info.status === 'retard' ? (
                      <input
                        type="number"
                        value={info.lateMinutes}
                        onChange={(e) => setAttendanceMap(prev => ({
                          ...prev,
                          [emp.id]: { ...prev[emp.id], lateMinutes: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-amber-600 font-bold"
                      />
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="Remarques..."
                      value={info.reason}
                      onChange={(e) => setAttendanceMap(prev => ({
                        ...prev,
                        [emp.id]: { ...prev[emp.id], reason: e.target.value }
                      }))}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
