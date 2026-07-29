import React, { useState, useEffect } from 'react';
import { X, QrCode, Printer, ShieldCheck, Phone, MapPin, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Student, PaymentTransaction } from '../../types/database';
import { useTenant } from '../../context/TenantContext';
import { calculateStudentTuition, StudentTuitionInfo } from '../../services/studentTuitionService';
import { supabaseService } from '../../services/supabaseService';
import { formatFCFA } from '../../utils/payrollCalculations';

interface StudentCardModalProps {
  student: Student;
  onClose: () => void;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({ student, onClose }) => {
  const { currentSchool, academicYear } = useTenant();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [showQrDetails, setShowQrDetails] = useState(false);

  useEffect(() => {
    supabaseService.fetchPayments().then(setPayments);
  }, []);

  const tuitionInfo: StudentTuitionInfo = calculateStudentTuition(student, payments);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-bold">
            <ShieldCheck className="w-5 h-5" />
            <span>Carte Scolaire Officielle avec Statut QR</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE BADGE CARD */}
        <div className="printable-area bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 text-white rounded-2xl p-5 shadow-xl border-2 border-brand-500/40 relative overflow-hidden space-y-4">
          {/* Top Banner */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-white text-brand-600 font-extrabold flex items-center justify-center text-xs">
                IÉ+
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-tight text-white">{currentSchool.name}</div>
                <div className="text-[9px] text-brand-200">{currentSchool.registration_number} • {academicYear.name}</div>
              </div>
            </div>
            {/* Financial Status Badge */}
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${tuitionInfo.isSolded ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
              {tuitionInfo.statusLabel}
            </span>
          </div>

          {/* Student Main Info */}
          <div className="flex space-x-4 items-center">
            {/* Student Photo */}
            <div className="relative">
              <img 
                src={student.photo_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300'} 
                alt={student.first_name}
                className="w-24 h-28 object-cover rounded-xl border-2 border-white/80 shadow-md"
              />
              <span className="absolute -bottom-2 -right-1 bg-emerald-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">
                INSCRIT
              </span>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-1 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">MATRICULE MENA</div>
                <div className="font-mono text-sm font-extrabold text-amber-300 tracking-wider">{student.registration_number}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">NOM & PRÉNOMS</div>
                <div className="font-bold text-white text-sm leading-tight">{student.last_name}</div>
                <div className="text-slate-200 font-medium">{student.first_name}</div>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1">
                <div>
                  <span className="text-[9px] text-slate-400 block">CLASSE</span>
                  <span className="font-bold text-brand-300">{student.current_class_name || '3ème 2'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">SANG</span>
                  <span className="font-bold text-rose-300">{student.blood_group || 'O+'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Status Summary Box */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15 text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-semibold">Statut Scolarité :</span>
              <span className={`font-extrabold ${tuitionInfo.isSolded ? 'text-emerald-400' : 'text-rose-300'}`}>
                {tuitionInfo.isSolded ? '✓ SCOLARITÉ SOLDÉE' : `⚠ RESTE À PAYER (${formatFCFA(tuitionInfo.remainingBalance)})`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1 border-t border-white/10">
              <div>Payé : <strong className="text-white">{formatFCFA(tuitionInfo.totalPaid)}</strong></div>
              <div>Total Frais : <strong className="text-white">{formatFCFA(tuitionInfo.totalTuition)}</strong></div>
            </div>
          </div>

          {/* Footer Bar with Address & Real Scannable QR Code */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <div className="space-y-0.5 text-[9px] text-slate-300">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[170px]">{student.address || 'Riviera Palmeraie, Abidjan'}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Contact: +225 27 22 49 88 00</span>
              </div>
            </div>

            {/* REAL SCANNABLE QR CODE */}
            <div className="bg-white p-1.5 rounded-lg text-slate-900 shadow-md flex flex-col items-center">
              <img
                src={tuitionInfo.qrImageUrl}
                alt={`QR Code ${student.registration_number}`}
                className="w-16 h-16 object-contain"
              />
              <span className="text-[7px] font-mono font-extrabold mt-0.5 text-slate-800">{student.registration_number}</span>
            </div>
          </div>
        </div>

        {/* QR Code Payload Inspection Toggle (no-print) */}
        <div className="no-print bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 text-xs space-y-2 border border-slate-200 dark:border-slate-700">
          <div 
            onClick={() => setShowQrDetails(!showQrDetails)}
            className="flex items-center justify-between cursor-pointer font-bold text-slate-700 dark:text-slate-300"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-brand-500" />
              Contenu du QR Code (Données d'analyse au scan)
            </span>
            <span className="text-brand-600 text-[11px]">{showQrDetails ? 'Masquer' : 'Afficher'}</span>
          </div>

          {showQrDetails && (
            <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[10px] whitespace-pre-wrap overflow-x-auto shadow-inner">
              {tuitionInfo.qrDataString}
            </pre>
          )}
        </div>

        {/* Action Buttons (no-print) */}
        <div className="flex items-center gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer la Carte QR</span>
          </button>
          <button
            onClick={onClose}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
