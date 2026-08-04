import React, { useState, useEffect } from 'react';
import {
  Clock,
  Layers,
  Sliders,
  BookOpen,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Users,
  DoorOpen,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Printer
} from 'lucide-react';
import { timetableService } from '../../services/timetable/timetableService';
import { TimetableSolver } from '../../services/timetable/timetableSolver';
import {
  TimetableSettings,
  TimetablePeriod,
  TimetableEntry,
  TimetableVersion,
  TimetableConflict,
  TimetableSubstitution,
  QualityScoreBreakdown,
  GenerationStatistics
} from '../../types/timetable';

// Tabs
import { TimetableDashboardTab } from './tabs/TimetableDashboardTab';
import { TimetableSettingsTab } from './tabs/TimetableSettingsTab';
import { SubjectHoursTab } from './tabs/SubjectHoursTab';
import { AvailabilitiesTab } from './tabs/AvailabilitiesTab';
import { ConstraintsTab } from './tabs/ConstraintsTab';
import { GeneratorTab } from './tabs/GeneratorTab';
import { ClassTimetableTab } from './tabs/ClassTimetableTab';
import { TeacherTimetableTab } from './tabs/TeacherTimetableTab';
import { RoomTimetableTab } from './tabs/RoomTimetableTab';
import { GlobalTimetableTab } from './tabs/GlobalTimetableTab';
import { AssessmentsTab } from './tabs/AssessmentsTab';
import { SpecialActivitiesTab } from './tabs/SpecialActivitiesTab';
import { SubstitutionsTab } from './tabs/SubstitutionsTab';
import { ConflictsTab } from './tabs/ConflictsTab';
import { VersionsTab } from './tabs/VersionsTab';
import { ExportsTab } from './tabs/ExportsTab';

