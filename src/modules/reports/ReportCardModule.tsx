import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, Printer, ShieldCheck, Sparkles, User, FileSpreadsheet, 
  Users, TrendingUp, AlertCircle, Copy, Check, Info, FileText, X
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Student, SchoolClass, Subject, UserProfile } from '../../types/database';

interface StudentGradesRow {
  id: string;
  name: string;
  matricule: string;
  int1: string;
  int2: string;
  int3: string;
  int4: string;
  ds1: string;
  ds2: string;
  ds3: string;
  dn: string;
}

interface SubjectScoreResult {
  subjectName: string;
  category: string;
  coef: number;
  moyenne: number | null;
  displayMoyenne: string;
  weightedPoints: number;
  rankInSubject: string;
  appreciation: string;
  teacher: string;
  isOptional?: boolean;
  isExcludedFromAverage?: boolean;
  bonusPoints?: number;
}

interface StudentCalculatedReport {
  student: Student;
  subjectScores: SubjectScoreResult[];
  totalCoef: number;
  totalPoints: number;
  overallMoyenne: number | null;
  overallMoyenneStr: string;
  rank: number;
  rankStr: string;
  appreciation: string;
  decision: string;
  bonusPointsSum?: number;
}

export interface MenaSubjectSpec {
  name: string;
  code: string;
  coef: number;
  category: string;
  isOptional?: boolean;
  isExcludedFromAverage?: boolean;
}

export interface MenaPresetSpec {
  id: string;
  levelKey: string;
  title: string;
  cycle: '1er Cycle (Collège)' | '2nd Cycle (Lycée)';
  totalCoef: number;
  maxPoints: number;
  subjects: MenaSubjectSpec[];
  specialBlockType?: 'bepc' | 'orientation_seconde_a' | 'orientation_seconde_c' | 'bac_blanc_a' | 'bac_simul_c_d';
  prompt: string;
}

const CONDUITE_SUBJECT: MenaSubjectSpec = {
  name: 'Conduite',
  code: 'CONDUITE',
  coef: 1,
  category: 'Discipline',
  isExcludedFromAverage: true
};

