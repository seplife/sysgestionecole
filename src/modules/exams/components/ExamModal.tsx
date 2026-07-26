import React, { useState } from 'react';
import { X, Plus, Trash2, BookOpen, Calculator, Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import { Exam, ExamSubject } from '../../../types/database';
import { OFFICIAL_PRESETS } from '../../../services/examsService';

interface ExamModalProps {
  schoolId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (examData: Partial<Exam>, subjects: Partial<ExamSubject>[]) => Promise<void>;
  existingExam?: Exam | null;
}

const DEFAULT_SUBJECTS: Partial<ExamSubject>[] = [
  { subject_id: 'Mathématiques', subject_name: 'Mathématiques', coefficient: 3, max_score: 20, is_optional: false },
  { subject_id: 'Français', subject_name: 'Français (Compo/Dictée)', coefficient: 3, max_score: 20, is_optional: false },
  { subject_id: 'Physique-Chimie', subject_name: 'Physique-Chimie', coefficient: 2, max_score: 20, is_optional: false },
  { subject_id: 'SVT', subject_name: 'Sciences de la Vie et de la Terre', coefficient: 2, max_score: 20, is_optional: false },
  { subject_id: 'Histoire-Géo', subject_name: 'Histoire-Géographie', coefficient: 2, max_score: 20, is_optional: false },
  { subject_id: 'Anglais', subject_name: 'Anglais', coefficient: 2, max_score: 20, is_optional: false },
  { subject_id: 'LV2 (Allemand/Espagnol)', subject_name: 'LV2 (Allemand/Espagnol)', coefficient: 1, max_score: 20, is_optional: true },
];

export const ExamModal: React.FC<ExamModalProps> = ({ schoolId, isOpen, onClose, onSave, existingExam }) => {
  const [name, setName] = useState<string>(existingExam?.name || '');
  const [examType, setExamType] = useState<string>(existingExam?.exam_type || 'BEPC_BLANC');
  const [levelId, setLevelId] = useState<string>(existingExam?.level_id || '3ème');
  const [seriesId, setSeriesId] = useState<string>(existingExam?.series_id || '');
  const [startDate, setStartDate] = useState<string>(existingExam?.start_date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(existingExam?.end_date || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<string>(existingExam?.status || 'draft');
  const [subjects, setSubjects] = useState<Partial<ExamSubject>[]>(DEFAULT_SUBJECTS);
  const [saving, setSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApplyPreset = (presetCode: 'SERIE_A' | 'SERIE_D' | 'BEPC_GEN') => {
    const preset = OFFICIAL_PRESETS.find(p => p.code === presetCode);
    if (!preset) return;

    setName(`EXAMEN BLANC - ${preset.name} ${new Date().getFullYear()}`);
    setExamType(preset.exam_code === 'BAC' ? 'BAC_BLANC' : 'BEPC_BLANC');
    setLevelId(preset.level);
    setSeriesId(preset.code.replace('SERIE_', ''));

    const loadedSubjects: Partial<ExamSubject>[] = preset.subjects.map(s => ({
      subject_id: s.subject_id,
      subject_name: s.subject_name,
      coefficient: s.coefficient,
      max_score: s.max_score,
      is_optional: !s.is_mandatory || s.is_bonus,
      type: s.type,
      is_bonus: s.is_bonus,
      code: s.code
    }));

    setSubjects(loadedSubjects);
  };

  const handleAddSubject = () => {
    setSubjects([
      ...subjects,
      { subject_id: `Matière ${subjects.length + 1}`, subject_name: `Nouvelle Matière ${subjects.length + 1}`, coefficient: 1, max_score: 20, is_optional: false }
    ]);
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, idx) => idx !== index));
  };

  const handleSubjectChange = (index: number, field: keyof ExamSubject, val: any) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: val };
    setSubjects(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave(
        {
          id: existingExam?.id,
          school_id: schoolId,
          name,
          exam_type: examType,
          level_id: levelId,
          series_id: seriesId || undefined,
          start_date: startDate,
          end_date: endDate,
          status: status as any
        },
        subjects
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full flex flex-col shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {existingExam ? 'Éditer l\'Examen Blanc' : 'Créer un Nouvel Examen Blanc'}
              </h3>
              <p className="text-xs text-slate-400">Attribution des matières, coefficients et facultés</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          
          {/* Quick Preset Selector */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Préréglages Officiels DECO Côte d'Ivoire (Barèmes & Coefficients)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cliquez sur un bouton ci-dessous pour charger automatiquement les matières, épreuves et coefficients officiels :
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleApplyPreset('SERIE_A')}
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <span>📖 Charger BAC A (Littéraire - Coeff 20)</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('SERIE_D')}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <span>🧪 Charger BAC D (Scientifique - Coeff 20)</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('BEPC_GEN')}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <span>🎓 Charger BEPC Général (Coeff 18)</span>
              </button>
            </div>
          </div>

          {/* General Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400">1. Informations Générales</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Intitulé de l'Examen *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: EXAMEN BLANC REGIONAL - BAC BLANC N°1 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Type d'Examen</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="BEPC_BLANC">BEPC Blanc</option>
                  <option value="BAC_BLANC">BAC Blanc</option>
                  <option value="DEVOIR_NATIONALE">Devoir National Déconcentré</option>
                  <option value="COMPOSITION_BLANCHE">Composition Blanche Établissement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Niveau Cible</label>
                <select
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="6ème">6ème</option>
                  <option value="5ème">5ème</option>
                  <option value="4ème">4ème</option>
                  <option value="3ème">3ème</option>
                  <option value="2nde">2nde</option>
                  <option value="1ère">1ère</option>
                  <option value="Terminale">Terminale</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Série (Lycée - Optionnel)</label>
                <input
                  type="text"
                  placeholder="ex: Série A, C, D"
                  value={seriesId}
                  onChange={(e) => setSeriesId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Statut Initial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="draft">Brouillon (draft)</option>
                  <option value="in_progress">En Cours (in_progress)</option>
                  <option value="completed">Terminé (completed)</option>
                  <option value="published">Publié (published)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date de Début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date de Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Subjects & Coefficients Grid */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400">2. Matières, Coefficients & Options</h4>
                <p className="text-xs text-slate-400">Les matières facultatives génèrent un bonus (Note - 10) sans ajouter de coefficient au dénominateur.</p>
              </div>
              <button
                type="button"
                onClick={handleAddSubject}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter Matière</span>
              </button>
            </div>

            <div className="space-y-2">
              {subjects.map((subj, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <input
                    type="text"
                    placeholder="Nom de la matière"
                    value={subj.subject_name || subj.subject_id}
                    onChange={(e) => {
                      handleSubjectChange(idx, 'subject_name', e.target.value);
                      handleSubjectChange(idx, 'subject_id', e.target.value);
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500 w-full"
                  />

                  <div className="flex items-center space-x-3 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-400">Coeff :</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={subj.coefficient}
                        onChange={(e) => handleSubjectChange(idx, 'coefficient', parseFloat(e.target.value) || 1)}
                        className="w-16 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs text-center focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-400">Max :</span>
                      <input
                        type="number"
                        value={subj.max_score || 20}
                        onChange={(e) => handleSubjectChange(idx, 'max_score', parseFloat(e.target.value) || 20)}
                        className="w-16 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs text-center focus:outline-none"
                      />
                    </div>

                    <label className="flex items-center space-x-1.5 text-xs text-amber-300 cursor-pointer bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                      <input
                        type="checkbox"
                        checked={subj.is_optional || false}
                        onChange={(e) => handleSubjectChange(idx, 'is_optional', e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Facultative</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/20 flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer l\'Examen Blanc'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
