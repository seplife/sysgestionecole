import React from 'react';
import { 
  LayoutDashboard, Users, UserCheck, GraduationCap, BookOpen, 
  CalendarCheck, Clock, CreditCard, MessageSquare, Library, 
  Bus, Utensils, Sparkles, Building2, ShieldCheck, FileSpreadsheet, 
  Award, LogOut, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { UserRole } from '../../types/database';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentModule, 
  onSelectModule, 
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { role, logout } = useAuth();
  const { currentSchool } = useTenant();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'students', label: 'Élèves & Inscriptions', icon: Users, badge: '42' },
    { id: 'parents', label: 'Parents & Tuteurs', icon: UserCheck },
    { id: 'classes', label: 'Classes & Niveaux', icon: GraduationCap },
    { id: 'teachers', label: 'Enseignants & Staff', icon: BookOpen },
    { id: 'attendance', label: 'Présences & Appel', icon: CalendarCheck },
    { id: 'timetable', label: 'Emploi du temps', icon: Clock },
    { id: 'grades', label: 'Notes & Évaluations', icon: FileSpreadsheet },
    { id: 'reports', label: 'Bulletins Scolaires', icon: Award, badge: 'PDF' },
    { id: 'finance', label: 'Finances & Mobile Money', icon: CreditCard },
    { id: 'communication', label: 'WhatsApp & SMS', icon: MessageSquare, badge: 'Chatbot' },
    { id: 'library', label: 'Bibliothèque', icon: Library },
    { id: 'transport', label: 'Transport Scolaire', icon: Bus },
    { id: 'cafeteria', label: 'Cantine Scolaire', icon: Utensils },
    { id: 'ai', label: 'Assistant IA IvoireIA+', icon: Sparkles, badge: 'IA' },
    { id: 'school', label: 'Configuration École', icon: Building2, roles: ['super_admin', 'admin_org', 'directeur'] },
    { id: 'superadmin', label: 'Super Admin SaaS Multi-Écoles', icon: ShieldCheck, roles: ['super_admin', 'admin_org', 'directeur'], badge: 'SaaS Central' },
  ];

  // Filter items based on active role
  const visibleItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Element */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 select-none transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shadow-md border border-slate-700/60 overflow-hidden shrink-0">
              <img 
                src={currentSchool.logo_url || '/images/logoecole.png'} 
                alt="Logo Établissement" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="truncate">
              <div className="font-extrabold text-base tracking-tight text-white font-sans flex items-center leading-tight">
                IvoireÉcole<span className="text-ivory-orange">+</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase truncate max-w-[120px]">
                {currentSchool.name}
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
            title="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Menu Principal
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectModule(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-brand-500 text-white font-semibold shadow-md shadow-brand-500/20 translate-x-1' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ml-1 ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : item.badge === 'IA' 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : item.badge === 'PDF' 
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Footer & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2 shrink-0">
          <div className="bg-slate-800/50 rounded-xl p-2.5 text-xs text-slate-400 flex items-center space-x-2">
            <Award className="w-4 h-4 text-ivory-orange shrink-0" />
            <div className="truncate">
              <div className="font-semibold text-slate-200 text-[11px]">Conforme MENA Côte d'Ivoire</div>
              <div className="text-[10px] text-slate-400">PWA & Multi-Tenant v2.5</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};
