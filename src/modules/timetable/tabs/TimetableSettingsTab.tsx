import React, { useState } from 'react';
import { Clock, Save, ShieldAlert, CheckCircle2, Sliders, Calendar } from 'lucide-react';
import { TimetableSettings, TimetablePeriod } from '../../../types/timetable';

interface Props {
  settings: TimetableSettings;
  periods: TimetablePeriod[];
  onSaveSettings: (settings: Partial<TimetableSettings>) => void;
}

export const TimetableSettingsTab: React.FC<Props> = ({
  settings,
  periods,
  onSaveSettings
}) => {
  const [formData, setFormData] = useState<TimetableSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-brand-500" />
            <span>Paramètres Généraux & Grille Horaire</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configuration des bornes temporelles, plages horaires des cours (S1-S9) et règles d'arrêt pour les classes d'examen.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Paramètres enregistrés avec succès !</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam Class Rule Card */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500/40 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>Règle Absolue — Classes d'Examen (3e, Terminale A, Terminale D)</span>
          </div>
          <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
            En Côte d'Ivoire, les cours ordinaires des classes d'examen s'arrêtent obligatoirement à 12h10. Le lundi après-midi est réservé aux devoirs de niveau et les autres après-midi au renforcement et à la préparation d'examen.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-amber-950 dark:text-amber-100 mb-1">
                Heure limite cours ordinaires
              </label>
              <input
                type="text"
                value={formData.exam_curfew_time}
                onChange={e => setFormData({ ...formData, exam_curfew_time: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="mon_pm"
                checked={formData.monday_pm_exam_assessments}
                onChange={e => setFormData({ ...formData, monday_pm_exam_assessments: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <label htmlFor="mon_pm" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                Lundi PM (14h-18h) : Devoirs Examen
              </label>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="thu_pm"
                checked={formData.thursday_pm_intermediate_assessments}
                onChange={e => setFormData({ ...formData, thursday_pm_intermediate_assessments: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <label htmlFor="thu_pm" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                Jeudi PM (14h-18h) : Devoirs Intermédiaires
              </label>
            </div>
          </div>
        </div>

        {/* Display Period Slots Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" />
            <span>Structure des Créneaux Horaires Institutionnels (S1 à S9)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Code</th>
                  <th className="p-3">Désignation</th>
                  <th className="p-3">Début</th>
                  <th className="p-3">Fin</th>
                  <th className="p-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {periods.map(period => (
                  <tr key={period.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-black text-brand-600 dark:text-brand-400">{period.code}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{period.name}</td>
                    <td className="p-3 font-medium text-slate-600 dark:text-slate-400">{period.start_time}</td>
                    <td className="p-3 font-medium text-slate-600 dark:text-slate-400">{period.end_time}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        period.period_type === 'RECESS'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : period.period_type === 'AFTERNOON'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}>
                        {period.period_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Paramètres</span>
          </button>
        </div>
      </form>
    </div>
  );
};
