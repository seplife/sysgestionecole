import { supabase } from '../lib/supabase';
import { getLocalCache, setLocalCache } from './supabaseService';
import { Department, ServiceUnit, Position, Employee, EmployeeContract, EmployeeAttendance, LeaveType, LeaveRequest } from '../types';

// Initial seeds for demo/offline
const initialDepartments: Department[] = [
  { id: 'dept-01', school_id: 'school-palmeraie-01', code: 'PEDAGOGIE', name: 'Direction des Études & Pédagogie', description: 'Enseignement, programmes et suivi des classes' },
  { id: 'dept-02', school_id: 'school-palmeraie-01', code: 'ADMIN', name: 'Administration & Secrétariat', description: 'Gestion administrative et scolarité' },
  { id: 'dept-03', school_id: 'school-palmeraie-01', code: 'FINANCE', name: 'Comptabilité & Intendance', description: 'Gestion financière, paie et recouvrement' },
  { id: 'dept-04', school_id: 'school-palmeraie-01', code: 'TECH', name: 'Informatique & Services Techniques', description: 'Maintenance, réseau et sécurité' }
];

const initialPositions: Position[] = [
  { id: 'pos-01', school_id: 'school-palmeraie-01', title: 'Professeur Titulaire (Lycée)', code: 'ENS_LYCEE', category: 'Pédagogique', base_salary_min: 250000, base_salary_max: 450000 },
  { id: 'pos-02', school_id: 'school-palmeraie-01', title: 'Éducateur de Niveau', code: 'EDUC', category: 'Pédagogique', base_salary_min: 200000, base_salary_max: 350000 },
  { id: 'pos-03', school_id: 'school-palmeraie-01', title: 'Chef Comptable', code: 'COMPT_CHEF', category: 'Administratif', base_salary_min: 350000, base_salary_max: 600000 },
  { id: 'pos-04', school_id: 'school-palmeraie-01', title: 'Surveillant Général', code: 'SURV_GEN', category: 'Administratif', base_salary_min: 180000, base_salary_max: 280000 }
];

const initialEmployees: Employee[] = [
  {
    id: 'emp-001',
    school_id: 'school-palmeraie-01',
    employee_number: 'EMP-2024-001',
    first_name: 'Dr. Yao',
    last_name: 'KOUADIO',
    gender: 'M',
    date_of_birth: '1982-05-14',
    place_of_birth: 'Yamoussoukro',
    nationality: 'Ivoirienne',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    phone: '+225 05 05 44 55 66',
    email: 'y.kouadio@saintviateur.ci',
    address: 'Riviera Palmeraie, Abidjan',
    employee_type: 'enseignant',
    department_name: 'Direction des Études & Pédagogie',
    position_name: 'Professeur Titulaire (Lycée)',
    hire_date: '2020-09-01',
    employment_status: 'actif',
    contract_type: 'CDI',
    base_salary: 350000,
    payment_method: 'virement',
    bank_name: 'NSIA Banque CI',
    iban: 'CI092 01001 12345678901 45',
    cnps_number: 'CNPS-8899201-CI'
  },
  {
    id: 'emp-002',
    school_id: 'school-palmeraie-01',
    employee_number: 'EMP-2024-002',
    first_name: 'Mme Binta',
    last_name: 'SY',
    gender: 'F',
    date_of_birth: '1988-11-20',
    place_of_birth: 'Abidjan',
    nationality: 'Ivoirienne',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
    phone: '+225 07 47 12 34 56',
    email: 'b.sy@saintviateur.ci',
    address: 'Angré 8ème Tranche',
    employee_type: 'enseignant',
    department_name: 'Direction des Études & Pédagogie',
    position_name: 'Professeur Titulaire (Lycée)',
    hire_date: '2021-10-15',
    employment_status: 'actif',
    contract_type: 'CDI',
    base_salary: 320000,
    payment_method: 'mobile_money',
    mobile_money_provider: 'Wave',
    mobile_money_number: '+225 07 47 12 34 56',
    cnps_number: 'CNPS-9988102-CI'
  },
  {
    id: 'emp-003',
    school_id: 'school-palmeraie-01',
    employee_number: 'EMP-2024-003',
    first_name: 'Honoré',
    last_name: 'BAMBA',
    gender: 'M',
    date_of_birth: '1990-03-10',
    place_of_birth: 'Bouaké',
    nationality: 'Ivoirienne',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    phone: '+225 05 01 22 33 44',
    email: 'h.bamba@saintviateur.ci',
    address: 'Cocody Deux-Plateaux',
    employee_type: 'admin',
    department_name: 'Administration & Secrétariat',
    position_name: 'Éducateur de Niveau',
    hire_date: '2022-01-10',
    employment_status: 'actif',
    contract_type: 'CDD',
    base_salary: 240000,
    payment_method: 'virement',
    bank_name: 'Ecobank CI',
    iban: 'CI059 01002 98765432100 88',
    cnps_number: 'CNPS-5544332-CI'
  }
];

