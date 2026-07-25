import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, Award, Calendar, School, User, BookOpen, AlertTriangle, ArrowLeft, Printer } from 'lucide-react';
import { Certificate } from '../../../types/database';
import { examsService } from '../../../services/examsService';

interface PublicVerificationPageProps {
  code: string;
  onBack?: () => void;
}

export const PublicVerificationPage: React.FC<PublicVerificationPageProps> = ({ code, onBack }) => {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCert = async () => {
      setLoading(true);
      setError(null);
      try {
        const cert = await examsService.verifyCertificate(code);
        if (cert) {
          setCertificate(cert);
        } else {
          setError('Aucun certificat trouvé ou code d\'authentification invalide.');
        }
      } catch (err) {
        setError('Erreur lors de la vérification du document.');
      } finally {
        setLoading(false);
      }
    };

    fetchCert();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-medium">Vérification de l'authenticité du document auprès du serveur central MENA / IvoireÉcole+...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-rose-300">Certificat Non Valide</h2>
          <p className="text-sm text-slate-400">
            {error || 'Le code fourni ne correspond à aucun document officiel enregistré sur la plateforme IvoireÉcole+.'}
          </p>
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                if (onBack) onBack();
                else window.location.href = '/';
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center space-x-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retourner à l'accueil</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Verification Status Banner */}
        <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-4 sm:p-6 flex items-start sm:items-center space-x-4 shadow-xl backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950">
                Officiel & Authentifié
              </span>
              <span className="text-xs text-emerald-400/80 font-mono hidden sm:inline">
                Code: {certificate.verification_code}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white mt-1">
              Document Réel Certifié IvoireÉcole+
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Ce certificat a été émis et scellé électroniquement par l'établissement agréé par le Ministère de l'Éducation Nationale et de l'Alphabétisation (MENA).
            </p>
          </div>
        </div>

        {/* Official Certificate Card */}
        <div id="printable-certificate" className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-amber-500/40 relative overflow-hidden">
          
          {/* Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <Award className="w-96 h-96 text-slate-900" />
          </div>

          {/* Institutional Top Header */}
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
                GROUPE ÉDUCATIF SAINT-VIATEUR
              </h2>
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">
                Autorisation MENA N° 000730/MENA — Abidjan Côte d'Ivoire
              </p>
            </div>
          </div>

          {/* Document Title */}
          <div className="py-6 text-center space-y-2">
            <span className="px-4 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-widest inline-block border border-amber-300">
              {certificate.certificate_type === 'EXCELLENCE' ? 'Tableau d\'Excellence & Distinction' : 'Attestation de Réussite'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              {certificate.title}
            </h3>
            <p className="text-xs font-mono text-slate-500">
              N° d'Enregistrement : <strong className="text-slate-800">{certificate.certificate_number}</strong>
            </p>
          </div>

          {/* Student & Result Details Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 my-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-semibold uppercase flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nom & Prénoms de l'Élève</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900">
                  {certificate.student_name}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-semibold uppercase flex items-center space-x-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>Matricule & Classe</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900">
                  {certificate.registration_number} — <span className="text-amber-700">{certificate.class_name}</span>
                </div>
              </div>
            </div>

            {certificate.exam_name && (
              <div className="pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-500 font-semibold uppercase">Examen Blanc Concerné</div>
                <div className="text-sm font-semibold text-slate-800">{certificate.exam_name}</div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Moyenne Obtenue</div>
                <div className="text-lg sm:text-xl font-black text-emerald-700">
                  {certificate.average ? `${certificate.average.toFixed(2)} / 20` : 'N/A'}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Rang Général</div>
                <div className="text-lg sm:text-xl font-black text-brand-700">
                  {certificate.rank ? `${certificate.rank}${certificate.rank === 1 ? 'er' : 'ème'}` : 'N/A'}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Mention Attribution</div>
                <div className="text-base sm:text-lg font-black text-amber-700">
                  {certificate.mention || 'Très Bien'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Signatures and QR Code */}
          <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <img src={qrUrl} alt="QR Code d'Authentification" className="w-20 h-20 rounded-lg border border-slate-300 p-1 bg-white" />
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Code QR de Sécurité</span>
                </div>
                <div>Scannable via smartphone</div>
                <div className="font-mono text-[10px] text-slate-500">{certificate.verification_code}</div>
              </div>
            </div>

            <div className="text-center sm:text-right space-y-1">
              <div className="text-xs text-slate-500 italic">
                Fait à Abidjan, le {new Date(certificate.issued_at || Date.now()).toLocaleDateString('fr-FR')}
              </div>
              <div className="font-bold text-sm text-slate-900 pt-2">
                Le Directeur Général d'Établissement
              </div>
              <div className="text-xs font-serif text-amber-800 italic pt-1">
                Père Jean-Luc KOUADIO (Signé Électroniquement)
              </div>
            </div>
          </div>

        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => {
              if (onBack) onBack();
              else window.history.back();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / Exporter PDF Certifié</span>
          </button>
        </div>

      </div>
    </div>
  );
};
