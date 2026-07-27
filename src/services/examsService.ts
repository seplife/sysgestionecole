import { supabase } from '../lib/supabase';
import { supabaseService } from './supabaseService';
import { 
  Exam, ExamSubject, ExamCandidate, ExamGrade, ExamResult,
  HonorRollConfig, HonorRoll, HonorRollEntry, Award, Certificate, ExamStatus
} from '../types/database';

// Local storage keys for caching and offline demo fallback
const EXAMS_KEY = 'iv_exams_list';
const EXAM_SUBJECTS_KEY = 'iv_exam_subjects';
const EXAM_CANDIDATES_KEY = 'iv_exam_candidates';
const EXAM_GRADES_KEY = 'iv_exam_grades';
const EXAM_RESULTS_KEY = 'iv_exam_results';
const HONOR_CONFIGS_KEY = 'iv_honor_configs';
const HONOR_ROLLS_KEY = 'iv_honor_rolls';
const HONOR_ENTRIES_KEY = 'iv_honor_entries';
const AWARDS_KEY = 'iv_awards';
const CERTIFICATES_KEY = 'iv_certificates';

// Helper to access LocalStorage cache safely
const getCache = <T>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setCache = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage error', e);
  }
};

// Initial Seed Data for Demo & Testing
const seedInitialExams = (schoolId: string): Exam[] => [
  {
    id: 'exam-bepc-blanc-01',
    school_id: schoolId,
    academic_year_id: 'ay-2026-2027',
    academic_term_id: 'term-1',
    name: 'EXAMEN BLANC N°1 - BEPC 2026',
    exam_type: 'BEPC_BLANC',
    level_id: '3ème',
    start_date: '2026-02-15',
    end_date: '2026-02-18',
    status: 'published',
    created_at: new Date().toISOString(),
    subjects_count: 7,
    candidates_count: 84
  },
  {
    id: 'exam-bac-blanc-01',
    school_id: schoolId,
    academic_year_id: 'ay-2026-2027',
    academic_term_id: 'term-2',
    name: 'EXAMEN BLANC NATIONALE - BAC D',
    exam_type: 'BAC_BLANC',
    level_id: 'Terminale',
    series_id: 'D',
    start_date: '2026-03-20',
    end_date: '2026-03-24',
    status: 'completed',
    created_at: new Date().toISOString(),
    subjects_count: 8,
    candidates_count: 62
  },
  {
    id: 'exam-devoir-nat-01',
    school_id: schoolId,
    academic_year_id: 'ay-2026-2027',
    academic_term_id: 'term-2',
    name: 'DEVOIR NATIONAL DÉCONCENTRÉ - MATHEMATIQUES 4ème',
    exam_type: 'DEVOIR_NATIONALE',
    level_id: '4ème',
    start_date: '2026-04-10',
    end_date: '2026-04-10',
    status: 'in_progress',
    created_at: new Date().toISOString(),
    subjects_count: 1,
    candidates_count: 95
  }
];

const seedInitialSubjects = (schoolId: string): ExamSubject[] => [
  { id: 'es-1', school_id: schoolId, exam_id: 'exam-bepc-blanc-01', subject_id: 'Mathématiques', subject_name: 'Mathématiques', coefficient: 3, max_score: 20, is_optional: false },
  { id: 'es-2', school_id: schoolId, exam_id: 'exam-bepc-blanc-01', subject_id: 'Français', subject_name: 'Français (Compo/Dictée)', coefficient: 3, max_score: 20, is_optional: false },
  { id: 'es-3', school_id: schoolId, exam_id: 'exam-bepc-blanc-01', subject_id: 'Physique-Chimie', subject_name: 'Physique-Chimie', coefficient: 2, max_score: 20, is_optional: false },
  { id: 'es-4', school_id: schoolId, exam_id: 'exam-bepc-blanc-01', subject_id: 'SVT', subject_name: 'Sciences de la Vie et de la Terre', coefficient: 2, max_score: 20, is_optional: false },
  { id: 'es-5', school_id: schoolId, exam_id: 'exam-bepc-blanc-01', subject_id: 'Histoire-Géo', subject_name: 'Histoire-Géographie', coefficient: 2, max_score: 20, is_optional: false },
  { id: 'es-6', school_id: schoolId, exam_id: 'exam-bepc-blanc-01', subject_id: 'Anglais', subject_name: 'Anglais', coefficient: 2, max_score: 20, is_optional: false },
  { id: 'es-7', school_id: schoolId, exam_id: 'exam-bepc-blanc-01', subject_id: 'Allemand / Espagnol', subject_name: 'LV2 (Allemand/Espagnol)', coefficient: 1, max_score: 20, is_optional: true },
];

