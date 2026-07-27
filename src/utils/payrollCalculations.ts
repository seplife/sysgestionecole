import { Employee, EmployeePayrollProfile, PayrollComponent, PayslipItem, Payslip } from '../types';

/**
 * Formate un montant numérique en Francs CFA (XOF)
 * Exemple: 250000 -> "250 000 FCFA"
 */
export const formatFCFA = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 FCFA';
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('fr-FR')} FCFA`;
};

/**
 * Calcule l'ancienneté d'un employé en années à partir de sa date d'embauche
 */
export const calculateSeniorityYears = (hireDateStr: string): number => {
  if (!hireDateStr) return 0;
  const hire = new Date(hireDateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - hire.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(diffYears);
};

/**
 * Calcule le bulletin de salaire individuel d'un employé pour une période donnée
 */
export const calculateEmployeePayslip = (
  employee: Employee,
  payrollProfile: EmployeePayrollProfile | undefined,
  activeComponents: PayrollComponent[],
  payrollPeriodId: string,
  schoolId: string,
  unjustifiedAbsenceDays: number = 0,
  overtimeHours: number = 0
): Payslip => {
  const baseSalary = payrollProfile?.base_salary || employee.base_salary || 0;
  const items: PayslipItem[] = [];

  // 1. Salaire de base (Gain principal)
  items.push({
    component_code: 'SAL_BASE',
    label: 'Salaire de Base Contractuel',
    category: 'gain',
    base_amount: baseSalary,
    rate: 1,
    quantity: 1,
    total_amount: baseSalary,
    display_order: 1
  });

  let totalEarnings = baseSalary;

  // 2. Primes fixes du profil (Logement, Transport, Fonction, Autres)
  if (payrollProfile?.housing_allowance && payrollProfile.housing_allowance > 0) {
    items.push({
      component_code: 'PRIME_LOGT',
      label: 'Indemnité de Logement',
      category: 'gain',
      base_amount: payrollProfile.housing_allowance,
      rate: 1,
      quantity: 1,
      total_amount: payrollProfile.housing_allowance,
      display_order: 2
    });
    totalEarnings += payrollProfile.housing_allowance;
  }

  if (payrollProfile?.transport_allowance && payrollProfile.transport_allowance > 0) {
    items.push({
      component_code: 'PRIME_TRANSP',
      label: 'Prime de Transport Exonérée',
      category: 'gain',
      base_amount: payrollProfile.transport_allowance,
      rate: 1,
      quantity: 1,
      total_amount: payrollProfile.transport_allowance,
      display_order: 3
    });
    totalEarnings += payrollProfile.transport_allowance;
  }

  if (payrollProfile?.function_allowance && payrollProfile.function_allowance > 0) {
    items.push({
      component_code: 'PRIME_FONCT',
      label: 'Prime de Fonction & Responsabilité',
      category: 'gain',
      base_amount: payrollProfile.function_allowance,
      rate: 1,
      quantity: 1,
      total_amount: payrollProfile.function_allowance,
      display_order: 4
    });
    totalEarnings += payrollProfile.function_allowance;
  }

  // 3. Prime d'ancienneté calculée (2% après 2 ans + 1% par année supp)
  const seniorityYears = calculateSeniorityYears(employee.hire_date);
  if (seniorityYears >= 2) {
    const seniorityRate = 0.02 + (seniorityYears - 2) * 0.01;
    const seniorityAmount = Math.round(baseSalary * seniorityRate);
    items.push({
      component_code: 'PRIME_ANCIENNETE',
      label: `Prime d'Ancienneté (${seniorityYears} ans - ${(seniorityRate * 100).toFixed(0)}%)`,
      category: 'gain',
      base_amount: baseSalary,
      rate: seniorityRate,
      quantity: 1,
      total_amount: seniorityAmount,
      display_order: 5
    });
    totalEarnings += seniorityAmount;
  }

  // 4. Heures Supplémentaires
  if (overtimeHours > 0) {
    const hourlyRate = Math.round(baseSalary / 173.33);
    const overtimeRate = 1.25; // 25% majoration
    const overtimeTotal = Math.round(overtimeHours * hourlyRate * overtimeRate);
    items.push({
      component_code: 'HEURES_SUPP',
      label: `Heures Supplémentaires (+25%)`,
      category: 'gain',
      base_amount: hourlyRate,
      rate: overtimeRate,
      quantity: overtimeHours,
      total_amount: overtimeTotal,
      display_order: 6
    });
    totalEarnings += overtimeTotal;
  }

  const grossSalary = totalEarnings;
  let totalDeductions = 0;

  // 5. Retenues pour Absences Non Justifiées (base 30 jours mois)
  if (unjustifiedAbsenceDays > 0) {
    const dailyRate = Math.round(baseSalary / 30);
    const absenceDeduction = dailyRate * unjustifiedAbsenceDays;
    items.push({
      component_code: 'RET_ABSENCE',
      label: `Retenue Absences Non Justifiées (${unjustifiedAbsenceDays} jrs)`,
      category: 'retenue',
      base_amount: dailyRate,
      rate: 1,
      quantity: unjustifiedAbsenceDays,
      total_amount: absenceDeduction,
      display_order: 10
    });
    totalDeductions += absenceDeduction;
  }

  // 6. Cotisations CNPS (Cotisation sociale CI ~ 6.3% part salarié plafonnée)
  const cnpsDeduction = payrollProfile?.social_security_deduction ?? Math.round(Math.min(grossSalary, 1647315) * 0.063);
  if (cnpsDeduction > 0) {
    items.push({
      component_code: 'RET_CNPS',
      label: 'Cotisation Régime Retraite CNPS (Salarié)',
      category: 'retenue',
      base_amount: grossSalary,
      rate: 0.063,
      quantity: 1,
      total_amount: cnpsDeduction,
      display_order: 11
    });
    totalDeductions += cnpsDeduction;
  }

  // 7. Impôt sur Salaires (IS / IGR CI estimé ou configuré)
  const taxDeduction = payrollProfile?.tax_deduction ?? Math.round(grossSalary * 0.045);
  if (taxDeduction > 0) {
    items.push({
      component_code: 'RET_ITS',
      label: 'Impôt sur Salaires (ITS / IGR)',
      category: 'retenue',
      base_amount: grossSalary,
      rate: 0.045,
      quantity: 1,
      total_amount: taxDeduction,
      display_order: 12
    });
    totalDeductions += taxDeduction;
  }

  // 8. Composants personnalisés supplémentaires activés
  activeComponents.forEach(comp => {
    if (comp.category === 'gain' && comp.is_active && !comp.is_system) {
      const amt = comp.default_amount;
      if (amt > 0) {
        items.push({
          component_code: comp.code,
          label: comp.name,
          category: 'gain',
          base_amount: amt,
          rate: 1,
          quantity: 1,
          total_amount: amt,
          display_order: comp.display_order || 7
        });
        totalEarnings += amt;
      }
    } else if (comp.category === 'retenue' && comp.is_active && !comp.is_system) {
      const amt = comp.default_amount;
      if (amt > 0) {
        items.push({
          component_code: comp.code,
          label: comp.name,
          category: 'retenue',
          base_amount: amt,
          rate: 1,
          quantity: 1,
          total_amount: amt,
          display_order: comp.display_order || 15
        });
        totalDeductions += amt;
      }
    }
  });

  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    id: `payslip-${employee.id}-${payrollPeriodId}`,
    school_id: schoolId,
    employee_id: employee.id,
    payroll_period_id: payrollPeriodId,
    payslip_number: `BS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    employee_name: `${employee.last_name} ${employee.first_name}`,
    employee_number: employee.employee_number,
    position_title: employee.position_name || 'Personnel',
    department_name: employee.department_name || 'Général',
    contract_type: employee.contract_type,
    hire_date: employee.hire_date,
    cnps_number: employee.cnps_number || 'Non renseigné',
    base_salary: baseSalary,
    total_earnings: totalEarnings,
    gross_salary: grossSalary,
    total_deductions: totalDeductions,
    net_salary: netSalary,
    payment_method: employee.payment_method || 'virement',
    payment_status: 'non_paye',
    paid_amount: 0,
    items,
    status: 'brouillon',
    created_at: new Date().toISOString()
  };
};
