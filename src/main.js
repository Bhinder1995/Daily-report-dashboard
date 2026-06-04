import { loadRecords, saveRecords, validateRecord, fmt, currentMonthName } from './data.js';
import { updateAllChartThemes } from './charts.js';
import { exportExcel } from './export.js';
import { initImport } from './import.js';
import { renderEntryKpis, renderSummary, renderMarketing, renderProcurement, renderProcessing, renderVap } from './pages/pages.js';
import { renderHistory, initHistorySort } from './pages/history.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderGoals, initGoals } from './pages/goals.js';

window.__records = loadRecords();
window.__filteredRecords = null;
let currentRoute = 'entry';
let editingRecordDate = null;

export function toast(msg, type = 'i') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast-item toast-${type}`;
  let icon = 'info-circle';
  if (type === 's') icon = 'circle-check';
  if (type === 'e') icon = 'alert-circle';
  if (type === 'w') icon = 'alert-triangle';
  t.innerHTML = `<i class="ti ti-${icon}"></i><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add('removing');
    t.addEventListener('animationend', () => t.remove());
  }, 4000);
}
window.toast = toast;

function navigateTo(route) {
  currentRoute = route;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-route') === route);
  });
  document.querySelectorAll('.topnav-btn').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-route') === route);
  });
  document.querySelectorAll('.page').forEach(page => {
    page.classList.toggle('active', page.id === `page-${route}`);
  });
  closeMobileSidebar();
  renderActivePage();
}

function renderActivePage() {
  const recs = window.__records;
  if (currentRoute === 'entry') {
    renderEntryKpis(recs);
    updateEntryDateLabel();
  } else if (currentRoute === 'summary') {
    renderSummary(recs);
  } else if (currentRoute === 'marketing') {
    renderMarketing(recs);
  } else if (currentRoute === 'procurement') {
    renderProcurement(recs);
  } else if (currentRoute === 'processing') {
    renderProcessing(recs);
  } else if (currentRoute === 'vap') {
    renderVap(recs);
  } else if (currentRoute === 'analytics') {
    renderAnalytics(recs);
  } else if (currentRoute === 'goals') {
    renderGoals(recs);
  } else if (currentRoute === 'history') {
    applyHistoryFilters();
  }
}