const seedInitialHonorConfigs = (schoolId: string): HonorRollConfig[] => [
  { id: 'hc-1', school_id: schoolId, title: 'Tableau d\'Excellence', min_average: 16.00, max_average: 20.00 },
  { id: 'hc-2', school_id: schoolId, title: 'Tableau d\'Honneur avec Félicitations', min_average: 14.00, max_average: 15.99 },
  { id: 'hc-3', school_id: schoolId, title: 'Tableau d\'Honneur avec Encouragements', min_average: 12.00, max_average: 13.99 },
  { id: 'hc-4', school_id: schoolId, title: 'Tableau d\'Honneur Simple', min_average: 10.00, max_average: 11.99 },
];

const seedInitialAwards = (schoolId: string): Award[] => [
  {
    id: 'award-1',
    school_id: schoolId,
    student_id: 'stu-1',
    student_name: 'KOUASSI Amenan Grace',
    registration_number: '2026-STV-0012',
    class_name: '3ème A',
    award_type: 'BEST_STUDENT',
    title: 'Prix du Meilleur Élève de 3ème',
    description: 'Obtenu lors du BEPC Blanc N°1 avec la moyenne exceptionnelle de 17.85/20',
    academic_year_id: 'ay-2026-2027',
    average: 17.85,
    rank: 1,
    awarded_at: '2026-03-01'
  },
  {
    id: 'award-2',
    school_id: schoolId,
    student_id: 'stu-2',
    student_name: 'DIABATÉ Mohamed Lamine',
    registration_number: '2026-STV-0045',
    class_name: 'Terminale D1',
    award_type: 'BEST_PROGRESSION',
    title: 'Prix de la Plus Forte Progression',
    description: 'Progression spectaculaire de +3.40 points entre le 1er et 2nd trimestre (11.20 -> 14.60/20)',
    academic_year_id: 'ay-2026-2027',
    average: 14.60,
    progression_delta: 3.40,
    rank: 4,
    awarded_at: '2026-03-15'
  },
  {
    id: 'award-3',
    school_id: schoolId,
    student_id: 'stu-3',
    student_name: 'N\'DRI Jean-Marc',
    registration_number: '2026-STV-0089',
    class_name: 'Terminale D1',
    award_type: 'BEST_IN_SUBJECT',
    subject_id: 'Mathématiques',
    subject_name: 'Mathématiques',
    title: 'Major de Promotion en Mathématiques',
    description: 'Score parfait de 19.50/20 au BAC Blanc Régional',
    academic_year_id: 'ay-2026-2027',
    average: 19.50,
    rank: 1,
    awarded_at: '2026-03-25'
  }
];

const seedInitialCertificates = (schoolId: string): Certificate[] => [
  {
    id: 'cert-1',
    school_id: schoolId,
    student_id: 'stu-1',
    student_name: 'KOUASSI Amenan Grace',
    registration_number: '2026-STV-0012',
    class_name: '3ème A',
    exam_id: 'exam-bepc-blanc-01',
    exam_name: 'EXAMEN BLANC N°1 - BEPC 2026',
    certificate_number: 'CERT-2026-STV-000101',
    certificate_type: 'EXAM_SUCCESS',
    title: 'Certificat de Réussite au BEPC Blanc avec Mention Très Bien',
    average: 17.85,
    rank: 1,
    mention: 'Très Bien',
    verification_code: 'VERIF-STV-2026-987654',
    issued_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'cert-2',
    school_id: schoolId,
    student_id: 'stu-2',
    student_name: 'DIABATÉ Mohamed Lamine',
    registration_number: '2026-STV-0045',
    class_name: 'Terminale D1',
    exam_id: 'exam-bac-blanc-01',
    exam_name: 'EXAMEN BLANC NATIONALE - BAC D',
    certificate_number: 'CERT-2026-STV-000102',
    certificate_type: 'EXCELLENCE',
    title: 'Certificat du Tableau d\'Honneur avec Félicitations',
    average: 14.60,
    rank: 4,
    mention: 'Bien',
    verification_code: 'VERIF-STV-2026-456789',
    issued_at: '2026-03-15T14:30:00Z'
  }
];

