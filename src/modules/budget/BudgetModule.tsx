import React, { useState } from 'react';
import { LayoutDashboard, Layers, DollarSign, TrendingUp, FileText, RotateCcw } from 'lucide-react';
import { BudgetDashboardModule } from './BudgetDashboardModule';
import { CostCentersModule } from './CostCentersModule';
import ExpensesManagementModule from './ExpensesManagementModule';
import RevenuesManagementModule from './RevenuesManagementModule';
import { BudgetLinesModule } from './BudgetLinesModule';
import { budgetService } from '../../services/budgetService';

export const BudgetModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord Financier', icon: LayoutDashboard },
    { id: 'cost_centers', label: 'Centres de Coûts', icon: Layers },
    { id: 'budget_lines', label: 'Budgets & Lignes', icon: FileText },
    { id: 'expenses', label: 'Dépenses', icon: DollarSign },
    { id: 'revenues', label: 'Recettes', icon: TrendingUp },
  ];

  const handleResetData = async () => {
    if (confirm('Voulez-vous réinitialiser les données de démonstration par défaut du budget ?')) {
      await budgetService.resetToDefaultData();
      window.location.reload();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <BudgetDashboardModule onNavigateSubModule={(mod) => setActiveTab(mod)} />;
      case 'cost_centers':
        return <CostCentersModule />;
      case 'budget_lines':
        return <BudgetLinesModule />;
      case 'expenses':
        return <ExpensesManagementModule />;
      case 'revenues':
        return <RevenuesManagementModule />;
      default:
        return <BudgetDashboardModule onNavigateSubModule={(mod) => setActiveTab(mod)} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Sub-Header Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xs flex items-center justify-between overflow-x-auto custom-scrollbar">
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

        <button
          onClick={handleResetData}
          title="Réinitialiser les données par défaut"
          className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all ml-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Réinitialiser démo</span>
        </button>
      </div>

      {/* Tab View Content */}
      {renderContent()}
    </div>
  );
};
