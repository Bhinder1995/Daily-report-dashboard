import { sum, avg, fmt, fmtd, getMTD, currentMonthName, getPrevMonthRecords, calcProcessingUtil, calcCityUtil } from '../data.js';
import {
  lineChart, barChart, multiLineChart,
  showEmpty, hideEmpty, destroyChart
} from '../charts.js';

const PALETTE = ['#6366f1','#10b981','#f97316','#ec4899','#f59e0b','#a78bfa','#14b8a6','#3b82f6'];

function kpiCard({ label, value, unit = '', icon, accentFrom, accentTo, trend, trendLabel }) {
  const trendHtml = trend !== undefined
    ? `<div class="kpi-trend ${trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'}">
        <i class="ti ti-trend-${trend > 0 ? 'up-2' : trend < 0 ? 'down-2' : 'minus'}"></i>
        ${trendLabel || ''}
      </div>` : '';
  return `
    <div class="kpi-card" style="--accent-from:${accentFrom||'#6366f1'};--accent-to:${accentTo||'#7c3aed'}">
      <div class="kpi-icon" style="background:${accentFrom||'#6366f1'}22;color:${accentFrom||'#6366f1'}">
        <i class="ti ti-${icon}"></i>
      </div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}<span class="kpi-unit">${unit}</span></div>
      ${trendHtml}
    </div>`;
}

// ─────────────────────────────────────────────
// ENTRY PAGE KPIs
// ─────────────────────────────────────────────
export function renderEntryKpis(records) {
  const mtd = getMTD(records);
  const prev = getPrevMonthRecords(records);
  const el = document.getElementById('entryKpis');
  const guide = document.getElementById('entryEmptyGuide');
  if (!el) return;
  if (!records.length) {
    el.innerHTML = '';
    if (guide) guide.classList.add('show');
    return;
  }
  if (guide) guide.classList.remove('show');
  if (!mtd.length) { el.innerHTML = ''; return; }

  const tsv = sum(mtd, 'total_sale_value');
  const tvol = sum(mtd, 'total_sale_volume');
  const recv = sum(mtd, 'milk_received');
  const days = mtd.length;
  const dahi = sum(mtd, 'dahi_sale');
  const lassi = sum(mtd, 'lassi_sale');

  const pTsv = sum(prev, 'total_sale_value');
  const trendTSV = pTsv && prev.length ? ((tsv / days) / (pTsv / prev.length) - 1) * 100 : 0;

  el.innerHTML =
    kpiCard({ label: 'MTD Sale Value', value: '₹' + fmt(tsv) + 'L', icon: 'currency-rupee', accentFrom: '#6366f1',
      trend: trendTSV, trendLabel: (trendTSV > 0 ? '+' : '') + trendTSV.toFixed(1) + '% vs prev' }) +
    kpiCard({ label: 'MTD Volume', value: fmt(tvol), unit: ' KL', icon: 'droplet-filled-2', accentFrom: '#10b981' }) +
    kpiCard({ label: 'Milk Received', value: fmt(Math.round(recv/1000)), unit: 'K L', icon: 'droplet', accentFrom: '#3b82f6' }) +
    kpiCard({ label: 'Days Recorded', value: days, icon: 'calendar-check', accentFrom: '#f59e0b' }) +
    kpiCard({ label: 'Dahi (MTD)', value: fmt(dahi), unit: ' kg', icon: 'salad', accentFrom: '#ec4899' }) +
    kpiCard({ label: 'Lassi (MTD)', value: fmt(lassi), unit: ' L', icon: 'glass', accentFrom: '#14b8a6' });
}