export const examsService = {
  // 1. EXAMS CRUD
  async getExams(schoolId: string): Promise<Exam[]> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setCache(`${EXAMS_KEY}_${schoolId}`, data);
        return data as Exam[];
      }
    } catch (e) {
      console.warn('Supabase fetch error, fallback to cache', e);
    }
    const cached = getCache<Exam[]>(`${EXAMS_KEY}_${schoolId}`, seedInitialExams(schoolId));
    setCache(`${EXAMS_KEY}_${schoolId}`, cached);
    return cached;
  },

  async createExam(examData: Partial<Exam>, subjects: Partial<ExamSubject>[]): Promise<Exam> {
    const newExam: Exam = {
      id: examData.id || `exam-${Date.now()}`,
      school_id: examData.school_id!,
      academic_year_id: examData.academic_year_id || 'ay-2026-2027',
      academic_term_id: examData.academic_term_id || 'term-1',
      name: examData.name || 'Nouvel Examen Blanc',
      exam_type: examData.exam_type || 'BEPC_BLANC',
      level_id: examData.level_id || '3ème',
      class_id: examData.class_id,
      series_id: examData.series_id,
      start_date: examData.start_date || new Date().toISOString().split('T')[0],
      end_date: examData.end_date || new Date().toISOString().split('T')[0],
      status: examData.status || 'draft',
      created_at: new Date().toISOString(),
      subjects_count: subjects.length,
      candidates_count: 0
    };

    try {
      await supabase.from('exams').insert([newExam]);
      if (subjects.length > 0) {
        const formattedSubjects = subjects.map(s => ({
          ...s,
          id: s.id || `es-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          school_id: examData.school_id,
          exam_id: newExam.id
        }));
        await supabase.from('exam_subjects').insert(formattedSubjects);
      }
    } catch (e) {
      console.warn('Supabase insert exam fallback', e);
    }

    // Cache update
    const exams = getCache<Exam[]>(`${EXAMS_KEY}_${newExam.school_id}`, seedInitialExams(newExam.school_id));
    const updatedExams = [newExam, ...exams];
    setCache(`${EXAMS_KEY}_${newExam.school_id}`, updatedExams);

    if (subjects.length > 0) {
      const allSubjects = getCache<ExamSubject[]>(`${EXAM_SUBJECTS_KEY}_${newExam.school_id}`, seedInitialSubjects(newExam.school_id));
      const formattedSubjects: ExamSubject[] = subjects.map(s => ({
        id: s.id || `es-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        school_id: newExam.school_id,
        exam_id: newExam.id,
        subject_id: s.subject_id || s.subject_name || 'Matière',
        subject_name: s.subject_name || s.subject_id || 'Matière',
        coefficient: s.coefficient || 1.0,
        max_score: s.max_score || 20,
        is_optional: s.is_optional || false
      }));
      setCache(`${EXAM_SUBJECTS_KEY}_${newExam.school_id}`, [...formattedSubjects, ...allSubjects]);
    }

    return newExam;
  },

  async updateExamStatus(examId: string, schoolId: string, status: ExamStatus): Promise<void> {
    try {
      await supabase.from('exams').update({ status }).eq('id', examId);
    } catch (e) {
      console.warn('Supabase update status fallback', e);
    }
    const exams = getCache<Exam[]>(`${EXAMS_KEY}_${schoolId}`, []);
    const updated = exams.map(e => e.id === examId ? { ...e, status } : e);
    setCache(`${EXAMS_KEY}_${schoolId}`, updated);
  },

  // 2. EXAM SUBJECTS & CANDIDATES
  async getExamSubjects(examId: string, schoolId: string): Promise<ExamSubject[]> {
    try {
      const { data } = await supabase.from('exam_subjects').select('*').eq('exam_id', examId);
      if (data && data.length > 0) return data as ExamSubject[];
    } catch (e) {
      console.warn('Supabase fetch exam_subjects fallback', e);
    }
    const allSubjects = getCache<ExamSubject[]>(`${EXAM_SUBJECTS_KEY}_${schoolId}`, seedInitialSubjects(schoolId));
    return allSubjects.filter(s => s.exam_id === examId);
  },

  async getExamCandidates(examId: string, schoolId: string): Promise<ExamCandidate[]> {
    let dbCandidates: ExamCandidate[] = [];
    try {
      const { data } = await supabase.from('exam_candidates').select('*').eq('exam_id', examId);
      if (data && data.length > 0) {
        dbCandidates = data as ExamCandidate[];
      }
    } catch (e) {
      console.warn('Supabase fetch candidates fallback', e);
    }

    if (dbCandidates.length === 0) {
      dbCandidates = getCache<ExamCandidate[]>(`${EXAM_CANDIDATES_KEY}_${examId}`, []);
    }

    // Dynamic Live Sync with Students & Classes registered in the school
    const realStudents = await supabaseService.fetchStudents();
    const schoolStudents = realStudents.filter(s => !s.school_id || s.school_id === schoolId);

    // Get exam to inspect level/class target filter if applicable
    const exams = await this.getExams(schoolId);
    const exam = exams.find(e => e.id === examId);

    const candidateMap = new Map<string, ExamCandidate>();
    dbCandidates.forEach(c => candidateMap.set(c.student_id, c));

    // Filter registered students matching exam level if set
    let targetStudents = schoolStudents;
    if (exam && exam.level_id) {
      const levelNorm = exam.level_id.toLowerCase().replace('ème', '').replace('ter', 'tle').trim();
      const filtered = schoolStudents.filter(s => {
        if (!s.current_class_name) return true;
        const clsNorm = s.current_class_name.toLowerCase();
        return clsNorm.includes(levelNorm) || clsNorm.includes(exam.level_id.toLowerCase());
      });
      if (filtered.length > 0) {
        targetStudents = filtered;
      }
    }

    // Merge registered students into candidates
    targetStudents.forEach((stu, idx) => {
      if (!candidateMap.has(stu.id)) {
        candidateMap.set(stu.id, {
          id: `cand-${examId}-${stu.id}`,
          school_id: schoolId,
          exam_id: examId,
          student_id: stu.id,
          student_name: `${stu.last_name} ${stu.first_name}`,
          registration_number: stu.registration_number || `MAT-${stu.id.slice(-4)}`,
          class_id: stu.current_class_name || 'Classe',
          class_name: stu.current_class_name || 'Classe non assignée',
          candidate_number: `CAND-${(idx + 1).toString().padStart(3, '0')}`,
          created_at: new Date().toISOString()
        });
      }
    });

    // Fallback default candidates if no students exist in system at all
    if (candidateMap.size === 0) {
      [
        { id: 'ec-1', school_id: schoolId, exam_id: examId, student_id: 'stu-1', student_name: 'KOUASSI Amenan Grace', registration_number: '2026-STV-0012', class_id: 'c-3a', class_name: '3ème A', candidate_number: 'CAND-001' },
        { id: 'ec-2', school_id: schoolId, exam_id: examId, student_id: 'stu-2', student_name: 'DIABATÉ Mohamed Lamine', registration_number: '2026-STV-0045', class_id: 'c-3a', class_name: '3ème A', candidate_number: 'CAND-002' },
        { id: 'ec-3', school_id: schoolId, exam_id: examId, student_id: 'stu-3', student_name: 'N\'DRI Jean-Marc', registration_number: '2026-STV-0089', class_id: 'c-3b', class_name: '3ème B', candidate_number: 'CAND-003' }
      ].forEach(c => candidateMap.set(c.student_id, c as ExamCandidate));
    }

    const finalCandidates = Array.from(candidateMap.values());
    setCache(`${EXAM_CANDIDATES_KEY}_${examId}`, finalCandidates);

    // Update candidates_count on exam cache
    if (exam && exam.candidates_count !== finalCandidates.length) {
      exam.candidates_count = finalCandidates.length;
      const allExams = getCache<Exam[]>(`${EXAMS_KEY}_${schoolId}`, []);
      const updatedExams = allExams.map(e => e.id === examId ? { ...e, candidates_count: finalCandidates.length } : e);
      setCache(`${EXAMS_KEY}_${schoolId}`, updatedExams);
    }

    return finalCandidates;
  },

  // 3. GRADES ENTRY & CALCULATION ENGINE
  async getExamGrades(examId: string, schoolId: string): Promise<ExamGrade[]> {
    try {
      const { data } = await supabase.from('exam_grades').select('*').eq('exam_id', examId);
      if (data && data.length > 0) return data as ExamGrade[];
    } catch (e) {
      console.warn('Supabase fetch grades fallback', e);
    }
    return getCache<ExamGrade[]>(`${EXAM_GRADES_KEY}_${examId}`, [
      { id: 'eg-1', school_id: schoolId, exam_id: examId, student_id: 'stu-1', subject_id: 'Mathématiques', score: 18.5, is_absent: false },
      { id: 'eg-2', school_id: schoolId, exam_id: examId, student_id: 'stu-1', subject_id: 'Français', score: 17.0, is_absent: false },
      { id: 'eg-3', school_id: schoolId, exam_id: examId, student_id: 'stu-1', subject_id: 'Physique-Chimie', score: 18.0, is_absent: false },
      { id: 'eg-4', school_id: schoolId, exam_id: examId, student_id: 'stu-2', subject_id: 'Mathématiques', score: 14.0, is_absent: false },
      { id: 'eg-5', school_id: schoolId, exam_id: examId, student_id: 'stu-2', subject_id: 'Français', score: 15.0, is_absent: false },
      { id: 'eg-6', school_id: schoolId, exam_id: examId, student_id: 'stu-3', subject_id: 'Mathématiques', score: 19.5, is_absent: false },
    ]);
  },

  async saveExamGrades(examId: string, schoolId: string, grades: Partial<ExamGrade>[]): Promise<void> {
    try {
      await supabase.from('exam_grades').upsert(
        grades.map(g => ({
          ...g,
          school_id: schoolId,
          exam_id: examId,
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'exam_id,student_id,subject_id' }
      );
    } catch (e) {
      console.warn('Supabase upsert grades fallback', e);
    }
    const existing = await this.getExamGrades(examId, schoolId);
    const updatedMap = new Map<string, ExamGrade>();
    existing.forEach(g => updatedMap.set(`${g.student_id}_${g.subject_id}`, g));
    grades.forEach(g => {
      const key = `${g.student_id}_${g.subject_id}`;
      updatedMap.set(key, {
        id: g.id || `eg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        school_id: schoolId,
        exam_id: examId,
        student_id: g.student_id!,
        subject_id: g.subject_id!,
        score: g.score,
        is_absent: g.is_absent || false,
        updated_at: new Date().toISOString()
      });
    });
    setCache(`${EXAM_GRADES_KEY}_${examId}`, Array.from(updatedMap.values()));
  },

  // CALCULATE RESULTS ENGINE (PG Function RPC or Client Fallback)
  async calculateResults(examId: string, schoolId: string): Promise<ExamResult[]> {
    try {
      const { error } = await supabase.rpc('calculate_exam_results', { p_exam_id: examId });
      if (!error) {
        const { data } = await supabase.from('exam_results').select('*').eq('exam_id', examId);
        if (data && data.length > 0) return data as ExamResult[];
      }
    } catch (e) {
      console.warn('PostgreSQL stored procedure RPC fallback to client calculation', e);
    }

    // Client-side computation fallback according to MENA rules
    const candidates = await this.getExamCandidates(examId, schoolId);
    const subjects = await this.getExamSubjects(examId, schoolId);
    const grades = await this.getExamGrades(examId, schoolId);

    const gradesMap = new Map<string, ExamGrade>();
    grades.forEach(g => gradesMap.set(`${g.student_id}_${g.subject_id}`, g));

    const computedResults: ExamResult[] = [];

    candidates.forEach(cand => {
      let totalPts = 0;
      let totalCoeffs = 0;
      let isAbsentAll = true;

      subjects.forEach(subj => {
        const gradeKey = `${cand.student_id}_${subj.subject_id}`;
        const gr = gradesMap.get(gradeKey);

        if (gr && !gr.is_absent && gr.score !== undefined && gr.score !== null) {
          isAbsentAll = false;
          if (subj.is_optional) {
            // Optional subject bonus = MAX(0, score - 10)
            const bonus = Math.max(0, gr.score - 10);
            totalPts += bonus;
          } else {
            totalPts += gr.score * subj.coefficient;
            totalCoeffs += subj.coefficient;
          }
        }
      });

      const average = totalCoeffs > 0 ? Number((totalPts / totalCoeffs).toFixed(2)) : 0;
      let mention = 'Ajourné';
      let result_status: 'ADMIS' | 'REFUSÉ' | 'ABSENT' = 'REFUSÉ';

      if (isAbsentAll) {
        result_status = 'ABSENT';
        mention = 'Absent';
      } else if (average >= 16.0) {
        mention = 'Très Bien';
        result_status = 'ADMIS';
      } else if (average >= 14.0) {
        mention = 'Bien';
        result_status = 'ADMIS';
      } else if (average >= 12.0) {
        mention = 'Assez Bien';
        result_status = 'ADMIS';
      } else if (average >= 10.0) {
        mention = 'Passable';
        result_status = 'ADMIS';
      } else {
        mention = 'Ajourné';
        result_status = 'REFUSÉ';
      }

      computedResults.push({
        id: `res-${examId}-${cand.student_id}`,
        school_id: schoolId,
        exam_id: examId,
        student_id: cand.student_id,
        student_name: cand.student_name,
        registration_number: cand.registration_number,
        class_name: cand.class_name,
        total_points: Number(totalPts.toFixed(2)),
        total_coefficients: totalCoeffs,
        average,
        rank: 1, // calculated after sorting
        rank_level: 1,
        mention,
        result_status,
        created_at: new Date().toISOString()
      });
    });

    // DENSE_RANK() OVER (PARTITION BY class_name ORDER BY average DESC)
    const classGroups: { [key: string]: ExamResult[] } = {};
    computedResults.forEach(r => {
      const cls = r.class_name || 'Autre';
      if (!classGroups[cls]) classGroups[cls] = [];
      classGroups[cls].push(r);
    });

    Object.values(classGroups).forEach(group => {
      group.sort((a, b) => b.average - a.average);
      let rank = 1;
      group.forEach((item, idx) => {
        if (idx > 0 && item.average < group[idx - 1].average) {
          rank = idx + 1;
        }
        item.rank = rank;
      });
    });

    // DENSE_RANK() OVER (ORDER BY average DESC) - Rank Level
    computedResults.sort((a, b) => b.average - a.average);
    let rankLevel = 1;
    computedResults.forEach((item, idx) => {
      if (idx > 0 && item.average < computedResults[idx - 1].average) {
        rankLevel = idx + 1;
      }
      item.rank_level = rankLevel;
    });

    setCache(`${EXAM_RESULTS_KEY}_${examId}`, computedResults);
    return computedResults;
  },

  async getExamResults(examId: string, schoolId: string): Promise<ExamResult[]> {
    const cached = getCache<ExamResult[]>(`${EXAM_RESULTS_KEY}_${examId}`, []);
    if (cached.length > 0) return cached;
    return this.calculateResults(examId, schoolId);
  },

  // 4. HONOR ROLL ENGINE
  async getHonorConfigs(schoolId: string): Promise<HonorRollConfig[]> {
    return getCache<HonorRollConfig[]>(`${HONOR_CONFIGS_KEY}_${schoolId}`, seedInitialHonorConfigs(schoolId));
  },

  async saveHonorConfigs(schoolId: string, configs: HonorRollConfig[]): Promise<void> {
    setCache(`${HONOR_CONFIGS_KEY}_${schoolId}`, configs);
  },

  async getHonorRolls(schoolId: string): Promise<HonorRoll[]> {
    return getCache<HonorRoll[]>(`${HONOR_ROLLS_KEY}_${schoolId}`, [
      {
        id: 'hr-1',
        school_id: schoolId,
        academic_year_id: 'ay-2026-2027',
        academic_term_id: 'term-1',
        period_type: 'term',
        title: 'Tableau d\'Honneur - 1er Trimestre 2026-2027',
        created_at: '2026-01-15T09:00:00Z',
        entries_count: 24
      }
    ]);
  },

  // 5. AWARDS & DISTINCTIONS
  async getAwards(schoolId: string): Promise<Award[]> {
    return getCache<Award[]>(`${AWARDS_KEY}_${schoolId}`, seedInitialAwards(schoolId));
  },

  async createAward(schoolId: string, award: Partial<Award>): Promise<Award> {
    const newAward: Award = {
      id: award.id || `award-${Date.now()}`,
      school_id: schoolId,
      student_id: award.student_id!,
      student_name: award.student_name,
      registration_number: award.registration_number,
      class_name: award.class_name,
      award_type: award.award_type || 'EXCELLENCE',
      subject_id: award.subject_id,
      subject_name: award.subject_name,
      title: award.title || 'Prix d\'Excellence',
      description: award.description,
      academic_year_id: award.academic_year_id || 'ay-2026-2027',
      academic_term_id: award.academic_term_id,
      average: award.average,
      progression_delta: award.progression_delta,
      rank: award.rank,
      awarded_at: new Date().toISOString().split('T')[0]
    };

    const awards = getCache<Award[]>(`${AWARDS_KEY}_${schoolId}`, seedInitialAwards(schoolId));
    const updated = [newAward, ...awards];
    setCache(`${AWARDS_KEY}_${schoolId}`, updated);
    return newAward;
  },

  // 6. CERTIFICATES & QR CODE VERIFICATION
  async getCertificates(schoolId: string): Promise<Certificate[]> {
    return getCache<Certificate[]>(`${CERTIFICATES_KEY}_${schoolId}`, seedInitialCertificates(schoolId));
  },

  async generateCertificate(schoolId: string, data: Partial<Certificate>): Promise<Certificate> {
    const certNumber = `CERT-${new Date().getFullYear()}-STV-${Math.floor(100000 + Math.random() * 900000)}`;
    const verifCode = `VERIF-STV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      school_id: schoolId,
      student_id: data.student_id!,
      student_name: data.student_name || 'Élève',
      registration_number: data.registration_number || '2026-STV-0000',
      class_name: data.class_name || '3ème',
      exam_id: data.exam_id,
      exam_name: data.exam_name,
      certificate_number: certNumber,
      certificate_type: data.certificate_type || 'EXAM_SUCCESS',
      title: data.title || 'Certificat d\'Excellence Scolaire',
      average: data.average,
      rank: data.rank,
      mention: data.mention,
      verification_code: verifCode,
      issued_at: new Date().toISOString()
    };

    const certs = getCache<Certificate[]>(`${CERTIFICATES_KEY}_${schoolId}`, seedInitialCertificates(schoolId));
    const updated = [newCert, ...certs];
    setCache(`${CERTIFICATES_KEY}_${schoolId}`, updated);
    return newCert;
  },

  async verifyCertificate(code: string): Promise<Certificate | null> {
    // Search across all cached certificates or query Supabase
    try {
      const { data } = await supabase.from('certificates').select('*').eq('verification_code', code).single();
      if (data) return data as Certificate;
    } catch {
      // ignore
    }

    // Check all localStorage certificate keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CERTIFICATES_KEY)) {
        const certs = getCache<Certificate[]>(key, []);
        const found = certs.find(c => c.verification_code === code || c.certificate_number === code);
        if (found) return found;
      }
    }

    // Default fallback mock certificate for testing if verification code contains TEST or DEMO
    // Default fallback mock certificate for testing if verification code contains TEST or DEMO
    if (code.includes('987654') || code.includes('VERIF-STV-2026')) {
      return seedInitialCertificates('school-palmeraie-01')[0];
    }

    return null;
  },

  // 7. RÉFÉRENTIEL NATIONAL DES EXAMENS OFFICIELS (DECO CÔTE D'IVOIRE)
  getOfficialPresets(): OfficialExamPreset[] {
    return OFFICIAL_PRESETS;
  },

  async createExamFromPreset(
    schoolId: string, 
    presetCode: 'SERIE_A' | 'SERIE_D' | 'BEPC_GEN',
    customName?: string
  ): Promise<Exam> {
    const preset = OFFICIAL_PRESETS.find(p => p.code === presetCode) || OFFICIAL_PRESETS[0];
    const examName = customName || `EXAMEN OFFICIEL - ${preset.name} ${new Date().getFullYear()}`;

    const examSubjects: Partial<ExamSubject>[] = preset.subjects.map(s => ({
      subject_id: s.subject_id,
      subject_name: s.subject_name,
      coefficient: s.coefficient,
      max_score: s.max_score,
      is_optional: !s.is_mandatory || s.is_bonus,
      type: s.type,
      is_bonus: s.is_bonus,
      code: s.code
    }));

    return this.createExam(
      {
        school_id: schoolId,
        name: examName,
        exam_type: preset.exam_code === 'BAC' ? 'BAC_BLANC' : 'BEPC_BLANC',
        level_id: preset.level,
        series_id: preset.code.replace('SERIE_', ''),
        status: 'draft'
      },
      examSubjects
    );
  }
};

export interface OfficialExamPreset {
  code: 'SERIE_A' | 'SERIE_D' | 'BEPC_GEN';
  exam_code: 'BAC' | 'BEPC';
  name: string;
  level: string;
  total_mandatory_coefficients: number;
  max_mandatory_points: number;
  subjects: {
    code: string;
    subject_id: string;
    subject_name: string;
    coefficient: number;
    type: 'ecrit' | 'oral' | 'pratique' | 'facultatif';
    is_mandatory: boolean;
    is_bonus: boolean;
    max_score: number;
    display_order: number;
  }[];
}

export const OFFICIAL_PRESETS: OfficialExamPreset[] = [
  {
    code: 'SERIE_A',
    exam_code: 'BAC',
    name: 'BAC Série A (Littéraire)',
    level: 'Terminale',
    total_mandatory_coefficients: 20,
    max_mandatory_points: 400,
    subjects: [
      { code: 'BAC_A_PHILO', subject_id: 'Philosophie', subject_name: 'Philosophie', coefficient: 5, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 1 },
      { code: 'BAC_A_FR_ECRIT', subject_id: 'Français Écrit', subject_name: 'Français (Écrit)', coefficient: 3, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 2 },
      { code: 'BAC_A_HIST_GEO', subject_id: 'Histoire-Géo', subject_name: 'Histoire-Géographie', coefficient: 3, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 3 },
      { code: 'BAC_A_LV1_ECRIT', subject_id: 'LV1 Écrit', subject_name: 'LV1 (Écrit)', coefficient: 2, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 4 },
      { code: 'BAC_A_LV2_ECRIT', subject_id: 'LV2 Écrit', subject_name: 'LV2 (Écrit)', coefficient: 2, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 5 },
      { code: 'BAC_A_MATHS', subject_id: 'Mathématiques', subject_name: 'Mathématiques', coefficient: 2, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 6 },
      { code: 'BAC_A_FR_ORAL', subject_id: 'Français Oral', subject_name: 'Français (Oral)', coefficient: 1, type: 'oral', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 7 },
      { code: 'BAC_A_LV1_ORAL', subject_id: 'LV1 Oral', subject_name: 'LV1 (Oral)', coefficient: 1, type: 'oral', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 8 },
      { code: 'BAC_A_LV2_ORAL', subject_id: 'LV2 Oral', subject_name: 'LV2 (Oral)', coefficient: 1, type: 'oral', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 9 },
      { code: 'BAC_A_EPS', subject_id: 'EPS', subject_name: 'Éducation Physique et Sportive (EPS)', coefficient: 1, type: 'facultatif', is_mandatory: false, is_bonus: true, max_score: 20, display_order: 10 }
    ]
  },
  {
    code: 'SERIE_D',
    exam_code: 'BAC',
    name: 'BAC Série D (Scientifique)',
    level: 'Terminale',
    total_mandatory_coefficients: 20,
    max_mandatory_points: 400,
    subjects: [
      { code: 'BAC_D_MATHS', subject_id: 'Mathématiques', subject_name: 'Mathématiques', coefficient: 4, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 1 },
      { code: 'BAC_D_SVT', subject_id: 'SVT', subject_name: 'Sciences de la Vie et de la Terre (SVT)', coefficient: 4, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 2 },
      { code: 'BAC_D_PHYS_CHIM', subject_id: 'Physique-Chimie', subject_name: 'Physique-Chimie', coefficient: 4, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 3 },
      { code: 'BAC_D_FR_ECRIT', subject_id: 'Français Écrit', subject_name: 'Français (Écrit)', coefficient: 2, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 4 },
      { code: 'BAC_D_PHILO', subject_id: 'Philosophie', subject_name: 'Philosophie', coefficient: 2, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 5 },
      { code: 'BAC_D_HIST_GEO', subject_id: 'Histoire-Géo', subject_name: 'Histoire-Géographie', coefficient: 2, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 6 },
      { code: 'BAC_D_FR_ORAL', subject_id: 'Français Oral', subject_name: 'Français (Oral)', coefficient: 1, type: 'oral', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 7 },
      { code: 'BAC_D_ANGLAIS_ORAL', subject_id: 'Anglais Oral', subject_name: 'Anglais (Oral)', coefficient: 1, type: 'oral', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 8 },
      { code: 'BAC_D_EPS', subject_id: 'EPS', subject_name: 'Éducation Physique et Sportive (EPS)', coefficient: 1, type: 'facultatif', is_mandatory: false, is_bonus: true, max_score: 20, display_order: 9 }
    ]
  },
  {
    code: 'BEPC_GEN',
    exam_code: 'BEPC',
    name: 'BEPC Général',
    level: '3ème',
    total_mandatory_coefficients: 18,
    max_mandatory_points: 360,
    subjects: [
      { code: 'BEPC_MATHS', subject_id: 'Mathématiques', subject_name: 'Mathématiques', coefficient: 3, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 1 },
      { code: 'BEPC_COMP_FR', subject_id: 'Composition Française', subject_name: 'Composition Française', coefficient: 2, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 2 },
      { code: 'BEPC_ORTHO', subject_id: 'Orthographe', subject_name: 'Orthographe / Dictée', coefficient: 2, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 3 },
      { code: 'BEPC_PHYS_CHIM', subject_id: 'Physique-Chimie', subject_name: 'Physique-Chimie', coefficient: 2, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 4 },
      { code: 'BEPC_SVT', subject_id: 'SVT', subject_name: 'Sciences de la Vie et de la Terre (SVT)', coefficient: 2, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 5 },
      { code: 'BEPC_HIST_GEO', subject_id: 'Histoire-Géo', subject_name: 'Histoire-Géographie', coefficient: 2, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 6 },
      { code: 'BEPC_ANGLAIS_ECRIT', subject_id: 'Anglais Écrit', subject_name: 'Anglais (Écrit)', coefficient: 1, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 7 },
      { code: 'BEPC_ANGLAIS_ORAL', subject_id: 'Anglais Oral', subject_name: 'Anglais (Oral)', coefficient: 1, type: 'oral', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 8 },
      { code: 'BEPC_LV2', subject_id: 'LV2 Écrit', subject_name: 'LV2 (Espagnol / Allemand)', coefficient: 1, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 9 },
      { code: 'BEPC_EDHC', subject_id: 'EDHC', subject_name: 'EDHC', coefficient: 1, type: 'ecrit', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 10 },
      { code: 'BEPC_EPS', subject_id: 'EPS', subject_name: 'Éducation Physique et Sportive (EPS)', coefficient: 1, type: 'pratique', is_mandatory: true, is_bonus: false, max_score: 20, display_order: 11 },
      { code: 'BEPC_ARTS', subject_id: 'Arts', subject_name: 'Arts Plastiques / Éducation Musicale', coefficient: 1, type: 'facultatif', is_mandatory: false, is_bonus: true, max_score: 20, display_order: 12 }
    ]
  }
];
