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
    <div className="space-y-6 select-none font-sans">
      
      {/* Module Header Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-700 to-gray-800 border border-brand-400/30 rounded-3xl p-6 shadow-xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-96 h-full bg-white/10 backdrop-blur-3xl pointer-events-none rounded-full blur-2xl" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950 shadow-xs flex items-center space-x-1">
                <Trophy className="w-3.5 h-3.5 text-amber-900" />
                <span>Système d'Évaluation MENA</span>
              </span>
              <span className="text-xs text-amber-100 font-mono font-bold">IvoireÉcole+ v2.5</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
              Examens Blancs & Distinctions Scolaires
            </h1>
            <p className="text-xs sm:text-sm text-slate-100 max-w-2xl font-medium">
              Gestion centralisée des BAC & BEPC Blancs, calcul automatisé des moyennes/rangs, tableaux d'honneur et certificats sécurisés par QR Code.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setEditingExam(null);
                setShowExamModal(true);
              }}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-brand-700 rounded-xl text-xs font-extrabold transition-all shadow-lg flex items-center space-x-2 shrink-0"
            >
              <Plus className="w-4 h-4 text-brand-600" />
              <span>Créer Examen Blanc</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mt-6 pt-4 border-t border-white/20 flex items-center space-x-2 overflow-x-auto custom-scrollbar">
          
          <button
            onClick={() => setActiveTab('referential')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'referential' 
                ? 'bg-amber-400 text-slate-950 shadow-md' 
                : 'text-white hover:bg-white/15'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>🇨🇮 Référentiel BAC & BEPC</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'list' 
                ? 'bg-white text-brand-700 shadow-md' 
                : 'text-white hover:bg-white/15'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📝 Examens Blancs</span>
          </button>

          <button
            onClick={() => setActiveTab('grades')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'grades' 
                ? 'bg-white text-brand-700 shadow-md' 
                : 'text-white hover:bg-white/15'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📊 Saisie Notes & Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('rankings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'rankings' 
                ? 'bg-white text-brand-700 shadow-md' 
                : 'text-white hover:bg-white/15'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 Classements & Rangs</span>
          </button>

          <button
            onClick={() => setActiveTab('honor')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'honor' 
                ? 'bg-white text-brand-700 shadow-md' 
                : 'text-white hover:bg-white/15'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>⭐ Tableau d'Honneur</span>
          </button>

          <button
            onClick={() => setActiveTab('awards')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'awards' 
                ? 'bg-white text-brand-700 shadow-md' 
                : 'text-white hover:bg-white/15'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>🎓 Distinctions & Prix</span>
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'certificates' 
                ? 'bg-white text-brand-700 shadow-md' 
                : 'text-white hover:bg-white/15'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>📜 Certificats QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('ceremonies')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'ceremonies' 
                ? 'bg-white text-brand-700 shadow-md' 
                : 'text-white hover:bg-white/15'
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
