import { TimetableEntry, TimetablePeriod } from '../../types/timetable';

class TimetableExportService {
  /**
   * Print current DOM element or generate a formatted print document
   */
  printTimetable(title: string, className?: string) {
    window.print();
  }

  /**
   * Export schedule entries to Excel compatible CSV file
   */
  exportToExcel(entries: TimetableEntry[], filename: string = 'Emploi_du_Temps_IvoireEcole') {
    const headers = [
      'Jour',
      'Horaire',
      'Créneau',
      'Classe',
      'Catégorie',
      'Matière',
      'Enseignant',
      'Salle',
      'Type d\'activité'
    ];

    const rows = entries.map(e => [
      e.day_of_week,
      `${e.start_time} - ${e.end_time}`,
      e.period_code,
      e.class_name,
      e.class_category || 'INTERMEDIATE',
      e.subject_name,
      e.teacher_name,
      e.room_name,
      e.activity_type
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map(r => r.map(field => `"${field}"`).join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const timetableExportService = new TimetableExportService();
