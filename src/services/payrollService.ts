import { supabase } from '../lib/supabase';
import { getLocalCache, setLocalCache } from './supabaseService';
import { PayrollPeriod, PayrollComponent, EmployeePayrollProfile, Payslip, SalaryPayment, SalaryAdvance } from '../types';
import { calculateEmployeePayslip } from '../utils/payrollCalculations';
import { hrService } from './hrService';

const initialPeriods: PayrollPeriod[] = [
  {
    id: 'per-2026-07',
    school_id: 'school-palmeraie-01',
    name: 'Juillet 2026',
    period_code: '2026-07',
    start_date: '2026-07-01',
    end_date: '2026-07-31',
    payment_due_date: '2026-07-30',
    status: 'payee',
    total_gross: 910000,
    total_deductions: 95000,
    total_net: 815000,
    employee_count: 3
  },
  {
    id: 'per-2026-08',
    school_id: 'school-palmeraie-01',
    name: 'Août 2026',
    period_code: '2026-08',
    start_date: '2026-08-01',
    end_date: '2026-08-31',
    payment_due_date: '2026-08-30',
    status: 'preparation',
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    employee_count: 3
  }
];

const initialComponents: PayrollComponent[] = [
  { id: 'cmp-01', school_id: 'school-palmeraie-01', code: 'SAL_BASE', name: 'Salaire de Base Contractuel', category: 'gain', calculation_method: 'montant_fixe', default_amount: 0, is_taxable: true, is_social_contributable: true, is_system: true, display_order: 1, is_active: true },
  { id: 'cmp-02', school_id: 'school-palmeraie-01', code: 'PRIME_LOGT', name: 'Indemnité de Logement', category: 'gain', calculation_method: 'montant_fixe', default_amount: 50000, is_taxable: true, is_social_contributable: true, is_system: false, display_order: 2, is_active: true },
  { id: 'cmp-03', school_id: 'school-palmeraie-01', code: 'PRIME_TRANSP', name: 'Prime de Transport Exonérée', category: 'gain', calculation_method: 'montant_fixe', default_amount: 30000, is_taxable: false, is_social_contributable: false, is_system: false, display_order: 3, is_active: true },
  { id: 'cmp-04', school_id: 'school-palmeraie-01', code: 'PRIME_FONCT', name: 'Prime de Fonction', category: 'gain', calculation_method: 'montant_fixe', default_amount: 40000, is_taxable: true, is_social_contributable: true, is_system: false, display_order: 4, is_active: true },
  { id: 'cmp-05', school_id: 'school-palmeraie-01', code: 'RET_CNPS', name: 'Cotisation Régime Retraite CNPS', category: 'retenue', calculation_method: 'pourcentage', default_amount: 0, default_rate: 0.063, is_taxable: false, is_social_contributable: false, is_system: true, display_order: 10, is_active: true },
  { id: 'cmp-06', school_id: 'school-palmeraie-01', code: 'RET_ITS', name: 'Impôt sur Salaires (ITS)', category: 'retenue', calculation_method: 'pourcentage', default_amount: 0, default_rate: 0.045, is_taxable: false, is_social_contributable: false, is_system: true, display_order: 11, is_active: true }
];

