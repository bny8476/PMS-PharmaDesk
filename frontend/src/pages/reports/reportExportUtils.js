import { toast } from 'react-hot-toast';
import { today, fmtDate } from './reportCatalog';

/**
 * Exports report data to a PDF file with letterhead and auto-table.
 * Uses dynamic imports (jspdf + jspdf-autotable) to keep initial bundle small.
 */
export async function doExportPDF(report, data, filters) {
  const { jsPDF }  = await import('jspdf');
  const autoTable  = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ orientation: data.length > 100 ? 'l' : 'p', unit: 'mm' });

  // Letterhead
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('PharmaCare Hospital Pharmacy', 14, 16);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
  doc.text('Drug License: DL-MH-123456  |  GSTIN: 27AAAAA0000A1Z5  |  Tel: +91 22 1234 5678', 14, 22);
  doc.setDrawColor(59, 130, 246); doc.setLineWidth(0.5);
  doc.line(14, 25, doc.internal.pageSize.width - 14, 25);

  // Title
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
  doc.text(report.name, 14, 33);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
  doc.text(`Filters: ${filters}    |    Generated: ${new Date().toLocaleString('en-IN')}`, 14, 39);

  // Table
  autoTable(doc, {
    head: [report.headers],
    body: data.map(row => report.columns.map(col => {
      const val = row[col];
      if (val == null) return '—';
      if (typeof val === 'number') return val.toFixed ? val.toFixed(2) : String(val);
      if (typeof val === 'string' && val.includes('T')) {
        try { return fmtDate(val); } catch { return val; }
      }
      return String(val);
    })),
    startY: 44,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { fontSize: 7, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    didDrawPage: (d) => {
      const pg = doc.internal.getNumberOfPages();
      doc.setFontSize(7); doc.setTextColor(150);
      doc.text(`Page ${d.pageNumber} of ${pg}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 8);
      doc.text('Authorised Signatory: ___________________', 14, doc.internal.pageSize.height - 8);
    }
  });

  doc.save(`${report.id}_${today}.pdf`);
  toast.success('PDF downloaded');
}

/**
 * Exports report data to an XLSX file with a Data sheet and Summary metadata sheet.
 * Uses dynamic import (xlsx) to keep initial bundle small.
 */
export async function doExportExcel(report, data) {
  const XLSX = await import('xlsx');
  const wb   = XLSX.utils.book_new();

  // Data sheet
  const dataRows = data.map(row => {
    const obj = {};
    report.headers.forEach((h, i) => { obj[h] = row[report.columns[i]] ?? ''; });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(dataRows);
  ws['!cols'] = report.headers.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Summary sheet
  const ws2 = XLSX.utils.aoa_to_sheet([
    ['Report',        report.name],
    ['Generated',     new Date().toLocaleString('en-IN')],
    ['Total Records', data.length],
    ['Pharmacy',      'PharmaCare Hospital Pharmacy'],
    ['GSTIN',         '27AAAAA0000A1Z5'],
  ]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

  XLSX.writeFile(wb, `${report.id}_${today}.xlsx`);
  toast.success('Excel downloaded');
}

export async function doExportCSV(report, data) {
  const { exportToCSV } = await import('../../utils/reportExport');
  await exportToCSV(report, data);
  toast.success('CSV downloaded');
}

export async function doExportImage(element, reportId) {
  const { exportToImage } = await import('../../utils/reportExport');
  await exportToImage(element, reportId);
  toast.success('Image downloaded');
}
