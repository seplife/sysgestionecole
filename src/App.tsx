import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { ProtectedRoute } from './components/auth/Guards';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Modules
import { LoginModule } from './modules/auth/LoginModule';
import { DashboardModule } from './modules/dashboard/DashboardModule';
import { StudentListModule } from './modules/students/StudentListModule';
import { ParentManagementModule } from './modules/parents/ParentManagementModule';
import { ClassesModule } from './modules/classes/ClassesModule';
import { TeachersModule } from './modules/teachers/TeachersModule';
import { AttendanceModule } from './modules/attendance/AttendanceModule';
import { TimetableModule } from './modules/timetable/TimetableModule';
import { GradesModule } from './modules/grades/GradesModule';
import { ReportCardModule } from './modules/reports/ReportCardModule';
import { ExamsModule } from './modules/exams/ExamsModule';
import { PublicVerificationPage } from './modules/exams/components/PublicVerificationPage';
import { FinanceModule } from './modules/finance/FinanceModule';
import { CommunicationModule } from './modules/communication/CommunicationModule';
import { AIAssistantModule } from './modules/ai/AIAssistantModule';
import { SchoolManagementModule } from './modules/school/SchoolManagementModule';
import { SuperAdminModule } from './modules/superadmin/SuperAdminModule';
import { LibraryModule, TransportModule, CafeteriaModule } from './modules/extra/AuxiliaryModules';

export const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Check if URL is public verification page /verify/[code]
  const pathname = window.location.pathname;
  let verifyCode: string | null = null;
  if (pathname.startsWith('/verify/')) {
    verifyCode = pathname.replace('/verify/', '');
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    verifyCode = urlParams.get('verify') || urlParams.get('code');
  }

  if (verifyCode) {
    return <PublicVerificationPage code={verifyCode} onBack={() => { window.location.href = '/'; }} />;
  }

  if (!isAuthenticated) {
    return <LoginModule />;
  }

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return <DashboardModule onNavigate={(m) => setCurrentModule(m)} onOpenAI={() => setCurrentModule('ai')} />;
      case 'students':
        return <StudentListModule />;
      case 'parents':
        return <ParentManagementModule />;
      case 'classes':
        return <ClassesModule />;
      case 'teachers':
        return <TeachersModule />;
      case 'attendance':
        return <AttendanceModule />;
      case 'timetable':
        return <TimetableModule />;
      case 'grades':
        return <GradesModule />;
      case 'reports':
        return <ReportCardModule />;
      case 'exams':
        return <ExamsModule />;
      case 'finance':
        return <FinanceModule />;
      case 'communication':
        return <CommunicationModule />;
      case 'library':
        return <LibraryModule />;
      case 'transport':
        return <TransportModule />;
      case 'cafeteria':
        return <CafeteriaModule />;
      case 'ai':
        return <AIAssistantModule />;
      case 'school':
        return <SchoolManagementModule />;
      case 'superadmin':
        return <SuperAdminModule />;
      default:
        return <DashboardModule onNavigate={(m) => setCurrentModule(m)} onOpenAI={() => setCurrentModule('ai')} />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-slate-100 relative">
        {/* Sidebar Navigation (Desktop Static & Mobile Drawer) */}
        <Sidebar 
          currentModule={currentModule} 
          onSelectModule={(mod) => {
            setCurrentModule(mod);
            setMobileMenuOpen(false);
          }} 
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar 
            activeModule={currentModule}
            onOpenAI={() => setCurrentModule('ai')} 
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {renderModule()}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <SubscriptionProvider>
          <AppContent />
        </SubscriptionProvider>
      </TenantProvider>
    </AuthProvider>
  );
}