export const TimetableModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [settings, setSettings] = useState<TimetableSettings | null>(null);
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [versions, setVersions] = useState<TimetableVersion[]>([]);
  const [substitutions, setSubstitutions] = useState<TimetableSubstitution[]>([]);
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('3ème 1');

  const [qualityScore, setQualityScore] = useState<QualityScoreBreakdown>({
    globalScore: 94,
    hardConstraintsScore: 100,
    pedagogicalBalanceScore: 92,
    roomOptimizationScore: 90,
    teacherOptimizationScore: 95,
    weeklyDistributionScore: 91
  });

  const [stats, setStats] = useState<GenerationStatistics>({
    totalClassesConfigured: 11,
    totalTeachersAvailable: 18,
    totalRoomsAvailable: 24,
    totalSubjectsConfigured: 8,
    totalCoursesScheduled: 48,
    totalCoursesPending: 0,
    hardConflictsCount: 0,
    softConflictsCount: 2,
    occupancyRate: 88,
    freeSlotsCount: 32
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const s = await timetableService.getSettings();
      const p = await timetableService.getPeriods();
      const e = await timetableService.getEntries();
      const v = await timetableService.getVersions();
      const sub = await timetableService.getSubstitutions();

      const c = TimetableSolver.detectConflicts(e);

      setSettings(s);
      setPeriods(p);
      setEntries(e);
      setVersions(v);
      setSubstitutions(sub);
      setConflicts(c);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleSaveSettings = async (updated: Partial<TimetableSettings>) => {
    const res = await timetableService.saveSettings(updated);
    setSettings(res);
  };

  const handleSolverComplete = (
    genEntries: TimetableEntry[],
    genConflicts: TimetableConflict[],
    score: QualityScoreBreakdown,
    st: GenerationStatistics
  ) => {
    setEntries(genEntries);
    setConflicts(genConflicts);
    setQualityScore(score);
    setStats(st);
    timetableService.saveEntries(genEntries);
  };

  const handleResolveConflict = (conflictId: string) => {
    const updatedConflicts = conflicts.filter(c => c.id !== conflictId);
    setConflicts(updatedConflicts);
    setStats(prev => ({ ...prev, hardConflictsCount: Math.max(0, prev.hardConflictsCount - 1) }));
  };

  const handleAddSubstitution = async (subData: any) => {
    const created = await timetableService.addSubstitution(subData);
    setSubstitutions([created, ...substitutions]);
  };

  const handleCreateVersion = async (title: string, notes?: string) => {
    const created = await timetableService.createVersion(title, notes);
    setVersions([...versions, created]);
  };

  const handleDeleteCourse = async (id: string) => {
    await timetableService.deleteEntry(id);
    setEntries(entries.filter(e => e.id !== id));
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="text-xs font-bold text-slate-500">Chargement de l'Emploi du Temps+...</span>
        </div>
      </div>
    );
  }

  const tabsConfig = [
    { id: 'dashboard', label: 'Tableau de bord', category: 'Synthèse' },
    { id: 'settings', label: 'Paramètres & S1-S9', category: 'Structure' },
    { id: 'subject_hours', label: 'Volumes Horaire', category: 'Structure' },
    { id: 'availabilities', label: 'Disponibilités', category: 'Structure' },
    { id: 'constraints', label: 'Contraintes & Règles', category: 'Structure' },
    { id: 'generator', label: 'Générateur Automatique', category: 'Solver' },
    { id: 'conflicts', label: `Conflits (${conflicts.length})`, category: 'Solver' },
    { id: 'class_timetable', label: 'Vue par Classe', category: 'Consultation' },
    { id: 'teacher_timetable', label: 'Vue par Enseignant', category: 'Consultation' },
    { id: 'room_timetable', label: 'Vue par Salle', category: 'Consultation' },
    { id: 'global_timetable', label: 'Vue Globale Master', category: 'Consultation' },
    { id: 'assessments', label: 'Devoirs de Niveau', category: 'Activités' },
    { id: 'special_activities', label: 'Renforcement & Soutien', category: 'Activités' },
    { id: 'substitutions', label: 'Remplacements & Quotidien', category: 'Activités' },
    { id: 'versions', label: 'Versionnage & Historique', category: 'Gestion' },
    { id: 'exports', label: 'Exports & PDF', category: 'Gestion' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Clock className="w-8 h-8 text-brand-500" />
            <span>Emploi du Temps+ / Timetable Management</span>
          </h1>
          <p className="text-xs text-slate-400">
            Moteur intelligent de génération sous contraintes & gestion complète du cycle de vie des emplois du temps scolaires
          </p>
        </div>
      </div>

      {/* Main Tab Navigation Submenu */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabsConfig.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'dashboard' && (
          <TimetableDashboardTab
            qualityScore={qualityScore}
            stats={stats}
            onNavigateToGenerator={() => setActiveTab('generator')}
            onNavigateToConflicts={() => setActiveTab('conflicts')}
          />
        )}

        {activeTab === 'settings' && (
          <TimetableSettingsTab
            settings={settings}
            periods={periods}
            onSaveSettings={handleSaveSettings}
          />
        )}

        {activeTab === 'subject_hours' && <SubjectHoursTab />}

        {activeTab === 'availabilities' && <AvailabilitiesTab />}

        {activeTab === 'constraints' && <ConstraintsTab />}

        {activeTab === 'generator' && (
          <GeneratorTab
            entries={entries}
            periods={periods}
            onSolverComplete={handleSolverComplete}
          />
        )}

        {activeTab === 'conflicts' && (
          <ConflictsTab
            conflicts={conflicts}
            onResolveConflict={handleResolveConflict}
          />
        )}

        {activeTab === 'class_timetable' && (
          <ClassTimetableTab
            entries={entries}
            periods={periods}
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
            onAddCourse={() => {}}
            onDeleteCourse={handleDeleteCourse}
          />
        )}

        {activeTab === 'teacher_timetable' && (
          <TeacherTimetableTab entries={entries} periods={periods} />
        )}

        {activeTab === 'room_timetable' && (
          <RoomTimetableTab entries={entries} periods={periods} />
        )}

        {activeTab === 'global_timetable' && (
          <GlobalTimetableTab entries={entries} periods={periods} />
        )}

        {activeTab === 'assessments' && <AssessmentsTab />}

        {activeTab === 'special_activities' && <SpecialActivitiesTab />}

        {activeTab === 'substitutions' && (
          <SubstitutionsTab
            substitutions={substitutions}
            onAddSubstitution={handleAddSubstitution}
          />
        )}

        {activeTab === 'versions' && (
          <VersionsTab versions={versions} onCreateVersion={handleCreateVersion} />
        )}

        {activeTab === 'exports' && <ExportsTab entries={entries} />}
      </div>
    </div>
  );
};
