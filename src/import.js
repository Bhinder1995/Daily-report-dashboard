import { validateRecord, fmt, fmtd } from './data.js';
import { toast } from './main.js';

let importData = null;

export function initImport(onConfirm) {
  const uploadArea = document.getElementById('uploadArea');
  const fileIn = document.getElementById('fileIn');

  uploadArea.addEventListener('click', () => fileIn.click());
  fileIn.addEventListener('change', e => handleImport(e.target.files[0], onConfirm));

  ['dragenter','dragover'].forEach(evt =>
    uploadArea.addEventListener(evt, e => { e.preventDefault(); uploadArea.classList.add('drag-over'); })
  );
  ['dragleave','drop'].forEach(evt =>
    uploadArea.addEventListener(evt, e => { e.preventDefault(); uploadArea.classList.remove('drag-over'); })
  );
  uploadArea.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) handleImport(file, onConfirm);
  });

  document.getElementById('closeImportModal').addEventListener('click', closeModal);
  document.getElementById('cancelImportBtn').addEventListener('click', closeModal);
  document.getElementById('importConfirmBtn').addEventListener('click', () => {
    if (importData) onConfirm(importData);
    closeModal();
  });
  document.getElementById('importModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}

function closeModal() {
  document.getElementById('importModal').classList.remove('show');
  importData = null;
}

const FIELD_MAP = {
  date: 'date', routes: 'routes',
  total_sale_value: 'total_sale_value', total_sale_volume: 'total_sale_volume',
  milk_sale: 'milk_sale', lassi_sale: 'lassi_sale', dahi_sale: 'dahi_sale',
  paneer_sale: 'paneer_sale', kheer_sale: 'kheer_sale', rabri_sale: 'rabri_sale',
  institution_sale: 'institution_sale', exports_sale: 'exports_sale',
  avg_realization: 'avg_realization',
  milk_received: 'milk_received', fat_pct: 'fat_pct', snf_pct: 'snf_pct',
  milk_own_societies: 'milk_own_societies', milk_direct_market: 'milk_direct_market',
  proc_rate: 'proc_rate',
  milk_processed: 'milk_processed', proc_capacity: 'proc_capacity',
  city_supply: 'city_supply', city_supply_cap: 'city_supply_cap',
  dahi_prod: 'dahi_sale', lassi_prod: 'lassi_sale', paneer_prod: 'paneer_sale',
  ghee_prod: 'ghee_prod', milk_powder: 'milk_powder', ice_cream: 'ice_cream',
  kheer_prod: 'kheer_sale', rabri_prod: 'rabri_sale',
  kaju_badam: 'kaju_badam', sweets: 'sweets',
  table_butter: 'table_butter', cheese: 'cheese'
};

function normalizeRow(r) {
  const nr = {};
  Object.keys(r).forEach(k => {
    const key = k.trim().toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
    nr[key] = r[k];
  });
  const rec = {};
  Object.keys(FIELD_MAP).forEach(k => {
    const val = nr[k] !== undefined ? nr[k] : nr[FIELD_MAP[k]];
    rec[FIELD_MAP[k]] = val !== undefined && val !== '' ? val : 0;
  });
  return rec;
}

function handleImport(file, onConfirm) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    let rows = [];
    try {
      if (file.name.match(/\.(csv|txt)$/i)) {
        const text = e.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) throw new Error('File has no data rows');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, '').replace(/ /g, '_'));
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          if (!vals[0]) continue;
          const row = {}; headers.forEach((h, j) => row[h] = vals[j] ?? '');
          if (row.date) rows.push(row);
        }
      } else {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      }
    } catch (err) {
      document.getElementById('importPreview').innerHTML =
        `<div style="margin-top:12px;padding:14px 18px;background:var(--red-bg);color:var(--red-text);border-radius:var(--radius);border:1px solid var(--red);font-size:13px"><i class="ti ti-alert-circle"></i> <strong>Error:</strong> ${err.message}</div>`;
      document.getElementById('fileIn').value = ''; return;
    }

    if (!rows.length) {
      document.getElementById('importPreview').innerHTML =
        '<p style="color:var(--red-text);margin-top:12px;font-size:13px">No valid rows found.</p>';
      document.getElementById('fileIn').value = ''; return;
    }

    const existingDates = new Set(window.__records?.map(r => r.date) || []);
    const validated = rows.map((r, idx) => {
      let dateStr = r.date || r.Date || '';
      if (typeof dateStr === 'number') {
        try { const d = new Date((dateStr - 25569) * 86400 * 1000); dateStr = d.toISOString().split('T')[0]; }
        catch { dateStr = String(dateStr); }
      } else { dateStr = String(dateStr).trim(); }

      const norm = normalizeRow(r);
      const rec = {
        date: dateStr,
        total_sale_value: parseFloat(norm.total_sale_value) || 0,
        total_sale_volume: parseFloat(norm.total_sale_volume) || 0,
        routes: parseInt(norm.routes) || 0,
        institution_sale: parseFloat(norm.institution_sale) || 0,
        exports_sale: parseFloat(norm.exports_sale) || 0,
        avg_realization: parseFloat(norm.avg_realization) || 0,
        milk_received: parseFloat(norm.milk_received) || 0,
        fat_pct: parseFloat(norm.fat_pct) || 0,
        snf_pct: parseFloat(norm.snf_pct) || 0,
        milk_own_societies: parseFloat(norm.milk_own_societies) || 0,
        milk_direct_market: parseFloat(norm.milk_direct_market) || 0,
        proc_rate: parseFloat(norm.proc_rate) || 0,
        milk_processed: parseFloat(norm.milk_processed) || 0,
        proc_capacity: parseFloat(norm.proc_capacity) || 0,
        city_supply: parseFloat(norm.city_supply) || 0,
        city_supply_cap: parseFloat(norm.city_supply_cap) || 0,
        dahi_sale: parseFloat(norm.dahi_sale) || 0,
        lassi_sale: parseFloat(norm.lassi_sale) || 0,
        paneer_sale: parseFloat(norm.paneer_sale) || 0,
        ghee_prod: parseFloat(norm.ghee_prod) || 0,
        milk_powder: parseFloat(norm.milk_powder) || 0,
        ice_cream: parseFloat(norm.ice_cream) || 0,
        kheer_sale: parseFloat(norm.kheer_sale) || 0,
        rabri_sale: parseFloat(norm.rabri_sale) || 0,
        kaju_badam: parseFloat(norm.kaju_badam) || 0,
        sweets: parseFloat(norm.sweets) || 0,
        table_butter: parseFloat(norm.table_butter) || 0,
        cheese: parseFloat(norm.cheese) || 0,
        gross_revenue: 0, proc_cost: 0, var_cost: 0, pack_cost: 0,
        power_cost: 0, man_cost: 0, overheads: 0
      };
      const errs = validateRecord({ ...rec, date: dateStr });
      const exists = existingDates.has(dateStr);
      return { idx: idx + 2, rec, errs, exists, dateStr };
    });

    importData = validated;
    showModal(validated, onConfirm);
    document.getElementById('fileIn').value = '';
  };
  reader.onerror = () => toast('Error reading file', 'e');
  if (file.name.match(/\.(xlsx|xls)$/i)) reader.readAsArrayBuffer(file);
  else reader.readAsText(file);
}

