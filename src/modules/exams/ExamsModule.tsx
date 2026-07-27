import React, { useState, useEffect } from 'react';
import { 
  Trophy, BookOpen, Star, Award, ShieldCheck, Gift, 
  Plus, RefreshCw, Layers
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Exam, ExamStatus, Certificate, Award as AwardType } from '../../types/database';
import { examsService } from '../../services/examsService';

// Sub-tabs
import { ExamsListTab } from './tabs/ExamsListTab';
import { GradesEntryTab } from './tabs/GradesEntryTab';
import { RankingsTab } from './tabs/RankingsTab';
import { HonorRollTab } from './tabs/HonorRollTab';
import { AwardsTab } from './tabs/AwardsTab';
import { CertificatesTab } from './tabs/CertificatesTab';
import { CeremoniesTab } from './tabs/CeremoniesTab';
import { OfficialReferentialTab } from './tabs/OfficialReferentialTab';

// Modals
import { ExamModal } from './components/ExamModal';
import { CertificatePDFModal } from './components/CertificatePDFModal';

export const ExamsModule: React.FC = () => {
  const { currentSchool } = useTenant();
  const [activeTab, setActiveTab] = useState<'list' | 'referential' | 'grades' | 'rankings' | 'honor' | 'awards' | 'certificates' | 'ceremonies'>('referential');
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    loadExams();
  }, [currentSchool.id]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await examsService.getExams(currentSchool.id);
      setExams(data);
      if (data.length > 0 && !selectedExam) {
        setSelectedExam(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExamAndNavigate = (exam: Exam, targetTab: string = 'grades') => {
    setSelectedExam(exam);
    setActiveTab(targetTab as any);
  };

  const handleUpdateExamStatus = async (examId: string, status: ExamStatus) => {
    await examsService.updateExamStatus(examId, currentSchool.id, status);
    loadExams();
  };

  const handleTriggerCalculation = async (examId: string) => {
    const ex = exams.find(e => e.id === examId);
    if (ex) {
      setSelectedExam(ex);
      await examsService.calculateResults(examId, currentSchool.id);
      await examsService.updateExamStatus(examId, currentSchool.id, 'completed');
      setActiveTab('rankings');
      loadExams();
    }
  };

  const handleGenerateCertFromAward = async (award: AwardType) => {
    const cert = await examsService.generateCertificate(currentSchool.id, {
      student_id: award.student_id,
      student_name: award.student_name,
      registration_number: award.registration_number,
      class_name: award.class_name,
      title: award.title,
      average: award.average,
      rank: award.rank,
      certificate_type: 'EXCELLENCE'
    });
    setSelectedCertificate(cert);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 select-none font-sans">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Système d'Évaluation MENA</span>
            </span>
            <span className="text-xs text-slate-400 font-mono font-semibold">IvoireÉcole+ v2.5</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Examens Blancs & Distinctions Scolaires
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
            Gestion des examens BAC & BEPC blancs, calcul automatisé des rangs, tableaux d'honneur et certificats sécurisés par QR Code.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingExam(null);
            setShowExamModal(true);
          }}
          className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-5 py-3 rounded-2xl text-xs transition-all shadow-md shadow-brand-500/20 flex items-center justify-center space-x-2 shrink-0 transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Créer Examen Blanc</span>
        </button>
      </div>

      {/* Module Navigation Sub-Header - Distinct Professional Color Palette */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl shadow-xs overflow-x-auto custom-scrollbar">
        <div className="flex space-x-2 min-w-max">
          
          <button
            onClick={() => setActiveTab('referential')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
              activeTab === 'referential'
                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 scale-102'
                : 'bg-amber-50/60 text-amber-800 border-amber-200/80 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>🇨🇮 Référentiel BAC & BEPC</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
              activeTab === 'list'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20 scale-102'
                : 'bg-indigo-50/60 text-indigo-800 border-indigo-200/80 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📝 Examens Blancs</span>
          </button>

          <button
            onClick={() => setActiveTab('grades')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
              activeTab === 'grades'
                ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/20 scale-102'
                : 'bg-blue-50/60 text-blue-800 border-blue-200/80 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📊 Saisie Notes & Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('rankings')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
              activeTab === 'rankings'
                ? 'bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-600/20 scale-102'
                : 'bg-purple-50/60 text-purple-800 border-purple-200/80 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-300'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 Classements & Rangs</span>
          </button>

          <button
            onClick={() => setActiveTab('honor')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
              activeTab === 'honor'
                ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20 scale-102'
                : 'bg-rose-50/60 text-rose-800 border-rose-200/80 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>⭐ Tableau d'Honneur</span>
          </button>

          <button
            onClick={() => setActiveTab('awards')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
              activeTab === 'awards'
                ? 'bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-600/20 scale-102'
                : 'bg-amber-50/60 text-amber-900 border-amber-200/80 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>🎓 Distinctions & Prix</span>
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
              activeTab === 'certificates'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20 scale-102'
                : 'bg-emerald-50/60 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>📜 Certificats QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('ceremonies')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
              activeTab === 'ceremonies'
                ? 'bg-cyan-600 text-white border-cyan-700 shadow-md shadow-cyan-600/20 scale-102'
                : 'bg-cyan-50/60 text-cyan-800 border-cyan-200/80 hover:bg-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-300'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>🎁 Palmarès</span>
          </button>

        </div>
      </div>

      {/* Main Tab Content */}
      <div className="pt-2">
        {activeTab === 'referential' && (
          <OfficialReferentialTab
            schoolId={currentSchool.id}
            onExamCreated={(newExam) => {
              loadExams();
              setSelectedExam(newExam);
              setActiveTab('grades');
            }}
          />
        )}

        {activeTab === 'list' && (
          <ExamsListTab
            exams={exams}
            onSelectExam={handleSelectExamAndNavigate}
            onOpenCreateModal={() => {
              setEditingExam(null);
              setShowExamModal(true);
            }}
            onUpdateStatus={handleUpdateExamStatus}
            onTriggerCalculation={handleTriggerCalculation}
          />
        )}

        {activeTab === 'grades' && (
          <GradesEntryTab
            schoolId={currentSchool.id}
            exams={exams}
            selectedExam={selectedExam}
            onSelectExam={(ex) => setSelectedExam(ex)}
            onCalculationDone={() => {
              setActiveTab('rankings');
              loadExams();
            }}
          />
        )}

        {activeTab === 'rankings' && (
          <RankingsTab
            schoolId={currentSchool.id}
            exams={exams}
            selectedExam={selectedExam}
            onSelectExam={(ex) => setSelectedExam(ex)}
          />
        )}

        {activeTab === 'honor' && (
          <HonorRollTab
            schoolId={currentSchool.id}
          />
        )}

        {activeTab === 'awards' && (
          <AwardsTab
            schoolId={currentSchool.id}
            onGenerateCert={handleGenerateCertFromAward}
          />
        )}

        {activeTab === 'certificates' && (
          <CertificatesTab
            schoolId={currentSchool.id}
            onOpenCertificateModal={(cert) => setSelectedCertificate(cert)}
          />
        )}

        {activeTab === 'ceremonies' && (
          <CeremoniesTab
            schoolId={currentSchool.id}
          />
        )}
      </div>

      {/* Exam Create/Edit Modal */}
      {showExamModal && (
        <ExamModal
          schoolId={currentSchool.id}
          isOpen={showExamModal}
          onClose={() => setShowExamModal(false)}
          onSave={async (examData, subjects) => {
            await examsService.createExam(examData, subjects);
            loadExams();
          }}
          existingExam={editingExam}
        />
      )}

      {/* Certificate PDF Viewer Modal */}
      {selectedCertificate && (
        <CertificatePDFModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

    </div>
  );
};