export const MENA_PRESETS: MenaPresetSpec[] = [
  {
    id: '6e_5e',
    levelKey: '6ème / 5ème',
    title: 'Classes de 6ème et 5ème (Premier Cycle Collège)',
    cycle: '1er Cycle (Collège)',
    totalCoef: 17,
    maxPoints: 340,
    subjects: [
      { name: 'Français: Oral / Lecture', code: 'FRAN_ORAL', coef: 1, category: 'Littéraire' },
      { name: 'Français: Orthographe / Grammaire', code: 'FRAN_GRAM', coef: 1, category: 'Littéraire' },
      { name: 'Français: Expression Écrite', code: 'FRAN_ECRIT', coef: 1, category: 'Littéraire' },
      { name: 'Mathématiques', code: 'MATH', coef: 3, category: 'Scientifique' },
      { name: 'Anglais', code: 'ANG', coef: 2, category: 'Langue' },
      { name: 'Histoire-Géographie', code: 'HG', coef: 2, category: 'Littéraire' },
      { name: 'Physique-Chimie', code: 'PHYS', coef: 2, category: 'Scientifique' },
      { name: 'S.V.T.', code: 'SVT', coef: 2, category: 'Scientifique' },
      { name: 'Arts Plastiques / Éducation Musicale', code: 'ART', coef: 1, category: 'Arts' },
      { name: 'E.D.H.C.', code: 'EDHC', coef: 1, category: 'Civique' },
      { name: 'E.P.S.', code: 'EPS', coef: 1, category: 'Sport' },
      CONDUITE_SUBJECT
    ],
    prompt: `Génère un bulletin scolaire trimestriel pour une classe de [6ème / 5ème] respectant scrupuleusement le barème suivant :
Matières et coefficients :
- Français (Total Coeff : 3) : Expression Orale/Lecture (Coeff 1), Orthographe/Grammaire (Coeff 1), Expression Écrite (Coeff 1).
- Mathématiques (Coeff 3)
- Anglais (Coeff 2)
- Histoire-Géographie (Coeff 2)
- Physique-Chimie (Coeff 2)
- SVT (Coeff 2)
- Arts Plastiques / Éducation Musicale (Coeff 1)
- E.D.H.C. (Coeff 1)
- E.P.S. (Coeff 1)
- Conduite (Coeff 1) : Discipline (Hors moyenne trimestrielle/annuelle)
Champs attendus : Nom, Prénom, Matricule, Classe, Trimestre, Effectif, Note/20, Note pondérée (Note x Coeff), Rang, Appréciation du professeur par matière, Total des points (sur 340), Moyenne générale (sur 20), Rang général et Décision du Conseil de classe.`
  },
  {
    id: '4e_3e',
    levelKey: '4ème / 3ème',
    title: 'Classes de 4ème et 3ème (Examen BEPC)',
    cycle: '1er Cycle (Collège)',
    totalCoef: 19,
    maxPoints: 380,
    specialBlockType: 'bepc',
    subjects: [
      { name: 'Français: Oral & Lecture', code: 'FRAN_ORAL', coef: 1, category: 'Littéraire' },
      { name: 'Français: Orthographe & Grammaire', code: 'FRAN_GRAM', coef: 1, category: 'Littéraire' },
      { name: 'Français: Expression Écrite', code: 'FRAN_ECRIT', coef: 1, category: 'Littéraire' },
      { name: 'Français: Rédaction', code: 'FRAN_REDAC', coef: 2, category: 'Littéraire' },
      { name: 'Mathématiques', code: 'MATH', coef: 3, category: 'Scientifique' },
      { name: 'Anglais', code: 'ANG', coef: 2, category: 'Langue' },
      { name: 'Histoire-Géographie', code: 'HG', coef: 2, category: 'Littéraire' },
      { name: 'Physique-Chimie', code: 'PHYS', coef: 2, category: 'Scientifique' },
      { name: 'S.V.T.', code: 'SVT', coef: 2, category: 'Scientifique' },
      { name: 'LV2 (Allemand / Espagnol)', code: 'LV2', coef: 1, category: 'Langue' },
      { name: 'Arts Plastiques / Éduc. Mus.', code: 'ART', coef: 1, category: 'Arts' },
      { name: 'E.D.H.C.', code: 'EDHC', coef: 1, category: 'Civique' },
      { name: 'E.P.S.', code: 'EPS', coef: 1, category: 'Sport' },
      CONDUITE_SUBJECT
    ],
    prompt: `Conçois un bulletin scolaire complet pour un élève en classe de [4ème / 3ème] selon le barème officiel du 1er cycle :
Matières et coefficients :
- Français (Total Coeff : 4) : Expression Orale + Lecture (Coeff 1), Orthographe + Grammaire (Coeff 1), Expression Écrite (Coeff 1), Rédaction (Coeff 2).
- Mathématiques (Coeff 3)
- Anglais (Coeff 2)
- Histoire-Géographie (Coeff 2)
- Physique-Chimie (Coeff 2)
- SVT (Coeff 2)
- LV2 (Allemand / Espagnol) (Coeff 1)
- Arts Plastiques / Éducation Musicale (Coeff 1)
- E.D.H.C. (Coeff 1)
- E.P.S. (Coeff 1)
- Conduite (Coeff 1) : Discipline (Hors moyenne trimestrielle/annuelle)
Champs spécifiques : Intègre une section de synthèse générale avec Moyenne Générale (sur 20, basée sur 19 coefficients), Rang, Bilan du Conseil de Classe, et pour la 3ème, un bloc de préparation à l'examen du BEPC.`
  },
  {
    id: '2nde_A',
    levelKey: 'Seconde A',
    title: 'Seconde A (Littéraire - Coeff Total: 22)',
    cycle: '2nd Cycle (Lycée)',
    totalCoef: 22,
    maxPoints: 440,
    specialBlockType: 'orientation_seconde_a',
    subjects: [
      { name: 'Français', code: 'FRAN', coef: 4, category: 'Littéraire' },
      { name: 'Anglais', code: 'ANG', coef: 3, category: 'Langue' },
      { name: 'LV2 (Allemand / Espagnol)', code: 'LV2', coef: 3, category: 'Langue' },
      { name: 'Histoire-Géographie', code: 'HG', coef: 3, category: 'Littéraire' },
      { name: 'Mathématiques', code: 'MATH', coef: 3, category: 'Scientifique' },
      { name: 'Physique-Chimie', code: 'PHYS', coef: 2, category: 'Scientifique' },
      { name: 'S.V.T.', code: 'SVT', coef: 2, category: 'Scientifique' },
      CONDUITE_SUBJECT
    ],
    prompt: `Génère un bulletin de notes pour un élève en classe de Seconde A conformément au barème :
Matières et coefficients :
- Français (Coeff 4)
- Anglais (Coeff 3)
- LV2 (Coeff 3)
- Histoire-Géographie (Coeff 3)
- Mathématiques (Coeff 3)
- Physique-Chimie (Coeff 2)
- SVT (Coeff 2)
- Conduite (Coeff 1) : Discipline (Hors moyenne trimestrielle/annuelle)
Calculs et avis : Calcule le total sur 440 points, extrait la moyenne pondérée globale et ajoute un avis d'orientation préférentiel vers les filières de Première A1, A2 ou L.`
  },
  {
    id: '2nde_C',
    levelKey: 'Seconde C',
    title: 'Seconde C (Scientifique - Coeff Total: 22)',
    cycle: '2nd Cycle (Lycée)',
    totalCoef: 22,
    maxPoints: 440,
    specialBlockType: 'orientation_seconde_c',
    subjects: [
      { name: 'Mathématiques', code: 'MATH', coef: 5, category: 'Scientifique' },
      { name: 'Physique-Chimie', code: 'PHYS', coef: 4, category: 'Scientifique' },
      { name: 'Français', code: 'FRAN', coef: 3, category: 'Littéraire' },
      { name: 'Anglais', code: 'ANG', coef: 3, category: 'Langue' },
      { name: 'Histoire-Géographie', code: 'HG', coef: 2, category: 'Littéraire' },
      { name: 'S.V.T.', code: 'SVT', coef: 2, category: 'Scientifique' },
      { name: 'LV2 (Allemand / Espagnol)', code: 'LV2', coef: 1, category: 'Langue' },
      CONDUITE_SUBJECT
    ],
    prompt: `Rédige un bulletin scolaire pour un élève de Seconde C avec la grille des coefficients suivante :
Matières et coefficients :
- Mathématiques (Coeff 5)
- Physique-Chimie (Coeff 4)
- Français (Coeff 3)
- Anglais (Coeff 3)
- Histoire-Géographie (Coeff 2)
- SVT (Coeff 2)
- LV2 (Coeff 1)
- Conduite (Coeff 1) : Discipline (Hors moyenne trimestrielle/annuelle)
Calculs et avis : Calcule la moyenne pondérée (Total Coeff = 22) et formule une recommandation d'orientation pour la Première C ou Première D.`
  },
  {
    id: '1ere_A',
    levelKey: 'Première A1 / A2',
    title: 'Première A1 (Coeff: 25) / Première A2 (Coeff: 24)',
    cycle: '2nd Cycle (Lycée)',
    totalCoef: 25,
    maxPoints: 500,
    subjects: [
      { name: 'Français', code: 'FRAN', coef: 4, category: 'Littéraire' },
      { name: 'Anglais', code: 'ANG', coef: 4, category: 'Langue' },
      { name: 'Philosophie', code: 'PHILO', coef: 3, category: 'Littéraire' },
      { name: 'LV2 (Allemand / Espagnol)', code: 'LV2', coef: 3, category: 'Langue' },
      { name: 'Histoire-Géographie', code: 'HG', coef: 3, category: 'Littéraire' },
      { name: 'Mathématiques (A1: Coeff 3 / A2: Coeff 2)', code: 'MATH', coef: 3, category: 'Scientifique' },
      { name: 'Physique-Chimie', code: 'PHYS', coef: 1, category: 'Scientifique' },
      { name: 'S.V.T.', code: 'SVT', coef: 1, category: 'Scientifique' },
      CONDUITE_SUBJECT
    ],
    prompt: `Génère un bulletin officiel pour la classe de [Première A1 / Première A2] :
Matières et coefficients :
- Français (Coeff 4)
- Anglais (Coeff 4)
- Philosophie (Coeff 3)
- LV2 (Coeff 3)
- Histoire-Géographie (Coeff 3)
- Mathématiques : Coeff 3 (en A1) OU Coeff 2 (en A2)
- Physique-Chimie (Coeff 1)
- SVT (Coeff 1)
- Conduite (Coeff 1) : Discipline (Hors moyenne trimestrielle/annuelle)
Structure : Calcule la moyenne sur le total de coefficients correspondant (25 en A1 ou 24 en A2).`
  },
  {
    id: '1ere_CD',
    levelKey: 'Première C / D',
    title: 'Première C (Coeff: 24) / Première D (Coeff: 24)',
    cycle: '2nd Cycle (Lycée)',
    totalCoef: 24,
    maxPoints: 480,
    subjects: [
      { name: 'Mathématiques (C: Coeff 5 / D: Coeff 4)', code: 'MATH', coef: 5, category: 'Scientifique' },
      { name: 'Physique-Chimie (C: Coeff 5 / D: Coeff 4)', code: 'PHYS', coef: 5, category: 'Scientifique' },
      { name: 'S.V.T. (C: Coeff 2 / D: Coeff 4)', code: 'SVT', coef: 4, category: 'Scientifique' },
      { name: 'Français', code: 'FRAN', coef: 3, category: 'Littéraire' },
      { name: 'Philosophie', code: 'PHILO', coef: 2, category: 'Littéraire' },
      { name: 'Anglais', code: 'ANG', coef: 2, category: 'Langue' },
      { name: 'Histoire-Géographie', code: 'HG', coef: 2, category: 'Littéraire' },
      { name: 'LV2 (Facultative - Points > 10 en Bonus)', code: 'LV2', coef: 0, category: 'Langue', isOptional: true },
      CONDUITE_SUBJECT
    ],
    prompt: `Crée un bulletin trimestriel de [Première C / Première D] :
Grille Première C : Mathématiques (5), Physique-Chimie (5), Français (3), Philosophie (2), Anglais (2), Histoire-Géographie (2), SVT (2), LV2 (1 Facultative), Conduite (1 Hors Moyenne).
Grille Première D : SVT (4), Mathématiques (4), Physique-Chimie (4), Français (3), Philosophie (2), Anglais (2), Histoire-Géographie (2), LV2 (1 Facultative), Conduite (1 Hors Moyenne).
Règle de gestion : Si l'élève suit la matière facultative (LV2), seuls les points obtenus au-dessus de 10/20 sont ajoutés en bonus au total des points. La note de Conduite n'est pas incluse dans le calcul de moyenne.`
  },
  {
    id: 'tle_A',
    levelKey: 'Terminale A1 / A2',
    title: 'Terminale A1 (Coeff: 27) / Terminale A2 (Coeff: 25)',
    cycle: '2nd Cycle (Lycée)',
    totalCoef: 27,
    maxPoints: 540,
    specialBlockType: 'bac_blanc_a',
    subjects: [
      { name: 'Philosophie', code: 'PHILO', coef: 5, category: 'Littéraire' },
      { name: 'Français', code: 'FRAN', coef: 4, category: 'Littéraire' },
      { name: 'Anglais', code: 'ANG', coef: 4, category: 'Langue' },
      { name: 'LV2 (Allemand / Espagnol)', code: 'LV2', coef: 3, category: 'Langue' },
      { name: 'Histoire-Géographie', code: 'HG', coef: 3, category: 'Littéraire' },
      { name: 'S.V.T.', code: 'SVT', coef: 2, category: 'Scientifique' },
      { name: 'Mathématiques (TA1: Coeff 4 / TA2: Coeff 2)', code: 'MATH', coef: 4, category: 'Scientifique' },
      CONDUITE_SUBJECT
    ],
    prompt: `Crée le bulletin trimestriel pour la classe de [Terminale A1 / Terminale A2] :
Matières et coefficients :
- Philosophie (Coeff 5)
- Français (Coeff 4)
- Anglais (Coeff 4)
- LV2 (Coeff 3)
- Histoire-Géographie (Coeff 3)
- SVT (Coeff 2)
- Mathématiques : Coeff 4 (en TA1) OU Coeff 2 (en TA2)
- Conduite (Coeff 1) : Discipline (Hors moyenne trimestrielle/annuelle)
Module Examen : Inclus une case dédiée aux statistiques d'évaluation du Baccalauréat Blanc et les mentions du conseil.`
  },
  {
    id: 'tle_CD',
    levelKey: 'Terminale C / D',
    title: 'Terminale C (Coeff: 23) / Terminale D (Coeff: 23)',
    cycle: '2nd Cycle (Lycée)',
    totalCoef: 23,
    maxPoints: 460,
    specialBlockType: 'bac_simul_c_d',
    subjects: [
      { name: 'Mathématiques (TC: Coeff 5 / TD: Coeff 4)', code: 'MATH', coef: 5, category: 'Scientifique' },
      { name: 'Physique-Chimie (TC: Coeff 5 / TD: Coeff 4)', code: 'PHYS', coef: 5, category: 'Scientifique' },
      { name: 'S.V.T. (TC: Coeff 2 / TD: Coeff 4)', code: 'SVT', coef: 4, category: 'Scientifique' },
      { name: 'Français', code: 'FRAN', coef: 3, category: 'Littéraire' },
      { name: 'Philosophie', code: 'PHILO', coef: 2, category: 'Littéraire' },
      { name: 'Histoire-Géographie', code: 'HG', coef: 2, category: 'Littéraire' },
      { name: 'Anglais', code: 'ANG', coef: 1, category: 'Langue' },
      { name: 'LV2 (Facultative - Bonus Points > 10)', code: 'LV2', coef: 0, category: 'Langue', isOptional: true },
      CONDUITE_SUBJECT
    ],
    prompt: `Rédige le modèle de bulletin pour la classe de [Terminale C / Terminale D] :
Grille Terminale C : Mathématiques (5), Physique-Chimie (5), Français (3), Philosophie (2), Histoire-Géographie (2), SVT (2), Anglais (1), LV2 (1 Facultative), Conduite (1 Hors Moyenne).
Grille Terminale D : SVT (4), Mathématiques (4), Physique-Chimie (4), Français (3), Philosophie (2), Histoire-Géographie (2), Anglais (1), LV2 (1 Facultative), Conduite (1 Hors Moyenne).
Règle de gestion : Total des coefficients obligatoire = 23. LV2 facultative comptabilisée uniquement en bonus. La note de Conduite n'est pas incluse dans la moyenne. Inclure une grille de simulation d'admissibilité au BAC Scientifique.`
  }
];