// ─────────────────────────────────────────────
// SUMMARY PAGE
// ─────────────────────────────────────────────
export function renderSummary(records) {
  const mtd = getMTD(records);
  document.getElementById('summaryMonthLabel').textContent = '— ' + currentMonthName();

  if (!mtd.length) {
    ['summaryKpis','mixLegend','capUtil'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
    ['trendAvgLabel','capUtilAvg'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
    ['wrapTrend','wrapMilkComp','wrapVap','wrapQual'].forEach(id => showEmpty(id));
    ['chartTrend','chartMilkComp','chartVap','chartQual'].forEach(id => destroyChart(id));
    return;
  }
  ['wrapTrend','wrapMilkComp','wrapVap','wrapQual'].forEach(id => hideEmpty(id));

  const tsv = sum(mtd, 'total_sale_value');
  const tvol = sum(mtd, 'total_sale_volume');
  const recv = sum(mtd, 'milk_received');
  const processed = sum(mtd, 'milk_processed');
  const city = sum(mtd, 'city_supply');
  const routes = avg(mtd, 'routes');
  const avgRate = avg(mtd, 'proc_rate');
  const dahi = sum(mtd, 'dahi_sale');
  const lassi = sum(mtd, 'lassi_sale');
  const paneer = sum(mtd, 'paneer_sale');

  document.getElementById('summaryKpis').innerHTML =
    kpiCard({ label: 'MTD Sale Value', value: '₹' + fmt(tsv) + 'L', icon: 'currency-rupee', accentFrom: '#6366f1' }) +
    kpiCard({ label: 'MTD Volume', value: fmt(tvol), unit: ' KL', icon: 'droplet', accentFrom: '#10b981' }) +
    kpiCard({ label: 'Milk Received', value: fmt(recv), unit: ' L', icon: 'droplet-filled', accentFrom: '#3b82f6' }) +
    kpiCard({ label: 'Milk Processed', value: fmt(processed), unit: ' L', icon: 'building-factory', accentFrom: '#a78bfa' }) +
    kpiCard({ label: 'Avg Routes/Day', value: routes.toFixed(1), icon: 'route', accentFrom: '#f59e0b' }) +
    kpiCard({ label: 'Avg Proc. Rate', value: '₹' + fmtd(avgRate), icon: 'coin', accentFrom: '#14b8a6' }) +
    kpiCard({ label: 'Dahi (MTD)', value: fmt(dahi), unit: ' kg', icon: 'salad', accentFrom: '#ec4899' }) +
    kpiCard({ label: 'Lassi (MTD)', value: fmt(lassi), unit: ' L', icon: 'glass', accentFrom: '#f97316' }) +
    kpiCard({ label: 'Paneer (MTD)', value: fmt(paneer), unit: ' kg', icon: 'cheese', accentFrom: '#f59e0b' }) +
    kpiCard({ label: 'Days Recorded', value: mtd.length, icon: 'calendar', accentFrom: '#14b8a6' });

  // Sales Trend
  const labels = mtd.map(r => r.date.slice(5));
  const trendData = mtd.map(r => r.total_sale_value);
  const trendAvg = trendData.length ? Math.round(trendData.reduce((a,b) => a+b, 0) / trendData.length) : 0;
  document.getElementById('trendAvgLabel').textContent = '— Avg: ₹' + fmt(trendAvg) + 'L';
  lineChart('chartTrend', labels,
    [{ label: 'Sale Value (₹L)', data: trendData, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', tension: 0.3, fill: true, pointRadius: 3, borderWidth: 2 }],
    v => '₹' + Math.round(v) + 'L'
  );

  // Milk Received vs Processed
  barChart('chartMilkComp', labels, [
    { label: 'Received (L)', data: mtd.map(r => r.milk_received), backgroundColor: '#3b82f6', borderRadius: 4 },
    { label: 'Processed (L)', data: mtd.map(r => r.milk_processed), backgroundColor: '#a78bfa', borderRadius: 4 }
  ]);

  // VAP Production bar
  barChart('chartVap', labels, [
    { label: 'Dahi (kg)', data: mtd.map(r => r.dahi_sale), backgroundColor: '#ec4899', borderRadius: 4 },
    { label: 'Lassi (L)', data: mtd.map(r => r.lassi_sale), backgroundColor: '#f97316', borderRadius: 4 },
    { label: 'Paneer (kg)', data: mtd.map(r => r.paneer_sale), backgroundColor: '#f59e0b', borderRadius: 4 }
  ]);

  // Quality Trend
  multiLineChart('chartQual', labels, [
    { label: 'Fat %', data: mtd.map(r => r.fat_pct), borderColor: '#f97316', tension: 0.3, pointRadius: 3, borderWidth: 2, fill: false },
    { label: 'SNF %', data: mtd.map(r => r.snf_pct), borderColor: '#a78bfa', tension: 0.3, pointRadius: 3, borderWidth: 2, borderDash: [5,5], fill: false }
  ], v => v.toFixed(1) + '%');
}

// ─────────────────────────────────────────────
// MARKETING PAGE
// ─────────────────────────────────────────────
export function renderMarketing(records) {
  const mtd = getMTD(records);
  if (!mtd.length) {
    document.getElementById('markKpis').innerHTML = '';
    ['wrapMarkVal','wrapMarkVol','wrapRoutes'].forEach(id => showEmpty(id));
    ['chartMarkVal','chartMarkVol','chartRoutes'].forEach(id => destroyChart(id));
    return;
  }
  ['wrapMarkVal','wrapMarkVol','wrapRoutes'].forEach(id => hideEmpty(id));

  const tsv = sum(mtd, 'total_sale_value');
  const tvol = sum(mtd, 'total_sale_volume');
  const inst = sum(mtd, 'institution_sale');
  const exportsVal = sum(mtd, 'exports_sale');
  const avgReal = avg(mtd, 'avg_realization');
  const routes = avg(mtd, 'routes');

  document.getElementById('markKpis').innerHTML =
    kpiCard({ label: 'MTD Sale Value', value: '₹' + fmt(tsv) + 'L', icon: 'trending-up', accentFrom: '#6366f1' }) +
    kpiCard({ label: 'MTD Volume', value: fmt(tvol), unit: ' KL', icon: 'droplet-filled-2', accentFrom: '#10b981' }) +
    kpiCard({ label: 'Avg Routes/Day', value: routes.toFixed(1), icon: 'route', accentFrom: '#f59e0b' }) +
    kpiCard({ label: 'Institutional Sale', value: '₹' + fmt(inst) + 'L', icon: 'building', accentFrom: '#3b82f6' }) +
    kpiCard({ label: 'Export Sale', value: exportsVal ? '₹' + fmt(exportsVal) + 'L' : '—', icon: 'plane', accentFrom: '#14b8a6' }) +
    kpiCard({ label: 'Avg Realization', value: avgReal ? '₹' + fmtd(avgReal) : '—', unit: '/Kg', icon: 'tag', accentFrom: '#ec4899' });

  const labels = mtd.map(r => r.date.slice(5));
  barChart('chartMarkVal', labels,
    [{ label: 'Sale Value (₹L)', data: mtd.map(r => r.total_sale_value), backgroundColor: '#6366f1', borderRadius: 4 }]
  );
  barChart('chartMarkVol', labels,
    [{ label: 'Volume (KL)', data: mtd.map(r => r.total_sale_volume), backgroundColor: '#10b981', borderRadius: 4 }]
  );
  barChart('chartRoutes', labels,
    [{ label: 'Routes', data: mtd.map(r => r.routes), backgroundColor: '#f59e0b', borderRadius: 4 }]
  );
}

// ─────────────────────────────────────────────
// PROCUREMENT PAGE
// ─────────────────────────────────────────────
export function renderProcurement(records) {
  const mtd = getMTD(records);
  if (!mtd.length) {
    document.getElementById('procKpis').innerHTML = '';
    ['wrapProcRecv','wrapProcSource','wrapProcRate'].forEach(id => showEmpty(id));
    ['chartProcRecv','chartProcSource','chartProcRate'].forEach(id => destroyChart(id));
    return;
  }
  ['wrapProcRecv','wrapProcSource','wrapProcRate'].forEach(id => hideEmpty(id));

  const totalRecv = sum(mtd, 'milk_received');
  const avgFat = avg(mtd, 'fat_pct');
  const avgSnf = avg(mtd, 'snf_pct');
  const avgRate = avg(mtd, 'proc_rate');
  const own = sum(mtd, 'milk_own_societies');
  const direct = sum(mtd, 'milk_direct_market');

  const prev = getPrevMonthRecords(records);
  const prevRecv = sum(prev, 'milk_received');
  const trendRecv = prevRecv && prev.length ? ((totalRecv / mtd.length) / (prevRecv / prev.length) - 1) * 100 : 0;

  document.getElementById('procKpis').innerHTML =
    kpiCard({ label: 'Milk Received (MTD)', value: fmt(totalRecv), unit: ' L', icon: 'droplet-filled', accentFrom: '#10b981',
      trend: trendRecv, trendLabel: (trendRecv > 0 ? '+' : '') + trendRecv.toFixed(1) + '% vs prev' }) +
    kpiCard({ label: 'Avg Fat %', value: fmtd(avgFat) + '%', icon: 'flask', accentFrom: '#f97316' }) +
    kpiCard({ label: 'Avg SNF %', value: fmtd(avgSnf) + '%', icon: 'test-pipe', accentFrom: '#a78bfa' }) +
    kpiCard({ label: 'Avg Proc. Rate', value: '₹' + fmtd(avgRate), unit: '/Kg', icon: 'coin', accentFrom: '#f59e0b' }) +
    kpiCard({ label: 'Own Societies', value: fmt(own), unit: ' L', icon: 'building-community', accentFrom: '#3b82f6' }) +
    kpiCard({ label: 'Direct/Market', value: fmt(direct), unit: ' L', icon: 'truck', accentFrom: '#14b8a6' });

  const labels = mtd.map(r => r.date.slice(5));
  barChart('chartProcRecv', labels,
    [{ label: 'Milk Received (L)', data: mtd.map(r => r.milk_received), backgroundColor: '#10b981', borderRadius: 4 }]
  );
  barChart('chartProcSource', labels, [
    { label: 'Own Societies', data: mtd.map(r => r.milk_own_societies), backgroundColor: '#3b82f6', borderRadius: 4 },
    { label: 'Direct/Market', data: mtd.map(r => r.milk_direct_market), backgroundColor: '#14b8a6', borderRadius: 4 }
  ]);
  barChart('chartProcRate', labels,
    [{ label: 'Proc Rate (₹/Kg)', data: mtd.map(r => r.proc_rate), backgroundColor: '#f59e0b', borderRadius: 4 }]
  );
}

// ─────────────────────────────────────────────
// PROCESSING PAGE
// ─────────────────────────────────────────────
export function renderProcessing(records) {
  const mtd = getMTD(records);
  if (!mtd.length) {
    document.getElementById('proc2Kpis').innerHTML = '';
    ['wrapProcVol','wrapCitySupp'].forEach(id => showEmpty(id));
    ['chartProcVol','chartCitySupp'].forEach(id => destroyChart(id));
    return;
  }
  ['wrapProcVol','wrapCitySupp'].forEach(id => hideEmpty(id));

  const totalProc = sum(mtd, 'milk_processed');
  const totalCap = sum(mtd, 'proc_capacity');
  const totalCity = sum(mtd, 'city_supply');
  const cityCap = sum(mtd, 'city_supply_cap');
  const procUtil = totalCap ? Math.round(totalProc / totalCap * 100) : 0;
  const cityUtil = cityCap ? Math.round(totalCity / cityCap * 100) : (totalCap ? Math.round(totalCity / totalCap * 100) : 0);

  document.getElementById('proc2Kpis').innerHTML =
    kpiCard({ label: 'Milk Processed (MTD)', value: fmt(totalProc), unit: ' L', icon: 'building-factory-2', accentFrom: '#6366f1' }) +
    kpiCard({ label: 'Proc. Capacity', value: fmt(totalCap), unit: ' L', icon: 'tool', accentFrom: '#a78bfa' }) +
    kpiCard({ label: 'Processing Util %', value: procUtil + '%', icon: 'chart-pie-2', accentFrom: procUtil >= 70 ? '#10b981' : '#f59e0b' }) +
    kpiCard({ label: 'City Supply (MTD)', value: fmt(totalCity), unit: ' L', icon: 'truck', accentFrom: '#3b82f6' }) +
    kpiCard({ label: 'City Supply Util %', value: cityUtil + '%', icon: 'percentage', accentFrom: cityUtil >= 80 ? '#10b981' : '#f59e0b' });

  const labels = mtd.map(r => r.date.slice(5));
  barChart('chartProcVol', labels, [
    { label: 'Processed (L)', data: mtd.map(r => r.milk_processed), backgroundColor: '#6366f1', borderRadius: 4 },
    { label: 'Capacity (L)', data: mtd.map(r => r.proc_capacity), backgroundColor: 'rgba(99,102,241,0.25)', borderRadius: 4 }
  ]);
  barChart('chartCitySupp', labels, [
    { label: 'City Supply (L)', data: mtd.map(r => r.city_supply), backgroundColor: '#3b82f6', borderRadius: 4 },
    { label: 'Capacity (L)', data: mtd.map(r => r.city_supply_cap || r.proc_capacity), backgroundColor: 'rgba(59,130,246,0.25)', borderRadius: 4 }
  ]);
}

// ─────────────────────────────────────────────
// VAP MANUFACTURING PAGE
// ─────────────────────────────────────────────
export function renderVap(records) {
  const mtd = getMTD(records);
  if (!mtd.length) {
    document.getElementById('vapKpis').innerHTML = '';
    ['wrapVapDahi','wrapVapOther'].forEach(id => showEmpty(id));
    ['chartVapDahi','chartVapOther'].forEach(id => destroyChart(id));
    return;
  }
  ['wrapVapDahi','wrapVapOther'].forEach(id => hideEmpty(id));

  const dahi = sum(mtd, 'dahi_sale');
  const lassi = sum(mtd, 'lassi_sale');
  const paneer = sum(mtd, 'paneer_sale');
  const ghee = sum(mtd, 'ghee_prod');
  const mpowder = sum(mtd, 'milk_powder');
  const ice = sum(mtd, 'ice_cream');
  const kheer = sum(mtd, 'kheer_sale');
  const rabri = sum(mtd, 'rabri_sale');
  const kaju = sum(mtd, 'kaju_badam');
  const sweets = sum(mtd, 'sweets');
  const butter = sum(mtd, 'table_butter');
  const cheese = sum(mtd, 'cheese');

  document.getElementById('vapKpis').innerHTML =
    kpiCard({ label: 'Dahi (MTD)', value: fmt(dahi), unit: ' kg', icon: 'salad', accentFrom: '#ec4899' }) +
    kpiCard({ label: 'Lassi (MTD)', value: fmt(lassi), unit: ' L', icon: 'glass', accentFrom: '#f97316' }) +
    kpiCard({ label: 'Paneer (MTD)', value: fmt(paneer), unit: ' kg', icon: 'cheese', accentFrom: '#f59e0b' }) +
    kpiCard({ label: 'Ghee (MTD)', value: fmt(ghee), unit: ' kg', icon: 'droplet', accentFrom: '#d97706' }) +
    kpiCard({ label: 'Milk Powder', value: fmt(mpowder), unit: ' kg', icon: 'powder', accentFrom: '#a78bfa' }) +
    kpiCard({ label: 'Ice Cream', value: fmt(ice), unit: ' L', icon: 'snowflake', accentFrom: '#3b82f6' }) +
    kpiCard({ label: 'Kheer (MTD)', value: fmt(kheer), unit: ' kg', icon: 'bowl', accentFrom: '#14b8a6' }) +
    kpiCard({ label: 'Rabri (MTD)', value: fmt(rabri), unit: ' kg', icon: 'bowl', accentFrom: '#8b5cf6' });

  const labels = mtd.map(r => r.date.slice(5));

  // Dahi + Lassi line chart
  multiLineChart('chartVapDahi', labels, [
    { label: 'Dahi (kg)', data: mtd.map(r => r.dahi_sale), borderColor: '#ec4899', tension: 0.3, pointRadius: 3, borderWidth: 2, fill: false },
    { label: 'Lassi (L)', data: mtd.map(r => r.lassi_sale), borderColor: '#f97316', tension: 0.3, pointRadius: 3, borderWidth: 2, fill: false }
  ], v => v.toFixed(0));

  // Other products stacked bar
  const otherLabels = ['Paneer','Ghee','M.Powder','IceCr','Kheer','Rabri','Kaju','Sweets','Butter','Cheese'];
  const otherData = [paneer, ghee, mpowder, ice, kheer, rabri, kaju, sweets, butter, cheese];
  barChart('chartVapOther', otherLabels,
    [{ label: 'MTD (kg/L)', data: otherData, backgroundColor: PALETTE, borderRadius: 4 }],
    v => fmt(v), 'y'
  );
}
