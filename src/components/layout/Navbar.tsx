import React, { useState } from 'react';
import { 
  Bell, Search, UserCheck, School as SchoolIcon, Calendar, 
  Wifi, Sparkles, Shield, ChevronDown, CheckCircle2, Moon, Sun, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { UserRole } from '../../types/database';

interface NavbarProps {
  onOpenAI: () => void;
  activeModule: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAI, activeModule }) => {
  const { user, role, switchUserRole } = useAuth();
  const { currentSchool, schools, setCurrentSchool, academicYear, academicYears, setAcademicYear } = useTenant();
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showSchoolSelector, setShowSchoolSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin SaaS', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' },
    school_admin: { label: 'Admin Établissement', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300' },
    admin_org: { label: 'Admin Organisation', color: 'bg-indigo-100 text-indigo-800' },
    directeur: { label: 'Directeur Général', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
    directeur_etudes: { label: 'Dir. des Études', color: 'bg-cyan-100 text-cyan-800' },
    censeur: { label: 'Censeur', color: 'bg-sky-100 text-sky-800' },
    educateur: { label: 'Éducateur', color: 'bg-teal-100 text-teal-800' },
    enseignant: { label: 'Enseignant', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' },
    prof_principal: { label: 'Prof. Principal', color: 'bg-green-100 text-green-800' },
    surveillant: { label: 'Surveillant', color: 'bg-yellow-100 text-yellow-800' },
    secretaire: { label: 'Secrétaire', color: 'bg-amber-100 text-amber-800' },
    comptable: { label: 'Comptable', color: 'bg-orange-100 text-orange-800' },
    parent: { label: 'Espace Parent', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300' },
    eleve: { label: 'Espace Élève', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300' },
    bibliothecaire: { label: 'Bibliothécaire', color: 'bg-slate-100 text-slate-800' },
    chauffeur: { label: 'Chauffeur', color: 'bg-zinc-100 text-zinc-800' },
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors">
      {/* Left side: Context Switchers */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* School Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowSchoolSelector(!showSchoolSelector);
              setShowYearSelector(false);
            }}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors"
          >
            <SchoolIcon className="w-4 h-4 text-brand-500" />
            <span className="hidden sm:inline max-w-[180px] truncate">{currentSchool.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showSchoolSelector && (
            <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Établissements du Groupe
              </div>
              {schools.map((sch) => (
                <button
                  key={sch.id}
                  onClick={() => {
                    setCurrentSchool(sch);
                    setShowSchoolSelector(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-sm hover:bg-brand-50 dark:hover:bg-slate-700 ${
                    sch.id === currentSchool.id ? 'font-bold text-brand-600 bg-brand-50/50' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div>{sch.name}</div>
                    <div className="text-xs text-slate-400">{sch.city}</div>
                  </div>
                  {sch.id === currentSchool.id && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Academic Year Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowYearSelector(!showYearSelector);
              setShowSchoolSelector(false);
            }}
            className="flex items-center space-x-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/50 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-brand-500" />
            <span>Année : {academicYear.name}</span>
            <ChevronDown className="w-3 h-3 text-brand-500" />
          </button>

          {showYearSelector && (
            <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50 animate-scaleUp">
              <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700">
                Sélectionner l'Année Scolaire
              </div>
              <div className="py-1">
                {(academicYears || []).map((ay) => {
                  const isSelected = ay.name === academicYear.name;
                  return (
                    <button
                      key={ay.id}
                      onClick={() => {
                        setAcademicYear(ay);
                        setShowYearSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-brand-50 dark:hover:bg-slate-700 ${
                        isSelected ? 'text-brand-600 font-extrabold bg-brand-50/60 dark:bg-slate-700' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{ay.name}</span>
                        {ay.is_current && (
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded">En cours</span>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Rechercher élève (Matricule, Nom), classe, note, reçu..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Assistant IA trigger button */}
        <button
          onClick={onOpenAI}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold shadow-xs transition-all transform hover:scale-[1.02]"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="hidden sm:inline">IvoireIA+ Assistant</span>
        </button>

        {/* Quick RBAC Switcher (Demo Feature) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition-transform active:scale-95 ${roleLabels[role]?.color || 'bg-slate-100 text-slate-800'}`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{roleLabels[role]?.label}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showRoleSelector && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700">
                Tester un Rôle (Simulateur RBAC)
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {(['super_admin', 'directeur', 'enseignant', 'parent', 'eleve'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchUserRole(r);
                      setShowRoleSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 ${
                      r === role ? 'text-brand-600 font-bold bg-slate-50 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{roleLabels[r]?.label}</span>
                    {r === role && <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button 
          className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-ivory-orange rounded-full ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Mode Sombre / Clair"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Offline / Supabase status indicator */}
        <div className="hidden xl:flex items-center space-x-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 rounded-md font-bold">
          <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>⚡ Supabase Connecté</span>
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <img 
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'} 
            alt={user?.first_name || 'Directeur'} 
            className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-brand-500/30 border border-white dark:border-slate-800 shadow-xs"
            style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}
          />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
              {(role === 'directeur' && currentSchool.director_name) ? currentSchool.director_name : `${user?.first_name || ''} ${user?.last_name || ''}`}
            </div>
            <div className="text-[10px] text-brand-600 dark:text-brand-400 font-bold capitalize">
              {roleLabels[role]?.label || role.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
