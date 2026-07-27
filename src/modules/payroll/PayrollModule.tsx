import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Calculator, FileText, CreditCard, Settings } from 'lucide-react';
import { PayrollDashboardModule } from './PayrollDashboardModule';
import { PayrollPeriodsModule } from './PayrollPeriodsModule';
import { PayrollPreparationModule } from './PayrollPreparationModule';
import { SalaryPaymentsModule } from './SalaryPaymentsModule';
import { PayrollComponentsConfigModule } from './PayrollComponentsConfigModule';

export const PayrollModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord Paie', icon: LayoutDashboard },
    { id: 'periods', label: 'Périodes de Paie', icon: Calendar },
    { id: 'preparation', label: 'Calcul de la Paie', icon: Calculator },
    { id: 'payments', label: 'Paiement Salaires', icon: CreditCard },
    { id: 'config', label: 'Composants & Primes', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <PayrollDashboardModule onNavigateSubModule={(mod) => setActiveTab(mod)} />;
      case 'periods':
        return <PayrollPeriodsModule onSelectPeriod={() => setActiveTab('preparation')} />;
      case 'preparation':
        return <PayrollPreparationModule />;
      case 'payments':
        return <SalaryPaymentsModule />;
      case 'config':
        return <PayrollComponentsConfigModule />;
      default:
        return <PayrollDashboardModule onNavigateSubModule={(mod) => setActiveTab(mod)} />;
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
