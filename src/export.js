import { sum, avg, fmt, fmtd, getMTD, currentMonthName, calcProcessingUtil } from './data.js';
import { toast } from './main.js';

export function exportExcel(records, filteredRecs) {
  const recs = filteredRecs || records;
  if (!recs.length) { toast('No records to export', 'e'); return; }

  const btn = document.getElementById('exportBtn');
  btn.innerHTML = '<i class="ti ti-loader-2 ti-spin"></i> <span>Generating…</span>';
  btn.disabled = true;

  if (typeof ExcelJS === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
    s.onload = () => setTimeout(() => buildExcel(recs, records, btn), 50);
    s.onerror = () => { fallbackExcel(recs, records); resetBtn(btn); };
    document.body.appendChild(s);
  } else {
    buildExcel(recs, records, btn);
  }
}

function resetBtn(btn) {
  btn.innerHTML = '<i class="ti ti-file-spreadsheet"></i> <span>Export</span>';
  btn.disabled = false;
}

const BRAND = 'Verka Ferozepur';
const ACCENT = 'FF1A56DB';
const ACCENT_LIGHT = 'FFE8EFFF';
const HEADER_BG = 'FF1F2937';
const ALT_ROW = 'FFF8FAFC';
const WHITE = 'FFFFFFFF';
const BORDER = 'FFE2E8F0';

function styleHeaderRow(row, bg = HEADER_BG) {
  row.height = 30;
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font = { bold: true, color: { argb: WHITE }, size: 10, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: BORDER } },
      bottom: { style: 'thin', color: { argb: BORDER } },
      left: { style: 'thin', color: { argb: BORDER } },
      right: { style: 'thin', color: { argb: BORDER } },
    };
  });
}

function styleDataCell(cell, isAlt, isFirst, isLast) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? ALT_ROW : WHITE } };
  cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF334155' } };
  cell.alignment = { vertical: 'middle', horizontal: isFirst ? 'left' : 'right', wrapText: false };
  cell.border = {
    bottom: { style: 'thin', color: { argb: BORDER } },
    left: { style: 'thin', color: { argb: BORDER } },
    right: { style: 'thin', color: { argb: BORDER } },
  };
}

function applyNumFmt(cell, colIdx, headerCount) {
  if (colIdx > headerCount) return;
  if (colIdx === 1) { cell.numFmt = 'dd-mmm-yyyy'; return; }
  if (colIdx === 2) return;
  if (colIdx <= 5) { cell.numFmt = '#,##0.00'; return; }
  cell.numFmt = '#,##0';
}

