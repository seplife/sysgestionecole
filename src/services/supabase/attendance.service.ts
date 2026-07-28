// ============================================================
// SERVICE GESTION DES PRÉSENCES ET ABSENCES
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid, isValidUuid } from './validators';
import { AttendanceRecord, AttendanceInsert } from '../../types/database';

export const attendanceService = {
  async getAttendance(schoolId: string, classId?: string, date?: string): Promise<AttendanceRecord[]> {
    requireValidUuid(schoolId, 'School ID');
    let query = supabase.from('attendance_records').select('*').eq('school_id', schoolId);

    if (classId && isValidUuid(classId)) {
      query = query.eq('class_id', classId);
    }
    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    if (error) throw handleSupabaseError(error, 'Chargement des présences');
    return (data as AttendanceRecord[]) || [];
  },

  async saveRecord(record: AttendanceInsert): Promise<AttendanceRecord> {
    requireValidUuid(record.school_id, 'School ID');
    requireValidUuid(record.student_id, 'Student ID');
    requireValidUuid(record.class_id, 'Class ID');

    const payload = {
      school_id: record.school_id,
      student_id: record.student_id,
      class_id: record.class_id,
      academic_term_id: record.academic_term_id && isValidUuid(record.academic_term_id) ? record.academic_term_id : null,
      date: record.date || new Date().toISOString().split('T')[0],
      status: record.status || 'present',
      reason: record.reason?.trim() || null,
      created_by: record.created_by && isValidUuid(record.created_by) ? record.created_by : null
    };

    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(payload, { onConflict: 'student_id,class_id,date' })
      .select()
      .single();

    if (error) throw handleSupabaseError(error, 'Enregistrement de la présence');
    return data as AttendanceRecord;
  },

  async saveBatch(records: AttendanceInsert[]): Promise<AttendanceRecord[]> {
    if (records.length === 0) return [];
    
    const payloads = records.map(r => {
      requireValidUuid(r.school_id, 'School ID');
      requireValidUuid(r.student_id, 'Student ID');
      requireValidUuid(r.class_id, 'Class ID');

      return {
        school_id: r.school_id,
        student_id: r.student_id,
        class_id: r.class_id,
        academic_term_id: r.academic_term_id && isValidUuid(r.academic_term_id) ? r.academic_term_id : null,
        date: r.date || new Date().toISOString().split('T')[0],
        status: r.status || 'present',
        reason: r.reason?.trim() || null,
        created_by: r.created_by && isValidUuid(r.created_by) ? r.created_by : null
      };
    });

    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(payloads, { onConflict: 'student_id,class_id,date' })
      .select();

    if (error) throw handleSupabaseError(error, 'Enregistrement du lot de présences');
    return (data as AttendanceRecord[]) || [];
  }
};
