// ============================================================
// DONNÉES DE DÉMONSTRATION & TEST (OFFLINE / INITIALISATION SEED)
// ============================================================

import { School, Student, Parent, SchoolClass, Subject, PaymentTransaction } from '../types/database';

export const DEMO_SCHOOL: School = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'COLLÈGE CATHOLIQUE SAINT-VIATEUR',
  slug: 'saint-viateur-palmeraie',
  registration_number: '000730/MENA',
  motto: 'Foi, Discipline, Excellence',
  address: 'Riviera Palmeraie, Rue de la Paix',
  city: 'Abidjan (Cocody)',
  country: 'Côte d\'Ivoire',
  phone: '+225 27 22 49 88 00',
  whatsapp: '+225 07 08 09 10 11',
  email: 'contact@saintviateur-palmeraie.ci',
  director_name: 'Père Jean-Luc KOUADIO',
  school_type: 'Prive',
  status: 'active',
  created_at: new Date().toISOString()
};

export const DEMO_CLASSES: SchoolClass[] = [
  { id: '10000000-0000-4000-8000-000000000001', school_id: DEMO_SCHOOL.id, name: '3ème 2', level: 'Collège', capacity: 45, student_count: 5, created_at: new Date().toISOString() },
  { id: '10000000-0000-4000-8000-000000000002', school_id: DEMO_SCHOOL.id, name: '6ème 1', level: 'Collège', capacity: 50, student_count: 0, created_at: new Date().toISOString() },
  { id: '10000000-0000-4000-8000-000000000003', school_id: DEMO_SCHOOL.id, name: 'Tle D 1', level: 'Lycée', capacity: 40, student_count: 0, created_at: new Date().toISOString() }
];

export const DEMO_STUDENTS: Student[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    school_id: DEMO_SCHOOL.id,
    registration_number: '24180492A',
    first_name: 'Awa Fatima',
    last_name: 'DIABATÉ',
    date_of_birth: '2011-04-12',
    place_of_birth: 'Abidjan Cocody',
    gender: 'F',
    nationality: 'Ivoirienne',
    status: 'Inscrit',
    current_class_name: '3ème 2',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    created_at: new Date().toISOString()
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    school_id: DEMO_SCHOOL.id,
    registration_number: '24180493B',
    first_name: 'Marc-Aurèle',
    last_name: 'KOFFI',
    date_of_birth: '2011-08-25',
    place_of_birth: 'Yamoussoukro',
    gender: 'M',
    nationality: 'Ivoirienne',
    status: 'Reinscrit',
    current_class_name: '3ème 2',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300',
    created_at: new Date().toISOString()
  }
];

export const DEMO_SUBJECTS: Subject[] = [
  { id: '30000000-0000-4000-8000-000000000001', school_id: DEMO_SCHOOL.id, code: 'MATH', name: 'Mathématiques', coefficient: 4, created_at: new Date().toISOString() },
  { id: '30000000-0000-4000-8000-000000000002', school_id: DEMO_SCHOOL.id, code: 'FRAN', name: 'Français', coefficient: 5, created_at: new Date().toISOString() },
  { id: '30000000-0000-4000-8000-000000000003', school_id: DEMO_SCHOOL.id, code: 'ANG', name: 'Anglais', coefficient: 3, created_at: new Date().toISOString() }
];

export const DEMO_PAYMENTS: PaymentTransaction[] = [
  {
    id: '40000000-0000-4000-8000-000000000001',
    school_id: DEMO_SCHOOL.id,
    student_id: DEMO_STUDENTS[0].id,
    receipt_number: 'REC-2026-0089',
    student_name: 'Awa Fatima DIABATÉ',
    amount: 150000,
    currency: 'XOF',
    payment_method: 'wave',
    reference: 'WAVE-CI-8921039',
    status: 'completed',
    payment_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  }
];