async function buildExcel(recs, allRecords, btn) {
  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = BRAND + ' Dashboard';
    wb.created = new Date();
    wb.modified = new Date();

    const mtd = getMTD(allRecords);
    const monthLabel = currentMonthName();

    /* ========== SHEET 1: COVER PAGE ========== */
    const cover = wb.addWorksheet('MTD Summary', {
      pageSetup: { orientation: 'portrait', fitToPage: true, margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 } },
    });

    cover.getColumn(1).width = 3;
    cover.getColumn(2).width = 36;
    cover.getColumn(3).width = 20;
    cover.getColumn(4).width = 20;
    cover.getColumn(5).width = 20;
    cover.getColumn(6).width = 3;

    const merge = (r1, c1, r2, c2) => cover.mergeCells(r1, c1, r2, c2);
    const write = (r, c, val, opts = {}) => {
      const cell = cover.getCell(r, c);
      cell.value = val;
      if (opts.font) cell.font = opts.font;
      if (opts.fill) cell.fill = opts.fill;
      if (opts.alignment) cell.alignment = opts.alignment;
      if (opts.border) cell.border = opts.border;
      if (opts.numFmt) cell.numFmt = opts.numFmt;
      return cell;
    };

    const titleFont = { bold: true, size: 18, color: { argb: ACCENT }, name: 'Calibri' };
    const subtitleFont = { size: 11, color: { argb: 'FF64748B' }, name: 'Calibri' };
    const sectionFont = { bold: true, size: 12, color: { argb: WHITE }, name: 'Calibri' };
    const kpiLabel = { bold: true, size: 10, color: { argb: 'FF475569' }, name: 'Calibri' };
    const kpiValue = { bold: true, size: 13, color: { argb: 'FF1E293B' }, name: 'Calibri' };
    const kpiSub = { size: 9, color: { argb: 'FF94A3B8' }, name: 'Calibri' };

    const deptColors = {
      Marketing: 'FF3B82F6',
      Procurement: 'FF10B981',
      Processing: 'FFF59E0B',
      VAP: 'FF8B5CF6',
    };

    merge(2, 2, 2, 5);
    write(2, 2, BRAND, { font: titleFont, alignment: { horizontal: 'center' } });
    merge(3, 2, 3, 5);
    write(3, 2, 'Daily Operations Report', { font: { bold: true, size: 13, color: { argb: 'FF334155' }, name: 'Calibri' }, alignment: { horizontal: 'center' } });
    merge(4, 2, 4, 5);
    write(4, 2, monthLabel, { font: subtitleFont, alignment: { horizontal: 'center' } });
    write(5, 2, `Records: ${mtd.length} day(s)  |  Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, {
      font: { size: 9, color: { argb: 'FF94A3B8' }, name: 'Calibri' }, alignment: { horizontal: 'center' }
    });

    let row = 7;

    // ── Marketing ──
    merge(row, 2, row, 5);
    write(row, 2, 'MARKETING', { font: sectionFont, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: deptColors.Marketing } }, alignment: { horizontal: 'center' } });
    row++;
    const mkLabels = ['MTD Sale Value (₹L)', 'MTD Volume (KL)', 'Avg Routes/Day', 'Institutional Sale (₹L)', 'Exports (₹L)', 'Avg Realization (₹/L)'];
    const mkVals = [sum(mtd, 'total_sale_value'), sum(mtd, 'total_sale_volume'), avg(mtd, 'routes'), sum(mtd, 'institution_sale'), sum(mtd, 'exports_sale'), avg(mtd, 'avg_realization')];
    for (let i = 0; i < mkLabels.length; i += 2) {
      write(row, 2, mkLabels[i], { font: kpiLabel, alignment: { vertical: 'bottom' } });
      write(row, 3, mkVals[i] || 0, { font: kpiValue, numFmt: '#,##0' });
      if (mkLabels[i + 1]) {
        write(row, 4, mkLabels[i + 1], { font: kpiLabel, alignment: { vertical: 'bottom' } });
        write(row, 5, mkVals[i + 1] || 0, { font: kpiValue, numFmt: '#,##0.00' });
      }
      row++;
    }

    // ── Procurement ──
    row++;
    merge(row, 2, row, 5);
    write(row, 2, 'MILK PROCUREMENT', { font: sectionFont, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: deptColors.Procurement } }, alignment: { horizontal: 'center' } });
    row++;
    const prLabels = ['Milk Received (Lakh L)', 'Avg Fat %', 'Avg SNF %', 'Own Societies', 'Direct / Market', 'Avg Proc Rate (₹/Kg)'];
    const prVals = [sum(mtd, 'milk_received') / 100000, avg(mtd, 'fat_pct'), avg(mtd, 'snf_pct'), sum(mtd, 'milk_own_societies'), sum(mtd, 'milk_direct_market'), avg(mtd, 'proc_rate')];
    for (let i = 0; i < prLabels.length; i += 2) {
      write(row, 2, prLabels[i], { font: kpiLabel, alignment: { vertical: 'bottom' } });
      write(row, 3, typeof prVals[i] === 'number' ? prVals[i] : 0, { font: kpiValue, numFmt: i === 0 ? '#,##0.00' : '#,##0' });
      if (prLabels[i + 1]) {
        write(row, 4, prLabels[i + 1], { font: kpiLabel, alignment: { vertical: 'bottom' } });
        write(row, 5, typeof prVals[i + 1] === 'number' ? prVals[i + 1] : 0, { font: kpiValue, numFmt: '#,##0.00' });
      }
      row++;
    }

    // ── Processing ──
    row++;
    merge(row, 2, row, 5);
    write(row, 2, 'PROCESSING CAPACITY', { font: sectionFont, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: deptColors.Processing } }, alignment: { horizontal: 'center' } });
    row++;
    const psLabels = ['Milk Processed (Lakh L)', 'Processing Cap (Lakh L)', 'City Supply (Lakh L)', 'City Supply Cap (Lakh L)', 'Avg Utilisation %', ''];
    const psVals = [sum(mtd, 'milk_processed') / 100000, sum(mtd, 'proc_capacity') / 100000, sum(mtd, 'city_supply') / 100000, sum(mtd, 'city_supply_cap') / 100000, mtd.length ? Math.round(sum(mtd, 'city_supply') / sum(mtd, 'city_supply_cap') * 100) : 0, ''];
    for (let i = 0; i < psLabels.length; i += 2) {
      write(row, 2, psLabels[i], { font: kpiLabel, alignment: { vertical: 'bottom' } });
      write(row, 3, typeof psVals[i] === 'number' ? psVals[i] : 0, { font: kpiValue, numFmt: '#,##0.00' });
      if (psLabels[i + 1]) {
        write(row, 4, psLabels[i + 1], { font: kpiLabel, alignment: { vertical: 'bottom' } });
        write(row, 5, typeof psVals[i + 1] === 'number' ? psVals[i + 1] : 0, { font: kpiValue, numFmt: '#,##0' });
      }
      row++;
    }

    // ── VAP ──
    row++;
    merge(row, 2, row, 5);
    write(row, 2, 'VAP MANUFACTURING', { font: sectionFont, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: deptColors.VAP } }, alignment: { horizontal: 'center' } });
    row++;
    const vapLabels = ['Dahi (kg)', 'Lassi (L)', 'Paneer (kg)', 'Ghee (kg)', 'Milk Powder (kg)', 'Ice Cream (L)'];
    const vapLabels2 = ['Kheer (kg)', 'Rabri (kg)', 'Kaju Badam (kg)', 'Sweets (kg)', 'Table Butter (kg)', 'Cheese (kg)'];
    const vapVals = [sum(mtd, 'dahi_sale'), sum(mtd, 'lassi_sale'), sum(mtd, 'paneer_sale'), sum(mtd, 'ghee_prod'), sum(mtd, 'milk_powder'), sum(mtd, 'ice_cream')];
    const vapVals2 = [sum(mtd, 'kheer_sale'), sum(mtd, 'rabri_sale'), sum(mtd, 'kaju_badam'), sum(mtd, 'sweets'), sum(mtd, 'table_butter'), sum(mtd, 'cheese')];
    for (let i = 0; i < vapLabels.length; i += 2) {
      write(row, 2, vapLabels[i], { font: kpiLabel, alignment: { vertical: 'bottom' } });
      write(row, 3, vapVals[i] || 0, { font: kpiValue, numFmt: '#,##0' });
      if (vapLabels[i + 1]) {
        write(row, 4, vapLabels[i + 1], { font: kpiLabel, alignment: { vertical: 'bottom' } });
        write(row, 5, vapVals[i + 1] || 0, { font: kpiValue, numFmt: '#,##0' });
      }
      row++;
    }
    for (let i = 0; i < vapLabels2.length; i += 2) {
      write(row, 2, vapLabels2[i], { font: kpiLabel, alignment: { vertical: 'bottom' } });
      write(row, 3, vapVals2[i] || 0, { font: kpiValue, numFmt: '#,##0' });
      if (vapLabels2[i + 1]) {
        write(row, 4, vapLabels2[i + 1], { font: kpiLabel, alignment: { vertical: 'bottom' } });
        write(row, 5, vapVals2[i + 1] || 0, { font: kpiValue, numFmt: '#,##0' });
      }
      row++;
    }

    row += 2;
    merge(row, 2, row, 5);
    write(row, 2, `Report generated from ${BRAND} Dashboard`, {
      font: { size: 9, color: { argb: 'FF94A3B8' }, name: 'Calibri', italic: true },
      alignment: { horizontal: 'center' }
    });

    /* ========== SHEET 2: DAILY RECORDS ========== */
    const ws = wb.addWorksheet('Daily Records', {
      views: [{ state: 'frozen', ySplit: 2 }],
      pageSetup: { orientation: 'landscape', fitToW: 1, margins: { top: 0.4, bottom: 0.4, left: 0.3, right: 0.3 } },
    });

    // Row 1: merged section headers
    const sections = [
      { label: 'MARKETING', start: 3, end: 8 },
      { label: 'PROCUREMENT', start: 9, end: 14 },
      { label: 'PROCESSING', start: 15, end: 18 },
      { label: 'VAP MANUFACTURING', start: 19, end: 30 },
    ];

    const allHeaders = [
      'Date', 'Routes',
      'Sale Value\n(₹L)', 'Sale Vol\n(KL)', 'Inst. Sale\n(₹L)', 'Exports\n(₹L)', 'Avg Real.\n(₹/L)',
      'Milk Recv\n(L)', 'Fat\n%', 'SNF\n%', 'Own\nSoc.', 'Direct /\nMarket', 'Proc Rate\n(₹/Kg)',
      'Milk Proc\n(L)', 'Proc Cap\n(L)', 'City Supply\n(L)', 'City Cap\n(L)',
      'Dahi\n(kg)', 'Lassi\n(L)', 'Paneer\n(kg)', 'Ghee\n(kg)', 'M. Powder\n(kg)', 'Ice Cream\n(L)',
      'Kheer\n(kg)', 'Rabri\n(kg)', 'K. Badam\n(kg)', 'Sweets\n(kg)', 'Butter\n(kg)', 'Cheese\n(kg)',
    ];

    const sectionBg = {
      MARKETING: 'FF3B82F6',
      PROCUREMENT: 'FF10B981',
      PROCESSING: 'FFF59E0B',
      'VAP MANUFACTURING': 'FF8B5CF6',
    };

    // Row 1: merge section headers
    sections.forEach(sec => {
      const cell = ws.getCell(1, sec.start);
      cell.value = sec.label;
      cell.font = { bold: true, size: 10, color: { argb: WHITE }, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg[sec.label] } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (sec.end > sec.start) ws.mergeCells(1, sec.start, 1, sec.end);
      for (let c = sec.start; c <= sec.end; c++) {
        const cl = ws.getCell(1, c);
        cl.border = {
          top: { style: 'thin', color: { argb: BORDER } },
          bottom: { style: 'thin', color: { argb: BORDER } },
          left: { style: 'thin', color: { argb: BORDER } },
          right: { style: 'thin', color: { argb: BORDER } },
        };
      }
    });
    ws.getRow(1).height = 24;

    // Row 2: column headers
    const hRow = ws.addRow(allHeaders.map(h => h.replace(/\n/g, ' ')));
    hRow.height = 50;
    hRow.eachCell((cell, col) => {
      let bg = HEADER_BG;
      sections.forEach(sec => { if (col >= sec.start && col <= sec.end) bg = sectionBg[sec.label]; });
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.font = { bold: true, color: { argb: WHITE }, size: 9, name: 'Calibri' };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER } },
        bottom: { style: 'thin', color: { argb: BORDER } },
        left: { style: 'thin', color: { argb: BORDER } },
        right: { style: 'thin', color: { argb: BORDER } },
      };
    });

    // Data rows
    const fieldMap = [
      'date', 'routes',
      'total_sale_value', 'total_sale_volume', 'institution_sale', 'exports_sale', 'avg_realization',
      'milk_received', 'fat_pct', 'snf_pct', 'milk_own_societies', 'milk_direct_market', 'proc_rate',
      'milk_processed', 'proc_capacity', 'city_supply', 'city_supply_cap',
      'dahi_sale', 'lassi_sale', 'paneer_sale', 'ghee_prod', 'milk_powder', 'ice_cream',
      'kheer_sale', 'rabri_sale', 'kaju_badam', 'sweets', 'table_butter', 'cheese',
    ];

    recs.forEach((r, i) => {
      const row = ws.addRow(fieldMap.map(f => r[f] ?? 0));
      const isAlt = i % 2 === 0;
      row.eachCell((cell, col) => {
        styleDataCell(cell, !isAlt, col === 1, col === allHeaders.length);
        applyNumFmt(cell, col, allHeaders.length);
      });
      row.height = 20;
    });

    // Column widths
    const colWidths = [12, 7, 11, 10, 11, 10, 10, 11, 6, 6, 8, 8, 10, 11, 11, 11, 11, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9];
    ws.columns = colWidths.map((w, i) => ({ key: 'c' + i, width: w }));

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `Verka_Ferozepur_${dateStr}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Excel downloaded — professional format!', 's');
  } catch (err) {
    console.error(err);
    toast('Switching to fallback export…', 'w');
    fallbackExcel(recs, allRecords);
  }
  resetBtn(btn);
}

