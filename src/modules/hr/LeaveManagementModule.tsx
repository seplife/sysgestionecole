import { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, Clock, FileText, User } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { LeaveRequest, LeaveType, Employee } from '../../types';

export const LeaveManagementModule: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [newRequest, setNewRequest] = useState({
    employee_id: '',
    leave_type_id: '',
    start_date: new Date().toISOString().substring(0, 10),
    end_date: new Date().toISOString().substring(0, 10),
    duration_days: 1,
    reason: ''
  });

  useEffect(() => {
    hrService.fetchLeaveRequests().then(setRequests);
    hrService.fetchLeaveTypes().then(setLeaveTypes);
    hrService.fetchEmployees().then(setEmployees);
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === newRequest.employee_id);
    const lt = leaveTypes.find(l => l.id === newRequest.leave_type_id);

    const created: LeaveRequest = {
      id: `lr-${Date.now()}`,
      school_id: 'school-palmeraie-01',
      employee_id: newRequest.employee_id,
      employee_name: emp ? `${emp.last_name} ${emp.first_name}` : 'Employé',
      leave_type_id: newRequest.leave_type_id,
      leave_type_name: lt ? lt.name : 'Congé',
      start_date: newRequest.start_date,
      end_date: newRequest.end_date,
      duration_days: newRequest.duration_days,
      reason: newRequest.reason,
      status: 'en_attente',
      created_at: new Date().toISOString()
    };

    const updated = await hrService.saveLeaveRequest(created);
    setRequests(updated);
    setShowModal(false);
  };

  const handleUpdateStatus = async (req: LeaveRequest, status: 'approuve' | 'refuse') => {
    const updated = await hrService.saveLeaveRequest({ ...req, status, approved_at: new Date().toISOString() });
    setRequests(updated);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-brand-500" />
            <span>Gestion des Congés & Absences</span>
          </h1>
          <p className="text-xs text-slate-400">Demandes de congés annuels, maladie, maternité et autorisations d'absence</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Demande de Congé</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase text-slate-400 font-bold border-b">
            <tr>
              <th className="py-3.5 px-4">Employé</th>
              <th className="py-3.5 px-4">Type de Congé</th>
              <th className="py-3.5 px-4">Période</th>
              <th className="py-3.5 px-4">Durée</th>
              <th className="py-3.5 px-4">Motif</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{req.employee_name}</td>
                <td className="py-3.5 px-4"><span className="px-2 py-0.5 bg-brand-50 text-brand-700 font-bold rounded-md">{req.leave_type_name}</span></td>
                <td className="py-3.5 px-4 font-mono">{req.start_date} au {req.end_date}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{req.duration_days} jours</td>
                <td className="py-3.5 px-4">{req.reason || '-'}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    req.status === 'approuve' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    req.status === 'refuse' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {req.status === 'approuve' ? 'Validé' : req.status === 'refuse' ? 'Refusé' : 'En Attente'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {req.status === 'en_attente' && (
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleUpdateStatus(req, 'approuve')} className="p-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200" title="Valider"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => handleUpdateStatus(req, 'refuse')} className="p-1 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200" title="Refuser"><XCircle className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Demand Leave */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Demande de Congé</h3>
            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Employé *</label>
                <select required value={newRequest.employee_id} onChange={e => setNewRequest({...newRequest, employee_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                  <option value="">-- Sélectionner l'employé --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.last_name} {e.first_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Type de Congé *</label>
                <select required value={newRequest.leave_type_id} onChange={e => setNewRequest({...newRequest, leave_type_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                  <option value="">-- Sélectionner le type --</option>
                  {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Date Début *</label>
                  <input type="date" required value={newRequest.start_date} onChange={e => setNewRequest({...newRequest, start_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Date Fin *</label>
                  <input type="date" required value={newRequest.end_date} onChange={e => setNewRequest({...newRequest, end_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Nombre de Jours *</label>
                <input type="number" min="1" required value={newRequest.duration_days} onChange={e => setNewRequest({...newRequest, duration_days: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" />
              </div>

              <div>
                <label className="block font-bold mb-1">Motif</label>
                <textarea value={newRequest.reason} onChange={e => setNewRequest({...newRequest, reason: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs" rows={2} />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-xl font-bold">Soumettre</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
