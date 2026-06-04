export const KEY = 'dairy_dash_v3';
export const GOALS_KEY = 'dairy_goals_v1';

export function loadRecords() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function saveRecords(records) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export function loadGoals() {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || '{}'); } catch { return {}; }
}
export function saveGoals(goals) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export function sum(arr, key) {
  return arr.reduce((a, b) => a + (parseFloat(b[key]) || 0), 0);
}
export function avg(arr, key) {
  if (!arr.length) return 0;
  return sum(arr, key) / arr.length;
}
export function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-IN');
}
export function fmtd(n, d = 2) {
  return (parseFloat(n) || 0).toFixed(d);
}

export function getMTD(records) {
  const now = new Date();
  const m = now.getMonth(), y = now.getFullYear();
  return records.filter(r => {
    try {
      const d = new Date(r.date);
      return d.getMonth() === m && d.getFullYear() === y;
    } catch { return false; }
  });
}

export function getPrevMonthRecords(records) {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pm = prev.getMonth(), py = prev.getFullYear();
  return records.filter(r => {
    try { const d = new Date(r.date); return d.getMonth() === pm && d.getFullYear() === py; }
    catch { return false; }
  });
}

export function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function groupByMonth(records) {
  const map = {};
  records.forEach(r => {
    const k = getMonthKey(r.date);
    if (!map[k]) map[k] = [];
    map[k].push(r);
  });
  return map;
}

export function getLastNMonths(records, n = 6) {
  const now = new Date();
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const byMonth = groupByMonth(records);
  return months.map(m => ({ month: m, records: byMonth[m] || [] }));
}

export function monthName(monthKey) {
  if (!monthKey) return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function currentMonthName() {
  return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function validateRecord(r) {
  const errs = [];
  if (!r.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(r.date))) {
    errs.push('Invalid or missing date (YYYY-MM-DD)');
  }
  const numericFields = [
    'routes','total_sale_value','total_sale_volume','milk_sale','lassi_sale','dahi_sale',
    'paneer_sale','kheer_sale','rabri_sale','institution_sale','milk_received','fat_pct',
    'snf_pct','proc_rate','proc_capacity','city_supply',
    'gross_revenue','proc_cost','var_cost','pack_cost','power_cost','man_cost','overheads',
    'exports_sale','avg_realization',
    'milk_own_societies','milk_direct_market','milk_processed','city_supply_cap',
    'dahi_prod','dahi_cap','paneer_prod','lassi_prod','lassi_cap',
    'ghee_prod','milk_powder','ice_cream','kaju_badam','sweets','table_butter','cheese'
  ];
  numericFields.forEach(f => {
    const val = r[f];
    if (val !== undefined && val !== null && val !== '' && (isNaN(parseFloat(val)) || parseFloat(val) < 0)) {
      errs.push(`${f} must be a non-negative number`);
    }
  });
  return errs;
}

export function calcProcessingUtil(r) {
  const cap = parseFloat(r.proc_capacity) || 0;
  const processed = parseFloat(r.milk_processed) || parseFloat(r.city_supply) || 0;
  return cap ? Math.round(processed / cap * 100) : 0;
}

export function calcCityUtil(r) {
  const cap = parseFloat(r.city_supply_cap) || parseFloat(r.proc_capacity) || 0;
  const supply = parseFloat(r.city_supply) || 0;
  return cap ? Math.round(supply / cap * 100) : 0;
}
