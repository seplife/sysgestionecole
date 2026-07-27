import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Calendar, Users, BookOpen, Calculator, 
  CheckCircle, Clock, Eye, Edit, Award, Share2, AlertCircle
} from 'lucide-react';
import { Exam, ExamStatus } from '../../../types/database';

interface ExamsListTabProps {
  exams: Exam[];
  onSelectExam: (exam: Exam, targetTab?: string) => void;
  onOpenCreateModal: () => void;
  onUpdateStatus: (examId: string, status: ExamStatus) => void;
  onTriggerCalculation: (examId: string) => void;
}

export const ExamsListTab: React.FC<ExamsListTabProps> = ({
  exams,
  onSelectExam,
  onOpenCreateModal,
  onUpdateStatus,
  onTriggerCalculation
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exam.exam_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || exam.level_id === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || exam.status === selectedStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const getStatusBadge = (status: ExamStatus) => {
    switch (status) {
      case 'published':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1"><CheckCircle className="w-3 h-3" /><span>Publié</span></span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1"><CheckCircle className="w-3 h-3" /><span>Notes Finalisées</span></span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1"><Clock className="w-3 h-3 animate-pulse" /><span>Saisies en cours</span></span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">Brouillon</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter & Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher un examen blanc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold"
            >
              <option value="all">Tous les niveaux</option>
              <option value="3ème">3ème (BEPC)</option>
              <option value="Terminale">Terminale (BAC)</option>
              <option value="4ème">4ème</option>
              <option value="2nde">2nde</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="in_progress">Saisies en cours</option>
              <option value="completed">Calculé / Terminé</option>
              <option value="published">Publié</option>
            </select>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Examen Blanc</span>
          </button>
        </div>

      </div>

      {/* Exam Cards Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Aucun examen blanc trouvé</h3>
          <p className="text-xs text-slate-400">Essayez de modifier vos filtres ou créez votre premier examen blanc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => (
            <div 
              key={exam.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Top Header */}
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
                    {exam.exam_type.replace('_', ' ')}
                  </span>
                  {getStatusBadge(exam.status)}
                </div>

                {/* Exam Title & Details */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-2">
                    {exam.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{exam.level_id}</span>
                    {exam.series_id && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 font-bold">Série {exam.series_id}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-brand-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Matières</div>
                      <div className="font-bold text-slate-900 dark:text-slate-200">{exam.subjects_count || 7} affectées</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Candidats</div>
                      <div className="font-bold text-slate-900 dark:text-slate-200">{exam.candidates_count || 84} inscrits</div>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Période: {new Date(exam.start_date || Date.now()).toLocaleDateString('fr-FR')} au {new Date(exam.end_date || Date.now()).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                
                <button
                  onClick={() => onSelectExam(exam, 'grades')}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 text-slate-700 dark:text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Saisir Notes</span>
                </button>

                <button
                  onClick={() => onTriggerCalculation(exam.id)}
                  title="Calculer les moyennes et rangs"
                  className="p-2 bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-slate-950 rounded-xl text-xs transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSelectExam(exam, 'rankings')}
                  title="Voir les classements"
                  className="p-2 bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-slate-950 rounded-xl text-xs transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onUpdateStatus(exam.id, exam.status === 'published' ? 'completed' : 'published')}
                  title={exam.status === 'published' ? 'Dépublier' : 'Publier au Portail Parent'}
                  className={`p-2 rounded-xl text-xs transition-colors ${
                    exam.status === 'published' 
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                </button>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
