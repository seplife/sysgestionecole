import React, { useState } from 'react';
import { ShieldCheck, Sliders, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TimetableConstraintRule } from '../../../types/timetable';

export const ConstraintsTab: React.FC = () => {
  const initialConstraints: TimetableConstraintRule[] = [
    { id: 'c1', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', code: 'NO_CLASS_DOUBLE_BOOKING', name: 'Interdire le chevauchement de deux cours pour une même classe', constraint_type: 'HARD', weight: 100, is_enabled: true, description: 'Une classe ne peut pas assister à deux cours différents au même créneau.' },
    { id: 'c2', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', code: 'NO_TEACHER_DOUBLE_BOOKING', name: 'Interdire le chevauchement de deux cours pour un même enseignant', constraint_type: 'HARD', weight: 100, is_enabled: true, description: 'Un enseignant ne peut pas dispenser deux cours simultanément.' },
    { id: 'c3', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', code: 'NO_ROOM_DOUBLE_BOOKING', name: 'Interdire l\'occupation simultanée d\'une même salle', constraint_type: 'HARD', weight: 100, is_enabled: true, description: 'Une salle ne peut accueillir qu\'une seule classe par créneau.' },
    { id: 'c4', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', code: 'EXAM_CLASS_AFTERNOON_CURFEW', name: 'Arrêt strict des cours ordinaires à 12h10 pour les classes d\'examen (3e, Terminale)', constraint_type: 'HARD', weight: 100, is_enabled: true, description: 'Les après-midi des classes d\'examen sont réservés aux devoirs de niveau et au renforcement.' },
    { id: 'c5', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', code: 'MONDAY_PM_EXAM_ASSESSMENTS', name: 'Réservation exclusive du Lundi 14h-18h aux devoirs de niveau des classes d\'examen', constraint_type: 'HARD', weight: 100, is_enabled: true, description: 'Aucun cours ordinaire pour la 3e ou Terminale le lundi après-midi.' },
    { id: 'c6', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', code: 'THURSDAY_PM_INTERMEDIATE_ASSESSMENTS', name: 'Réservation exclusive du Jeudi 14h-18h aux devoirs de niveau des classes intermédiaires', constraint_type: 'HARD', weight: 100, is_enabled: true, description: 'Aucun cours ordinaire pour les 6e-1ère le jeudi après-midi.' },

    // Soft constraints
    { id: 'c7', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', code: 'BALANCED_WEEKLY_DISTRIBUTION', name: 'Répartir équitablement les matières fondamentales sur la semaine', constraint_type: 'SOFT', weight: 90, is_enabled: true, description: 'Éviter de regrouper tous les cours de Mathématiques en début de semaine.' },
    { id: 'c8', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', code: 'CORE_SUBJECTS_MORNING', name: 'Privilégier les matières scientifiques et littéraires le matin (07h15 - 10h00)', constraint_type: 'SOFT', weight: 85, is_enabled: true, description: 'Maximiser la concentration des élèves aux premières heures.' },
    { id: 'c9', organization_id: 'org-1', school_id: 'sch-1', academic_year_id: 'ay-1', code: 'MINIMIZE_TEACHER_GAPS', name: 'Minimiser les heures creuses (trous) dans l\'emploi du temps des enseignants', constraint_type: 'SOFT', weight: 80, is_enabled: true, description: 'Éviter d\'avoir 2h libres isolées au milieu de la journée.' }
  ];

  const [rules, setRules] = useState<TimetableConstraintRule[]>(initialConstraints);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, is_enabled: !r.is_enabled } : r));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-500" />
            <span>Moteur de Contraintes & Pondération</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configurer les contraintes dures (Hard Constraints absolues) et les contraintes souples d'optimisation pédagogique.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Hard Constraints */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Contraintes Dures (Hard Constraints — Priorité Absolue)</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rules.filter(r => r.constraint_type === 'HARD').map(rule => (
              <div key={rule.id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{rule.name}</span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] font-extrabold rounded-md uppercase">
                      Poids 100
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{rule.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rule.is_enabled}
                    onChange={() => toggleRule(rule.id)}
                    className="w-4 h-4 text-brand-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {rule.is_enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Soft Constraints */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <Sliders className="w-5 h-5" />
            <span>Contraintes Souples (Soft Constraints — Optimisation & Confort Pédagogique)</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rules.filter(r => r.constraint_type === 'SOFT').map(rule => (
              <div key={rule.id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{rule.name}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] font-extrabold rounded-md uppercase">
                      Poids {rule.weight}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{rule.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rule.is_enabled}
                    onChange={() => toggleRule(rule.id)}
                    className="w-4 h-4 text-brand-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {rule.is_enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
