// ============================================================
// SERVICE GESTION DES ÉVALUATIONS & NOTES
// ============================================================

import { supabase } from './client';
import { handleSupabaseError } from './errors';
import { requireValidUuid, isValidUuid } from './validators';
import { Grade, GradeInsert, Assessment, AssessmentInsert } from '../../types/database';

export const gradeService = {
  async getAssessments(schoolId: string): Promise<Assessment[]> {
    requireValidUuid(schoolId, 'School ID');
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });

    if (error) throw handleSupabaseError(error, 'Chargement des évaluations');
    return (data as Assessment[]) || [];
  },

  async createAssessment(assessmentData: AssessmentInsert): Promise<Assessment> {
    requireValidUuid(assessmentData.school_id, 'School ID');
    requireValidUuid(assessmentData.class_subject_id, 'ClassSubject ID');
    requireValidUuid(assessmentData.academic_term_id, 'AcademicTerm ID');

    const payload = {
      school_id: assessmentData.school_id,
      class_subject_id: assessmentData.class_subject_id,
      academic_term_id: assessmentData.academic_term_id,
      name: assessmentData.name.trim(),
      type: assessmentData.type || 'test',
      coefficient: Number(assessmentData.coefficient) || 1,
      max_score: Number(assessmentData.max_score) || 20,
      date: assessmentData.date || null
    };

    const { data, error } = await supabase
      .from('assessments')
      .insert(payload)
      .select()
      .single();

    if (error) throw handleSupabaseError(error, 'Création de l\'évaluation');
    return data as Assessment;
  },

  async getGradesByAssessment(assessmentId: string): Promise<Grade[]> {
    requireValidUuid(assessmentId, 'Assessment ID');
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (error) throw handleSupabaseError(error, `Chargement des notes de l'évaluation ${assessmentId}`);
    return (data as Grade[]) || [];
  },

  async saveGrade(gradeData: GradeInsert): Promise<Grade> {
    requireValidUuid(gradeData.school_id, 'School ID');
    requireValidUuid(gradeData.assessment_id, 'Assessment ID');
    requireValidUuid(gradeData.student_id, 'Student ID');

    const payload = {
      school_id: gradeData.school_id,
      assessment_id: gradeData.assessment_id,
      student_id: gradeData.student_id,
      score: gradeData.score !== null && gradeData.score !== undefined ? Number(gradeData.score) : null,
      comment: gradeData.comment?.trim() || null
    };

    const { data, error } = await supabase
      .from('grades')
      .upsert(payload, { onConflict: 'assessment_id,student_id' })
      .select()
      .single();

    if (error) throw handleSupabaseError(error, 'Saisie de la note');
    return data as Grade;
  }
};
