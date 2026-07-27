import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Upload, Save, Calculator, CheckCircle2, 
  AlertCircle, Search, User, Filter, ArrowRight, Lock, Unlock, Sparkles, RefreshCw
} from 'lucide-react';
import { Exam, ExamSubject, ExamCandidate, ExamGrade, ExamResult } from '../../../types/database';
import { examsService, OFFICIAL_PRESETS } from '../../../services/examsService';

interface GradesEntryTabProps {
  schoolId: string;
  exams: Exam[];
  selectedExam: Exam | null;
  onSelectExam: (exam: Exam) => void;
  onCalculationDone: () => void;
}

export const GradesEntryTab: React.FC<GradesEntryTabProps> = ({
  schoolId,
  exams,
  selectedExam,
  onSelectExam,
  onCalculationDone
}) => {
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [candidates, setCandidates] = useState<ExamCandidate[]>([]);
  const [gradesMap, setGradesMap] = useState<{ [key: string]: { score: number | null; is_absent: boolean } }>({});
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showExcelModal, setShowExcelModal] = useState<boolean>(false);
  const [excelPreviewData, setExcelPreviewData] = useState<any[]>([]);

  // Auto-select first exam if none selected
  useEffect(() => {
    if (exams.length > 0 && !selectedExam) {
      onSelectExam(exams[0]);
    }
  }, [exams, selectedExam]);

  useEffect(() => {
    if (!selectedExam) return;
    loadExamData(selectedExam.id);
  }, [selectedExam]);

  const loadExamData = async (examId: string) => {
    const subjs = await examsService.getExamSubjects(examId, schoolId);
    const cands = await examsService.getExamCandidates(examId, schoolId);
    const grds = await examsService.getExamGrades(examId, schoolId);

    setSubjects(subjs);
    setCandidates(cands);

    const initialMap: { [key: string]: { score: number | null; is_absent: boolean } } = {};
    grds.forEach(g => {
      initialMap[`${g.student_id}_${g.subject_id}`] = {
        score: g.score ?? null,
        is_absent: g.is_absent || false
      };
    });
    setGradesMap(initialMap);
  };

  const handleToggleEntryStatus = async () => {
    if (!selectedExam) return;
    const newStatus = selectedExam.status === 'in_progress' ? 'draft' : 'in_progress';
    await examsService.updateExamStatus(selectedExam.id, schoolId, newStatus);
    onSelectExam({ ...selectedExam, status: newStatus });
  };

  const handleQuickLoadPreset = async (presetCode: 'SERIE_A' | 'SERIE_D' | 'BEPC_GEN') => {
    if (!selectedExam) return;
    const preset = OFFICIAL_PRESETS.find(p => p.code === presetCode);
    if (!preset) return;

    const formattedSubjects: Partial<ExamSubject>[] = preset.subjects.map(s => ({
      subject_id: s.subject_id,
      subject_name: s.subject_name,
      coefficient: s.coefficient,
      max_score: s.max_score,
      is_optional: !s.is_mandatory || s.is_bonus,
      type: s.type,
      is_bonus: s.is_bonus,
      code: s.code
    }));

    await examsService.createExam(
      {
        ...selectedExam,
        exam_type: preset.exam_code === 'BAC' ? 'BAC_BLANC' : 'BEPC_BLANC',
        level_id: preset.level
      },
      formattedSubjects
    );

    loadExamData(selectedExam.id);
  };

  const handleFillSampleScores = () => {
    const newMap = { ...gradesMap };
    candidates.forEach((cand, idx) => {
      subjects.forEach((subj, sIdx) => {
        const baseScore = Number((11 + (idx * 2.3 + sIdx * 1.7) % 8.5).toFixed(2));
        newMap[`${cand.student_id}_${subj.subject_id}`] = {
          score: baseScore,
          is_absent: false
        };
      });
    });
    setGradesMap(newMap);
    setSavedSuccess(true);
  };

  const handleScoreChange = (studentId: string, subjectId: string, val: string) => {
    const key = `${studentId}_${subjectId}`;
    const num = val === '' ? null : Math.min(20, Math.max(0, parseFloat(val) || 0));
    setGradesMap(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        score: num,
        is_absent: false
      }
    }));
  };

  const handleAbsentToggle = (studentId: string, subjectId: string) => {
    const key = `${studentId}_${subjectId}`;
    const current = gradesMap[key]?.is_absent || false;
    setGradesMap(prev => ({
      ...prev,
      [key]: {
        score: null,
        is_absent: !current
      }
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedExam) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const gradesToSave: Partial<ExamGrade>[] = [];
      Object.entries(gradesMap).forEach(([key, val]) => {
        const [student_id, subject_id] = key.split('_');
        gradesToSave.push({
          student_id,
          subject_id,
          score: val.score,
          is_absent: val.is_absent
        });
      });

      await examsService.saveExamGrades(selectedExam.id, schoolId, gradesToSave);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedExam) return;
    setCalculating(true);
    try {
      await handleSaveGrades();
      await examsService.calculateResults(selectedExam.id, schoolId);
      await examsService.updateExamStatus(selectedExam.id, schoolId, 'completed');
      onCalculationDone();
    } catch (e) {
      console.error(e);
    } finally {
      setCalculating(false);
    }
  };

  // Mock Excel File Import simulation
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Simulate parsing Excel sheet rows
    const mockParsedRows = candidates.map((cand, idx) => ({
      matricule: cand.registration_number,
      student_name: cand.student_name,
      maths: (12 + (idx * 1.5) % 8).toFixed(2),
      francais: (11 + (idx * 2) % 7).toFixed(2),
      pc: (10 + (idx * 1.8) % 9).toFixed(2),
    }));

    setExcelPreviewData(mockParsedRows);
    setShowExcelModal(true);
  };

  const applyExcelImport = () => {
    if (!selectedExam) return;
    const newMap = { ...gradesMap };
    candidates.forEach((cand, idx) => {
      subjects.forEach(subj => {
        const mockScore = Number((10 + (idx * 2.1 + subjects.indexOf(subj) * 1.4) % 9.5).toFixed(2));
        newMap[`${cand.student_id}_${subj.subject_id}`] = {
          score: mockScore,
          is_absent: false
        };
      });
    });
    setGradesMap(newMap);
    setShowExcelModal(false);
    setSavedSuccess(true);
  };

  const classesList = Array.from(new Set(candidates.map(c => c.class_name || 'Sans classe')));

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = (c.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.registration_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || c.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      
      {/* Selector & Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Exam Select Dropdown */}
        <div className="w-full md:w-auto flex-1 max-w-md">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Sélectionner l'Examen Blanc Cible
          </label>
          <div className="flex items-center space-x-2">
            <select
              value={selectedExam?.id || ''}
              onChange={(e) => {
                const ex = exams.find(x => x.id === e.target.value);
                if (ex) onSelectExam(ex);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-brand-500"
            >
              {exams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.level_id}) — {e.status === 'in_progress' ? '🔓 SAISIE OUVERTE' : e.status.toUpperCase()}
                </option>
              ))}
            </select>

            {selectedExam && (
              <button
                onClick={handleToggleEntryStatus}
                title={selectedExam.status === 'in_progress' ? 'Désactiver / Verrouiller la Saisie' : 'Activer la Saisie des Notes'}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 border ${
                  selectedExam.status === 'in_progress'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                }`}
              >
                {selectedExam.status === 'in_progress' ? (
                  <>
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    <span>Saisie Active</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Activer Saisie</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          
          <button
            onClick={handleFillSampleScores}
            disabled={!selectedExam || subjects.length === 0}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-2 border border-purple-500/20 disabled:opacity-50"
            title="Pré-remplir la grille avec des notes de démonstration"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Simulation Notes</span>
          </button>

          <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center space-x-2 border border-amber-500/20">
            <Upload className="w-4 h-4" />
            <span>Importer Excel</span>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelImport} className="hidden" />
          </label>

          <button
            onClick={handleSaveGrades}
            disabled={saving || !selectedExam}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>

          <button
            onClick={handleCalculate}
            disabled={calculating || !selectedExam}
            className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/20 flex items-center space-x-2 disabled:opacity-50"
          >
            <Calculator className="w-4 h-4" />
            <span>{calculating ? 'Calcul en cours...' : 'Calculer Moyennes'}</span>
          </button>

        </div>
      </div>

      {/* Zero subjects warning & quick activation */}
      {selectedExam && subjects.length === 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Aucune épreuve configurée pour cet examen. Chargez un barème officiel pour activer immédiatement la grille de saisie :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickLoadPreset('SERIE_A')}
              className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            >
              <span>📖 Activer Barème BAC A (Littéraire - Coeff 20)</span>
            </button>
            <button
              onClick={() => handleQuickLoadPreset('SERIE_D')}
              className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            >
              <span>🧪 Activer Barème BAC D (Scientifique - Coeff 20)</span>
            </button>
            <button
              onClick={() => handleQuickLoadPreset('BEPC_GEN')}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            >
              <span>🎓 Activer Barème BEPC Général (Coeff 18)</span>
            </button>
          </div>
        </div>
      )}

      {savedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Saisie des notes enregistrée avec succès.</span>
        </div>
      )}

      {/* Filter by class & search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase">Classe :</span>
          <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setSelectedClass('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedClass === 'all' ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Toutes ({candidates.length})
            </button>
            {classesList.map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedClass === cls ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Chercher élève..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Matrix Grade Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 min-w-[200px] sticky left-0 bg-slate-950 z-10 border-r border-slate-800">
                  Candidat / Élève
                </th>
                <th className="py-3 px-3">Classe</th>
                {subjects.map(subj => (
                  <th key={subj.id} className="py-3 px-3 text-center min-w-[120px]">
                    <div>{subj.subject_name || subj.subject_id}</div>
                    <div className="text-[9px] text-brand-400 font-normal">
                      Coeff {subj.coefficient} {subj.is_optional && '(Option)'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCandidates.map((cand) => (
                <tr key={cand.id} className="hover:bg-slate-800/40 transition-colors">
                  
                  {/* Candidate Name & Registration */}
                  <td className="py-2.5 px-4 font-medium text-white sticky left-0 bg-slate-900 border-r border-slate-800/80">
                    <div className="font-bold text-slate-100">{cand.student_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{cand.registration_number}</div>
                  </td>

                  <td className="py-2.5 px-3 font-semibold text-slate-400">
                    {cand.class_name}
                  </td>

                  {/* Subject score inputs */}
                  {subjects.map(subj => {
                    const gradeKey = `${cand.student_id}_${subj.subject_id}`;
                    const gr = gradesMap[gradeKey] || { score: null, is_absent: false };

                    return (
                      <td key={subj.id} className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.25"
                            disabled={gr.is_absent}
                            placeholder="--"
                            value={gr.score !== null && gr.score !== undefined ? gr.score : ''}
                            onChange={(e) => handleScoreChange(cand.student_id, subj.subject_id, e.target.value)}
                            className={`w-16 px-2 py-1.5 bg-slate-950 border rounded-lg text-center font-semibold text-xs focus:outline-none transition-colors ${
                              gr.is_absent 
                                ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 line-through' 
                                : gr.score !== null && gr.score >= 10 
                                ? 'border-slate-800 text-emerald-400 focus:border-emerald-500' 
                                : gr.score !== null 
                                ? 'border-slate-800 text-rose-400 focus:border-rose-500' 
                                : 'border-slate-800 text-white focus:border-brand-500'
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() => handleAbsentToggle(cand.student_id, subj.subject_id)}
                            title={gr.is_absent ? 'Marquer Présent' : 'Marquer Absent (ABS)'}
                            className={`px-1.5 py-1 rounded text-[9px] font-bold transition-colors ${
                              gr.is_absent 
                                ? 'bg-rose-500 text-white' 
                                : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                            }`}
                          >
                            ABS
                          </button>
                        </div>
                      </td>
                    );
                  })}

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Preview Import Excel */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              <span>Aperçu de l'Importation Excel (.xlsx)</span>
            </h3>
            <p className="text-xs text-slate-400">
              {excelPreviewData.length} lignes d'élèves prêtes à être injectées dans la grille de notes.
            </p>

            <div className="max-h-60 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 custom-scrollbar text-xs">
              <table className="w-full text-left text-slate-300">
                <thead className="border-b border-slate-800 font-bold text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2">Matricule</th>
                    <th className="py-2">Élève</th>
                    <th className="py-2">Maths</th>
                    <th className="py-2">Français</th>
                    <th className="py-2">PC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {excelPreviewData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 font-mono text-slate-400">{row.matricule}</td>
                      <td className="py-1.5 font-semibold text-white">{row.student_name}</td>
                      <td className="py-1.5 text-emerald-400">{row.maths}</td>
                      <td className="py-1.5 text-emerald-400">{row.francais}</td>
                      <td className="py-1.5 text-emerald-400">{row.pc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowExcelModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={applyExcelImport}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center space-x-2"
              >
                <span>Confirmer et Injecter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
