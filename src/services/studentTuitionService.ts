// ============================================================
// SERVICE DE CALCUL DU STATUT FINANCIER & SCOLARITÉ DES ÉLÈVES
// Permet de déterminer si un élève a soldé sa scolarité,
// de calculer le montant restant et de générer le QR Code.
// ============================================================

import { Student, PaymentTransaction } from '../types/database';

export interface StudentTuitionInfo {
  totalTuition: number;
  totalPaid: number;
  remainingBalance: number;
  isSolded: boolean;
  statusLabel: 'SOLDÉ' | 'RESTE À PAYER';
  statusBadgeColor: string;
  qrDataString: string;
  qrImageUrl: string;
}

/**
 * Tarifs annuels de scolarité par défaut selon le niveau / classe
 */
const CLASS_TUITION_MAP: Record<string, number> = {
  '3ème 2': 300000,
  '6ème 1': 250000,
  'Tle D 1': 350000,
  'DEFAULT': 300000,
};

/**
 * Calcule le statut financier complet d'un élève à partir de ses paiements
 */
export const calculateStudentTuition = (
  student: Student,
  allPayments: PaymentTransaction[] = []
): StudentTuitionInfo => {
  // 1. Tarif scolarité total
  const className = student.current_class_name || '';
  const totalTuition = CLASS_TUITION_MAP[className] || CLASS_TUITION_MAP['DEFAULT'];

  // 2. Somme des paiements validés pour cet élève
  const studentPayments = allPayments.filter(
    p => p.student_id === student.id ||
      (p.student_name && p.student_name.toLowerCase().includes(student.last_name.toLowerCase()))
  );

  const totalPaid = studentPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // 3. Solde restant
  const remainingBalance = Math.max(0, totalTuition - totalPaid);
  const isSolded = remainingBalance <= 0;
  const statusLabel: 'SOLDÉ' | 'RESTE À PAYER' = isSolded ? 'SOLDÉ' : 'RESTE À PAYER';

  // 4. Couleur du badge
  const statusBadgeColor = isSolded
    ? 'bg-emerald-500 text-white'
    : 'bg-rose-600 text-white';

  // 5. Payload texte du QR Code (scannable par n'importe quel smartphone/caméra)
  const formattedDate = new Date().toLocaleDateString('fr-FR');
  const qrDataString = [
    `=== IVOIREÉCOLE+ : CERTIFICAT & SCOLARITÉ ===`,
    `Matricule : ${student.registration_number}`,
    `Nom & Prénoms : ${student.last_name} ${student.first_name}`,
    `Classe : ${student.current_class_name || 'N/A'}`,
    `----------------------------------------`,
    `STATUT SCOLARITÉ : ${statusLabel}`,
    `Frais Totaux : ${totalTuition.toLocaleString('fr-FR')} FCFA`,
    `Montant Payé : ${totalPaid.toLocaleString('fr-FR')} FCFA`,
    `Reste à Payer : ${remainingBalance.toLocaleString('fr-FR')} FCFA`,
    `----------------------------------------`,
    `Vérifié le : ${formattedDate}`,
    `Établissement : Collège Catholique Saint-Viateur`
  ].join('\n');

  // 6. URL d'image du QR Code (généré dynamiquement en haute résolution)
  const encodedData = encodeURIComponent(qrDataString);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}`;

  return {
    totalTuition,
    totalPaid,
    remainingBalance,
    isSolded,
    statusLabel,
    statusBadgeColor,
    qrDataString,
    qrImageUrl,
  };
};
