import React, { useState } from 'react';
import { LayoutDashboard, Users, FileText, CalendarCheck, Calendar, Building2 } from 'lucide-react';
import { HRDashboardModule } from './HRDashboardModule';
import { EmployeesListModule } from './EmployeesListModule';
import { ContractsManagementModule } from './ContractsManagementModule';
import { StaffAttendanceModule } from './StaffAttendanceModule';
import { LeaveManagementModule } from './LeaveManagementModule';
import { OrganizationSetupModule } from './OrganizationSetupModule';

export const HRModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord RH', icon: LayoutDashboard },
    { id: 'employees', label: 'Personnel', icon: Users },
    { id: 'contracts', label: 'Contrats', icon: FileText },
    { id: 'attendance', label: 'Présences & Retards', icon: CalendarCheck },
    { id: 'leave', label: 'Congés & Absences', icon: Calendar },
    { id: 'organization', label: 'Organisation', icon: Building2 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HRDashboardModule onNavigateSubModule={(mod) => setActiveTab(mod)} />;
      case 'employees':
        return <EmployeesListModule />;
      case 'contracts':
        return <ContractsManagementModule />;
      case 'attendance':
        return <StaffAttendanceModule />;
      case 'leave':
        return <LeaveManagementModule />;
      case 'organization':
        return <OrganizationSetupModule />;
      default:
        return <HRDashboardModule onNavigateSubModule={(mod) => setActiveTab(mod)} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Sub-Header Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xs overflow-x-auto custom-scrollbar">
        <div className="flex space-x-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab View Content */}
      {renderContent()}
    </div>
  );
};