export const ReportCardModule: React.FC = () => {
  const { currentSchool } = useTenant();
  const [activeTab, setActiveTab] = useState<'bulletin' | 'recueil'>('bulletin');
  const [classList, setClassList] = useState<SchoolClass[]>([]);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [realStudents, setRealStudents] = useState<Student[]>([]);
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [classGradesMap, setClassGradesMap] = useState<Record<string, StudentGradesRow[]>>({});

  const [selectedClass, setSelectedClass] = useState<string>('3ème 2');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('2ème Trimestre');

  // Prompts Modal State
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedPresetForPrompt, setSelectedPresetForPrompt] = useState<MenaPresetSpec>(MENA_PRESETS[1]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load Initial Infrastructure Data
  useEffect(() => {
    supabaseService.fetchClasses().then(cls => {
      if (cls && cls.length > 0) {
        setClassList(cls);
        if (!cls.some(c => c.name === selectedClass)) {
          setSelectedClass(cls[0].name);
        }
      }
    });

    supabaseService.fetchSubjects().then(sbjs => {
      if (sbjs && sbjs.length > 0) {
        setSubjectList(sbjs);
      }
    });

    supabaseService.fetchStudents().then(stds => {
      if (stds && stds.length > 0) {
        setRealStudents(stds);
      }
    });

    supabaseService.fetchStaff().then(stf => {
      if (stf && stf.length > 0) {
        setStaffList(stf);
      }
    });
  }, []);

  // Fetch Class Grades whenever Selected Class changes
  useEffect(() => {
    if (!selectedClass) return;
    supabaseService.fetchAllClassGrades(selectedClass).then(map => {
      setClassGradesMap(map || {});
    });
  }, [selectedClass]);

  // Enrolled students in the selected class
  const enrolledStudents = useMemo(() => {
    return realStudents.filter(s => s.current_class_name === selectedClass);
  }, [realStudents, selectedClass]);

  // Sync selected student ID
  useEffect(() => {
    if (enrolledStudents.length > 0) {
      if (!selectedStudentId || !enrolledStudents.some(s => s.id === selectedStudentId)) {
        setSelectedStudentId(enrolledStudents[0].id);
      }
    } else {
      setSelectedStudentId('');
    }
  }, [enrolledStudents, selectedClass]);

  // Detect active MENA Preset for the selected class
  const currentMenaPreset = useMemo<MenaPresetSpec>(() => {
    const norm = selectedClass.toUpperCase();
    if (norm.includes('6È') || norm.includes('6E') || norm.includes('5È') || norm.includes('5E')) return MENA_PRESETS[0];
    if (norm.includes('4È') || norm.includes('4E') || norm.includes('3È') || norm.includes('3E')) return MENA_PRESETS[1];
    if (norm.includes('2NDE A') || norm.includes('2NDA')) return MENA_PRESETS[2];
    if (norm.includes('2NDE C') || norm.includes('2NDC')) return MENA_PRESETS[3];
    if (norm.includes('1ÈRE A') || norm.includes('1ERA')) return MENA_PRESETS[4];
    if (norm.includes('1ÈRE C') || norm.includes('1ÈRE D') || norm.includes('1ERC') || norm.includes('1ERD')) return MENA_PRESETS[5];
    if (norm.includes('TLE A') || norm.includes('TERMINALE A')) return MENA_PRESETS[6];
    if (norm.includes('TLE C') || norm.includes('TLE D') || norm.includes('TERMINALE C') || norm.includes('TERMINALE D')) return MENA_PRESETS[7];

    return MENA_PRESETS[1]; // Default to 4e/3e preset
  }, [selectedClass]);

  // Flexible Subject Grades Row Lookup
  const findStudentRowsForSubject = (sbjName: string, sbjCode?: string): StudentGradesRow[] => {
    if (classGradesMap[sbjName] && classGradesMap[sbjName].length > 0) {
      return classGradesMap[sbjName];
    }
    const simpleName = sbjName.split('(')[0].trim();
    if (classGradesMap[simpleName] && classGradesMap[simpleName].length > 0) {
      return classGradesMap[simpleName];
    }
    const mapKeys = Object.keys(classGradesMap);
    for (const key of mapKeys) {
      const normKey = key.toLowerCase();
      const normSbj = sbjName.toLowerCase();
      const normCode = (sbjCode || '').toLowerCase();

      if (normKey === normSbj || normKey.includes(normSbj) || normSbj.includes(normKey)) {
        return classGradesMap[key];
      }
      if ((normKey.includes('fran') || normCode === 'fran') && (normSbj.includes('fran') || normCode === 'fran')) {
        return classGradesMap[key];
      }
      if ((normKey.includes('math') || normCode === 'math') && (normSbj.includes('math') || normCode === 'math')) {
        return classGradesMap[key];
      }
      if ((normKey.includes('ang') || normCode === 'ang') && (normSbj.includes('ang') || normCode === 'ang')) {
        return classGradesMap[key];
      }
      if (normKey.includes('conduite') || normCode === 'conduite') {
        return classGradesMap[key];
      }
    }
    return [];
  };

  // Dynamic Teacher Name Resolver
  const resolveTeacherName = (sbjName: string, sbjCode?: string): string => {
    const normCode = (sbjCode || '').toUpperCase();
    const normName = sbjName.toUpperCase();

    if (normCode.includes('CONDUITE') || normName.includes('CONDUITE')) {
      const isCollege = selectedClass.includes('6') || selectedClass.includes('5') || selectedClass.includes('4') || selectedClass.includes('3');
      const levelKeyword = isCollege ? 'collège' : 'lycée';
      const educateurMatch = staffList.find(s => 
        s.role === 'educateur' && 
        (s.subject_name ? s.subject_name.toLowerCase().includes(levelKeyword) : true)
      );
      if (educateurMatch) {
        return `${educateurMatch.last_name} ${educateurMatch.first_name} (Éducateur)`;
      }
      return isCollege ? 'BAMBA Honoré (Éducateur)' : 'KOUAMÉ Brou (Éducateur)';
    }

    if (staffList.length > 0) {
      const match = staffList.find(s => {
        if (!s.subject_name) return false;
        const staffSubj = s.subject_name.toUpperCase();
        const simpleStaffSubj = staffSubj.split('(')[0].trim();
        const simpleNormName = normName.split('(')[0].trim();
        return staffSubj === normName ||
               staffSubj.includes(simpleNormName) ||
               simpleNormName.includes(simpleStaffSubj) ||
               (normCode && staffSubj.includes(normCode));
      });
      if (match) return `${match.last_name} ${match.first_name}`;
    }

    if (normCode.includes('FRAN') || normName.includes('FRANÇAIS') || normName.includes('FRANCAIS')) return 'SY Binta';
    if (normCode.includes('MATH') || normName.includes('MATH')) return 'KOUADIO Yao';
    if (normCode.includes('ANG') || normName.includes('ANGLAIS')) return 'KANTÉ Adama';
    if (normCode.includes('PHYS') || normName.includes('PHYSIQUE')) return 'IRIÉ BI Marc';
    if (normCode.includes('SVT') || normName.includes('TERRE') || normName.includes('VIE')) return 'BÉNIE Félix';
    if (normCode.includes('HG') || normName.includes('HISTOIRE') || normName.includes('GÉO')) return 'YAO KAN Paul';
    if (normCode.includes('EPS') || normName.includes('SPORT') || normName.includes('PHYSIQUE')) return 'ZOHOU Alain';
    if (normCode.includes('EDHC') || normName.includes('CIVIQUE')) return 'N\'GORAN Claire';
    if (normCode.includes('ART') || normName.includes('MUSIQUE')) return 'KOFFI Anne';
    if (normCode.includes('PHILO') || normName.includes('PHILOSOPHIE')) return 'KOFFI Marc-Antoine';
    if (normCode.includes('LV2') || normName.includes('ESPAGNOL') || normName.includes('ALLEMAND')) return 'M\'BRA Eric';

    return 'Prof. Titulaire';
  };

  // Helper MENA Average Calculation
  const calculateSubjectMenaAvg = (row?: StudentGradesRow): number | null => {
    if (!row) return null;
    const interros = [row.int1, row.int2, row.int3, row.int4].map(v => parseFloat(v)).filter(v => !isNaN(v));
    const devoirs = [row.ds1, row.ds2, row.ds3].map(v => parseFloat(v)).filter(v => !isNaN(v));
    const noteDN = !isNaN(parseFloat(row.dn)) ? parseFloat(row.dn) : null;

    let totalWeight = 0;
    let weightedSum = 0;

    if (interros.length > 0) {
      const moyInterro = interros.reduce((a, b) => a + b, 0) / interros.length;
      weightedSum += moyInterro * 1;
      totalWeight += 1;
    }
    if (devoirs.length > 0) {
      const moyDevoir = devoirs.reduce((a, b) => a + b, 0) / devoirs.length;
      weightedSum += moyDevoir * 2;
      totalWeight += 2;
    }
    if (noteDN !== null) {
      weightedSum += noteDN * 2;
      totalWeight += 2;
    }

    if (totalWeight === 0) return null;
    return Number((weightedSum / totalWeight).toFixed(2));
  };

  const getAppreciationForScore = (score: number | null): string => {
    if (score === null) return '—';
    if (score >= 16) return 'Très Bien';
    if (score >= 14) return 'Bien';
    if (score >= 12) return 'Assez Bien';
    if (score >= 10) return 'Passable';
    if (score >= 8) return 'Insuffisant';
    return 'Faible';
  };

  // Compute Complete Class Reports according to official preset
  const computedClassReports = useMemo<StudentCalculatedReport[]>(() => {
    if (enrolledStudents.length === 0) return [];

    const presetSubjects = currentMenaPreset.subjects;

    const rawReports = enrolledStudents.map(student => {
      let totalCoef = 0;
      let totalPoints = 0;
      let bonusPointsSum = 0;

      const subjectScores: SubjectScoreResult[] = presetSubjects.map(sbj => {
        const rowsForSubject = findStudentRowsForSubject(sbj.name, sbj.code);
        const studentRow = rowsForSubject.find(r => r.id === student.id);
        
        let calculatedAvg = calculateSubjectMenaAvg(studentRow);

        // Fallback Conduite / Discipline default mock if no grade entered
        if (calculatedAvg === null && (sbj.code === 'CONDUITE' || sbj.name === 'Conduite')) {
          calculatedAvg = 18.00; // Conduite exemplaire par défaut
        }

        if (calculatedAvg === null && selectedClass.includes('3ème')) {
          if (student.id === 'std-001') calculatedAvg = sbj.code.includes('FRAN') ? 15.50 : sbj.code === 'MATH' ? 17.00 : 16.00;
          else if (student.id === 'std-002') calculatedAvg = sbj.code.includes('FRAN') ? 13.00 : sbj.code === 'MATH' ? 11.50 : 13.00;
          else if (student.id === 'std-003') calculatedAvg = sbj.code.includes('FRAN') ? 14.50 : sbj.code === 'MATH' ? 15.50 : 15.00;
          else if (student.id === 'std-004') calculatedAvg = sbj.code.includes('FRAN') ? 12.00 : sbj.code === 'MATH' ? 10.00 : 10.50;
        }

        const isOptional = sbj.isOptional === true;
        const isExcluded = sbj.isExcludedFromAverage === true || sbj.code === 'CONDUITE';
        let bonusPoints = 0;

        if (isOptional) {
          // Règle de gestion LV2 Facultative : seuls les points au-dessus de 10 sont ajoutés en bonus
          if (calculatedAvg !== null && calculatedAvg > 10) {
            bonusPoints = calculatedAvg - 10;
            bonusPointsSum += bonusPoints;
          }
        } else if (isExcluded) {
          // Conduite / Discipline : Exclue du calcul de la moyenne trimestrielle/annuelle
        } else {
          const coef = sbj.coef;
          const weighted = calculatedAvg !== null ? calculatedAvg * coef : 0;
          if (calculatedAvg !== null) {
            totalCoef += coef;
            totalPoints += weighted;
          }
        }

        let appreciationText = getAppreciationForScore(calculatedAvg);
        if (isExcluded && calculatedAvg !== null) {
          appreciationText = calculatedAvg >= 16 ? 'Excellente Conduite' : calculatedAvg >= 14 ? 'Bonne Conduite' : 'Conduite à améliorer';
        }

        return {
          subjectName: sbj.name,
          category: sbj.category || 'Général',
          coef: sbj.coef,
          moyenne: calculatedAvg,
          displayMoyenne: calculatedAvg !== null ? calculatedAvg.toFixed(2) : '—',
          weightedPoints: isOptional 
            ? Number(bonusPoints.toFixed(2)) 
            : isExcluded 
            ? Number((calculatedAvg || 0).toFixed(2))
            : Number(((calculatedAvg || 0) * sbj.coef).toFixed(2)),
          rankInSubject: '-',
          appreciation: appreciationText,
          teacher: resolveTeacherName(sbj.name, sbj.code),
          isOptional,
          isExcludedFromAverage: isExcluded,
          bonusPoints
        };
      });

      const finalTotalPoints = Number((totalPoints + bonusPointsSum).toFixed(2));
      const overallMoyenne = totalCoef > 0 ? Number((finalTotalPoints / totalCoef).toFixed(2)) : null;

      let decision = 'Travail Moyen';
      if (overallMoyenne !== null) {
        if (overallMoyenne >= 16) decision = 'Félicitations du Conseil de Classe';
        else if (overallMoyenne >= 14) decision = 'Tableau d\'Honneur + Encouragements';
        else if (overallMoyenne >= 12) decision = 'Tableau d\'Honneur';
        else if (overallMoyenne >= 10) decision = 'Admis / Satisfaisant';
        else if (overallMoyenne >= 8.5) decision = 'Avertissement Travail';
        else decision = 'Blâme Travail';
      }

      return {
        student,
        subjectScores,
        totalCoef,
        totalPoints: finalTotalPoints,
        overallMoyenne,
        overallMoyenneStr: overallMoyenne !== null ? overallMoyenne.toFixed(2) : '—',
        rank: 0,
        rankStr: '-',
        appreciation: getAppreciationForScore(overallMoyenne),
        decision,
        bonusPointsSum
      };
    });

    const sorted = [...rawReports].sort((a, b) => (b.overallMoyenne || 0) - (a.overallMoyenne || 0));

    sorted.forEach((item, idx) => {
      item.rank = idx + 1;
      item.rankStr = idx === 0 ? '1er' : `${idx + 1}e`;
    });

    presetSubjects.forEach((sbj, sbjIdx) => {
      const sortedSubject = [...sorted].sort((a, b) => {
        const scoreA = a.subjectScores[sbjIdx]?.moyenne || 0;
        const scoreB = b.subjectScores[sbjIdx]?.moyenne || 0;
        return scoreB - scoreA;
      });

      sortedSubject.forEach((st, sIdx) => {
        if (st.subjectScores[sbjIdx]) {
          st.subjectScores[sbjIdx].rankInSubject = sIdx === 0 ? '1er' : `${sIdx + 1}e`;
        }
      });
    });

    return sorted;
  }, [enrolledStudents, classGradesMap, selectedClass, currentMenaPreset]);

  // Overall Class Statistics
  const classStats = useMemo(() => {
    const validReports = computedClassReports.filter(r => r.overallMoyenne !== null);
    if (validReports.length === 0) {
      return {
        classAverage: '—',
        maxAverage: '—',
        minAverage: '—',
        majorStudentName: '—',
        passCount: 0,
        passRate: '0%',
        totalStudents: enrolledStudents.length
      };
    }

    const averages = validReports.map(r => r.overallMoyenne!);
    const sum = averages.reduce((a, b) => a + b, 0);
    const classAverage = (sum / averages.length).toFixed(2);
    const maxAverage = Math.max(...averages).toFixed(2);
    const minAverage = Math.min(...averages).toFixed(2);
    const major = validReports.find(r => r.overallMoyenne!.toFixed(2) === maxAverage);
    const passCount = validReports.filter(r => r.overallMoyenne! >= 10.0).length;
    const passRate = `${((passCount / validReports.length) * 100).toFixed(1)}%`;

    return {
      classAverage,
      maxAverage,
      minAverage,
      majorStudentName: major ? `${major.student.last_name} ${major.student.first_name}` : '—',
      passCount,
      passRate,
      totalStudents: enrolledStudents.length
    };
  }, [computedClassReports, enrolledStudents]);

  const classSubjectStats = useMemo(() => {
    if (computedClassReports.length === 0) return [];
    const subjects = computedClassReports[0]?.subjectScores || [];

    return subjects.map((sbj, sbjIdx) => {
      const scores = computedClassReports
        .map(r => r.subjectScores[sbjIdx]?.moyenne)
        .filter((v): v is number => v !== null);

      if (scores.length === 0) {
        return { name: sbj.subjectName, coef: sbj.coef, avg: '—', max: '—', min: '—' };
      }

      const sum = scores.reduce((a, b) => a + b, 0);
      return {
        name: sbj.subjectName,
        coef: sbj.coef,
        avg: (sum / scores.length).toFixed(2),
        max: Math.max(...scores).toFixed(2),
        min: Math.min(...scores).toFixed(2)
      };
    });
  }, [computedClassReports]);

  const selectedStudentReport = useMemo(() => {
    return computedClassReports.find(r => r.student.id === selectedStudentId) || computedClassReports[0];
  }, [computedClassReports, selectedStudentId]);

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-brand-500" />
            <span>Bulletins & Recueil des Moyennes MENA</span>
          </h1>
          <p className="text-xs text-slate-400">
            Grille officielle des coefficients : <span className="font-bold text-brand-600 dark:text-brand-400">{currentMenaPreset.title} ({currentMenaPreset.totalCoef} Coef)</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPromptModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Prompts Officiels MENA par Niveau</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('bulletin')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'bulletin'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Bulletin Individuel</span>
            </button>
            <button
              onClick={() => setActiveTab('recueil')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'recueil'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Recueil des Moyennes & Statistiques</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Classe:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500 text-xs"
            >
              {classList.length > 0 ? (
                classList.map(cls => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))
              ) : (
                <option value="3ème 2">3ème 2</option>
              )}
            </select>
          </div>

          {activeTab === 'bulletin' && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Élève:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500 text-xs"
              >
                {enrolledStudents.length > 0 ? (
                  enrolledStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.last_name} {st.first_name} ({st.registration_number})
                    </option>
                  ))
                ) : (
                  <option value="">Aucun élève inscrit</option>
                )}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Période:</span>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500 text-xs"
            >
              <option value="1er Trimestre">1er Trimestre</option>
              <option value="2ème Trimestre">2ème Trimestre</option>
              <option value="3ème Trimestre">3ème Trimestre</option>
            </select>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-3 py-1.5 rounded-lg text-xs font-extrabold border border-brand-200 dark:border-brand-800">
            <Info className="w-3.5 h-3.5" />
            <span>Grille MENA : {currentMenaPreset.levelKey} (Total Points Max: {currentMenaPreset.maxPoints})</span>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>{activeTab === 'bulletin' ? 'Imprimer le Bulletin' : 'Imprimer le Recueil des Moyennes'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OFFICIAL INDIVIDUAL REPORT CARD */}
      {/* ========================================================================= */}
      {activeTab === 'bulletin' && (
        selectedStudentReport ? (
          <div className="printable-area bg-white text-slate-900 border-2 border-slate-800 p-6 md:p-8 max-w-4xl mx-auto shadow-2xl space-y-4 font-sans text-xs">
            
            {/* Header MENAET & School Info */}
            <div className="grid grid-cols-12 gap-2 border-b-2 border-slate-900 pb-3 items-start">
              <div className="col-span-6 text-[10px] space-y-0.5 leading-tight">
                <div className="font-bold uppercase text-[9px]">MINISTÈRE DE L'ÉDUCATION NATIONALE ET DE L'ALPHABÉTISATION</div>
                <div className="font-semibold text-[10px]">DRENA ABIDJAN / CÔTE D'IVOIRE</div>
                <div className="pt-1 flex items-start gap-2">
                  <div className="w-12 h-12 border border-slate-400 flex items-center justify-center overflow-hidden bg-slate-50">
                    {currentSchool.logo_url ? (
                      <img src={currentSchool.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-extrabold text-[9px] text-slate-700 text-center">ÉCOLE</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xs">Établissement: {currentSchool.name}</div>
                    <div>Adresse: {currentSchool.address || 'Abidjan'} | Tél: {currentSchool.phone}</div>
                  </div>
                </div>
              </div>

              <div className="col-span-6 text-right space-y-1">
                <div className="text-[11px] font-bold text-slate-700">Année scolaire: <span className="font-extrabold">2025-2026</span></div>
                <div className="font-extrabold text-sm uppercase tracking-wide border-2 border-slate-900 p-1.5 inline-block text-center">
                  BULLETIN TRIMESTRIEL DE NOTES<br />
                  <span className="text-xs">{selectedTerm}</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Matricule MENA: <span className="font-bold">{selectedStudentReport.student.registration_number}</span> | Statut: <span className="font-bold">{currentSchool.school_type}</span>
                </div>
              </div>
            </div>

            {/* Student Profile Grid */}
            <div className="grid grid-cols-12 gap-2 border border-slate-800 p-3 bg-slate-50/50 text-[11px]">
              <div className="col-span-8 space-y-1">
                <div className="text-sm font-extrabold uppercase text-slate-900 flex items-center gap-2">
                  <span>{selectedStudentReport.student.last_name} {selectedStudentReport.student.first_name}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                  <div><span className="font-bold">Matricule:</span> <span className="font-mono font-bold">{selectedStudentReport.student.registration_number}</span></div>
                  <div><span className="font-bold">Sexe:</span> {selectedStudentReport.student.gender}</div>
                  <div><span className="font-bold">Classe:</span> <span className="font-extrabold text-brand-700">{selectedClass}</span></div>
                  <div><span className="font-bold">Né(e) le:</span> {selectedStudentReport.student.date_of_birth}</div>
                  <div><span className="font-bold">Effectif de la classe:</span> {enrolledStudents.length} élèves</div>
                  <div><span className="font-bold">Lieu de naissance:</span> {selectedStudentReport.student.place_of_birth}</div>
                  <div><span className="font-bold">Nationalité:</span> {selectedStudentReport.student.nationality || 'Ivoirienne'}</div>
                  <div><span className="font-bold">Statut:</span> {selectedStudentReport.student.status}</div>
                </div>
              </div>

              <div className="col-span-4 flex justify-end items-center">
                <div className="w-24 h-28 border-2 border-slate-400 bg-slate-100 flex flex-col items-center justify-center text-slate-400 overflow-hidden">
                  <img 
                    src={selectedStudentReport.student.photo_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'} 
                    alt={selectedStudentReport.student.last_name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Disciplines & Grades Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse border-2 border-slate-900">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-extrabold border-b-2 border-slate-900 text-center uppercase text-[10px]">
                    <th className="p-1.5 border-r border-slate-800 text-left w-48">DISCIPLINES</th>
                    <th className="p-1.5 border-r border-slate-800 w-12">Moy.</th>
                    <th className="p-1.5 border-r border-slate-800 w-14">Coef.</th>
                    <th className="p-1.5 border-r border-slate-800 w-16">Total Pts</th>
                    <th className="p-1.5 border-r border-slate-800 w-12">Rang</th>
                    <th className="p-1.5 border-r border-slate-800 w-28 text-left">Appréciations</th>
                    <th className="p-1.5 border-r border-slate-800 w-36 text-left">Professeurs</th>
                    <th className="p-1.5 w-16">Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedStudentReport.subjectScores.map((r, idx) => (
                    <tr key={idx} className={r.isExcludedFromAverage ? 'bg-amber-50/50 hover:bg-amber-100/50' : 'hover:bg-slate-50'}>
                      <td className="p-1.5 font-bold pl-2">
                        {r.subjectName}
                        {r.isOptional && <span className="text-[9px] text-purple-700 font-semibold ml-1">(Facultative - Bonus &gt; 10)</span>}
                        {r.isExcludedFromAverage && <span className="text-[9px] text-amber-800 font-semibold ml-1 font-mono text-[8px] uppercase border border-amber-300 bg-amber-100 px-1 rounded">(Hors Moyenne)</span>}
                      </td>
                      <td className="p-1.5 text-center font-bold">{r.displayMoyenne}</td>
                      <td className="p-1.5 text-center font-bold text-indigo-700">
                        {r.isOptional ? '-' : r.isExcludedFromAverage ? '1*' : r.coef}
                      </td>
                      <td className="p-1.5 text-center font-bold">
                        {r.isOptional 
                          ? (r.bonusPoints ? `+${r.bonusPoints.toFixed(2)}` : '0.00') 
                          : r.isExcludedFromAverage 
                          ? `${r.displayMoyenne}*`
                          : (r.moyenne !== null ? (r.moyenne * r.coef).toFixed(2) : '—')}
                      </td>
                      <td className="p-1.5 text-center font-bold">{r.rankInSubject}</td>
                      <td className="p-1.5 italic">{r.appreciation}</td>
                      <td className="p-1.5 font-semibold">{r.teacher}</td>
                      <td className="p-1.5 text-center italic text-[9px]">Signé</td>
                    </tr>
                  ))}

                  {/* TOTAUX ROW */}
                  <tr className="bg-slate-900 text-white font-extrabold">
                    <td className="p-2 pl-2 uppercase">TOTAUX GÉNÉRAUX ({selectedStudentReport.totalCoef} COEF) :</td>
                    <td className="p-2 text-center text-sm">{selectedStudentReport.overallMoyenneStr}</td>
                    <td className="p-2 text-center text-sm">{selectedStudentReport.totalCoef}</td>
                    <td className="p-2 text-center text-sm">{selectedStudentReport.totalPoints.toFixed(2)} / {currentMenaPreset.maxPoints}</td>
                    <td className="p-2" colSpan={4}></td>
                  </tr>
                </tbody>
              </table>
              <div className="text-[9px] italic text-slate-500 pt-1">
                * Note : La discipline <span className="font-bold">Conduite (Coeff 1)</span> est portée au bulletin à titre indicatif et n'est pas comptabilisée dans le calcul de la moyenne trimestrielle/annuelle.
              </div>
            </div>

            {/* Summary Blocks: Assiduité, Moyenne, Résultats */}
            <div className="grid grid-cols-3 gap-2 border-2 border-slate-900 p-2 bg-slate-50 text-[10px]">
              {/* Assiduité */}
              <div className="border-r border-slate-400 pr-2 space-y-1">
                <div className="font-extrabold uppercase text-[11px] border-b pb-0.5">Assiduité & Discipline</div>
                <div className="flex justify-between"><span>Éducateur Référent:</span> <span className="font-bold text-slate-900">{resolveTeacherName('Conduite', 'CONDUITE')}</span></div>
                <div className="flex justify-between"><span>Note de Conduite:</span> <span className="font-bold text-amber-800 font-mono">18.00 / 20</span></div>
                <div className="flex justify-between"><span>Absences (heures):</span> <span className="font-bold">0 h</span></div>
                <div className="flex justify-between"><span>Retards enregistrés:</span> <span className="font-bold">0</span></div>
                <div className="flex justify-between"><span>Points Bonus LV2:</span> <span className="font-bold text-purple-700">+{selectedStudentReport.bonusPointsSum || 0} pts</span></div>
              </div>

              {/* Moyenne trimestrielle */}
              <div className="border-r border-slate-400 px-2 text-center space-y-1">
                <div className="font-extrabold uppercase text-[11px] border-b pb-0.5">Moyenne Trimestrielle</div>
                <div className="text-lg font-extrabold text-slate-900 pt-1">{selectedStudentReport.overallMoyenneStr} / 20</div>
                <div className="font-bold text-brand-700 text-xs">Rang : <span className="text-sm font-extrabold">{selectedStudentReport.rankStr}</span> sur {enrolledStudents.length}</div>
              </div>

              {/* Résultats de classe */}
              <div className="pl-2 space-y-1">
                <div className="font-extrabold uppercase text-[11px] border-b pb-0.5">Résultats de la classe ({selectedClass})</div>
                <div className="flex justify-between"><span>Moyenne générale:</span> <span className="font-bold">{classStats.classAverage}</span></div>
                <div className="flex justify-between"><span>Plus faible moyenne:</span> <span className="font-bold">{classStats.minAverage}</span></div>
                <div className="flex justify-between"><span>Plus forte moyenne:</span> <span className="font-bold text-emerald-700">{classStats.maxAverage}</span></div>
              </div>
            </div>

            {/* LEVEL-SPECIFIC SPECIAL BLOCKS */}
            {currentMenaPreset.specialBlockType === 'bepc' && (
              <div className="border-2 border-indigo-900 bg-indigo-50/60 p-2.5 rounded-md text-[10px] space-y-1">
                <div className="font-extrabold text-indigo-900 uppercase text-xs flex items-center justify-between">
                  <span>Bloc de Préparation à l'Examen du BEPC (Officiel MENA)</span>
                  <span className="bg-indigo-900 text-white text-[9px] px-2 py-0.5 rounded font-mono">CODE EXAMEN 3È</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 font-semibold text-slate-800">
                  <div>Moyenne Évaluations BEPC Blanc: <span className="font-extrabold text-indigo-700">{selectedStudentReport.overallMoyenneStr} / 20</span></div>
                  <div>Avis d'Admissibilité BEPC: <span className="font-extrabold text-emerald-700">{(selectedStudentReport.overallMoyenne || 0) >= 10 ? 'Très Favorable' : 'À Renforcer'}</span></div>
                  <div>Niveau d'Acquisition des Compétences: <span className="font-extrabold text-slate-900">{selectedStudentReport.appreciation}</span></div>
                </div>
              </div>
            )}

            {currentMenaPreset.specialBlockType === 'orientation_seconde_a' && (
              <div className="border-2 border-purple-900 bg-purple-50/60 p-2.5 rounded-md text-[10px] space-y-1">
                <div className="font-extrabold text-purple-900 uppercase text-xs">
                  Avis d'Orientation Préférentiel pour la Première (Seconde Littéraire)
                </div>
                <div className="flex items-center gap-4 pt-1 font-bold text-purple-950">
                  <span>Filières Recommandées :</span>
                  <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded border border-purple-300">Première A1 (Littérature + Math)</span>
                  <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded border border-purple-300">Première A2 (Langues + Philo)</span>
                  <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded border border-purple-300">Première L (Lettres Uniques)</span>
                </div>
              </div>
            )}

            {currentMenaPreset.specialBlockType === 'orientation_seconde_c' && (
              <div className="border-2 border-blue-900 bg-blue-50/60 p-2.5 rounded-md text-[10px] space-y-1">
                <div className="font-extrabold text-blue-900 uppercase text-xs">
                  Recommandation d'Orientation Scientifique (Seconde C)
                </div>
                <div className="flex items-center gap-4 pt-1 font-bold text-blue-950">
                  <span>Recommandation du Conseil :</span>
                  <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded border border-blue-300">Première C (Maths & Physique Intenses)</span>
                  <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded border border-blue-300">Première D (Sciences de la Vie & Terre)</span>
                </div>
              </div>
            )}

            {currentMenaPreset.specialBlockType === 'bac_blanc_a' && (
              <div className="border-2 border-amber-900 bg-amber-50/60 p-2.5 rounded-md text-[10px] space-y-1">
                <div className="font-extrabold text-amber-900 uppercase text-xs">
                  Module Examen Baccalauréat Blanc & Mentions du Conseil (Terminale Littéraire)
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 font-bold text-slate-900">
                  <div>Statistiques BAC Blanc: <span className="text-amber-800">{selectedStudentReport.overallMoyenneStr} / 20</span></div>
                  <div>Pronostic d'Admissibilité: <span className="text-emerald-700">{(selectedStudentReport.overallMoyenne || 0) >= 10 ? 'Admissible' : 'Rattrapage requis'}</span></div>
                  <div>Profil Terminale: <span className="text-indigo-700">{selectedStudentReport.decision}</span></div>
                </div>
              </div>
            )}

            {currentMenaPreset.specialBlockType === 'bac_simul_c_d' && (
              <div className="border-2 border-emerald-900 bg-emerald-50/60 p-2.5 rounded-md text-[10px] space-y-1">
                <div className="font-extrabold text-emerald-900 uppercase text-xs">
                  Grille de Simulation d'Admissibilité au BAC Scientifique (Terminale C / D)
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 font-bold text-slate-900">
                  <div>Total Points Pondérés (Coeff 23): <span className="text-emerald-800">{selectedStudentReport.totalPoints.toFixed(2)} / 460 pts</span></div>
                  <div>Moyenne Seuil Admissibilité: <span className="text-emerald-700">{(selectedStudentReport.overallMoyenne || 0) >= 10 ? 'BAC Validé avec Succès' : 'Sous la Barre d\'Admissibilité'}</span></div>
                  <div>Mention Prédictive: <span className="text-indigo-700">{selectedStudentReport.appreciation}</span></div>
                </div>
              </div>
            )}

            {/* Bottom Section: Mentions, Appréciations, Chef d'Établissement */}
            <div className="grid grid-cols-12 gap-2 border-2 border-slate-900 p-2 text-[10px]">
              {/* Mentions du conseil */}
              <div className="col-span-4 border-r border-slate-400 pr-2 space-y-2">
                <div className="font-extrabold text-center uppercase border-b pb-0.5">Mentions du Conseil de Classe</div>
                
                <div className="space-y-1">
                  <div className="font-bold text-[9px] text-slate-500 uppercase">DISTINCTIONS</div>
                  <div className="flex items-center gap-1.5"><input type="checkbox" checked={(selectedStudentReport.overallMoyenne || 0) >= 16} readOnly /> <span className="font-bold">Tableau d'Honneur + Félicitations</span></div>
                  <div className="flex items-center gap-1.5"><input type="checkbox" checked={(selectedStudentReport.overallMoyenne || 0) >= 14 && (selectedStudentReport.overallMoyenne || 0) < 16} readOnly /> <span>Tableau d'Honneur + Encouragements</span></div>
                  <div className="flex items-center gap-1.5"><input type="checkbox" checked={(selectedStudentReport.overallMoyenne || 0) >= 12 && (selectedStudentReport.overallMoyenne || 0) < 14} readOnly /> <span>Tableau d'Honneur</span></div>
                </div>
              </div>

              {/* Appréciations du conseil */}
              <div className="col-span-4 border-r border-slate-400 px-2 flex flex-col justify-between">
                <div>
                  <div className="font-extrabold text-center uppercase border-b pb-0.5">Appréciation Générale</div>
                  <div className="font-bold italic text-slate-900 text-sm text-center pt-3">
                    {selectedStudentReport.decision}
                  </div>
                </div>

                <div className="border-t pt-2 text-center space-y-0.5">
                  <div className="text-[9px] italic">Signature du Professeur Principal</div>
                  <div className="font-bold text-xs uppercase">Dr. Yao KOUADIO</div>
                </div>
              </div>

              {/* Chef d'Établissement */}
              <div className="col-span-4 pl-2 flex flex-col justify-between text-center">
                <div>
                  <div className="font-extrabold uppercase border-b pb-0.5">Chef d'Établissement</div>
                  <div className="text-[9px] text-slate-500 pt-1">Fait le {new Date().toLocaleDateString()}</div>
                  <div className="font-bold text-xs pt-1">Le Directeur / Proviseur</div>
                </div>

                <div className="font-extrabold text-[10px] uppercase text-slate-900 pt-4">
                  {currentSchool.director_name}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center text-slate-400 border border-slate-200 dark:border-slate-800">
            <AlertCircle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-200">Aucun élève inscrit trouvé pour la classe {selectedClass}</p>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RECUEIL DES MOYENNES & STATISTIQUES DE CLASSE (MASTER MARK SHEET) */}
      {/* ========================================================================= */}
      {activeTab === 'recueil' && (
        <div className="space-y-6">
          {/* STATISTICAL SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Moyenne Classe</span>
                <Award className="w-4 h-4 text-brand-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {classStats.classAverage} <span className="text-xs font-normal text-slate-400">/ 20</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Grille : {currentMenaPreset.levelKey}</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Plus Forte Moy. (Major)</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {classStats.maxAverage} <span className="text-xs font-normal text-slate-400">/ 20</span>
              </div>
              <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate mt-1">
                {classStats.majorStudentName}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Plus Faible Moyenne</span>
                <TrendingUp className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {classStats.minAverage} <span className="text-xs font-normal text-slate-400">/ 20</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Note minimale de la classe</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Taux de Réussite</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {classStats.passRate}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{classStats.passCount} élèves sur {classStats.totalStudents} ($\ge 10/20$)</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Total Coefficients</span>
                <Users className="w-4 h-4 text-brand-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {currentMenaPreset.totalCoef} <span className="text-xs font-normal text-slate-400">coefs</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Max Points: {currentMenaPreset.maxPoints} pts</div>
            </div>
          </div>

          {/* MASTER MARK REGISTER TABLE (RECUEIL DE MOYENNES PAR MATIÈRE ET PAR ÉLÈVE) */}
          <div className="printable-area bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-brand-400" />
                  <span>PROCÈS-VERBAL RÉCAPITULATIF DE DÉLIBÉRATION — {selectedClass}</span>
                </h3>
                <p className="text-[11px] text-slate-300">Recueil officiel MENA ({currentMenaPreset.title} — {currentMenaPreset.totalCoef} Coef) — {selectedTerm}</p>
              </div>

              <div className="text-right text-xs font-mono font-bold text-brand-300">
                {currentSchool.name}
              </div>
            </div>

            <div className="overflow-x-auto">
              {computedClassReports.length > 0 ? (
                <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-2 text-center w-12">Rang</th>
                      <th className="py-3 px-3">Matricule</th>
                      <th className="py-3 px-4 min-w-[180px]">Élève</th>

                      {/* Dynamic Preset Subject Columns */}
                      {computedClassReports[0].subjectScores.map((sbj, idx) => (
                        <th key={idx} className="py-3 px-2 text-center min-w-[85px]">
                          <div>{sbj.subjectName}</div>
                          <div className="text-[9px] text-brand-600 dark:text-brand-400 font-normal">
                            {sbj.isOptional ? 'Facult. (Bonus >10)' : sbj.isExcludedFromAverage ? '1 (Hors moy.)' : `Coef. ${sbj.coef}`}
                          </div>
                        </th>
                      ))}

                      <th className="py-3 px-2 text-center bg-slate-200 dark:bg-slate-700">Tot. Coef</th>
                      <th className="py-3 px-2 text-center bg-slate-200 dark:bg-slate-700">Tot. Pts</th>
                      <th className="py-3 px-3 text-center bg-brand-900 text-white font-extrabold">Moy. Gen.</th>
                      <th className="py-3 px-3">Décision du Conseil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {computedClassReports.map((row) => (
                      <tr key={row.student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-2 text-center font-extrabold">
                          <span className={`px-2 py-0.5 rounded-md text-xs inline-block ${
                            row.rank === 1 ? 'bg-amber-100 text-amber-900 font-extrabold border border-amber-300' :
                            row.rank === 2 ? 'bg-slate-200 text-slate-800 font-extrabold' :
                            row.rank === 3 ? 'bg-amber-700/20 text-amber-800 font-bold' : 'text-slate-600 dark:text-slate-300'
                          }`}>
                            {row.rankStr}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                          {row.student.registration_number}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                          {row.student.last_name} {row.student.first_name}
                        </td>

                        {/* Subject Scores */}
                        {row.subjectScores.map((sbj, idx) => (
                          <td key={idx} className="py-2.5 px-2 text-center font-semibold">
                            <span className={
                              sbj.moyenne !== null && sbj.moyenne >= 14 ? 'text-emerald-700 dark:text-emerald-400 font-bold' :
                              sbj.moyenne !== null && sbj.moyenne < 10 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-slate-200'
                            }>
                              {sbj.displayMoyenne}
                            </span>
                          </td>
                        ))}

                        <td className="py-2.5 px-2 text-center font-bold bg-slate-50 dark:bg-slate-800/40">{row.totalCoef}</td>
                        <td className="py-2.5 px-2 text-center font-bold bg-slate-50 dark:bg-slate-800/40">{row.totalPoints.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center bg-brand-50 dark:bg-brand-950/40">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold inline-block ${
                            (row.overallMoyenne || 0) >= 14 ? 'bg-emerald-600 text-white' :
                            (row.overallMoyenne || 0) >= 10 ? 'bg-brand-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {row.overallMoyenneStr} / 20
                          </span>
                        </td>
                        <td className="py-2.5 px-3 italic text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {row.decision}
                        </td>
                      </tr>
                    ))}

                    {/* MOYENNES DU GROUPE DE CLASSE */}
                    <tr className="bg-slate-900 text-white font-extrabold text-xs">
                      <td className="py-3 px-4 uppercase text-right" colSpan={3}>MOYENNE DU GROUPE CLASSE :</td>
                      {classSubjectStats.map((st, idx) => (
                        <td key={idx} className="py-3 px-2 text-center text-amber-300">
                          {st.avg}
                        </td>
                      ))}
                      <td className="py-3 px-2 text-center" colSpan={2}>-</td>
                      <td className="py-3 px-3 text-center text-amber-300 font-extrabold text-sm">
                        {classStats.classAverage}
                      </td>
                      <td className="py-3 px-3">Taux Réussite: {classStats.passRate}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                  <p className="font-bold">Aucune donnée disponible pour le recueil de cette classe.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PROMPTS MODAL */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-amber-400/30 uppercase tracking-widest inline-flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3" /> Prompts de Génération de Bulletins MENA
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">Grilles de Coefficients & Prompts par Niveau</h2>
                <p className="text-slate-300 text-xs mt-0.5">Copiez les prompts officiels pour générer vos bulletins via IA ou exporter vos relevés.</p>
              </div>
              <button 
                onClick={() => setShowPromptModal(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Presets Navigation Tabs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {MENA_PRESETS.map((preset) => {
                  const isSelected = selectedPresetForPrompt.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPresetForPrompt(preset)}
                      className={`p-3 rounded-2xl border text-left text-xs transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-purple-900/10 border-purple-500 text-purple-900 dark:text-purple-300 font-extrabold ring-2 ring-purple-500/20' 
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{preset.cycle}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                      </div>
                      <div className="font-extrabold mt-1">{preset.levelKey}</div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1">Coeff: {preset.totalCoef} | Max: {preset.maxPoints} pts</div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Preset Detailed Content */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <span>{selectedPresetForPrompt.title}</span>
                    </h3>
                    <p className="text-xs text-slate-500">Total Coefficients : <span className="font-bold text-purple-600">{selectedPresetForPrompt.totalCoef}</span> | Total Max Points : <span className="font-bold">{selectedPresetForPrompt.maxPoints} pts</span></p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(selectedPresetForPrompt.prompt, selectedPresetForPrompt.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all self-start sm:self-auto"
                  >
                    {copiedId === selectedPresetForPrompt.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Prompt Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copier le Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Matières & Coefficients Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Grille Officielle des Matières & Coefficients :</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedPresetForPrompt.subjects.map((sbj, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{sbj.name}</span>
                        <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded text-[11px]">
                          {sbj.isOptional ? 'Facult. Bonus' : sbj.isExcludedFromAverage ? 'Coeff 1 (Hors Moy.)' : `Coeff ${sbj.coef}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prompt Text Box */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Prompt Officiel à fournir à l'IA :</h4>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap relative border border-slate-800">
                    {selectedPresetForPrompt.prompt}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
              <span>Conforme aux directives du MENA Côte d'Ivoire</span>
              <button
                onClick={() => setShowPromptModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-2 rounded-xl text-xs"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
