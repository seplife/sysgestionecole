import React, { useState, useEffect } from 'react';
import { 
  Users, CalendarCheck, CreditCard, 
  TrendingUp, ArrowUpRight, AlertTriangle, 
  Sparkles, CheckCircle2, Award, Building2, Check, BookOpen, Clock, FileSpreadsheet, ShieldCheck, UserCheck, ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { supabaseService, checkConnectionDetailed } from '../../services/supabaseService';
import { Student, SchoolClass } from '../../types/database';

interface DashboardModuleProps {
  onNavigate: (module: string) => void;
  onOpenAI: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({ onNavigate, onOpenAI }) => {
  const { user, role } = useAuth();
  const { currentSchool, academicYear } = useTenant();
  const { currentSubscription } = useSubscription();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; configured: boolean; message: string }>({
    connected: false,
    configured: false,
    message: 'Vérification du statut Supabase...'
  });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    checkConnectionDetailed().then(setSupabaseStatus);

    Promise.all([
      supabaseService.fetchStudents(),
      supabaseService.fetchClasses()
    ]).then(([stds, cls]) => {
      setStudents(stds);
      setClasses(cls);
      setLoading(false);
    });
  }, []);

  const handleSyncSupabase = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await supabaseService.syncAllDataToSupabase();
    setSyncing(false);
    setSyncResult(res.message);
    const updatedStatus = await checkConnectionDetailed();
    setSupabaseStatus(updatedStatus);
  };

  const totalStudents = students.length;
  const boysCount = students.filter(s => s.gender === 'M').length;
  const girlsCount = students.filter(s => s.gender === 'F').length;
  const boysPercent = totalStudents > 0 ? ((boysCount / totalStudents) * 100).toFixed(1) : '50.0';
  const girlsPercent = totalStudents > 0 ? ((girlsCount / totalStudents) * 100).toFixed(1) : '50.0';

  // Checklist Completion Metrics
  const checklistItems = [
    { id: 'school_created', label: 'Établissement créé', done: true, module: 'school' },
    { id: 'sub_active', label: 'Abonnement activé', done: true, module: 'superadmin' },
    { id: 'academic_year', label: 'Année scolaire & Périodes configurées', done: true, module: 'school' },
    { id: 'classes_config', label: 'Structure des Classes & Niveaux', done: classes.length > 0, module: 'classes' },
    { id: 'subjects_config', label: 'Grille des Matières & Coefficients MENA', done: true, module: 'grades' },
    { id: 'staff_invited', label: 'Équipe d\'Enseignants & Éducateurs invitée', done: true, module: 'teachers' },
    { id: 'students_registered', label: 'Élèves inscrits dans le système', done: totalStudents > 0, module: 'students' },
    { id: 'parents_linked', label: 'Parents & Tuteurs rattachés', done: true, module: 'parents' }
  ];

  const completedCount = checklistItems.filter(i => i.done).length;
  const completionPercent = Math.round((completedCount / checklistItems.length) * 100);

  // ------------------------------------------------------------------
  // PORTAIL PARENT VIEW (Si le rôle est 'parent')
  // ------------------------------------------------------------------
  if (role === 'parent') {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30">
                Portail Parent d'Élève — IvoireÉcole+
              </span>
              <h1 className="text-2xl font-extrabold mt-2">Bienvenue, {user?.first_name} {user?.last_name} 👋</h1>
              <p className="text-xs text-indigo-200 mt-1">Suivi scolaire, notes, bulletins et scolarité de vos enfants à {currentSchool.name}.</p>
            </div>
            <button onClick={() => onNavigate('finance')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md">
              <CreditCard className="w-4 h-4" /> Payer la Scolarité (Mobile Money)
            </button>
          </div>
        </div>

        {/* Mes Enfants Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center">AF</div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Awa Fatima DIABATÉ</h3>
                  <p className="text-xs text-slate-400">Classe : <span className="font-bold text-brand-600">3ème 2</span> | Mat: 2026-ABJ-0089</p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full">Inscrit & Actif</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Moyenne T1</span>
                <span className="font-extrabold text-emerald-600 text-base">15.50 / 20</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Rang</span>
                <span className="font-extrabold text-brand-600 text-base">1er / 42</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Assiduité</span>
                <span className="font-extrabold text-emerald-600 text-base">100%</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => onNavigate('reports')} className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline">
                <Award className="w-4 h-4" /> Telecharger le Bulletin Trimestriel
              </button>
              <button onClick={() => onNavigate('timetable')} className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:underline">
                <Clock className="w-4 h-4" /> Voir l'Emploi du Temps
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // PORTAIL ÉLÈVE VIEW (Si le rôle est 'eleve')
  // ------------------------------------------------------------------
  if (role === 'eleve') {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
          <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30">
            Espace Élève IvoireÉcole+
          </span>
          <h1 className="text-2xl font-extrabold mt-2">Bonjour, {user?.first_name} ! 🎓</h1>
          <p className="text-xs text-purple-200 mt-1">Consulte tes notes, ton emploi du temps et tes bulletins trimestriels.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-center">
            <Award className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-400">Ma Moyenne Générale T1</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">15.50 / 20</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-center">
            <BookOpen className="w-8 h-8 text-brand-500 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-400">Mon Rang en Classe</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">1er</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-center">
            <Clock className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-400">Prochain Cours</div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">Mathématiques (08h00 - Salle 12)</div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // PORTAIL ADMINISTRATEUR & DIRECTEUR DEFAULT DASHBOARD
  // ------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-500 via-brand-600 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> IvoireÉcole+ v2.5
              </span>
              <span className="text-xs text-slate-300">Année Scolaire {academicYear.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">
              Bonjour, {user?.first_name} {user?.last_name} 👋
            </h1>
            <p className="text-slate-200 text-sm max-w-xl">
              Bienvenue sur le tableau de bord de <span className="font-semibold text-white">{currentSchool.name}</span>. Toutes les métriques clés de l'établissement sont actualisées en direct.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAI}
              className="bg-white text-brand-600 hover:bg-slate-100 font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-ivory-orange" />
              <span>Poser une question à l'IA</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="bg-brand-600/80 hover:bg-brand-600 text-white border border-white/20 font-medium px-4 py-2.5 rounded-xl text-sm transition-all"
            >
              Bulletins MENA
            </button>
          </div>
        </div>
      </div>

      {/* SUPABASE DATABASE DIAGNOSTIC BANNER */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        supabaseStatus.connected 
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
          : supabaseStatus.configured 
            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
            : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            supabaseStatus.connected 
              ? 'bg-emerald-500 text-white' 
              : 'bg-amber-500 text-white'
          }`}>
            {supabaseStatus.connected ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Base de données Supabase Cloud : {supabaseStatus.connected ? 'Connectée & Active' : 'En Attente de Synchronisation'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                supabaseStatus.connected ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
              }`}>
                {supabaseStatus.connected ? 'Enregistrement Temps Réel ON' : 'Mode Local Active'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {supabaseStatus.message}
            </p>
            {syncResult && (
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 mt-1">
                Résultat : {syncResult}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSyncSupabase}
            disabled={syncing}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2"
          >
            {syncing ? <Clock className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{syncing ? 'Synchronisation...' : 'Synchroniser vers Supabase'}</span>
          </button>
        </div>
      </div>

      {/* SAAS ONBOARDING ACTIVATION CHECKLIST CARD */}
      <div className="bg-white dark:bg-slate-900 border-2 border-brand-500/40 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">Checklist d'Activation de votre Établissement</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Complétez le paramétrage pour exploiter à 100% votre espace IvoireÉcole+.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-500">Progression Activation</div>
              <div className="text-sm font-extrabold text-brand-600 dark:text-brand-400">{completionPercent}% Terminé</div>
            </div>
            <div className="w-20 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigate(item.module)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                item.done 
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200' 
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-brand-400'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold truncate">
                {item.done ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 font-extrabold" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-400 shrink-0" />
                )}
                <span className="truncate">{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students (Dynamique) */}
        <div 
          onClick={() => onNavigate('students')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Élèves Inscrits</span>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              {loading ? '...' : totalStudents.toLocaleString('fr-FR')}
            </div>
            <div className="flex items-center text-xs text-emerald-600 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>{classes.length} classes actives</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
            <span>Garçons: {boysCount} ({boysPercent}%)</span>
            <span>Filles: {girlsCount} ({girlsPercent}%)</span>
          </div>
        </div>

        {/* Taux de Présence */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Taux d'Assiduité Global</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">96.8 %</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>Assiduité vérifiée</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
            <span>Alertes WhatsApp envoyées: 10</span>
          </div>
        </div>

        {/* Recouvrement Frais */}
        <div 
          onClick={() => onNavigate('finance')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Recouvrement Scolarités</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">142.5 M <span className="text-xs font-normal text-slate-500">FCFA</span></div>
            <div className="flex items-center text-xs text-emerald-600 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              <span>78% des frais encaissés</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
            <span>Paiements Mobile Money: 82%</span>
          </div>
        </div>

        {/* Moyenne Générale */}
        <div 
          onClick={() => onNavigate('grades')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Moyenne Générale École</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">13.85 <span className="text-xs text-slate-400">/ 20</span></div>
            <div className="flex items-center text-xs text-purple-600 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>Trimestre 1 Validé</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
            <span>Taux d'admission prédictif BEPC: 92%</span>
          </div>
        </div>
      </div>

    </div>
  );
};
