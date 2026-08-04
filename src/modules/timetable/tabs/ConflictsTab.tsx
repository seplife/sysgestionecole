import React from 'react';
import { AlertTriangle, ShieldCheck, Sparkles, CheckCircle2, Wrench } from 'lucide-react';
import { TimetableConflict } from '../../../types/timetable';

interface Props {
  conflicts: TimetableConflict[];
  onResolveConflict: (conflictId: string) => void;
}

export const ConflictsTab: React.FC<Props> = ({ conflicts, onResolveConflict }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <span>Centre de Détection & Résolution des Conflits</span>
          </h2>
          <p className="text-xs text-slate-400">
            Analyse dynamique des chevauchements d'enseignants, de salles, de classes et des violations des règles d'examen.
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
          Total Conflits Décelés : {conflicts.length}
        </div>
      </div>

      {conflicts.length === 0 ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/50 p-8 rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-black text-emerald-950 dark:text-emerald-200 text-lg">
            Zéro Conflit Détecté !
          </h3>
          <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 max-w-md mx-auto">
            L'emploi du temps actuel est 100% conforme à l'ensemble des contraintes dures et des règles institutionnelles ivoiriennes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts.map(cnf => (
            <div
              key={cnf.id}
              className={`p-5 rounded-2xl border transition-all ${
                cnf.severity === 'HARD'
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60'
                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        cnf.severity === 'HARD'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {cnf.severity} CONFLICT
                    </span>
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                      {cnf.conflict_type}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {cnf.description}
                  </p>

                  {cnf.suggested_solution && (
                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-black/5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <div className="font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Proposition d'Auto-Correction Solver :</span>
                      </div>
                      <p>{cnf.suggested_solution}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onResolveConflict(cnf.id)}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shrink-0 self-start"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Corriger Automatiquement</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