function updateEntryDateLabel() {
  const dateInput = document.getElementById('eDate');
  const label = document.getElementById('entryDateLabel');
  if (dateInput && label) {
    if (dateInput.value) {
      const d = new Date(dateInput.value);
      label.textContent = '— ' + d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else {
      label.textContent = '';
    }
  }
}

window.todayDate = () => {
  const dateInput = document.getElementById('eDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
    updateEntryDateLabel();
    checkUnsavedState();
  }
};

function clearEntryForm() {
  const isDirty = Array.from(document.querySelectorAll('#page-entry .form-input'))
    .some(el => el.id !== 'eDate' && el.value.trim() !== '');
  if (isDirty && editingRecordDate === null && !confirm('You have unsaved changes. Clear form anyway?')) return;
  editingRecordDate = null;
  const saveBtn = document.getElementById('saveEntryBtn');
  if (saveBtn) saveBtn.innerHTML = '<i class="ti ti-device-floppy"></i> Save Entry';
  const inputs = document.querySelectorAll('#page-entry .form-input');
  inputs.forEach(input => {
    if (input.id === 'eDate') {
      input.value = new Date().toISOString().split('T')[0];
    } else {
      input.value = '';
    }
  });
  updateEntryDateLabel();
  checkUnsavedState();
}

function getVal(id) {
  return parseFloat(document.getElementById(id)?.value) || 0;
}

function saveEntry() {
  const dateVal = document.getElementById('eDate').value;
  if (!dateVal) { toast('Date is required!', 'e'); return; }

  const rec = {
    date: dateVal,
    // Marketing
    total_sale_value: getVal('eTsv'),
    total_sale_volume: getVal('eTvol'),
    routes: getVal('eRoutes'),
    institution_sale: getVal('eInst'),
    exports_sale: getVal('eExports'),
    avg_realization: getVal('eAvgReal'),
    // Procurement
    milk_received: getVal('eRecv'),
    fat_pct: getVal('eFat'),
    snf_pct: getVal('eSnf'),
    milk_own_societies: getVal('eOwn'),
    milk_direct_market: getVal('eDirect'),
    proc_rate: getVal('eRate'),
    // Processing
    milk_processed: getVal('eMilkProc'),
    proc_capacity: getVal('eCap'),
    city_supply: getVal('eCity'),
    city_supply_cap: getVal('eCityCap'),
    // VAP
    dahi_sale: getVal('eDahi'),
    lassi_sale: getVal('eLassi'),
    paneer_sale: getVal('ePaneer'),
    ghee_prod: getVal('eGhee'),
    milk_powder: getVal('eMPowder'),
    ice_cream: getVal('eIceCream'),
    kheer_sale: getVal('eKheer'),
    rabri_sale: getVal('eRabri'),
    kaju_badam: getVal('eKaju'),
    sweets: getVal('eSweets'),
    table_butter: getVal('eButter'),
    cheese: getVal('eCheese'),
    // Legacy compat
    total_sale_value_orig: getVal('eTsv'),
    gross_revenue: 0,
    proc_cost: 0,
    var_cost: 0,
    pack_cost: 0,
    power_cost: 0,
    man_cost: 0,
    overheads: 0,
  };

  const errors = validateRecord(rec);
  if (errors.length) { toast(errors[0], 'e'); return; }

  const idx = window.__records.findIndex(r => r.date === rec.date);
  if (idx > -1) {
    window.__records[idx] = rec;
    toast(`Updated entry for ${rec.date}`, 's');
  } else {
    window.__records.push(rec);
    toast(`Saved entry for ${rec.date}`, 's');
  }

  window.__records.sort((a, b) => a.date.localeCompare(b.date));
  saveRecords(window.__records);
  markSaved();

  clearEntryForm();
  updateSidebarStats();
  renderActivePage();
}

function checkUnsavedState() {
  const pill = document.getElementById('unsavedPill');
  if (!pill) return;
  const dateVal = document.getElementById('eDate').value;
  const isDirty = Array.from(document.querySelectorAll('#page-entry .form-input'))
    .some(el => el.id !== 'eDate' && el.value.trim() !== '');
  pill.classList.toggle('show', isDirty);
}

window.__editRec = (date) => {
  const rec = window.__records.find(r => r.date === date);
  if (!rec) return;
  editingRecordDate = date;
  navigateTo('entry');

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  }

  setVal('eDate', rec.date);
  // Marketing
  setVal('eTsv', rec.total_sale_value);
  setVal('eTvol', rec.total_sale_volume);
  setVal('eRoutes', rec.routes);
  setVal('eInst', rec.institution_sale);
  setVal('eExports', rec.exports_sale);
  setVal('eAvgReal', rec.avg_realization);
  // Procurement
  setVal('eRecv', rec.milk_received);
  setVal('eFat', rec.fat_pct);
  setVal('eSnf', rec.snf_pct);
  setVal('eOwn', rec.milk_own_societies);
  setVal('eDirect', rec.milk_direct_market);
  setVal('eRate', rec.proc_rate);
  // Processing
  setVal('eMilkProc', rec.milk_processed);
  setVal('eCap', rec.proc_capacity);
  setVal('eCity', rec.city_supply);
  setVal('eCityCap', rec.city_supply_cap);
  // VAP
  setVal('eDahi', rec.dahi_sale);
  setVal('eLassi', rec.lassi_sale);
  setVal('ePaneer', rec.paneer_sale);
  setVal('eGhee', rec.ghee_prod);
  setVal('eMPowder', rec.milk_powder);
  setVal('eIceCream', rec.ice_cream);
  setVal('eKheer', rec.kheer_sale);
  setVal('eRabri', rec.rabri_sale);
  setVal('eKaju', rec.kaju_badam);
  setVal('eSweets', rec.sweets);
  setVal('eButter', rec.table_butter);
  setVal('eCheese', rec.cheese);

  const saveBtn = document.getElementById('saveEntryBtn');
  if (saveBtn) saveBtn.innerHTML = '<i class="ti ti-device-floppy"></i> Update Entry';

  updateEntryDateLabel();
  toast(`Loaded entry for ${date} to edit`, 'i');
};

window.__delRec = (date) => {
  if (!confirm(`Are you sure you want to delete the entry for ${date}?`)) return;
  window.__records = window.__records.filter(r => r.date !== date);
  saveRecords(window.__records);
  markSaved();
  toast(`Deleted entry for ${date}`, 'w');
  if (editingRecordDate === date) clearEntryForm();
  updateSidebarStats();
  renderActivePage();
};

function applyHistoryFilters() {
  const searchVal = document.getElementById('histSearch')?.value.toLowerCase().trim() || '';
  const monthVal = document.getElementById('hMonth')?.value || '';
  let filtered = [...window.__records];
  if (monthVal) filtered = filtered.filter(r => r.date.startsWith(monthVal));
  if (searchVal) {
    filtered = filtered.filter(r => {
      return r.date.includes(searchVal) ||
             String(r.total_sale_value).includes(searchVal) ||
             String(r.routes).includes(searchVal);
    });
  }
  window.__filteredRecords = filtered;
  renderHistory(window.__records, filtered);
}

function clearHistoryFilters() {
  const s = document.getElementById('histSearch');
  const m = document.getElementById('hMonth');
  if (s) s.value = '';
  if (m) m.value = '';
  applyHistoryFilters();
}

function clearAllRecords() {
  if (!confirm('WARNING: This will permanently delete ALL data records! Are you sure?')) return;
  window.__records = [];
  saveRecords([]);
  markSaved();
  toast('All records cleared!', 'e');
  clearEntryForm();
  updateSidebarStats();
  renderActivePage();
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  document.getElementById('themeBtn')?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
    updateAllChartThemes();
    toast(`Switched to ${next} theme`, 'i');
  });
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (!icon) return;
  icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
}

function toggleMobileSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebarOverlay');
  if (s && o) {
    s.classList.toggle('open');
    o.classList.toggle('show');
  }
}

function closeMobileSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebarOverlay');
  if (s && o) {
    s.classList.remove('open');
    o.classList.remove('show');
  }
}

function toggleShortcutsModal() {
  const modal = document.getElementById('shortcutsModal');
  if (modal) modal.classList.toggle('show');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('show'));
  closeMobileSidebar();
}

function updateSidebarSaved() {
  const el = document.getElementById('sidebarSaved');
  if (!el) return;
  const saved = localStorage.getItem('_last_saved');
  if (saved) {
    const d = new Date(saved);
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = `<i class="ti ti-cloud-check"></i>Saved at ${time}`;
  } else {
    el.innerHTML = '';
  }
}

function updateSidebarStats() {
  const el = document.getElementById('sidebarStats');
  if (!el) return;
  const recs = window.__records;
  if (!recs.length) { el.innerHTML = 'No data recorded yet.'; return; }
  const last = recs[recs.length - 1];
  el.innerHTML = `
    <strong>Latest: ${last.date}</strong><br>
    Sales: ₹${fmt(last.total_sale_value)}L<br>
    Milk: ${fmt(last.milk_received)} L
  `;
}

function markSaved() {
  localStorage.setItem('_last_saved', new Date().toISOString());
  updateSidebarSaved();
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  document.querySelectorAll('[data-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.getAttribute('data-route');
      navigateTo(route);
    });
  });

  document.getElementById('sidebarOverlay')?.addEventListener('click', closeMobileSidebar);
  document.getElementById('hamburgerBtn')?.addEventListener('click', toggleMobileSidebar);

  document.getElementById('eDate')?.addEventListener('change', () => {
    updateEntryDateLabel();
    checkUnsavedState();
  });
  document.querySelectorAll('#page-entry .form-input').forEach(el => {
    el.addEventListener('input', checkUnsavedState);
  });
  document.getElementById('saveEntryBtn')?.addEventListener('click', saveEntry);
  document.getElementById('clearFormBtn')?.addEventListener('click', clearEntryForm);

  document.getElementById('analyticsMonths')?.addEventListener('change', () => {
    renderAnalytics(window.__records);
  });

  let _searchTimer;
  document.getElementById('histSearch')?.addEventListener('input', () => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(applyHistoryFilters, 250);
  });
  document.getElementById('hMonth')?.addEventListener('change', applyHistoryFilters);
  document.getElementById('clearHistBtn')?.addEventListener('click', clearHistoryFilters);
  document.getElementById('clearAllBtn')?.addEventListener('click', clearAllRecords);

  document.getElementById('exportBtn')?.addEventListener('click', () => {
    exportExcel(window.__records, window.__filteredRecords);
  });
  window.exportExcel = () => exportExcel(window.__records, window.__filteredRecords);

  initImport((validatedImportData) => {
    const validRows = validatedImportData.filter(d => !d.errs.length).map(d => d.rec);
    if (!validRows.length) return;
    validRows.forEach(rec => {
      const idx = window.__records.findIndex(r => r.date === rec.date);
      if (idx > -1) window.__records[idx] = rec;
      else window.__records.push(rec);
    });
    window.__records.sort((a, b) => a.date.localeCompare(b.date));
    saveRecords(window.__records);
    markSaved();
    toast(`Imported ${validRows.length} records!`, 's');
    updateSidebarStats();
    navigateTo('history');
  });

  initGoals(() => {
    renderGoals(window.__records);
    updateSidebarStats();
  });

  initHistorySort(() => {
    applyHistoryFilters();
  });

  document.getElementById('shortcutsBtn')?.addEventListener('click', toggleShortcutsModal);
  document.getElementById('closeShortcutsModal')?.addEventListener('click', () => {
    document.getElementById('shortcutsModal')?.classList.remove('show');
  });
  document.getElementById('shortcutsModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      document.getElementById('shortcutsModal')?.classList.remove('show');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAllModals(); return; }
    const active = document.activeElement;
    const isInput = active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA';
    if (e.key === '?' && !isInput) { e.preventDefault(); toggleShortcutsModal(); return; }
    if (e.key === 't' && !isInput && currentRoute === 'entry') { e.preventDefault(); window.todayDate(); return; }
    if (e.ctrlKey) {
      if (e.key === 's') { e.preventDefault(); if (currentRoute === 'entry') saveEntry(); else toast('Go to Daily Entry first!', 'w'); }
      if (e.key === 'e') { e.preventDefault(); exportExcel(window.__records, window.__filteredRecords); }
      if (e.key === '1') { e.preventDefault(); navigateTo('entry'); }
      if (e.key === '2') { e.preventDefault(); navigateTo('summary'); }
      if (e.key === '3') { e.preventDefault(); navigateTo('analytics'); }
      if (e.key === '4') { e.preventDefault(); navigateTo('history'); }
    }
  });

  clearEntryForm();
  updateSidebarStats();
  updateSidebarSaved();
  navigateTo('entry');
});