const initialContracts: EmployeeContract[] = [
  {
    id: 'ctr-001',
    school_id: 'school-palmeraie-01',
    employee_id: 'emp-001',
    employee_name: 'Dr. Yao KOUADIO',
    contract_number: 'CTR-2020-001',
    contract_type: 'CDI',
    start_date: '2020-09-01',
    contractual_salary: 350000,
    weekly_hours: 40,
    status: 'actif',
    notes: 'Contrat d\'enseignant permanent titulaire'
  },
  {
    id: 'ctr-002',
    school_id: 'school-palmeraie-01',
    employee_id: 'emp-002',
    employee_name: 'Mme Binta SY',
    contract_number: 'CTR-2021-004',
    contract_type: 'CDI',
    start_date: '2021-10-15',
    contractual_salary: 320000,
    weekly_hours: 40,
    status: 'actif'
  },
  {
    id: 'ctr-003',
    school_id: 'school-palmeraie-01',
    employee_id: 'emp-003',
    employee_name: 'Honoré BAMBA',
    contract_number: 'CTR-2024-089',
    contract_type: 'CDD',
    start_date: '2024-09-01',
    end_date: '2026-08-31',
    trial_period_months: 3,
    contractual_salary: 240000,
    weekly_hours: 40,
    status: 'actif',
    notes: 'Contrat CDD de 2 ans à renouveler sous 30 jours'
  }
];

const initialLeaveTypes: LeaveType[] = [
  { id: 'lt-01', school_id: 'school-palmeraie-01', code: 'CONGE_ANNUEL', name: 'Congé Annuel Payé', default_days_per_year: 30, is_paid: true, requires_attachment: false },
  { id: 'lt-02', school_id: 'school-palmeraie-01', code: 'MALADIE', name: 'Congé Maladie', default_days_per_year: 15, is_paid: true, requires_attachment: true },
  { id: 'lt-03', school_id: 'school-palmeraie-01', code: 'MATERNITE', name: 'Congé Maternité / Paternité', default_days_per_year: 90, is_paid: true, requires_attachment: true },
  { id: 'lt-04', school_id: 'school-palmeraie-01', code: 'AUTORISATION', name: 'Autorisation d\'Absence Exceptionnelle', default_days_per_year: 5, is_paid: true, requires_attachment: false }
];