function fallbackExcel(recs, allRecords) {
  const headers = [
    'Date', 'Routes', 'Sale Value (₹L)', 'Sale Vol (KL)', 'Inst Sale', 'Exports', 'Avg Real',
    'Milk Recv', 'Fat%', 'SNF%', 'Own Soc', 'Direct', 'Rate',
    'Milk Proc', 'Cap', 'City Supply', 'City Cap',
    'Dahi', 'Lassi', 'Paneer', 'Ghee', 'M.Powder', 'IceCr', 'Kheer', 'Rabri', 'Kaju', 'Sweets', 'Butter', 'Cheese'
  ];
  const rows = recs.map(r => [
    r.date, r.routes, r.total_sale_value, r.total_sale_volume, r.institution_sale, r.exports_sale, r.avg_realization,
    r.milk_received, r.fat_pct, r.snf_pct, r.milk_own_societies, r.milk_direct_market, r.proc_rate,
    r.milk_processed, r.proc_capacity, r.city_supply, r.city_supply_cap,
    r.dahi_sale, r.lassi_sale, r.paneer_sale, r.ghee_prod, r.milk_powder, r.ice_cream,
    r.kheer_sale, r.rabri_sale, r.kaju_badam, r.sweets, r.table_butter, r.cheese
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 14 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Records');

  const mtd = getMTD(allRecords);
  const monthLabel = currentMonthName();
  const summHeaders = ['Metric', 'Value'];
  const summData = [
    ['Month', monthLabel],
    ['', ''],
    ['MARKETING', ''],
    ['MTD Sale Value (₹L)', sum(mtd, 'total_sale_value')],
    ['MTD Volume (KL)', sum(mtd, 'total_sale_volume')],
    ['Avg Routes/Day', avg(mtd, 'routes')],
    ['', ''],
    ['MILK PROCUREMENT', ''],
    ['MTD Milk Received (L)', sum(mtd, 'milk_received')],
    ['Avg Fat %', avg(mtd, 'fat_pct')],
    ['Avg SNF %', avg(mtd, 'snf_pct')],
    ['', ''],
    ['PROCESSING', ''],
    ['Milk Processed (L)', sum(mtd, 'milk_processed')],
    ['Avg Utilisation %', mtd.length ? Math.round(avg(mtd, 'milk_processed') / avg(mtd, 'proc_capacity') * 100) : 0],
    ['', ''],
    ['VAP MANUFACTURING', ''],
    ['Dahi (kg)', sum(mtd, 'dahi_sale')],
    ['Lassi (L)', sum(mtd, 'lassi_sale')],
    ['Paneer (kg)', sum(mtd, 'paneer_sale')],
    ['', ''],
    ['Days Recorded', mtd.length],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet([summHeaders, ...summData]);
  ws2['!cols'] = [{ wch: 30 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'MTD Summary');

  XLSX.writeFile(wb, `Verka_Ferozepur_${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast('Excel downloaded', 's');
}
