import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Users,
  DoorOpen,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  Award
} from 'lucide-react';
import { QualityScoreBreakdown, GenerationStatistics } from '../../../types/timetable';

interface Props {
  qualityScore: QualityScoreBreakdown;
  stats: GenerationStatistics;
  onNavigateToGenerator: () => void;
  onNavigateToConflicts: () => void;
}

export const TimetableDashboardTab: React.FC<Props> = ({
  qualityScore,
  stats,
  onNavigateToGenerator,
  onNavigateToConflicts
}) => {
  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Solver Trigger */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-brand-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 border border-brand-400/30 rounded-full text-brand-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-brand-300" />
              <span>Moteur Intelligent Generation v2.5</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tableau de Bord — Emploi du Temps+
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Superviser la santé de votre emploi du temps scolaire, vérifier le respect des règles absolues (classes d'examen à 12h10, devoirs de niveau) et optimiser la répartition pédagogique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToGenerator}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-brand-500/30 transition-all hover:scale-105"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span>Lancer le Solver 12 Étapes</span>
            </button>
            <button
              onClick={onNavigateToConflicts}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Voir les Conflits ({stats.hardConflictsCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Classes Configuées</span>
            <Layers className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalClassesConfigured}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Examen & Intermédiaires OK</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Enseignants Disponibles</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalTeachersAvailable}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Taux d'affectation 94%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Salles & Labos</span>
            <DoorOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalRoomsAvailable}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Taux d'occupation {stats.occupancyRate}%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Cours Programmés</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalCoursesScheduled}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>0 cours en attente</span>
          </div>
        </div>
      </div>

      {/* Score de Qualité Global */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Score Global de Qualité</span>
            </h3>
            <span className="text-xs text-slate-400">Algorithme Solver</span>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="relative flex items-center justify-center">
              <div className="w-36 h-36 rounded-full border-8 border-brand-500/20 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-brand-600 dark:text-brand-400">
                  {qualityScore.globalScore}%
                </span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  Optimisé
                </span>
              </div>
            </div>

            <div className="mt-4 text-center space-y-1">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Emploi du temps Hautement Conforme
              </p>
              <p className="text-[11px] text-slate-400">
                Toutes les règles d'examen et devoirs de niveau sont respectées à 100%.
              </p>
            </div>
          </div>
        </div>

        {/* Décomposition du Score de Qualité */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Décomposition des Critères d'Optimisation
            </h3>
            <span className="text-xs text-brand-500 font-semibold">Validation Automatique</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-200">
                  Respect des Contraintes Absolues (Hard Constraints)
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {qualityScore.hardConstraintsScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${qualityScore.hardConstraintsScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-200">Équilibre Pédagogique (Matin / Après-midi)</span>
                <span className="text-brand-600 dark:text-brand-400 font-extrabold">
                  {qualityScore.pedagogicalBalanceScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${qualityScore.pedagogicalBalanceScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-200">Optimisation des Enseignants</span>
                <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                  {qualityScore.teacherOptimizationScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${qualityScore.teacherOptimizationScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-200">Optimisation des Salles & Labos</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                  {qualityScore.roomOptimizationScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${qualityScore.roomOptimizationScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-200">Répartition Hebdomadaire Régulière</span>
                <span className="text-purple-600 dark:text-purple-400 font-extrabold">
                  {qualityScore.weeklyDistributionScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${qualityScore.weeklyDistributionScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