export const hrService = {
  // 1. Employees
  async fetchEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocalCache('hr_employees', data);
        return data as Employee[];
      }
    } catch (e) {
      console.warn('[Supabase fetchEmployees Exception]:', e);
    }
    return getLocalCache('hr_employees', initialEmployees);
  },

  async saveEmployee(employee: Partial<Employee>): Promise<Employee[]> {
    const current = await this.fetchEmployees();
    const existingIdx = current.findIndex(e => e.id === employee.id);
    let updated: Employee[];
    if (existingIdx >= 0) {
      updated = current.map(e => e.id === employee.id ? { ...e, ...employee } as Employee : e);
    } else {
      updated = [employee as Employee, ...current];
    }
    setLocalCache('hr_employees', updated);
    try {
      await supabase.from('employees').upsert(employee);
    } catch (e) {
      console.warn('[Supabase saveEmployee Exception]:', e);
    }
    return updated;
  },

  async deleteEmployee(id: string): Promise<Employee[]> {
    const current = await this.fetchEmployees();
    const updated = current.filter(e => e.id !== id);
    setLocalCache('hr_employees', updated);
    try {
      await supabase.from('employees').delete().eq('id', id);
    } catch (e) {
      console.warn('[Supabase deleteEmployee Exception]:', e);
    }
    return updated;
  },

  // 2. Contracts
  async fetchContracts(): Promise<EmployeeContract[]> {
    try {
      const { data, error } = await supabase.from('employee_contracts').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocalCache('hr_contracts', data);
        return data as EmployeeContract[];
      }
    } catch (e) {
      console.warn('[Supabase fetchContracts Exception]:', e);
    }
    return getLocalCache('hr_contracts', initialContracts);
  },

  async saveContract(contract: Partial<EmployeeContract>): Promise<EmployeeContract[]> {
    const current = await this.fetchContracts();
    const existingIdx = current.findIndex(c => c.id === contract.id);
    let updated: EmployeeContract[];
    if (existingIdx >= 0) {
      updated = current.map(c => c.id === contract.id ? { ...c, ...contract } as EmployeeContract : c);
    } else {
      updated = [contract as EmployeeContract, ...current];
    }
    setLocalCache('hr_contracts', updated);
    try {
      await supabase.from('employee_contracts').upsert(contract);
    } catch (e) {
      console.warn('[Supabase saveContract Exception]:', e);
    }
    return updated;
  },

  async deleteContract(id: string): Promise<EmployeeContract[]> {
    const current = await this.fetchContracts();
    const updated = current.filter(c => c.id !== id);
    setLocalCache('hr_contracts', updated);
    try {
      await supabase.from('employee_contracts').delete().eq('id', id);
    } catch (e) {
      console.warn('[Supabase deleteContract Exception]:', e);
    }
    return updated;
  },

  // 3. Departments & Positions
  async fetchDepartments(): Promise<Department[]> {
    try {
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (!error && data && data.length > 0) {
        setLocalCache('hr_departments', data);
        return data as Department[];
      }
    } catch (e) {
      console.warn('[Supabase fetchDepartments Error]:', e);
    }
    return getLocalCache('hr_departments', initialDepartments);
  },

  async saveDepartment(dept: Partial<Department>): Promise<Department[]> {
    const current = await this.fetchDepartments();
    const updated = [dept as Department, ...current.filter(d => d.id !== dept.id)];
    setLocalCache('hr_departments', updated);
    try { await supabase.from('departments').upsert(dept); } catch (e) {}
    return updated;
  },

  async fetchPositions(): Promise<Position[]> {
    try {
      const { data, error } = await supabase.from('positions').select('*').order('title');
      if (!error && data && data.length > 0) {
        setLocalCache('hr_positions', data);
        return data as Position[];
      }
    } catch (e) {
      console.warn('[Supabase fetchPositions Error]:', e);
    }
    return getLocalCache('hr_positions', initialPositions);
  },

  async savePosition(pos: Partial<Position>): Promise<Position[]> {
    const current = await this.fetchPositions();
    const updated = [pos as Position, ...current.filter(p => p.id !== pos.id)];
    setLocalCache('hr_positions', updated);
    try { await supabase.from('positions').upsert(pos); } catch (e) {}
    return updated;
  },

  // 4. Attendance
  async fetchEmployeeAttendance(date?: string): Promise<EmployeeAttendance[]> {
    const cached = getLocalCache<EmployeeAttendance[]>('hr_attendance', []);
    if (date) return cached.filter(a => a.date === date);
    return cached;
  },

  async saveAttendanceBatch(records: EmployeeAttendance[]): Promise<EmployeeAttendance[]> {
    const current = getLocalCache<EmployeeAttendance[]>('hr_attendance', []);
    const map = new Map<string, EmployeeAttendance>();
    current.forEach(r => map.set(`${r.employee_id}_${r.date}`, r));
    records.forEach(r => map.set(`${r.employee_id}_${r.date}`, r));
    const updated = Array.from(map.values());
    setLocalCache('hr_attendance', updated);
    try { await supabase.from('employee_attendance').upsert(records); } catch (e) {}
    return updated;
  },

  // 5. Leave Types & Requests
  async fetchLeaveTypes(): Promise<LeaveType[]> {
    return getLocalCache('hr_leave_types', initialLeaveTypes);
  },

  async fetchLeaveRequests(): Promise<LeaveRequest[]> {
    return getLocalCache('hr_leave_requests', [
      {
        id: 'lr-001',
        school_id: 'school-palmeraie-01',
        employee_id: 'emp-001',
        employee_name: 'Dr. Yao KOUADIO',
        leave_type_id: 'lt-01',
        leave_type_name: 'Congé Annuel Payé',
        start_date: '2026-08-01',
        end_date: '2026-08-20',
        duration_days: 20,
        reason: 'Congés scolaires d\'été',
        status: 'approuve',
        created_at: new Date().toISOString()
      }
    ]);
  },

  async saveLeaveRequest(request: Partial<LeaveRequest>): Promise<LeaveRequest[]> {
    const current = await this.fetchLeaveRequests();
    const updated = [request as LeaveRequest, ...current.filter(r => r.id !== request.id)];
    setLocalCache('hr_leave_requests', updated);
    try { await supabase.from('employee_leave_requests').upsert(request); } catch (e) {}
    return updated;
  }
};
