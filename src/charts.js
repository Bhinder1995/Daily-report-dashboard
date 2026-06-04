/* ─── Chart.js Utilities ─── */

export let charts = {};

export function isDark() {
  return document.documentElement.getAttribute('data-theme') !== 'light';
}
export function gridColor() {
  return isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
}
export function tickColor() {
  return isDark() ? '#555c75' : '#9ca3af';
}

export function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

export function showEmpty(wrapId, msg) {
  const wrap = document.getElementById(wrapId); if (!wrap) return;
  const canvas = wrap.querySelector('canvas');
  if (canvas) canvas.style.display = 'none';
  let e = wrap.querySelector('.chart-empty');
  if (!e) {
    e = document.createElement('div');
    e.className = 'chart-empty';
    e.innerHTML = '<i class="ti ti-chart-bar-off"></i><span></span>';
    wrap.appendChild(e);
  }
  e.style.display = 'flex';
  e.querySelector('span').textContent = msg || 'No data yet. Add entries in Daily Entry.';
}
export function hideEmpty(wrapId) {
  const wrap = document.getElementById(wrapId); if (!wrap) return;
  const canvas = wrap.querySelector('canvas');
  if (canvas) canvas.style.display = 'block';
  const e = wrap.querySelector('.chart-empty');
  if (e) e.style.display = 'none';
}

function baseOpts(overrides = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark() ? '#1a1e2b' : '#fff',
        borderColor: isDark() ? '#2a2f42' : '#e2e5f0',
        borderWidth: 1,
        titleColor: isDark() ? '#f0f2f8' : '#111827',
        bodyColor: isDark() ? '#8b92ad' : '#6b7280',
        padding: 10,
        cornerRadius: 8,
      }
    },
    ...overrides
  };
}

function scaleOpts(xOverrides = {}, yOverrides = {}) {
  return {
    x: {
      ticks: { color: tickColor(), maxRotation: 45, autoSkip: true, font: { size: 11 } },
      grid: { display: false },
      ...xOverrides
    },
    y: {
      ticks: { color: tickColor(), font: { size: 11 } },
      grid: { color: gridColor() },
      ...yOverrides
    }
  };
}

// ── Line Chart ──
export function lineChart(id, labels, datasets, yCallback) {
  destroyChart(id);
  const ctx = document.getElementById(id)?.getContext('2d'); if (!ctx) return;
  charts[id] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: baseOpts({
      scales: scaleOpts({}, {
        ticks: { color: tickColor(), callback: yCallback, font: { size: 11 } },
        grid: { color: gridColor() }
      })
    })
  });
}

// ── Bar Chart ──
export function barChart(id, labels, datasets, xCallback, indexAxis = 'x') {
  destroyChart(id);
  const ctx = document.getElementById(id)?.getContext('2d'); if (!ctx) return;
  const isHoriz = indexAxis === 'y';
  const scls = isHoriz
    ? {
        x: { ticks: { color: tickColor(), callback: xCallback, font: { size: 11 } }, grid: { color: gridColor() } },
        y: { ticks: { color: tickColor(), font: { size: 11 } }, grid: { display: false } }
      }
    : scaleOpts({}, { ticks: { color: tickColor(), font: { size: 11 } }, grid: { color: gridColor() } });
  charts[id] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: baseOpts({ indexAxis, scales: scls })
  });
}

// ── Doughnut Chart ──
export function doughnutChart(id, labels, data, colors) {
  destroyChart(id);
  const ctx = document.getElementById(id)?.getContext('2d'); if (!ctx) return;
  charts[id] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data, backgroundColor: colors, borderWidth: 0,
        hoverOffset: 6, hoverBorderWidth: 2, hoverBorderColor: '#fff'
      }]
    },
    options: baseOpts({ cutout: '65%' })
  });
}

// ── Multi-line Chart ──
export function multiLineChart(id, labels, datasets, yCallback) {
  destroyChart(id);
  const ctx = document.getElementById(id)?.getContext('2d'); if (!ctx) return;
  charts[id] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: baseOpts({
      plugins: {
        legend: {
          display: true,
          labels: { color: tickColor(), font: { size: 11 }, padding: 16, boxWidth: 12, usePointStyle: true }
        },
        tooltip: {
          backgroundColor: isDark() ? '#1a1e2b' : '#fff',
          borderColor: isDark() ? '#2a2f42' : '#e2e5f0',
          borderWidth: 1,
          titleColor: isDark() ? '#f0f2f8' : '#111827',
          bodyColor: isDark() ? '#8b92ad' : '#6b7280',
          padding: 10, cornerRadius: 8
        }
      },
      scales: scaleOpts({}, { ticks: { color: tickColor(), callback: yCallback, font: { size: 11 } }, grid: { color: gridColor() } })
    })
  });
}

export function updateAllChartThemes() {
  Object.values(charts).forEach(c => {
    if (!c) return;
    if (c.options.scales) {
      Object.values(c.options.scales).forEach(s => {
        if (s.ticks) s.ticks.color = tickColor();
        if (s.grid) s.grid.color = s.grid.display === false ? 'transparent' : gridColor();
      });
    }
    if (c.options.plugins?.tooltip) {
      c.options.plugins.tooltip.backgroundColor = isDark() ? '#1a1e2b' : '#fff';
      c.options.plugins.tooltip.titleColor = isDark() ? '#f0f2f8' : '#111827';
      c.options.plugins.tooltip.bodyColor = isDark() ? '#8b92ad' : '#6b7280';
    }
    if (c.options.plugins?.legend?.labels) {
      c.options.plugins.legend.labels.color = tickColor();
    }
    c.update();
  });
}
