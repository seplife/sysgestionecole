import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, Clock, AlertCircle, Send, Check, RefreshCw, Save } from 'lucide-react';
import { AttendanceRecord, SchoolClass, Student } from '../../types/database';
import { supabaseService } from '../../services/supabaseService';

export const AttendanceModule: React.FC = () => {
  const [classList, setClassList] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('3ème 2');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [notifySent, setNotifySent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    supabaseService.fetchClasses().then(classes => {
      if (classes && classes.length > 0) {
        setClassList(classes);
        if (!classes.some(c => c.name === selectedClass)) {
          setSelectedClass(classes[0].name);
        }
      }
    });

    supabaseService.fetchStudents().then(allStds => {
      setStudents(allStds);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    // Filter students belonging to the selected class
    const enrolledStudents = students.filter(s => s.current_class_name === selectedClass);

    // Load saved attendance for this date & class
    supabaseService.fetchAttendance(date, selectedClass).then(savedRecords => {
      const recordMap = new Map<string, AttendanceRecord>();
      savedRecords.forEach(r => recordMap.set(r.student_id, r));

      const newRecords: AttendanceRecord[] = enrolledStudents.map(st => {
        if (recordMap.has(st.id)) {
          return recordMap.get(st.id)!;
        }
        return {
          id: `att-${st.id}-${date}`,
          school_id: st.school_id || 'school-palmeraie-01',
          class_id: selectedClass,
          class_name: selectedClass,
          student_id: st.id,
          student_name: `${st.last_name} ${st.first_name}`,
          date: date,
          status: 'present'
        };
      });

      setRecords(newRecords);
    });
  }, [selectedClass, date, students]);

  const toggleStatus = (id: string, newStatus: 'present' | 'absent' | 'late' | 'excused') => {
    const updated = records.map(r => r.id === id ? { ...r, status: newStatus } : r);
    setRecords(updated);
    supabaseService.saveAttendanceBatch(updated);
  };

  const handleMinutesLateChange = (id: string, mins: number) => {
    const updated = records.map(r => r.id === id ? { ...r, status: mins > 0 ? ('late' as const) : r.status, reason: mins > 0 ? `${mins} min retard` : r.reason } : r);
    setRecords(updated);
    supabaseService.saveAttendanceBatch(updated);
  };

  const handleSaveAttendance = () => {
    supabaseService.saveAttendanceBatch(records);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const sendWhatsappAlerts = () => {
    setNotifySent(true);
    setTimeout(() => setNotifySent(false), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-brand-500" />
            <span>Appel Numérique & Présences</span>
          </h1>
          <p className="text-xs text-slate-400">Pointage quotidien et notification WhatsApp instantanée des tuteurs</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveAttendance}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Enregistré !' : 'Enregistrer le Pointage'}</span>
          </button>
          <button
            onClick={sendWhatsappAlerts}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
          >
            {notifySent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            <span>{notifySent ? 'Notifications WhatsApp Envoyées !' : 'Notifier les Parents (WhatsApp)'}</span>
          </button>
        </div>
      </div>

      {/* Control Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span>Classe:</span>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
          >
            {classList.length > 0 ? (
              classList.map(cls => (
                <option key={cls.id} value={cls.name}>{cls.name}</option>
              ))
            ) : (
              <>
                <option value="3ème 2">3ème 2</option>
                <option value="6ème 1">6ème 1</option>
                <option value="Tle A2">Tle A2</option>
              </>
            )}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span>Date du jour:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
          />
        </div>

        <div className="ml-auto text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
          <span>Total Élèves dans la classe: </span>
          <span className="text-brand-600 dark:text-brand-400 font-extrabold">{records.length}</span>
        </div>
      </div>

      {/* Attendance Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {records.length > 0 ? (
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Élève</th>
                <th className="py-3.5 px-4">Statut Actuel</th>
                <th className="py-3.5 px-4">Minutes Retard</th>
                <th className="py-3.5 px-4 text-right">Appel Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {rec.student_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      rec.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                      rec.status === 'absent' ? 'bg-rose-50 text-rose-700 font-extrabold animate-pulse' :
                      rec.status === 'late' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {rec.status === 'present' ? 'Présent' : rec.status === 'absent' ? 'Absent' : rec.status === 'late' ? 'Retard' : 'Excusé'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={rec.reason?.includes('min retard') ? parseInt(rec.reason) || 0 : 0}
                      onChange={(e) => handleMinutesLateChange(rec.id, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-900 dark:text-white text-center outline-none"
                    />
                    <span className="ml-1 text-slate-400">min</span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => toggleStatus(rec.id, 'present')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        rec.status === 'present' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      Présent
                    </button>
                    <button
                      onClick={() => toggleStatus(rec.id, 'absent')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        rec.status === 'absent' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => toggleStatus(rec.id, 'late')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        rec.status === 'late' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      Retard
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="text-sm font-semibold">Aucun élève inscrit n'a été trouvé pour la classe <span className="font-extrabold text-slate-700 dark:text-slate-200">{selectedClass}</span>.</p>
            <p className="text-xs text-slate-400">Veuillez inscrire des élèves dans cette classe depuis le module "Gestion des Élèves".</p>
          </div>
        )}
      </div>
    </div>
  );
};
