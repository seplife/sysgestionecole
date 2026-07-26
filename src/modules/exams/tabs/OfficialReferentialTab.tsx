import React, { useState } from 'react';
import { 
  Award, BookOpen, CheckCircle2, ShieldCheck, Sparkles, Plus, 
  Layers, Info, FileText, Scale, Calculator
} from 'lucide-react';
import { OFFICIAL_PRESETS, OfficialExamPreset, examsService } from '../../../services/examsService';
import { Exam } from '../../../types/database';

interface OfficialReferentialTabProps {
  schoolId: string;
  onExamCreated?: (exam: Exam) => void;
}

export const OfficialReferentialTab: React.FC<OfficialReferentialTabProps> = ({ schoolId, onExamCreated }) => {
  const [selectedPresetCode, setSelectedPresetCode] = useState<'SERIE_A' | 'SERIE_D' | 'BEPC_GEN'>('SERIE_A');
  const [creating, setCreating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentPreset: OfficialExamPreset = OFFICIAL_PRESETS.find(p => p.code === selectedPresetCode) || OFFICIAL_PRESETS[0];

  const handleLaunchOfficialExam = async () => {
    setCreating(true);
    setSuccessMessage(null);
    try {
      const year = new Date().getFullYear();
      const customTitle = `EXAMEN BLANC NATIONAL - ${currentPreset.name} ${year}`;
      const newExam = await examsService.createExamFromPreset(schoolId, selectedPresetCode, customTitle);
      
      setSuccessMessage(`Examen "${newExam.name}" créé avec succès avec l'ensemble des épreuves et coefficients officiels DECO !`);
      if (onExamCreated) {
        onExamCreated(newExam);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const getBadgeTypeColor = (type: string) => {
    switch (type) {
      case 'ecrit':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'oral':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'pratique':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'facultatif':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Normes Décret MENA / DECO Côte d'Ivoire</span>
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Référentiel Officiel des Examens Nationaux (BAC & BEPC)
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Barème officiel des séries, matières, épreuves obligatoires & bonus, coefficients réglementaires et règles de délibération d'État.
            </p>
          </div>

          <button
            onClick={handleLaunchOfficialExam}
            disabled={creating}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-2 shrink-0 transition-all transform hover:scale-105 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>{creating ? 'Génération en cours...' : `Créer un Examen (${currentPreset.exam_code})`}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-400 text-xs font-bold">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Exam Selection Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OFFICIAL_PRESETS.map((preset) => {
          const isSelected = preset.code === selectedPresetCode;
          return (
            <button
              key={preset.code}
              onClick={() => setSelectedPresetCode(preset.code)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-brand-500/60 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  preset.exam_code === 'BAC'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {preset.exam_code} — {preset.level}
                </span>

                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-brand-400" />
                )}
              </div>

              <div>
                <h3 className="text-sm font-black text-white">{preset.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {preset.subjects.length} Épreuves au total
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Coeff total : <strong className="text-white font-bold">{preset.total_mandatory_coefficients}</strong></span>
                <span>Points max : <strong className="text-brand-400 font-bold">{preset.max_mandatory_points} pts</strong></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <Scale className="w-3.5 h-3.5 text-brand-400" />
            <span>Coefficients Obligatoires</span>
          </span>
          <p className="text-2xl font-black text-white">{currentPreset.total_mandatory_coefficients}</p>
          <p className="text-[10px] text-slate-500">Hors épreuves facultatives/bonus</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Points Max Obligatoires</span>
          </span>
          <p className="text-2xl font-black text-amber-400">{currentPreset.max_mandatory_points} <span className="text-xs text-slate-400 font-normal">pts</span></p>
          <p className="text-[10px] text-slate-500">Note minimale d'admission: {currentPreset.max_mandatory_points / 2} pts</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Nombre d'Épreuves</span>
          </span>
          <p className="text-2xl font-black text-white">{currentPreset.subjects.length}</p>
          <p className="text-[10px] text-slate-500">
            {currentPreset.subjects.filter(s => s.is_mandatory).length} Obligatoires | {currentPreset.subjects.filter(s => s.is_bonus).length} Facultative(s)
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>Calcul Épreuves Bonus</span>
          </span>
          <p className="text-xs font-bold text-purple-300 mt-1">Note &gt; 10/20 comptabilisée</p>
          <p className="text-[10px] text-slate-500">Sans augmenter le dénominateur de coeff</p>
        </div>
      </div>

      {/* Detailed Subjects Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white">
              Grille Officielle des Épreuves — {currentPreset.name}
            </h3>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Réf: DECO/MENA-{currentPreset.code}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">#</th>
                <th className="px-4 py-3.5">Code Slug</th>
                <th className="px-4 py-3.5">Intitulé Officiel de l'Épreuve</th>
                <th className="px-4 py-3.5">Mode d'Évaluation</th>
                <th className="px-4 py-3.5 text-center">Caractère</th>
                <th className="px-4 py-3.5 text-center">Coeff</th>
                <th className="px-4 py-3.5 text-center">Bareme Max</th>
                <th className="px-4 py-3.5">Logique de Calcul Points</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-sans">
              {currentPreset.subjects.map((subj, idx) => (
                <tr key={subj.code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-500">
                    {subj.display_order || idx + 1}
                  </td>

                  <td className="px-4 py-3 font-mono text-[11px] text-brand-400 font-semibold">
                    {subj.code}
                  </td>

                  <td className="px-4 py-3 font-bold text-white">
                    {subj.subject_name}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getBadgeTypeColor(subj.type)}`}>
                      {subj.type}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {subj.is_bonus ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⭐ Bonus / Optionnel
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Obligatoire
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-mono font-black text-white text-sm">
                    {subj.coefficient}
                  </td>

                  <td className="px-4 py-3 text-center font-mono text-slate-400">
                    /{subj.max_score}
                  </td>

                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                    {subj.is_bonus ? (
                      <span className="text-amber-300 font-mono">
                        Points = MAX(0, (Note - 10) × {subj.coefficient})
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">
                        Points = Note × {subj.coefficient}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot className="bg-slate-950/80 font-bold border-t border-slate-800 text-xs">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right text-slate-400 uppercase tracking-wider text-[10px]">
                  Total des Coefficients Obligatoires :
                </td>
                <td className="px-4 py-3 text-center font-mono text-amber-400 text-base font-black">
                  {currentPreset.total_mandatory_coefficients}
                </td>
                <td colSpan={2} className="px-4 py-3 text-left text-slate-400 text-[11px]">
                  Total points max obligatoires : <strong className="text-white">{currentPreset.max_mandatory_points} pts</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
