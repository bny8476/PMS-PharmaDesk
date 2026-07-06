/**
 * reportExport.js
 * Shared PDF and Excel export utilities for all pharmacy reports.
 * Uses jsPDF + jspdf-autotable for PDF and SheetJS (xlsx) for Excel.
 */

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return `${String(dt.getDate()).padStart(2,'0')}-${String(dt.getMonth()+1).padStart(2,'0')}-${dt.getFullYear()}`;
};

const today = new Date().toISOString().split('T')[0];

/**
 * Export a report to a professional PDF with pharmacy letterhead.
 * @param {object} report  – { id, name, headers, columns }
 * @param {Array}  data    – array of row objects
 * @param {string} filters – human-readable filter description
 * @param {object} pharmacyInfo – optional override for letterhead info
 */
export async function exportToPDF(report, data, filters = '', pharmacyInfo = {}) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const orientation = (report.columns?.length || 0) > 8 ? 'l' : 'p';
  const doc = new jsPDF({ orientation, unit: 'mm' });
  const pageW = doc.internal.pageSize.width;

  const info = {
    name:    pharmacyInfo.name    || 'PharmaCare Hospital Pharmacy',
    address: pharmacyInfo.address || '123, Medical Complex, Chennai – 600 001',
    dl:      pharmacyInfo.dl      || 'DL No: MH-12345',
    gstin:   pharmacyInfo.gstin   || 'GSTIN: 33AAAAA0000A1Z5',
    tel:     pharmacyInfo.tel     || 'Tel: +91 44 1234 5678',
  };

  // ── Letterhead ──────────────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235); doc.rect(0, 0, pageW, 10, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
  doc.text(info.name, 14, 7);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(80);
  doc.text(`${info.address}   |   ${info.dl}   |   ${info.gstin}   |   ${info.tel}`, 14, 16);

  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
  doc.line(14, 18, pageW - 14, 18);

  // ── Report Title ─────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 41, 59);
  doc.text(report.name || 'Report', 14, 26);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
  doc.text(`Filters: ${filters || 'None'}`, 14, 32);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageW - 14, 32, { align: 'right' });

  // ── Table ─────────────────────────────────────────────────────────────────
  const tableBody = (data || []).map(row =>
    (report.columns || []).map(col => {
      const val = row[col];
      if (val == null) return '—';
      if (typeof val === 'number') return val.toFixed(2);
      if (typeof val === 'string' && /\d{4}-\d{2}-\d{2}T/.test(val)) return fmtDate(val);
      return String(val);
    })
  );

  autoTable(doc, {
    head: [report.headers || []],
    body: tableBody,
    startY: 36,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], textColor: [255, 255, 255],
      fontStyle: 'bold', fontSize: 7, cellPadding: 2.5,
    },
    bodyStyles: { fontSize: 6.5, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    didDrawPage: (d) => {
      const totalPages = doc.internal.getNumberOfPages();
      const yFoot = doc.internal.pageSize.height - 8;
      doc.setFontSize(7); doc.setTextColor(148, 163, 184);
      doc.text(`Page ${d.pageNumber} of ${totalPages}`, pageW - 14, yFoot, { align: 'right' });
      doc.text(`${info.name}   |   Confidential`, 14, yFoot);
      if (d.pageNumber === totalPages) {
        doc.setFontSize(7.5); doc.setTextColor(30, 41, 59);
        doc.text('Authorised Signatory: ________________________________', 14, yFoot - 8);
        doc.text('(Pharmacist / Manager)', 14, yFoot - 3);
      }
    }
  });

  // ── Totals footer row ────────────────────────────────────────────────────
  // (autoTable handles it inside via foot if needed — keep external for now)

  doc.save(`${(report.id || 'report')}_${today}.pdf`);
}


/**
 * Export a report to a pivot-ready Excel workbook with a Summary sheet.
 * @param {object} report
 * @param {Array}  data
 * @param {object} summaryData – optional summary key-value pairs for Summary sheet
 */
export async function exportToExcel(report, data, summaryData = {}) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // ── Data Sheet ───────────────────────────────────────────────────────────
  const headers = report.headers || [];
  const cols    = report.columns || [];

  const dataRows = (data || []).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[cols[i]];
      // Format dates as DD-MM-YYYY strings for Excel
      if (typeof val === 'string' && /\d{4}-\d{2}-\d{2}T/.test(val)) val = fmtDate(val);
      obj[h] = val ?? '';
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(dataRows);

  // Auto-fit column widths
  ws['!cols'] = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...dataRows.map(row => String(row[h] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // ── Summary Sheet ─────────────────────────────────────────────────────────
  const numericCols = cols.filter(col => data.length > 0 && typeof data[0][col] === 'number');
  const autoSummary = numericCols.map(col => [
    `Total ${headers[cols.indexOf(col)] || col}`,
    data.reduce((s, r) => s + (Number(r[col]) || 0), 0).toFixed(2)
  ]);

  const summaryRows = [
    ['PharmaCare Hospital Pharmacy', ''],
    ['Report', report.name || ''],
    ['Generated', new Date().toLocaleString('en-IN')],
    ['Total Records', data.length],
    ['', ''],
    ['KEY METRICS', ''],
    ...autoSummary,
    ...Object.entries(summaryData),
    ['', ''],
    ['GSTIN', '33AAAAA0000A1Z5'],
    ['Drug License', 'MH-12345'],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws2['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

  XLSX.writeFile(wb, `${(report.id || 'report')}_${today}.xlsx`);
}

/**
 * Export a report to a CSV file.
 * @param {object} report
 * @param {Array}  data
 */
export async function exportToCSV(report, data) {
  const headers = report.headers || [];
  const cols = report.columns || [];

  const csvRows = [];
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  (data || []).forEach(row => {
    const values = cols.map(col => {
      let val = row[col];
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) val = fmtDate(val);
      val = val ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${report.id || 'report'}_${today}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export a DOM element (like a chart or table container) to a JPG image.
 * @param {HTMLElement} element 
 * @param {string} fileName 
 */
export async function exportToImage(element, fileName = 'report_image') {
  if (!element) return;
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
  const dataURL = canvas.toDataURL('image/jpeg', 0.9);
  
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = `${fileName}_${today}.jpg`;
  link.click();
}