function showModal(data) {
  const total = data.length;
  const newRecs = data.filter(d => !d.errs.length && !d.exists);
  const updRecs = data.filter(d => !d.errs.length && d.exists);
  const errors = data.filter(d => d.errs.length);
  const valid = data.filter(d => !d.errs.length);

  document.getElementById('importModalTitle').textContent = `Import Preview — ${total} rows`;
  const confirmBtn = document.getElementById('importConfirmBtn');
  confirmBtn.textContent = `Import ${valid.length} Records`;
  confirmBtn.disabled = valid.length === 0;

  let html = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">
      ${statBox(total, 'Total Rows', 'var(--bg-hover)', 'var(--text)')}
      ${statBox(newRecs.length, 'New', 'var(--green-bg)', 'var(--green-text)')}
      ${statBox(updRecs.length, 'Updates', 'var(--indigo-bg)', 'var(--indigo-2)')}
      ${statBox(errors.length, 'Errors', 'var(--red-bg)', 'var(--red-text)')}
    </div>`;

  if (errors.length) {
    html += `<div style="margin-bottom:14px;padding:12px 16px;background:var(--red-bg);border-radius:var(--radius);font-size:12px;color:var(--red-text)">
      <strong>${errors.length} row(s)</strong> have errors and will be skipped:`;
    errors.slice(0, 4).forEach(e => {
      html += `<div style="margin-top:4px">• Row ${e.idx}: ${e.dateStr || '(no date)'} — ${e.errs.join('; ')}</div>`;
    });
    if (errors.length > 4) html += `<div style="margin-top:4px">…and ${errors.length - 4} more</div>`;
    html += `</div>`;
  }

  html += `<div class="table-wrap"><table class="ip-table">
    <thead><tr>
      <th>#</th><th>Status</th><th>Date</th><th>Sale (₹L)</th><th>Vol (KL)</th>
      <th>Recv (L)</th><th>Fat%</th><th>Rate</th><th>Dahi</th><th>Lassi</th>
    </tr></thead><tbody>`;

  data.forEach(d => {
    const cls = d.errs.length ? 'ip-row-err' : d.exists ? 'ip-row-upd' : 'ip-row-new';
    const badge = d.errs.length
      ? '<span class="ip-badge ip-badge-err">Error</span>'
      : d.exists ? '<span class="ip-badge ip-badge-upd">Update</span>'
      : '<span class="ip-badge ip-badge-new">New</span>';
    html += `<tr class="${cls}">
      <td>${d.idx}</td><td>${badge}</td><td>${d.dateStr}</td>
      <td>${fmt(d.rec.total_sale_value)}</td><td>${fmt(d.rec.total_sale_volume)}</td>
      <td>${fmt(d.rec.milk_received)}</td><td>${fmtd(d.rec.fat_pct)}</td>
      <td>${fmtd(d.rec.proc_rate)}</td><td>${fmt(d.rec.dahi_sale)}</td><td>${fmt(d.rec.lassi_sale)}</td>
    </tr>`;
    if (d.errs.length) {
      html += `<tr class="${cls}"><td colspan="10"><span class="ip-err">⚠ ${d.errs.join('; ')}</span></td></tr>`;
    }
  });
  html += `</tbody></table></div>`;

  document.getElementById('importModalBody').innerHTML = html;
  document.getElementById('importModal').classList.add('show');
}

function statBox(value, label, bg, color) {
  return `<div style="padding:12px;background:${bg};border-radius:var(--radius);text-align:center">
    <div style="font-size:22px;font-weight:700;color:${color}">${value}</div>
    <div style="font-size:11px;color:${color};opacity:0.8">${label}</div>
  </div>`;
}
