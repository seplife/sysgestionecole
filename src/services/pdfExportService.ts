import { Payslip, PayslipItem, School } from '../types';
import { formatFCFA } from '../utils/payrollCalculations';

export const pdfExportService = {
  /**
   * Ouvre une fenêtre d'impression / sauvegarde PDF du bulletin de salaire officiel A4
   */
  printPayslip(payslip: Payslip, school: School) {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Veuillez autoriser les fenêtres surgissantes (popups) pour imprimer le bulletin.');
      return;
    }

    const gains = payslip.items?.filter((i: PayslipItem) => i.category === 'gain') || [];
    const retenues = payslip.items?.filter((i: PayslipItem) => i.category === 'retenue') || [];

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bulletin de Salaire - ${payslip.payslip_number}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 0; }
          .container { width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 20px; box-sizing: border-box; }
          .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
          .school-info h1 { font-size: 16px; margin: 0 0 4px 0; color: #0f172a; text-transform: uppercase; font-weight: 800; }
          .school-info p { margin: 2px 0; color: #475569; font-size: 10px; }
          .bulletin-title { text-align: right; }
          .bulletin-title h2 { font-size: 18px; color: #ea580c; margin: 0; font-weight: 900; text-transform: uppercase; }
          .bulletin-title p { margin: 3px 0 0 0; font-family: monospace; font-size: 11px; font-weight: bold; }
          
          .employee-card { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
          .col { width: 48%; }
          .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .label { font-weight: bold; color: #64748b; font-size: 10px; uppercase; }
          .val { font-weight: bold; color: #0f172a; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; font-size: 11px; }
          tr:nth-child(even) { background: #f8fafc; }
          .text-right { text-align: right; }
          .font-mono { font-family: monospace; font-weight: bold; }

          .totals-summary { display: flex; justify-content: flex-end; margin-bottom: 20px; }
          .totals-table { width: 320px; border: 2px solid #0f172a; border-radius: 6px; overflow: hidden; }
          .totals-table div { display: flex; justify-content: space-between; padding: 6px 12px; font-size: 11px; }
          .totals-table .net-row { background: #ea580c; color: #ffffff; font-size: 14px; font-weight: 900; }

          .footer-note { text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 20px; }
          @media print { body { padding: 0; } .container { border: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header Établissement -->
          <div class="header">
            <div class="school-info">
              <h1>${school.name || 'ÉTABLISSEMENT SCOLAIRE'}</h1>
              <p>${school.address || 'Abidjan, Côte d\'Ivoire'} | Tél: ${school.phone || '+225 27 22 00 00 00'}</p>
              <p>Email: ${school.email || 'contact@ecole.ci'} | N° Agrément MENA: ${school.registration_number || '000730/MENA'}</p>
            </div>
            <div class="bulletin-title">
              <h2>BULLETIN DE SALAIRE</h2>
              <p>N° ${payslip.payslip_number}</p>
              <p style="color: #64748b; font-size: 10px;">Période: ${payslip.payroll_period_id}</p>
            </div>
          </div>

          <!-- Carte Employé -->
          <div class="employee-card">
            <div class="col">
              <div class="row"><span class="label">Matricule:</span> <span class="val font-mono">${payslip.employee_number}</span></div>
              <div class="row"><span class="label">Nom & Prénom:</span> <span class="val">${payslip.employee_name}</span></div>
              <div class="row"><span class="label">Fonction / Poste:</span> <span class="val">${payslip.position_title}</span></div>
              <div class="row"><span class="label">Département:</span> <span class="val">${payslip.department_name}</span></div>
            </div>
            <div class="col">
              <div class="row"><span class="label">Date d'embauche:</span> <span class="val">${payslip.hire_date || '-'}</span></div>
              <div class="row"><span class="label">Type de Contrat:</span> <span class="val">${payslip.contract_type || 'CDI'}</span></div>
              <div class="row"><span class="label">N° Sécurité Sociale CNPS:</span> <span class="val font-mono">${payslip.cnps_number || '-'}</span></div>
              <div class="row"><span class="label">Mode de Règlement:</span> <span class="val">${payslip.payment_method}</span></div>
            </div>
          </div>

          <!-- Tableau Détail de la Paie -->
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Libellé des Éléments de Paie</th>
                <th class="text-right">Base</th>
                <th class="text-right">Taux / Qte</th>
                <th class="text-right">Gains (FCFA)</th>
                <th class="text-right">Retenues (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              ${gains.map((g: PayslipItem) => `
                <tr>
                  <td class="font-mono">${g.component_code}</td>
                  <td style="font-weight: 600;">${g.label}</td>
                  <td class="text-right font-mono">${formatFCFA(g.base_amount || 0)}</td>
                  <td class="text-right">${g.quantity || 1}</td>
                  <td class="text-right font-mono" style="color: #16a34a; font-weight: bold;">${formatFCFA(g.total_amount)}</td>
                  <td class="text-right font-mono">-</td>
                </tr>
              `).join('')}
              
              ${retenues.map((r: PayslipItem) => `
                <tr>
                  <td class="font-mono">${r.component_code}</td>
                  <td style="font-weight: 600; color: #dc2626;">${r.label}</td>
                  <td class="text-right font-mono">${formatFCFA(r.base_amount || 0)}</td>
                  <td class="text-right">${r.rate ? `${(r.rate * 100).toFixed(1)}%` : r.quantity || 1}</td>
                  <td class="text-right font-mono">-</td>
                  <td class="text-right font-mono" style="color: #dc2626; font-weight: bold;">${formatFCFA(r.total_amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Récapitulatif et Salaire Net -->
          <div class="totals-summary">
            <div class="totals-table">
              <div style="border-bottom: 1px solid #cbd5e1;"><span>Salaire Brut Global:</span> <span class="font-mono">${formatFCFA(payslip.gross_salary)}</span></div>
              <div style="border-bottom: 1px solid #cbd5e1;"><span>Total des Retenues:</span> <span class="font-mono" style="color: #dc2626;">- ${formatFCFA(payslip.total_deductions)}</span></div>
              <div class="net-row"><span>NET À PAYER:</span> <span class="font-mono">${formatFCFA(payslip.net_salary)}</span></div>
            </div>
          </div>

          <div class="footer-note">
            <p>Ce bulletin de salaire est généré automatiquement par l'application SaaS **IvoireEcole+**. Document officiel d'établissement scolaire conforme aux normes de la République de Côte d'Ivoire.</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
