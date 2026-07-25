import React from 'react';
import { X, Printer, Download, ShieldCheck, Award, CheckCircle } from 'lucide-react';
import { Certificate } from '../../../types/database';

interface CertificatePDFModalProps {
  certificate: Certificate;
  onClose: () => void;
}

export const CertificatePDFModal: React.FC<CertificatePDFModalProps> = ({ certificate, onClose }) => {
  const verifyUrl = `${window.location.origin}/verify/${certificate.verification_code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Certificat Officiel Certifié</h3>
              <p className="text-xs text-slate-400">Généré le {new Date(certificate.issued_at || Date.now()).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Certificate View */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 custom-scrollbar">
          <div id="printable-certificate-modal" className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border-4 border-amber-500/50 relative overflow-hidden max-w-3xl mx-auto">
            
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <Award className="w-96 h-96 text-slate-900" />
            </div>

            {/* Institutional Header */}
            <div className="border-b-2 border-amber-600/30 pb-6 text-center space-y-2">
              <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-widest">
                <div>RÉPUBLIQUE DE CÔTE D'IVOIRE<br/><span className="font-normal text-[9px]">Union - Discipline - Travail</span></div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-300 p-1 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-amber-600" />
                </div>
                <div className="text-right">MINISTÈRE DE L'ÉDUCATION NATIONALE<br/><span className="font-normal text-[9px]">ET DE L'ALPHABÉTISATION</span></div>
              </div>

              <div className="pt-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  COLLÈGE & LYCÉE CATHOLIQUE SAINT-VIATEUR
                </h2>
                <p className="text-xs text-amber-800 font-semibold uppercase tracking-wider">
                  Autorisation MENA N° 000730/MENA — Abidjan Palmeraie
                </p>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="py-8 text-center space-y-3">
              <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-widest inline-block border border-amber-300">
                {certificate.certificate_type === 'EXCELLENCE' ? 'Tableau d\'Excellence & Distinction' : 'Certificat Officiel de Réussite'}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif">
                {certificate.title}
              </h1>
              <p className="text-xs font-mono text-slate-500">
                Numéro de Certificat : <strong className="text-slate-900">{certificate.certificate_number}</strong>
              </p>
            </div>

            {/* Details Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 my-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Nom & Prénoms du Récipiendaire</div>
                  <div className="text-xl font-black text-slate-900">{certificate.student_name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Matricule & Classe</div>
                  <div className="text-lg font-bold text-slate-800">
                    {certificate.registration_number} — <span className="text-amber-700 font-extrabold">{certificate.class_name}</span>
                  </div>
                </div>
              </div>

              {certificate.exam_name && (
                <div className="pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Évaluation / Examen Blanc</div>
                  <div className="text-sm font-bold text-slate-800">{certificate.exam_name}</div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Moyenne Générale</div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700">
                    {certificate.average ? `${certificate.average.toFixed(2)} / 20` : 'N/A'}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Rang Obtenu</div>
                  <div className="text-xl sm:text-2xl font-black text-brand-700">
                    {certificate.rank ? `${certificate.rank}${certificate.rank === 1 ? 'er' : 'ème'}` : 'N/A'}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Mention Accordée</div>
                  <div className="text-lg sm:text-xl font-black text-amber-700">
                    {certificate.mention || 'Très Bien'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Signatures & QR Code */}
            <div className="pt-8 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <img src={qrUrl} alt="Authentification QR Code" className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-300" />
                <div className="text-[10px] text-slate-600 space-y-0.5">
                  <div className="font-bold text-slate-900 flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Vérification Anti-Falsification</span>
                  </div>
                  <div>Scannez pour vérifier en ligne</div>
                  <div className="font-mono text-slate-500">{certificate.verification_code}</div>
                </div>
              </div>

              <div className="text-center sm:text-right space-y-1">
                <div className="text-xs text-slate-500 italic">
                  Abidjan, le {new Date(certificate.issued_at || Date.now()).toLocaleDateString('fr-FR')}
                </div>
                <div className="font-bold text-sm text-slate-900 pt-2">
                  Le Directeur Général des Études
                </div>
                <div className="text-xs font-serif text-amber-800 italic pt-1">
                  Père Jean-Luc KOUADIO
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
