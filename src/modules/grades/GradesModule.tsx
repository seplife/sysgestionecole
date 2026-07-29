import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Save, CheckCircle2, Calculator, Trash2, RefreshCw, Edit2, Plus, AlertCircle } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { SchoolClass, Subject, Student } from '../../types/database';

interface StudentGradesRow {
  id: string;
  name: string;
  matricule: string;
  // 4 Interrogations
  int1: string;
  int2: string;
  int3: string;
  int4: string;
  // 3 Devoirs Surveillés
  ds1: string;
  ds2: string;
  ds3: string;
  // 1 Devoir de Niveau
  dn: string;
}

export const GradesModule: React.FC = () => {
  const [classSelected, setClassSelected] = useState('3ème 2');
  const [subjectSelected, setSubjectSelected] = useState('Mathématiques');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [classList, setClassList] = useState<SchoolClass[]>([]);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentScores, setStudentScores] = useState<StudentGradesRow[]>([]);

  useEffect(() => {
    supabaseService.fetchClasses().then(classes => {
      if (classes && classes.length > 0) {
        setClassList(classes);
        if (!classes.some(c => c.name === classSelected)) {
          setClassSelected(classes[0].name);
        }
      }
    });

    supabaseService.fetchSubjects().then(sbjs => {
      if (sbjs && sbjs.length > 0) {
        setSubjectList(sbjs);
      }
    });

    supabaseService.fetchStudents().then(stds => {
      setAllStudents(stds);
    });
  }, []);

  useEffect(() => {
    if (!classSelected) return;

    // Filter enrolled students for the selected class
    const enrolled = allStudents.filter(s => s.current_class_name === classSelected);

    // Fetch saved grades for class and subject
    supabaseService.fetchGradesKeyed(classSelected, subjectSelected).then(savedRows => {
      const savedMap = new Map<string, StudentGradesRow>();
      if (savedRows && Array.isArray(savedRows)) {
        savedRows.forEach(r => {
          if (r.id) savedMap.set(r.id, r);
        });
      }

      const rows: StudentGradesRow[] = enrolled.map((st, idx) => {
        if (savedMap.has(st.id)) {
          return savedMap.get(st.id)!;
        }

        // Default mock values if it's 3ème 2 & Mathématiques and not previously saved
        if (classSelected === '3ème 2' && subjectSelected === 'Mathématiques' && idx < 4 && savedMap.size === 0) {
          const mockDefaults = [
            { int1: '16', int2: '17', int3: '18', int4: '15', ds1: '17', ds2: '18', ds3: '16', dn: '17.5' },
            { int1: '12', int2: '14', int3: '11', int4: '', ds1: '13', ds2: '12', ds3: '', dn: '11.5' },
            { int1: '15', int2: '16', int3: '14', int4: '15.5', ds1: '16', ds2: '15', ds3: '16', dn: '15' },
            { int1: '10', int2: '11', int3: '09', int4: '', ds1: '10.5', ds2: '', ds3: '', dn: '10' }
          ];
          return {
            id: st.id,
            name: `${st.last_name} ${st.first_name}`,
            matricule: st.registration_number,
            ...mockDefaults[idx]
          };
        }

        return {
          id: st.id,
          name: `${st.last_name} ${st.first_name}`,
          matricule: st.registration_number,
          int1: '', int2: '', int3: '', int4: '',
          ds1: '', ds2: '', ds3: '',
          dn: ''
        };
      });

      setStudentScores(rows);
    });
  }, [classSelected, subjectSelected, allStudents]);

  const handleScoreChange = (id: string, field: keyof StudentGradesRow, val: string) => {
    setStudentScores(studentScores.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const handleClearStudentScores = (id: string) => {
    if (window.confirm('Voulez-vous réinitialiser / supprimer toutes les notes de cet élève ?')) {
      const updated = studentScores.map(s => s.id === id ? {
        ...s, int1: '', int2: '', int3: '', int4: '', ds1: '', ds2: '', ds3: '', dn: ''
      } : s);
      setStudentScores(updated);
      supabaseService.saveGradesBatch(updated, classSelected, subjectSelected);
    }
  };

  const calculateSubjectAverage = (st: StudentGradesRow) => {
    // Collect Interrogations
    const interros = [st.int1, st.int2, st.int3, st.int4]
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));
    const moyInterro = interros.length > 0 ? interros.reduce((a, b) => a + b, 0) / interros.length : 0;

    // Collect Devoirs Surveillés
    const devoirs = [st.ds1, st.ds2, st.ds3]
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));
    const moyDevoir = devoirs.length > 0 ? devoirs.reduce((a, b) => a + b, 0) / devoirs.length : 0;

    // Devoir de Niveau
    const noteDN = !isNaN(parseFloat(st.dn)) ? parseFloat(st.dn) : 0;

    // MENA Standard Formula: (MoyInterro + 2*MoyDevoir + 2*NoteDN) / (1 + 2 + 2)
    let totalWeight = 0;
    let weightedSum = 0;

    if (interros.length > 0) {
      weightedSum += moyInterro * 1;
      totalWeight += 1;
    }
    if (devoirs.length > 0) {
      weightedSum += moyDevoir * 2;
      totalWeight += 2;
    }
    if (!isNaN(parseFloat(st.dn))) {
      weightedSum += noteDN * 2;
      totalWeight += 2;
    }

    if (totalWeight === 0) return '—';
    return (weightedSum / totalWeight).toFixed(2);
  };

  const handleSave = () => {
    supabaseService.saveGradesBatch(studentScores, classSelected, subjectSelected);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-brand-500" />
            <span>Saisie & Gestion des Notes</span>
          </h1>
          <p className="text-xs text-slate-400">Chaque enseignant dispose de 4 Interrogations, 3 Devoirs Surveillés et 1 Devoir de Niveau</p>
        </div>

        <button
          onClick={handleSave}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Notes Enregistrées avec succès !' : 'Enregistrer & Valider'}</span>
        </button>
      </div>

      {/* Selector Filters & Quota Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Classe:</span>
            <select value={classSelected} onChange={(e) => setClassSelected(e.target.value)} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500">
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
            <span>Matière:</span>
            <select value={subjectSelected} onChange={(e) => setSubjectSelected(e.target.value)} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500">
              {subjectList.length > 0 ? (
                subjectList.map(sbj => (
                  <option key={sbj.id} value={sbj.name}>{sbj.name} (Coef. {sbj.coefficient})</option>
                ))
              ) : (
                <>
                  <option value="Mathématiques">Mathématiques (Coef. 3)</option>
                  <option value="Français (Oral/Gram, Rédaction)">Français (Oral/Gram, Rédaction) (Coef. 4)</option>
                  <option value="Anglais">Anglais (Coef. 2)</option>
                  <option value="Physique-Chimie">Physique-Chimie (Coef. 2)</option>
                  <option value="Sciences de la Vie et de la Terre">Sciences de la Vie et de la Terre (Coef. 2)</option>
                  <option value="Histoire-Géographie">Histoire-Géographie (Coef. 2)</option>
                  <option value="E.P.S.">E.P.S. (Coef. 1)</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <span>Quota par Trimestre: 4 Interros | 3 DS | 1 Devoir de Niveau</span>
        </div>
      </div>

      {/* Rapid Grade Entry Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {studentScores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-900 text-white uppercase font-bold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 min-w-[160px]">Élève & Matricule</th>
                  <th className="py-3 px-1 text-center bg-slate-800/80" colSpan={4}>Interrogations (/20)</th>
                  <th className="py-3 px-1 text-center bg-slate-800/50" colSpan={3}>Devoirs Surveillés (/20)</th>
                  <th className="py-3 px-2 text-center bg-brand-900/60">Devoir Niveau (/20)</th>
                  <th className="py-3 px-3 text-right">Moy. Matière</th>
                  <th className="py-3 px-2 text-center">Action</th>
                </tr>
                <tr className="bg-slate-800 text-slate-300 text-[10px] uppercase border-b border-slate-700">
                  <th className="py-1 px-3"></th>
                  <th className="py-1 px-1 text-center w-12">I 1</th>
                  <th className="py-1 px-1 text-center w-12">I 2</th>
                  <th className="py-1 px-1 text-center w-12">I 3</th>
                  <th className="py-1 px-1 text-center w-12">I 4</th>
                  <th className="py-1 px-1 text-center w-12">DS 1</th>
                  <th className="py-1 px-1 text-center w-12">DS 2</th>
                  <th className="py-1 px-1 text-center w-12">DS 3</th>
                  <th className="py-1 px-2 text-center w-16 text-brand-300 font-extrabold">DN / Comp</th>
                  <th className="py-1 px-3 text-right">MENA</th>
                  <th className="py-1 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentScores.map((st) => {
                  const moy = calculateSubjectAverage(st);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{st.name}</div>
                        <div className="text-[10px] font-mono text-brand-600 dark:text-brand-400">{st.matricule}</div>
                      </td>

                      {/* 4 Interrogations */}
                      {(['int1', 'int2', 'int3', 'int4'] as const).map(key => (
                        <td key={key} className="py-2 px-1 text-center">
                          <input 
                            id={`input-${key}-${st.id}`}
                            type="number" step="0.5" min="0" max="20" placeholder="—"
                            value={st[key]}
                            onChange={(e) => handleScoreChange(st.id, key, e.target.value)}
                            className="w-11 px-1 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                          />
                        </td>
                      ))}

                      {/* 3 Devoirs Surveillés */}
                      {(['ds1', 'ds2', 'ds3'] as const).map(key => (
                        <td key={key} className="py-2 px-1 text-center">
                          <input 
                            type="number" step="0.5" min="0" max="20" placeholder="—"
                            value={st[key]}
                            onChange={(e) => handleScoreChange(st.id, key, e.target.value)}
                            className="w-11 px-1 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                          />
                        </td>
                      ))}

                      {/* 1 Devoir de Niveau */}
                      <td className="py-2 px-2 text-center bg-brand-50/30 dark:bg-brand-950/20">
                        <input 
                          type="number" step="0.5" min="0" max="20" placeholder="—"
                          value={st.dn}
                          onChange={(e) => handleScoreChange(st.id, 'dn', e.target.value)}
                          className="w-14 px-1 py-1 text-center bg-white dark:bg-slate-800 border-2 border-brand-500 rounded-md font-extrabold text-brand-700 dark:text-brand-300 outline-none"
                        />
                      </td>

                      {/* Subject Average */}
                      <td className="py-3 px-3 text-right">
                        <span className={`text-sm font-extrabold px-2.5 py-1 rounded-lg inline-block ${
                          moy === '—' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500' :
                          parseFloat(moy) >= 14 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          parseFloat(moy) >= 10 ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {moy} {moy !== '—' && '/ 20'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              const firstInput = document.getElementById(`input-int1-${st.id}`);
                              if (firstInput) firstInput.focus();
                            }}
                            className="px-2 py-1 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold rounded-lg text-[10px] inline-flex items-center gap-1"
                            title="Saisir ou Modifier les notes de cet élève"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Saisir / Edit</span>
                          </button>
                          <button
                            onClick={() => handleClearStudentScores(st.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            title="Effacer / Supprimer les notes de cet élève"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="text-sm font-semibold">Aucun élève inscrit n'a été trouvé dans la classe <span className="font-extrabold text-slate-700 dark:text-slate-200">{classSelected}</span>.</p>
            <p className="text-xs text-slate-400">Pour saisir les notes en <span className="font-semibold text-slate-600 dark:text-slate-300">{subjectSelected}</span>, inscrivez d'abord des élèves dans cette classe.</p>
          </div>
        )}
      </div>
    </div>
  );
};
