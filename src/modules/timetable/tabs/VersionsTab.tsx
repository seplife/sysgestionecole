import React, { useState } from 'react';
import { Layers, Plus, CheckCircle2, RotateCcw, Clock, Lock } from 'lucide-react';
import { TimetableVersion } from '../../../types/timetable';

interface Props {
  versions: TimetableVersion[];
  onCreateVersion: (title: string, notes?: string) => void;
}

export const VersionsTab: React.FC<Props> = ({ versions, onCreateVersion }) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateVersion(title, notes);
    setTitle('');
    setNotes('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-500" />
            <span>Historique & Versionnage de l'Emploi du Temps</span>
          </h2>
          <p className="text-xs text-slate-400">
            Traçabilité complète des versions (Brouillon → Génération → Validation → Publication). Une version publiée est verrouillée.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Nouvelle Version</span>
        </button>
      </div>

      <div className="space-y-4">
        {versions.map(v => (
          <div
            key={v.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">{v.title}</span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-md">
                  v{v.version_number}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  v.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {v.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 italic">{v.notes || 'Aucune note explicative'}</p>

              <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-3 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Créé le {v.created_at ? new Date(v.created_at).toLocaleDateString('fr-FR') : '—'}</span>
                </span>
                <span>• Score Qualité : {v.quality_score}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {v.status === 'PUBLISHED' ? (
                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Version Publiée Officielle</span>
                </div>
              ) : (
                <button className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurer / Modifier</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Créer une Version de Planning</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Titre de la Version</label>
                <input
                  type="text"
                  placeholder="ex: Planning Trimestre 2 (Option B)"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes & Motifs</label>
                <textarea
                  placeholder="Notes sur les changements apportés..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold">
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-brand-600 text-white rounded-xl font-bold shadow-md">
                  Créer Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
