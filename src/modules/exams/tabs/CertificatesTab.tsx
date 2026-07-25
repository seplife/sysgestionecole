import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Award, QrCode, Printer, Search, Plus, 
  CheckCircle2, ExternalLink, Copy, Eye, FileText
} from 'lucide-react';
import { Certificate } from '../../../types/database';
import { examsService } from '../../../services/examsService';

interface CertificatesTabProps {
  schoolId: string;
  onOpenCertificateModal: (cert: Certificate) => void;
}

export const CertificatesTab: React.FC<CertificatesTabProps> = ({ schoolId, onOpenCertificateModal }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, [schoolId]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const data = await examsService.getCertificates(schoolId);
      setCertificates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredCertificates = certificates.filter(c => 
    c.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.certificate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.verification_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>Registre des Certificats & Authenticité QR Code</span>
          </h2>
          <p className="text-xs text-slate-400">Documents officiels infalsifiables avec clé de vérification publique</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par élève ou code QR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Certificates List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">N° Certificat</th>
                <th className="py-3.5 px-4">Récipiendaire / Élève</th>
                <th className="py-3.5 px-3">Classe</th>
                <th className="py-3.5 px-4">Intitulé du Certificat</th>
                <th className="py-3.5 px-3 text-center">Moyenne</th>
                <th className="py-3.5 px-3 text-center">Rang</th>
                <th className="py-3.5 px-4">Code Vérification QR</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-800/40 transition-colors">
                  
                  <td className="py-3 px-4 font-mono font-bold text-amber-300">
                    {cert.certificate_number}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-100">{cert.student_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{cert.registration_number}</div>
                  </td>

                  <td className="py-3 px-3 font-semibold text-slate-300">
                    {cert.class_name}
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-200">
                    {cert.title}
                  </td>

                  <td className="py-3 px-3 text-center font-bold text-emerald-400">
                    {cert.average ? `${cert.average.toFixed(2)} / 20` : 'N/A'}
                  </td>

                  <td className="py-3 px-3 text-center font-bold text-brand-300">
                    {cert.rank ? `${cert.rank}e` : 'N/A'}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[130px]">
                        {cert.verification_code}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleCopyLink(cert.verification_code)}
                        title="Copier le lien public de vérification"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors flex items-center space-x-1"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        {copiedCode === cert.verification_code && (
                          <span className="text-[10px] text-emerald-400 font-bold">Copié!</span>
                        )}
                      </button>

                      <button
                        onClick={() => onOpenCertificateModal(cert)}
                        className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Aperçu PDF</span>
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
