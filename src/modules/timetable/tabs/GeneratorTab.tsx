import React, { useState } from 'react';
import { RefreshCw, Sparkles, CheckCircle2, Play, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { TimetableSolver } from '../../../services/timetable/timetableSolver';
import { TimetableEntry, TimetablePeriod, TimetableConflict, QualityScoreBreakdown, GenerationStatistics } from '../../../types/timetable';
import { getCurrentTenantContext, DEFAULT_ORGANIZATION_ID, DEFAULT_SCHOOL_ID } from '../../../services/tenantService';

interface Props {
  entries: TimetableEntry[];
  periods: TimetablePeriod[];
  onSolverComplete: (
    generatedEntries: TimetableEntry[],
    conflicts: TimetableConflict[],
    qualityScore: QualityScoreBreakdown,
    stats: GenerationStatistics
  ) => void;
}

export const GeneratorTab: React.FC<Props> = ({
  entries,
  periods,
  onSolverComplete
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [lockExisting, setLockExisting] = useState(true);

  const stepsList = [
    'Chargement des classes, matières, enseignants, salles et indisponibilités',
    'Création et structuration des créneaux temporels (S1 à S9)',
    'Réservation automatique du Lundi PM (Examens) et Jeudi PM (Intermédiaires)',
    'Blocage des créneaux interdits & indisponibilités des enseignants',
    'Programmation prioritaire des classes d\'examen (3e, Terminale A & D)',
    'Programmation des matières à forte contrainte (Labos Physique, SVT, EPS, Langues)',
    'Programmation des matières fondamentales (Français, Mathématiques)',
    'Programmation des matières secondaires et optionnelles',
    'Programmation des activités de renforcement et soutien des après-midi d\'examen',
    'Calcul du score global de qualité (Contraintes dures & Confort pédagogique)',
    'Audit & Détection des conflits de chevauchement',
    'Génération des propositions d\'auto-correction'
  ];

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setCurrentStep(0);

    for (let i = 0; i < stepsList.length; i++) {
      setCurrentStep(i + 1);
      await new Promise(r => setTimeout(r, 250)); // Visual progression
    }

    let orgId = DEFAULT_ORGANIZATION_ID;
    let schId = DEFAULT_SCHOOL_ID;
    try {
      const tenant = await getCurrentTenantContext();
      orgId = tenant.organizationId || DEFAULT_ORGANIZATION_ID;
      schId = tenant.schoolId || DEFAULT_SCHOOL_ID;
    } catch {
      // Fallback defaults
    }

    const result = await TimetableSolver.runAutomaticSolver(entries, periods, {
      organizationId: orgId,
      schoolId: schId,
      academicYearId: 'ay-2025-2026',
      versionId: 'v-1',
      prioritizeExamClasses: true,
      lockExistingSlots: lockExisting
    });

    onSolverComplete(
      result.generatedEntries,
      result.conflicts,
      result.qualityScore,
      result.stats
    );
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-brand-500/30">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 border border-brand-400/30 rounded-full text-brand-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            <span>Moteur Constraint Satisfaction Problem (CSP)</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Générateur Automatique sous Contraintes (12 Étapes)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Le moteur parcourt l'ensemble des contraintes dures (arrêt à 12h10 pour les classes d'examen, devoirs du lundi et jeudi après-midi) et optimise la répartition des cours pour maximiser le score de qualité de l'établissement.
          </p>

          <div className="flex items-center gap-4 pt-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={lockExisting}
                onChange={e => setLockExisting(e.target.checked)}
                className="w-4 h-4 text-brand-500 rounded"
              />
              <span>Verrouiller les créneaux déjà validés manuellement</span>
            </label>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
          <button
            disabled={isGenerating}
            onClick={handleStartGeneration}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-brand-500/40 transition-all hover:scale-105"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Génération en cours (Étape {currentStep}/12)...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Lancer la Génération Automatique</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 12 Steps Visual Tracker */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-500" />
          <span>Workflow des 12 Étapes du Solver</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stepsList.map((stepName, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStep > stepNum || (!isGenerating && currentStep === 12);
            const isCurrent = isGenerating && currentStep === stepNum;

            return (
              <div
                key={stepNum}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-slate-800 dark:text-slate-200'
                    : isCurrent
                    ? 'bg-brand-50 dark:bg-brand-950/30 border-brand-500 text-brand-900 dark:text-brand-200 ring-2 ring-brand-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-brand-600 text-white animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold flex items-center gap-2">
                    <span>Étape {stepNum}</span>
                    {isCurrent && <span className="text-[10px] text-brand-600 dark:text-brand-400 font-extrabold uppercase animate-pulse">En cours</span>}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">{stepName}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
