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
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>Registre des Certificats & Authenticité QR Code</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Documents officiels infalsifiables avec clé de vérification publique</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par élève ou code QR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-xs outline-none focus:border-gray-500"
          />
        </div>
      </div>

      {/* Certificates List Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200 dark:border-gray-800">
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
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filteredCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                  
                  <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                    {cert.certificate_number}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-extrabold text-gray-900 dark:text-gray-100">{cert.student_name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{cert.registration_number}</div>
                  </td>

                  <td className="py-3 px-3 font-semibold text-gray-500">
                    {cert.class_name}
                  </td>

                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    {cert.title}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    {cert.average ? `${cert.average.toFixed(2)}/20` : '—'}
                  </td>

                  <td className="py-3 px-3 text-center font-bold text-gray-600 dark:text-gray-300">
                    {cert.rank ? `#${cert.rank}` : '—'}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <QrCode className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-mono text-[11px] text-gray-600 dark:text-gray-300 font-bold">{cert.verification_code}</span>
                      <button
                        onClick={() => handleCopyLink(cert.verification_code)}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                        title="Copier le lien d'authenticité public"
                      >
                        {copiedCode === cert.verification_code ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenCertificateModal(cert)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg transition-colors flex items-center space-x-1 ml-auto text-xs shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer PDF</span>
                    </button>
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
