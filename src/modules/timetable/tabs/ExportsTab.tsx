import React from 'react';
import { Download, Printer, FileSpreadsheet, FileText, Layers, CheckCircle2 } from 'lucide-react';
import { TimetableEntry } from '../../../types/timetable';
import { timetableExportService } from '../../../services/timetable/timetableExportService';

interface Props {
  entries: TimetableEntry[];
}

export const ExportsTab: React.FC<Props> = ({ entries }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-6 h-6 text-brand-500" />
          <span>Centre d'Exportation PDF & Excel</span>
        </h2>
        <p className="text-xs text-slate-400">
          Générer des documents officiels au format professionnel (avec en-tête de l'établissement, année scolaire et logos) pour l'impression ou la diffusion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Export Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Exports PDF Officiels</h3>
              <p className="text-xs text-slate-400">Mise en page institutionnelle imprimable</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => window.print()}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold p-3 rounded-xl text-xs flex items-center justify-between transition-all"
            >
              <span>Imprimer l'Emploi du Temps d'une Classe</span>
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.print()}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold p-3 rounded-xl text-xs flex items-center justify-between transition-all"
            >
              <span>Imprimer le Planning d'un Enseignant</span>
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.print()}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold p-3 rounded-xl text-xs flex items-center justify-between transition-all"
            >
              <span>Imprimer la Grille Globale de l'Établissement</span>
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Excel Export Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Exports Excel (CSV / XLSX)</h3>
              <p className="text-xs text-slate-400">Données structurées pour tableur</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => timetableExportService.exportToExcel(entries, 'Emploi_du_Temps_Global_IvoireEcole')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl text-xs flex items-center justify-between shadow-md transition-all"
            >
              <span>Exporter toutes les affectations au format Excel</span>
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
