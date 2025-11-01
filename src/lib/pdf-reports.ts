import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate Chain of Custody PDF Report
 */
export const generateCustodyReport = async (
  bagData: any,
  custodyLog: any[],
  photos: any[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Chain of Custody Report', pageWidth / 2, 20, { align: 'center' });
  
  // Evidence Bag Information
  doc.setFontSize(14);
  doc.text('Evidence Information', 14, 35);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const bagInfo = [
    ['Bag ID:', bagData.bag_id],
    ['Type:', bagData.type.replace('_', ' ').toUpperCase()],
    ['Description:', bagData.description],
    ['Location:', bagData.location],
    ['Status:', bagData.current_status.replace('_', ' ').toUpperCase()],
    ['Collected:', new Date(bagData.date_collected).toLocaleString()],
    ['GPS Coordinates:', bagData.latitude && bagData.longitude 
      ? `${bagData.latitude.toFixed(6)}, ${bagData.longitude.toFixed(6)}` 
      : 'Not available'],
  ];

  autoTable(doc, {
    startY: 40,
    body: bagInfo,
    theme: 'plain',
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    }
  });

  // Chain of Custody Timeline
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Chain of Custody Timeline', 14, finalY);
  
  const custodyData = custodyLog.map(entry => [
    new Date(entry.timestamp).toLocaleString(),
    entry.action.replace('_', ' ').toUpperCase(),
    entry.profiles?.full_name || 'Unknown',
    entry.location || 'N/A',
    entry.notes || ''
  ]);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Date/Time', 'Action', 'Officer', 'Location', 'Notes']],
    body: custodyData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
      4: { cellWidth: 'auto' }
    }
  });

  // Photos Summary
  if (photos.length > 0) {
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Evidence Photos', 14, finalY);
    
    const photoData = photos.map(photo => [
      new Date(photo.uploaded_at).toLocaleString(),
      photo.profiles?.full_name || 'Unknown',
      photo.notes || 'No notes'
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Upload Date', 'Uploaded By', 'Notes']],
      body: photoData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${bagData.bag_id}_Custody_Report.pdf`);
};

/**
 * Generate Case Summary PDF Report
 */
export const generateCaseReport = async (
  caseData: any,
  evidence: any[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Case Summary Report', pageWidth / 2, 20, { align: 'center' });
  
  // Case Information
  doc.setFontSize(14);
  doc.text('Case Information', 14, 35);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const caseInfo = [
    ['Case Number:', caseData.case_number],
    ['Offense Type:', caseData.offense_type],
    ['Status:', caseData.status.replace('_', ' ').toUpperCase()],
    ['Location:', caseData.location],
    ['Lead Officer:', caseData.profiles?.full_name || 'Unknown'],
    ['Office:', caseData.offices ? `${caseData.offices.name} - ${caseData.offices.city}` : 'N/A'],
    ['Created:', new Date(caseData.created_at).toLocaleString()],
    ['Last Updated:', new Date(caseData.updated_at).toLocaleString()],
  ];

  if (caseData.description) {
    caseInfo.push(['Description:', caseData.description]);
  }

  autoTable(doc, {
    startY: 40,
    body: caseInfo,
    theme: 'plain',
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    }
  });

  // Linked Evidence
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Linked Evidence (${evidence.length})`, 14, finalY);
  
  if (evidence.length > 0) {
    const evidenceData = evidence.map(item => [
      item.evidence_bags.bag_id,
      item.evidence_bags.type.replace('_', ' ').toUpperCase(),
      item.evidence_bags.current_status.replace('_', ' ').toUpperCase(),
      item.evidence_bags.description.substring(0, 50) + (item.evidence_bags.description.length > 50 ? '...' : ''),
      new Date(item.linked_at).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Bag ID', 'Type', 'Status', 'Description', 'Linked Date']],
      body: evidenceData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 60 },
        4: { cellWidth: 25 }
      }
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${caseData.case_number}_Report.pdf`);
};

/**
 * Generate Audit Log PDF Report
 */
export const generateAuditReport = async (
  auditLogs: any[],
  filters?: { startDate?: string; endDate?: string }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Audit Log Report', pageWidth / 2, 20, { align: 'center' });
  
  // Report Period
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const reportPeriod = filters?.startDate && filters?.endDate
    ? `Period: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`
    : `Generated: ${new Date().toLocaleString()}`;
  doc.text(reportPeriod, pageWidth / 2, 30, { align: 'center' });
  
  // Audit Logs
  const auditData = auditLogs.map(log => [
    new Date(log.created_at).toLocaleString(),
    log.action,
    log.entity_type,
    log.profiles?.full_name || 'System',
    log.details ? JSON.stringify(log.details).substring(0, 50) : 'N/A'
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Date/Time', 'Action', 'Entity Type', 'User', 'Details']],
    body: auditData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 'auto' }
    }
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, finalY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Events: ${auditLogs.length}`, 14, finalY + 7);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};