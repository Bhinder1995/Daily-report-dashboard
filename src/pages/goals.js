import { sum, fmt, getMTD, currentMonthName, getMonthKey, loadGoals, saveGoals } from '../data.js';
import { toast } from '../main.js';

export function renderGoals(records) {
  const monthKey = getMonthKey(new Date());
  const monthName = currentMonthName();

  const goalsMonthLabel = document.getElementById('goalsMonthLabel');
  const goalsSetMonthLabel = document.getElementById('goalsSetMonthLabel');
  if (goalsMonthLabel) goalsMonthLabel.textContent = '— ' + monthName;
  if (goalsSetMonthLabel) goalsSetMonthLabel.textContent = monthName;

  const goals = loadGoals();
  const curGoal = goals[monthKey] || {};

  const fields = ['SaleValue', 'Volume', 'MilkRecv', 'Margin'];
  fields.forEach(f => {
    const el = document.getElementById('g' + f);
    if (el) el.value = curGoal[f.toLowerCase()] || '';
  });

  const mtd = getMTD(records);
  const actSaleValue = sum(mtd, 'total_sale_value');
  const actVolume = sum(mtd, 'total_sale_volume');
  const actMilkRecv = Math.round(sum(mtd, 'milk_received') / 100000);
  const actMargin = 0;

  const targets = [
    { label: 'Sale Value (₹L)', key: 'salevalue', actual: actSaleValue, prefix: '₹', unit: 'L' },
    { label: 'Sale Volume (KL)', key: 'volume', actual: actVolume, prefix: '', unit: ' KL' },
    { label: 'Milk Received (Lakh L)', key: 'milkrecv', actual: actMilkRecv, prefix: '', unit: 'L L' },
    { label: 'Margin (₹ Lakh)', key: 'margin', actual: actMargin, prefix: '₹', unit: 'L' }
  ];

  const container = document.getElementById('goalsProgress');
  if (!container) return;

  if (targets.every(t => !curGoal[t.key])) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;height:200px;color:var(--text-3);text-align:center">
        <i class="ti ti-target-off" style="font-size:32px;opacity:0.4"></i>
        <span>No targets set for ${monthName}.<br>Fill the form on the left to set your goals!</span>
      </div>`;
    return;
  }

  container.innerHTML = targets.map(t => {
    const targetVal = parseFloat(curGoal[t.key]) || 0;
    if (!targetVal) return '';
    const pct = Math.round((t.actual / targetVal) * 100);
    const pctSafe = Math.min(pct, 100);
    const color = pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : 'var(--indigo)';
    return `
      <div class="goal-progress-item">
        <div class="goal-meta">
          <span>${t.label}</span>
          <span class="goal-pct" style="color:${color}">${pct}%</span>
        </div>
        <div class="progress-bar" style="margin-bottom:6px">
          <div class="progress-fill" style="width:${pctSafe}%;background:${color}"></div>
        </div>
        <div class="goal-meta" style="font-size:11px;color:var(--text-3)">
          <span>Actual: <strong>${t.prefix}${fmt(t.actual)}${t.unit}</strong></span>
          <span>Target: <strong>${t.prefix}${fmt(targetVal)}${t.unit}</strong></span>
        </div>
      </div>`;
  }).filter(Boolean).join('');
}

export function initGoals(onSave) {
  const saveBtn = document.getElementById('saveGoalsBtn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', () => {
    const monthKey = getMonthKey(new Date());
    const goals = loadGoals();

    goals[monthKey] = {
      salevalue: parseFloat(document.getElementById('gSaleValue').value) || 0,
      volume: parseFloat(document.getElementById('gVolume').value) || 0,
      milkrecv: parseFloat(document.getElementById('gMilkRecv').value) || 0,
      margin: parseFloat(document.getElementById('gMargin').value) || 0
    };

    saveGoals(goals);
    toast('Goals saved successfully!', 's');
    onSave();
  });
}
