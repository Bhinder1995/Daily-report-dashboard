import { sum, avg, fmt, fmtd, getLastNMonths, monthName } from '../data.js';
import { multiLineChart, barChart, destroyChart, showEmpty, hideEmpty } from '../charts.js';

function kpiCard({ label, value, unit = '', icon, accentFrom = '#6366f1', accentTo = '#7c3aed' }) {
  return `
    <div class="kpi-card" style="--accent-from:${accentFrom};--accent-to:${accentTo}">
      <div class="kpi-icon" style="background:${accentFrom}22;color:${accentFrom}">
        <i class="ti ti-${icon}"></i>
      </div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}<span class="kpi-unit">${unit}</span></div>
    </div>`;
}

export function renderAnalytics(records) {
  const n = parseInt(document.getElementById('analyticsMonths')?.value || '6', 10);
  const monthData = getLastNMonths(records, n);
  const labels = monthData.map(m => monthName(m.month));
  const allRecs = monthData.flatMap(m => m.records);
  const hasData = monthData.some(m => m.records.length > 0);

  const totalRev = sum(allRecs, 'total_sale_value');
  const totalVol = sum(allRecs, 'total_sale_volume');
  const totalRecv = sum(allRecs, 'milk_received');
  const totalDahi = sum(allRecs, 'dahi_sale');
  const totalLassi = sum(allRecs, 'lassi_sale');

  document.getElementById('analyticsKpis').innerHTML =
    kpiCard({ label: `${n}M Sales Value`, value: '₹' + fmt(totalRev) + 'L', icon: 'trending-up', accentFrom: '#10b981' }) +
    kpiCard({ label: `${n}M Volume`, value: fmt(totalVol), unit: ' KL', icon: 'droplet', accentFrom: '#3b82f6' }) +
    kpiCard({ label: `${n}M Milk Recv`, value: fmt(totalRecv), unit: ' L', icon: 'droplet-filled', accentFrom: '#6366f1' }) +
    kpiCard({ label: 'Dahi (Total)', value: fmt(totalDahi), unit: ' kg', icon: 'salad', accentFrom: '#ec4899' }) +
    kpiCard({ label: 'Lassi (Total)', value: fmt(totalLassi), unit: ' L', icon: 'glass', accentFrom: '#f97316' }) +
    kpiCard({ label: 'Days Data', value: allRecs.length, icon: 'calendar', accentFrom: '#14b8a6' });

  if (!hasData) {
    ['wrapAnalSales','wrapAnalMilk','wrapAnalQuality','wrapAnalVap'].forEach(id => showEmpty(id));
    ['chartAnalSales','chartAnalMilk','chartAnalQuality','chartAnalVap'].forEach(id => destroyChart(id));
    return;
  }
  ['wrapAnalSales','wrapAnalMilk','wrapAnalQuality','wrapAnalVap'].forEach(id => hideEmpty(id));

  const saleByMonth = monthData.map(m => sum(m.records, 'total_sale_value'));
  const volByMonth = monthData.map(m => sum(m.records, 'total_sale_volume'));
  const recvByMonth = monthData.map(m => sum(m.records, 'milk_received'));

  multiLineChart('chartAnalSales', labels, [
    { label: 'Sales (₹L)', data: saleByMonth, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', tension: 0.35, fill: true, pointRadius: 4, borderWidth: 2 },
    { label: 'Volume (KL)', data: volByMonth, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.06)', tension: 0.35, fill: true, pointRadius: 4, borderWidth: 2, borderDash: [5,5] }
  ], v => Math.round(v).toLocaleString());

  barChart('chartAnalMilk', labels, [
    { label: 'Milk Received (L)', data: recvByMonth, backgroundColor: '#3b82f6', borderRadius: 4 }
  ]);

  const fatByMonth = monthData.map(m => m.records.length ? +avg(m.records, 'fat_pct').toFixed(2) : null);
  const snfByMonth = monthData.map(m => m.records.length ? +avg(m.records, 'snf_pct').toFixed(2) : null);
  multiLineChart('chartAnalQuality', labels, [
    { label: 'Avg Fat %', data: fatByMonth, borderColor: '#f97316', tension: 0.3, pointRadius: 4, borderWidth: 2, fill: false },
    { label: 'Avg SNF %', data: snfByMonth, borderColor: '#a78bfa', tension: 0.3, pointRadius: 4, borderWidth: 2, borderDash: [5,5], fill: false }
  ], v => v ? v.toFixed(1) + '%' : '');

  const dahiByMonth = monthData.map(m => avg(m.records, 'dahi_sale'));
  const lassiByMonth = monthData.map(m => avg(m.records, 'lassi_sale'));
  multiLineChart('chartAnalVap', labels, [
    { label: 'Dahi (kg avg)', data: dahiByMonth, borderColor: '#ec4899', tension: 0.3, pointRadius: 4, borderWidth: 2, fill: false },
    { label: 'Lassi (L avg)', data: lassiByMonth, borderColor: '#f97316', tension: 0.3, pointRadius: 4, borderWidth: 2, fill: false }
  ], v => v ? v.toFixed(0) : '');
}
