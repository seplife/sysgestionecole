import React, { useState } from 'react';
import { UserCheck, Plus, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TimetableSubstitution } from '../../../types/timetable';
import { timetableService } from '../../../services/timetable/timetableService';

interface Props {
  substitutions: TimetableSubstitution[];
  onAddSubstitution: (sub: Omit<TimetableSubstitution, 'id' | 'organization_id' | 'school_id' | 'academic_year_id' | 'created_at'>) => void;
}

export const SubstitutionsTab: React.FC<Props> = ({
  substitutions,
  onAddSubstitution
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newSub, setNewSub] = useState({
    date: new Date().toISOString().split('T')[0],
    original_teacher_name: 'Dr. Yao KOUADIO',
    substitute_teacher_name: 'M. KOUAMÉ Pierre',
    original_room_name: 'Salle 12',
    new_room_name: 'Labo Physique',
    change_type: 'REPLACEMENT' as const,
    status: 'CONFIRMED' as const,
    reason: 'Absence maladie'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSubstitution(newSub);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-500" />
            <span>Gestion des Remplacements & Quotidien</span>
          </h2>
          <p className="text-xs text-slate-400">
            Traiter les absences d'enseignants, enregistrer les permutations et réaffecter les cours et salles en temps réel.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Saisir un Remplacement / Changement</span>
        </button>
      </div>

      {/* Substitutions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Date</th>
                <th className="p-3">Type de Changement</th>
                <th className="p-3">Enseignant Initial</th>
                <th className="p-3">Remplaçant</th>
                <th className="p-3">Salle Initiale / Nouvelle</th>
                <th className="p-3">Motif</th>
                <th className="p-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {substitutions.length > 0 ? (
                substitutions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{s.date}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        s.change_type === 'ABSENCE'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                          : s.change_type === 'ROOM_SWAP'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}>
                        {s.change_type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{s.original_teacher_name}</td>
                    <td className="p-3 font-bold text-brand-600 dark:text-brand-400">
                      {s.substitute_teacher_name || '—'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {s.original_room_name} → <strong className="text-slate-900 dark:text-white">{s.new_room_name || s.original_room_name}</strong>
                    </td>
                    <td className="p-3 text-slate-500 italic text-[11px]">{s.reason}</td>
                    <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                      {s.status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Aucun remplacement ou changement ponctuel enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Substitution */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Enregistrer un Remplacement / Changement
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={newSub.date}
                  onChange={e => setNewSub({ ...newSub, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Enseignant Absente / Remplacé</label>
                <input
                  type="text"
                  value={newSub.original_teacher_name}
                  onChange={e => setNewSub({ ...newSub, original_teacher_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Enseignant Remplaçant</label>
                <input
                  type="text"
                  value={newSub.substitute_teacher_name}
                  onChange={e => setNewSub({ ...newSub, substitute_teacher_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Motif</label>
                <input
                  type="text"
                  value={newSub.reason}
                  onChange={e => setNewSub({ ...newSub, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 text-white rounded-xl font-bold shadow-md"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