export const payrollService = {
  // 1. Periods
  async fetchPayrollPeriods(): Promise<PayrollPeriod[]> {
    try {
      const { data, error } = await supabase.from('payroll_periods').select('*').order('period_code', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocalCache('payroll_periods', data);
        return data as PayrollPeriod[];
      }
    } catch (e) {
      console.warn('[Supabase fetchPayrollPeriods Exception]:', e);
    }
    return getLocalCache('payroll_periods', initialPeriods);
  },

  async savePayrollPeriod(period: Partial<PayrollPeriod>): Promise<PayrollPeriod[]> {
    const current = await this.fetchPayrollPeriods();
    const existingIdx = current.findIndex(p => p.id === period.id);
    let updated: PayrollPeriod[];
    if (existingIdx >= 0) {
      updated = current.map(p => p.id === period.id ? { ...p, ...period } as PayrollPeriod : p);
    } else {
      updated = [period as PayrollPeriod, ...current];
    }
    setLocalCache('payroll_periods', updated);
    try { await supabase.from('payroll_periods').upsert(period); } catch (e) {}
    return updated;
  },

  // 2. Payroll Components
  async fetchPayrollComponents(): Promise<PayrollComponent[]> {
    return getLocalCache('payroll_components', initialComponents);
  },

  async savePayrollComponent(comp: Partial<PayrollComponent>): Promise<PayrollComponent[]> {
    const current = await this.fetchPayrollComponents();
    const updated = [comp as PayrollComponent, ...current.filter(c => c.id !== comp.id)];
    setLocalCache('payroll_components', updated);
    try { await supabase.from('payroll_components').upsert(comp); } catch (e) {}
    return updated;
  },

  // 3. Payslips
  async fetchPayslips(periodId?: string): Promise<Payslip[]> {
    const cached = getLocalCache<Payslip[]>('payroll_payslips', []);
    if (periodId) return cached.filter(p => p.payroll_period_id === periodId);
    return cached;
  },

  async generatePayrollForPeriod(periodId: string, schoolId: string = 'school-palmeraie-01'): Promise<{ period: PayrollPeriod; payslips: Payslip[] }> {
    const employees = await hrService.fetchEmployees();
    const activeEmployees = employees.filter(e => e.employment_status === 'actif');
    const components = await this.fetchPayrollComponents();

    const generatedPayslips: Payslip[] = activeEmployees.map(emp => {
      return calculateEmployeePayslip(
        emp,
        undefined,
        components,
        periodId,
        schoolId,
        0, // demo absences
        0  // demo overtime
      );
    });

    // Save payslips
    const existingPayslips = getLocalCache<Payslip[]>('payroll_payslips', []);
    const otherPeriodPayslips = existingPayslips.filter(p => p.payroll_period_id !== periodId);
    const updatedPayslips = [...generatedPayslips, ...otherPeriodPayslips];
    setLocalCache('payroll_payslips', updatedPayslips);

    // Update period status and totals
    const totalGross = generatedPayslips.reduce((sum, p) => sum + p.gross_salary, 0);
    const totalDeductions = generatedPayslips.reduce((sum, p) => sum + p.total_deductions, 0);
    const totalNet = generatedPayslips.reduce((sum, p) => sum + p.net_salary, 0);

    const periods = await this.fetchPayrollPeriods();
    const targetPeriod = periods.find(p => p.id === periodId);
    const updatedPeriod: PayrollPeriod = targetPeriod ? {
      ...targetPeriod,
      status: 'calculee',
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_net: totalNet,
      employee_count: generatedPayslips.length
    } : {
      id: periodId,
      school_id: schoolId,
      name: 'Période de paie',
      period_code: periodId,
      start_date: new Date().toISOString().substring(0, 10),
      end_date: new Date().toISOString().substring(0, 10),
      status: 'calculee',
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_net: totalNet,
      employee_count: generatedPayslips.length
    };

    await this.savePayrollPeriod(updatedPeriod);
    return { period: updatedPeriod, payslips: generatedPayslips };
  },

  // 4. Payments
  async fetchSalaryPayments(): Promise<SalaryPayment[]> {
    return getLocalCache('payroll_salary_payments', []);
  },

  async recordSalaryPayment(payment: Partial<SalaryPayment>): Promise<SalaryPayment[]> {
    const current = await this.fetchSalaryPayments();
    const updated = [payment as SalaryPayment, ...current];
    setLocalCache('payroll_salary_payments', updated);

    // Update payslip status
    if (payment.payslip_id) {
      const payslips = await this.fetchPayslips();
      const updatedPayslips = payslips.map(ps => {
        if (ps.id === payment.payslip_id) {
          const newPaidAmount = (ps.paid_amount || 0) + (payment.amount || 0);
          const isFullyPaid = newPaidAmount >= ps.net_salary;
          return {
            ...ps,
            paid_amount: newPaidAmount,
            payment_status: isFullyPaid ? 'paye' : 'partiel',
            status: isFullyPaid ? 'paye' : ps.status,
            paid_at: new Date().toISOString()
          } as Payslip;
        }
        return ps;
      });
      setLocalCache('payroll_payslips', updatedPayslips);
    }

    try { await supabase.from('salary_payments').insert(payment); } catch (e) {}
    return updated;
  }
};
