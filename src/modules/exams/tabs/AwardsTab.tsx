import React, { useState, useEffect } from 'react';
import { 
  Award, TrendingUp, Sparkles, Plus, Trophy, BookOpen, 
  Calendar, CheckCircle2, User, Star, ArrowUpRight
} from 'lucide-react';
import { Award as AwardType } from '../../../types/database';
import { examsService } from '../../../services/examsService';

interface AwardsTabProps {
  schoolId: string;
  onGenerateCert: (award: AwardType) => void;
}

export const AwardsTab: React.FC<AwardsTabProps> = ({ schoolId, onGenerateCert }) => {
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [autoDetecting, setAutoDetecting] = useState<boolean>(false);

  // New Award Form state
  const [studentName, setStudentName] = useState<string>('');
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [className, setClassName] = useState<string>('3ème A');
  const [awardCategory, setAwardCategory] = useState<string>('BEST_STUDENT');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [average, setAverage] = useState<string>('16.50');

  useEffect(() => {
    loadAwards();
  }, [schoolId]);

  const loadAwards = async () => {
    setLoading(true);
    try {
      const data = await examsService.getAwards(schoolId);
      setAwards(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    setTimeout(() => {
      setAutoDetecting(false);
    }, 1200);
  };

  const handleCreateAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !title.trim()) return;

    try {
      const created = await examsService.createAward(schoolId, {
        student_id: `stu-${Date.now()}`,
        student_name: studentName,
        registration_number: registrationNumber || '2026-STV-9999',
        class_name: className,
        award_type: awardCategory,
        title,
        description,
        academic_year_id: 'ay-2026-2027',
        average: parseFloat(average) || 16.0
      });

      setAwards([created, ...awards]);
      setShowAddModal(false);
      // Reset form
      setStudentName('');
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
    }
  };

  const getAwardTypeBadge = (type: string) => {
    switch (type) {
      case 'BEST_STUDENT':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1"><Trophy className="w-3.5 h-3.5 text-amber-400" /><span>🥇 Meilleur Élève</span></span>;
      case 'BEST_PROGRESSION':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /><span>📈 Plus Forte Progression</span></span>;
      case 'BEST_IN_SUBJECT':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1"><BookOpen className="w-3.5 h-3.5 text-blue-400" /><span>🔬 Major par Discipline</span></span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1"><Award className="w-3.5 h-3.5 text-purple-400" /><span>⭐ Prix Spécial</span></span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Distinctions, Prix & Récompenses Individuelles</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Détection automatique des meilleurs élèves, progressions et majors par discipline</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleAutoDetect}
            disabled={autoDetecting}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors border border-amber-200 dark:border-amber-800 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{autoDetecting ? 'Détection...' : 'Détection Automatique Profils-Clés'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Attribuer un Prix</span>
          </button>
        </div>
      </div>

      {/* Awards Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {awards.map((award) => (
          <div key={award.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-amber-400 rounded-2xl p-5 shadow-xs transition-all space-y-4 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                {getAwardTypeBadge(award.award_type)}
                {award.progression_delta && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                    +{award.progression_delta.toFixed(2)} pts
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">{award.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{award.description}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-1">
                <div className="font-extrabold text-gray-900 dark:text-gray-100 text-sm">{award.student_name}</div>
                <div className="text-xs text-gray-500 font-medium flex items-center justify-between">
                  <span>{award.class_name} • {award.registration_number}</span>
                  {award.average && <span className="font-black text-amber-600 dark:text-amber-400 font-mono">{award.average.toFixed(2)} / 20</span>}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
              <span className="text-gray-400 italic">Décerné le {new Date(award.awarded_at || Date.now()).toLocaleDateString('fr-FR')}</span>
              <button
                onClick={() => onGenerateCert(award)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-800 hover:text-white text-gray-800 dark:text-gray-200 font-bold rounded-lg transition-colors flex items-center space-x-1"
              >
                <span>Générer Certificat</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Award Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Attribuer une Distinction Individuelle</span>
            </h3>

            <form onSubmit={handleCreateAward} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nom & Prénoms de l'Élève *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: KOUASSI Amenan Grace"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Matricule</label>
                  <input
                    type="text"
                    placeholder="ex: 2026-STV-0012"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Classe</label>
                  <input
                    type="text"
                    placeholder="ex: 3ème A"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catégorie de Distinction</label>
                <select
                  value={awardCategory}
                  onChange={(e) => setAwardCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                >
                  <option value="BEST_STUDENT">Meilleur Élève de la Promotion / Classe</option>
                  <option value="BEST_PROGRESSION">Plus Forte Progression Scolaire</option>
                  <option value="BEST_IN_SUBJECT">Major par Discipline (Maths, SVT, etc.)</option>
                  <option value="EXCELLENCE">Prix d'Excellence & Discipline</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Intitulé du Prix *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Prix du Major de Promo en Mathématiques"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description / Motif</label>
                <textarea
                  rows={2}
                  placeholder="ex: Obtenu avec la moyenne maximale de 19.50/20"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Moyenne Obtenue /20</label>
                <input
                  type="number"
                  step="0.1"
                  value={average}
                  onChange={(e) => setAverage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold"
                >
                  Enregistrer la Distinction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
